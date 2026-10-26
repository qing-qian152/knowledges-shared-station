/* 每日一学 —— 内置水墨插图
   全部由代码生成，无外部图片、无版权问题、离线可用。
   数据里只写场景名（image: "lotus-moon"），这里查到就渲染。 */

window.LEARN_ART = (() => {
  'use strict';

  const W = 800, H = 320;

  /* 确定性随机：同一天同一张图，刷几次都一样 */
  function rnd(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* 一条起伏的山脊线 */
  function ridge(r, baseY, amp, segs, jag) {
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const x = (W / segs) * i;
      const y = baseY - amp * (0.45 + 0.55 * r()) - (jag ? jag * (r() - 0.5) : 0);
      pts.push([x, y]);
    }
    let d = `M -20 ${H} L ${pts[0][0]} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      d += ` Q ${cx.toFixed(1)} ${(y0 - amp * 0.25 * r()).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    }
    d += ` L ${W + 20} ${H} Z`;
    return d;
  }

  function water(y) {
    return `<rect x="0" y="${y}" width="${W}" height="${H - y}" fill="var(--art-water)"/>`;
  }

  function ripples(r, y0, n, color) {
    let out = '';
    for (let i = 0; i < n; i++) {
      const y = y0 + r() * (H - y0 - 10);
      const x = r() * W * 0.9;
      const w = 40 + r() * 190;
      out += `<path d="M ${x.toFixed(0)} ${y.toFixed(0)} q ${(w / 2).toFixed(0)} ${(-3 - r() * 4).toFixed(0)} ${w.toFixed(0)} 0" fill="none" stroke="${color}" stroke-width="${(0.8 + r() * 1.1).toFixed(1)}" opacity="${(0.18 + r() * 0.3).toFixed(2)}"/>`;
    }
    return out;
  }

  function moon(cx, cy, rad) {
    return `<circle cx="${cx}" cy="${cy}" r="${rad * 2.6}" fill="var(--art-glow)" opacity=".32"/>
      <circle cx="${cx}" cy="${cy}" r="${rad * 1.7}" fill="var(--art-glow)" opacity=".45"/>
      <circle cx="${cx}" cy="${cy}" r="${rad}" fill="var(--art-moon)"/>`;
  }

  function stars(r, n, top) {
    let out = '';
    for (let i = 0; i < n; i++) {
      out += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * top).toFixed(0)}" r="${(0.7 + r() * 1.2).toFixed(1)}" fill="var(--art-moon)" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`;
    }
    return out;
  }

  /* ---------------- 场景 ---------------- */

  function lotusMoon() {
    const r = rnd(7);
    let leaves = '';
    for (let i = 0; i < 11; i++) {
      const cx = 40 + r() * 720, cy = 196 + r() * 110;
      const rx = 34 + r() * 46, ry = 10 + r() * 12;
      leaves += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="var(--art-near)" opacity="${(0.35 + r() * 0.45).toFixed(2)}"/>`;
    }
    let buds = '';
    for (let i = 0; i < 4; i++) {
      const cx = 90 + r() * 620, cy = 168 + r() * 60;
      buds += `<path d="M ${cx.toFixed(0)} ${cy.toFixed(0)} q 7 -26 0 -40 q -7 14 0 40" fill="var(--art-blossom)" opacity=".9"/>`;
    }
    return `<defs><linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--art-sky-2)"/><stop offset="1" stop-color="var(--art-sky)"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sky1)"/>
      ${stars(r, 26, 150)}
      ${moon(646, 74, 26)}
      <path d="${ridge(r, 186, 58, 7)}" fill="var(--art-far)" opacity=".55"/>
      ${water(190)}${ripples(r, 200, 16, 'var(--art-line)')}
      ${leaves}${buds}`;
  }

  function autumnMountain() {
    const r = rnd(21);
    let pines = '';
    for (let i = 0; i < 7; i++) {
      const x = 60 + r() * 660, y = 250 + r() * 40, s = 12 + r() * 14;
      pines += `<path d="M ${x.toFixed(0)} ${y.toFixed(0)} l ${(-s).toFixed(0)} 0 l ${s.toFixed(0)} ${(-s * 2.4).toFixed(0)} l ${s.toFixed(0)} ${(s * 2.4).toFixed(0)} Z" fill="var(--art-near)" opacity=".85"/>`;
    }
    return `<defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--art-sky)"/><stop offset="1" stop-color="var(--art-water)"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sky2)"/>
      ${moon(168, 66, 20)}
      <path d="${ridge(r, 200, 110, 5, 40)}" fill="var(--art-far)" opacity=".42"/>
      <path d="${ridge(r, 236, 76, 6, 26)}" fill="var(--art-far)" opacity=".65"/>
      <rect x="0" y="268" width="${W}" height="${H - 268}" fill="var(--art-water)"/>
      ${ripples(r, 276, 9, 'var(--art-line)')}
      ${pines}`;
  }

  function bamboo() {
    const r = rnd(33);
    let stalks = '';
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 120 + r() * 40;
      const w = 6 + r() * 7;
      stalks += `<rect x="${x.toFixed(0)}" y="${(30 + r() * 40).toFixed(0)}" width="${w.toFixed(0)}" height="${H}" fill="var(--art-near)" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`;
      for (let k = 0; k < 7; k++) {
        const ly = 70 + k * 34 + r() * 10;
        const dir = r() > 0.5 ? 1 : -1;
        stalks += `<path d="M ${(x + w / 2).toFixed(0)} ${ly.toFixed(0)} q ${(dir * 46).toFixed(0)} ${(-16 - r() * 18).toFixed(0)} ${(dir * 96).toFixed(0)} ${(-6 - r() * 14).toFixed(0)} q ${(dir * -40).toFixed(0)} 12 ${(dir * -96).toFixed(0)} ${(6 + r() * 14).toFixed(0)} Z" fill="var(--art-far)" opacity="${(0.55 + r() * 0.35).toFixed(2)}"/>`;
      }
    }
    return `<rect width="${W}" height="${H}" fill="var(--art-sky)"/>
      <rect x="0" y="250" width="${W}" height="${H - 250}" fill="var(--art-water)" opacity=".7"/>
      ${stalks}`;
  }

  function snowPeak() {
    const r = rnd(44);
    let flakes = '';
    for (let i = 0; i < 60; i++) {
      flakes += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="var(--art-moon)" opacity="${(0.3 + r() * 0.5).toFixed(2)}"/>`;
    }
    return `<defs><linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--art-sky-2)"/><stop offset="1" stop-color="var(--art-sky)"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sky3)"/>
      <path d="${ridge(r, 210, 130, 4, 60)}" fill="var(--art-far)" opacity=".4"/>
      <path d="${ridge(r, 250, 96, 5, 40)}" fill="var(--art-far)" opacity=".7"/>
      <rect x="0" y="272" width="${W}" height="${H - 272}" fill="var(--art-water)"/>
      ${flakes}`;
  }

  function springRiver() {
    const r = rnd(55);
    let blooms = '';
    for (let i = 0; i < 26; i++) {
      blooms += `<circle cx="${(r() * W).toFixed(0)}" cy="${(60 + r() * 190).toFixed(0)}" r="${(1.6 + r() * 3).toFixed(1)}" fill="var(--art-blossom)" opacity="${(0.3 + r() * 0.5).toFixed(2)}"/>`;
    }
    return `<defs><linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--art-sky)"/><stop offset="1" stop-color="var(--art-water)"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sky4)"/>
      <path d="${ridge(r, 176, 74, 6, 22)}" fill="var(--art-far)" opacity=".38"/>
      <rect x="0" y="196" width="${W}" height="${H - 196}" fill="var(--art-water)"/>
      ${ripples(r, 206, 18, 'var(--art-line)')}
      <path d="M 300 244 q 44 22 96 0 l -14 18 q -34 14 -68 0 Z" fill="var(--art-near)" opacity=".8"/>
      <path d="M 392 240 l 34 -30 l 4 30 Z" fill="var(--art-near)" opacity=".6"/>
      ${blooms}`;
  }

  function rainWindow() {
    const r = rnd(66);
    let rain = '';
    for (let i = 0; i < 70; i++) {
      const x = r() * W, y = r() * H, len = 18 + r() * 34;
      rain += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 8).toFixed(0)}" y2="${(y + len).toFixed(0)}" stroke="var(--art-moon)" stroke-width="1.2" opacity="${(0.18 + r() * 0.3).toFixed(2)}"/>`;
    }
    return `<rect width="${W}" height="${H}" fill="var(--art-sky-2)"/>
      <path d="${ridge(r, 210, 90, 5, 30)}" fill="var(--art-far)" opacity=".45"/>
      <rect x="0" y="228" width="${W}" height="${H - 228}" fill="var(--art-water)" opacity=".8"/>
      ${rain}
      <rect x="0" y="0" width="${W}" height="10" fill="var(--art-near)" opacity=".5"/>`;
  }

  function dunes() {
    const r = rnd(77);
    return `<defs><linearGradient id="sky5" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--art-sky)"/><stop offset="1" stop-color="var(--art-sky-2)"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sky5)"/>
      <circle cx="620" cy="112" r="34" fill="var(--art-moon)" opacity=".85"/>
      <path d="M 0 236 q 200 -70 420 -18 q 220 52 380 -14 L ${W} ${H} L 0 ${H} Z" fill="var(--art-far)" opacity=".5"/>
      <path d="M 0 280 q 260 -46 470 -6 q 180 34 330 -8 L ${W} ${H} L 0 ${H} Z" fill="var(--art-near)" opacity=".7"/>
      ${ripples(r, 292, 5, 'var(--art-line)')}`;
  }

  function lamp() {
    const r = rnd(88);
    let pages = '';
    for (let i = 0; i < 6; i++) {
      pages += `<line x1="${(250 + r() * 30).toFixed(0)}" y1="${(238 + i * 11).toFixed(0)}" x2="${(470 + r() * 40).toFixed(0)}" y2="${(238 + i * 11).toFixed(0)}" stroke="var(--art-line)" stroke-width="2" opacity=".55"/>`;
    }
    return `<rect width="${W}" height="${H}" fill="var(--art-sky-2)"/>
      <path d="M 430 300 L 640 70 L 700 70 L 560 300 Z" fill="var(--art-glow)" opacity=".28"/>
      <circle cx="600" cy="86" r="16" fill="var(--art-moon)"/>
      <rect x="588" y="100" width="24" height="6" rx="3" fill="var(--art-near)" opacity=".7"/>
      <rect x="240" y="232" width="300" height="70" rx="6" fill="var(--art-near)" opacity=".28"/>
      ${pages}
      <rect x="0" y="300" width="${W}" height="${H - 300}" fill="var(--art-near)" opacity=".25"/>`;
  }

  function paper() {
    const r = rnd(99);
    let blot = '';
    for (let i = 0; i < 9; i++) {
      blot += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(20 + r() * 70).toFixed(0)}" fill="var(--art-far)" opacity="${(0.05 + r() * 0.07).toFixed(2)}"/>`;
    }
    return `<rect width="${W}" height="${H}" fill="var(--art-sky)"/>${blot}
      <path d="${ridge(r, 240, 60, 6, 18)}" fill="var(--art-far)" opacity=".22"/>`;
  }

  const SCENES = {
    'lotus-moon': { label: '荷塘月色', draw: lotusMoon },
    'autumn-mountain': { label: '山间秋意', draw: autumnMountain },
    'bamboo': { label: '竹林清影', draw: bamboo },
    'snow-peak': { label: '雪岭', draw: snowPeak },
    'spring-river': { label: '春江', draw: springRiver },
    'rain-window': { label: '雨窗', draw: rainWindow },
    'dunes': { label: '大漠孤烟', draw: dunes },
    'lamp': { label: '灯下', draw: lamp },
    'paper': { label: '素纸', draw: paper },
  };

  const KEYS = Object.keys(SCENES);

  function svg(key) {
    const s = SCENES[key] || SCENES.paper;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${s.label}">${s.draw()}</svg>`;
  }

  function label(key) { return (SCENES[key] || SCENES.paper).label; }

  return { svg, label, keys: KEYS };
})();
