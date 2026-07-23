# Keep default WebView JS interface behavior. Release isn't minified, so this is
# mostly a placeholder — add rules here if you enable minification later.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
