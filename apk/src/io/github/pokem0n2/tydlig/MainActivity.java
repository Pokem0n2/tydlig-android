package io.github.pokem0n2.tydlig;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setCacheMode(WebSettings.LOAD_NO_CACHE);
        ws.setTextZoom(100);
        ws.setSupportZoom(false);
        ws.setDisplayZoomControls(false);
        ws.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(new Bridge(), "Android");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("file:///android_asset/tydlig.html");
        setContentView(webView);
    }

    /**
     * 返回键优先交给页面处理（关闭面板/取消待定状态），
     * 页面返回 false 才退出应用。
     */
    @Override
    public void onBackPressed() {
        final String req = "window.__tydligBack ? window.__tydligBack() : false";
        webView.evaluateJavascript(req, new android.webkit.ValueCallback<String>() {
            @Override
            public void onReceiveValue(String result) {
                if (!"true".equals(result)) {
                    finish();
                }
            }
        });
    }

    /** 提供给页面 JS 的原生能力：系统分享、Toast。 */
    private class Bridge {
        @JavascriptInterface
        public void share(String text) {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_TEXT, text);
            startActivity(Intent.createChooser(send, "分享 xCalc 数据"));
        }

        @JavascriptInterface
        public void toast(final String msg) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
}
