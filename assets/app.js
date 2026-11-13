/* 每日一学 —— 应用逻辑
   纯静态、零依赖：数据以 <script> 注入，file:// 下可直接双击打开。
   本地存储：进度 / 笔记 / 作答 / 错题本 / 打卡。 */

(() => {
  'use strict';

  const SECTIONS = [
    { id: 'chinese',   name: '晨读', icon: '🌿', kicker: '01 · 语文晨读' },
    { id: 'poem',      name: '古文', icon: '📜', kicker: '02 · 古诗文' },
    { id: 'english',   name: '英文', icon: '🔤', kicker: '03 · 英文精读' },
    { id: 'listening', name: '听力', icon: '🎧', kicker: '04 · 英语听力' },
  ];

  const Store = {
    get(k, d) {
      try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  const state = { dates: [], date: null, day: null, active: 'chinese' };
  const progress = Store.get('dl.progress', {});   // { date: { chinese: 1, ... } }
  const notes    = Store.get('dl.notes', {});      // { date: { key: text } }
  const answers  = Store.get('dl.answers', {});    // { date: { key: optionIndex } }
  const wrongs   = Store.get('dl.wrong', []);      // [{ date, q, opts, ans, chosen, explain }]
  const meta     = Store.get('dl.meta', { theme: 'light', checkin: {} });
  if (!meta.checkin) meta.checkin = {};
  const tasks    = Store.get('dl.tasks', {});      // { date: { "0": 1, "2": 1 } }

  /* 数据里没写清单时用的默认五项 */
  const DEFAULT_TASKS = [
    { text: '把晨读文章读完一遍', tip: '出声读，读到能复述大意' },
    { text: '背下今天的古诗文', tip: '先理解再背，比死记快十倍' },
    { text: '做完英文阅读题', tip: '错题会自动进错题本' },
    { text: '听今天的听力材料', tip: '先盲听两遍再看文本' },
  ];

  /* ---------------- 小工具 ---------------- */

  function h(tag, attrs, ...children) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'text') n.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
        else n.setAttribute(k, v);
      }
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      n.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return n;
  }

  const $ = (sel) => document.querySelector(sel);
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('无法载入 ' + src));
      document.head.appendChild(s);
    });
  }

  /* 把顶栏真实高度写进 --topbar-h，吸顶导航和锚点偏移都靠它。
     刘海屏的 safe-area、不同字号、系统字体差异都会改变顶栏高度，
     写死 51px 会让板块导航被顶栏压住。 */
  function syncTopbarHeight() {
    const bar = document.querySelector('.topbar');
    if (!bar) return;
    const apply = () => {
      const h2 = Math.round(bar.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--topbar-h', h2 + 'px');
    };
    apply();
    if (typeof ResizeObserver === 'function') new ResizeObserver(apply).observe(bar);
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
  }

  function dayProgress(date) { return progress[date] || (progress[date] = {}); }


  /* 四个板块固定都在，不再有按天出现的板块 */
  function activeSections() { return SECTIONS; }

  function doneCount(date) {
    const p = progress[date] || {};
    return activeSections().filter((s) => p[s.id]).length;
  }

  /* ---------------- 外观：配色主题 / 字体 / 字号 ---------------- */

  const THEMES = [
    { id: 'light', label: '素纸', bg: '#faf7f1', swatch: '#f3ecdd' },
    { id: 'green', label: '竹青', bg: '#edf2e9', swatch: '#dbe7d4' },
    { id: 'sky', label: '天青', bg: '#eef3f6', swatch: '#d7e4ee' },
    { id: 'sepia', label: '茶褐', bg: '#f3ead9', swatch: '#e4d3b6' },
    { id: 'ink', label: '墨夜', bg: '#141719', swatch: '#2b3338' },
    { id: 'dusk', label: '暮色', bg: '#191418', swatch: '#352a31' },
  ];
  const ZH_FONTS = [
    { id: 'hei', label: '黑体', preview: '"PingFang SC","Microsoft YaHei",sans-serif', desc: '清爽 · 不下载字体' },
    { id: 'song', label: '宋体', preview: '"DLSong","Songti SC","SimSun",serif', desc: '书卷气 · 思源宋体' },
    { id: 'kai2', label: '楷书', preview: '"DLKai2","KaiTi",serif', desc: '端正 · 文鼎 PL 楷' },
    { id: 'fangsong', label: '仿宋', preview: '"DLFangSong","FangSong",serif', desc: '清瘦 · 朱雀仿宋' },
    { id: 'kai', label: '文楷', preview: '"DLWenKai","Kaiti SC",serif', desc: '古雅 · 霞鹜文楷' },
  ];

  /* ---------------- 听力朗读：风格与音色偏好 ---------------- */
  const STYLES = [
    { id: 'calm', label: '舒缓', rate: 0.82, pitch: 0.96, pause: 1.25 },
    { id: 'natural', label: '自然', rate: 0.92, pitch: 1.0, pause: 1.0 },
    { id: 'bright', label: '轻快', rate: 1.04, pitch: 1.06, pause: 0.82 },
  ];
  function listenPrefs() {
    const p = Store.get('dl.listen', {});
    return { voice: p.voice || '', style: STYLES.some((s) => s.id === p.style) ? p.style : 'natural' };
  }
  function saveListen(p) {
    Store.set('dl.listen', { voice: p.voice || '', style: p.style || 'natural' });
  }
  const EN_FONTS = [
    { id: 'serif', label: '衬线', preview: 'Georgia,"Times New Roman",serif', desc: '耐读' },
    { id: 'sans', label: '无衬线', preview: '"Segoe UI",Arial,sans-serif', desc: '干净' },
    { id: 'mono', label: '等宽', preview: 'Consolas,"SF Mono",monospace', desc: '对代码友好' },
  ];
  const SIZES = [
    { id: 's', label: '小' },
    { id: 'm', label: '标准' },
    { id: 'l', label: '大' },
  ];

  /* 字体预览用的「永」字轮廓。
     直接从四套 woff2 里取的字形路径（fontTools 导出），一共约 4.5KB。
     以前预览是给 chip 真套 font-family，面板一打开就把 4 套 CJK 字体全下下来（约 6.5MB）。
     现在用矢量字形，预览效果一致且零字体请求。fill 走 currentColor，跟着主题变色。 */
  const YONG = {
    song: '<svg viewBox="34 -834 935 910" aria-hidden="true"><path transform="scale(1,-1)" d="M57 437H361V409H66ZM203 617H528V587H212ZM318 437H308L350 477L420 415Q414 408 405.5 405.5Q397 403 380 402Q355 321 311.5 245.5Q268 170 202.5 106Q137 42 43 -4L34 11Q111 60 168 128Q225 196 262.5 275.5Q300 355 318 437ZM820 595 909 540Q904 533 896 530.5Q888 528 871 533Q841 505 799 471.5Q757 438 708 406Q659 374 611 347L600 360Q640 393 682 434.5Q724 476 760.5 518.5Q797 561 820 595ZM328 834Q417 827 476 810.5Q535 794 570 772.5Q605 751 620 729.5Q635 708 634 691.5Q633 675 620.5 668Q608 661 588 667Q569 691 531.5 718.5Q494 746 441.5 772.5Q389 799 324 819ZM474 617H464L498 659L585 594Q580 587 568 581.5Q556 576 540 573V20Q540 -5 532.5 -25Q525 -45 501.5 -58Q478 -71 427 -76Q425 -60 419.5 -48Q414 -36 403 -28Q389 -19 366.5 -13Q344 -7 306 -2V14Q306 14 324 12.5Q342 11 367.5 9Q393 7 416 5.5Q439 4 448 4Q464 4 469 10Q474 16 474 28ZM540 570Q565 460 609 378Q653 296 711 236.5Q769 177 834.5 135Q900 93 969 64L966 54Q945 51 929.5 35.5Q914 20 907 -4Q839 35 779.5 85Q720 135 671.5 201Q623 267 587 356Q551 445 529 563Z"/></svg>',
    kai: '<svg viewBox="28 -800 946 896" aria-hidden="true"><path transform="scale(1,-1)" d="M360 743Q341 749 341 762Q341 768 344 777Q352 800 365 800Q389 800 576 724Q603 713 620.5 705Q638 697 638 682.5Q638 668 628.5 652.5Q619 637 611 637Q603 637 543.5 669.5Q484 702 360 743ZM219 598Q239 594 254 594L512 613Q526 613 543.5 603Q561 593 561 576L556 552V451Q598 384 623 349Q730 423 792 500Q807 519 809 536Q811 553 819.5 553Q828 553 840 542Q873 512 873 493Q873 481 819 433Q723 349 657 305Q788 143 956 53Q974 44 974 37Q974 34 964 24Q937 -5 913 -5Q906 -5 898 1Q802 65 713 156Q624 247 555 350L554 -2L555 -40Q555 -68 539.5 -82Q524 -96 509 -96Q494 -96 469 -84.5Q444 -73 415 -55Q386 -37 359.5 -17Q333 3 316 19Q299 35 299 43Q299 51 308 51Q317 51 362 29.5Q407 8 486 -14L488 552L300 538Q280 536 263.5 536Q247 536 234.5 548.5Q222 561 216 574.5Q210 588 210 591Q210 598 219 598ZM97 424Q129 420 144 420H157L370 438Q374 439 377 439H388Q397 439 414.5 427.5Q432 416 432 403.5Q432 391 426 385Q420 379 418 376Q353 222 241 115Q155 32 77 -4Q47 -18 37.5 -18Q28 -18 28 -12Q28 -2 45 9Q141 78 221 174Q301 270 346 379L178 365Q160 363 150 363Q140 363 124 369.5Q108 376 92 410Q89 416 89 420Q89 424 97 424Z"/></svg>',
    kai2: '<svg viewBox="68 -853 904 897" aria-hidden="true"><path transform="scale(1,-1)" d="M459 803Q513 751 552 737Q571 736 580 752Q586 768 581 788Q571 816 548 830Q509 852 453 853Q444 853 439 850Q432 847 436 833Q439 820 459 803ZM123 401Q110 401 108 392Q107 385 123 377Q169 352 198 363Q315 397 326 395Q336 391 324 370Q273 264 225 213Q177 156 90 98Q74 86 84 83Q94 82 115 89Q193 122 257 177Q318 228 395 360Q407 382 419 393Q434 403 426 415Q416 428 379 443Q358 455 311 434Q221 412 123 401ZM572 430Q553 452 537 472Q537 550 552 575Q565 596 551 607Q529 626 489 643Q462 653 424 624Q387 606 311 589Q295 588 305 578Q315 568 331 562Q346 559 414 581Q459 599 470 592Q480 582 479 547Q483 277 468 114Q467 84 457 72Q451 65 429 71Q404 77 379 82Q357 89 358 79Q415 25 445 -13Q458 -34 476 -40Q486 -44 495 -34Q543 26 542 79Q535 215 537 425Q561 388 624 306Q703 201 763 142Q790 112 815 114Q888 126 951 134Q978 138 977 145Q978 152 947 166Q785 232 741 267Q675 321 586 414Q776 541 799 550Q824 560 813 581Q798 600 770 619Q745 635 730 633Q715 632 719 616Q722 583 631 490Q601 463 572 430Z"/></svg>',
    fangsong: '<svg viewBox="34 -791 930 912" aria-hidden="true"><path transform="scale(1,-1)" d="M385 773 392 791Q424 786 492 770.5Q560 755 579 745Q597 736 597 722Q598 680 586 653Q583 646 576 641.5Q569 637 561 637Q549 637 541 648Q514 685 476 715Q438 745 385 773ZM498 -121Q490 -121 484 -111Q453 -71 417 -36Q381 -1 314 52L323 65L482 -4Q490 17 497 488L498 538Q418 523 314 497L238 534L244 549Q295 547 338 553Q381 559 449 573Q466 577 479 583Q492 589 507 601Q538 585 567 566Q574 560 574 556Q574 552 569 547Q559 537 555 525.5Q551 514 549 497Q545 448 544 387L592 336Q636 370 673 411Q710 452 734 489Q742 502 744 515Q746 528 744 551L761 563Q813 516 847 479L828 466L788 437L746 406Q709 379 675 354.5Q641 330 614 313Q719 204 794 147Q829 121 863.5 102.5Q898 84 964 64V43Q891 41 810 34L798 33Q778 33 769 45Q690 157 543 339Q542 303 542 224Q542 109 545 1Q546 -28 538 -58.5Q530 -89 513 -112Q506 -121 498 -121ZM363 346Q285 332 185 305L114 340L118 354Q129 353 149 353Q190 353 221 358Q252 363 303 374Q328 379 343 386Q358 393 379 410Q398 400 417.5 388.5Q437 377 448 369Q456 363 456 359Q456 355 448 349Q437 341 428.5 331Q420 321 407 300Q356 218 316 165.5Q276 113 211 61.5Q146 10 47 -36L34 -14Q162 62 239 147Q316 232 363 346Z"/></svg>',
  };

  const look = {
    theme: meta.theme || '',
    zh: meta.zh || 'song',
    en: meta.en || 'serif',
    size: meta.size || 'm',
  };

  function prefersDark() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) { return false; }
  }

  function themeInfo(id) {
    return THEMES.find((t) => t.id === id) || THEMES[0];
  }

  /* 把当前外观写到 <html> 的 data-* 上，CSS 里靠这些选择器换色/换字 */
  function applyLook(patch) {
    Object.assign(look, patch || {});
    if (!look.theme) look.theme = prefersDark() ? 'ink' : 'light';

    const root = document.documentElement;
    root.setAttribute('data-theme', look.theme);
    root.setAttribute('data-zh', look.zh);
    root.setAttribute('data-en', look.en);
    root.setAttribute('data-size', look.size);

    meta.theme = look.theme;
    meta.zh = look.zh;
    meta.en = look.en;
    meta.size = look.size;
    Store.set('dl.meta', meta);

    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeInfo(look.theme).bg);

    syncLookUI();
  }

  /* 让面板里的选中态跟着当前外观走 */
  function syncLookUI() {
    document.querySelectorAll('#lookPanel .swatch').forEach((b) => {
      b.classList.toggle('on', b.getAttribute('data-theme') === look.theme);
    });
    document.querySelectorAll('#lookPanel .chip').forEach((b) => {
      const g = b.getAttribute('data-group');
      const v = b.getAttribute('data-value');
      b.classList.toggle('on', (g === 'zh' && v === look.zh) || (g === 'en' && v === look.en) || (g === 'size' && v === look.size));
    });
  }

  /* 字体预览样式：有矢量轮廓的用内联 SVG，没有的（黑体，系统自带）用文字「永」 */
  function glyphPreview(id) {
    if (YONG[id]) return h('i', { class: 'chip-glyph', html: YONG[id] });
    return h('i', {
      class: 'chip-glyph',
      style: 'display:grid;place-items:center;font-size:15px;line-height:1;font-family:var(--ff-hei)',
      text: '永',
    });
  }

  function chipRow(group, list, opt) {
    const row = h('div', { class: 'look-chips' });
    list.forEach((item) => {
      const b = h('button', {
        class: 'chip', type: 'button',
        'data-group': group, 'data-value': item.id,
        title: item.desc || item.label,
        // 英文字体全是系统字体，直接套 font-family 不产生任何下载；
        // 中文的预览改用字形轮廓，绝不真加载字体。
        style: opt && opt.fontFamily && group === 'en' ? `font-family:${item.preview}` : null,
      }, group === 'zh' ? glyphPreview(item.id) : null, item.label);
      b.addEventListener('click', () => applyLook({ [group]: item.id }));
      row.append(b);
    });
    return row;
  }

  function buildLook() {
    const panel = h('div', { class: 'look', id: 'lookPanel' });
    const swatches = h('div', { class: 'look-swatches' });
    THEMES.forEach((t) => {
      const b = h('button', { class: 'swatch', type: 'button', 'data-theme': t.id },
        h('i', { style: `background:${t.swatch}` }),
        t.label);
      b.addEventListener('click', () => applyLook({ theme: t.id }));
      swatches.append(b);
    });

    panel.append(
      h('div', { class: 'look-row' }, h('h3', null, '配色'), swatches),
      h('div', { class: 'look-row' }, h('h3', null, '中文字体'), chipRow('zh', ZH_FONTS, { fontFamily: true })),
      h('div', { class: 'look-row' }, h('h3', null, '英文字体'), chipRow('en', EN_FONTS, { fontFamily: true })),
      h('div', { class: 'look-row' }, h('h3', null, '字号'), chipRow('size', SIZES)),
      h('div', { class: 'look-note' }, '设置存在这台设备上；第一次打开会跟随系统深浅色。'));

    document.body.append(panel);

    const btn = $('#themeBtn');
    const toggle = (force) => {
      const open = force === undefined ? !panel.classList.contains('open') : force;
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    btn.addEventListener('click', (ev) => { ev.stopPropagation(); toggle(); });
    panel.addEventListener('click', (ev) => ev.stopPropagation());
    document.addEventListener('click', () => toggle(false));
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') toggle(false); });
  }


  /* ---------------- 启动 ---------------- */

  async function init() {
    buildLook();
    applyLook();
    syncTopbarHeight();

    try {
      await loadScript('data/days/index.js');
      state.dates = (window.LEARN_INDEX || []).map((x) => x.date).sort().reverse();
    } catch (e) {
      $('#loading').textContent = '还没有任何内容：先运行 node scripts/generate.mjs 生成第一天。';
      return;
    }
    if (!state.dates.length) {
      $('#loading').textContent = '还没有任何内容：先运行 node scripts/generate.mjs 生成第一天。';
      return;
    }

    const today = fmtDate(new Date());
    state.date = dateFromUrl() || (state.dates.includes(today) ? today : state.dates[0]);

    buildDateSelect();
    buildTabs();
    $('#dateSel').addEventListener('change', () => switchDay($('#dateSel').value));
    wireDayNav();

    await switchDay(state.date);
  }

  function buildDateSelect() {
    const sel = $('#dateSel');
    sel.innerHTML = '';
    const groups = new Map();
    state.dates.forEach((d) => {
      const key = d.slice(0, 7);
      let g = groups.get(key);
      if (!g) {
        const [y, m] = key.split('-').map(Number);
        g = h('optgroup', { label: `${y} 年 ${m} 月` });
        groups.set(key, g);
        sel.append(g);
      }
      const dt = parseDate(d);
      g.append(h('option', { value: d }, `${dt.getDate()} 日 · ${WEEK[dt.getDay()]}`));
    });
    sel.value = state.date;
  }

  /* 地址栏带上日期：?d=2026-11-02，可直接分享/收藏某一天 */
  function setUrlDate(date) {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('d', date);
      window.history.replaceState(null, '', u.toString());
    } catch (e) { /* file:// 下可能不允许，忽略 */ }
  }

  function dateFromUrl() {
    try {
      const d = new URL(window.location.href).searchParams.get('d');
      return d && /^\d{4}-\d{2}-\d{2}$/.test(d) && state.dates.includes(d) ? d : null;
    } catch (e) { return null; }
  }

  function syncDayNav() {
    const i = state.dates.indexOf(state.date);
    const prev = $('#prevDay');
    const next = $('#nextDay');
    if (prev) {
      const older = state.dates[i + 1];
      prev.disabled = !older;
      prev.dataset.date = older || '';
    }
    if (next) {
      const newer = state.dates[i - 1];
      next.disabled = !newer;
      next.dataset.date = newer || '';
    }
  }

  function wireDayNav() {
    const prev = $('#prevDay');
    const next = $('#nextDay');
    if (prev) prev.addEventListener('click', () => { if (prev.dataset.date) switchDay(prev.dataset.date); });
    if (next) next.addEventListener('click', () => { if (next.dataset.date) switchDay(next.dataset.date); });
  }

  function buildTabs() {
    const nav = $('#tabs');
    nav.innerHTML = '';
    activeSections().forEach((s, i) => {
      const a = h('a', {
        class: 'tab' + (i === 0 ? ' active' : ''), href: `#sec-${s.id}`, 'data-id': s.id,
        'aria-current': i === 0 ? 'true' : null,
      },
        h('span', { class: 'tab-name' }, `${s.icon} ${s.name}`));
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      nav.append(a);
    });
  }

  async function switchDay(date) {
    if (!date) return;
    state.date = date;
    const sel = $('#dateSel');
    if (sel.value !== date) sel.value = date;
    setUrlDate(date);
    buildTabs();
    syncDayNav();
    delete window.LEARN_DAY;
    try {
      await loadScript(`data/days/${date}.js`);
    } catch (e) {
      $('#main').innerHTML = '';
      $('#main').append(h('div', { class: 'loading' }, '这一天的内容文件缺失。'));
      return;
    }
    state.day = window.LEARN_DAY;

    render();
    window.scrollTo(0, 0);
  }

  /* ---------------- 渲染 ---------------- */

  function render() {
    const d = state.day;
    const main = $('#main');
    main.innerHTML = '';

    main.append(renderQuote(d.quote));
    main.append(renderHero(d));
    main.append(renderChinese(d.chinese));
    main.append(renderPoem(d.poem));
    main.append(renderEnglish(d.english));
    main.append(renderListening(d.listening));
    main.append(renderChecklist(d.checklist));

    decorateArt();
    syncMeta(d);
    renderFooter(d);
    observeSections();
    refreshProgress();
  }

  /* ---- 00 每日一句 ---- */
  function renderQuote(q) {
    if (!q || !q.text) return h('div');
    const isEn = !/[\u4e00-\u9fa5]/.test(q.text);
    const by = q.author ? (q.source ? `${q.author}《${q.source}》` : q.author) : '';
    return h('div', { class: 'quote' },
      h('div', { class: 'quote-text' + (isEn ? ' en' : '') }, q.text),
      by ? h('div', { class: 'quote-author' }, by) : null);
  }

  /* 数据里写场景名（如 "lotus-moon"），这里渲染内置水墨插图 */
  function artFigure(key, caption, seed) {
    const art = window.LEARN_ART;
    if (!key || !art) return null;
    return h('figure', { class: 'art' },
      h('div', { class: 'art-frame', html: art.svg(key, seed) }),
      h('figcaption', null, caption || art.label(key)));
  }

  /* 没有指定场景的板块，按「日期 + 板块」稳定地挑一张，同一天刷几次都一样 */
  const SECTION_ART = {
    hero: ['spring-river', 'autumn-mountain', 'pine-valley', 'lotus-moon', 'snow-peak', 'autumn-river'],
    chinese: ['lotus-moon', 'bamboo', 'pastoral', 'autumn-mountain'],
    poem: ['snow-peak', 'plum', 'tower', 'autumn-river', 'pine-valley', 'border'],
    english: ['bloom', 'rain-window', 'pastoral', 'dunes'],
    listening: ['desk', 'lamp', 'rain-window', 'paper'],
  };

  function strHash(s) {
    let x = 2166136261;
    for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
    return x >>> 0;
  }

  function pickArt(id, seed) {
    const list = SECTION_ART[id];
    if (!list || !list.length) return null;
    return list[strHash(`${seed || ''}|${id}`) % list.length];
  }

  /* 给还没有插图的板块补一张：放在标题/副标题之后、正文之前 */
  function decorateArt() {
    const cards = document.querySelectorAll('#main .card');
    cards.forEach((card) => {
      if (card.querySelector('figure.art')) return;
      const id = (card.getAttribute('id') || '').replace(/^sec-/, '');
      const key = pickArt(id, state.date);
      const fig = artFigure(key, null, `${state.date}|${id}`);
      if (!fig) return;
      const body = card.querySelector('.card-body');
      if (!body) return;
      const ref = body.querySelector('.byline');
      if (ref) body.insertBefore(fig, ref.nextSibling);
      else body.insertBefore(fig, body.firstChild);
    });
  }

  function renderHero(d) {
    const p = dayProgress(state.date);
    const bar = h('i');
    const txt = h('span', { id: 'progText' });
    const sec = h('section', { class: 'hero' },
      h('div', { class: 'hero-date' }, `${d.date} · ${d.weekday || WEEK[parseDate(d.date).getDay()]}`),
      h('h1', { class: 'hero-title' }, d.theme || '今日一学'),
      h('div', { class: 'hero-meta' }, txt, h('div', { class: 'hero-bar' }, bar)));

    const heroArt = artFigure(pickArt('hero', state.date), null, `${state.date}|hero`);
    if (heroArt) {
      heroArt.classList.add('hero-art');
      sec.append(heroArt);
    }
    return sec;
  }

  function sectionCard(s) {
    const btn = h('button', { class: 'done-btn', 'data-sec': s.id }, '标记完成');
    btn.addEventListener('click', () => {
      const p = dayProgress(state.date);
      if (p[s.id]) { delete p[s.id]; } else { p[s.id] = 1; }
      Store.set('dl.progress', progress);
      refreshProgress();
    });
    const body = h('div', { class: 'card-body' });
    const card = h('section', { class: 'card', id: `sec-${s.id}` },
      h('div', { class: 'card-head' },
        h('div', { class: 'kicker' }, s.kicker),
        btn),
      body);
    return { card, body, btn };
  }

  /* ---- 01 语文 ---- */
  function renderChinese(c) {
    const { card, body } = sectionCard(SECTIONS[0]);
    body.append(
      h('h2', null, c.title),
      h('div', { class: 'byline' }, `${c.author || ''}${c.author && c.tag ? ' · ' : ''}${c.tag || ''}${c.readingTime ? ' · ' + c.readingTime : ''}`));

    const fig = artFigure(c.image, c.imageCaption, state.date + '|c');
    if (fig) body.append(fig);

    body.append(h('div', { class: 'prose' }, c.body.map((p) => h('p', null, p))));

    if (c.explain?.length) {
      body.append(block('逐句讲解',
        c.explain.map((x) => h('div', { class: 'item' },
          h('div', { class: 'item-q' }, x.line),
          h('div', { class: 'item-a', html: x.note })))));
    }

    if (c.words?.length) {
      body.append(block('好词', c.words.map((w) => h('div', { class: 'item' },
        h('div', { class: 'item-q' }, h('span', { class: 'tag-word' }, w.w), w.meaning),
        h('div', { class: 'item-a' }, w.use)))));
    }

    if (c.expressions?.length) {
      body.append(block('好句 · 值得抄下来',
        c.expressions.map((e) => h('div', { class: 'item' },
          h('div', { class: 'item-q' }, '“' + e.s + '”'),
          h('div', { class: 'item-a' }, h('b', null, '妙在：'), e.why)))));
    }

    if (c.techniques?.length) {
      body.append(block('写作手法',
        c.techniques.map((t) => h('div', { class: 'item' },
          h('div', { class: 'item-q' }, h('span', { class: 'tag-word' }, t.name)),
          h('div', { class: 'item-a' }, t.desc),
          t.example ? h('div', { class: 'item-a' }, h('b', null, '例：'), t.example) : null))));
    }

    if (c.imitation) {
      body.append(block('仿写任务',
        h('div', { class: 'callout' },
          h('div', null, h('b', null, '任务：'), c.imitation.prompt),
          c.imitation.steps?.length ? h('ul', { class: 'note-list', style: 'margin-top:10px' },
            c.imitation.steps.map((s) => h('li', null, s))) : null),
        textareaFor(`chinese-${c.title}`, '在这里写你的仿写，自动保存到本机…')));
    }

    return card;
  }

  /* ---- 02 古诗文 ---- */
  function renderPoem(p) {
    const { card, body } = sectionCard(SECTIONS[1]);
    body.append(
      h('h2', null, p.title),
      h('div', { class: 'byline' }, `${p.dynasty || ''} · ${p.author || ''}${p.tag ? ' · ' + p.tag : ''}`));

    const fig = artFigure(p.image, p.imageCaption, state.date + '|p');
    if (fig) body.append(fig);

    body.append(h('div', { class: 'poem-body' }, p.body.map((line) => h('p', null, line))));

    if (p.notes?.length) {
      body.append(block('注释', h('ul', { class: 'note-list' },
        p.notes.map((n) => h('li', null, h('b', null, n.line + '：'), n.note)))));
    }

    if (p.translation) body.append(block('译文', h('div', { class: 'prose', style: 'font-size:16px' }, h('p', null, p.translation))));

    if (p.appreciation?.length) {
      body.append(block('赏析', p.appreciation.map((t) => h('p', { class: 'item-a', style: 'margin:0 0 10px' }, t))));
    }

    if (p.recite) {
      body.append(block('背诵提示', h('div', { class: 'callout teal' }, h('b', null, '怎么背：'), p.recite)));
    }

    return card;
  }

  /* ---- 03 英文 ---- */
  function renderEnglish(e) {
    const { card, body } = sectionCard(SECTIONS[2]);

    const readBtn = h('button', { class: 'btn small ghost' }, '▶ 朗读全文');
    readBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      speakAll(e.body.join(' '), readBtn);
    });

    const trans = Array.isArray(e.translation) ? e.translation : [];
    const hasTrans = trans.some((t) => t && String(t).trim());
    const transBtn = h('button', { class: 'btn small ghost toggle-trans', type: 'button' }, '显示译文');
    transBtn.style.display = hasTrans ? '' : 'none';

    body.append(
      h('h2', null, e.title),
      h('div', { class: 'en-meta' },
        h('span', { class: 'pill' }, e.level || 'CET-6'),
        h('span', { class: 'pill' }, `${e.words || ''} words`),
        readBtn, transBtn),
      h('div', { class: 'en-prose' }, (e.body || []).map((p, i) => {
        const para = h('div', { class: 'en-para' }, h('p', null, p));
        if (hasTrans && trans[i]) para.append(h('div', { class: 'trans' }, trans[i]));
        return para;
      })));

    transBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const on = body.classList.toggle('show-trans');
      transBtn.classList.toggle('on', on);
      transBtn.textContent = on ? '隐藏译文' : '显示译文';
    });

    if (e.vocab?.length) {
      body.append(block('重点词汇 · 点击卡片自测',
        h('div', { class: 'vocab-grid' }, e.vocab.map((v) => vocabCard(v)))));
    }

    if (e.collocations?.length) {
      body.append(block('地道搭配 · 背下来就能用',
        e.collocations.map((x) => h('div', { class: 'item' },
          h('div', { class: 'item-q' },
            h('span', { class: 'tag-word' }, x.phrase || x.p),
            h('span', null, ' ' + (x.cn || ''))),
          x.ex ? h('div', { class: 'item-a', style: 'font-family:var(--ff-en)' }, x.ex) : null))));
    }

    if (e.phrases?.length) {
      body.append(block('短语搭配', e.phrases.map((x) => h('div', { class: 'item' },
        h('div', { class: 'item-q' }, h('span', { class: 'tag-word' }, x.p), x.cn),
        x.ex ? h('div', { class: 'item-a', style: 'font-family:var(--ff-en)' }, x.ex) : null))));
    }

    if (e.patterns?.length) {
      body.append(block('句式', e.patterns.map((x) => h('div', { class: 'item' },
        h('div', { class: 'item-q', style: 'font-family:var(--ff-en)' }, '“' + x.s + '”'),
        h('div', { class: 'item-a' }, x.cn),
        x.note ? h('div', { class: 'item-a' }, h('b', null, '用法：'), x.note) : null))));
    }

    if (e.grammar?.length) {
      body.append(block('语法点', e.grammar.map((g) => h('div', { class: 'item' },
        h('div', { class: 'item-q' }, h('span', { class: 'tag-word' }, g.point)),
        h('div', { class: 'item-a' }, g.explain),
        g.example ? h('div', { class: 'item-a', style: 'font-family:var(--ff-en)' }, g.example) : null))));
    }

    if (e.summary) body.append(block('中文摘要', h('div', { class: 'callout' }, e.summary)));

    if (e.questions?.length) {
      body.append(block('阅读理解', e.questions.map((q, i) => quizCard(q, i, 'english'))));
    }

    if (e.output) {
      body.append(block('输出任务',
        h('div', { class: 'callout gold' },
          h('div', null, h('b', null, '任务：'), e.output.prompt),
          e.output.tasks?.length ? h('ul', { class: 'note-list', style: 'margin-top:10px' },
            e.output.tasks.map((t) => h('li', null, t))) : null),
        textareaFor(`english-output-${e.title}`, '用今天学的词和句式写在这里…')));
    }

    return card;
  }

  function vocabCard(v) {
    const cn = h('div', { class: 'vocab-cn hidden-cn' }, `${v.pos ? v.pos + ' ' : ''}${v.cn}`);
    const ex = v.ex ? h('div', { class: 'vocab-ex hidden-cn' }, v.ex) : null;
    const card = h('div', { class: 'vocab' },
      h('div', { class: 'vocab-top' }, h('span', { class: 'vocab-w' }, v.w), v.pos ? h('span', { class: 'vocab-pos' }, v.pos) : null),
      cn, ex);
    card.addEventListener('click', () => {
      cn.classList.toggle('hidden-cn');
      ex?.classList.toggle('hidden-cn');
    });
    return card;
  }

  /* ---- 04 听力（自创短文 + 浏览器美音朗读） ---- */
  function renderListening(l) {
    const { card, body } = sectionCard(SECTIONS[3]);
    const lines = (Array.isArray(l.lines) ? l.lines : []).filter((x) => x && x.en);
    const meta = [l.level || '标准美音', l.words ? l.words + ' words' : '', l.topic || '']
      .filter(Boolean).join(' · ');

    body.append(
      h('h2', null, l.title || '今日听力'),
      meta ? h('div', { class: 'byline' }, meta) : null);

    if (!lines.length) {
      body.append(h('div', { class: 'callout' }, l.note || '今天这段听力暂时没有文本。'));
      return card;
    }

    const nodes = lines.map((ln) => h('div', { class: 'listen-line' },
      h('p', { class: 'listen-en' }, ln.en),
      ln.cn ? h('p', { class: 'listen-trans' }, ln.cn) : null));

    const playBtn = h('button', { class: 'btn small', type: 'button' }, '▶ 播放');
    const stopBtn = h('button', { class: 'btn small ghost', type: 'button' }, '■ 停止');
    const transBtn = h('button', { class: 'btn small ghost toggle-trans', type: 'button' }, '显示译文');

    const pref = listenPrefs();
    const styleSel = h('select', { class: 'speed-sel', title: '朗读风格：语速、音高和句间停顿一起变' },
      STYLES.map((s) => h('option', { value: s.id, selected: s.id === pref.style ? 'selected' : null }, s.label)));
    const voiceSel = h('select', { class: 'speed-sel voice-sel', title: '音色：不同系统语音差别很大，⭐ 是最自然的' });

    body.append(
      h('div', { class: 'listen-controls' }, playBtn, stopBtn, styleSel, transBtn),
      h('div', { class: 'listen-controls tight' },
        h('span', { class: 'listen-lab' }, '音色'),
        voiceSel,
        h('span', { class: 'listen-lab dim' }, '听着生硬就换一个 ⭐')),
      h('div', { class: 'listen-lines' }, nodes),
      l.note ? h('div', { class: 'listen-note' }, l.note) : null,
      block('怎么听（四步）', h('ol', { class: 'note-list' },
        h('li', null, '先不看文本，点播放听两遍，抓大意：谁、发生了什么、态度是什么。'),
        h('li', null, '第三遍盯着文本听，把听不清的地方标出来——那就是你的盲区。'),
        h('li', null, '跟读一遍，模仿连读、弱读和句子重音，不必每个词都发准。'),
        h('li', null, '打开译文确认每句都懂；隔一天再盲听一次。'))));

    const synth = window.speechSynthesis;
    const U = window.SpeechSynthesisUtterance;
    const STYLE_MAP = {};
    STYLES.forEach((s) => { STYLE_MAP[s.id] = s; });

    let voice = null, playing = false, runId = 0, myRun = 0, queue = [], curLine = -1;

    function isNatural(v) {
      return /natural|neural|online|aria|jenny|guy|samantha|google us english|libby|sonia|ryan|ava|alloy/i.test(v.name || '');
    }
    function voiceScore(v) {
      let s = 0;
      if (/^en[-_]US/i.test(v.lang)) s += 10;
      else if (/^en[-_]GB/i.test(v.lang)) s += 6;
      else if (/^en/i.test(v.lang)) s += 4;
      if (isNatural(v)) s += 6;
      if (/compact|espeak|pico|david|mark/i.test(v.name || '')) s -= 5;
      return s;
    }
    function englishVoices() {
      const vs = (synth && synth.getVoices && synth.getVoices()) || [];
      return vs.filter((v) => /^en/i.test(v.lang || '')).sort((a, b) => voiceScore(b) - voiceScore(a));
    }

    function fillVoices() {
      const list = englishVoices();
      voiceSel.textContent = '';
      if (!list.length) {
        voiceSel.append(h('option', { value: '' }, '系统暂无英语音色'));
        return;
      }
      list.forEach((v) => voiceSel.append(h('option', {
        value: v.voiceURI,
        selected: v.voiceURI === pref.voice ? 'selected' : null,
      }, `${v.name}${isNatural(v) ? ' ⭐' : ''} · ${String(v.lang || '').replace('_', '-')}`)));
      const pick = list.find((v) => v.voiceURI === pref.voice) || list[0];
      voiceSel.value = pick.voiceURI;
      voice = pick;
    }

    function syncVoice() {
      voice = englishVoices().find((v) => v.voiceURI === voiceSel.value) || null;
      const p = listenPrefs();
      p.voice = voiceSel.value;
      saveListen(p);
    }

    function styleNow() { return STYLE_MAP[styleSel.value] || STYLES[1]; }

    /* 把一句按标点切成短句：每段单独合成，句间留气口，听感才不会一路平推 */
    function clauses(text) {
      const s = String(text || '').trim();
      if (!s) return [];
      const parts = s.match(/[^,;:.!?—–、；：，。！？…]+[,;:.!?—–、；：，。！？…]*/g) || [s];
      return parts.map((p) => p.trim()).filter(Boolean);
    }
    function tailPause(text, mult) {
      const end = String(text).slice(-1);
      if ('.!?。！？…'.indexOf(end) >= 0) return Math.round(430 * mult);
      if (',;:、；：，—–'.indexOf(end) >= 0) return Math.round(190 * mult);
      return Math.round(110 * mult);
    }

    function clearHi() { nodes.forEach((n) => n.classList.remove('playing')); curLine = -1; }
    function markLine(i) {
      clearHi();
      if (nodes[i]) {
        nodes[i].classList.add('playing');
        curLine = i;
        try {
          if (nodes[i].scrollIntoView) nodes[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch { /* 部分环境不支持参数 */ }
      }
    }

    function done() {
      playing = false;
      runId++;
      clearHi();
      playBtn.textContent = '▶ 播放';
    }

    function buildQueue() {
      const st = styleNow();
      const q = [];
      lines.forEach((ln, li) => {
        clauses(ln.en).forEach((c, ci) => {
          q.push({
            line: li, text: c, rate: st.rate,
            pitch: Math.max(0.6, Math.min(1.6, st.pitch + (ci % 2 ? 0.014 : -0.012))),
            gap: tailPause(c, st.pause),
          });
        });
        q.push({ line: li, text: '', rate: st.rate, pitch: st.pitch, gap: Math.round(240 * st.pause) });
      });
      return q;
    }

    function playAt(idx) {
      if (!playing || myRun !== runId) return;
      if (idx >= queue.length) { done(); return; }
      const item = queue[idx];
      if (!item.text) { window.setTimeout(() => playAt(idx + 1), item.gap); return; }
      if (item.line !== curLine) markLine(item.line);

      const u = new U(item.text);
      u.lang = (voice && voice.lang) || 'en-US';
      if (voice) u.voice = voice;
      u.rate = item.rate;
      u.pitch = item.pitch;
      u.volume = 1;
      u.onend = () => { if (myRun === runId) window.setTimeout(() => playAt(idx + 1), item.gap); };
      u.onerror = () => { if (myRun === runId) window.setTimeout(() => playAt(idx + 1), 60); };
      try { synth.speak(u); } catch (e) { window.setTimeout(() => playAt(idx + 1), 60); }
    }

    fillVoices();
    if (synth && synth.addEventListener) synth.addEventListener('voiceschanged', fillVoices);
    else if (synth && 'onvoiceschanged' in synth) synth.onvoiceschanged = fillVoices;

    voiceSel.addEventListener('change', (ev) => { ev.stopPropagation(); syncVoice(); });
    styleSel.addEventListener('change', (ev) => {
      ev.stopPropagation();
      const p = listenPrefs();
      p.style = styleSel.value;
      saveListen(p);
    });

    playBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!synth || !U) { playBtn.textContent = '此浏览器不支持朗读'; return; }
      try { synth.cancel(); } catch (e) { /* ignore */ }
      runId++;
      myRun = runId;
      playing = true;
      playBtn.textContent = '❚❚ 停止';
      queue = buildQueue();
      if (!queue.length) { done(); return; }
      playAt(0);
    });

    stopBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      try { if (synth) synth.cancel(); } catch (e) { /* ignore */ }
      done();
    });

    transBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const on = body.classList.toggle('show-trans');
      transBtn.classList.toggle('on', on);
      transBtn.textContent = on ? '隐藏译文' : '显示译文';
    });

    return card;
  }

  /* ---- 05 今日清单 ---- */
  function renderChecklist(list) {
    const date = state.date;
    const items = (Array.isArray(list) && list.length ? list : DEFAULT_TASKS)
      .map((x) => (typeof x === 'string' ? { text: x } : x));
    const tstore = tasks[date] || (tasks[date] = {});

    const countEl = h('b');
    const countWrap = h('div', { class: 'task-count' }, countEl, ' / ' + items.length + ' 已完成');
    const barFill = h('i');
    const rows = [];

    function sync() {
      const n = items.filter((_, i) => tstore[i]).length;
      countEl.textContent = String(n);
      barFill.style.width = `${(n / items.length) * 100}%`;
      rows.forEach((row, i) => row.classList.toggle('on', !!tstore[i]));
      allEl.hidden = n < items.length;
    }

    items.forEach((it, i) => {
      const box = h('span', { class: 'task-box' }, '✓');
      const row = h('div', { class: 'task', 'data-i': i },
        box,
        h('div', { class: 'task-label' }, it.text,
          it.tip ? h('span', { class: 'task-tip' }, it.tip) : null));
      row.addEventListener('click', () => {
        if (tstore[i]) delete tstore[i]; else tstore[i] = 1;
        Store.set('dl.tasks', tasks);
        sync();
      });
      rows.push(row);
    });

    const allEl = h('div', { class: 'task-all', hidden: true }, '今天的清单全部打勾了，去休息吧 🎉');

    const card = h('section', { class: 'card', id: 'sec-tasks' },
      h('div', { class: 'card-head' },
        h('div', { class: 'kicker' }, `${pad(activeSections().length + 1)} · 今日清单`),
        h('div', { class: 'task-count' }, '打勾即保存')),
      h('h2', null, '今天要做完这些'),
      countWrap,
      h('div', { class: 'task-bar' }, barFill),
      ...rows,
      allEl);

    sync();
    return card;
  }

  /* ---------------- 组件：块 / 题目 / 笔记 ---------------- */

  function block(title, ...kids) {
    return h('div', { class: 'block' }, h('div', { class: 'block-title' }, title), ...kids);
  }

  function quizCard(q, i, key) {
    const quizKey = `${key}-${i}`;
    const store = answers[state.date] || (answers[state.date] = {});
    const answered = store[quizKey];

    const explain = h('div', { class: 'quiz-explain', html: q.explain ? `<b>解析：</b>${q.explain}` : '' });
    explain.hidden = answered == null;

    const opts = (q.options || []).map((text, oi) => {
      const b = h('button', { class: 'opt', 'data-oi': oi }, text);
      if (answered != null) {
        b.disabled = true;
        if (oi === q.answer) b.classList.add('correct');
        else if (oi === answered) b.classList.add('wrong');
      }
      b.addEventListener('click', () => {
        if (quizKey in store) return;
        store[quizKey] = oi;
        Store.set('dl.answers', answers);
        const nodes = [...optsEl.querySelectorAll('.opt')];
        nodes.forEach((n, k) => {
          n.disabled = true;
          if (k === q.answer) n.classList.add('correct');
          else if (k === oi) n.classList.add('wrong');
        });
        explain.hidden = false;
        if (oi !== q.answer) recordWrong(quizKey, q, oi);
      });
      return b;
    });

    const optsEl = h('div', { class: 'opts' }, opts);
    return h('div', { class: 'quiz', 'data-key': quizKey },
      h('p', { class: 'quiz-q' }, h('b', null, `Q${i + 1}`), q.q),
      optsEl, explain);
  }

  function recordWrong(quizKey, q, chosen) {
    const id = `${state.date}|${quizKey}`;
    if (wrongs.some((w) => w.id === id)) return;
    wrongs.unshift({
      id, date: state.date, q: q.q, opts: q.options || [],
      ans: q.answer, chosen, explain: q.explain || '',
    });
    if (wrongs.length > 200) wrongs.length = 200;
    Store.set('dl.wrong', wrongs);
    renderFooter(state.day);
  }

  function textareaFor(key, placeholder) {
    const fullKey = `${state.date}::${key}`;
    const ta = h('textarea', { placeholder: placeholder || '写点什么…', spellcheck: 'false' });
    const hint = h('div', { class: 'save-hint' }, '自动保存在本机浏览器');
    ta.value = (notes[state.date] || {})[key] || '';
    let timer = null;
    ta.addEventListener('input', () => {
      (notes[state.date] || (notes[state.date] = {}))[key] = ta.value;
      clearTimeout(timer);
      hint.textContent = '正在保存…';
      timer = setTimeout(() => {
        Store.set('dl.notes', notes);
        hint.textContent = `已保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
      }, 400);
    });
    return h('div', null, ta, hint);
  }

  /* ---------------- 朗读 ---------------- */

  let speakingBtn = null;
  function speakAll(text, btn) {
    try { window.speechSynthesis.cancel(); } catch {}
    if (speakingBtn === btn) { speakingBtn = null; btn.textContent = btn.dataset.label || '▶ 朗读'; return; }
    speakingBtn = btn;
    if (!btn.dataset.label) btn.dataset.label = btn.textContent;
    btn.textContent = '■ 停止';

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.95;
    u.onend = () => { btn.textContent = btn.dataset.label; speakingBtn = null; };
    u.onerror = () => { btn.textContent = btn.dataset.label; speakingBtn = null; };
    window.speechSynthesis.speak(u);
  }

  /* ---------------- 进度 / 页脚 ---------------- */

  function refreshProgress() {
    const n = doneCount(state.date);
    const total = activeSections().length;
    const txt = $('#progText');
    if (txt) txt.textContent = `${n} / ${total} 已完成`;
    const bar = document.querySelector('.hero-bar > i');
    if (bar) bar.style.width = `${(n / total) * 100}%`;
    SECTIONS.forEach((s) => {
      const p = progress[state.date] || {};
      const tab = document.querySelector(`.tab[data-id="${s.id}"]`);
      tab?.classList.toggle('done', !!p[s.id]);
      const btn = document.querySelector(`.done-btn[data-sec="${s.id}"]`);
      if (btn) {
        btn.classList.toggle('is-done', !!p[s.id]);
        btn.textContent = p[s.id] ? '✓ 已完成' : '标记完成';
      }
    });
  }

  /* ---------------- 导出全年：打包成一个离线可读的 HTML ---------------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const pgh = (arr) => (Array.isArray(arr) ? arr : []).map((p) => `<p>${esc(p)}</p>`).join('');
  const ul = (arr) => (Array.isArray(arr) && arr.length
    ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');

  function anyBlock(v) {
    if (v == null || v === '') return '';
    if (typeof v === 'string') return `<p>${esc(v)}</p>`;
    if (typeof v === 'number' || typeof v === 'boolean') return `<p>${esc(v)}</p>`;
    if (Array.isArray(v)) return v.map(anyBlock).join('');
    return Object.keys(v).map((k) => `<p><b>${esc(k)}</b>：${esc(typeof v[k] === 'object' ? JSON.stringify(v[k]) : v[k])}</p>`).join('');
  }

  function artBlock(key, seed) {
    if (!key || !window.LEARN_ART || typeof window.LEARN_ART.svg !== 'function') return '';
    try {
      const svg = window.LEARN_ART.svg(key, seed);
      return svg ? `<div class="art">${svg}</div>` : '';
    } catch (e) { return ''; }
  }

  function exportDayHtml(d) {
    const out = [];
    const dt = parseDate(d.date);
    out.push(`<section id="d-${esc(d.date)}"><h2 class="day-h">${dt.getMonth() + 1} 月 ${dt.getDate()} 日 · ${esc(d.weekday || WEEK[dt.getDay()])}<span>${esc(d.theme || '')}</span></h2>`);

    if (d.quote && d.quote.text) {
      out.push(`<blockquote class="q">${esc(d.quote.text)}<cite>${esc(d.quote.author || '')}${d.quote.source ? '《' + esc(d.quote.source) + '》' : ''}</cite></blockquote>`);
    }

    const c = d.chinese || {};
    out.push('<h3>01 · 语文晨读</h3>');
    out.push(`<p class="meta">${esc(c.title || '')}${c.author ? ' · ' + esc(c.author) : ''}${c.tag ? ' · ' + esc(c.tag) : ''}${c.readingTime ? ' · ' + esc(c.readingTime) : ''}</p>`);
    out.push(artBlock(c.image, d.date + '|c'));
    out.push(pgh(c.body));
    if (c.imageCaption) out.push(`<p class="cap">${esc(c.imageCaption)}</p>`);
    if (Array.isArray(c.explain) && c.explain.length) {
      out.push('<h4>讲解</h4>');
      out.push(c.explain.map((x) => `<p><b>${esc(x.line)}</b><br>${esc(x.note)}</p>`).join(''));
    }
    if (Array.isArray(c.words) && c.words.length) {
      out.push('<h4>好词</h4>');
      out.push(c.words.map((x) => `<p><b>${esc(x.w)}</b>　${esc(x.meaning || '')}${x.use ? '<br>例：' + esc(x.use) : ''}</p>`).join(''));
    }
    if (Array.isArray(c.expressions) && c.expressions.length) {
      out.push('<h4>好句</h4>');
      out.push(c.expressions.map((x) => `<p>「${esc(x.s)}」<br><span class="dim">${esc(x.why || '')}</span></p>`).join(''));
    }
    if (Array.isArray(c.techniques) && c.techniques.length) {
      out.push('<h4>写作手法</h4>');
      out.push(c.techniques.map((x) => `<p><b>${esc(x.name)}</b>　${esc(x.desc || '')}${x.example ? '<br><span class="dim">' + esc(x.example) + '</span>' : ''}</p>`).join(''));
    }
    if (c.imitation) out.push('<h4>仿写任务</h4>' + anyBlock(c.imitation));

    const p = d.poem || {};
    out.push('<h3>02 · 古诗文</h3>');
    out.push(`<p class="meta">${esc(p.title || '')}${p.author ? ' · ' + esc(p.author) : ''}${p.dynasty ? '（' + esc(p.dynasty) + '）' : ''}</p>`);
    out.push(artBlock(p.image, d.date + '|p'));
    out.push(`<div class="verse">${(Array.isArray(p.body) ? p.body : []).map((l) => `<p>${esc(l)}</p>`).join('')}</div>`);
    if (Array.isArray(p.notes) && p.notes.length) {
      out.push('<h4>注释</h4>');
      out.push(p.notes.map((x) => `<p><b>${esc(x.line)}</b>　${esc(x.note)}</p>`).join(''));
    }
    if (p.translation) out.push('<h4>译文</h4>' + pgh([p.translation]));
    if (Array.isArray(p.appreciation) && p.appreciation.length) out.push('<h4>赏析</h4>' + pgh(p.appreciation));
    if (p.recite) out.push('<h4>背诵提示</h4>' + pgh([p.recite]));

    const e = d.english || {};
    out.push('<h3>03 · 英文精读</h3>');
    out.push(`<p class="meta">${esc(e.title || '')}${e.level ? ' · ' + esc(e.level) : ''}${e.words ? ' · ' + esc(e.words) + ' 词' : ''}</p>`);
    const eb = Array.isArray(e.body) ? e.body : [];
    const et = Array.isArray(e.translation) ? e.translation : [];
    out.push(eb.map((x, i) => `<p class="en">${esc(x)}</p>${et[i] ? `<p class="cn">${esc(et[i])}</p>` : ''}`).join(''));
    if (Array.isArray(e.vocab) && e.vocab.length) {
      out.push('<h4>重点词汇</h4>');
      out.push(e.vocab.map((x) => `<p><b>${esc(x.w)}</b> <span class="dim">${esc(x.pos || '')} ${esc(x.cn || '')}</span>${x.ex ? '<br>' + esc(x.ex) : ''}</p>`).join(''));
    }
    if (Array.isArray(e.collocations) && e.collocations.length) {
      out.push('<h4>地道搭配</h4>');
      out.push(e.collocations.map((x) => `<p><b>${esc(x.phrase)}</b>　${esc(x.cn || '')}${x.ex ? '<br><span class="dim">' + esc(x.ex) + '</span>' : ''}</p>`).join(''));
    }
    if (Array.isArray(e.phrases) && e.phrases.length) {
      out.push('<h4>短语</h4>');
      out.push(e.phrases.map((x) => `<p><b>${esc(x.p)}</b>　${esc(x.cn || '')}${x.ex ? '<br><span class="dim">' + esc(x.ex) + '</span>' : ''}</p>`).join(''));
    }
    if (Array.isArray(e.patterns) && e.patterns.length) {
      out.push('<h4>句式</h4>');
      out.push(e.patterns.map((x) => `<p><b>${esc(x.s)}</b>　${esc(x.cn || '')}${x.note ? '<br><span class="dim">' + esc(x.note) + '</span>' : ''}</p>`).join(''));
    }
    if (Array.isArray(e.grammar) && e.grammar.length) {
      out.push('<h4>语法</h4>');
      out.push(e.grammar.map((x) => `<p><b>${esc(x.point)}</b><br>${esc(x.explain || '')}${x.example ? '<br><span class="dim">' + esc(x.example) + '</span>' : ''}</p>`).join(''));
    }
    if (e.summary) out.push('<h4>中文摘要</h4>' + pgh([e.summary]));
    if (Array.isArray(e.questions) && e.questions.length) {
      out.push('<h4>阅读题</h4>');
      out.push(e.questions.map((q, i) => {
        const opts = (q.options || []).map((o, j) => `<p class="opt${j === q.answer ? ' right' : ''}">${'ABCDEFG'[j]}. ${esc(o)}</p>`).join('');
        return `<div class="qbox"><p class="qt"><b>${i + 1}.</b> ${esc(q.q)}</p>${opts}${q.explain ? `<p class="dim">解析：${esc(q.explain)}</p>` : ''}</div>`;
      }).join(''));
    }
    if (e.output) out.push('<h4>输出任务</h4>' + anyBlock(e.output));

    const l = d.listening || {};
    out.push('<h3>04 · 英语听力</h3>');
    out.push(`<p class="meta">${esc(l.title || '')}${l.level ? ' · ' + esc(l.level) : ''}${l.topic ? ' · ' + esc(l.topic) : ''}</p>`);
    out.push((Array.isArray(l.lines) ? l.lines : []).map((x) => `<p class="en">${esc(x.en)}</p>${x.cn ? `<p class="cn">${esc(x.cn)}</p>` : ''}`).join(''));
    if (l.note) out.push(`<p class="dim">${esc(l.note)}</p>`);

    if (Array.isArray(d.checklist) && d.checklist.length) {
      out.push('<h3>05 · 今日清单</h3><ul class="tasks">');
      out.push(d.checklist.map((x) => `<li>☐ ${esc(typeof x === 'string' ? x : x.text)}${x.tip ? '<br><span class="dim">' + esc(x.tip) + '</span>' : ''}</li>`).join(''));
      out.push('</ul>');
    }

    out.push('</section>');
    return out.join('\n');
  }

  const EXPORT_CSS = `
:root{--ink:#23282b;--ink2:#4a5257;--dim:#7d868c;--line:#ddd6c8;--bg:#faf7f1;--accent:#b14d33;--teal:#2c6e68;--gold:#9a7223}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.9 "Songti SC",Georgia,serif}
.wrap{max-width:760px;margin:0 auto;padding:28px 20px 80px}
h1{font-size:26px;margin:0 0 6px;letter-spacing:.04em}
.sub{color:var(--dim);font-size:13px;margin:0 0 22px}
.toc{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 30px;padding:0;list-style:none}
.toc a{font-size:13px;padding:4px 9px;border:1px solid var(--line);border-radius:999px;color:var(--ink2);text-decoration:none}
section{margin:0 0 56px;padding:0 0 26px;border-bottom:1px solid var(--line)}
.day-h{font-size:20px;margin:0 0 18px;padding-top:10px}
.day-h span{display:block;font-size:13px;color:var(--accent);font-weight:400;margin-top:2px}
h3{font-size:14px;letter-spacing:.1em;color:var(--teal);margin:26px 0 10px;font-weight:600}
h4{font-size:14px;margin:20px 0 8px;color:var(--ink2)}
p{margin:0 0 12px}
.meta{font-size:13px;color:var(--dim)}
.dim{color:var(--dim);font-size:13px}
.cap{font-size:12.5px;color:var(--dim);font-style:italic}
.q{margin:0 0 20px;padding:14px 18px;border-left:3px solid var(--accent);background:#f3ecdd}
.q cite{display:block;margin-top:6px;font-size:12.5px;color:var(--dim);font-style:normal}
.verse p{margin:0;line-height:2.1;font-size:17px}
.en{font-family:Georgia,"Times New Roman",serif;font-size:16.5px}
.cn{color:var(--ink2);font-size:14.5px;background:#f4f0e6;padding:6px 10px;border-radius:6px}
.qbox{margin:0 0 14px;padding:10px 12px;background:#fff;border:1px solid var(--line);border-radius:8px}
.qt{margin:0 0 6px}
.opt{margin:0;font-size:14.5px;color:var(--ink2)}
.right{color:var(--teal);font-weight:600}
.tasks{list-style:none;padding:0}
.tasks li{margin:0 0 8px;font-size:14.5px}
.art{margin:0 0 16px;border-radius:10px;overflow:hidden;background:#f3ecdd}
.art svg{display:block;width:100%;height:auto}
@media print{body{background:#fff}.art{page-break-inside:avoid}section{page-break-after:always;border:0}.toc{display:none}}
`;

  function yearHtml(year, days) {
    const toc = days.map((d) => {
      const dt = parseDate(d.date);
      return `<li><a href="#d-${esc(d.date)}">${dt.getMonth() + 1}/${dt.getDate()} ${esc(d.theme || '')}</a></li>`;
    }).join('');
    return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>每日一学 · ${esc(year)} 年合集</title>
<style>${EXPORT_CSS}</style></head>
<body><div class="wrap">
<h1>每日一学 · ${esc(year)} 年</h1>
<p class="sub">共 ${days.length} 天 · 语文晨读 / 古诗文 / 英文精读 / 英语听力 / AI · 生成于 ${esc(fmtDate(new Date()))}</p>
<ul class="toc">${toc}</ul>
${days.map(exportDayHtml).join('\n')}
</div></body></html>`;
  }

  async function exportYear(btn) {
    const year = state.date.slice(0, 4);
    const dates = state.dates.filter((x) => x.startsWith(year + '-')).slice().sort();
    const days = [];
    for (let i = 0; i < dates.length; i++) {
      if (btn) btn.textContent = `导出中… ${i + 1} / ${dates.length}`;
      delete window.LEARN_DAY;
      try { await loadScript(`data/days/${dates[i]}.js`); } catch (e) { continue; }
      if (window.LEARN_DAY) days.push(window.LEARN_DAY);
    }
    /* 导出过程中把当天数据换掉了，收尾要还原，页面才不会被误伤 */
    delete window.LEARN_DAY;
    try { await loadScript(`data/days/${state.date}.js`); state.day = window.LEARN_DAY; } catch (e) { /* 忽略 */ }

    if (!days.length) { if (btn) btn.textContent = '这一年没有内容'; return; }
    const html = yearHtml(year, days);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: `每日一学-${year}.html` });
    document.body.append(a);
    a.click();
    setTimeout(() => { a.remove(); try { URL.revokeObjectURL(url); } catch (e) { /* 忽略 */ } }, 5000);
    if (btn) btn.textContent = `✓ 已导出 ${days.length} 天`;
  }

  /* ---------------- 每页的标题 / 描述 / 分享卡片 ----------------
     原来全站共用一个 <title>，19 天内容在搜索结果里长得一模一样；
     og:* 一个都没有，分享到微信/微博不会出卡片。这里按当天内容同步更新。 */
  const SITE_URL = 'https://qing-qian152.github.io/knowledges-shared-station/';

  function upsertMeta(selector, attrs) {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
      const m = selector.match(/\[(name|property|rel)="([^"]+)"\]/);
      if (m) el.setAttribute(m[1], m[2]);
      document.head.appendChild(el);
    }
    Object.entries(attrs || {}).forEach(([k, v]) => { if (v) el.setAttribute(k, v); });
    return el;
  }

  function daySummary(d) {
    const parts = [];
    if (d.quote && d.quote.text) parts.push(d.quote.text);
    if (d.chinese && d.chinese.title) parts.push(`晨读《${d.chinese.title}》`);
    if (d.poem && d.poem.title) parts.push(`古诗《${d.poem.title}》`);
    if (d.english && d.english.title) parts.push(`英文精读 ${d.english.title}`);
    if (d.listening && d.listening.title) parts.push(`听力 ${d.listening.title}`);
    return parts.join(' · ');
  }

  function syncMeta(d) {
    const dt = parseDate(state.date);
    const md = `${dt.getMonth() + 1} 月 ${dt.getDate()} 日`;
    const theme = (d && d.theme) || '每日一学';
    const title = `${md} · ${theme} — 每日一学`;
    const desc = daySummary(d || {}) || '每天一篇原创散文、一首古诗、一篇雅思级英文精读、一段自创美音听力。';
    const url = `${SITE_URL}?d=${state.date}`;
    const img = new URL('assets/icon-512.png', SITE_URL).href;

    document.title = title;
    upsertMeta('meta[name="description"]', { content: desc.slice(0, 150) });
    upsertMeta('link[rel="canonical"]', { href: url });
    upsertMeta('meta[property="og:title"]', { content: title });
    upsertMeta('meta[property="og:description"]', { content: desc.slice(0, 150) });
    upsertMeta('meta[property="og:url"]', { content: url });
    upsertMeta('meta[property="og:type"]', { content: 'article' });
    upsertMeta('meta[property="og:image"]', { content: img });
    upsertMeta('meta[name="twitter:card"]', { content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { content: title });
    upsertMeta('meta[name="twitter:description"]', { content: desc.slice(0, 150) });

    /* 结构化数据：让搜索引擎知道这是一篇带日期的阅读内容 */
    let ld = document.getElementById('ld-json');
    if (!ld) {
      ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.id = 'ld-json';
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${md} · ${theme}`,
      description: desc.slice(0, 150),
      datePublished: state.date,
      inLanguage: 'zh-CN',
      image: img,
      url,
      isPartOf: { '@type': 'WebSite', name: '每日一学', url: SITE_URL },
      author: { '@type': 'Person', name: '每日一学作者' },
      publisher: { '@type': 'Organization', name: '每日一学' },
      articleSection: ['语文晨读', '古诗文', '英文精读', '英语听力'],
    });
  }

  /* ---------------- 分享 / 个人数据搬家 ---------------- */

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.append(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  async function shareToday() {
    const url = `${SITE_URL}?d=${state.date}`;
    const title = document.title;
    const text = daySummary(state.day || {});
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;  // 用户自己取消，不必兜底
      }
    }
    try {
      await navigator.clipboard.writeText(`${title}\n${url}`);
      toast('链接已复制，去粘贴给朋友吧');
    } catch (e) {
      window.prompt('复制下面这个链接分享：', url);
    }
  }

  /* 笔记 / 错题本 / 打卡这些只存在浏览器里，清缓存或换设备就没了 —— 给一个搬家的出口 */
  const DATA_KEYS = ['dl.progress', 'dl.notes', 'dl.answers', 'dl.wrong', 'dl.meta', 'dl.tasks', 'dl.listen'];

  function exportData() {
    const dump = { app: '每日一学', version: 1, exportedAt: new Date().toISOString(), data: {} };
    DATA_KEYS.forEach((k) => {
      const raw = Store.get(k, null);
      if (raw !== null) dump.data[k] = raw;
    });
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: `每日一学-我的数据-${fmtDate(new Date())}.json` });
    document.body.append(a);
    a.click();
    setTimeout(() => { a.remove(); try { URL.revokeObjectURL(url); } catch (e) { /* 忽略 */ } }, 5000);
    const n = Object.keys(dump.data).length;
    toast(n ? '已导出你的学习记录' : '还没有可导出的记录');
  }

  function importData() {
    const input = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
    document.body.append(input);
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) { input.remove(); return; }
      const fr = new FileReader();
      fr.onload = () => {
        input.remove();
        let dump;
        try { dump = JSON.parse(String(fr.result)); } catch (e) { toast('这个文件不是有效的 JSON'); return; }
        if (!dump || !dump.data || typeof dump.data !== 'object') { toast('文件格式不对，缺少 data 字段'); return; }
        const keys = Object.keys(dump.data).filter((k) => DATA_KEYS.includes(k));
        if (!keys.length) { toast('文件里没有可识别的记录'); return; }
        if (!window.confirm(`将导入 ${keys.length} 类记录（${keys.join('、')}），同名的现有记录会被覆盖。继续吗？`)) return;
        keys.forEach((k) => Store.set(k, dump.data[k]));
        toast('导入完成，正在刷新…');
        setTimeout(() => location.reload(), 600);
      };
      fr.readAsText(file);
    });
    input.click();
  }

  /* ---------------- 往期存档 ----------------
     以前历史日期只能靠 <select> 切换，页面里一个指向历史内容的链接都没有，
     搜索引擎永远只看到一个首页。这里输出真实的 a[href="?d=日期"]，
     既不依赖 JS 也能打开，也让每天的内容都能被抓到。 */
  function renderArchive() {
    const idx = new Map((window.LEARN_INDEX || []).map((x) => [x.date, x]));
    const groups = new Map();
    state.dates.forEach((d) => {
      const key = d.slice(0, 7);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(d);
    });

    const box = h('nav', { class: 'archive', 'aria-label': '往期内容' },
      h('h3', { class: 'archive-h' }, '往期'));

    [...groups.keys()].forEach((key, gi) => {
      const [y, m] = key.split('-').map(Number);
      const list = groups.get(key);
      const det = h('details', { class: 'archive-month' });
      if (gi === 0) det.setAttribute('open', '');
      det.append(h('summary', null, `${y} 年 ${m} 月 · ${list.length} 天`));

      const ul = h('ul', { class: 'archive-list' });
      list.forEach((d) => {
        const dt = parseDate(d);
        const theme = (idx.get(d) || {}).theme || '';
        const cur = d === state.date;
        const a = h('a', {
          href: `?d=${d}`,
          class: cur ? 'on' : null,
          'aria-current': cur ? 'true' : null,
        },
          h('b', null, `${dt.getMonth() + 1}/${dt.getDate()}`),
          ` ${WEEK[dt.getDay()]}${theme ? ' · ' + theme : ''}`);
        /* 站内跳转仍然走无刷新，但 href 保留给爬虫和无 JS 环境 */
        a.addEventListener('click', (ev) => {
          if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
          ev.preventDefault();
          switchDay(d);
        });
        ul.append(h('li', null, a));
      });
      det.append(ul);
      box.append(det);
    });
    return box;
  }

  function renderFooter(day) {
    const f = $('#footer');
    if (!f) return;
    f.innerHTML = '';

    const n = doneCount(state.date);
    const total = activeSections().length;
    const checked = !!meta.checkin[state.date];
    const streak = calcStreak();

    const btn = h('button', { class: 'btn' + (checked ? ' ghost' : '') });
    btn.textContent = checked ? '✓ 今日已打卡' : '今日打卡';
    btn.addEventListener('click', () => {
      if (meta.checkin[state.date]) delete meta.checkin[state.date];
      else meta.checkin[state.date] = 1;
      Store.set('dl.meta', meta);
      renderFooter(day);
    });

    f.append(h('div', { class: 'checkin' },
      h('div', { class: 'checkin-txt' },
        h('div', null, `今日完成 `, h('b', null, `${n} / ${total}`), ' 个板块'),
        h('div', { style: 'margin-top:4px' },
          '连续打卡 ', h('span', { class: 'streak' }, String(streak)), ' 天',
          ' · 共完成 ', String(Object.keys(progress).filter((k) => doneCount(k) > 0).length), ' 天')),
      btn));

    const wb = h('details', { class: 'wrongbook' },
      h('summary', null, `错题本（${wrongs.length}）`));
    if (!wrongs.length) {
      wb.append(h('div', { class: 'empty' }, '还没有错题。答错会自动收进来。'));
    } else {
      const list = h('div');
      wrongs.slice(0, 30).forEach((w) => {
        const letter = 'ABCDEFG'[w.ans] || '?';
        list.append(h('div', { class: 'wrong-item' },
          h('div', { class: 'wq' }, w.q),
          h('div', { class: 'wa' }, `正确答案 ${letter} · 你的选择 ${'ABCDEFG'[w.chosen] || '?'} · ${w.date}`),
          w.explain ? h('div', { class: 'wa', style: 'margin-top:2px' }, w.explain) : null));
      });
      const clearBtn = h('button', { class: 'btn small ghost', style: 'margin-top:10px' }, '清空错题本');
      clearBtn.addEventListener('click', () => {
        wrongs.length = 0;
        Store.set('dl.wrong', wrongs);
        renderFooter(day);
      });
      wb.append(list, clearBtn);
    }
    f.append(wb);

    /* 导出：把这一年已生成的内容打包成一个可离线阅读的 HTML */
    const year = state.date.slice(0, 4);
    const years = Array.from(new Set(state.dates.map((x) => x.slice(0, 4)))).sort().reverse();
    const expBtn = h('button', { class: 'btn small ghost' }, `⤓ 导出 ${year} 年（离线 HTML）`);
    expBtn.addEventListener('click', () => exportYear(expBtn));
    const row = h('div', { class: 'export-row' }, expBtn,
      h('span', { class: 'export-hint' },
        years.length > 1
          ? `把 ${year} 年的 ${state.dates.filter((x) => x.startsWith(year + '-')).length} 天内容打包成一个网页文件，断网也能读`
          : '把这一年所有内容打包成一个网页文件，断网也能读'));
    f.append(row);

    /* 分享 + 个人学习记录的搬家通道 */
    const shareBtn = h('button', { class: 'btn small ghost' }, '↗ 分享今天');
    shareBtn.addEventListener('click', shareToday);
    const expDataBtn = h('button', { class: 'btn small ghost' }, '⤓ 导出我的记录');
    expDataBtn.addEventListener('click', exportData);
    const impDataBtn = h('button', { class: 'btn small ghost' }, '⤒ 导入记录');
    impDataBtn.addEventListener('click', importData);
    f.append(h('div', { class: 'export-row' }, shareBtn, expDataBtn, impDataBtn,
      h('span', { class: 'export-hint' },
        '笔记、错题本、打卡都存在这台设备上，换设备前先导出')));
    f.append(renderArchive());
  }

  function calcStreak() {
    const set = new Set(Object.keys(meta.checkin).filter((k) => meta.checkin[k]));
    if (!set.size) return 0;
    let d = parseDate(state.date);
    if (!set.has(fmtDate(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (set.has(fmtDate(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ---------------- 滚动高亮 ---------------- */

  function observeSections() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id.replace('sec-', '');
        document.querySelectorAll('.tab').forEach((t) => {
          const on = t.dataset.id === id;
          t.classList.toggle('active', on);
          /* 屏幕阅读器需要知道当前停在哪一段 */
          if (on) t.setAttribute('aria-current', 'true');
          else t.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-120px 0px -70% 0px', threshold: 0 });
    document.querySelectorAll('.card').forEach((c) => io.observe(c));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
