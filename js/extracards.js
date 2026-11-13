/* DM Save Card — cards for the extra post types (redesign style):
   raceweek preview, here we go, teammate duel, development race (1200 × 675) and
   season wrapped (portrait slides, 540 × 675 logical → 1080 × 1350 PNG). */
(function (root) {
  'use strict';
  const Card = root.DMCard, X = root.DMExtra;
  const { C, F, fit, wrap, label } = Card.helpers;
  const W = Card.W, H = Card.H;
  const WCOL = [C.redText, C.orange, C.bgText, C.green, C.gold];
  const L = {
    en: { raceweek: 'Raceweek', round: 'Round', week: 'week', laps: 'laps', sprint: 'sprint weekend', standing: 'Championship', form: 'Form', here: 'Last time here', first: 'First visit in this playthrough',
      car: 'Our car', strong: 'Strongest', weak: 'Weakest', ask: 'Where do we finish?', opts: ['Podium', 'Points', 'No points'], ahead: 'to', behind: 'over', target: 'Board target', pts: 'pts',
      hwg: 'Here we go!', stays: 'Here we go!', bye: 'Goodbye', expiring: 'Contract watch', contract: 'Contract', done: 'Done deal', role: 'Role', until: 'Contract until', age: 'Age', level: 'Level', potential: 'Potential', career: 'Career', wins: 'wins', titles: 'titles', roles: { driver: 'Race driver', reserve: 'Reserve' },
      duel: 'Teammate duel', races: 'Races', quali: 'Qualifying', points: 'Points', best: 'Best result', avg: 'Average finish', dnf: 'DNFs', gained: 'Places gained', perRace: 'Race by race', same: 'Our drivers share one car: no duel.',
      dev: 'Development race', index: 'Car index (all areas)', carNow: 'Car now', devSeason: 'Development this season', of: 'of', upOk: 'upgrade', upBad: 'failed upgrade', more: 'gained more', less: 'gained less',
      words: X.WORDS.en, wrapped: 'Wrapped', season: 'Season', final: 'Final standings', now: 'So far', numbers: 'The numbers', racesN: 'races', winN: 'win', winsN: 'wins', podN: 'podiums', ptsN: 'in the points',
      inShort: 'In short', perRound: 'Championship per round', rounds: 'Rounds', racesL: 'races', placesUp: 'places up', placesDown: 'places down', steady: 'same place', avgShort: 'avg', dnfShort: 'DNF', allRaces: 'Every race', worth: 'Worth telling', quiet: 'No race stood out.', noRaces: 'No races run yet this season.',
      why: { win: 'win', podium: 'podium', dnf: 'out from P{S}', climb: 'from P{S}, +{G}', drop: 'from P{S} to P{P}', top5: 'top 5', pole: 'pole' },
      moment: 'Best moment', from: 'from', climb: 'Biggest climb', places: 'places', driver: 'Driver of the year', factory: 'The factory', upgrades: 'upgrades worked', inField: 'in the field', story: 'The story', chapters: 'chapters', startedWith: 'It started with', endsWith: 'Latest' },
    nl: { raceweek: 'Raceweek', round: 'Ronde', week: 'week', laps: 'ronden', sprint: 'sprintweekend', standing: 'Kampioenschap', form: 'Vorm', here: 'Vorige keer hier', first: 'Eerste bezoek in deze playthrough',
      car: 'Onze auto', strong: 'Sterkste', weak: 'Zwakste', ask: 'Waar eindigen we?', opts: ['Podium', 'Punten', 'Geen punten'], ahead: 'naar', behind: 'op', target: 'Doel bestuur', pts: 'ptn',
      hwg: 'Here we go!', stays: 'Here we go!', bye: 'Vaarwel', expiring: 'Contract loopt af', contract: 'Contract', done: 'Deal rond', role: 'Rol', until: 'Contract tot', age: 'Leeftijd', level: 'Niveau', potential: 'Potentieel', career: 'Carrière', wins: 'zeges', titles: 'titels', roles: { driver: 'Racecoureur', reserve: 'Reserve' },
      duel: 'Teamgenotenduel', races: 'Races', quali: 'Kwalificatie', points: 'Punten', best: 'Beste resultaat', avg: 'Gemiddelde finish', dnf: 'Uitvallers', gained: 'Plekken gewonnen', perRace: 'Per race', same: 'Onze coureurs delen één auto: geen duel.',
      dev: 'Ontwikkelingsrace', index: 'Auto-index (alle gebieden)', carNow: 'Auto nu', devSeason: 'Ontwikkeling dit seizoen', of: 'van', upOk: 'upgrade', upBad: 'mislukte upgrade', more: 'meer ontwikkeld', less: 'minder ontwikkeld',
      words: X.WORDS.nl, wrapped: 'Wrapped', season: 'Seizoen', final: 'Eindstand', now: 'Tot nu toe', numbers: 'De cijfers', racesN: 'races', winN: 'zege', winsN: 'zeges', podN: 'podiums', ptsN: 'in de punten',
      inShort: 'In het kort', perRound: 'Kampioenschap per ronde', rounds: 'Ronde', racesL: 'races', placesUp: 'plekken omhoog', placesDown: 'plekken omlaag', steady: 'zelfde plek', avgShort: 'gem.', dnfShort: 'DNF', allRaces: 'Alle races', worth: 'Het vertellen waard', quiet: 'Geen race sprong eruit.', noRaces: 'Nog geen races gereden dit seizoen.',
      why: { win: 'zege', podium: 'podium', dnf: 'uitgevallen vanaf P{S}', climb: 'vanaf P{S}, +{G}', drop: 'van P{S} naar P{P}', top5: 'top 5', pole: 'pole' },
      moment: 'Beste moment', from: 'vanaf', climb: 'Grootste inhaalrace', places: 'plekken', driver: 'Coureur van het jaar', factory: 'De fabriek', upgrades: 'upgrades gelukt', inField: 'in het veld', story: 'Het verhaal', chapters: 'hoofdstukken', startedWith: 'Het begon met', endsWith: 'Laatste' }
  };
  const lg = o => (o && o.lang === 'nl' ? 'nl' : 'en');
  const n1 = (x, lang) => { if (x == null) return '–'; const t = Number.isInteger(x) ? String(x) : (+x).toFixed(1); return lang === 'nl' ? t.replace('.', ',') : t; };

  // ------------------------------------------------------------ shared frame
  function chequer(ctx, w, h) { const sq = h / 2; ctx.fillStyle = C.panel; ctx.fillRect(0, 0, w, h); ctx.fillStyle = C.ink; for (let x = 0, i = 0; x < w; x += sq, i++) ctx.fillRect(x, i % 2 ? sq : 0, sq, sq); }
  function frame(canvas, scale, color, w, h) {
    w = w || W; h = h || H;
    canvas.width = w * scale; canvas.height = h * scale;
    const ctx = canvas.getContext('2d'); ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); chequer(ctx, w, 14); ctx.fillStyle = C.red; ctx.fillRect(0, 14, w, 4);
    if (color) { ctx.fillStyle = color; ctx.fillRect(0, 18, 10, h - 18); }
    return ctx;
  }
  function slash(ctx, x, y, h) { ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -0.32, 1, 0, 0); ctx.fillStyle = C.red; ctx.fillRect(0, 0, 6, h); ctx.fillStyle = C.green; ctx.fillRect(10, 0, 6, h); ctx.restore(); }
  function kicker(ctx, text, sub, col) {
    slash(ctx, 48, 40, 22); ctx.font = F(800, 22, true); ctx.fillStyle = col || C.bgText; const k = String(text).toUpperCase(); ctx.fillText(k, 76, 60);
    if (sub) label(ctx, sub, 76 + ctx.measureText(k).width + 18, 59, C.bgMuted);
  }
  function footer(ctx, left, w, y) {
    w = w || W; y = y || 610;
    ctx.fillStyle = C.bgLine; ctx.fillRect(48, y, w - 96, 1);
    ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, left || '', w - 300), 48, y + 32);
    ctx.font = F(900, 20, true); ctx.textAlign = 'right'; ctx.fillStyle = C.red; ctx.fillText('SAVE CARD', w - 48, y + 33);
    const bw = ctx.measureText('SAVE CARD').width; ctx.fillStyle = C.bgText; ctx.fillText('DM ', w - 48 - bw, y + 33); ctx.textAlign = 'left';
  }
  function panel(ctx, x, y, w, h) { ctx.fillStyle = C.pit; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.bgLine; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1); }
  function chip(ctx, text, x, y, kind) {
    ctx.font = F(800, 15, true); const w = Math.max(46, ctx.measureText(text).width + 18);
    const fills = { gold: C.gold, good: C.green }, fg = fills[kind];
    if (fg) { ctx.fillStyle = fg; ctx.fillRect(x, y, w, 30); ctx.fillStyle = C.ink; }
    else { ctx.strokeStyle = kind === 'bad' ? C.redText : C.bgLine; ctx.lineWidth = 1.5; ctx.strokeRect(x + .75, y + .75, w - 1.5, 28.5); ctx.fillStyle = kind === 'bad' ? C.redText : C.bgText; }
    ctx.textAlign = 'center'; ctx.fillText(text, x + w / 2, y + 21); ctx.textAlign = 'left';
    return w;
  }
  const resKind = p => (p == null ? 'bad' : p === 1 ? 'gold' : p <= 3 ? 'good' : '');
  function face(ctx, img, name, color, x, y, r) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath();
    ctx.fillStyle = color || C.bgRow; ctx.fill(); ctx.clip();
    if (img && img.naturalWidth) { const s = Math.max((2 * r) / img.naturalWidth, (2 * r) / img.naturalHeight); const w = img.naturalWidth * s, h = img.naturalHeight * s; ctx.drawImage(img, x - w / 2, y - h / 2, w, h); }
    else { const ini = String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); ctx.fillStyle = Card.helpers.readable(color); ctx.font = F(800, r * 0.8, true); ctx.textAlign = 'center'; ctx.fillText(ini, x, y + r * 0.28); ctx.textAlign = 'left'; }
    ctx.restore(); ctx.strokeStyle = C.bgText; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }
  const imgOf = (opts, p) => (opts.img && p ? opts.img(p) : null);
  const label2 = (ctx, t, x, y) => label(ctx, t, x, y, C.bgMuted);

  // ------------------------------------------------------------ 1. raceweek preview
  function preview(canvas, s, v, opts) {
    const lang = lg(opts), t = L[lang], ctx = frame(canvas, opts.scale || 2, v && v.color);
    kicker(ctx, t.raceweek, [(v.category || '') + ' ' + v.season, v.next ? t.round + ' ' + v.next.round + ' / ' + v.next.total : ''].filter(Boolean).join('  ·  '), C.red);
    if (!v.next) { ctx.font = F(800, 64, true); ctx.fillStyle = C.bgText; ctx.fillText(lang === 'nl' ? 'SEIZOEN VOORBIJ' : 'SEASON OVER', 46, 150); footer(ctx, v.team); return canvas; }
    ctx.font = F(800, 92, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, v.next.name.toUpperCase(), 1100), 44, 156);
    ctx.font = F(600, 18); ctx.fillStyle = C.bgMuted;
    ctx.fillText([v.next.cc, t.week + ' ' + v.next.week, v.next.laps ? v.next.laps + ' ' + t.laps : null, v.next.sprint ? t.sprint : null].filter(Boolean).join('  ·  '), 48, 190);
    // Standing
    panel(ctx, 48, 222, 330, 190);
    label2(ctx, t.standing, 70, 252);
    const pre = v.preseason || v.pos == null;
    ctx.font = F(800, 86, true); ctx.fillStyle = C.bgText; const ps = pre ? (v.expected ? 'P' + v.expected : '–') : 'P' + v.pos; ctx.fillText(ps, 66, 340);
    const pw = ctx.measureText(ps).width;
    ctx.font = F(700, 22); ctx.fillStyle = C.bgMuted; ctx.fillText(pre ? (lang === 'nl' ? 'doel' : 'target') : n1(v.points, lang) + ' ' + t.pts, 66 + pw + 14, 336);
    ctx.font = F(500, 15); ctx.fillStyle = C.bgText;
    if (!pre && v.ahead && v.pos > 1) ctx.fillText(fit(ctx, '↑ ' + n1(v.gapAhead, lang) + ' ' + t.pts + ' ' + t.ahead + ' ' + v.ahead, 290), 70, 374);
    if (!pre && v.behind) ctx.fillText(fit(ctx, '↓ ' + n1(v.gapBehind, lang) + ' ' + t.pts + ' ' + t.behind + ' ' + v.behind, 290), 70, 398);
    // Form
    label2(ctx, t.form, 408, 252);
    let fx = 408;
    for (const f of v.form) { const w = chip(ctx, f.label, fx, 266, resKind(f.pos)); ctx.font = F(600, 11); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'center'; ctx.fillText(f.cc || '', fx + w / 2, 314); ctx.textAlign = 'left'; fx += w + 8; }
    if (!v.form.length) { ctx.font = F(500, 16); ctx.fillStyle = C.bgMuted; ctx.fillText('–', 408, 288); }
    // Last time here
    label2(ctx, t.here, 408, 356);
    ctx.font = F(700, 22); ctx.fillStyle = C.bgText;
    if (v.here.length) { let hx = 408; for (const h of v.here.slice(0, 3)) { ctx.font = F(600, 14); ctx.fillStyle = C.bgMuted; ctx.fillText(String(h.season), hx, 392); const yw = ctx.measureText(String(h.season)).width + 8; const w = chip(ctx, h.label, hx + yw, 372, resKind(h.pos)); hx += yw + w + 16; } }
    else { ctx.font = F(500, 16); ctx.fillStyle = C.bgMuted; ctx.fillText(t.first, 408, 392); }
    // Car in words
    const cx = 790, cw = W - 48 - cx;
    panel(ctx, cx, 222, cw, 190);
    label2(ctx, t.car, cx + 20, 252);
    const row = (lab, a, y) => { if (!a) return; ctx.font = F(500, 15); ctx.fillStyle = C.bgMuted; ctx.fillText(lab, cx + 20, y); ctx.font = F(600, 18); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, lang === 'nl' ? a.nl : a.label, cw - 170), cx + 20, y + 26);
      ctx.font = F(700, 22); ctx.fillStyle = WCOL[a.w]; ctx.textAlign = 'right'; ctx.fillText(t.words[a.w], cx + cw - 20, y + 26); ctx.textAlign = 'left'; };
    row(t.strong, v.strong, 290); if (v.weak && v.strong && v.weak.key !== v.strong.key && v.weak.w !== v.strong.w) row(t.weak, v.weak, 356);
    // Poll
    label2(ctx, t.ask, 48, 458);
    t.opts.forEach((o, i) => { const bx = 48 + i * 372, cols = [C.gold, C.green, C.redText]; panel(ctx, bx, 472, 356, 84); ctx.fillStyle = cols[i]; ctx.fillRect(bx, 472, 6, 84);
      ctx.font = F(800, 36, true); ctx.fillStyle = C.bgText; ctx.fillText(String.fromCharCode(65 + i), bx + 26, 528); ctx.font = F(700, 26); ctx.fillText(o.toUpperCase(), bx + 70, 526); });
    footer(ctx, [v.team, v.expected ? t.target + ' P' + v.expected : null].filter(Boolean).join('  ·  '));
    return canvas;
  }

  // ------------------------------------------------------------ 2. here we go
  function transfer(canvas, s, v, opts) {
    const lang = lg(opts), t = L[lang], ctx = frame(canvas, opts.scale || 2, v && v.color);
    if (!v || v.empty) { kicker(ctx, t.contract, v ? v.team : ''); footer(ctx, v ? v.team : ''); return canvas; }
    const head = { signing: t.hwg, extension: t.stays, departure: t.bye, expiring: t.expiring, contract: t.contract }[v.type] || t.contract;
    const col = v.type === 'departure' ? C.redText : v.type === 'expiring' ? C.orange : v.type === 'contract' ? C.bgText : C.green;
    kicker(ctx, head, [(v.category || '') + ' ' + v.season, v.team].filter(Boolean).join('  ·  '), col);
    // Face
    face(ctx, imgOf(opts, v.face), v.name, v.color, 200, 330, 136);
    if (v.cc) { ctx.font = F(800, 20, true); const w = ctx.measureText(v.cc).width + 18; ctx.fillStyle = C.bgText; ctx.fillRect(200 - w / 2, 456, w, 30); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(v.cc, 200, 478); ctx.textAlign = 'left'; }
    // Name and facts
    const x = 400;
    ctx.font = F(800, 74, true); ctx.fillStyle = C.bgText;
    const lines = wrap(ctx, v.name.toUpperCase(), W - 48 - x, 2);
    lines.forEach((l, i) => ctx.fillText(l, x, 160 + i * 72));
    let y = 160 + (lines.length - 1) * 72 + 42;
    ctx.font = F(600, 20); ctx.fillStyle = col; ctx.fillText((v.type === 'departure' ? '← ' : '→ ') + v.teamName, x, y);
    y += 40;
    const facts = [[t.role, t.roles[v.role] || v.role], [t.until, v.until || '–'], [t.age, v.age ?? '–'], [t.level, v.levelWord != null ? { w: v.levelWord } : '–'],
      [t.potential, v.potentialWord != null ? { w: v.potentialWord } : '–'], [t.career, (v.careerWins || 0) + ' ' + t.wins + (v.titles ? ' · ' + v.titles + ' ' + t.titles : '')]];
    facts.forEach(([k, val], i) => {
      const fx = x + (i % 2) * 380, fy = y + Math.floor(i / 2) * 64;
      label2(ctx, k, fx, fy);
      if (val && typeof val === 'object') { ctx.font = F(800, 30, true); ctx.fillStyle = WCOL[val.w]; ctx.fillText(t.words[val.w], fx, fy + 34); }
      else { ctx.font = F(800, 30, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, String(val), 350), fx, fy + 34); }
    });
    if (v.traits.length) { let tx = x; const ty = y + 3 * 64 + 4; for (const tr of v.traits.slice(0, 4)) { ctx.font = F(600, 14); const w = ctx.measureText(tr).width + 20; if (tx + w > W - 48) break; ctx.strokeStyle = C.bgLine; ctx.lineWidth = 1.5; ctx.strokeRect(tx, ty, w, 28); ctx.fillStyle = C.bgText; ctx.fillText(tr, tx + 10, ty + 19); tx += w + 8; } }
    // Stamp
    if (v.type === 'signing' || v.type === 'extension') {
      ctx.save(); ctx.translate(1040, 120); ctx.rotate(-0.16); ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.font = F(800, 34, true); const st = t.done.toUpperCase(); const sw = ctx.measureText(st).width + 30;
      ctx.strokeRect(-sw / 2, -30, sw, 52); ctx.fillStyle = C.green; ctx.textAlign = 'center'; ctx.fillText(st, 0, 8); ctx.restore(); ctx.textAlign = 'left';
    }
    footer(ctx, v.team);
    return canvas;
  }

  // ------------------------------------------------------------ 3. teammate duel
  function duel(canvas, s, v, opts) {
    const lang = lg(opts), t = L[lang], ctx = frame(canvas, opts.scale || 2, v && v.color);
    kicker(ctx, t.duel, [(v.category || '') + ' ' + v.season, v.team].filter(Boolean).join('  ·  '));
    if (!v || v.empty || v.sameCar) { ctx.font = F(600, 22); ctx.fillStyle = C.bgMuted; ctx.fillText(v && v.sameCar ? t.same : '–', 48, 160); footer(ctx, v ? v.team : ''); return canvas; }
    const A = v.a, B = v.b, ca = v.color || C.red, cb = C.bgText;
    face(ctx, imgOf(opts, A.face), A.name, ca, 130, 168, 66);
    face(ctx, imgOf(opts, B.face), B.name, '#5A4F44', W - 130, 168, 66);
    ctx.font = F(800, 38, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, A.name.toUpperCase(), 330), 214, 162);
    ctx.textAlign = 'right'; ctx.fillText(fit(ctx, B.name.toUpperCase(), 330), W - 214, 162); ctx.textAlign = 'left';
    ctx.font = F(600, 16); ctx.fillStyle = C.bgMuted; ctx.fillText(A.pos ? 'P' + A.pos + ' · ' + n1(A.points, lang) + ' ' + t.pts : '', 214, 190);
    ctx.textAlign = 'right'; ctx.fillText(B.pos ? 'P' + B.pos + ' · ' + n1(B.points, lang) + ' ' + t.pts : '', W - 214, 190); ctx.textAlign = 'left';
    // Big score
    ctx.font = F(800, 96, true);
    ctx.textAlign = 'right'; ctx.fillStyle = A.race >= B.race ? C.bgText : C.bgMuted; ctx.fillText(String(A.race), W / 2 - 26, 200);
    ctx.textAlign = 'center'; ctx.fillStyle = C.bgMuted; ctx.fillText('–', W / 2, 192);
    ctx.textAlign = 'left'; ctx.fillStyle = B.race >= A.race ? C.bgText : C.bgMuted; ctx.fillText(String(B.race), W / 2 + 26, 200);
    ctx.font = F(600, 12); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'center'; ctx.fillText(t.races.toUpperCase(), W / 2, 228); ctx.textAlign = 'left';
    // Comparison bars
    const rows = [[t.quali, A.quali, B.quali, true], [t.points, A.points, B.points, true], [t.best, A.best, B.best, false, 'P'], [t.avg, A.avg, B.avg, false, 'P'], [t.dnf, A.dnf, B.dnf, false], [t.gained, A.gained, B.gained, true]];
    let y = 270;
    for (const [lab, a, b, higher, pre] of rows) {
      const better = a == null || b == null || a === b ? 0 : (higher ? a > b : a < b) ? -1 : 1;
      ctx.font = F(600, 13); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'center'; ctx.fillText(lab.toUpperCase(), W / 2, y + 17); ctx.textAlign = 'left';
      const mx = Math.max(Math.abs(a || 0), Math.abs(b || 0), 1), bw = 300;
      // Higher is better: share of the larger value. Lower is better (best result, average, DNFs): inverted scale.
      const lo = x => (x == null ? 0 : Math.max(0.04, 1 - x / (mx * 1.25)));
      const la = higher ? Math.max(0, (a || 0)) / mx : lo(a), lb = higher ? Math.max(0, (b || 0)) / mx : lo(b);
      ctx.fillStyle = C.bgRow; ctx.fillRect(W / 2 - 110 - bw, y + 4, bw, 18); ctx.fillRect(W / 2 + 110, y + 4, bw, 18);
      ctx.fillStyle = better === -1 ? ca : C.bgLine; ctx.fillRect(W / 2 - 110 - bw * la, y + 4, bw * la, 18);
      ctx.fillStyle = better === 1 ? cb : C.bgLine; ctx.fillRect(W / 2 + 110, y + 4, bw * lb, 18);
      ctx.font = F(800, 22, true); ctx.fillStyle = better === -1 ? C.bgText : C.bgMuted; ctx.textAlign = 'right'; ctx.fillText(a == null ? '–' : (pre || '') + n1(a, lang), W / 2 - 120 - bw, y + 22);
      ctx.textAlign = 'left'; ctx.fillStyle = better === 1 ? C.bgText : C.bgMuted; ctx.fillText(b == null ? '–' : (pre || '') + n1(b, lang), W / 2 + 120 + bw, y + 22);
      y += 40;
    }
    // Race by race
    label2(ctx, t.perRace, 48, 532);
    const n = Math.max(1, v.rows.length), gw = Math.min(70, (W - 96) / n);
    v.rows.forEach((r, i) => {
      const x = 48 + i * gw;
      ctx.fillStyle = r.winner === 'A' ? ca : r.winner === 'B' ? cb : C.bgRow; ctx.fillRect(x, 546, gw - 6, 22);
      ctx.font = F(600, 11); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'center'; ctx.fillText(r.cc || String(r.round), x + (gw - 6) / 2, 588); ctx.textAlign = 'left';
    });
    footer(ctx, v.team + '  ·  ' + v.rows.filter(r => r.winner).length + ' / ' + v.races + ' ' + t.races.toLowerCase(), W, 612);
    return canvas;
  }

  // ------------------------------------------------------------ 4. development race
  function devrace(canvas, s, v, opts) {
    const lang = lg(opts), t = L[lang], ctx = frame(canvas, opts.scale || 2, v && v.color);
    kicker(ctx, t.dev, [(v.category || '') + ' ' + v.season, v.team].filter(Boolean).join('  ·  '));
    ctx.font = F(800, 46, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, (lang === 'nl' ? 'Wie bouwt het snelst?' : 'Who builds fastest?').toUpperCase(), 760), 46, 116);
    const X0 = 70, X1 = 760, Y0 = 160, Y1 = 520;
    const pts = v.series.flatMap(x => x.points);
    if (pts.length) {
      const wk = pts.map(p => p.week), val = pts.map(p => p.v);
      const w0 = Math.min(...wk), w1 = Math.max(...wk, w0 + 1), v0 = Math.min(...val), v1 = Math.max(...val, v0 + 0.5), pad = (v1 - v0) * 0.12 + 0.2;
      const xa = w => X0 + (w - w0) / (w1 - w0) * (X1 - X0), ya = x => Y1 - (x - (v0 - pad)) / ((v1 + pad) - (v0 - pad)) * (Y1 - Y0);
      ctx.fillStyle = C.bgLine; for (let i = 0; i <= 4; i++) ctx.fillRect(X0, Y0 + i * (Y1 - Y0) / 4, X1 - X0, 1);
      label2(ctx, t.index, X0, Y1 + 30);
      ctx.font = F(600, 12); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right'; ctx.fillText(t.week + ' ' + w1, X1, Y1 + 30); ctx.textAlign = 'left'; ctx.fillText(t.week + ' ' + w0, X0, Y1 + 50);
      const ends = [];
      for (const x of v.series.slice().sort((a, b) => a.mine - b.mine)) {
        if (!x.points.length) continue;
        ctx.strokeStyle = x.color || C.bgText; ctx.lineWidth = x.mine ? 6 : 3; ctx.globalAlpha = x.mine ? 1 : 0.75; ctx.lineJoin = 'round'; ctx.beginPath();
        x.points.forEach((p, i) => (i ? ctx.lineTo(xa(p.week), ya(p.v)) : ctx.moveTo(xa(p.week), ya(p.v)))); ctx.stroke(); ctx.globalAlpha = 1;
        const lp = x.points[x.points.length - 1]; ends.push({ x: xa(lp.week), y: ya(lp.v), team: x.team, color: x.color, mine: x.mine });
      }
      // Upgrade markers on our line
      const me = v.series.find(x => x.mine);
      if (me && me.points.length) for (const u of v.upgrades) {
        const p = me.points.filter(q => q.week <= (u.week || 0)).slice(-1)[0] || me.points[0];
        const ux = xa(Math.max(w0, Math.min(w1, u.week || w0))), uy = ya(p.v) - 18;
        ctx.fillStyle = u.success ? C.green : C.redText; ctx.beginPath();
        if (u.success) { ctx.moveTo(ux, uy - 8); ctx.lineTo(ux + 8, uy + 5); ctx.lineTo(ux - 8, uy + 5); } else { ctx.moveTo(ux, uy + 8); ctx.lineTo(ux + 8, uy - 5); ctx.lineTo(ux - 8, uy - 5); }
        ctx.closePath(); ctx.fill();
      }
      // End labels without overlap
      ends.sort((a, b) => a.y - b.y); let last = -99;
      for (const e of ends) { const y = Math.max(e.y + 5, last + 20); last = y; ctx.font = e.mine ? F(800, 17, true) : F(600, 14); ctx.fillStyle = e.mine ? C.bgText : C.bgMuted; ctx.fillText(fit(ctx, e.team, 150), X1 + 12, y); }
    }
    // Words
    const PX = 940, PW = W - 48 - PX;
    panel(ctx, PX, 150, PW, 440);
    label2(ctx, t.carNow, PX + 20, 182); ctx.font = F(800, 38, true); ctx.fillStyle = WCOL[v.carWord]; ctx.fillText(t.words[v.carWord], PX + 20, 224);
    ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.fillText('#' + v.carRank + ' ' + t.of + ' ' + v.of, PX + 20, 246);
    label2(ctx, t.devSeason, PX + 20, 292); ctx.font = F(800, 38, true); ctx.fillStyle = WCOL[v.gainWord]; ctx.fillText(t.words[v.gainWord], PX + 20, 334);
    ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.fillText('#' + v.gainRank + ' ' + t.of + ' ' + v.of, PX + 20, 356);
    const me = v.series.find(x => x.mine); let y = 400;
    for (const x of v.series.filter(x => !x.mine)) { ctx.fillStyle = x.color || C.bgText; ctx.fillRect(PX + 20, y - 12, 4, 16); ctx.font = F(600, 15); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, x.team, PW - 50), PX + 32, y);
      if (me && me.gain != null && x.gain != null) { ctx.font = F(500, 13); ctx.fillStyle = x.gain > me.gain ? C.redText : C.green; ctx.fillText(x.gain > me.gain ? t.more : t.less, PX + 32, y + 18); } y += 46; }
    // Budget: what is left and what development cost this season
    if (v.budget != null || v.spending != null) {
      ctx.fillStyle = C.bgLine; ctx.fillRect(PX + 20, 534, PW - 40, 1);
      ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(lang === 'nl' ? 'Budget · ontwikkeling' : 'Budget · development', PX + 20, 556);
      ctx.font = F(700, 18); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, [v.budget != null ? money(v.budget, lang) : '–', v.spending != null ? money(v.spending, lang) : '–'].join('  ·  '), PW - 40), PX + 20, 578);
    }
    footer(ctx, [v.team, v.upgrades.length ? v.upgrades.filter(u => u.success).length + '/' + v.upgrades.length + ' ' + (lang === 'nl' ? 'upgrades gelukt' : 'upgrades worked') : null].filter(Boolean).join('  ·  '));
    return canvas;
  }
  const money = (m, lang) => '€' + n1(+(+m).toFixed(Math.abs(m) >= 100 ? 0 : 1), lang) + 'M';

  // ------------------------------------------------------------ 0. race summary (from–to)
  function stretch(canvas, s, v, opts) {
    const lang = lg(opts), t = L[lang], ctx = frame(canvas, opts.scale || 2, v && v.color);
    kicker(ctx, t.inShort, [(v.category || '') + ' ' + v.season, v.team].filter(Boolean).join('  ·  '));
    if (!v || v.empty) { ctx.font = F(600, 22); ctx.fillStyle = C.bgMuted; ctx.fillText(t.noRaces, 48, 160); footer(ctx, v ? v.team : ''); return canvas; }
    ctx.font = F(800, 64, true); ctx.fillStyle = C.bgText;
    const ttl = (t.rounds + ' ' + v.from + (v.to !== v.from ? '–' + v.to : '')).toUpperCase(); ctx.fillText(ttl, 46, 130);
    const tw = ctx.measureText(ttl).width;
    ctx.font = F(600, 18); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, v.races.length + ' ' + t.racesL + '  ·  ' + v.fromName + (v.toName !== v.fromName ? ' → ' + v.toName : ''), W - 96 - tw - 20), 46 + tw + 20, 128);
    // Left: standings move and totals
    panel(ctx, 48, 162, 330, 196);
    label2(ctx, t.standing, 70, 192);
    ctx.font = F(800, 64, true); ctx.fillStyle = C.bgText;
    const mv = (v.startPos != null && v.startPos !== v.endPos ? 'P' + v.startPos + ' → ' : '') + (v.endPos != null ? 'P' + v.endPos : '–');
    ctx.fillText(fit(ctx, mv, 290), 66, 262);
    const d = v.startPos != null && v.endPos != null ? v.startPos - v.endPos : 0;
    ctx.font = F(700, 20); ctx.fillStyle = d > 0 ? C.green : d < 0 ? C.redText : C.bgMuted;
    ctx.fillText(d > 0 ? '+' + d + ' ' + t.placesUp : d < 0 ? Math.abs(d) + ' ' + t.placesDown : t.steady, 70, 296);
    ctx.font = F(500, 15); ctx.fillStyle = C.bgMuted; ctx.fillText('+' + n1(v.points, lang) + ' ' + t.pts + (v.avg != null ? '  ·  ' + t.avgShort + ' P' + n1(v.avg, lang) : ''), 70, 330);
    const tiles = [[v.wins, t.winsN, C.gold], [v.podiums, t.podN, C.green], [v.top5, 'Top 5', C.bgText], [v.dnfs, t.dnfShort, C.redText]];
    tiles.forEach(([n, l, c], i) => { const x = 48 + i * 84; panel(ctx, x, 368, 78, 78); ctx.font = F(800, 34, true); ctx.fillStyle = n ? c : C.bgMuted; ctx.textAlign = 'center'; ctx.fillText(String(n), x + 39, 410);
      ctx.font = F(600, 11); ctx.fillStyle = C.bgMuted; ctx.fillText(l.toUpperCase(), x + 39, 432); ctx.textAlign = 'left'; });
    // Middle: every race of the stretch as a chip (wraps for long NASCAR stretches)
    const MX = 410, MW = 380;
    label2(ctx, t.allRaces, MX, 192);
    const n = v.races.length, per = n <= 10 ? 2 : n <= 24 ? 4 : 6, cw = (MW - (per - 1) * 6) / per, ch = n <= 10 ? 44 : n <= 24 ? 34 : 26;
    const maxRows = Math.floor((446 - 206) / (ch + 6));
    v.races.slice(0, per * maxRows).forEach((r, i) => {
      const x = MX + (i % per) * (cw + 6), y = 206 + Math.floor(i / per) * (ch + 6);
      const k = resKind(r.pos), hl = v.highlights.includes(r);
      ctx.fillStyle = k === 'gold' ? C.gold : k === 'good' ? C.green : C.bgRow; ctx.fillRect(x, y, cw, ch);
      if (k === 'bad') { ctx.strokeStyle = C.redText; ctx.lineWidth = 1.5; ctx.strokeRect(x + .75, y + .75, cw - 1.5, ch - 1.5); }
      if (hl) { ctx.fillStyle = C.bgText; ctx.fillRect(x, y + ch - 3, cw, 3); }
      ctx.fillStyle = k === 'gold' || k === 'good' ? C.ink : k === 'bad' ? C.redText : C.bgText;
      ctx.font = F(800, ch > 30 ? 17 : 13, true); ctx.fillText(r.label, x + 8, y + ch / 2 + (ch > 30 ? 0 : 5));
      if (ch > 30) { ctx.font = F(600, 10); ctx.fillStyle = k === 'gold' || k === 'good' ? C.ink : C.bgMuted; ctx.fillText(fit(ctx, 'R' + r.round + ' ' + (r.cc || r.name), cw - 14), x + 8, y + ch - 8); }
      else { ctx.font = F(600, 10); ctx.fillStyle = k === 'gold' || k === 'good' ? C.ink : C.bgMuted; ctx.textAlign = 'right'; ctx.fillText('R' + r.round, x + cw - 6, y + ch / 2 + 4); ctx.textAlign = 'left'; }
    });
    if (n > per * maxRows) { ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText('+' + (n - per * maxRows) + ' ' + t.racesL, MX, 462); }
    // Right: the races worth telling
    const RX = 820, RW = W - 48 - RX;
    label2(ctx, t.worth, RX, 192);
    v.highlights.forEach((h, i) => {
      const y = 206 + i * 82;
      panel(ctx, RX, y, RW, 74);
      ctx.fillStyle = h.why === 'win' ? C.gold : h.why === 'dnf' || h.why === 'drop' ? C.redText : C.green; ctx.fillRect(RX, y, 4, 74);
      ctx.font = F(800, 30, true); ctx.fillStyle = h.show === 'DNF' ? C.redText : C.bgText; ctx.fillText(h.show, RX + 18, y + 44);
      const lw = Math.max(64, ctx.measureText(h.show).width + 14);
      ctx.font = F(600, 15); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, 'R' + h.round + ' · ' + h.name, RW - lw - 30), RX + 18 + lw, y + 30);
      ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, (t.why[h.why] || '').replace('{S}', h.outFront ? h.outFront.start : h.start).replace('{G}', h.gain).replace('{P}', h.pos) + (h.drivers.length ? ' · ' + h.drivers.map(x => x.split(' ').slice(-1)[0]).join('/') : ''), RW - lw - 30), RX + 18 + lw, y + 52);
    });
    if (!v.highlights.length) { ctx.font = F(500, 15); ctx.fillStyle = C.bgMuted; ctx.fillText(t.quiet, RX, 230); }
    // Bottom: championship position across the stretch
    const tr = v.trend || [];
    if (tr.length > 1) {
      const BX = 48, BY = 476, BW = W - 96, BH = 112;
      panel(ctx, BX, BY, BW, BH);
      label2(ctx, t.perRound, BX + 18, BY + 26);
      const r0 = tr[0].round, r1 = tr[tr.length - 1].round, ps = tr.map(x => x.pos).filter(x => x != null);
      const pMin = Math.min(...ps), pMax = Math.max(...ps, pMin + 1);
      const xa = r => BX + 90 + (r - r0) / Math.max(1, r1 - r0) * (BW - 160), ya = p => BY + 44 + (p - pMin) / (pMax - pMin) * (BH - 64);
      ctx.font = F(700, 13); ctx.fillStyle = C.bgMuted; ctx.fillText('P' + pMin, BX + 40, ya(pMin) + 5); ctx.fillText('P' + pMax, BX + 40, ya(pMax) + 5);
      ctx.fillStyle = C.bgLine; ctx.fillRect(BX + 90, ya(pMin), BW - 160, 1); ctx.fillRect(BX + 90, ya(pMax), BW - 160, 1);
      ctx.strokeStyle = v.color || C.bgText; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
      tr.filter(x => x.pos != null).forEach((x, i) => (i ? ctx.lineTo(xa(x.round), ya(x.pos)) : ctx.moveTo(xa(x.round), ya(x.pos)))); ctx.stroke();
      for (const h of v.highlights) { const x = tr.find(q => q.round === h.round); if (!x || x.pos == null) continue;
        ctx.fillStyle = h.why === 'win' ? C.gold : h.why === 'dnf' || h.why === 'drop' ? C.redText : C.green; ctx.beginPath(); ctx.arc(xa(x.round), ya(x.pos), 6, 0, Math.PI * 2); ctx.fill(); }
      const l = tr[tr.length - 1]; ctx.font = F(800, 20, true); ctx.fillStyle = C.bgText; ctx.fillText('P' + l.pos, xa(l.round) + 12, ya(l.pos) + 7);
      ctx.font = F(600, 11); ctx.fillStyle = C.bgMuted; ctx.fillText('R' + r0, xa(r0) - 6, BY + BH - 8); ctx.textAlign = 'right'; ctx.fillText('R' + r1, xa(r1) + 6, BY + BH - 8); ctx.textAlign = 'left';
    }
    footer(ctx, [v.team, t.rounds + ' ' + v.from + '–' + v.to].join('  ·  '), W, 610);
    return canvas;
  }

  // ------------------------------------------------------------ 5. season wrapped (portrait slides)
  const PWW = 540, PHH = 675;
  function wrapped(canvas, s, v, opts) {
    const lang = lg(opts), t = L[lang], slide = X.SLIDES.includes(opts.slide) ? opts.slide : 'intro';
    const ctx = frame(canvas, opts.scale || 2, null, PWW, PHH);
    const col = v.color || C.red;
    // Big diagonal slab in the team colour
    ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(0, 470); ctx.lineTo(PWW, 330); ctx.lineTo(PWW, PHH); ctx.lineTo(0, PHH); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = C.bg; ctx.globalAlpha = 0.12; ctx.fillRect(0, 300, PWW, PHH); ctx.globalAlpha = 1;
    // Slide dots
    X.SLIDES.forEach((x, i) => { ctx.fillStyle = x === slide ? C.bgText : C.bgLine; ctx.fillRect(32 + i * ((PWW - 64) / X.SLIDES.length), 30, (PWW - 64) / X.SLIDES.length - 6, 4); });
    ctx.font = F(600, 12); ctx.fillStyle = C.bgMuted; ctx.fillText((v.team + ' · ' + t.season + ' ' + v.season).toUpperCase(), 32, 60);
    const big = (txt, y, size, color) => { ctx.font = F(800, size, true); ctx.fillStyle = color || C.bgText; ctx.fillText(fit(ctx, txt, PWW - 64), 30, y); };
    const small = (txt, y, size, color) => { ctx.font = F(600, size || 18); ctx.fillStyle = color || C.bgText; wrap(ctx, txt, PWW - 64, 3).forEach((l, i) => ctx.fillText(l, 32, y + i * (size || 18) * 1.3)); };
    const tag = (txt, y) => { ctx.font = F(800, 22, true); ctx.fillStyle = y > 300 ? Card.helpers.readable(col) : C.red; ctx.fillText(txt.toUpperCase(), 32, y); };
    if (slide === 'intro') {
      tag(t.season + ' ' + v.season, 130); big(t.wrapped.toUpperCase(), 210, 92); big(v.team.toUpperCase(), 262, 34, C.bgMuted);
      big(v.pos != null ? 'P' + v.pos : '–', 520, 190, v.pos === 1 ? C.gold : C.bgText); small((v.finished ? t.final : t.now) + ' · ' + n1(v.points, lang) + ' ' + t.pts, 580, 20);
    } else if (slide === 'numbers') {
      tag(t.numbers, 120);
      const rows = [[v.races, t.racesN], [v.wins, t.winsN], [v.podiums, t.podN], [v.pointsRaces, t.ptsN]];
      rows.forEach(([n, l], i) => { big(String(n), 230 + i * 112, 100, i === 1 && n ? C.gold : i === 2 && n ? C.green : C.bgText); ctx.font = F(700, 24); ctx.fillStyle = C.bgText; ctx.fillText(l.toUpperCase(), 32 + ctx.measureText('').width + 150, 220 + i * 112); });
    } else if (slide === 'moment') {
      tag(t.moment, 120);
      if (v.best) { big('P' + v.best.pos, 320, 190, v.best.pos === 1 ? C.gold : v.best.pos <= 3 ? C.green : C.bgText); big(v.best.name.toUpperCase(), 380, 40); small((v.best.start ? t.from + ' P' + v.best.start + ' · ' : '') + (v.best.drivers || []).join(' / '), 412, 18, C.bgMuted); }
      if (v.climb && v.climb.gain >= 3) { tag(t.climb, 500); big('+' + v.climb.gain + ' ' + t.places, 560, 50); small(v.climb.name + ' · P' + v.climb.start + ' → P' + v.climb.pos, 592, 18); }
    } else if (slide === 'driver') {
      tag(t.driver, 120);
      if (v.driver) { face(ctx, imgOf(opts, v.driver.face), v.driver.name, col, PWW / 2, 270, 110); ctx.textAlign = 'center'; ctx.font = F(800, 46, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, v.driver.name.toUpperCase(), PWW - 60), PWW / 2, 450);
        ctx.font = F(800, 72, true); ctx.fillText(n1(v.driver.points, lang), PWW / 2, 560); ctx.font = F(700, 20); ctx.fillText(t.pts.toUpperCase() + (v.driver.pos ? ' · P' + v.driver.pos : '') + (v.driver.wins ? ' · ' + v.driver.wins + ' ' + (v.driver.wins === 1 ? t.winN : t.winsN) : ''), PWW / 2, 592); ctx.textAlign = 'left'; }
    } else if (slide === 'factory') {
      tag(t.factory, 120);
      if (v.dev) { const wi = X.rankWord(v.dev.gainRank, v.dev.of); big(t.words[wi].toUpperCase(), 230, 76, WCOL[wi]); small('#' + v.dev.gainRank + ' ' + (lang === 'nl' ? 'van' : 'of') + ' ' + v.dev.of + ' ' + t.inField, 266, 20, C.bgMuted);
        big(v.dev.worked + ' / ' + v.dev.upgrades, 520, 120); small(t.upgrades, 560, 22); }
    } else if (slide === 'story') {
      tag(t.story, 120);
      big(String(v.story.chapters), 270, 160); big(t.chapters.toUpperCase(), 320, 40);
      if (v.story.firstTitle) { small(t.startedWith + ':', 390, 16, C.bgMuted); small('“' + v.story.firstTitle + '”', 414, 22); }
      if (v.story.lastTitle && v.story.chapters > 1) { small(t.endsWith + ':', 500, 16, C.bgText); small('“' + v.story.lastTitle + '”', 524, 22); }
      if (v.story.series) small(v.story.series, 610, 16, C.bgText);
    }
    ctx.font = F(900, 16, true); ctx.textAlign = 'right'; ctx.fillStyle = C.bgText; ctx.fillText('DM SAVE CARD', PWW - 30, PHH - 24); ctx.textAlign = 'left';
    return canvas;
  }

  root.DMExtraCards = { stretch, preview, transfer, duel, devrace, wrapped };
})(typeof self !== 'undefined' ? self : this);
