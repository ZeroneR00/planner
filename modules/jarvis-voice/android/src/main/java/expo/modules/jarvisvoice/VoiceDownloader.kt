package expo.modules.jarvisvoice

import android.os.SystemClock
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream
import java.io.BufferedInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

private const val READY = ".ready"
private const val PROGRESS_MS = 300L

/**
 * Скачивает голос в voices/<id>.tar.bz2.part и распаковывает в voices/<id>/.
 * Обрыв связи или перезапуск — кусок остаётся, следующая попытка докачивает его через Range:
 * expo-file-system продолжает только после своей паузы, поэтому качаем сами.
 */
class VoiceDownloader(
  private val voicesDir: File,
  private val emit: (String, Map<String, Any?>) -> Unit,
) {
  private val executor = Executors.newCachedThreadPool()

  // id → флаг отмены; запись есть — голос качается
  private val active = ConcurrentHashMap<String, AtomicBoolean>()

  fun voiceDir(id: String) = File(voicesDir, id)

  private fun partFile(id: String) = File(voicesDir, "$id.tar.bz2.part")

  private fun tmpDir(id: String) = File(voicesDir, "$id.tmp")

  fun isReady(id: String) = File(voiceDir(id), READY).isFile

  fun installed(): List<String> =
    voicesDir.listFiles()
      ?.filter { it.isDirectory && File(it, READY).isFile }
      ?.map { it.name }
      ?: emptyList()

  /** Не ждёт конца: прогресс, готовность и ошибка приходят событиями. Уже качается — ничего. */
  fun download(id: String, url: String) {
    if (isReady(id)) {
      emit("onReady", mapOf("id" to id))
      return
    }
    val cancel = AtomicBoolean(false)
    if (active.putIfAbsent(id, cancel) != null) return
    executor.execute {
      try {
        fetch(id, url, cancel)
        if (!cancel.get()) {
          unpack(id)
          emit("onReady", mapOf("id" to id))
        }
      } catch (e: Exception) {
        if (!cancel.get()) {
          emit("onFailed", mapOf("id" to id, "message" to (e.message ?: e.javaClass.simpleName)))
        }
      } finally {
        active.remove(id, cancel)
      }
    }
  }

  /** Остановить скачивание; кусок остаётся для докачки. */
  fun cancel(id: String) {
    active[id]?.set(true)
  }

  fun cancelAll() {
    active.values.forEach { it.set(true) }
  }

  fun remove(id: String) {
    cancel(id)
    voiceDir(id).deleteRecursively()
    tmpDir(id).deleteRecursively()
    partFile(id).delete()
  }

  private fun fetch(id: String, url: String, cancel: AtomicBoolean) {
    voicesDir.mkdirs()
    val part = partFile(id)
    var restarted = false
    while (true) {
      val have = if (part.isFile) part.length() else 0L
      val connection = (URL(url).openConnection() as HttpURLConnection).apply {
        connectTimeout = 15_000
        readTimeout = 30_000
        // архив и так сжат, а gzip сломал бы докачку по Range
        setRequestProperty("Accept-Encoding", "identity")
        if (have > 0) setRequestProperty("Range", "bytes=$have-")
      }
      try {
        val code = connection.responseCode
        if (code == 416) {
          // «bytes */<размер>»: кусок уже целый — осталось распаковать
          val size = connection.getHeaderField("Content-Range")?.substringAfter('/')?.toLongOrNull()
          if (size != null && size == have) return
          if (!restarted) {
            part.delete()
            restarted = true
            continue
          }
        }
        if (code != HttpURLConnection.HTTP_OK && code != HttpURLConnection.HTTP_PARTIAL) {
          throw IOException("HTTP $code")
        }
        // 200 — сервер отдал файл целиком, пишем с нуля
        val append = code == HttpURLConnection.HTTP_PARTIAL
        val start = if (append) have else 0L
        val length = connection.contentLengthLong
        val total = if (length > 0) start + length else -1L
        connection.inputStream.use { input ->
          FileOutputStream(part, append).use { output -> copy(id, input, output, start, total, cancel) }
        }
        if (cancel.get()) return
        if (total > 0 && part.length() != total) throw IOException("Связь оборвалась")
        return
      } finally {
        connection.disconnect()
      }
    }
  }

  private fun copy(
    id: String,
    input: InputStream,
    output: OutputStream,
    start: Long,
    total: Long,
    cancel: AtomicBoolean,
  ) {
    val buffer = ByteArray(64 * 1024)
    var received = start
    var last = SystemClock.elapsedRealtime()
    progress(id, received, total)
    while (!cancel.get()) {
      val n = input.read(buffer)
      if (n < 0) break
      output.write(buffer, 0, n)
      received += n
      val now = SystemClock.elapsedRealtime()
      if (now - last >= PROGRESS_MS) {
        last = now
        progress(id, received, total)
      }
    }
    if (!cancel.get()) progress(id, received, total)
  }

  private fun progress(id: String, received: Long, total: Long) {
    emit("onProgress", mapOf("id" to id, "received" to received.toDouble(), "total" to total.toDouble()))
  }

  private fun unpack(id: String) {
    val part = partFile(id)
    val tmp = tmpDir(id)
    val target = voiceDir(id)
    try {
      tmp.deleteRecursively()
      tmp.mkdirs()
      val tmpPath = tmp.canonicalPath
      val root = tmpPath + File.separator
      TarArchiveInputStream(BZip2CompressorInputStream(BufferedInputStream(FileInputStream(part)))).use { tar ->
        while (true) {
          val entry = tar.nextEntry ?: break
          val file = File(tmp, entry.name)
          val path = file.canonicalPath
          // защита от «../» в путях архива
          if (path != tmpPath && !path.startsWith(root)) throw IOException("Плохой путь в архиве: ${entry.name}")
          if (entry.isDirectory) {
            file.mkdirs()
          } else if (entry.isFile) {
            file.parentFile?.mkdirs()
            FileOutputStream(file).use { tar.copyTo(it) }
          }
        }
      }
      // имена файлов голоса не зашиваем: голос — папка, где лежит *.onnx
      val model = tmp.walkTopDown().firstOrNull { it.isFile && it.name.endsWith(".onnx") }
        ?: throw IOException("В архиве нет голоса")
      val folder = model.parentFile ?: throw IOException("В архиве нет голоса")
      target.deleteRecursively()
      if (!folder.renameTo(target)) throw IOException("Не удалось сохранить голос")
      File(target, READY).createNewFile()
      part.delete()
    } catch (e: Exception) {
      // битый архив сам не починится — следующая попытка качает заново
      part.delete()
      throw e
    } finally {
      tmp.deleteRecursively()
    }
  }
}
