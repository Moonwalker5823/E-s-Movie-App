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

    // Streaming host → its Android TV app package. When the WebView tries to open
    // one of these (e.g. a "Play on Hulu" tap), launch the installed native app —
    // where you're already signed in and DRM plays — instead of loading the site.
    private fun nativePackageFor(host: String): String? {
        val h = host.lowercase()
        return when {
            h.contains("hulu.com") -> "com.hulu.plus"
            h.contains("primevideo.com") -> "com.amazon.amazonvideo.livingroom"
            h.contains("netflix.com") -> "com.netflix.ninja"
            h.contains("disneyplus.com") -> "com.disney.disneyplus"
            h.contains("max.com") || h.contains("hbomax.com") -> "com.wbd.stream"
            h.contains("peacocktv.com") -> "com.peacocktv.peacockandroid"
            h.contains("paramountplus.com") -> "com.cbs.ott"
            h.contains("tubitv.com") -> "com.tubitv"
            h.contains("pluto.tv") -> "tv.pluto.android"
            h.contains("youtube.com") -> "com.google.android.youtube.tv"
            else -> null
        }
    }

    private inner class AppWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (!request.isForMainFrame) return false // let iframes (video players) load in-app
            val host = request.url.host ?: return false
            if (host.contains("erics-movies.vercel.app")) return false // our own app stays in the WebView
            val pkg = nativePackageFor(host) ?: return false
            return try {
                // Prefer opening the app AT the link (deep-link if it supports app-links)…
                val deep = Intent(Intent.ACTION_VIEW, request.url).setPackage(pkg)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                if (deep.resolveActivity(packageManager) != null) {
                    startActivity(deep)
                    return true
                }
                // …otherwise just open the app (you're already logged in there).
                val launch = packageManager.getLaunchIntentForPackage(pkg)
                if (launch != null) {
                    startActivity(launch)
                    return true
                }
                false // app not installed — fall back to loading the site in the WebView
            } catch (e: Exception) {
                false
            }
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
                    view.loadUrl(request.url.toString())
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
