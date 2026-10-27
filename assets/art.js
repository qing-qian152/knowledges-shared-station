/* 每日一学 —— 内置水墨插图
   全部由代码生成，无外部图片、无版权问题、离线可用。
   数据里只写场景名（image: "lotus-moon"），这里查到就渲染。
   同一天同一个场景每次刷都一样；换一天，因为 seed 变了，构图和笔触会重新随机。 */

window.LEARN_ART = (() => {
  'use strict';

  const W = 800, H = 320;

  /* 确定性随机 */
  function rnd(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
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

  function grad(id, top, bottom) {
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/>
    </linearGradient></defs>`;
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

  function birds(r, n, y0) {
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = 80 + r() * 620, y = y0 + r() * 60, s = 4 + r() * 5;
      out += `<path d="M ${x.toFixed(0)} ${y.toFixed(0)} q ${s.toFixed(0)} ${(-s * 0.8).toFixed(0)} ${(s * 2).toFixed(0)} 0 q ${s.toFixed(0)} ${(-s * 0.8).toFixed(0)} ${(s * 2).toFixed(0)} 0" fill="none" stroke="var(--art-line)" stroke-width="1.4" opacity="${(0.3 + r() * 0.3).toFixed(2)}"/>`;
    }
    return out;
  }

  function blossoms(r, n, color, y0, y1, rad) {
    let out = '';
    for (let i = 0; i < n; i++) {
      out += `<circle cx="${(r() * W).toFixed(0)}" cy="${(y0 + r() * (y1 - y0)).toFixed(0)}" r="${(rad * (0.6 + r())).toFixed(1)}" fill="${color}" opacity="${(0.3 + r() * 0.5).toFixed(2)}"/>`;
    }
    return out;
  }

  /* ---------------- 场景（每个函数接收一个 rnd 实例） ---------------- */

  function lotusMoon(r, uid) {
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
    return `${grad(uid, 'var(--art-sky-2)', 'var(--art-sky)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      ${stars(r, 26, 150)}
      ${moon(520 + r() * 220, 60 + r() * 40, 26)}
      <path d="${ridge(r, 186, 58, 7)}" fill="var(--art-far)" opacity=".55"/>
      ${water(190)}${ripples(r, 200, 16, 'var(--art-line)')}
      ${leaves}${buds}`;
  }

  function autumnMountain(r, uid) {
    let pines = '';
    for (let i = 0; i < 7; i++) {
      const x = 60 + r() * 660, y = 250 + r() * 40, s = 12 + r() * 14;
      pines += `<path d="M ${x.toFixed(0)} ${y.toFixed(0)} l ${(-s).toFixed(0)} 0 l ${s.toFixed(0)} ${(-s * 2.4).toFixed(0)} l ${s.toFixed(0)} ${(s * 2.4).toFixed(0)} Z" fill="var(--art-near)" opacity=".85"/>`;
    }
    return `${grad(uid, 'var(--art-sky)', 'var(--art-water)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      ${moon(120 + r() * 120, 50 + r() * 40, 20)}
      <path d="${ridge(r, 200, 110, 5, 40)}" fill="var(--art-far)" opacity=".42"/>
      <path d="${ridge(r, 236, 76, 6, 26)}" fill="var(--art-far)" opacity=".65"/>
      <rect x="0" y="268" width="${W}" height="${H - 268}" fill="var(--art-water)"/>
      ${ripples(r, 276, 9, 'var(--art-line)')}
      ${pines}`;
  }

  function bamboo(r) {
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

  function snowPeak(r, uid) {
    let flakes = '';
    for (let i = 0; i < 60; i++) {
      flakes += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="var(--art-moon)" opacity="${(0.3 + r() * 0.5).toFixed(2)}"/>`;
    }
    return `${grad(uid, 'var(--art-sky-2)', 'var(--art-sky)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <path d="${ridge(r, 210, 130, 4, 60)}" fill="var(--art-far)" opacity=".4"/>
      <path d="${ridge(r, 250, 96, 5, 40)}" fill="var(--art-far)" opacity=".7"/>
      <rect x="0" y="272" width="${W}" height="${H - 272}" fill="var(--art-water)"/>
      ${flakes}`;
  }

  function springRiver(r, uid) {
    const boatX = 220 + r() * 260;
    return `${grad(uid, 'var(--art-sky)', 'var(--art-water)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <path d="${ridge(r, 176, 74, 6, 22)}" fill="var(--art-far)" opacity=".38"/>
      <rect x="0" y="196" width="${W}" height="${H - 196}" fill="var(--art-water)"/>
      ${ripples(r, 206, 18, 'var(--art-line)')}
      <path d="M ${boatX.toFixed(0)} 244 q 44 22 96 0 l -14 18 q -34 14 -68 0 Z" fill="var(--art-near)" opacity=".8"/>
      <path d="M ${(boatX + 92).toFixed(0)} 240 l 34 -30 l 4 30 Z" fill="var(--art-near)" opacity=".6"/>
      ${blossoms(r, 26, 'var(--art-blossom)', 60, 250, 3)}
      ${birds(r, 3, 70)}`;
  }

  function rainWindow(r) {
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

  function dunes(r, uid) {
    return `${grad(uid, 'var(--art-sky)', 'var(--art-sky-2)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <circle cx="${(520 + r() * 200).toFixed(0)}" cy="${(90 + r() * 40).toFixed(0)}" r="34" fill="var(--art-moon)" opacity=".85"/>
      <path d="M 0 236 q 200 -70 420 -18 q 220 52 380 -14 L ${W} ${H} L 0 ${H} Z" fill="var(--art-far)" opacity=".5"/>
      <path d="M 0 280 q 260 -46 470 -6 q 180 34 330 -8 L ${W} ${H} L 0 ${H} Z" fill="var(--art-near)" opacity=".7"/>
      <path d="M ${(60 + r() * 80).toFixed(0)} 250 q 30 -60 12 -96 q 26 40 20 96 Z" fill="var(--art-near)" opacity=".5"/>
      ${ripples(r, 292, 5, 'var(--art-line)')}`;
  }

  function lamp(r) {
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

  function paper(r) {
    let blot = '';
    for (let i = 0; i < 9; i++) {
      blot += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(20 + r() * 70).toFixed(0)}" fill="var(--art-far)" opacity="${(0.05 + r() * 0.07).toFixed(2)}"/>`;
    }
    return `<rect width="${W}" height="${H}" fill="var(--art-sky)"/>${blot}
      <path d="${ridge(r, 240, 60, 6, 18)}" fill="var(--art-far)" opacity=".22"/>`;
  }

  /* 江雪：孤舟、蓑笠、雪 */
  function snowBoat(r, uid) {
    let flakes = '';
    for (let i = 0; i < 45; i++) {
      flakes += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(0.8 + r() * 1.5).toFixed(1)}" fill="var(--art-moon)" opacity="${(0.25 + r() * 0.45).toFixed(2)}"/>`;
    }
    const bx = 180 + r() * 300;
    return `${grad(uid, 'var(--art-sky-2)', 'var(--art-sky)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <path d="${ridge(r, 190, 96, 5, 46)}" fill="var(--art-far)" opacity=".36"/>
      <path d="${ridge(r, 224, 62, 6, 24)}" fill="var(--art-far)" opacity=".5"/>
      <rect x="0" y="242" width="${W}" height="${H - 242}" fill="var(--art-water)"/>
      ${ripples(r, 252, 7, 'var(--art-line)')}
      <path d="M ${bx.toFixed(0)} 268 q 52 16 108 2 l -10 12 q -46 10 -92 0 Z" fill="var(--art-near)" opacity=".85"/>
      <path d="M ${(bx + 46).toFixed(0)} 262 q 12 -20 24 0 Z" fill="var(--art-line)" opacity=".7"/>
      ${flakes}`;
  }

  /* 边塞：城堞、烽烟、落日 */
  function border(r, uid) {
    let smoke = '';
    for (let i = 0; i < 4; i++) {
      smoke += `<ellipse cx="${(600 + r() * 40).toFixed(0)}" cy="${(96 - i * 22).toFixed(0)}" rx="${(18 + i * 12).toFixed(0)}" ry="${(8 + i * 5).toFixed(0)}" fill="var(--art-near)" opacity="${(0.3 - i * 0.05).toFixed(2)}"/>`;
    }
    let merlons = '';
    for (let i = 0; i < 12; i++) {
      merlons += `<rect x="${(40 + i * 62).toFixed(0)}" y="${(214 - (r() > 0.5 ? 10 : 0)).toFixed(0)}" width="30" height="14" fill="var(--art-near)" opacity=".75"/>`;
    }
    return `${grad(uid, 'var(--art-sky)', 'var(--art-far)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <circle cx="600" cy="96" r="30" fill="var(--art-moon)" opacity=".9"/>
      ${smoke}
      <path d="${ridge(r, 230, 40, 5, 14)}" fill="var(--art-far)" opacity=".5"/>
      <rect x="20" y="226" width="${W - 40}" height="46" fill="var(--art-near)" opacity=".55"/>
      ${merlons}
      <rect x="0" y="272" width="${W}" height="${H - 272}" fill="var(--art-water)" opacity=".8"/>`;
  }

  /* 田园：田垄、茅屋、远树 */
  function pastoral(r, uid) {
    let rows = '';
    for (let i = 0; i < 9; i++) {
      const y = 236 + i * 9;
      rows += `<path d="M 0 ${y} q 400 ${-6 - r() * 8} ${W} 0" fill="none" stroke="var(--art-line)" stroke-width="1.2" opacity="${(0.18 + r() * 0.18).toFixed(2)}"/>`;
    }
    let trees = '';
    for (let i = 0; i < 5; i++) {
      const x = 90 + r() * 620, y = 232 + r() * 20, s = 10 + r() * 12;
      trees += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${s.toFixed(0)}" fill="var(--art-near)" opacity=".55"/>`;
    }
    const hx = 200 + r() * 240;
    return `${grad(uid, 'var(--art-sky)', 'var(--art-water)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <path d="${ridge(r, 200, 54, 6, 18)}" fill="var(--art-far)" opacity=".38"/>
      ${trees}
      <path d="M ${hx.toFixed(0)} 236 l 60 -40 l 60 40 Z" fill="var(--art-near)" opacity=".7"/>
      <rect x="${hx.toFixed(0)}" y="236" width="120" height="46" fill="var(--art-near)" opacity=".55"/>
      <rect x="0" y="278" width="${W}" height="${H - 278}" fill="var(--art-water)" opacity=".85"/>
      ${rows}`;
  }

  /* 登高：台阁、远山、江流 */
  function tower(r, uid) {
    const tx = 300 + r() * 200;
    return `${grad(uid, 'var(--art-sky)', 'var(--art-sky-2)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <circle cx="${(120 + r() * 160).toFixed(0)}" cy="70" r="22" fill="var(--art-moon)" opacity=".8"/>
      <path d="${ridge(r, 214, 100, 6, 34)}" fill="var(--art-far)" opacity=".35"/>
      <path d="${ridge(r, 250, 66, 5, 20)}" fill="var(--art-far)" opacity=".55"/>
      <rect x="${tx.toFixed(0)}" y="196" width="86" height="96" fill="var(--art-near)" opacity=".7"/>
      <path d="M ${(tx - 26).toFixed(0)} 198 q 69 -34 138 0 Z" fill="var(--art-near)" opacity=".8"/>
      <path d="M ${(tx + 14).toFixed(0)} 172 q 29 -22 58 0 Z" fill="var(--art-near)" opacity=".7"/>
      <rect x="0" y="292" width="${W}" height="${H - 292}" fill="var(--art-water)" opacity=".9"/>
      ${birds(r, 4, 110)}`;
  }

  /* 寒梅：老枝、点点花瓣、雪 */
  function plum(r) {
    let branches = '';
    for (let i = 0; i < 4; i++) {
      const y0 = 40 + r() * 40;
      branches += `<path d="M ${(W - 20).toFixed(0)} ${(y0 + 60).toFixed(0)} q -220 ${(20 + r() * 40).toFixed(0)} -420 ${(40 + r() * 60).toFixed(0)}" fill="none" stroke="var(--art-near)" stroke-width="${(3 + r() * 4).toFixed(1)}" opacity=".8"/>`;
    }
    let snow = '';
    for (let i = 0; i < 40; i++) {
      snow += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(0.8 + r() * 1.4).toFixed(1)}" fill="var(--art-moon)" opacity="${(0.25 + r() * 0.4).toFixed(2)}"/>`;
    }
    return `<rect width="${W}" height="${H}" fill="var(--art-sky-2)"/>
      ${branches}
      ${blossoms(r, 40, 'var(--art-blossom)', 50, 230, 3.4)}
      ${snow}`;
  }

  /* 秋江：芦荻、雁阵 */
  function autumnRiver(r, uid) {
    let reeds = '';
    for (let i = 0; i < 26; i++) {
      const x = r() * 260, y = 300 - r() * 20;
      reeds += `<path d="M ${x.toFixed(0)} ${y.toFixed(0)} q ${(8 + r() * 10).toFixed(0)} -46 ${(4 + r() * 12).toFixed(0)} -86" fill="none" stroke="var(--art-line)" stroke-width="1.6" opacity="${(0.35 + r() * 0.3).toFixed(2)}"/>`;
    }
    return `${grad(uid, 'var(--art-sky)', 'var(--art-water)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <path d="${ridge(r, 196, 60, 6, 20)}" fill="var(--art-far)" opacity=".34"/>
      <rect x="0" y="208" width="${W}" height="${H - 208}" fill="var(--art-water)" opacity=".92"/>
      ${ripples(r, 218, 14, 'var(--art-line)')}
      ${birds(r, 5, 86)}
      ${reeds}`;
  }

  /* 松间：松树、石、溪 */
  function pineValley(r, uid) {
    let pines = '';
    for (let i = 0; i < 4; i++) {
      const x = 120 + i * 170 + r() * 40, y = 250 + r() * 20, s = 22 + r() * 16;
      pines += `<path d="M ${x.toFixed(0)} ${y.toFixed(0)} l ${(-s).toFixed(0)} 0 l ${s.toFixed(0)} ${(-s * 1.5).toFixed(0)} l ${s.toFixed(0)} ${(s * 1.5).toFixed(0)} Z" fill="var(--art-near)" opacity=".8"/>`;
      pines += `<path d="M ${x.toFixed(0)} ${(y - s * 1.2).toFixed(0)} l ${(-s * 0.75).toFixed(0)} 0 l ${(s * 0.75).toFixed(0)} ${(-s * 1.3).toFixed(0)} l ${(s * 0.75).toFixed(0)} ${(s * 1.3).toFixed(0)} Z" fill="var(--art-near)" opacity=".7"/>`;
    }
    return `${grad(uid, 'var(--art-sky-2)', 'var(--art-sky)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <path d="${ridge(r, 200, 86, 5, 30)}" fill="var(--art-far)" opacity=".4"/>
      <path d="M 400 200 q -60 60 -30 120" fill="none" stroke="var(--art-water)" stroke-width="10" opacity=".5"/>
      ${pines}
      <rect x="0" y="286" width="${W}" height="${H - 286}" fill="var(--art-water)" opacity=".8"/>
      ${ripples(r, 292, 6, 'var(--art-line)')}`;
  }

  /* ---- 下面是「非古典」场景：给英文、听力、AI、前沿、投资用 ---- */

  /* 星轨：AI 主题，同心轨道 + 漂浮节点 */
  function orbit(r, uid) {
    const cx = 400, cy = 178;
    let rings = '';
    for (let i = 1; i <= 4; i++) {
      const rad = 46 + i * 44;
      rings += `<ellipse cx="${cx}" cy="${cy}" rx="${rad}" ry="${(rad * (0.28 + r() * 0.16)).toFixed(0)}" fill="none" stroke="var(--art-line)" stroke-width="1.1" opacity="${(0.5 - i * 0.07).toFixed(2)}" transform="rotate(${(-9 + r() * 18).toFixed(1)} ${cx} ${cy})"/>`;
    }
    let nodes = '';
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2, rad = 54 + r() * 200;
      nodes += `<circle cx="${(cx + Math.cos(a) * rad).toFixed(0)}" cy="${(cy + Math.sin(a) * rad * 0.44).toFixed(0)}" r="${(2 + r() * 3.4).toFixed(1)}" fill="var(--art-far)" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`;
    }
    return `${grad(uid, 'var(--art-sky-2)', 'var(--art-sky)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      ${stars(r, 34, H)}
      ${rings}
      <circle cx="${cx}" cy="${cy}" r="48" fill="var(--art-glow)" opacity=".26"/>
      <circle cx="${cx}" cy="${cy}" r="26" fill="var(--art-glow)" opacity=".42"/>
      <circle cx="${cx}" cy="${cy}" r="13" fill="var(--art-moon)"/>
      ${nodes}`;
  }

  /* 数据流：前沿主题，网格 + 三条脉冲 */
  function signal(r, uid) {
    let grid = '';
    for (let i = 0; i < 14; i++) {
      grid += `<line x1="0" y1="${i * 24}" x2="${W}" y2="${i * 24}" stroke="var(--art-line)" stroke-width=".6" opacity=".14"/>`;
    }
    let wave = '';
    for (let k = 0; k < 3; k++) {
      let d = `M 0 ${(206 + k * 28).toFixed(0)}`;
      for (let x = 0; x <= W; x += 22) {
        const amp = 30 - k * 8;
        d += ` L ${x} ${(206 + k * 28 - Math.sin(x / 88 + k * 1.7) * amp * (0.42 + r() * 0.58)).toFixed(0)}`;
      }
      wave += `<path d="${d}" fill="none" stroke="${k === 0 ? 'var(--art-blossom)' : 'var(--art-line)'}" stroke-width="${(2.1 - k * 0.5).toFixed(1)}" opacity="${(0.7 - k * 0.18).toFixed(2)}" stroke-linecap="round"/>`;
    }
    let dots = '';
    for (let i = 0; i < 26; i++) {
      dots += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 150).toFixed(0)}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="var(--art-moon)" opacity="${(0.2 + r() * 0.45).toFixed(2)}"/>`;
    }
    return `${grad(uid, 'var(--art-sky)', 'var(--art-sky-2)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      ${grid}${dots}${wave}
      <rect x="0" y="286" width="${W}" height="${H - 286}" fill="var(--art-water)" opacity=".7"/>`;
  }

  /* 市况：投资主题，K 线柱 + 基线 */
  function market(r, uid) {
    let bars = '';
    let y = 176 + r() * 30;
    for (let i = 0; i < 26; i++) {
      const x = 26 + i * 29;
      const close = Math.max(70, Math.min(266, y + (r() - 0.47) * 48));
      const hi = Math.min(y, close) - 8 - r() * 18;
      const lo = Math.max(y, close) + 8 + r() * 18;
      const col = close < y ? 'var(--art-blossom)' : 'var(--art-line)';
      bars += `<line x1="${x}" y1="${hi.toFixed(0)}" x2="${x}" y2="${lo.toFixed(0)}" stroke="${col}" stroke-width="1" opacity=".5"/>`;
      bars += `<rect x="${x - 7}" y="${Math.min(y, close).toFixed(0)}" width="14" height="${Math.max(3, Math.abs(close - y)).toFixed(0)}" rx="2" fill="${col}" opacity=".34"/>`;
      y = close;
    }
    return `${grad(uid, 'var(--art-sky)', 'var(--art-sky-2)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <path d="${ridge(r, 260, 46, 6, 14)}" fill="var(--art-far)" opacity=".2"/>
      ${bars}
      <line x1="0" y1="286" x2="${W}" y2="286" stroke="var(--art-line)" stroke-width="1" opacity=".4"/>`;
  }

  /* 书桌：笔记本、笔、台灯光圈 */
  function desk(r, uid) {
    let lines = '';
    for (let i = 0; i < 7; i++) {
      lines += `<line x1="${(268 + r() * 16).toFixed(0)}" y1="${(205 + i * 12).toFixed(0)}" x2="${(452 + r() * 26).toFixed(0)}" y2="${(205 + i * 12).toFixed(0)}" stroke="var(--art-line)" stroke-width="1.3" opacity=".45"/>`;
    }
    return `${grad(uid, 'var(--art-sky-2)', 'var(--art-sky)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      <circle cx="636" cy="74" r="104" fill="var(--art-glow)" opacity=".18"/>
      <circle cx="636" cy="74" r="24" fill="var(--art-moon)" opacity=".92"/>
      <rect x="0" y="252" width="${W}" height="${H - 252}" fill="var(--art-near)" opacity=".2"/>
      <path d="M 232 252 L 268 194 L 480 194 L 516 252 Z" fill="var(--art-moon)" opacity=".5"/>
      ${lines}
      <path d="M 548 250 l 92 -34 l 10 20 l -92 34 Z" fill="var(--art-far)" opacity=".42"/>
      <rect x="112" y="222" width="62" height="30" rx="4" fill="var(--art-far)" opacity=".4"/>
      <path d="M 174 228 q 20 8 0 18" fill="none" stroke="var(--art-line)" stroke-width="2" opacity=".5"/>`;
  }

  /* 花枝：英文主题，枝条 + 落花 + 飞鸟 */
  function bloom(r, uid) {
    let branches = '';
    for (let i = 0; i < 3; i++) {
      branches += `<path d="M ${(W - 20 - i * 26).toFixed(0)} ${(306 - i * 26).toFixed(0)} q -170 ${(-30 - r() * 50).toFixed(0)} -350 ${(-96 - r() * 70).toFixed(0)}" fill="none" stroke="var(--art-near)" stroke-width="${(1.8 + r() * 2.4).toFixed(1)}" opacity=".45"/>`;
    }
    return `${grad(uid, 'var(--art-sky)', 'var(--art-sky-2)')}
      <rect width="${W}" height="${H}" fill="url(#${uid})"/>
      ${branches}
      ${blossoms(r, 30, 'var(--art-blossom)', 40, 250, 3.4)}
      ${birds(r, 4, 62)}`;
  }

  const SCENES = {
    'lotus-moon': { label: '荷塘月色', draw: lotusMoon },
    'autumn-mountain': { label: '空山新雨', draw: autumnMountain },
    'bamboo': { label: '竹林清影', draw: bamboo },
    'snow-peak': { label: '雪岭', draw: snowPeak },
    'snow-boat': { label: '江雪孤舟', draw: snowBoat },
    'spring-river': { label: '春江', draw: springRiver },
    'rain-window': { label: '雨窗', draw: rainWindow },
    'dunes': { label: '大漠孤烟', draw: dunes },
    'border': { label: '边塞烽烟', draw: border },
    'pastoral': { label: '田园', draw: pastoral },
    'tower': { label: '登高', draw: tower },
    'plum': { label: '寒梅', draw: plum },
    'autumn-river': { label: '秋江芦荻', draw: autumnRiver },
    'pine-valley': { label: '松间清泉', draw: pineValley },
    'lamp': { label: '灯下', draw: lamp },
    'paper': { label: '素纸', draw: paper },
    'orbit': { label: '星轨', draw: orbit },
    'signal': { label: '数据流', draw: signal },
    'market': { label: '市况', draw: market },
    'desk': { label: '书桌', draw: desk },
    'bloom': { label: '花枝', draw: bloom },
  };

  const KEYS = Object.keys(SCENES);

  /* seed 传日期，同一天稳定、换一天换构图 */
  function svg(key, seed) {
    const s = SCENES[key] || SCENES.paper;
    const uid = 'g' + (hash(String(seed || key)) % 1000000);
    const r = rnd(hash(String(seed || key)) ^ 0x9e3779b9);
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${s.label}">${s.draw(r, uid)}</svg>`;
  }

  function label(key) { return (SCENES[key] || SCENES.paper).label; }

  return { svg, label, keys: KEYS };
})();
