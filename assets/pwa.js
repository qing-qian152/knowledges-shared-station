/* 每日一学 · 把网页变成「像 App 一样」的包装层
   1) 注册 Service Worker（首次能离线打开）
   2) 安卓/桌面 Chrome 支持安装时，浮出一个「安装到桌面」按钮
   3) iPhone Safari 没有安装事件，给一次「添加到主屏幕」的提示
   全部逻辑都做了容错：file:// 直接打开、隐私模式、旧浏览器都不会报错。 */

(function () {
  'use strict';

  var HIDE_KEY = 'dl.installHidden';
  var IOS_KEY = 'dl.iosHintShown';
  var promoted = null;

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* file:// 或隐私模式下忽略 */ }
    return null;
  }

  function isStandalone() {
    try {
      return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
    } catch (e) {
      return false;
    }
  }

  function isLocalFile() {
    return location.protocol !== 'http:' && location.protocol !== 'https:';
  }

  /* ---------- 1. Service Worker ---------- */
  function registerSW() {
    if (isLocalFile()) return;               // 本地双击打开时不需要也无法注册
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function () {
      /* 注册失败不影响正常使用，只是少一层离线能力 */
    });
  }

  if (document.readyState === 'complete') registerSW();
  else window.addEventListener('load', registerSW);

  /* ---------- 2. 安装按钮 ---------- */
  function buildButton() {
    var btn = document.createElement('button');
    btn.className = 'pwa-install';
    btn.type = 'button';
    btn.innerHTML = '<span class="pwa-install-ico">⤓</span>安装到桌面';
    btn.addEventListener('click', function () {
      if (!promoted) return;
      var evt = promoted;
      promoted = null;
      btn.disabled = true;
      evt.prompt();
      if (evt.userChoice && evt.userChoice.then) {
        evt.userChoice.then(function (res) {
          if (res && res.outcome === 'accepted') {
            store(HIDE_KEY, '1');
            btn.remove();
          } else {
            btn.disabled = false;
            btn.classList.add('is-dim');
          }
        }).catch(function () { btn.remove(); });
      }
    });
    var close = document.createElement('span');
    close.className = 'pwa-install-x';
    close.textContent = '×';
    close.title = '不再提示';
    close.addEventListener('click', function (e) {
      e.stopPropagation();
      store(HIDE_KEY, '1');
      btn.remove();
    });
    btn.appendChild(close);
    document.body.appendChild(btn);
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    promoted = e;
    if (store(HIDE_KEY) === '1' || isStandalone()) return;
    if (document.querySelector('.pwa-install')) return;
    buildButton();
  });

  window.addEventListener('appinstalled', function () {
    store(HIDE_KEY, '1');
    var btn = document.querySelector('.pwa-install');
    if (btn) btn.remove();
  });

  /* ---------- 3. iOS 提示 ---------- */
  function iosHint() {
    if (isLocalFile() || isStandalone()) return;
    var ua = navigator.userAgent || '';
    var isIOS = /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isIOS) return;
    if (store(IOS_KEY) === '1') return;
    setTimeout(function () {
      var tip = document.createElement('div');
      tip.className = 'pwa-hint';
      tip.innerHTML = '想当 App 用？点底部的 <b>分享</b> 按钮，选「添加到主屏幕」即可。' +
        '<span class="pwa-hint-x" role="button" aria-label="关闭">知道了</span>';
      tip.querySelector('.pwa-hint-x').addEventListener('click', function () {
        store(IOS_KEY, '1');
        tip.remove();
      });
      document.body.appendChild(tip);
      store(IOS_KEY, '1');
    }, 2500);
  }

  window.addEventListener('load', iosHint);
})();
