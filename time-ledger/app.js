/* ===========================================================
   时迹 · 时间账本  —  app.js
   纯前端，无依赖，数据存 localStorage。
   =========================================================== */
(function () {
  'use strict';

  /* ------------------------- 基础工具 ------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function uid() { return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function byStart(a, b) { return a.start - b.start; }

  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function parseKey(k) {
    var p = String(k).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function addDays(k, n) {
    var d = parseKey(k);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  }
  function dayNum(k) {
    var d = parseKey(k);
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }
  function hhmm(ts) {
    var d = new Date(ts);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  /* 秒 -> 00:00 / 1:05:00 */
  function fmtClock(sec) {
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h > 0 ? h + ':' + pad2(m) + ':' + pad2(s) : pad2(m) + ':' + pad2(s);
  }
  /* 秒 -> 人话 */
  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return sec + ' 秒';
    var m = Math.round(sec / 60);
    if (m < 60) return m + ' 分';
    var h = Math.floor(m / 60), r = m % 60;
    return r ? h + ' 小时 ' + r + ' 分' : h + ' 小时';
  }
  function mins(sec) { return Math.round(sec / 60); }
  function weekOfYear(k) {
    var d = parseKey(k);
    var start = new Date(d.getFullYear(), 0, 1);
    var off = Math.floor((d - start) / 86400000);
    return Math.ceil((off + start.getDay() + 1) / 7);
  }
  var WEEK_CN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  /* ------------------------- 常量 ------------------------- */
  var KEY = 'shiji.ledger.v1';

  var PALETTE = ['#4F7A9B', '#6C8B6B', '#B4703F', '#8A6BA8', '#B0553F', '#5B7C8D', '#A8873C', '#7A8B4F'];

  var DEFAULT_CATS = [
    { name: '课本知识学习', emoji: '📚', target: 90, color: '#4F7A9B' },
    { name: '阅读书籍', emoji: '📖', target: 45, color: '#6C8B6B' },
    { name: '运动', emoji: '🏃', target: 40, color: '#B4703F' },
    { name: '信息获取', emoji: '📰', target: 30, color: '#8A6BA8' },
    { name: '课题推进', emoji: '🧪', target: 120, color: '#B0553F' },
    { name: 'AI 学习', emoji: '🤖', target: 45, color: '#5B7C8D' }
  ];

  var QUOTES = [
    { t: '逝者如斯夫，不舍昼夜。', a: '孔子《论语·子罕》' },
    { t: '一寸光阴一寸金，寸金难买寸光阴。', a: '《增广贤文》' },
    { t: '盛年不重来，一日难再晨。及时当勉励，岁月不待人。', a: '陶渊明《杂诗》' },
    { t: '莫等闲，白了少年头，空悲切。', a: '岳飞《满江红》' },
    { t: '少年易老学难成，一寸光阴不可轻。', a: '朱熹' },
    { t: '劝君莫惜金缕衣，劝君惜取少年时。', a: '杜秋娘《金缕衣》' },
    { t: '我生待明日，万事成蹉跎。', a: '钱福《明日歌》' },
    { t: '人生天地之间，若白驹之过隙，忽然而已。', a: '《庄子·知北游》' },
    { t: '东隅已逝，桑榆非晚。', a: '王勃《滕王阁序》' },
    { t: '花开堪折直须折，莫待无花空折枝。', a: '杜秋娘《金缕衣》' },
    { t: '天地者，万物之逆旅也；光阴者，百代之过客也。', a: '李白' },
    { t: '岁月不居，时节如流。', a: '孔融《论盛孝章书》' },
    { t: '天可补，海可填，南山可移。日月既往，不可复追。', a: '曾国藩' },
    { t: '春宵一刻值千金，花有清香月有阴。', a: '苏轼《春宵》' },
    { t: '一年之计在于春，一日之计在于晨。', a: '萧绎《纂要》' },
    { t: '少壮不努力，老大徒伤悲。', a: '《长歌行》' },
    { t: '光景不待人，须臾发成丝。', a: '李白' },
    { t: '逝川与流光，飘忽不相待。', a: '李白' },
    { t: '时间就像海绵里的水，只要愿挤，总还是有的。', a: '鲁迅' },
    { t: '浪费别人的时间，等于谋财害命。', a: '鲁迅' },
    { t: '节省时间，也就是使一个人的有限生命更加有效。', a: '鲁迅' },
    { t: '时间是由分秒积成的，善于利用零星时间的人，才会做出更大的成绩来。', a: '华罗庚' },
    { t: '合理安排时间，就等于节约时间。', a: '培根' },
    { t: '抛弃时间的人，时间也抛弃他。', a: '莎士比亚' },
    { t: '在时间的大钟上，只有两个字——现在。', a: '莎士比亚' },
    { t: '时间会刺破青春表面的彩饰。', a: '莎士比亚' },
    { t: '忘掉今天的人，将被明天忘掉。', a: '歌德' },
    { t: '时间是我的财产，我的田地是时间。', a: '歌德' },
    { t: '完成工作的方法，是爱惜每一分钟。', a: '达尔文' },
    { t: '时间最不偏私，给任何人都是二十四小时；时间也最偏私，给谁都不是二十四小时。', a: '赫胥黎' },
    { t: '世界上最快而又最慢、最长而又最短、最平凡而又最珍贵的，就是时间。', a: '高尔基' },
    { t: '把时间用在思考上，是最能节省时间的事情。', a: '卡曾斯' },
    { t: '谁对时间最吝啬，时间对谁就越慷慨。', a: '佚名' },
    { t: '时间是一条金河，莫让它从指尖悄悄溜过。', a: '佚名' },
    { t: 'Time is the coin of your life. Only you can determine how it will be spent.', a: 'Carl Sandburg' },
    { t: 'How we spend our days is, of course, how we spend our lives.', a: 'Annie Dillard' },
    { t: 'Lost time is never found again.', a: 'Benjamin Franklin' },
    { t: 'It is not that we have a short time to live, but that we waste much of it.', a: 'Seneca' },
    { t: 'While we are postponing, life speeds by.', a: 'Seneca' },
    { t: 'You do not rise to the level of your goals. You fall to the level of your systems.', a: 'James Clear' },
    { t: 'The key is not to prioritize what is on your schedule, but to schedule your priorities.', a: 'Stephen R. Covey' },
    { t: 'Either you run the day, or the day runs you.', a: 'Jim Rohn' },
    { t: 'Yesterday is history, tomorrow is a mystery, today is a gift.', a: '佚名' },
    { t: 'The best time to plant a tree was twenty years ago. The second best time is now.', a: '谚语' },
    { t: 'A year from now you may wish you had started today.', a: 'Karen Lamb' },
    { t: 'Things which matter most must never be at the mercy of things which matter least.', a: 'Goethe' },
    { t: 'If you love life, do not squander time, for that is the stuff life is made of.', a: 'Benjamin Franklin' },
    { t: '时间是一切财富中最宝贵的财富。', a: '德奥弗拉斯多' }
  ];

  /* 每日插画的配色（深色底，保证白字可读） */
  var ARTS = [
    ['#1e2b2e', '#2f4f4f', '#d8b26a'],
    ['#2a1f1a', '#4a2f22', '#d98e54'],
    ['#1b2430', '#2f4157', '#8fb8de'],
    ['#241f2b', '#3c3050', '#b39ddb'],
    ['#1e2a22', '#2f4636', '#a3c9a8'],
    ['#2b1f24', '#4a2a33', '#e2a9a2'],
    ['#22201b', '#3a352a', '#cdbb8a'],
    ['#1a2226', '#28383f', '#7fb3b8']
  ];

  /* ------------------------- 状态 ------------------------- */
  var S, saveT = 0;

  function freshCats() {
    return DEFAULT_CATS.map(function (c, i) {
      return { id: 'c' + (i + 1), name: c.name, emoji: c.emoji, target: c.target, color: c.color, archived: false, order: i };
    });
  }
  function fresh() {
    return {
      v: 1,
      cats: freshCats(),
      days: {},
      timer: null,
      settings: { overtime: false, sound: true, font: 'kai', theme: 'auto', quoteShift: 0 },
      ui: { cat: null, mode: 'down' }
    };
  }

  function normalize(o) {
    var s = (o && typeof o === 'object') ? o : {};
    if (!Array.isArray(s.cats) || !s.cats.length) s.cats = freshCats();
    s.cats = s.cats.map(function (c, i) {
      return {
        id: c.id || ('c' + i + uid()),
        name: String(c.name || '未命名').slice(0, 16),
        emoji: String(c.emoji || '🗂').slice(0, 4),
        target: clamp(parseInt(c.target, 10) || 0, 0, 720),
        color: c.color || PALETTE[i % PALETTE.length],
        archived: !!c.archived,
        order: typeof c.order === 'number' ? c.order : i
      };
    });
    s.days = (s.days && typeof s.days === 'object') ? s.days : {};
    Object.keys(s.days).forEach(function (k) {
      var d = s.days[k] || {};
      d.sessions = Array.isArray(d.sessions) ? d.sessions.filter(function (x) { return x && x.cat; }).map(function (x) {
        return {
          id: x.id || uid(),
          cat: x.cat,
          sec: Math.max(0, Math.round(+x.sec || 0)),
          start: +x.start || Date.now(),
          end: +x.end || (+x.start || Date.now()),
          mode: x.mode || 'down',
          note: String(x.note || '')
        };
      }) : [];
      d.targets = (d.targets && typeof d.targets === 'object') ? d.targets : {};
      d.note = typeof d.note === 'string' ? d.note : '';
      s.days[k] = d;
    });
    s.settings = Object.assign({ overtime: false, sound: true, font: 'kai', theme: 'auto', quoteShift: 0 }, s.settings || {});
    s.ui = Object.assign({ cat: null, mode: 'down' }, s.ui || {});
    s.timer = s.timer && s.timer.cat ? s.timer : null;
    return s;
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) return fresh();
    try { return normalize(JSON.parse(raw)); } catch (e) { return fresh(); }
  }

  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(flush, 150);
  }
  function flush() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast('保存失败：浏览器存储被禁用或已满'); }
  }

  /* ------------------------- 读写小工具 ------------------------- */
  function dGet(key) {
    if (!S.days[key]) S.days[key] = { sessions: [], targets: {}, note: '' };
    var d = S.days[key];
    if (!d.sessions) d.sessions = [];
    if (!d.targets) d.targets = {};
    if (typeof d.note !== 'string') d.note = '';
    return d;
  }
  function dPeek(key) {
    return S.days[key] || { sessions: [], targets: {}, note: '' };
  }
  function catById(id) {
    for (var i = 0; i < S.cats.length; i++) if (S.cats[i].id === id) return S.cats[i];
    return null;
  }
  function activeCats() {
    return S.cats.filter(function (c) { return !c.archived; })
      .sort(function (a, b) { return a.order - b.order; });
  }
  function targetMin(key, catId) {
    var d = dPeek(key);
    if (d.targets && typeof d.targets[catId] === 'number') return d.targets[catId];
    var c = catById(catId);
    return c ? c.target : 0;
  }
  function usedSec(key, catId) {
    return dPeek(key).sessions.reduce(function (a, s) { return s.cat === catId ? a + s.sec : a; }, 0);
  }
  function totalSec(key) {
    return dPeek(key).sessions.reduce(function (a, s) { return a + s.sec; }, 0);
  }
  function totalTargetSec(key) {
    return activeCats().reduce(function (a, c) { return a + targetMin(key, c.id) * 60; }, 0);
  }
  function completion(key) {
    var tt = 0, uu = 0;
    activeCats().forEach(function (c) {
      var t = targetMin(key, c.id) * 60;
      if (t <= 0) return;
      tt += t;
      uu += Math.min(t, usedSec(key, c.id));
    });
    return tt > 0 ? uu / tt : 0;
  }
  function todayKey() { return dateKey(new Date()); }

  function pushSession(key, data) {
    var d = dGet(key);
    d.sessions.push(Object.assign({ id: uid(), mode: 'down', note: '' }, data));
    d.sessions.sort(byStart);
  }
  function findSession(sid) {
    var keys = Object.keys(S.days);
    for (var i = 0; i < keys.length; i++) {
      var arr = S.days[keys[i]].sessions || [];
      for (var j = 0; j < arr.length; j++) if (arr[j].id === sid) return { s: arr[j], k: keys[i] };
    }
    return null;
  }

  /* ------------------------- 计时器 ------------------------- */
  function elapsedMs() {
    var t = S.timer;
    if (!t) return 0;
    return t.accMs + (t.running ? Math.max(0, Date.now() - t.resumedAt) : 0);
  }

  function startTimer(catId, mode) {
    if (!catById(catId)) return;
    if (S.timer) {
      if (S.timer.running && !confirm('还有一个计时正在进行，先结束并保存它吗？')) return;
      finishTimer(false);
    }
    var tgtMin = targetMin(todayKey(), catId);
    S.timer = {
      cat: catId,
      mode: mode || 'down',
      targetSec: (tgtMin > 0 ? tgtMin : 25) * 60,
      accMs: 0,
      running: true,
      resumedAt: Date.now(),
      lastBeat: Date.now(),
      startedAt: Date.now(),
      note: '',
      autoPaused: false,
      gapMs: 0
    };
    S.ui.cat = catId;
    S.ui.mode = mode || 'down';
    flush();
    renderAll();
    var n = $('#tNote');
    if (n) n.focus();
    ensureLoop();
  }

  function pauseTimer() {
    var t = S.timer;
    if (!t || !t.running) return;
    t.accMs = Math.max(0, elapsedMs());
    t.running = false;
    flush(); renderAll();
  }
  function resumeTimer() {
    var t = S.timer;
    if (!t || t.running) return;
    t.resumedAt = Date.now();
    t.lastBeat = Date.now();
    t.running = true;
    t.autoPaused = false;
    t.gapMs = 0;
    flush(); renderAll();
    ensureLoop();
  }
  /* 把离开的这段时间补上 */
  function absorbGap() {
    var t = S.timer;
    if (!t) return;
    var gap = Math.max(0, t.gapMs || (Date.now() - (t.pausedAt || Date.now())));
    t.accMs = Math.min(t.accMs + gap, 12 * 3600 * 1000);
    t.resumedAt = Date.now();
    t.lastBeat = Date.now();
    t.running = true;
    t.autoPaused = false;
    t.gapMs = 0;
    flush(); renderAll();
    ensureLoop();
  }

  function finishTimer(completed) {
    var t = S.timer;
    if (!t) return;
    var sec = Math.round(elapsedMs() / 1000);
    var startedAt = t.startedAt;
    var cat = t.cat, note = t.note, mode = t.mode;
    S.timer = null;
    if (sec >= 20) {
      pushSession(dateKey(new Date(startedAt)), {
        cat: cat, sec: sec, start: startedAt, end: startedAt + sec * 1000, mode: mode, note: note || ''
      });
      var c = catById(cat);
      toast((completed ? '目标达成 · ' : '已记录 ') + fmtDur(sec) + (c ? ' · ' + c.name : ''));
      if (completed) beep();
    } else {
      toast('不到 20 秒，这次没有计入');
    }
    flush();
    renderAll();
  }

  function discardTimer() {
    if (!S.timer) return;
    if (!confirm('放弃这段计时？已用时间不会保存。')) return;
    S.timer = null;
    flush(); renderAll();
  }

  var raf = null, lastPaint = 0;
  function ensureLoop() {
    if (raf == null && S.timer && S.timer.running) raf = requestAnimationFrame(onFrame);
  }
  function onFrame(ts) {
    raf = null;
    if (!S.timer || !S.timer.running) return;
    if (!lastPaint || ts - lastPaint > 120) { lastPaint = ts; paintDial(); }
    if (S.timer.running && !S.settings.overtime && elapsedMs() >= S.timer.targetSec * 1000) {
      finishTimer(true);
      return;
    }
    raf = requestAnimationFrame(onFrame);
  }

  function paintDial() {
    var t = S.timer;
    if (!t) return;
    var wrap = $('#dialWrap'), tEl = $('#dialTime'), sEl = $('#dialSub');
    if (!tEl) return;
    var ms = elapsedMs();
    var total = t.targetSec * 1000;
    var over = ms > total + 1000;
    var p = total > 0 ? clamp(ms / total * 100, 0, 100) : 0;
    wrap.style.setProperty('--p', p.toFixed(1));
    wrap.classList.toggle('over', over);
    var main;
    if (t.mode === 'down') main = fmtClock(Math.max(0, total - ms) / 1000);
    else main = fmtClock(ms / 1000);
    if (over && t.mode === 'down') main = '+' + fmtClock((ms - total) / 1000);
    tEl.textContent = main;
    var sub;
    if (t.mode === 'down') sub = '已用 ' + fmtClock(ms / 1000) + ' · 目标 ' + fmtDur(t.targetSec);
    else sub = '目标 ' + fmtDur(t.targetSec) + (over ? ' · 已超额 ' + fmtClock((ms - total) / 1000) : ' · 还差 ' + fmtClock((total - ms) / 1000));
    sEl.textContent = sub;
    var prefix = (t.mode === 'down' ? fmtClock(Math.max(0, total - ms) / 1000) : fmtClock(ms / 1000));
    if (S.timer.running) document.title = prefix + ' · ' + (catById(t.cat) ? catById(t.cat).name : '计时') + ' · 时迹';
    else if (document.title.indexOf(' 时迹') > -1) document.title = '时迹 · 我的时间账本';
  }

  /* ------------------------- 每日插画 ------------------------- */
  var artSeq = 0;
  function artSVG(kind, p) {
    var id = 'ag' + (++artSeq);
    var head = '<svg class="poster-svg" viewBox="0 0 800 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0.55" y2="1">' +
      '<stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="' + p[1] + '"/></linearGradient></defs>' +
      '<rect width="800" height="460" fill="url(#' + id + ')"/>';
    var body = '';
    if (kind === 0) {
      body = '<g fill="none" stroke="' + p[2] + '" stroke-width="2" opacity=".85">' +
        '<path d="M330 78 H470 V118 C470 176 404 200 404 230 C404 260 470 284 470 342 V382 H330 V342 C330 284 396 260 396 230 C396 200 330 176 330 118 Z"/></g>' +
        '<path d="M352 352 H448 C448 314 418 288 400 262 C382 288 352 314 352 352 Z" fill="' + p[2] + '" opacity=".55"/>' +
        '<path d="M400 104 C420 130 442 158 448 180 C420 188 380 188 352 180 C358 158 380 130 400 104 Z" fill="' + p[2] + '" opacity=".28"/>' +
        '<g stroke="' + p[2] + '" stroke-width="1" opacity=".22"><path d="M0 230 H300"/><path d="M500 230 H800"/><path d="M0 96 H300"/><path d="M500 96 H800"/></g>';
    } else if (kind === 1) {
      body = '<circle cx="400" cy="300" r="152" fill="' + p[2] + '" opacity=".14"/>' +
        '<circle cx="400" cy="300" r="96" fill="' + p[2] + '" opacity=".9"/>' +
        '<g stroke="' + p[2] + '" stroke-width="1.2" opacity=".38"><path d="M0 300 H800"/><path d="M0 340 H800"/><path d="M0 380 H800"/><path d="M0 420 H800"/></g>' +
        '<g stroke="' + p[2] + '" stroke-width="1" opacity=".2" fill="none"><circle cx="400" cy="300" r="196"/><circle cx="400" cy="300" r="236"/></g>';
    } else if (kind === 2) {
      body = '<path d="M0 460 L210 210 L360 400 L470 262 L680 460 Z" fill="' + p[2] + '" opacity=".18"/>' +
        '<path d="M0 460 L300 300 L470 460 Z" fill="' + p[2] + '" opacity=".3"/>' +
        '<path d="M520 460 L650 320 L800 460 Z" fill="' + p[2] + '" opacity=".24"/>' +
        '<circle cx="620" cy="150" r="62" fill="' + p[2] + '" opacity=".55"/>' +
        '<g stroke="' + p[2] + '" stroke-width="1" opacity=".2"><path d="M0 200 H300"/><path d="M520 250 H800"/></g>';
    } else if (kind === 3) {
      body = '<g fill="none" stroke="' + p[2] + '" stroke-width="1.4">';
      for (var i = 1; i <= 7; i++) body += '<circle cx="400" cy="250" r="' + (i * 46) + '" opacity="' + (0.42 - i * 0.045).toFixed(3) + '"/>';
      body += '</g><circle cx="400" cy="250" r="16" fill="' + p[2] + '" opacity=".85"/>';
    } else if (kind === 4) {
      body = '<g fill="' + p[2] + '">';
      var hs = [70, 120, 92, 170, 140, 220, 190, 260, 210, 300, 240, 180, 150, 110, 80, 60];
      for (var j = 0; j < hs.length; j++) {
        body += '<rect x="' + (40 + j * 47) + '" y="' + (400 - hs[j]) + '" width="20" height="' + hs[j] + '" opacity="' + (0.12 + (hs[j] / 300) * 0.5).toFixed(3) + '" rx="3"/>';
      }
      body += '</g>' + '<path d="M0 400 H800" stroke="' + p[2] + '" stroke-width="1.5" opacity=".55"/>';
    } else {
      body = '<g stroke="' + p[2] + '" stroke-width="1" opacity=".22">';
      for (var a = 1; a <= 9; a++) body += '<path d="M0 ' + (a * 46) + ' H800"/>';
      for (var b = 1; b <= 15; b++) body += '<path d="M' + (b * 50) + ' 0 V460"/>';
      body += '</g><circle cx="400" cy="230" r="118" fill="none" stroke="' + p[2] + '" stroke-width="2" opacity=".7"/>' +
        '<path d="M400 112 A118 118 0 0 1 518 230 L400 230 Z" fill="' + p[2] + '" opacity=".3"/>';
    }
    return head + body + '</svg>';
  }

  /* ------------------------- 渲染：顶部日期 ------------------------- */
  function renderHero() {
    var key = todayKey(), d = parseKey(key);
    var tt = totalTargetSec(key), uu = totalSec(key);
    var pct = tt > 0 ? Math.round(uu / tt * 100) : (uu > 0 ? 100 : 0);
    var left = Math.max(0, tt - uu);
    var done = activeCats().filter(function (c) {
      var t = targetMin(key, c.id) * 60;
      return t > 0 && usedSec(key, c.id) >= t;
    }).length;
    var n = activeCats().length;

    $('#heroCard').innerHTML =
      '<div>' +
      '<p class="eyebrow">' + WEEK_CN[d.getDay()] + ' · 第 ' + weekOfYear(key) + ' 周</p>' +
      '<h1 class="hero-date">' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日<small>' + d.getFullYear() + '</small></h1>' +
      '<p class="hero-sub">今日已投入 <b>' + fmtDur(uu) + '</b> · 目标 <b>' + fmtDur(tt) + '</b>' +
      (left > 0 ? ' · 还差 <b>' + fmtDur(left) + '</b>' : ' · <b>已超额</b>') + '</p>' +
      '<div class="hero-tags">' +
      '<span class="tag">' + done + ' / ' + n + ' 类达标</span>' +
      '<span class="tag">' + (S.timer ? '计时中' : '未开始计时') + '</span>' +
      (S.settings.overtime ? '<span class="tag">超额继续</span>' : '') +
      '</div></div>' +
      '<div class="ring" id="ring" style="--p:' + clamp(pct, 0, 100) + '">' +
      '<div class="ring-mid"><b>' + pct + '%</b><span>完成度</span></div></div>';

    document.title = S.timer
      ? document.title
      : (d.getMonth() + 1) + '/' + d.getDate() + ' · 时迹';
  }

  /* ------------------------- 渲染：每日海报 ------------------------- */
  function renderPoster() {
    var key = todayKey(), dn = dayNum(key);
    var qi = ((dn + (S.settings.quoteShift || 0)) % QUOTES.length + QUOTES.length) % QUOTES.length;
    var q = QUOTES[qi];
    var kind = ((dn % 6) + 6) % 6;
    var pal = ARTS[((dn % ARTS.length) + ARTS.length) % ARTS.length];
    var d = parseKey(key);
    $('#poster').innerHTML = artSVG(kind, pal) +
      '<div class="poster-body">' +
      '<blockquote>' + esc(q.t) + '</blockquote>' +
      '<cite>— ' + esc(q.a) + '</cite>' +
      '<div class="poster-foot"><span>' + d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()) +
      ' · ' + WEEK_CN[d.getDay()] + '</span><button data-act="reshuffle" type="button">换一条</button></div>' +
      '</div>';
  }

  /* ------------------------- 渲染：计时面板 ------------------------- */
  function chipHTML(c) {
    return '<button type="button" class="chip' + (c.id === S.ui.cat ? ' on' : '') + '" data-act="pick" data-id="' + c.id + '" style="--c:' + c.color + '">' +
      '<span>' + esc(c.emoji) + '</span>' + esc(c.name) + '</button>';
  }

  function renderTimer() {
    var el = $('#timerPanel');
    var cats = activeCats();
    var t = S.timer;

    if (!t) {
      if (cats.length && !cats.some(function (c) { return c.id === S.ui.cat; })) S.ui.cat = cats[0].id;
      if (!cats.length) {
        el.innerHTML = '<header class="panel-head"><h2>计时</h2></header>' +
          '<p class="empty-note">还没有时间类型。先点右上角「＋新类型」建立你的第一类。</p>';
        return;
      }
      var sel = catById(S.ui.cat);
      var tm = targetMin(todayKey(), S.ui.cat);
      el.innerHTML =
        '<header class="panel-head"><h2>计时</h2><span class="panel-head-right hint">同一时间只记一件事</span></header>' +
        '<div class="chips">' + cats.map(chipHTML).join('') + '</div>' +
        '<div class="mode">' +
        '<button type="button" class="seg' + (S.ui.mode === 'down' ? ' on' : '') + '" data-act="mode" data-mode="down">倒计时</button>' +
        '<button type="button" class="seg' + (S.ui.mode === 'up' ? ' on' : '') + '" data-act="mode" data-mode="up">正计时</button>' +
        '<span class="mode-hint">' + (S.ui.mode === 'down' ? '从目标往下走' : '从零往上，到目标结束') + '</span>' +
        '</div>' +
        '<div class="dial idle" id="dialWrap" style="--c:' + (sel ? sel.color : 'var(--accent)') + ';--p:0">' +
        '<div class="dial-in"><b id="dialTime">' + (S.ui.mode === 'down' ? fmtClock(tm * 60) : '00:00') + '</b>' +
        '<span id="dialSub">目标 ' + fmtDur(tm * 60) + '</span></div></div>' +
        '<button type="button" class="primary big" data-act="start">开始计时</button>';
      return;
    }

    var c = catById(t.cat) || { name: '已删除的类型', emoji: '🗂', color: 'var(--accent)' };
    var resumeBox = '';
    if (t.autoPaused) {
      var gap = Math.max(0, t.gapMs || 0);
      resumeBox = '<div class="resume">上次计时的页面被关掉或长时间休眠，已经<b>暂停</b>在这里（离开约 ' + fmtDur(gap / 1000) + '）。这段时间要算进去吗？' +
        '<div class="resume-row">' +
        '<button type="button" data-act="resume">不算，继续计时</button>' +
        '<button type="button" data-act="absorb">算进去</button>' +
        '<button type="button" data-act="finish">就到这里，保存</button>' +
        '</div></div>';
    }
    el.innerHTML =
      '<header class="panel-head"><h2>' + (t.running ? '计时中' : '已暂停') + '</h2>' +
      '<span class="panel-head-right hint">' + esc(c.emoji) + ' ' + esc(c.name) + '</span></header>' +
      '<div class="dial' + (t.running ? '' : ' paused') + '" id="dialWrap" style="--c:' + c.color + ';--p:0">' +
      '<div class="dial-in"><b id="dialTime">--:--</b><span id="dialSub"></span></div></div>' +
      '<div class="timer-note"><input id="tNote" type="text" maxlength="80" value="' + esc(t.note) + '" placeholder="这一段时间在做什么？（会存成今天的记录）"></div>' +
      '<div class="timer-btns">' +
      (t.running
        ? '<button type="button" class="primary" data-act="pause">暂停</button>'
        : '<button type="button" class="primary ok" data-act="resume">继续</button>') +
      '<button type="button" class="ghost-btn" data-act="finish">结束并保存</button>' +
      '<button type="button" class="ghost-btn danger" data-act="discard">放弃</button>' +
      '</div>' + resumeBox;
    paintDial();
  }

  /* ------------------------- 渲染：今日分配 ------------------------- */
  function renderBoard() {
    var el = $('#board'), key = todayKey();
    var cats = activeCats();
    var hint = $('#boardHint');
    if (hint) hint.textContent = '目标合计 ' + fmtDur(totalTargetSec(key));
    if (!cats.length) {
      el.innerHTML = '<p class="empty-note">还没有时间类型。</p>';
      return;
    }
    el.innerHTML = cats.map(function (c) {
      var tgt = targetMin(key, c.id) * 60;
      var used = usedSec(key, c.id);
      var p = tgt > 0 ? clamp(used / tgt * 100, 0, 100) : (used > 0 ? 100 : 0);
      var done = tgt > 0 && used >= tgt;
      var list = dPeek(key).sessions.filter(function (s) { return s.cat === c.id; }).sort(byStart);
      var h = '<div class="cat" style="--c:' + c.color + '">' +
        '<div class="cat-head">' +
        '<span class="cat-emoji">' + esc(c.emoji) + '</span>' +
        '<span class="cat-name">' + esc(c.name) + '</span>' +
        '<span class="cat-time' + (done ? ' done' : '') + '">' + mins(used) + ' <i>/ ' + mins(tgt) + ' 分</i></span>' +
        '<button type="button" class="cat-more" data-act="edit-cat" data-id="' + c.id + '" title="编辑类型">⋯</button>' +
        '</div>' +
        '<div class="bar"><i style="width:' + p.toFixed(1) + '%"></i></div>' +
        '<div class="cat-actions">' +
        '<button type="button" class="mini-btn solid" data-act="start-cat" data-mode="down" data-id="' + c.id + '">倒计时</button>' +
        '<button type="button" class="mini-btn" data-act="start-cat" data-mode="up" data-id="' + c.id + '">正计时</button>' +
        '<button type="button" class="mini-btn" data-act="manual" data-id="' + c.id + '">补记</button>' +
        '<button type="button" class="mini-btn" data-act="goal" data-id="' + c.id + '">改目标</button>' +
        '</div>';
      if (list.length) {
        h += '<ul class="sessions">' + list.map(function (s) {
          return '<li>' +
            '<time>' + hhmm(s.start) + '–' + hhmm(s.end) + '</time>' +
            '<span class="dur">' + mins(s.sec) + '′</span>' +
            '<input id="n_' + s.id + '" data-note="' + s.id + '" maxlength="120" value="' + esc(s.note) + '" placeholder="这一段做了什么？" />' +
            '<button type="button" class="x" data-act="del-session" data-id="' + s.id + '" title="删除这条">×</button>' +
            '</li>';
        }).join('') + '</ul>';
      } else {
        h += '<p class="empty-note">今天还没有记录。开个计时，或者补记一段。</p>';
      }
      return h + '</div>';
    }).join('');
  }

  /* ------------------------- 渲染：统计 ------------------------- */
  function renderStats() {
    var key = todayKey();
    var days = [], i;
    for (i = 6; i >= 0; i--) days.push(addDays(key, -i));
    var cats = S.cats.filter(function (c) {
      if (!c.archived) return true;
      return days.some(function (k) { return usedSec(k, c.id) > 0; });
    }).sort(function (a, b) { return a.order - b.order; });

    var maxV = 60 * 30;
    days.forEach(function (k) { maxV = Math.max(maxV, totalSec(k)); });
    maxV = Math.max(maxV, totalTargetSec(key));

    var bars = days.map(function (k) {
      var tot = totalSec(k);
      var h = Math.max(tot > 0 ? 3 : 1, tot / maxV * 100);
      var segs = cats.map(function (c) {
        var v = usedSec(k, c.id);
        if (v <= 0) return '';
        return '<i class="seg2" style="flex:' + v + ' 1 0;background:' + c.color + '"></i>';
      }).join('');
      var d = parseKey(k);
      return '<div class="day' + (k === key ? ' today' : '') + '" title="' + k + ' · ' + fmtDur(tot) + '">' +
        '<div class="stackwrap"><div class="stack" style="height:' + h.toFixed(1) + '%">' + segs + '</div></div>' +
        '<span class="lbl">' + (k === key ? '今天' : (d.getMonth() + 1) + '/' + d.getDate()) + '</span></div>';
    }).join('');

    var legend = cats.map(function (c) {
      return '<span><i style="background:' + c.color + '"></i>' + esc(c.name) + '</span>';
    }).join('');

    var week = days.reduce(function (acc, k) {
      cats.forEach(function (c) { acc[c.id] = (acc[c.id] || 0) + usedSec(k, c.id); });
      return acc;
    }, {});
    var wMax = 1;
    Object.keys(week).forEach(function (id) { wMax = Math.max(wMax, week[id]); });
    var rows = cats.map(function (c) {
      var v = week[c.id] || 0;
      if (v <= 0) return '';
      return '<div class="week-row"><span class="n">' + esc(c.emoji) + ' ' + esc(c.name) + '</span>' +
        '<span class="track"><i style="width:' + (v / wMax * 100).toFixed(1) + '%;background:' + c.color + '"></i></span>' +
        '<span class="v">' + fmtDur(v) + '</span></div>';
    }).join('');

    var weekTotal = days.reduce(function (a, k) { return a + totalSec(k); }, 0);
    var weekAvg = Math.round(weekTotal / 7);

    $('#statsPanel').innerHTML =
      '<header class="panel-head"><h2>最近七天</h2><span class="panel-head-right hint">合计 ' + fmtDur(weekTotal) + ' · 日均 ' + fmtDur(weekAvg) + '</span></header>' +
      '<div class="bars">' + bars + '</div>' +
      '<div class="legend">' + legend + '</div>' +
      '<div class="week-list">' + rows + '</div>';
  }

  /* ------------------------- 渲染：节奏 ------------------------- */
  function isGoodDay(k) {
    return completion(k) >= 0.8 && totalTargetSec(k) > 0;
  }
  function renderRhythm() {
    var key = todayKey();
    var streak = 0, k = isGoodDay(key) ? key : addDays(key, -1);
    while (streak < 366 && isGoodDay(k)) { streak++; k = addDays(k, -1); }
    var wkStart = addDays(key, -(parseKey(key).getDay() + 6) % 7);
    var wkSum = 0, cnt = 0;
    for (var i = 0; i < 7; i++) {
      var kk = addDays(wkStart, i);
      if (kk > key) break;
      wkSum += totalSec(kk); cnt++;
    }
    var best = null, bestV = 0;
    activeCats().forEach(function (c) {
      var v = 0;
      for (var j = 0; j < 7; j++) v += usedSec(addDays(key, -j), c.id);
      if (v > bestV) { bestV = v; best = c; }
    });
    var tt = totalSec(key);
    var infoUsed = 0;
    activeCats().forEach(function (c) {
      if (/信息|资讯|刷|社交/.test(c.name)) infoUsed += usedSec(key, c.id);
    });
    var tips = [];
    if (tt > 0 && infoUsed / tt > 0.25) tips.push('今天「信息获取」占了 ' + Math.round(infoUsed / tt * 100) + '%，输入偏重，可以给它设个硬上限。');
    if (best) tips.push('近七天投入最多的是「' + best.name + '」，共 ' + fmtDur(bestV) + '。');
    if (!tips.length) tips.push('还没有足够的数据。先记三天，趋势才有意义。');

    $('#rhythmPanel').innerHTML =
      '<header class="panel-head"><h2>节奏</h2></header>' +
      '<div class="kv">' +
      '<div><b>' + streak + '</b><span>连续达标</span></div>' +
      '<div><b>' + fmtDur(wkSum).replace(/ /g, '') + '</b><span>本周投入</span></div>' +
      '<div><b>' + Math.round(completion(key) * 100) + '%</b><span>今日完成</span></div>' +
      '</div>' +
      '<p class="tip">' + tips.map(esc).join('<br>') + '</p>';
  }

  /* ------------------------- 渲染：手记 ------------------------- */
  function renderJournal() {
    var key = todayKey();
    var d = dPeek(key);
    var last = addDays(key, -1);
    var lastNote = dPeek(last).note;
    $('#journalPanel').innerHTML =
      '<header class="panel-head"><h2>今日手记</h2><span class="panel-head-right hint">' + fmtDur(totalSec(key)) + ' · ' + d.sessions.length + ' 条记录</span></header>' +
      '<textarea id="dayNote" placeholder="今天最值得记住的一句是什么？哪段时间花得最值，哪段是漏掉的？">' + esc(d.note || '') + '</textarea>' +
      '<div class="journal-foot">' +
      '<span>自动保存</span>' +
      (lastNote ? '<span>昨天：' + esc(lastNote.slice(0, 40)) + (lastNote.length > 40 ? '…' : '') + '</span>' : '') +
      '</div>';
  }

  /* ------------------------- 弹窗 ------------------------- */
  var draft = { color: '#4F7A9B' };

  function openModal(html) {
    var m = $('#modal');
    m.innerHTML = '<div class="modal-inner">' + html + '</div>';
    if (!m.open) m.showModal();
  }
  function closeModal() {
    var m = $('#modal');
    if (m.open) m.close();
  }
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function beep() {
    if (!S.settings.sound) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ac = new AC(), o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(760, ac.currentTime);
      o.frequency.setValueAtTime(1140, ac.currentTime + 0.14);
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.07, ac.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.7);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.75);
      setTimeout(function () { try { ac.close(); } catch (e) {} }, 1000);
    } catch (e) {}
  }

  function openCatEditor(id) {
    var c = id ? catById(id) : null;
    draft.color = c ? c.color : PALETTE[S.cats.length % PALETTE.length];
    var sw = PALETTE.map(function (col) {
      return '<button type="button" class="swatch' + (col === draft.color ? ' on' : '') + '" data-act="swatch" data-v="' + col + '" style="background:' + col + '"></button>';
    }).join('');
    var archived = S.cats.filter(function (x) { return x.archived; });
    var archHtml = archived.length
      ? '<h4>已归档</h4><ul class="cat-list">' + archived.map(function (x) {
          return '<li>' + esc(x.emoji) + ' ' + esc(x.name) + '<button type="button" data-act="restore-cat" data-id="' + x.id + '">恢复</button></li>';
        }).join('') + '</ul>'
      : '';

    openModal(
      '<h3>' + (c ? '编辑时间类型' : '新增时间类型') + '</h3>' +
      '<p class="sub">类型是账本的基本单位。目标时长随时能改，历史记录不受影响。</p>' +
      '<div class="field-row">' +
      '<div class="field"><label>名称</label><input id="fName" type="text" maxlength="12" value="' + esc(c ? c.name : '') + '" placeholder="例如：写作"></div>' +
      '<div class="field"><label>图标</label><input id="fEmoji" type="text" maxlength="4" value="' + esc(c ? c.emoji : '🗂') + '" placeholder="一个 emoji"></div>' +
      '</div>' +
      '<div class="field"><label>每日目标（分钟，0 表示不设目标）</label><input id="fTarget" type="number" min="0" max="720" step="5" value="' + (c ? c.target : 60) + '"></div>' +
      '<div class="field"><label>颜色</label><div class="swatches" id="swWrap">' + sw + '</div></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="primary" data-act="save-cat" data-id="' + (c ? c.id : '') + '">保存</button>' +
      (c && !c.archived ? '<button type="button" class="ghost-btn danger" data-act="del-cat" data-id="' + c.id + '">删除</button>' : '') +
      '<button type="button" class="ghost-btn" data-act="close">取消</button>' +
      '</div>' +
      '<p class="modal-note">删除时如果这个类型已经有记录，会保留历史并归档，不会把旧数据删掉。</p>' +
      archHtml
    );
  }

  function openGoalEditor(id) {
    var c = catById(id);
    if (!c) return;
    var cur = targetMin(todayKey(), id);
    openModal(
      '<h3>调整今日目标</h3>' +
      '<p class="sub">' + esc(c.emoji) + ' ' + esc(c.name) + ' · 只改今天这一个类型。</p>' +
      '<div class="field"><label>今天的目标（分钟）</label><input id="gMin" type="number" min="0" max="720" step="5" value="' + cur + '"></div>' +
      '<p class="modal-note">想把新目标变成以后每天默认？勾上下面这个。</p>' +
      '<div class="field"><label><input id="gDef" type="checkbox" checked style="width:auto;margin-right:6px">同时设为以后的默认目标</label></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="primary" data-act="save-goal" data-id="' + id + '">保存</button>' +
      '<button type="button" class="ghost-btn" data-act="close">取消</button>' +
      '</div>'
    );
  }

  function openManual(id) {
    var cats = activeCats();
    if (!cats.length) { toast('先加一个时间类型'); return; }
    var now = new Date();
    var hm = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
    openModal(
      '<h3>补记一段时间</h3>' +
      '<p class="sub">忘了按开始的时候用。这段会算进当天的统计。</p>' +
      '<div class="field"><label>类型</label><select id="mCat">' +
      cats.map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === id ? ' selected' : '') + '>' + esc(c.emoji) + ' ' + esc(c.name) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field-row">' +
      '<div class="field"><label>日期</label><input id="mDate" type="date" value="' + todayKey() + '" max="' + todayKey() + '"></div>' +
      '<div class="field"><label>开始时间</label><input id="mTime" type="time" value="' + hm + '"></div>' +
      '</div>' +
      '<div class="field"><label>时长（分钟）</label><input id="mMin" type="number" min="1" max="720" step="5" value="30"></div>' +
      '<div class="field"><label>做了什么</label><input id="mNote" type="text" maxlength="120" placeholder="例如：第三章 + 课后题 1–5"></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="primary" data-act="save-manual">记下来</button>' +
      '<button type="button" class="ghost-btn" data-act="close">取消</button>' +
      '</div>'
    );
  }

  function openData() {
    var bytes = 0;
    try { bytes = (localStorage.getItem(KEY) || '').length * 2; } catch (e) {}
    var size = bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
    var total = 0;
    Object.keys(S.days).forEach(function (k) { total += (S.days[k].sessions || []).length; });
    openModal(
      '<h3>数据与备份</h3>' +
      '<p class="sub">全部数据都在这个浏览器里。换设备、清缓存、换浏览器都会丢，所以定期导出。</p>' +
      '<div class="field-row"><div class="field"><label>已记录</label><input type="text" value="' + total + ' 条 · ' + size + '" readonly></div>' +
      '<div class="field"><label>覆盖天数</label><input type="text" value="' + Object.keys(S.days).length + ' 天" readonly></div></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="primary" data-act="export-json">导出备份（.json）</button>' +
      '<button type="button" class="ghost-btn" data-act="export-csv">导出表格（.csv）</button>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="ghost-btn" data-act="import-json">从备份导入</button>' +
      '<button type="button" class="ghost-btn" data-act="clear-day">清空今天</button>' +
      '<button type="button" class="ghost-btn danger" data-act="clear-all">清空全部</button>' +
      '</div>' +
      '<input id="fileIn" type="file" accept="application/json,.json" style="display:none">' +
      '<p class="modal-note">导出的 JSON 可以在任何设备上导入；CSV 用来放进 Excel 或做图。</p>'
    );
  }

  function openHelp() {
    openModal(
      '<h3>怎么用</h3>' +
      '<p class="sub">一分钟看懂，然后就不用再看了。</p>' +
      '<div class="doc">' +
      '<h4>1 · 记录</h4>' +
      '<ul>' +
      '<li>左边选一个类型，点「开始计时」。<b>倒计时</b>是从目标时间往下走；<b>正计时</b>是从零往上走，到目标时长自动停。</li>' +
      '<li>计时中可以随时「暂停 / 继续」，关掉网页也不丢——重新打开会问你离开的这段时间算不算。</li>' +
      '<li>忘了按开始就用「补记」，填开始时间和时长。</li>' +
      '<li>每条记录后面那行字就是你的日记：写清这段到底做了什么，比只记时长有用十倍。</li>' +
      '</ul>' +
      '<h4>2 · 分配</h4>' +
      '<ul>' +
      '<li>每个类型有「今日目标」，点「改目标」可以只改今天，也可以设成默认。</li>' +
      '<li>「＋ 新类型」随时加，「⋯」里可以改名、改色、删（有记录的会自动归档，历史不丢）。</li>' +
      '</ul>' +
      '<h4>3 · 数据</h4>' +
      '<ul>' +
      '<li>全部存在本机浏览器，不上传。建议每周导出一次 JSON 备份。</li>' +
      '<li>换电脑 / 手机：导出后在新设备点「从备份导入」。</li>' +
      '</ul>' +
      '<h4>偏好</h4>' +
      '<div class="field-row">' +
      '<div class="field"><label>引文字体</label><select id="setFont">' +
      '<option value="kai"' + (S.settings.font === 'kai' ? ' selected' : '') + '>楷体（稳重）</option>' +
      '<option value="lishu"' + (S.settings.font === 'lishu' ? ' selected' : '') + '>隶书（古雅）</option>' +
      '<option value="shu"' + (S.settings.font === 'shu' ? ' selected' : '') + '>行楷（手写感）</option>' +
      '<option value="song"' + (S.settings.font === 'song' ? ' selected' : '') + '>宋体（清瘦）</option>' +
      '</select></div>' +
      '<div class="field"><label>到点之后</label><select id="setOver">' +
      '<option value="0"' + (!S.settings.overtime ? ' selected' : '') + '>自动结束</option>' +
      '<option value="1"' + (S.settings.overtime ? ' selected' : '') + '>继续累计（显示超额）</option>' +
      '</select></div>' +
      '</div>' +
      '<div class="field"><label><input id="setSound" type="checkbox"' + (S.settings.sound ? ' checked' : '') + ' style="width:auto;margin-right:6px">到点提示音</label></div>' +
      '<div class="modal-actions"><button type="button" class="primary" data-act="save-pref">保存偏好</button>' +
      '<button type="button" class="ghost-btn" data-act="close">关闭</button></div>' +
      '</div>'
    );
  }

  /* ------------------------- 渲染总入口 ------------------------- */
  function renderAll() {
    var a = document.activeElement, snap = null;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.id) {
      snap = { id: a.id, s: a.selectionStart, e: a.selectionEnd };
    }
    renderHero();
    renderPoster();
    renderTimer();
    renderBoard();
    renderStats();
    renderRhythm();
    renderJournal();
    if (snap) {
      var el = document.getElementById(snap.id);
      if (el) {
        el.focus();
        try { el.setSelectionRange(snap.s, snap.e); } catch (err) {}
      }
    }
    if (S.timer) ensureLoop();
  }

  /* ------------------------- 导出 / 导入 ------------------------- */
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 600);
  }
  function exportJSON() {
    download('时迹备份-' + todayKey() + '.json', JSON.stringify(S, null, 2), 'application/json');
    toast('备份已导出');
  }
  function exportCSV() {
    var rows = [['日期', '开始', '结束', '时长(分钟)', '类型', '备注']];
    Object.keys(S.days).sort().forEach(function (k) {
      (S.days[k].sessions || []).slice().sort(byStart).forEach(function (s) {
        var c = catById(s.cat);
        rows.push([k, hhmm(s.start), hhmm(s.end), (s.sec / 60).toFixed(1), c ? c.name : '(已删除)', s.note || '']);
      });
    });
    var csv = rows.map(function (r) {
      return r.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\r\n');
    download('时迹记录-' + todayKey() + '.csv', '\ufeff' + csv, 'text/csv;charset=utf-8');
    toast('表格已导出');
  }
  function importJSON(file) {
    var fr = new FileReader();
    fr.onload = function () {
      var obj;
      try { obj = JSON.parse(String(fr.result)); } catch (e) { alert('这个文件不是有效的 JSON。'); return; }
      if (!obj || !Array.isArray(obj.cats)) { alert('这不像时迹的备份文件。'); return; }
      if (!confirm('导入会覆盖当前全部数据，确定继续？（建议先导出一份当前的）')) return;
      S = normalize(obj);
      applyPrefs();
      flush(); closeModal(); renderAll();
      toast('导入完成');
    };
    fr.readAsText(file);
  }

  /* ------------------------- 偏好 ------------------------- */
  function applyPrefs() {
    var t = S.settings.theme;
    var dark = t === 'dark' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-q', S.settings.font || 'kai');
  }

  /* ------------------------- 事件 ------------------------- */
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b) return;
    var act = b.getAttribute('data-act');
    var id = b.getAttribute('data-id');

    switch (act) {
      case 'pick':
        S.ui.cat = id; save(); renderTimer();
        break;
      case 'mode':
        S.ui.mode = b.getAttribute('data-mode'); save(); renderTimer();
        break;
      case 'start':
        if (S.ui.cat) startTimer(S.ui.cat, S.ui.mode);
        else toast('先加一个时间类型');
        break;
      case 'start-cat':
        startTimer(id, b.getAttribute('data-mode') || 'down');
        break;
      case 'pause': pauseTimer(); break;
      case 'resume': resumeTimer(); break;
      case 'absorb': absorbGap(); break;
      case 'finish': finishTimer(false); break;
      case 'discard': discardTimer(); break;
      case 'manual': openManual(id); break;
      case 'goal': openGoalEditor(id); break;
      case 'edit-cat': openCatEditor(id); break;
      case 'add-cat': openCatEditor(''); break;
      case 'swatch':
        draft.color = b.getAttribute('data-v');
        Array.prototype.forEach.call(document.querySelectorAll('.swatch'), function (s) { s.classList.remove('on'); });
        b.classList.add('on');
        break;
      case 'save-cat': saveCatEditor(id); break;
      case 'save-goal': saveGoal(id); break;
      case 'save-manual': saveManual(); break;
      case 'del-cat': deleteCat(id); break;
      case 'restore-cat':
        var c0 = catById(id);
        if (c0) { c0.archived = false; flush(); closeModal(); renderAll(); toast('已恢复「' + c0.name + '」'); }
        break;
      case 'del-session':
        var f = findSession(id);
        if (f && confirm('删掉这条记录？')) {
          var arr = S.days[f.k].sessions;
          arr.splice(arr.indexOf(f.s), 1);
          flush(); renderAll();
        }
        break;
      case 'reshuffle':
        S.settings.quoteShift = (S.settings.quoteShift || 0) + 1;
        flush(); renderPoster();
        break;
      case 'close': closeModal(); break;
      case 'export-json': exportJSON(); break;
      case 'export-csv': exportCSV(); break;
      case 'import-json':
        var inp = $('#fileIn');
        if (inp) { inp.value = ''; inp.click(); }
        break;
      case 'clear-day':
        if (confirm('清空今天的全部记录？')) {
          var k0 = todayKey();
          if (S.days[k0]) { S.days[k0].sessions = []; S.days[k0].note = ''; }
          flush(); closeModal(); renderAll();
          toast('今天已清空');
        }
        break;
      case 'clear-all':
        if (confirm('清空全部数据？这个操作无法恢复。') && confirm('再确认一次：所有历史记录都会消失。')) {
          S = fresh(); applyPrefs(); flush(); closeModal(); renderAll();
          toast('已重置');
        }
        break;
      case 'save-pref': {
        var fEl = $('#setFont'), oEl = $('#setOver'), sEl = $('#setSound');
        if (fEl) S.settings.font = fEl.value;
        if (oEl) S.settings.overtime = oEl.value === '1';
        if (sEl) S.settings.sound = !!sEl.checked;
        applyPrefs(); flush(); closeModal(); renderAll();
        toast('偏好已保存');
        break;
      }
    }
  }

  function saveCatEditor(id) {
    var name = ($('#fName').value || '').trim().slice(0, 12) || '未命名';
    var emoji = ($('#fEmoji').value || '').trim().slice(0, 4) || '🗂';
    var target = clamp(parseInt($('#fTarget').value, 10) || 0, 0, 720);
    var c = id ? catById(id) : null;
    if (c) {
      c.name = name; c.emoji = emoji; c.target = target; c.color = draft.color;
    } else {
      var maxOrder = S.cats.reduce(function (a, x) { return Math.max(a, x.order); }, 0);
      c = { id: 'c' + uid(), name: name, emoji: emoji, target: target, color: draft.color, archived: false, order: maxOrder + 1 };
      S.cats.push(c);
    }
    /* 今天的这个类型同步用新目标 */
    dGet(todayKey()).targets[c.id] = target;
    flush(); closeModal(); renderAll();
    toast(id ? '已更新' : '已新增「' + name + '」');
  }

  function saveGoal(id) {
    var v = clamp(parseInt($('#gMin').value, 10) || 0, 0, 720);
    var asDefault = $('#gDef') ? $('#gDef').checked : false;
    dGet(todayKey()).targets[id] = v;
    if (asDefault) {
      var c = catById(id);
      if (c) c.target = v;
    }
    flush(); closeModal(); renderAll();
    toast('今日目标 ' + fmtDur(v * 60));
  }

  function saveManual() {
    var cat = $('#mCat') ? $('#mCat').value : null;
    var dateStr = $('#mDate') ? $('#mDate').value : todayKey();
    var timeStr = $('#mTime') ? $('#mTime').value : '20:00';
    var m = clamp(parseInt($('#mMin').value, 10) || 30, 1, 720);
    var note = $('#mNote') ? $('#mNote').value.trim() : '';
    if (!cat || !dateStr) { toast('信息不完整'); return; }
    var parts = dateStr.split('-'), tp = (timeStr || '20:00').split(':');
    var start = new Date(+parts[0], +parts[1] - 1, +parts[2], +tp[0] || 20, +tp[1] || 0).getTime();
    pushSession(dateStr, { cat: cat, sec: m * 60, start: start, end: start + m * 60000, mode: 'manual', note: note, manual: true });
    flush(); closeModal(); renderAll();
    toast('已补记 ' + fmtDur(m * 60));
  }

  function deleteCat(id) {
    var c = catById(id);
    if (!c) return;
    var has = Object.keys(S.days).some(function (k) { return usedSec(k, id) > 0; });
    if (has) {
      if (!confirm('「' + c.name + '」已经有过记录，删除后会保留历史并隐藏它。继续吗？')) return;
      c.archived = true;
    } else {
      if (!confirm('删除「' + c.name + '」？')) return;
      S.cats = S.cats.filter(function (x) { return x.id !== id; });
    }
    if (S.ui.cat === id) S.ui.cat = null;
    if (S.timer && S.timer.cat === id) S.timer = null;
    flush(); closeModal(); renderAll();
    toast('已删除');
  }

  function onInput(e) {
    var el = e.target;
    if (el.id === 'dayNote') {
      dGet(todayKey()).note = el.value;
      save();
    } else if (el.id === 'tNote' && S.timer) {
      S.timer.note = el.value;
      save();
    } else if (el.getAttribute && el.getAttribute('data-note')) {
      var f = findSession(el.getAttribute('data-note'));
      if (f) { f.s.note = el.value; save(); }
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.code === 'Space' && !e.target.matches('input, textarea, select, button')) {
      if (!$('#modal').open && S.timer) {
        e.preventDefault();
        S.timer.running ? pauseTimer() : resumeTimer();
      }
    }
  }

  /* 页面隐藏 / 关闭时，把进度记账 + 打时间戳 */
  function beat() {
    if (S.timer && S.timer.running) {
      S.timer.lastBeat = Date.now();
      flush();
    }
  }

  /* 重新打开时判断：上次是否被中断 */
  function reconcile() {
    var t = S.timer;
    if (!t) return;
    if (!t.running) return;
    var beatTs = t.lastBeat || Date.now();
    var gap = Date.now() - beatTs;
    if (gap > 90 * 1000) {
      t.accMs = Math.max(0, t.accMs + Math.max(0, beatTs - t.resumedAt));
      t.running = false;
      t.autoPaused = true;
      t.gapMs = gap;
      t.pausedAt = beatTs;
      flush();
    }
  }

  /* ------------------------- 启动 ------------------------- */
  function boot() {
    S = load();
    applyPrefs();
    reconcile();
    renderAll();

    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKey);

    $('#btnAddCat').addEventListener('click', function () { openCatEditor(''); });
    $('#btnHelp').addEventListener('click', openHelp);
    $('#btnData').addEventListener('click', openData);
    $('#btnTheme').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      S.settings.theme = cur === 'dark' ? 'light' : 'dark';
      applyPrefs(); flush();
    });

    var modal = $('#modal');
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    modal.addEventListener('change', function (e) {
      if (e.target && e.target.id === 'fileIn' && e.target.files && e.target.files[0]) {
        importJSON(e.target.files[0]);
      }
    });

    ['visibilitychange', 'pagehide', 'beforeunload'].forEach(function (ev) {
      window.addEventListener(ev, beat);
    });
    /* 后台时降低心跳频率，但仍定期落盘 */
    setInterval(beat, 5000);

    /* 顶栏时钟 */
    var clock = $('#nowClock');
    function tickClock() {
      var n = new Date();
      clock.innerHTML = '<b>' + pad2(n.getHours()) + ':' + pad2(n.getMinutes()) + ':' + pad2(n.getSeconds()) + '</b><span>' +
        WEEK_CN[n.getDay()] + ' · 第 ' + weekOfYear(dateKey(n)) + ' 周</span>';
    }
    tickClock();
    setInterval(tickClock, 1000);

    /* 跨零点：自动切到新的一天 */
    var curDay = todayKey();
    setInterval(function () {
      var k = todayKey();
      if (k !== curDay) {
        curDay = k;
        if (S.timer) finishTimer(false);
        renderAll();
        toast('新的一天，目标已刷新');
      }
    }, 30000);

    if (S.timer && S.timer.autoPaused) {
      toast('上次计时被中断，已帮你暂停');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
