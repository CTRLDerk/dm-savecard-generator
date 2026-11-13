/* DM Save Card — draws the progress card on a canvas (1200 × 675), in the Delta Manager redesign style:
   asphalt background, chrome plate, red = act/DNF, green = good news, gold = titles, team colour = identity. */
(function (root) {
  'use strict';
  const T = root.DMText;
  const W = 1200, H = 675;
  const C = {
    bg: '#15120F', bgText: '#F4EDE2', bgMuted: '#B3A797', bgLine: '#3A322A', bgRow: '#29231D', pit: '#1E1A16',
    panel: '#F4EDE2', ink: '#15120F', border: '#CDBFAC', hair: '#E2D7C5', muted: '#5A4F44', faint: '#7A6E60',
    navy: '#29231D', red: '#E2372B', redText: '#FF6A55', green: '#3DC36B', greenInk: '#1E8A47', orange: '#F08A3C',
    gold: '#F5C04A', sel: '#F7E6BF', white: '#FFFFFF'
  };
  // Barlow Condensed (names, headings, numbers) for bold and italic weights, Barlow for text and labels.
  const COND = '"Barlow Condensed", "Arial Narrow", system-ui, sans-serif', TEXT = 'Barlow, system-ui, sans-serif';
  const F = (w, size, italic) => (italic || w >= 800) ? 'italic 800 ' + Math.round(size * 1.06) + 'px ' + COND
    : w >= 700 ? '700 ' + Math.round(size * 1.08) + 'px ' + COND : (w < 500 ? 400 : w) + ' ' + size + 'px ' + TEXT;
  F.FAMILIES = ['400 20px Barlow', '500 20px Barlow', '600 20px Barlow', '700 20px "Barlow Condensed"', 'italic 700 20px "Barlow Condensed"', 'italic 800 20px "Barlow Condensed"'];

  function fit(ctx, text, max) {
    text = String(text == null ? '' : text);
    if (ctx.measureText(text).width <= max) return text;
    let lo = 0, hi = text.length;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ctx.measureText(text.slice(0, mid).trimEnd() + '…').width <= max) lo = mid; else hi = mid - 1; }
    return text.slice(0, lo).trimEnd() + '…';
  }
  // Like fit(), but keeps a trailing car number ("… #3").
  function fitName(ctx, text, max) {
    text = String(text || '');
    if (ctx.measureText(text).width <= max) return text;
    const m = / #\d{1,3}$/.exec(text);
    if (!m) return fit(ctx, text, max);
    const tail = '…' + m[0];
    return fit(ctx, text.slice(0, -m[0].length), max - ctx.measureText(tail).width).replace(/…$/, '') .trimEnd() + tail;
  }
  function wrap(ctx, text, max, lines) {
    if (lines <= 1) return [fit(ctx, text, max)];
    const words = String(text || '').split(/\s+/); const out = []; let cur = '';
    for (let i = 0; i < words.length; i++) {
      const w = words[i]; const tryLine = cur ? cur + ' ' + w : w;
      if (ctx.measureText(tryLine).width <= max || !cur) { cur = tryLine; continue; }
      out.push(cur); cur = w;
      if (out.length === lines - 1) { cur = words.slice(i).join(' '); break; }
    }
    if (cur) out.push(cur);
    if (out.length > lines) out.length = lines;
    out[out.length - 1] = fit(ctx, out[out.length - 1], max);
    return out;
  }
  function spaced(ctx, text, x, y, sp, align) {
    text = String(text);
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = sp + 'px'; ctx.textAlign = align || 'left';
      ctx.fillText(text, align === 'right' ? x + sp : x, y); ctx.letterSpacing = '0px'; ctx.textAlign = 'left';
      return;
    }
    let w = 0; for (const ch of text) w += ctx.measureText(ch).width + sp; w -= sp;
    let cx = align === 'right' ? x - w : x;
    for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; }
  }
  const label = (ctx, text, x, y, color, align) => { ctx.font = F(600, 12); ctx.fillStyle = color; spaced(ctx, String(text).toUpperCase(), x, y, 1.4, align); };

  function chip(ctx, code, x, y, dark) {
    if (!code) return 0;
    ctx.font = F(700, 11);
    const w = Math.max(26, ctx.measureText(code).width + 12);
    ctx.strokeStyle = dark ? C.bgMuted : C.faint; ctx.lineWidth = 1.2; ctx.strokeRect(x + .5, y - 13.5, w, 18);
    ctx.fillStyle = dark ? C.bgMuted : C.muted; ctx.textAlign = 'center'; ctx.fillText(code, x + .5 + w / 2, y); ctx.textAlign = 'left';
    return w + 10;
  }

  function stripe(ctx, y, h) {
    const sq = h / 2;
    ctx.fillStyle = C.panel; ctx.fillRect(0, y, W, h);
    ctx.fillStyle = C.ink;
    for (let x = 0, i = 0; x < W; x += sq, i++) { ctx.fillRect(x, y + (i % 2 ? sq : 0), sq, sq); }
  }

  // Logo files often carry empty (transparent or white) margins: cut them off so the logo itself is centred.
  const trimCache = new WeakMap();
  function trimmed(img) {
    if (trimCache.has(img)) return trimCache.get(img);
    let out = { src: img, x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    try {
      const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4; if (d[i + 3] < 16 || (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240)) continue;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (x1 >= x0 && y1 >= y0) out = { src: img, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    } catch (e) { /* keep the whole image */ }
    trimCache.set(img, out); return out;
  }
  // A logo centred in a w×h area, without a box around it.
  function drawLogo(ctx, img, x, y, w, h) {
    const t = trimmed(img), r = Math.min(w / t.w, h / t.h), iw = t.w * r, ih = t.h * r;
    ctx.drawImage(t.src, t.x, t.y, t.w, t.h, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
  // ------------------------------------------------------------ circuit drawing
  // A closed smooth line through the layout points of the save (Catmull-Rom), fitted into w × h.
  // o: { line, width, zones (braking zones in colour), start (marker), muted }
  const trackCache = new WeakMap();
  function trackPath(tr) {
    if (trackCache.has(tr)) return trackCache.get(tr);
    const P = tr.p, m = P.length, n = 10, out = [];
    for (let i = 0; i < m; i++) {
      const p0 = P[(i - 1 + m) % m], p1 = P[i], p2 = P[(i + 1) % m], p3 = P[(i + 2) % m];
      for (let q = 0; q < n; q++) { const t = q / n, pt = [0, 0];
        for (const k of [0, 1]) pt[k] = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t);
        out.push(pt); }
    }
    const xs = out.map(p => p[0]), ys = out.map(p => p[1]);
    const res = { pts: out, x0: Math.min(...xs), y0: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) || 1, h: Math.max(...ys) - Math.min(...ys) || 1, per: n };
    trackCache.set(tr, res); return res;
  }
  function drawTrack(ctx, tr, x, y, w, h, o) {
    if (!tr || !tr.p || tr.p.length < 4) return false;
    o = o || {};
    const T = trackPath(tr), lw = o.width || 5, sc = Math.min((w - lw * 2) / T.w, (h - lw * 2) / T.h);
    const ox = x + (w - T.w * sc) / 2, oy = y + (h - T.h * sc) / 2;
    const pt = i => { const p = T.pts[((i % T.pts.length) + T.pts.length) % T.pts.length]; return [ox + (p[0] - T.x0) * sc, oy + (p[1] - T.y0) * sc]; };
    const stroke = (a, b, col, width) => { ctx.beginPath(); for (let i = a; i <= b; i++) { const [px, py] = pt(i); if (i === a) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); };
    ctx.save();
    const L = T.pts.length;
    stroke(0, L, o.line || C.bgText, lw);
    if (o.zones !== false) for (const z of tr.z || []) { const a = Math.round(z[0] * L), b = Math.round((z[0] + z[1]) * L); if (b > a) stroke(a, b, z[2] >= 4 ? C.red : C.orange, lw); }
    if (o.start !== false) {
      const i = Math.round((tr.start || 0) * T.per), [sx, sy] = pt(i), [nx, ny] = pt(i + (tr.dir === 'ccw' ? -3 : 3));
      const ang = Math.atan2(ny - sy, nx - sx), r = Math.max(4, lw * 1.5);
      ctx.translate(sx, sy); ctx.rotate(ang);
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.moveTo(r * 1.9, 0); ctx.lineTo(-r, -r * 1.1); ctx.lineTo(-r, r * 1.1); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    return true;
  }

  function logoBox(ctx, f, img, x, y, s) {
    if (img && img.naturalWidth) { drawLogo(ctx, img, x, y, s, s); return; }
    ctx.fillStyle = f.color || C.navy; ctx.fillRect(x, y, s, s);
    const txt = f.number ? '#' + f.number : initials(f.name);
    ctx.fillStyle = readable(f.color); ctx.font = F(900, txt.length > 3 ? 22 : 28, true); ctx.textAlign = 'center';
    ctx.fillText(txt, x + s / 2, y + s / 2 + 10); ctx.textAlign = 'left';
  }
  const initials = n => String(n || '?').replace(/\(.*?\)/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  function readable(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return C.white;
    const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? C.ink : C.white;
  }

  function draw(canvas, s, opts) {
    opts = opts || {};
    const t = T.L(opts.lang);
    const scale = opts.scale || 2;
    canvas.width = W * scale; canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.textBaseline = 'alphabetic';
    const f = s.focus;

    // Background, chequered stripe, red line
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    stripe(ctx, 0, 14);
    ctx.fillStyle = C.red; ctx.fillRect(0, 14, W, 4);

    // Header
    label(ctx, s.category || (s.mode === 'spectator' ? t.spectator : 'Delta Manager'), 48, 56, C.bgMuted);
    ctx.font = F(900, 38, true); ctx.fillStyle = C.bgText;
    const head = (t.season + ' ' + s.season).toUpperCase();
    ctx.fillText(head, 48, 98);
    const hw = ctx.measureText(head).width;
    ctx.font = F(600, 16); ctx.fillStyle = C.bgMuted;
    const sub = s.preseason ? t.preseason : s.finished ? t.finalStandings : t.round + ' ' + s.rounds.done + ' ' + t.of + ' ' + s.rounds.total + ' · ' + t.week + ' ' + s.week;
    ctx.fillText(fit(ctx, sub, 680 - hw), 48 + hw + 18, 97);

    // Season progress: one segment per race
    const px = 772, pw = 380, n = Math.max(1, s.rounds.total);
    label(ctx, t.progress, px, 56, C.bgMuted);
    ctx.font = F(700, 13); ctx.fillStyle = C.bgText; ctx.textAlign = 'right';
    ctx.fillText(s.rounds.done + ' / ' + s.rounds.total + ' ' + t.seasonProgress, px + pw, 56); ctx.textAlign = 'left';
    const gap = n > 30 ? 2 : 4, sw = (pw - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const x = px + i * (sw + gap), done = i < s.rounds.done, lastOne = i === s.rounds.done - 1;
      if (done) { ctx.fillStyle = lastOne ? C.red : C.bgText; ctx.fillRect(x, 74, sw, 12); }
      else { ctx.strokeStyle = C.bgLine; ctx.lineWidth = 1.5; ctx.strokeRect(x + .75, 74.75, sw - 1.5, 10.5); }
    }
    if (s.next) {
      ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted;
      ctx.fillText(fit(ctx, (s.preseason ? t.firstRace : t.next) + ': ' + s.next.name + ' · ' + t.week + ' ' + s.next.week, pw), px, 108);
    }

    // Enamel plate with the focus team
    const X = 48, Y = 128, PW = 668, PH = 444;
    ctx.fillStyle = C.panel; ctx.fillRect(X, Y, PW, PH);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(X + 1.5, Y + 1.5, PW - 3, PH - 3);
    if (f) {
      ctx.fillStyle = f.color || C.navy; ctx.fillRect(X + 3, Y + 3, 12, PH - 6);
      logoBox(ctx, f, opts.logo, X + 38, Y + 26, 76);
      const nx = X + 136, nmax = PW - 136 - 28;
      ctx.font = F(900, 28, true); ctx.fillStyle = C.ink;
      const lines = wrap(ctx, String(f.name).toUpperCase(), nmax, 2);
      lines.forEach((ln, i) => ctx.fillText(ln, nx, Y + 54 + i * 32));
      // Sub line: role / manager, then co-op partners (name shortened, car number and position kept).
      ctx.font = F(500, 15); ctx.fillStyle = C.muted;
      const sy0 = Y + 54 + lines.length * 32 + 4;
      const lead = [];
      if (f.role === 'leader') lead.push(t.leaderTitle + ' · ' + t.spectator);
      if (f.manager) lead.push(t.managedBy + ' ' + f.manager);
      if (!lead.length && !s.partners.length && f.engine) lead.push(f.engine);
      let sxp = nx;
      if (lead.length) { const txt = fit(ctx, lead.join('  ·  '), nmax); ctx.fillText(txt, sxp, sy0); sxp += ctx.measureText(txt).width; }
      for (const p of s.partners) {
        const pre = (sxp > nx ? '  ·  ' : '') + t.coop + ': ';
        const post = (p.pos != null ? ' · P' + p.pos : '') + (p.manager ? ' (' + p.manager + ')' : '');
        const room = nx + nmax - sxp - ctx.measureText(pre + post).width;
        if (room < 60) break;
        const txt = pre + fitName(ctx, p.short, room) + post;
        ctx.fillText(txt, sxp, sy0); sxp += ctx.measureText(txt).width;
      }

      // One headline: the most telling thing about the season right now.
      const SL = T.story(s, opts.lang);
      if (SL.headline && !s.preseason && sy0 + 26 <= Y + 132) { ctx.font = F(800, 19, true); ctx.fillStyle = C.ink; ctx.fillText(fit(ctx, SL.headline.toUpperCase(), nmax), nx, sy0 + 26); }
      ctx.fillStyle = C.hair; ctx.fillRect(X + 38, Y + 140, PW - 66, 1);

      // Big position
      const bx = X + 38, by = Y + 268;
      const big = s.preseason ? (f.expected ? 'P' + f.expected : '–') : (f.pos == null ? '–' : 'P' + f.pos);
      ctx.font = F(900, 132, true); ctx.fillStyle = C.ink; ctx.fillText(big, bx - 4, by);
      let bw = ctx.measureText(big).width;
      if (f.tied && !s.preseason) { ctx.font = F(900, 60, true); ctx.fillText('=', bx + bw, by - 52); bw += ctx.measureText('=').width; }
      const rx = bx + bw + 30, rmax = X + PW - 28 - rx;
      label(ctx, s.preseason ? t.target : s.finished ? t.finalStandings : t.championship, rx, Y + 176, C.faint);
      ctx.font = F(800, 34, true); ctx.fillStyle = C.ink;
      ctx.fillText(s.preseason ? t.preseason.toUpperCase() : T.fmtPts(f.points) + ' ' + t.pts.toUpperCase(), rx, Y + 214);
      ctx.font = F(500, 15); ctx.fillStyle = C.muted;
      // The gap with what it is worth ("about two race wins") when that says more than the number.
      const gap = f.pos === 1 ? f.gapBehind : f.gapAhead, wv = s.story && gap ? T.worth(gap, s.story, opts.lang) : '', wx = wv.indexOf('(') >= 0 ? ' ' + wv.slice(wv.indexOf('(')) : '';
      const gl = s.preseason ? (s.next ? t.firstRace + ': ' + s.next.name : '') : T.gapLine(f, t) + wx;
      if (gl) ctx.fillText(fit(ctx, gl, rmax), rx, Y + 240);
      // Target / champion badge
      const ts = T.targetState(f);
      let badge = null;
      if (s.finished && f.pos === 1) badge = { text: t.champions, fill: C.gold, color: C.ink };
      else if (ts && !s.preseason) badge = { text: t.target + ' P' + f.expected + ' · ' + (ts === 'ahead' ? t.targetAhead : ts === 'on' ? t.targetOn : t.targetBehind),
        fill: ts === 'behind' ? null : ts === 'ahead' ? C.green : C.navy, stroke: ts === 'behind' ? C.red : null, color: ts === 'behind' ? C.red : ts === 'ahead' ? C.ink : C.white };
      if (badge) {
        ctx.font = F(700, 12); const txt = badge.text.toUpperCase();
        let bwid = 0; for (const ch of txt) bwid += ctx.measureText(ch).width + 1; bwid += 22;
        bwid = Math.min(bwid, rmax);
        if (badge.fill) { ctx.fillStyle = badge.fill; ctx.fillRect(rx, Y + 254, bwid, 26); }
        else { ctx.strokeStyle = badge.stroke; ctx.lineWidth = 1.5; ctx.strokeRect(rx + .75, Y + 254.75, bwid - 1.5, 24.5); }
        ctx.fillStyle = badge.color; spaced(ctx, txt, rx + 11, Y + 272, 1);
      }

      // Stats row
      const sx = X + 38, sy = Y + 300, cw = (PW - 66) / 5;
      const cells = [[t.wins, f.wins], [t.podiums, f.podiums], [t.poles, f.poles], [t.dnf, f.dnf],
        opts.budget && f.budget != null ? [t.budget, T.fmtMoney(f.budget)] : [t.best, f.best != null ? 'P' + f.best : '–']];
      cells.forEach(([k, v], i) => {
        const cx = sx + i * cw;
        ctx.fillStyle = C.ink; ctx.fillRect(cx, sy, cw - 12, 2);
        label(ctx, k, cx, sy + 22, C.faint);
        ctx.font = F(800, 30, true); ctx.fillStyle = C.ink;
        ctx.fillText(fit(ctx, s.preseason && i < 4 ? '–' : String(v), cw - 16), cx, sy + 58);
      });

      // Form: last results as chips
      const fy = Y + 392;
      label(ctx, t.form, sx, fy + 18, C.faint);
      const form = f.form.slice(-10);
      let fx = sx + 64;
      if (!form.length) { ctx.font = F(500, 14); ctx.fillStyle = C.faint; ctx.fillText(s.preseason ? t.preseason : '–', fx, fy + 18); }
      for (const r of form) {
        const win = r.pos === 1, pod = r.pos != null && r.pos <= 3, out = r.pos == null;
        ctx.font = F(800, 13, true);
        const w = Math.max(40, ctx.measureText(r.label).width + 16);
        if (win) { ctx.fillStyle = C.gold; ctx.fillRect(fx, fy, w, 26); ctx.fillStyle = C.ink; }
        else if (pod) { ctx.fillStyle = C.green; ctx.fillRect(fx, fy, w, 26); ctx.fillStyle = C.ink; }
        else if (out) { ctx.strokeStyle = C.red; ctx.lineWidth = 1.5; ctx.strokeRect(fx + .75, fy + .75, w - 1.5, 24.5); ctx.fillStyle = C.red; }
        else { ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.strokeRect(fx + .75, fy + .75, w - 1.5, 24.5); ctx.fillStyle = C.ink; }
        ctx.textAlign = 'center'; ctx.fillText(r.label, fx + w / 2, fy + 18); ctx.textAlign = 'left';
        fx += w + 6;
        if (fx > X + PW - 70) break;
      }
    }

    // Right column on navy: last race, standings, drivers
    const RX = 752, RW = 400;
    let y = 150;
    if (s.last && f) {
      label(ctx, t.lastRace + ' · ' + t.round + ' ' + s.last.round, RX, y, C.bgMuted);
      y += 30;
      const cw = chip(ctx, s.last.cc, RX, y, true);
      ctx.font = F(700, 19); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, s.last.name, RW - cw), RX + cw, y + 1);
      y += 40;
      const mine = s.last.mine;
      if (mine.length) {
        let x = RX;
        mine.slice(0, 3).forEach((m, i) => {
          ctx.font = F(900, 32, true); ctx.fillStyle = m.finished ? C.bgText : C.red;
          if (i) { ctx.fillStyle = C.bgMuted; ctx.font = F(500, 20); ctx.fillText('·', x, y - 4); x += 18; ctx.font = F(900, 32, true); ctx.fillStyle = m.finished ? C.bgText : C.red; }
          ctx.fillText(m.label, x, y); x += ctx.measureText(m.label).width + 10;
          if (m.start != null && m.finished) {
            ctx.font = F(600, 14); ctx.fillStyle = C.bgMuted;
            const g = t.from + ' P' + m.start + (m.gain ? ' ' + (m.gain > 0 ? '+' : '−') + Math.abs(m.gain) : '');
            ctx.fillText(g, x, y - 3); x += ctx.measureText(g).width + 14;
          }
        });
      } else { ctx.font = F(600, 16); ctx.fillStyle = C.bgMuted; ctx.fillText('–', RX, y); }
      if (s.last.winner && s.last.winner.teamId !== f.id) {
        y += 24; ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted;
        ctx.fillText(fit(ctx, t.wonBy + ' ' + s.last.winner.short, RW), RX, y);
      }
      y += 38;
    } else {
      label(ctx, s.preseason ? t.preseason : t.lastRace, RX, y, C.bgMuted);
      y += 30; ctx.font = F(600, 16); ctx.fillStyle = C.bgText;
      ctx.fillText(fit(ctx, s.next ? t.firstRace + ': ' + s.next.name : '–', RW), RX, y);
      y += 40;
    }

    // Standings
    const drivers = opts.table === 'drivers';
    const list = drivers ? s.drivers : s.teams;
    label(ctx, drivers ? t.drivers : t.standings, RX, y, C.bgMuted);
    y += 12;
    const rowH = 34, maxRows = Math.max(3, Math.floor((560 - y) / rowH));
    const isMe = r => (drivers ? f && f.drivers.some(d => d.name === r.name) : f && r.id === f.id);
    const isPartner = r => !drivers && s.partners.some(p => p.id === r.id);
    const isPlayer = r => !isMe(r) && (s.players || []).some(p => p.id === (drivers ? r.teamId : r.id));
    const meIdx = list.findIndex(isMe);
    const rows = T.standingsRows(list.length, meIdx, maxRows).map(i => list[i]);
    const dec = list.some(r => !Number.isInteger(r.points));
    rows.forEach((r, i) => {
      const ry = y + i * rowH;
      const me = isMe(r);
      if (me) { ctx.fillStyle = C.bgRow; ctx.fillRect(RX - 10, ry + 2, RW + 10, rowH - 2); ctx.fillStyle = C.gold; ctx.fillRect(RX - 10, ry + 2, 3, rowH - 2); }
      if (i && rows[i - 1] && list.indexOf(r) - list.indexOf(rows[i - 1]) > 1) { ctx.fillStyle = C.bgLine; ctx.fillRect(RX, ry + 1, RW, 1); }
      const base = ry + 24;
      ctx.font = F(700, 15); ctx.fillStyle = me ? C.bgText : C.bgMuted; ctx.textAlign = 'right';
      ctx.fillText(r.pos == null ? '–' : r.pos + (r.tied ? '=' : ''), RX + 26, base); ctx.textAlign = 'left';
      ctx.fillStyle = r.color || C.bgMuted; ctx.fillRect(RX + 38, ry + 10, 4, 18);
      const pl = isPlayer(r);
      ctx.font = F(me || isPartner(r) || pl ? 700 : 500, 15); ctx.fillStyle = C.bgText;
      const nm = fitName(ctx, drivers ? r.name : r.short, RW - 52 - 70 - (pl ? 96 : 0));
      ctx.fillText(nm, RX + 52, base);
      if (pl) {   // a team run by another player
        const tx = RX + 52 + ctx.measureText(nm).width + 8;
        const who = (s.players.find(p => p.id === (drivers ? r.teamId : r.id)) || {}).player;
        ctx.font = F(700, 10); const tag = who ? fit(ctx, '@' + who, 80) : t.player, tw = ctx.measureText(tag).width + 10;
        ctx.strokeStyle = C.gold; ctx.lineWidth = 1; ctx.strokeRect(tx + 0.5, ry + 11.5, tw, 15);
        ctx.fillStyle = C.gold; ctx.fillText(tag, tx + 5, ry + 23);
      }
      ctx.font = F(700, 15); ctx.textAlign = 'right'; ctx.fillStyle = me ? C.bgText : C.bgMuted;
      ctx.fillText(dec ? r.points.toFixed(1) : String(r.points), RX + RW, base); ctx.textAlign = 'left';
    });

    // Footer
    ctx.fillStyle = C.bgLine; ctx.fillRect(48, 598, W - 96, 1);
    ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted;
    const foot = [t.saved + ' ' + T.fmtDate(s.savedAt, opts.lang)];
    if (s.mode === 'coop') foot.push(t.coop); if (s.mode === 'multiplayer') foot.push(t.mp); if (s.cheat) foot.push(t.cheat);
    if (f && f.drivers.length && !s.preseason && opts.table !== 'drivers') foot.push(f.drivers.map(d => T.surname(d.name) + ' ' + T.posLabel(d.pos, d.tied)).join(' · '));
    ctx.fillText(fit(ctx, foot.join('  ·  '), 860), 48, 636);
    ctx.font = F(900, 20, true); ctx.textAlign = 'right';
    ctx.fillStyle = C.red; ctx.fillText('SAVE CARD', W - 48, 637);
    const bw2 = ctx.measureText('SAVE CARD').width;
    ctx.fillStyle = C.bgText; ctx.fillText('DM ', W - 48 - bw2, 637); ctx.textAlign = 'left';
    return canvas;
  }

  root.DMCard = { draw, W, H, helpers: { C, F, fit, fitName, wrap, spaced, label, chip, stripe, logoBox, drawLogo, drawTrack, readable } };
})(typeof self !== 'undefined' ? self : this);
