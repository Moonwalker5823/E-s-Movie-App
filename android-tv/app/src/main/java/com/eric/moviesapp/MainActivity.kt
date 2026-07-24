package com.eric.moviesapp

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Message
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

/**
 * Full-screen WebView wrapper that turns the deployed web app into an installable
 * Google TV / Android TV app.
 *
 * Why this works on Google TV:
 *  - The LEANBACK_LAUNCHER intent-filter (in the manifest) puts it on the TV home row.
 *  - D-pad navigation is handled by the web app itself (arrow keys + Enter), which the
 *    WebView forwards to the page.
 *  - domStorage + persistent cookies keep your favorites, settings AND streaming logins,
 *    so a title opens ready to play instead of asking you to sign in again.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private var customView: View? = null
    private var customCallback: WebChromeClient.CustomViewCallback? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        web = WebView(this)
        setContentView(web)

        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true // favorites / settings persist
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportMultipleWindows(true) // capture target="_blank" (see onCreateWindow)
            // Let the app (HTTPS) reach the local Philips Hue bridge (HTTP) for lighting.
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // Persist login cookies across launches so streaming sign-ins stick.
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(web, true)
        }

        web.webViewClient = AppWebViewClient() // hand paid services off to their native app
        web.webChromeClient = ChromeClient() // fullscreen video + new-window handling

        web.loadUrl(getString(R.string.web_url))

        // TV/phone Back button → step back through web history, else exit the app.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    customView != null -> web.webChromeClient?.onHideCustomView()
                    web.canGoBack() -> web.goBack()
                    else -> finish()
                }
            }
        })
    }

    override fun onPause() {
        super.onPause()
        CookieManager.getInstance().flush() // write cookies to disk
    }

    // Streaming host → candidate Android app packages (TV variant first, phone
    // fallback — package names differ across devices, e.g. Hulu is
    // com.hulu.livingroomplus on Google TV but com.hulu.plus on phones). When the
    // WebView tries to open one of these (a "Play on Hulu" tap), we launch the
    // installed native app — where you're already signed in and DRM plays — instead
    // of loading the un-signable website.
    private fun nativePackagesFor(host: String): List<String> {
        val h = host.lowercase()
        return when {
            h.contains("hulu.com") -> listOf("com.hulu.livingroomplus", "com.hulu.plus")
            h.contains("primevideo.com") || h.contains("amazon.com") ->
                listOf("com.amazon.amazonvideo.livingroom", "com.amazon.avod.thirdpartyclient")
            h.contains("netflix.com") -> listOf("com.netflix.ninja")
            h.contains("disneyplus.com") -> listOf("com.disney.disneyplus")
            h.contains("max.com") || h.contains("hbomax.com") -> listOf("com.wbd.stream")
            h.contains("peacocktv.com") -> listOf("com.peacocktv.peacockandroid")
            h.contains("paramountplus.com") -> listOf("com.cbs.ott")
            h.contains("tubitv.com") -> listOf("com.tubitv")
            h.contains("pluto.tv") -> listOf("tv.pluto.android")
            h.contains("tidal.com") -> listOf("com.aspiro.tidal")
            h.contains("music.youtube.com") ->
                listOf("com.google.android.youtube.tvmusic", "com.google.android.apps.youtube.music")
            h.contains("youtube.com") -> listOf("com.google.android.youtube.tv")
            else -> emptyList()
        }
    }

    // Open the first installed candidate app — deep-linked to the URL when the app
    // claims it, otherwise just launched (you're already signed in). Returns true if
    // one opened, false if none are installed (caller falls back to the website).
    private fun openNativeApp(packages: List<String>, url: android.net.Uri): Boolean {
        for (pkg in packages) {
            try {
                val deep = Intent(Intent.ACTION_VIEW, url).setPackage(pkg)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                if (deep.resolveActivity(packageManager) != null) {
                    startActivity(deep)
                    return true
                }
                val launch = packageManager.getLaunchIntentForPackage(pkg)
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(launch)
                    return true
                }
            } catch (_: Exception) {
                // try the next candidate package
            }
        }
        return false
    }

    // Launch a non-http(s) URL (intent:// deep link or a custom app scheme such as
    // amazonvideo:// / hulu://) as an Android Intent. A WebView CAN'T load these, so
    // without this an "Open in app" button throws a net::ERR_UNKNOWN_URL_SCHEME error
    // page. Always returns true so the WebView never tries to load the scheme itself.
    private fun openExternalScheme(url: String): Boolean {
        try {
            val intent = if (url.startsWith("intent:"))
                Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
            else Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
                startActivity(intent)
            } catch (_: android.content.ActivityNotFoundException) {
                // intent:// URLs can carry a web fallback (usually the app's site).
                val fallback = intent.getStringExtra("browser_fallback_url")
                if (fallback != null) web.loadUrl(fallback)
            }
        } catch (_: Exception) {
            // malformed URL — swallow rather than error the WebView
        }
        return true
    }

    private inner class AppWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val url = request.url
            val scheme = url.scheme?.lowercase()
            // Non-web schemes (intent://, market://, hulu://, amazonvideo://, …) can't
            // load in a WebView — launch them as an Intent so app deep-links work.
            if (scheme != null && scheme != "http" && scheme != "https") {
                return openExternalScheme(url.toString())
            }
            if (!request.isForMainFrame) return false // let iframes (video players) load in-app
            val host = url.host ?: return false
            if (host.contains("erics-movies.vercel.app")) return false // our own app stays in the WebView
            val pkgs = nativePackagesFor(host)
            if (pkgs.isEmpty()) return false
            return openNativeApp(pkgs, url) // false → app not installed, fall back to the site
        }
    }

    private inner class ChromeClient : WebChromeClient() {

        // Links with target="_blank" (Play / Launch tiles) → load in the SAME WebView
        // so the session (and your login) carries over.
        override fun onCreateWindow(
            view: WebView,
            isDialog: Boolean,
            isUserGesture: Boolean,
            resultMsg: Message
        ): Boolean {
            val transport = resultMsg.obj as WebView.WebViewTransport
            val temp = WebView(this@MainActivity)
            temp.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(v: WebView, request: WebResourceRequest): Boolean {
                    val host = request.url.host
                    val pkgs = if (host != null) nativePackagesFor(host) else emptyList()
                    // target="_blank" "Play" links → hand off to the native app first…
                    if (pkgs.isNotEmpty() && openNativeApp(pkgs, request.url)) return true
                    view.loadUrl(request.url.toString()) // …else load in the main WebView
                    return true
                }
            }
            transport.webView = temp
            resultMsg.sendToTarget()
            return true
        }

        // HTML5 fullscreen (video players) support.
        override fun onShowCustomView(view: View, callback: CustomViewCallback) {
            if (customView != null) {
                callback.onCustomViewHidden()
                return
            }
            customView = view
            customCallback = callback
            (window.decorView as FrameLayout).addView(view, FrameLayout.LayoutParams(-1, -1))
            web.visibility = View.GONE
        }

        override fun onHideCustomView() {
            val v = customView ?: return
            (window.decorView as FrameLayout).removeView(v)
            customView = null
            web.visibility = View.VISIBLE
            customCallback?.onCustomViewHidden()
            customCallback = null
        }
    }
}
