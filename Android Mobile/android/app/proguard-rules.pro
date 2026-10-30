# PhotoStudio Manager release keep rules (R8).
# The app is a Capacitor WebView shell; the JS bridge and manifest-declared
# plugins/receivers must survive shrinking.

-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Capacitor bridge + plugins (reflected by name from JS).
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin interface *
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
}

# Any WebView JavaScript interface method.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# App entry points referenced from AndroidManifest.xml.
-keep class lk.photostudiomanager.** { *; }

# Manifest-declared receivers/services/providers from plugins.
-keep class com.capacitorjs.plugins.localnotifications.** { *; }
-keep class com.capacitorjs.plugins.filesystem.** { *; }
-keep class com.capacitorjs.plugins.share.** { *; }
-keep class com.capacitorjs.plugins.app.** { *; }

# Keep generic signatures/annotations used by plugin reflection.
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
