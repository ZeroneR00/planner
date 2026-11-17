# sherpa-onnx из C++ ищет классы и поля конфигов по именам (JNI GetFieldID).
# R8 в релизной сборке их переименовывает → fid == null → падение при загрузке голоса.
-keep class com.k2fsa.sherpa.onnx.** { *; }
