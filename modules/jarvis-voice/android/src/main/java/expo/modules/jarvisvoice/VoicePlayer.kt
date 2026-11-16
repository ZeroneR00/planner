package expo.modules.jarvisvoice

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.media.MediaPlayer
import android.os.Build
import android.os.SystemClock
import com.k2fsa.sherpa.onnx.OfflineTts
import com.k2fsa.sherpa.onnx.OfflineTtsConfig
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsVitsModelConfig
import java.io.File
import java.util.concurrent.Executors

/**
 * Речь своим голосом (sherpa-onnx → AudioTrack) и образцы для «Прослушать» (MediaPlayer).
 * Движок живёт только на одном потоке executor: загрузка не может освободить его посреди фразы.
 */
class VoicePlayer(private val context: Context) {
  private val executor = Executors.newSingleThreadExecutor()
  private val lock = Any()

  // Номер фразы: stop() и новая фраза его меняют, и старая фраза видит, что её оборвали
  @Volatile private var generation = 0

  // под lock
  private var track: AudioTrack? = null
  private var sample: MediaPlayer? = null

  // только на executor
  private var tts: OfflineTts? = null
  private var loadedId: String? = null

  private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  // Громкость медиа, как у прежнего голоса телефона
  private val attributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_MEDIA)
    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
    .build()

  fun load(id: String, dir: File, done: (Throwable?) -> Unit) {
    executor.execute {
      try {
        if (loadedId != id) {
          val model = dir.listFiles()?.firstOrNull { it.isFile && it.name.endsWith(".onnx") }
            ?: throw IllegalStateException("Голос $id не найден")
          val config = OfflineTtsConfig(
            model = OfflineTtsModelConfig(
              vits = OfflineTtsVitsModelConfig(
                model = model.absolutePath,
                tokens = File(dir, "tokens.txt").absolutePath,
                dataDir = File(dir, "espeak-ng-data").absolutePath,
                lengthScale = 1.0f,
              ),
              numThreads = 2,
              provider = "cpu",
            ),
            maxNumSentences = 1,
          )
          val next = OfflineTts(assetManager = null, config = config)
          tts?.release()
          tts = next
          loadedId = id
        }
        done(null)
      } catch (e: Throwable) {
        // Throwable, а не Exception: без .so прилетает UnsatisfiedLinkError — тогда отвечает голос телефона
        done(e)
      }
    }
  }

  /** Освободить движок, если загружен этот голос. */
  fun unload(id: String) {
    executor.execute {
      if (loadedId == id) {
        tts?.release()
        tts = null
        loadedId = null
      }
    }
  }

  /**
   * Оборвать прошлое и сказать. done — когда договорил или оборвали (со сводкой для консоли dev),
   * ошибка — если не смог.
   */
  fun speak(text: String, speed: Float, done: (String?, Throwable?) -> Unit) {
    stop()
    val mine = generation
    executor.execute {
      try {
        val summary = if (mine == generation) say(text, speed, mine) else "оборвали до начала"
        done(summary, null)
      } catch (e: Throwable) {
        done(null, e)
      }
    }
  }

  private fun say(text: String, speed: Float, mine: Int): String {
    val engine = tts ?: throw IllegalStateException("Голос не загружен")
    val started = SystemClock.elapsedRealtime()
    // Фраза целиком, а не кусками через generateWithCallback: движок ищет у обратного вызова
    // метод invoke([F)Ljava/lang/Integer;, а лямбды Kotlin 2 (invokedynamic) его не создают —
    // в отладочной сборке CheckJNI на этом роняет приложение. Ответы короткие — задержки не слышно
    val audio = engine.generate(text, sid = 0, speed = speed)
    val samples = audio.samples
    val synthMs = SystemClock.elapsedRealtime() - started
    if (mine != generation) return "оборвали во время синтеза"
    if (samples.isEmpty()) return "движок вернул пустой звук"
    val rate = audio.sampleRate
    val min = AudioTrack.getMinBufferSize(rate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_FLOAT)
    // Четверть секунды запаса от рывков. Размер — целое число кадров (4 байта на float, моно),
    // иначе AudioTrack бросает «Invalid audio buffer size» (так и было: 22050 байт)
    val frameBytes = Float.SIZE_BYTES
    val bytes = (maxOf(min, rate / 4 * frameBytes) + frameBytes - 1) / frameBytes * frameBytes
    val out = AudioTrack.Builder()
      .setAudioAttributes(attributes)
      .setAudioFormat(
        AudioFormat.Builder()
          .setEncoding(AudioFormat.ENCODING_PCM_FLOAT)
          .setSampleRate(rate)
          .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
          .build(),
      )
      .setTransferMode(AudioTrack.MODE_STREAM)
      .setBufferSizeInBytes(bytes)
      .build()
    synchronized(lock) {
      if (mine != generation) {
        out.release()
        return "оборвали до звука"
      }
      track = out
    }
    val buffer = out.bufferSizeInFrames
    val focus = requestFocus()
    var written = 0
    var padded = 0
    var head = 0
    val playStarted = SystemClock.elapsedRealtime()
    try {
      out.play()
      written = write(out, samples, mine)
      // Тишина длиной в буфер: короткая фраза меньше буфера иначе может так и не начаться
      if (mine == generation && written == samples.size) padded = write(out, FloatArray(buffer), mine)
      // Ждём, пока динамик доиграет сам звук: запись возвращается, когда данные ушли в буфер,
      // а не прозвучали, и release() сразу после неё обрывал фразу через секунду
      val deadline = playStarted + samples.size * 1000L / rate + 2000
      while (mine == generation && SystemClock.elapsedRealtime() < deadline) {
        head = out.playbackHeadPosition
        if (head >= samples.size) break
        Thread.sleep(20)
      }
    } finally {
      synchronized(lock) {
        if (track === out) track = null
        out.release()
      }
      abandonFocus(focus)
    }
    val playMs = SystemClock.elapsedRealtime() - playStarted
    return "звук ${samples.size * 1000L / rate} мс ($rate Гц), синтез $synthMs мс, буфер $buffer, " +
      "записано $written/${samples.size} + тишина $padded, доиграно $head, играл $playMs мс, " +
      "фокус ${if (focus != null) "есть" else "нет"}, ${if (mine == generation) "до конца" else "оборвали"}"
  }

  /** Сколько записано; отрицательное — код ошибки AudioTrack. */
  private fun write(out: AudioTrack, samples: FloatArray, mine: Int): Int {
    var offset = 0
    while (offset < samples.size && mine == generation) {
      // pause() из stop() прерывает ждущую запись — тогда вернётся меньше, и цикл увидит новый номер
      val n = out.write(samples, offset, samples.size - offset, AudioTrack.WRITE_BLOCKING)
      if (n < 0) return n
      if (n == 0) break
      offset += n
    }
    return offset
  }

  // Фокус на время фразы, как у голоса Google: музыка приглушается, а система не глушит нас.
  // Не дали (звонок) — всё равно говорим, как раньше
  private fun requestFocus(): AudioFocusRequest? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return null
    val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
      .setAudioAttributes(attributes)
      .build()
    val granted = audioManager.requestAudioFocus(request) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
    return if (granted) request else null
  }

  private fun abandonFocus(request: AudioFocusRequest?) {
    if (request != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      audioManager.abandonAudioFocusRequest(request)
    }
  }

  fun playSample(resId: Int) {
    stop()
    val mine = generation
    val player = MediaPlayer.create(context, resId, attributes, audioManager.generateAudioSessionId()) ?: return
    synchronized(lock) {
      if (mine != generation) {
        player.release()
        return
      }
      sample = player
      player.setOnCompletionListener { finished ->
        synchronized(lock) {
          if (sample === finished) sample = null
        }
        finished.release()
      }
      player.start()
    }
  }

  /** Замолчать сразу: и речь, и образец. */
  fun stop() {
    synchronized(lock) {
      generation++
      track?.let {
        runCatching {
          it.pause()
          it.flush()
        }
      }
      sample?.let {
        runCatching { it.stop() }
        it.release()
      }
      sample = null
    }
  }

  fun release() {
    stop()
    executor.execute {
      tts?.release()
      tts = null
      loadedId = null
    }
    executor.shutdown()
  }
}
