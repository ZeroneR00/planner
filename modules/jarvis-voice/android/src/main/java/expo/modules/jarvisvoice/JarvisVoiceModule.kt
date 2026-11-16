package expo.modules.jarvisvoice

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

// Образцы для «Прослушать»: лежат в сборке, играют до скачивания голоса
private val SAMPLES = mapOf(
  "ruslan" to R.raw.jarvis_sample_ruslan,
  "dmitri" to R.raw.jarvis_sample_dmitri,
  "denis" to R.raw.jarvis_sample_denis,
  "irina" to R.raw.jarvis_sample_irina,
)

/** Свой голос Джарвиса: голоса Piper на устройстве, синтез sherpa-onnx без интернета. */
class JarvisVoiceModule : Module() {
  private val context by lazy {
    requireNotNull(appContext.reactContext) { "Нет контекста приложения" }.applicationContext
  }

  private val downloaderLazy = lazy {
    VoiceDownloader(File(context.filesDir, "voices")) { name, body ->
      runCatching { sendEvent(name, body) }
    }
  }
  private val downloader by downloaderLazy

  private val playerLazy = lazy { VoicePlayer(context) }
  private val player by playerLazy

  override fun definition() = ModuleDefinition {
    Name("JarvisVoice")

    Events("onProgress", "onReady", "onFailed")

    AsyncFunction<List<String>>("installed") {
      downloader.installed()
    }

    AsyncFunction("download") { id: String, url: String ->
      downloader.download(id, url)
    }

    Function("cancel") { id: String ->
      downloader.cancel(id)
    }

    AsyncFunction("remove") { id: String ->
      player.unload(id)
      downloader.remove(id)
    }

    AsyncFunction("load") { id: String, promise: Promise ->
      if (downloader.isReady(id)) {
        player.load(id, downloader.voiceDir(id)) { error ->
          if (error == null) promise.resolve() else promise.reject("ERR_JARVIS_VOICE", error.message, error)
        }
      } else {
        promise.reject("ERR_JARVIS_VOICE", "Голос $id не скачан", null)
      }
    }

    AsyncFunction("speak") { text: String, speed: Double, promise: Promise ->
      player.speak(text, speed.toFloat()) { summary, error ->
        if (error == null) promise.resolve(summary) else promise.reject("ERR_JARVIS_VOICE", error.message, error)
      }
    }

    Function<Unit>("stop") {
      player.stop()
    }

    AsyncFunction("playSample") { id: String ->
      val res = SAMPLES[id] ?: throw IllegalArgumentException("Нет образца голоса $id")
      player.playSample(res)
    }

    OnDestroy {
      if (downloaderLazy.isInitialized()) downloader.cancelAll()
      if (playerLazy.isInitialized()) player.release()
    }
  }
}
