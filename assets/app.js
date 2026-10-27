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
    { id: 'ai',        name: 'AI',   icon: '✦',  kicker: '05 · AI 一小时' },
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
    { text: '学一个 AI 概念', tip: '能用一句话讲给别人听才算会' },
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

  function dayProgress(date) { return progress[date] || (progress[date] = {}); }

  function doneCount(date) {
    const p = progress[date] || {};
    return SECTIONS.filter((s) => p[s.id]).length;
  }

  /* ---------------- 主题 ---------------- */

  function applyTheme(t) {
    meta.theme = t;
    Store.set('dl.meta', meta);
    document.documentElement.dataset.theme = t;
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', t === 'dark' ? '#14130f' : '#faf7f1');
  }

  /* ---------------- 启动 ---------------- */

  async function init() {
    applyTheme(meta.theme || 'light');

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
    state.date = state.dates.includes(today) ? today : state.dates[0];

    buildDateSelect();
    buildTabs();
    $('#themeBtn').addEventListener('click', () => applyTheme(meta.theme === 'dark' ? 'light' : 'dark'));

    await switchDay(state.date);
  }

  function buildDateSelect() {
    const sel = $('#dateSel');
    sel.innerHTML = '';
    state.dates.forEach((d) => {
      const dt = parseDate(d);
      const opt = h('option', { value: d }, `${dt.getMonth() + 1}月${dt.getDate()}日 · ${WEEK[dt.getDay()]}`);
      sel.append(opt);
    });
    sel.value = state.date;
    sel.addEventListener('change', () => switchDay(sel.value));
  }

  function buildTabs() {
    const nav = $('#tabs');
    nav.innerHTML = '';
    SECTIONS.forEach((s) => {
      const a = h('a', { class: 'tab', href: `#sec-${s.id}`, 'data-id': s.id },
        h('span', { class: 'dot' }),
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
    main.append(renderAI(d.ai));
    main.append(renderChecklist(d.checklist));

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

  function renderHero(d) {
    const p = dayProgress(state.date);
    const bar = h('i');
    const txt = h('span', { id: 'progText' });
    const sec = h('section', { class: 'hero' },
      h('div', { class: 'hero-date' }, `${d.date} · ${d.weekday || WEEK[parseDate(d.date).getDay()]}`),
      h('h1', { class: 'hero-title' }, d.theme || '今日一学'),
      h('div', { class: 'hero-meta' }, txt, h('div', { class: 'hero-bar' }, bar)));
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
    const rateSel = h('select', { class: 'speed-sel' },
      h('option', { value: '0.8' }, '0.8× 慢'),
      h('option', { value: '0.95', selected: 'selected' }, '0.95×'),
      h('option', { value: '1.1' }, '1.1× 快'));

    body.append(
      h('div', { class: 'listen-controls' }, playBtn, stopBtn, rateSel, transBtn),
      h('div', { class: 'listen-lines' }, nodes),
      l.note ? h('div', { class: 'listen-note' }, l.note) : null,
      block('怎么听（四步）', h('ol', { class: 'note-list' },
        h('li', null, '先不看文本，点播放听两遍，抓大意：谁、发生了什么、态度是什么。'),
        h('li', null, '第三遍盯着文本听，把听不清的地方标出来——那就是你的盲区。'),
        h('li', null, '跟读一遍，模仿连读、弱读和句子重音，不必每个词都发准。'),
        h('li', null, '打开译文确认每句都懂；隔一天再盲听一次。'))));

    const synth = window.speechSynthesis;
    const U = window.SpeechSynthesisUtterance;
    let voice = null, playing = false;

    function pickVoice() {
      const vs = (synth && synth.getVoices && synth.getVoices()) || [];
      const score = (v) => {
        let s = 0;
        if (/^en[-_]US/i.test(v.lang)) s += 10;
        else if (/^en[-_]GB/i.test(v.lang)) s += 6;
        else if (/^en/i.test(v.lang)) s += 4;
        if (/natural|neural|aria|jenny|guy|samantha|google us english|zira/i.test(v.name || '')) s += 5;
        return s;
      };
      return vs.slice().sort((a, b) => score(b) - score(a))[0] || null;
    }
    voice = pickVoice();
    if (synth && synth.addEventListener) {
      synth.addEventListener('voiceschanged', () => { voice = pickVoice(); });
    }

    function clearHi() { nodes.forEach((n) => n.classList.remove('playing')); }

    function done() {
      playing = false;
      clearHi();
      playBtn.textContent = '▶ 播放';
    }

    function speakAt(i) {
      if (!synth || !U) { playBtn.textContent = '此浏览器不支持朗读'; playing = false; return; }
      if (i >= lines.length) { done(); return; }
      clearHi();
      nodes[i].classList.add('playing');
      try {
        if (nodes[i].scrollIntoView) nodes[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch { /* 有的环境不支持参数 */ }
      const u = new U(lines[i].en);
      u.lang = 'en-US';
      if (voice) u.voice = voice;
      u.rate = parseFloat(rateSel.value) || 0.95;
      u.pitch = 1;
      u.onend = () => { if (playing) speakAt(i + 1); };
      u.onerror = () => { if (playing) speakAt(i + 1); };
      synth.speak(u);
    }

    playBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!synth) { playBtn.textContent = '此浏览器不支持朗读'; return; }
      synth.cancel();
      playing = true;
      playBtn.textContent = '❚❚ 停止';
      speakAt(0);
    });

    stopBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (synth) synth.cancel();
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

  /* ---- 05 AI ---- */
  function renderAI(a) {
    const { card, body } = sectionCard(SECTIONS[4]);
    body.append(
      h('div', { class: 'kicker' }, '今日概念'),
      h('div', { class: 'ai-term' }, a.term),
      h('div', { class: 'ai-oneliner' }, h('b', null, '一句话：'), a.oneLiner));

    if (a.explain?.length) {
      body.append(block('讲清楚', h('div', { class: 'prose', style: 'font-family:var(--ff-sans);font-size:15px;line-height:1.9' },
        a.explain.map((p) => h('p', { style: 'text-indent:0;margin-bottom:12px' }, p)))));
    }

    if (a.analogy) body.append(block('打个比方', h('div', { class: 'callout teal' }, a.analogy)));
    if (a.example) body.append(block('实际长什么样', h('div', { class: 'callout' }, a.example)));
    if (a.takeaway) body.append(block('记这一句就够', h('div', { class: 'callout gold' }, h('b', null, '要点：'), a.takeaway)));

    if (a.quiz) {
      const q = a.quiz;
      body.append(block('小测一下', quizCard({ ...q, _single: true }, 0, 'ai')));
    }

    if (a.next) body.append(h('div', { class: 'save-hint', style: 'margin-top:14px' }, '明天：' + a.next));

    return card;
  }

  /* ---- 06 今日清单 ---- */
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
        h('div', { class: 'kicker' }, '06 · 今日清单'),
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
    const total = SECTIONS.length;
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

  function renderFooter(day) {
    const f = $('#footer');
    if (!f) return;
    f.innerHTML = '';

    const n = doneCount(state.date);
    const total = SECTIONS.length;
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
        document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.id === id));
      });
    }, { rootMargin: '-120px 0px -70% 0px', threshold: 0 });
    document.querySelectorAll('.card').forEach((c) => io.observe(c));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
