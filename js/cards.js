/* DM Save Card — card layouts for the extra post types (same 1200 × 675 frame and house style):
   championship overview, R&D update, paddock news. */
(function (root) {
  'use strict';
  const Card = root.DMCard, T = root.DMText, V = root.DMViews;
  const { C, F, fit, fitName, wrap, spaced, label, stripe } = Card.helpers;
  const W = Card.W, H = Card.H;
  const L = {
    en: { champ: 'Championship', after: 'After round {R} of {N}', left: '{L} left · max {M} pts per team', final: 'Final standings', pre: 'Pre-season',
      team: 'Team', wins: 'Wins', gap: 'Gap', pts: 'Pts', drivers: 'Drivers', contention: 'Still in contention', mostWins: 'Most wins', lastWin: 'Last win',
      rnd: 'R&D update', week: 'Week {W}', upgrades: 'Upgrades this season', ok: '{A} of {B} worked', last: 'Last upgrades', factory: 'In the factory',
      ready: 'ready week {W}', improved: 'Most improved', failed: 'failed', fieldRank: 'Rank', season: 'this season',
      paddock: 'Paddock news', contracts: 'Our contracts', roles: { driver: 'driver', reserve: 'reserve', chiefEngineer: 'chief engineer', technicalDirector: 'technical director', teamPrincipal: 'team principal', sportingDirector: 'sporting director', commercialDirector: 'commercial director' }, market: 'Market watch', ending: 'Contracts ending {Y}', free: 'Free agents', injured: 'Injured', none: 'No paddock news about our team yet.',
      noRnd: 'No development data in this save.', lvl: 'lvl', saved: 'Saved', reserve: 'reserve' },
    nl: { champ: 'Kampioenschap', after: 'Na ronde {R} van {N}', left: 'nog {L} · max {M} ptn per team', final: 'Eindstand', pre: 'Voorseizoen',
      team: 'Team', wins: 'Zeges', gap: 'Gat', pts: 'Ptn', drivers: 'Coureurs', contention: 'Nog in de race', mostWins: 'Meeste zeges', lastWin: 'Laatste zege',
      rnd: 'R&D-update', week: 'Week {W}', upgrades: 'Upgrades dit seizoen', ok: '{A} van {B} gelukt', last: 'Laatste upgrades', factory: 'In de fabriek',
      ready: 'klaar week {W}', improved: 'Meeste vooruitgang', failed: 'mislukt', fieldRank: 'Plek', season: 'dit seizoen',
      paddock: 'Paddocknieuws', contracts: 'Onze contracten', roles: { driver: 'coureur', reserve: 'reserve', chiefEngineer: 'hoofdengineer', technicalDirector: 'technisch directeur', teamPrincipal: 'teambaas', sportingDirector: 'sportief directeur', commercialDirector: 'commercieel directeur' }, market: 'Transfermarkt', ending: 'Contract loopt af in {Y}', free: 'Vrije coureurs', injured: 'Geblesseerd', none: 'Nog geen paddocknieuws over ons team.',
      noRnd: 'Geen ontwikkeldata in deze save.', lvl: 'lvl', saved: 'Opgeslagen', reserve: 'reserve' }
  };
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
  const n1 = (x, lang) => { if (x == null) return '–'; const t = Number.isInteger(x) ? String(x) : (+x).toFixed(1); return lang === 'nl' ? t.replace('.', ',') : t; };

  function frame(canvas, scale) {
    canvas.width = W * scale; canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); stripe(ctx, 0, 14); ctx.fillStyle = C.red; ctx.fillRect(0, 14, W, 4);
    return ctx;
  }
  function header(ctx, kicker, title, sub) {
    label(ctx, kicker, 48, 56, C.bgMuted);
    ctx.font = F(900, 38, true); ctx.fillStyle = C.bgText; const ti = String(title).toUpperCase(); ctx.fillText(fit(ctx, ti, 640), 48, 98);
    const tw = Math.min(640, ctx.measureText(ti).width);
    ctx.font = F(600, 16); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, sub || '', 700 - tw), 48 + tw + 18, 97);
  }
  function segments(ctx, x, y, w, n, done, colorOf) {
    const gap = n > 30 ? 2 : 4, sw = (w - gap * (n - 1)) / Math.max(1, n);
    for (let i = 0; i < n; i++) {
      const sx = x + i * (sw + gap), c = colorOf(i);
      if (c.fill) { ctx.fillStyle = c.fill; ctx.fillRect(sx, y, sw, 12); }
      else { ctx.strokeStyle = c.stroke || C.bgLine; ctx.lineWidth = 1.5; ctx.strokeRect(sx + .75, y + .75, sw - 1.5, 10.5); }
    }
  }
  function plate(ctx, color) {
    const X = 48, Y = 128, PW = 668, PH = 444;
    ctx.fillStyle = C.panel; ctx.fillRect(X, Y, PW, PH);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(X + 1.5, Y + 1.5, PW - 3, PH - 3);
    if (color) { ctx.fillStyle = color; ctx.fillRect(X + 3, Y + 3, 12, PH - 6); }
    return { X, Y, PW, PH };
  }
  function footer(ctx, s, t, lang, extra) {
    ctx.fillStyle = C.bgLine; ctx.fillRect(48, 598, W - 96, 1);
    ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted;
    const bits = [t.saved + ' ' + T.fmtDate(s.savedAt, lang)].concat(extra || []); if (s.cheat) bits.push('cheat mode');
    ctx.fillText(fit(ctx, bits.join('  ·  '), 860), 48, 636);
    ctx.font = F(900, 20, true); ctx.textAlign = 'right'; ctx.fillStyle = C.red; ctx.fillText('SAVE CARD', W - 48, 637);
    const bw = ctx.measureText('SAVE CARD').width; ctx.fillStyle = C.bgText; ctx.fillText('DM ', W - 48 - bw, 637); ctx.textAlign = 'left';
  }
  const RX = 752, RW = 400;

  // ------------------------------------------------------------ championship
  function championship(canvas, s, v, opts) {
    const lang = opts.lang === 'nl' ? 'nl' : 'en', t = L[lang], ctx = frame(canvas, opts.scale || 2);
    const sub = v.preseason ? t.pre : v.finished ? t.final : fill(t.after, { R: v.round, N: v.total });
    header(ctx, s.category || 'Delta Manager', t.champ + ' ' + v.season, sub);
    if (!v.finished && !v.preseason) {
      ctx.font = F(600, 13); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right';
      ctx.fillText(fill(t.left, { L: v.left, M: n1(v.maxTeam, lang) }), W - 48, 56); ctx.textAlign = 'left';
    }
    segments(ctx, 772, 74, 380, Math.max(1, v.total), v.round, i => (i < v.round ? { fill: i === v.round - 1 ? C.red : C.bgText } : {}));

    // Team table
    const P = plate(ctx, null);
    const x0 = P.X + 30, xT = x0 + 64, xW = P.X + P.PW - 200, xG = P.X + P.PW - 120, xP = P.X + P.PW - 30;
    let y = P.Y + 34;
    label(ctx, '#', x0, y, C.faint); label(ctx, t.team, xT, y, C.faint);
    label(ctx, t.wins, xW, y, C.faint, 'right'); label(ctx, t.gap, xG, y, C.faint, 'right'); label(ctx, t.pts, xP, y, C.faint, 'right');
    ctx.fillStyle = C.ink; ctx.fillRect(x0, y + 10, P.PW - 60, 2);
    const max = 10; let rows = v.teams.slice(0, max);
    const mi = v.teams.findIndex(r => r.mine); if (mi >= max) rows = rows.slice(0, max - 1).concat([v.teams[mi]]);
    const dec = v.teams.some(r => !Number.isInteger(r.points));
    y += 16;
    rows.forEach((r, i) => {
      const ry = y + i * 38, base = ry + 26;
      if (r.mine) { ctx.fillStyle = C.sel; ctx.fillRect(x0 - 8, ry + 2, P.PW - 44, 36); ctx.fillStyle = C.gold; ctx.fillRect(x0 - 8, ry + 2, 4, 36); }
      else { ctx.fillStyle = C.hair; ctx.fillRect(x0, ry + 38, P.PW - 60, 1); }
      const out = r.alive === false;
      ctx.font = F(800, r.pos != null && r.pos <= 3 ? 20 : 17, true); ctx.fillStyle = out ? C.faint : C.ink;
      ctx.fillText(r.pos == null ? '–' : r.pos + (r.tied ? '=' : ''), x0, base);
      if (r.move) { ctx.font = F(700, 11); ctx.fillStyle = r.move > 0 ? C.navy : C.faint; ctx.fillText((r.move > 0 ? '▲' : '▼') + Math.abs(r.move), x0 + 32, base - 2); }
      ctx.fillStyle = r.color || C.faint; ctx.fillRect(xT - 14, ry + 11, 4, 20);
      ctx.font = F(r.mine || r.partner ? 700 : 500, 16); ctx.fillStyle = out ? C.faint : C.ink;
      ctx.fillText(fitName(ctx, r.team, xW - xT - 50), xT, base);
      ctx.font = F(600, 15); ctx.fillStyle = C.muted; ctx.textAlign = 'right';
      ctx.fillText(String(r.wins || 0), xW, base);
      ctx.fillText(r.gap ? '−' + n1(r.gap, lang) : '–', xG, base);
      ctx.font = F(800, 17, true); ctx.fillStyle = out ? C.faint : C.ink; ctx.fillText(dec ? (+r.points).toFixed(1) : String(r.points), xP, base);
      ctx.textAlign = 'left';
    });

    // Right column: drivers + key facts
    let ry = 150;
    label(ctx, t.drivers, RX, ry, C.bgMuted); ry += 12;
    const dd = v.drivers.slice(0, 6), ddec = dd.some(d => !Number.isInteger(d.points));
    dd.forEach((d, i) => {
      const yy = ry + i * 30, base = yy + 21;
      ctx.font = F(700, 14); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right'; ctx.fillText(d.pos == null ? '–' : d.pos + (d.tied ? '=' : ''), RX + 26, base); ctx.textAlign = 'left';
      ctx.fillStyle = d.color || C.bgMuted; ctx.fillRect(RX + 38, yy + 8, 4, 16);
      ctx.font = F(500, 14); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, d.name, RW - 130), RX + 52, base);
      ctx.font = F(700, 14); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right'; ctx.fillText(ddec ? (+d.points).toFixed(1) : String(d.points), RX + RW, base); ctx.textAlign = 'left';
    });
    ry += 6 * 30 + 34;
    const facts = [];
    if (!v.preseason && !v.finished) facts.push([t.contention, v.contenders + ' / ' + v.teams.length]);
    if (v.mostWins) facts.push([t.mostWins, v.mostWins.team, String(v.mostWins.wins)]);
    if (v.lastWin) facts.push([t.lastWin, v.lastWin.team, '']);
    facts.slice(0, 3).forEach(([k, val, right], i) => {
      const yy = ry + i * 56;
      ctx.fillStyle = C.bgLine; ctx.fillRect(RX, yy - 22, RW, 1);
      label(ctx, k, RX, yy, C.bgMuted);
      ctx.font = F(800, 19, true); ctx.fillStyle = C.bgText;
      const rw = right ? ctx.measureText(right).width + 16 : 0;
      ctx.fillText(fitName(ctx, String(val), RW - rw), RX, yy + 26);
      if (right) { ctx.textAlign = 'right'; ctx.fillText(right, RX + RW, yy + 26); ctx.textAlign = 'left'; }
    });
    footer(ctx, s, t, lang, v.next ? [(lang === 'nl' ? 'Volgende: ' : 'Next: ') + v.next.name] : []);
    return canvas;
  }

  // ------------------------------------------------------------ R&D update
  function rnd(canvas, s, v, opts) {
    const lang = opts.lang === 'nl' ? 'nl' : 'en', t = L[lang], ctx = frame(canvas, opts.scale || 2);
    if (!v) { header(ctx, s.category || 'Delta Manager', t.rnd, ''); ctx.font = F(600, 18); ctx.fillStyle = C.bgText; ctx.fillText(t.noRnd, 48, 200); footer(ctx, s, t, lang); return canvas; }
    header(ctx, s.category || 'Delta Manager', t.rnd, v.team + ' · ' + fill(t.week, { W: v.week }));
    label(ctx, t.upgrades, 772, 56, C.bgMuted);
    ctx.font = F(700, 13); ctx.fillStyle = C.bgText; ctx.textAlign = 'right'; ctx.fillText(fill(t.ok, { A: v.successes, B: v.done }), W - 48, 56); ctx.textAlign = 'left';
    segments(ctx, 772, 74, 380, Math.max(1, v.history.length), v.history.length, i => (v.history[i] == null ? {} : v.history[i] ? { fill: C.gold } : { stroke: C.red }));

    // Attributes: value, rank in the field, bar from the field's lowest to highest value
    const P = plate(ctx, v.color);
    const x0 = P.X + 38, xV = x0 + 190, bx = xV + 70, bw = 230, xR = P.X + P.PW - 30;
    const rows = v.attrs.slice(0, 8), rh = Math.min(50, (P.PH - 40) / rows.length);
    rows.forEach((a, i) => {
      const y = P.Y + 26 + i * rh, base = y + rh / 2 + 8;
      if (i) { ctx.fillStyle = C.hair; ctx.fillRect(x0, y, P.PW - 66, 1); }
      label(ctx, lang === 'nl' ? a.nl : a.label, x0, base - 2, C.faint);
      ctx.font = F(800, 22, true); ctx.fillStyle = C.ink; ctx.fillText(n1(a.value, lang), xV, base + 2);
      // bar
      const lo = a.min, hi = a.best ? a.best.v : a.value, span = Math.max(0.0001, hi - lo);
      ctx.fillStyle = C.hair; ctx.fillRect(bx, base - 9, bw, 8);
      const px = bx + bw * Math.max(0, Math.min(1, (a.value - lo) / span));
      ctx.fillStyle = a.rank <= 3 ? C.navy : C.faint; ctx.fillRect(bx, base - 9, Math.max(2, px - bx), 8);
      ctx.fillStyle = C.ink; ctx.fillRect(px - 1.5, base - 14, 3, 18);
      // rank chip
      ctx.font = F(800, 13, true); const rt = '#' + a.rank + ' / ' + a.of; const rw = ctx.measureText(rt).width + 16;
      if (a.rank === 1) { ctx.fillStyle = C.gold; ctx.fillRect(xR - rw, base - 17, rw, 24); ctx.fillStyle = C.ink; }
      else if (a.rank <= 3) { ctx.fillStyle = C.navy; ctx.fillRect(xR - rw, base - 17, rw, 24); ctx.fillStyle = C.white; }
      else { ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.strokeRect(xR - rw + .75, base - 16.25, rw - 1.5, 22.5); ctx.fillStyle = C.ink; }
      ctx.textAlign = 'center'; ctx.fillText(rt, xR - rw / 2, base); ctx.textAlign = 'left';
      if (a.delta) { ctx.font = F(700, 12); ctx.fillStyle = a.delta > 0 ? C.navy : C.red; ctx.textAlign = 'right'; ctx.fillText((a.delta > 0 ? '+' : '−') + n1(Math.abs(a.delta), lang), xR - rw - 10, base); ctx.textAlign = 'left'; }
    });

    // Right column: last upgrades, factory, most improved
    let y = 150;
    label(ctx, t.last, RX, y, C.bgMuted); y += 14;
    for (const u of v.upgrades.slice(0, 5)) {
      const base = y + 22;
      if (u.success) { ctx.fillStyle = C.gold; ctx.fillRect(RX, y + 6, 22, 22); ctx.fillStyle = C.ink; } else { ctx.strokeStyle = C.red; ctx.lineWidth = 1.5; ctx.strokeRect(RX + .75, y + 6.75, 20.5, 20.5); ctx.fillStyle = C.red; }
      ctx.font = F(800, 14); ctx.textAlign = 'center'; ctx.fillText(u.success ? '✓' : '✕', RX + 11, base); ctx.textAlign = 'left';
      const nm = lang === 'nl' ? (V.NAMES_NL[u.key] || u.name) : u.name;
      ctx.font = F(600, 15); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, nm, 200), RX + 34, base);
      ctx.font = F(600, 14); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right';
      ctx.fillText((u.success && u.to != null && u.from != null ? '+' + n1(+(u.to - u.from).toFixed(2), lang) : t.failed) + '  ·  W' + u.week, RX + RW, base); ctx.textAlign = 'left';
      y += 32;
    }
    y += 22;
    if (v.inProgress.length) {
      label(ctx, t.factory, RX, y, C.bgMuted); y += 8;
      for (const d of v.inProgress.slice(0, 3)) {
        const nm = lang === 'nl' ? (V.NAMES_NL[d.key] || d.name) : d.name;
        ctx.font = F(600, 15); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, nm, 200), RX, y + 22);
        ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right'; ctx.fillText(fill(t.ready, { W: d.ready }) + (d.risk ? ' · ' + d.risk : ''), RX + RW, y + 22); ctx.textAlign = 'left';
        y += 28;
      }
      y += 22;
    }
    if (v.topGainers.length && y < 520) {
      label(ctx, t.improved, RX, y, C.bgMuted); y += 8;
      v.topGainers.slice(0, Math.max(1, Math.floor((580 - y) / 26))).forEach((g, i) => {
        ctx.font = F(g.mine ? 700 : 500, 14); ctx.fillStyle = C.bgText; ctx.fillText(fitName(ctx, (i + 1) + '. ' + g.team, RW - 70), RX, y + 20);
        ctx.font = F(700, 14); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right'; ctx.fillText('+' + n1(g.gain, lang), RX + RW, y + 20); ctx.textAlign = 'left';
        y += 26;
      });
    }
    footer(ctx, s, t, lang, [v.budget != null ? 'Budget ' + n1(+(+v.budget).toFixed(1), lang) + 'M' : null, v.spending != null ? (lang === 'nl' ? 'Ontwikkeling ' : 'Development ') + n1(+(+v.spending).toFixed(1), lang) + 'M ' + t.season : null].filter(Boolean));
    return canvas;
  }

  // ------------------------------------------------------------ paddock news
  function paddock(canvas, s, v, opts) {
    const lang = opts.lang === 'nl' ? 'nl' : 'en', t = L[lang], ctx = frame(canvas, opts.scale || 2);
    header(ctx, [s.category || 'Delta Manager', v.focusTeam].filter(Boolean).join(' · '), t.paddock, fill(t.week, { W: v.week }) + ' · ' + v.season);
    const heads = V.paddockHeadlines(v, lang, 'press').slice(0, 5);
    const P = plate(ctx, null);
    let y = P.Y + 30;
    if (!heads.length) { ctx.font = F(600, 18); ctx.fillStyle = C.muted; ctx.fillText(t.none, P.X + 38, y + 30); }
    heads.forEach((h, i) => {
      if (y > P.Y + P.PH - 70) return;
      const x = P.X + 38;
      if (i) { ctx.fillStyle = C.hair; ctx.fillRect(x, y - 14, P.PW - 66, 1); }
      // week tag
      ctx.font = F(800, 11, true); const tag = h.week ? 'W' + h.week : '·'; const tw = Math.max(34, ctx.measureText(tag).width + 14);
      if (h.mine) { ctx.fillStyle = C.navy; ctx.fillRect(x, y, tw, 20); ctx.fillStyle = C.white; } else { ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.strokeRect(x + .75, y + .75, tw - 1.5, 18.5); ctx.fillStyle = C.muted; }
      ctx.textAlign = 'center'; ctx.fillText(tag, x + tw / 2, y + 14); ctx.textAlign = 'left';
      ctx.font = F(i === 0 ? 900 : 800, i === 0 ? 24 : 19, true); ctx.fillStyle = C.ink;
      const lines = wrap(ctx, h.head, P.PW - 66 - tw - 16, 2);
      lines.forEach((ln, j) => ctx.fillText(ln, x + tw + 14, y + 17 + j * (i === 0 ? 28 : 23)));
      y += 17 + (lines.length - 1) * (i === 0 ? 28 : 23) + 22;
      if (h.detail) { ctx.font = F(500, 14); ctx.fillStyle = C.muted; ctx.fillText(fit(ctx, h.detail, P.PW - 66 - tw - 16), x + tw + 14, y); }
      y += 36;
    });

    // Right column: our contracts (drivers, reserves, staff)
    let ry = 150;
    label(ctx, t.contracts, RX, ry, C.bgMuted); ry += 12;
    const roleName = r => (t.roles[r] || r);
    for (const c of v.contracts.slice(0, 9)) {
      const ends = c.until === v.season;
      ctx.fillStyle = ends ? C.gold : C.bgLine; ctx.fillRect(RX, ry + 8, 3, 18);
      ctx.font = F(ends ? 700 : 500, 14); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, c.name, 186), RX + 12, ry + 22);
      ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, roleName(c.role), 150), RX + 205, ry + 22);
      ctx.font = F(700, 14); ctx.fillStyle = ends ? C.gold : C.bgMuted; ctx.textAlign = 'right'; ctx.fillText(c.until ? String(c.until) : '–', RX + RW, ry + 22); ctx.textAlign = 'left';
      ry += 30;
    }
    if (!v.contracts.length) { ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.fillText('–', RX, ry + 22); ry += 30; }
    if (v.injured.length && ry < 520) {
      ry += 20; label(ctx, t.injured, RX, ry, C.bgMuted); ry += 8;
      for (const d of v.injured.slice(0, 2)) { ctx.font = F(600, 14); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, d.name + (d.weeks ? ' · ' + d.weeks + ' wk' : ''), RW), RX, ry + 22); ry += 28; }
    }
    footer(ctx, s, t, lang);
    return canvas;
  }


  // ------------------------------------------------------------ race strategy / progress
  const LS = {
    en: { strat: 'Race strategy', prog: 'Race progress', round: 'Round {R}', laps: '{L} laps', grid: 'Grid', finish: 'Finish', from: 'from P{S}',
      stops: '{N} stops', stop1: '1 stop', pit: '{X} s in the pits', underSc: '{N} under caution', sc: 'SC', vsc: 'VSC', red: 'Red flag',
      fuel: 'fuel only', hint: 'Load the race export to show stints, pit stops and safety cars.', ours: 'Ours', winner: 'Winner', noRace: 'No race run yet this season.' },
    nl: { strat: 'Racestrategie', prog: 'Raceverloop', round: 'Ronde {R}', laps: '{L} ronden', grid: 'Start', finish: 'Finish', from: 'vanaf P{S}',
      stops: '{N} stops', stop1: '1 stop', pit: '{X} s in de pits', underSc: '{N} onder caution', sc: 'SC', vsc: 'VSC', red: 'Rode vlag',
      fuel: 'alleen tanken', hint: 'Laad de race-export om stints, pitstops en safety cars te tonen.', ours: 'Wij', winner: 'Winnaar', noRace: 'Nog geen race gereden in dit seizoen.' }
  };
  function strategy(canvas, s, v, opts) {
    const lang = opts.lang === 'nl' ? 'nl' : 'en', t = Object.assign({}, L[lang], LS[lang]), ctx = frame(canvas, opts.scale || 2);
    if (!v) { header(ctx, s.category || 'Delta Manager', t.prog, ''); ctx.font = F(600, 18); ctx.fillStyle = C.bgText; ctx.fillText(t.noRace, 48, 200); footer(ctx, s, t, lang); return canvas; }
    const kicker = [s.category, v.circuit].filter(Boolean).join(' · ');
    const X = 48, Y = 128, PW = W - 96, PH = 444;
    ctx.fillStyle = C.panel; ctx.fillRect(X, Y, PW, PH); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(X + 1.5, Y + 1.5, PW - 3, PH - 3);
    const n1l = x => n1(x, lang);

    if (!v.hasExport) {
      // Same layout as with the export; without it only result and stop count are known.
      header(ctx, kicker, t.strat, fill(t.round, { R: v.round }));
      const me = v.cars.filter(c => c.mine).sort((a, b) => (a.finished === b.finished ? a.finish - b.finish : a.finished ? -1 : 1))[0];
      if (me) {
        const tiles = [[t.finish, me.finished ? 'P' + me.finish : (me.status || 'DNF'), fill(t.from, { S: me.start })],
          ['Stops', me.stops != null ? String(me.stops) : '–', ''], [lang === 'nl' ? 'In de pits' : 'In the pits', '–', ''],
          [lang === 'nl' ? 'Onder caution' : 'Under caution', '–', ''], [lang === 'nl' ? 'Langste stint' : 'Longest stint', '–', '']];
        const tw = (PW - 60) / tiles.length;
        tiles.forEach(([k, val, sub], i) => {
          const tx = X + 30 + i * tw;
          ctx.fillStyle = C.ink; ctx.fillRect(tx, Y + 26, tw - 16, 2);
          label(ctx, k, tx, Y + 48, C.faint);
          ctx.font = F(900, 30, true); ctx.fillStyle = i === 0 && !me.finished ? C.red : val === '–' ? C.border : C.ink; ctx.fillText(val, tx, Y + 84);
          if (sub) { ctx.font = F(500, 12); ctx.fillStyle = C.muted; ctx.fillText(fit(ctx, sub, tw - 20), tx, Y + 102); }
        });
      }
      ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]); ctx.strokeRect(X + 30.5, Y + 140.5, PW - 61, PH - 171); ctx.setLineDash([]);
      // Without the export: the circuit itself, so the card still shows where it happened.
      const rd = s.last && s.rounds.list.find(r => r.round === s.last.round), tr = rd && rd.track;
      if (tr) { Card.helpers.drawTrack(ctx, tr, X + 60, Y + 160, PW - 120, PH - 250, { width: 6, line: C.ink });
        ctx.font = F(600, 13); ctx.fillStyle = C.muted; ctx.textAlign = 'center';
        ctx.fillText([rd.name, rd.km ? n1(+rd.km.toFixed(1), lang) + ' km' : null, rd.laps ? rd.laps + (lang === 'nl' ? ' ronden' : ' laps') : null, T.trackType(rd.type, lang) || null].filter(Boolean).join('  ·  '), X + PW / 2, Y + PH - 66);
        ctx.font = F(500, 12); ctx.fillText(t.hint, X + PW / 2, Y + PH - 44); ctx.textAlign = 'left';
      } else {
      ctx.font = F(800, 20, true); ctx.fillStyle = C.muted; ctx.textAlign = 'center';
      ctx.fillText(t.hint, X + PW / 2, Y + 140 + (PH - 170) / 2 + 6); ctx.textAlign = 'left'; }
      footer(ctx, s, t, lang, v.team ? [v.team] : []);
      return canvas;
    }

    // Stint chart from the race export
    header(ctx, kicker, t.strat, fill(t.round, { R: v.round }) + ' · ' + fill(t.laps, { L: v.laps }));
    // legend
    let lgx = W - 48; ctx.font = F(600, 12);
    const legend = v.compounds.map(c => [c.name, c.color, 'tyre']).concat(v.cautions.some(c => c.kind === 'sc') ? [[t.sc, 'rgba(226,180,60,.45)', 'band']] : [])
      .concat(v.cautions.some(c => c.kind === 'vsc') ? [[t.vsc, 'rgba(142,154,175,.45)', 'band']] : []).concat(v.cautions.some(c => c.kind === 'red') ? [[t.red, C.red, 'band']] : []);
    for (const [name, col] of legend.reverse()) {
      const nm = fit(ctx, name, 170), w = ctx.measureText(nm).width;
      lgx -= w; ctx.fillStyle = C.bgMuted; ctx.fillText(nm, lgx, 60); lgx -= 22;
      ctx.fillStyle = col; ctx.fillRect(lgx, 49, 14, 14); ctx.strokeStyle = C.bgLine; ctx.lineWidth = 1; ctx.strokeRect(lgx + .5, 49.5, 13, 13); lgx -= 18;
    }
    // Our own car(s) only: key numbers, stint bar, then the stint table of the best-placed car
    const pick = v.cars.filter(c => c.mine).sort((a, b) => (a.finished === b.finished ? a.finish - b.finish : a.finished ? -1 : 1)).slice(0, 2);
    const lead = pick[0];
    if (!lead) { ctx.font = F(600, 16); ctx.fillStyle = C.muted; ctx.fillText('–', X + 30, Y + 60); footer(ctx, s, t, lang); return canvas; }
    const realStops = c => (c.pits || []).filter(p => !p.free);
    // tiles
    const tiles = [[t.finish, lead.finished ? 'P' + lead.finish : (lead.status || 'DNF'), fill(t.from, { S: lead.start })],
      [lang === 'nl' ? 'Stops' : 'Stops', String(realStops(lead).length), (lead.pits || []).filter(p => p.fuelOnly).length ? (lead.pits || []).filter(p => p.fuelOnly).length + '× ' + t.fuel : ''],
      [lang === 'nl' ? 'In de pits' : 'In the pits', n1l(lead.pitTime) + ' s', realStops(lead).length ? 'Ø ' + n1l(+(lead.pitTime / realStops(lead).length).toFixed(1)) + ' s' : ''],
      [lang === 'nl' ? 'Onder caution' : 'Under caution', String(lead.cautionStops || 0), v.cautions.length ? v.cautions.map(c => (c.kind === 'red' ? t.red : c.kind.toUpperCase()) + ' ' + c.from + (c.to > c.from ? '–' + c.to : '')).join(' · ') : ''],
      [lang === 'nl' ? 'Langste stint' : 'Longest stint', String(Math.max(...(lead.stints || [{ from: 0, to: 0 }]).map(st => st.to - st.from))), lang === 'nl' ? 'ronden' : 'laps']];
    const tw = (PW - 60) / tiles.length;
    tiles.forEach(([k, val, sub], i) => {
      const tx = X + 30 + i * tw;
      ctx.fillStyle = C.ink; ctx.fillRect(tx, Y + 26, tw - 16, 2);
      label(ctx, k, tx, Y + 48, C.faint);
      ctx.font = F(900, 30, true); ctx.fillStyle = i === 0 && !lead.finished ? C.red : C.ink; ctx.fillText(val, tx, Y + 84);
      if (sub) { ctx.font = F(500, 12); ctx.fillStyle = C.muted; ctx.fillText(fit(ctx, sub, tw - 20), tx, Y + 102); }
    });
    // stint chart
    const cx0 = X + 30, cx1 = X + PW - 30, top = Y + 150, rowH = 46;
    const xAt = lap => cx0 + (cx1 - cx0) * Math.max(0, Math.min(1, lap / v.laps));
    const step = v.laps <= 40 ? 5 : v.laps <= 100 ? 10 : v.laps <= 250 ? 25 : 50;
    ctx.font = F(600, 11); ctx.fillStyle = C.faint; ctx.textAlign = 'center';
    for (let l = 0; l <= v.laps; l += step) { const lx = xAt(l || 1); ctx.fillText(String(l || 1), lx, top - 14); ctx.fillStyle = C.hair; ctx.fillRect(lx, top - 6, 1, pick.length * rowH); ctx.fillStyle = C.faint; }
    ctx.textAlign = 'left';
    for (const c of v.cautions) {
      const a = xAt(c.from - 1), b = xAt(c.to);
      if (c.kind === 'red') { ctx.fillStyle = C.red; ctx.fillRect(a, top - 8, 2.5, pick.length * rowH + 2); continue; }
      ctx.fillStyle = c.kind === 'sc' ? 'rgba(226,180,60,.30)' : 'rgba(142,154,175,.30)'; ctx.fillRect(a, top - 8, Math.max(3, b - a), pick.length * rowH + 2);
    }
    pick.forEach((c, i) => {
      const mid = top + i * rowH + 18;
      if (pick.length > 1) { ctx.font = F(800, 12, true); ctx.fillStyle = C.ink; ctx.fillText((c.finished ? 'P' + c.finish : c.status) + ' · ' + c.drivers.map(d => d.split(' ').slice(-1)[0]).join('/'), cx0, mid - 16); }
      for (const st of c.stints || []) {
        const a = xAt(st.from) + (st.from ? 1.5 : 0), b = xAt(st.to) - 1.5;
        ctx.fillStyle = st.color || '#8E9AAF'; ctx.fillRect(a, mid - 10, Math.max(2, b - a), 20);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(a + .5, mid - 9.5, Math.max(1, b - a - 1), 19);
        if (b - a > 22) { ctx.font = F(700, 12); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(String(st.to - st.from), (a + b) / 2, mid + 4); ctx.textAlign = 'left'; }
      }
      for (const p of c.pits || []) {
        const px = xAt(p.lap); ctx.fillStyle = p.botched ? C.red : C.ink;
        if (p.fuelOnly) { ctx.beginPath(); ctx.arc(px, mid + 17, 3.5, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(px - 5, mid + 20); ctx.lineTo(px + 5, mid + 20); ctx.lineTo(px, mid + 13); ctx.closePath(); ctx.fill(); }
      }
      if (c.outLap) { ctx.font = F(800, 15); ctx.fillStyle = C.red; ctx.textAlign = 'center'; ctx.fillText('✕', xAt(c.outLap) + 8, mid + 5); ctx.textAlign = 'left'; }
    });
    // stint table of the lead car
    let ty = top + pick.length * rowH + 24;
    const cols = [[lang === 'nl' ? 'Stint' : 'Stint', 0], [lang === 'nl' ? 'Ronden' : 'Laps', 70], [lang === 'nl' ? 'Lengte' : 'Length', 190], [lang === 'nl' ? 'Band' : 'Tyre', 280], [lang === 'nl' ? 'Einde stint' : 'Stint ended by', 560]];
    for (const [k, dx] of cols) label(ctx, k, cx0 + dx, ty, C.faint);
    ctx.fillStyle = C.ink; ctx.fillRect(cx0, ty + 8, cx1 - cx0, 2);
    ty += 10;
    const rows = Math.max(1, Math.floor((Y + PH - 34 - ty) / 25));
    const stints = (lead.stints || []).slice(0, rows);
    const tyreStops = (lead.pits || []).filter(p => !p.fuelOnly);
    stints.forEach((st, i) => {
      const yy = ty + 19 + i * 25;
      if (i) { ctx.fillStyle = C.hair; ctx.fillRect(cx0, yy - 18, cx1 - cx0, 1); }
      ctx.font = F(800, 14, true); ctx.fillStyle = C.ink; ctx.fillText(String(i + 1), cx0, yy);
      ctx.font = F(500, 14); ctx.fillStyle = C.ink; ctx.fillText((st.from + 1) + '–' + st.to, cx0 + 70, yy);
      ctx.font = F(700, 14); ctx.fillText(String(st.to - st.from), cx0 + 190, yy);
      ctx.fillStyle = st.color || '#8E9AAF'; ctx.fillRect(cx0 + 280, yy - 11, 12, 12); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(cx0 + 280.5, yy - 10.5, 11, 11);
      ctx.font = F(500, 14); ctx.fillStyle = C.ink; ctx.fillText(fit(ctx, st.compound || '–', 240), cx0 + 300, yy);
      const stop = tyreStops.find(p => p.lap === st.to);
      const fuel = (lead.pits || []).filter(p => p.fuelOnly && p.lap > st.from && p.lap < st.to);
      let end = stop ? (lang === 'nl' ? 'stop ronde ' : 'stop lap ') + stop.lap + ' · ' + n1l(stop.time) + ' s' + (stop.caution ? ' · ' + t.sc : '') + (stop.botched ? (lang === 'nl' ? ' · mislukt' : ' · botched') : '')
        : lead.outLap && st.to === lead.outLap ? (lang === 'nl' ? 'uitgevallen' : 'retired') : (lang === 'nl' ? 'finish' : 'finish');
      if (fuel.length) end += ' · ' + fuel.length + '× ' + t.fuel + (lang === 'nl' ? ' (ronde ' : ' (lap ') + fuel.map(p => p.lap).join(', ') + ')';
      ctx.font = F(500, 14); ctx.fillStyle = stop && stop.botched ? C.red : C.muted; ctx.fillText(fit(ctx, end, cx1 - cx0 - 560), cx0 + 560, yy);
    });
    footer(ctx, s, t, lang, v.team ? [v.team] : []);
    return canvas;
  }


  // ------------------------------------------------------------ NASCAR-style race recap (American English)
  const ord = n => { if (n == null) return '–'; const v = n % 100; return n + (v >= 11 && v <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'); };
  function usRace(canvas, s, v, opts) {
    const ctx = frame(canvas, opts.scale || 2), t = L.en, img = opts.img || (() => null);
    if (!v) { header(ctx, s.category || 'NASCAR', 'Race results', ''); ctx.font = F(600, 18); ctx.fillStyle = C.bgText; ctx.fillText('No race run yet this season.', 48, 200); footer(ctx, s, t, 'en'); return canvas; }
    header(ctx, [v.series, 'Round ' + v.round + (v.total ? ' of ' + v.total : '')].filter(Boolean).join(' · '), 'Race results',
      [v.track, v.laps ? v.laps + ' laps' : '', v.raceMiles ? v.raceMiles + ' mi' : ''].filter(Boolean).join(' · '));
    if (v.miles) { ctx.font = F(600, 13); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right'; ctx.fillText(v.miles.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '-mile track', W - 48, 56); ctx.textAlign = 'left'; }

    // Plate: Victory Lane + top 10
    const P = plate(ctx, v.winner ? v.winner.color : null);
    const x0 = P.X + 38;
    label(ctx, 'Victory Lane', x0, P.Y + 34, C.faint);
    if (v.winner) {
      const hasFace = !!img(v.winner.face), fx = hasFace ? x0 + 74 : x0;
      if (hasFace) picture(ctx, img(v.winner.face), x0, P.Y + 42, 62, 70, '', null);
      if (img(v.winner.logo)) logoPic(ctx, img(v.winner.logo), P.X + P.PW - 100, P.Y + 30, 70, 70, '', null);
      ctx.font = F(900, 32, true); ctx.fillStyle = C.ink; ctx.fillText(fit(ctx, v.winner.driver.toUpperCase(), P.PW - 190 - (fx - x0)), fx, P.Y + 76);
      ctx.font = F(500, 15); ctx.fillStyle = C.muted;
      ctx.fillText(fit(ctx, v.winner.team + ' · from ' + ord(v.winner.start) + (v.winner.stops != null ? ' · ' + v.winner.stops + ' stops' : ''), P.PW - 190 - (fx - x0)), fx, P.Y + 100);
    }
    let y = P.Y + 128;
    const xD = x0 + 64, xT = x0 + 250, xS = P.X + P.PW - 120, xP = P.X + P.PW - 30;
    label(ctx, 'Pos', x0, y, C.faint); label(ctx, 'Driver', xD, y, C.faint); label(ctx, 'Team', xT, y, C.faint);
    label(ctx, 'Start', xS, y, C.faint, 'right'); label(ctx, 'Pts', xP, y, C.faint, 'right');
    ctx.fillStyle = C.ink; ctx.fillRect(x0, y + 8, P.PW - 68, 2);
    let rows = v.top.slice(0, 10);
    const outside = v.ours.filter(o => !rows.includes(o));
    if (outside.length) rows = rows.slice(0, 10 - Math.min(2, outside.length)).concat(outside.slice(0, 2));
    rows.forEach((r, i) => {
      const ry = y + 12 + i * 29, base = ry + 20;
      if (r.mine) { ctx.fillStyle = C.sel; ctx.fillRect(x0 - 8, ry, P.PW - 52, 28); ctx.fillStyle = C.gold; ctx.fillRect(x0 - 8, ry, 4, 28); }
      else if (i) { ctx.fillStyle = C.hair; ctx.fillRect(x0, ry, P.PW - 68, 1); }
      ctx.font = F(800, 15, true); ctx.fillStyle = r.finished ? C.ink : C.red; ctx.fillText(r.finished ? String(r.pos) : (r.status || 'DNF').slice(0, 3), x0, base);
      if (img(r.logo)) logoPic(ctx, img(r.logo), xD - 30, ry + 3, 22, 22, '', null); else { ctx.fillStyle = r.color || C.faint; ctx.fillRect(xD - 12, ry + 6, 4, 17); }
      ctx.font = F(r.mine ? 700 : 600, 15); ctx.fillStyle = C.ink; ctx.fillText(fit(ctx, r.driver, xT - xD - 14), xD, base);
      ctx.font = F(500, 13); ctx.fillStyle = C.muted; ctx.fillText(fit(ctx, r.team, xS - xT - 70), xT, base);
      ctx.textAlign = 'right'; ctx.font = F(500, 13); ctx.fillStyle = C.muted;
      ctx.fillText(r.start != null ? r.start + (r.gain ? (r.gain > 0 ? '  ▲' + r.gain : '  ▼' + -r.gain) : '') : '–', xS, base);
      ctx.font = F(800, 15, true); ctx.fillStyle = C.ink; ctx.fillText(r.points != null ? String(r.points) : '–', xP, base); ctx.textAlign = 'left';
    });

    // Right column: our race, points, stages, next
    let ry = 150;
    if (v.ours.length) {
      label(ctx, 'Our race', RX, ry, C.bgMuted); ry += 8;
      for (const o of v.ours.slice(0, 2)) {
        const fc = img(o.face); let ox = RX;
        if (fc) { picture(ctx, fc, RX, ry + 4, 40, 46, '', null, true); ox = RX + 52; }
        ctx.font = F(900, 34, true); ctx.fillStyle = o.finished ? C.bgText : C.red; const big = o.finished ? ord(o.pos).toUpperCase() : (o.status || 'DNF');
        ctx.fillText(big, ox, ry + 36); const bw = ctx.measureText(big).width + (ox - RX);
        ctx.font = F(700, 15); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, o.driver, RW - bw - 18), RX + bw + 16, ry + 20);
        ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted;
        ctx.fillText(fit(ctx, ['from ' + ord(o.start), o.gain ? (o.gain > 0 ? '+' : '−') + Math.abs(o.gain) : '', o.stops != null ? o.stops + ' stops' : '', o.points != null ? o.points + ' pts' : ''].filter(Boolean).join(' · '), RW - bw - 18), RX + bw + 16, ry + 38);
        ry += 52;
      }
      ry += 22;
    }
    label(ctx, 'Points standings', RX, ry, C.bgMuted); ry += 8;
    let pts = v.standings.slice(0, 5);
    const ourOut = (v.ourStandings || []).filter(o => !pts.some(p => p.name === o.name)).slice(0, 1);
    if (ourOut.length) pts = pts.slice(0, 4).concat(ourOut.map(o => Object.assign({ mine: true, color: s.focus && s.focus.color }, o)));
    pts.forEach(d => {
      const base = ry + 22;
      if (d.mine) { ctx.fillStyle = C.bgRow; ctx.fillRect(RX - 10, ry + 3, RW + 10, 28); ctx.fillStyle = C.gold; ctx.fillRect(RX - 10, ry + 3, 3, 28); }
      ctx.font = F(700, 14); ctx.fillStyle = d.mine ? C.bgText : C.bgMuted; ctx.textAlign = 'right'; ctx.fillText(String(d.pos == null ? '–' : d.pos), RX + 22, base); ctx.textAlign = 'left';
      ctx.fillStyle = d.color || C.bgMuted; ctx.fillRect(RX + 32, ry + 9, 4, 16);
      ctx.font = F(d.mine ? 700 : 500, 14); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, d.name, RW - 150), RX + 46, base);
      ctx.font = F(700, 14); ctx.textAlign = 'right'; ctx.fillStyle = C.bgText; ctx.fillText(String(d.points), RX + RW - 62, base);
      ctx.fillStyle = C.bgMuted; ctx.font = F(500, 13); ctx.fillText(d.back ? '−' + d.back : 'leader', RX + RW, base); ctx.textAlign = 'left';
      ry += 30;
    });
    ry += 22;
    if (v.stages.length && ry < 540) {
      label(ctx, 'Stage winners', RX, ry, C.bgMuted); ry += 6;
      ctx.font = F(600, 14); ctx.fillStyle = C.bgText;
      ctx.fillText(fit(ctx, v.stages.map(x => 'S' + x.stage + ' ' + x.driver).join('  ·  '), RW), RX, ry + 20); ry += 40;
    }
    footer(ctx, s, t, 'en', [v.team, v.next ? 'Next: ' + v.next.track : ''].filter(Boolean));
    return canvas;
  }


  // ------------------------------------------------------------ images (faces, logos from the game's resources)
  function picture(ctx, img, x, y, w, h, fallback, color, dark) {
    if (img && img.naturalWidth) {
      ctx.fillStyle = dark ? '#1C2539' : C.white; ctx.fillRect(x, y, w, h);
      const r = Math.min(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * r, ih = img.naturalHeight * r;
      ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih), iw, ih);
    } else {
      ctx.fillStyle = color || (dark ? '#26304A' : C.hair); ctx.fillRect(x, y, w, h);
      ctx.font = F(900, Math.round(h * 0.34), true); ctx.fillStyle = color ? Card.helpers.readable(color) : C.faint; ctx.textAlign = 'center';
      ctx.fillText(String(fallback || '').slice(0, 3), x + w / 2, y + h / 2 + h * 0.12); ctx.textAlign = 'left';
    }
    ctx.strokeStyle = dark ? C.bgLine : C.border; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
  }
  // Team logos: centred, no box (faces keep the box and stand on its bottom edge).
  function logoPic(ctx, img, x, y, w, h, fallback, color) {
    if (img && img.naturalWidth) Card.helpers.drawLogo(ctx, img, x, y, w, h); else picture(ctx, img, x, y, w, h, fallback, color);
  }
  const initialsOf = n => String(n || '?').replace(/\(.*?\)/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  // ------------------------------------------------------------ season preview
  const SL = {
    en: { preview: 'Season preview', review: 'Season review', soFar: 'Season so far', target: 'Target', lineup: 'Line-up', lastYear: 'Last season', titles: 'Titles',
      calendar: 'The calendar', rounds: 'Rounds', opener: 'Season opener', finale: 'Finale', sprints: 'Sprint weekends', champion: 'Champion {Y}', tips: 'Tipped in testing',
      age: 'age', lvl: 'lvl', until: 'until', reserve: 'reserve', final: 'Final position', after: 'After round {R} of {N}', best: 'Best result', ourDrivers: 'Our drivers',
      leader: 'Leader', champs: 'Champions', ahead: 'ahead of target', on: 'on target', behind: 'behind target', rounds2: 'Round by round', pts: 'pts', limited: 'From the career record' },
    nl: { preview: 'Voorbeschouwing', review: 'Seizoensoverzicht', soFar: 'Tussenstand', target: 'Doel', lineup: 'Line-up', lastYear: 'Vorig seizoen', titles: 'Titels',
      calendar: 'De kalender', rounds: 'Ronden', opener: 'Openingsrace', finale: 'Finale', sprints: 'Sprintweekenden', champion: 'Kampioen {Y}', tips: 'Getipt in de tests',
      age: 'leeftijd', lvl: 'lvl', until: 'tot', reserve: 'reserve', final: 'Eindpositie', after: 'Na ronde {R} van {N}', best: 'Beste resultaat', ourDrivers: 'Onze coureurs',
      leader: 'Leider', champs: 'Kampioen', ahead: 'boven verwachting', on: 'op koers', behind: 'onder verwachting', rounds2: 'Per ronde', pts: 'ptn', limited: 'Uit de carrièregegevens' }
  };
  function seasonStart(canvas, s, v, opts) {
    const lang = opts.lang === 'nl' ? 'nl' : 'en', t = Object.assign({}, T.L(lang), L[lang], SL[lang]), ctx = frame(canvas, opts.scale || 2), img = opts.img || (() => null);
    header(ctx, s.category || 'Delta Manager', t.preview + ' ' + v.season, v.rounds + ' ' + t.rounds.toLowerCase() + (v.first ? ' · ' + v.first.name : ''));
    const P = plate(ctx, v.color);
    const x0 = P.X + 38;
    logoPic(ctx, img(v.logo), x0, P.Y + 26, 76, 76, initialsOf(v.team), v.color);
    ctx.font = F(900, 26, true); ctx.fillStyle = C.ink;
    Card.helpers.wrap(ctx, String(v.name || v.team || '').toUpperCase(), P.PW - 180, 2).forEach((ln, i) => ctx.fillText(ln, x0 + 98, P.Y + 52 + i * 30));
    const facts = [];
    if (v.target) facts.push([t.target, 'P' + v.target]);
    if (v.last) facts.push([t.lastYear, 'P' + v.last.pos + ' · ' + n1(v.last.points, lang) + ' ' + t.pts]);
    if (v.titles) facts.push([t.titles, String(v.titles)]);
    facts.forEach(([k, val], i) => { const fx = x0 + i * 200; ctx.fillStyle = C.ink; ctx.fillRect(fx, P.Y + 124, 180, 2); label(ctx, k, fx, P.Y + 146, C.faint);
      ctx.font = F(900, 28, true); ctx.fillStyle = C.ink; ctx.fillText(fit(ctx, val, 180), fx, P.Y + 180); });
    // line-up with faces
    label(ctx, t.lineup, x0, P.Y + 222, C.faint);
    const lu = v.lineup.slice(0, 4), cw = (P.PW - 76) / Math.max(3, lu.length);
    lu.forEach((d, i) => {
      const cx = x0 + i * cw, cy = P.Y + 236;
      picture(ctx, img(d.face), cx, cy, Math.min(110, cw - 20), 120, initialsOf(d.name), null);
      ctx.font = F(800, 15, true); ctx.fillStyle = C.ink; ctx.fillText(fit(ctx, d.name, cw - 16), cx, cy + 144);
      ctx.font = F(500, 12); ctx.fillStyle = C.muted;
      ctx.fillText(fit(ctx, [d.cc, d.age ? t.age + ' ' + d.age : '', d.level != null ? t.lvl + ' ' + n1(d.level, lang) : '', d.role === 'reserve' ? t.reserve : ''].filter(Boolean).join(' · '), cw - 16), cx, cy + 162);
      if (d.until) ctx.fillText(t.until + ' ' + d.until, cx, cy + 178);
    });
    // right column
    let y = 150;
    label(ctx, t.calendar, RX, y, C.bgMuted); y += 10;
    const cal = [[t.rounds, String(v.rounds)], [t.opener, v.first ? v.first.name : '–'], [t.finale, v.finale ? v.finale.name : '–']].concat(v.sprints ? [[t.sprints, String(v.sprints)]] : []);
    cal.forEach(([k, val]) => { ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(k, RX, y + 20); ctx.font = F(700, 14); ctx.fillStyle = C.bgText; ctx.textAlign = 'right'; ctx.fillText(fit(ctx, val, RW - 140), RX + RW, y + 20); ctx.textAlign = 'left'; y += 28; });
    y += 26;
    if (v.champion && (v.champion.team || v.champion.driver)) {
      label(ctx, fill(t.champion, { Y: v.prevSeason }), RX, y, C.bgMuted); y += 10;
      if (v.champion.driver) { picture(ctx, img(v.champion.driver.image), RX, y + 6, 46, 52, initialsOf(v.champion.driver.name), null, true);
        ctx.font = F(800, 16, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, v.champion.driver.name, RW - 60), RX + 58, y + 28);
        ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(v.champion.driver.points != null ? n1(v.champion.driver.points, lang) + ' ' + t.pts : '', RX + 58, y + 48); y += 64; }
      if (v.champion.team) { ctx.font = F(600, 14); ctx.fillStyle = C.bgText; ctx.fillText(fitName(ctx, short(v.champion.team.name), RW), RX, y + 18); y += 30; }
      y += 18;
    }
    if (v.tips.length && y < 520) {
      label(ctx, t.tips, RX, y, C.bgMuted); y += 6;
      v.tips.slice(0, 3).forEach(tp => { ctx.font = F(600, 14); ctx.fillStyle = C.bgText; ctx.fillText(fitName(ctx, tp, RW), RX, y + 20); y += 24; });
    }
    footer(ctx, s, t, lang);
    return canvas;
  }
  const short = n => String(n || '').replace(/\s*\(#\s?(\d{1,3})\)\s*$/, ' #$1');

  // ------------------------------------------------------------ season review
  function seasonEnd(canvas, s, v, opts) {
    const lang = opts.lang === 'nl' ? 'nl' : 'en', t = Object.assign({}, T.L(lang), L[lang], SL[lang]), ctx = frame(canvas, opts.scale || 2), img = opts.img || (() => null);
    if (!v) { header(ctx, s.category || 'Delta Manager', t.review, ''); footer(ctx, s, t, lang); return canvas; }
    header(ctx, [s.category, v.team].filter(Boolean).join(' · '), (v.finished ? t.review : t.soFar) + ' ' + v.season, v.finished ? '' : fill(t.after, { R: v.round, N: v.total }));
    const P = plate(ctx, v.color);
    const x0 = P.X + 38;
    logoPic(ctx, img(v.logo), x0, P.Y + 26, 76, 76, initialsOf(v.team), v.color);
    label(ctx, v.finished ? t.final : t.championship, x0 + 100, P.Y + 46, C.faint);
    ctx.font = F(900, 64, true); ctx.fillStyle = C.ink; const big = v.pos ? 'P' + v.pos + (v.tied ? '=' : '') : '–'; ctx.fillText(big, x0 + 96, P.Y + 104);
    const bw = ctx.measureText(big).width;
    ctx.font = F(800, 26, true); ctx.fillText(n1(v.points, lang) + ' ' + t.pts.toUpperCase(), x0 + 120 + bw, P.Y + 80);
    ctx.font = F(500, 14); ctx.fillStyle = C.muted;
    // The gap that matters: to P1 while the title is still possible, otherwise to the team right ahead.
    const SLn = T.story(s, lang), f0 = s.focus, toP1 = v.gapToTop ? '−' + n1(v.gapToTop, lang) + ' ' + (lang === 'nl' ? 'op P1' : 'to P1') : '';
    const sub = v.pos === 1 && v.finished ? t.champs + '!' : !v.finished && s.story && s.story.titleOpen === false && f0 && f0.ahead && f0.gapAhead != null
      ? '−' + n1(f0.gapAhead, lang) + ' ' + (lang === 'nl' ? 'op ' : 'to ') + f0.ahead : toP1;
    if (sub) ctx.fillText(sub, x0 + 120 + bw, P.Y + 102);
    if (v.verdict) {
      const txt = (t.target + ' P' + v.target + ' · ' + t[v.verdict]).toUpperCase(); ctx.font = F(700, 12);
      const w = ctx.measureText(txt).width + 22, bx = P.X + P.PW - 30 - w;
      if (v.verdict === 'behind') { ctx.strokeStyle = C.red; ctx.lineWidth = 1.5; ctx.strokeRect(bx + .75, P.Y + 30.75, w - 1.5, 24.5); ctx.fillStyle = C.red; }
      else { ctx.fillStyle = v.pos === 1 ? C.gold : C.navy; ctx.fillRect(bx, P.Y + 30, w, 26); ctx.fillStyle = v.pos === 1 ? C.ink : C.white; }
      ctx.fillText(txt, bx + 11, P.Y + 48);
    }
    // stats
    const stats = [[t.wins, v.wins], [t.podiums, v.podiums], [t.poles, v.poles], [t.dnf, v.dnf], [t.best, v.best ? 'P' + v.best.pos : '–']].filter(x => x[1] != null);
    const cw = (P.PW - 66) / 5;
    stats.forEach(([k, val], i) => { const cx = x0 + i * cw; ctx.fillStyle = C.ink; ctx.fillRect(cx, P.Y + 130, cw - 12, 2); label(ctx, k, cx, P.Y + 152, C.faint);
      ctx.font = F(800, 28, true); ctx.fillStyle = C.ink; ctx.fillText(String(val), cx, P.Y + 186); });
    if (v.best) { ctx.font = F(500, 12); ctx.fillStyle = C.muted; ctx.fillText(fit(ctx, v.best.track, cw - 14), x0 + 4 * cw, P.Y + 204); }
    // round by round
    let y = P.Y + 238;
    if (v.form.length) {
      label(ctx, t.rounds2, x0, y, C.faint); y += 12;
      const sameCc = new Set(v.form.map(r => r.cc)).size === 1;   // one country (NASCAR): show the track instead
      const n = v.form.length, perRow = n > 18 ? Math.ceil(n / 2) : n, gap = 4, w = Math.min(54, (P.PW - 76 - gap * (perRow - 1)) / perRow);
      v.form.forEach((r, i) => {
        const row = Math.floor(i / perRow), col = i % perRow, fx = x0 + col * (w + gap), fy = y + row * 70;
        const win = r.pos === 1, pod = r.pos != null && r.pos <= 3, out = r.pos == null;
        if (win) { ctx.fillStyle = C.gold; ctx.fillRect(fx, fy, w, 30); ctx.fillStyle = C.ink; }
        else if (pod) { ctx.fillStyle = C.navy; ctx.fillRect(fx, fy, w, 30); ctx.fillStyle = C.white; }
        else if (out) { ctx.strokeStyle = C.red; ctx.lineWidth = 1.5; ctx.strokeRect(fx + .75, fy + .75, w - 1.5, 28.5); ctx.fillStyle = C.red; }
        else { ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.strokeRect(fx + .75, fy + .75, w - 1.5, 28.5); ctx.fillStyle = C.ink; }
        ctx.font = F(800, w < 34 ? 11 : 13, true); ctx.textAlign = 'center'; ctx.fillText(out ? 'DNF' : String(r.pos), fx + w / 2, fy + 20);
        ctx.font = F(600, 10); ctx.fillStyle = C.faint; ctx.fillText(sameCc ? (r.track || '').replace(/[^A-Za-z ]/g, '').trim().slice(0, 3).toUpperCase() || String(r.round) : r.cc || String(r.round), fx + w / 2, fy + 44); ctx.textAlign = 'left';
      });
    } else if (v.limited) { ctx.font = F(500, 14); ctx.fillStyle = C.muted; ctx.fillText(t.limited, x0, y + 10); }
    // the story in the numbers: headline, rival, target and what the next race can change
    if (!v.finished) {
      const rowsN = v.form.length > 18 ? 2 : 1, ys = Math.max(y + rowsN * 70 + 6, P.Y + 322);
      const ls = [SLn.rival ? [SLn.rival, SLn.score].filter(Boolean).join(' ') : '', SLn.target, SLn.need].filter(Boolean);
      if ((SLn.headline || ls.length) && ys + 40 < P.Y + P.PH) {
        ctx.fillStyle = C.ink; ctx.fillRect(x0, ys, P.PW - 66, 2);
        let ly = ys + 30;
        if (SLn.headline) { ctx.font = F(900, 24, true); ctx.fillStyle = C.ink; ctx.fillText(fit(ctx, SLn.headline.toUpperCase(), P.PW - 76), x0, ly + 2); ly += 30; }
        ctx.font = F(500, 14); ctx.fillStyle = C.muted;
        for (const ln of ls) for (const part of Card.helpers.wrap(ctx, ln, P.PW - 76, 2)) { if (ly > P.Y + P.PH - 12) break; ctx.fillText(part, x0, ly); ly += 20; }
      }
    }
    // right column: champion + our drivers
    let ry = 150;
    label(ctx, v.finished ? fill(t.champion, { Y: v.season }) : t.leader, RX, ry, C.bgMuted); ry += 10;
    if (v.championDriver) {
      picture(ctx, img(v.championDriver.face), RX, ry + 6, 70, 80, initialsOf(v.championDriver.name), null, true);
      ctx.font = F(800, 18, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, v.championDriver.name, RW - 86), RX + 84, ry + 34);
      ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, [v.championDriver.team, v.championDriver.points != null ? n1(v.championDriver.points, lang) + ' ' + t.pts : ''].filter(Boolean).join(' · '), RW - 86), RX + 84, ry + 56);
      ry += 96;
    }
    if (v.champion) { ctx.font = F(600, 14); ctx.fillStyle = C.bgText; ctx.fillText(fitName(ctx, v.champion.team + ' · ' + n1(v.champion.points, lang) + ' ' + t.pts, RW), RX, ry + 18); ry += 40; }
    if (v.drivers.length) {
      ry += 10; label(ctx, t.ourDrivers, RX, ry, C.bgMuted); ry += 10;
      v.drivers.slice(0, 3).forEach(d => {
        picture(ctx, img(d.face), RX, ry + 6, 40, 46, initialsOf(d.name), null, true);
        ctx.font = F(700, 15); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, d.name, RW - 140), RX + 52, ry + 28);
        ctx.font = F(800, 15, true); ctx.textAlign = 'right'; ctx.fillText(d.pos ? 'P' + d.pos + (d.tied ? '=' : '') : '–', RX + RW - 70, ry + 28);
        ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(n1(d.points, lang) + ' ' + t.pts, RX + RW, ry + 28); ctx.textAlign = 'left';
        ry += 54;
      });
    }
    footer(ctx, s, t, lang);
    return canvas;
  }

  root.DMCards = { championship, rnd, paddock, strategy, usRace, us: usRace, seasonStart, seasonEnd };
})(typeof self !== 'undefined' ? self : this);
