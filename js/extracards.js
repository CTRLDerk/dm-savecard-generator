/* DM Save Card — cards for the extra post types (redesign style):
   raceweek preview, here we go, teammate duel, development race (1200 × 675) and
   season wrapped (portrait slides, 540 × 675 logical → 1080 × 1350 PNG). */
(function (root) {
  'use strict';
  const Card = root.DMCard, X = root.DMExtra, T = root.DMText;
  const { C, F, fit, wrap, label } = Card.helpers;
  const W = Card.W, H = Card.H;
  const WCOL = [C.redText, C.orange, C.bgText, C.green, C.gold];
  const L = {
    en: { raceweek: 'Raceweek', round: 'Round', week: 'week', laps: 'laps', sprint: 'sprint weekend', standing: 'Championship', form: 'Form', here: 'Last time here', first: 'First visit in this playthrough',
      car: 'Our car', strong: 'Strongest', weak: 'Weakest', ask: 'Where do we finish?', opts: ['Podium', 'Points', 'No points'], ahead: 'to', behind: 'over', target: 'Board target', pts: 'pts',
      hwg: 'Here we go!', stays: 'Here we go!', bye: 'Goodbye', expiring: 'Contract watch', contract: 'Contract', done: 'Done deal', role: 'Role', until: 'Contract until', age: 'Age', level: 'Level', potential: 'Potential', career: 'Career', wins: 'wins', titles: 'titles', roles: { driver: 'Race driver', reserve: 'Reserve' },
      duel: 'Teammate duel', races: 'Races', quali: 'Qualifying', points: 'Points', best: 'Best result', avg: 'Average finish', dnf: 'DNFs', gained: 'Places gained', perRace: 'Race by race', same: 'Our drivers share one car: no duel.', single: 'Only {D} raced for us this season: no duel yet.',
      dev: 'Development race', index: 'Car index (all areas)', carNow: 'Car now', devSeason: 'Development this season', of: 'of', upOk: 'upgrade', upBad: 'failed upgrade', more: 'gained more', less: 'gained less',
      words: X.WORDS.en, wrapped: 'Wrapped', season: 'Season', final: 'Final standings', now: 'So far', numbers: 'The numbers', racesN: 'races', winN: 'win', winsN: 'wins', podN: 'podiums', ptsN: 'in the points',
      inShort: 'In short', perRound: 'Championship per round', rounds: 'Rounds', racesL: 'races', placesUp: 'places up', placesDown: 'places down', steady: 'same place', avgShort: 'avg', dnfShort: 'DNF', allRaces: 'Every race', worth: 'Worth telling', quiet: 'No race stood out.', noRaces: 'No races run yet this season.',
      why: { win: 'win', podium: 'podium', dnf: 'out from P{S}', climb: 'from P{S}, +{G}', drop: 'from P{S} to P{P}', top5: 'top 5', pole: 'pole' },
      moment: 'Best moment', from: 'from', climb: 'Biggest climb', places: 'places', driver: 'Driver of the year', factory: 'The factory', upgrades: 'upgrades worked', inField: 'in the field', story: 'The story', chapters: 'chapters', startedWith: 'It started with', endsWith: 'Latest' },
    nl: { raceweek: 'Raceweek', round: 'Ronde', week: 'week', laps: 'ronden', sprint: 'sprintweekend', standing: 'Kampioenschap', form: 'Vorm', here: 'Vorige keer hier', first: 'Eerste bezoek in deze playthrough',
      car: 'Onze auto', strong: 'Sterkste', weak: 'Zwakste', ask: 'Waar eindigen we?', opts: ['Podium', 'Punten', 'Geen punten'], ahead: 'naar', behind: 'op', target: 'Doel bestuur', pts: 'ptn',
      hwg: 'Here we go!', stays: 'Here we go!', bye: 'Vaarwel', expiring: 'Contract loopt af', contract: 'Contract', done: 'Deal rond', role: 'Rol', until: 'Contract tot', age: 'Leeftijd', level: 'Niveau', potential: 'Potentieel', career: 'Carrière', wins: 'zeges', titles: 'titels', roles: { driver: 'Racecoureur', reserve: 'Reserve' },
      duel: 'Teamgenotenduel', races: 'Races', quali: 'Kwalificatie', points: 'Punten', best: 'Beste resultaat', avg: 'Gemiddelde finish', dnf: 'Uitvallers', gained: 'Plekken gewonnen', perRace: 'Per race', same: 'Onze coureurs delen één auto: geen duel.', single: 'Alleen {D} reed dit seizoen voor ons: nog geen duel.',
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
    // Circuit name: as large as fits next to the track drawing, on two lines when it is long.
    const hasTrack = !!v.track, tw = hasTrack ? 700 : 1100, nm = v.next.name.toUpperCase();
    let fs = 92; ctx.font = F(800, fs, true);
    while (fs > 56 && ctx.measureText(nm).width > tw) { fs -= 4; ctx.font = F(800, fs, true); }
    ctx.fillStyle = C.bgText;
    if (ctx.measureText(nm).width <= tw) ctx.fillText(nm, 44, 156);
    else { fs = 54; ctx.font = F(800, fs, true); const ls = wrap(ctx, nm, tw, 2); ls.forEach((ln, i) => ctx.fillText(ln, 44, 112 + i * 52)); }
    ctx.font = F(600, 18); ctx.fillStyle = C.bgMuted;
    const lines = lang === 'nl' ? v.linesNl : v.lines, km = v.next.length;
    ctx.fillText(fit(ctx, [v.next.cc, t.week + ' ' + v.next.week, km ? n1(+km.toFixed(2), lang) + ' km' : null, v.next.laps ? v.next.laps + ' ' + t.laps : null, T.trackType(v.type, lang) || null, v.next.sprint ? t.sprint : null].filter(Boolean).join('  ·  '), tw + 20), 48, 190);
    if (hasTrack) Card.helpers.drawTrack(ctx, v.track, 800, 58, W - 48 - 800, 150, { width: 5 });
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
    const oneCcF = new Set(v.form.map(f => f.cc)).size <= 1 && v.form.length > 1;
    for (const f of v.form) { const w = chip(ctx, f.label, fx, 266, resKind(f.pos)); ctx.font = F(600, 11); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'center'; ctx.fillText(oneCcF && f.round ? 'R' + f.round : f.cc || '', fx + w / 2, 314); ctx.textAlign = 'left'; fx += w + 8; }
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
    // What is at stake this weekend, in one line
    const stake = lines && (lines.need || lines.target || lines.rival);
    if (stake) { ctx.font = F(600, 17); ctx.fillStyle = C.gold; ctx.fillText(fit(ctx, stake, W - 96), 48, 438); }
    // Poll
    label2(ctx, t.ask, 48, 466);
    ((lines && lines.poll) || t.opts).forEach((o, i) => { const bx = 48 + i * 372, cols = [C.gold, C.green, C.redText]; panel(ctx, bx, 478, 356, 84); ctx.fillStyle = cols[i]; ctx.fillRect(bx, 478, 6, 84);
      ctx.font = F(800, 36, true); ctx.fillStyle = C.bgText; ctx.fillText(String.fromCharCode(65 + i), bx + 26, 534); ctx.font = F(700, 26); ctx.fillText(o.toUpperCase(), bx + 70, 532); });
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
    if (v.traits.length) { let tx = x; const ty = y + 3 * 64 + 4; for (const tr0 of v.traits.slice(0, 4)) { const tr = T.trait(tr0, lang); ctx.font = F(600, 14); const w = ctx.measureText(tr).width + 20; if (tx + w > W - 48) break; ctx.strokeStyle = C.bgLine; ctx.lineWidth = 1.5; ctx.strokeRect(tx, ty, w, 28); ctx.fillStyle = C.bgText; ctx.fillText(tr, tx + 10, ty + 19); tx += w + 8; } }
    // The case for and against (contract decisions only)
    const pro = (v.pro && v.pro[lang]) || [], con = (v.con && v.con[lang]) || [];
    if (pro.length || con.length) {
      const cy = y + 3 * 64 + (v.traits.length ? 56 : 12), colw = (W - 48 - x - 24) / 2;
      [[lang === 'nl' ? 'Voor verlengen' : 'The case for', pro, C.green], [lang === 'nl' ? 'Tegen' : 'The case against', con, C.redText]].forEach(([h, list, col], i) => {
        const bx = x + i * (colw + 24); ctx.fillStyle = col; ctx.fillRect(bx, cy, colw, 2); label2(ctx, h, bx, cy + 22);
        ctx.font = F(500, 15); ctx.fillStyle = C.bgText;
        if (!list.length) { ctx.fillStyle = C.bgMuted; ctx.fillText('–', bx, cy + 46); }
        list.slice(0, 3).forEach((ln, k) => ctx.fillText(fit(ctx, ln, colw), bx, cy + 46 + k * 22));
      });
    }
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
    if (!v || v.empty || v.sameCar) { ctx.font = F(600, 22); ctx.fillStyle = C.bgMuted; ctx.fillText(v && v.sameCar ? t.same : v && v.single ? t.single.replace('{D}', v.single) : '–', 48, 160); footer(ctx, v ? v.team : ''); return canvas; }
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
    const oneCc = new Set(v.rows.map(r => r.cc)).size <= 1;   // all races in one country (NASCAR): round numbers
    v.rows.forEach((r, i) => {
      const x = 48 + i * gw;
      ctx.fillStyle = r.winner === 'A' ? ca : r.winner === 'B' ? cb : C.bgRow; ctx.fillRect(x, 546, gw - 6, 22);
      ctx.font = F(600, 11); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'center'; ctx.fillText(oneCc ? String(r.round) : r.cc || String(r.round), x + (gw - 6) / 2, 588); ctx.textAlign = 'left';
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

  // ------------------------------------------------------------ multiplayer: the player teams side by side (journalist's view)
  const ML = {
    en: { round: 'Paddock report', table: 'Players’ championship', h2h: 'Who beats whom', rnd: 'Round', best: 'Best of the players', climb: 'Biggest climb', out: 'Out of the race', close: 'Closest fight',
      champ: 'Champ.', from: 'from', pts: 'pts', overall: 'Overall', form: 'Last races', gap: 'Gap', none: 'Add two or more player teams on the Multiplayer tab.', noRaces: 'No race run yet.',
      teams: 'player teams', places: 'places', after: 'after round', of: 'of', lead: 'Leader', hot: 'In form', avg: 'avg', dom: 'Top dog', one: 'One-sided', even: 'Dead heat', raceDays: 'race days, best car v best car', wins: 'W', pods: 'PD', moved: 'In the standings' },
    nl: { round: 'Paddockverslag', table: 'Spelerskampioenschap', h2h: 'Wie verslaat wie', rnd: 'Ronde', best: 'Beste speler', climb: 'Grootste inhaalrace', out: 'Uitgevallen', close: 'Spannendste gevecht',
      champ: 'Kamp.', from: 'vanaf', pts: 'ptn', overall: 'Totaal', form: 'Laatste races', gap: 'Gat', none: 'Voeg twee of meer spelersteams toe op het tabblad Multiplayer.', noRaces: 'Nog geen race gereden.',
      teams: 'spelersteams', places: 'plekken', after: 'na ronde', of: 'van', lead: 'Leider', hot: 'In vorm', avg: 'gem.', dom: 'De baas', one: 'Eenzijdig', even: 'Gelijk op', raceDays: 'racedagen, beste auto tegen beste auto', wins: 'Z', pods: 'PD', moved: 'In de stand' }
  };
  const pname = r => (r.player ? String(r.player).replace(/^@/, '') : r.short);
  function mpEmpty(ctx, t, v, kick) { kicker(ctx, kick, [v.category, v.season].filter(Boolean).join(' ')); ctx.font = F(800, 30, true); ctx.fillStyle = C.bgMuted; ctx.fillText(v && v.noRaces ? t.noRaces : t.none, 48, 200); footer(ctx, ''); }
  function nameCell(ctx, r, x, y, w) {
    ctx.fillStyle = r.color || C.bgText; ctx.fillRect(x, y - 22, 6, 30);
    ctx.font = F(800, 21, true); ctx.fillStyle = C.bgText; const n = fit(ctx, pname(r).toUpperCase(), w - 20); ctx.fillText(n, x + 18, y);
    if (r.player) { const nw = ctx.measureText(n).width; ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, r.short, Math.max(0, w - nw - 34)), x + 30 + nw, y - 1); }
  }
  function award(ctx, head, line, sub, x, y, w, col) {
    ctx.fillStyle = col || C.bgLine; ctx.fillRect(x, y, 4, 54); label2(ctx, head, x + 16, y + 14);
    ctx.font = F(800, 20, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, line, w - 20), x + 16, y + 38);
    if (sub) { ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, sub, w - 20), x + 16, y + 58); }
    return y + (sub ? 82 : 66);
  }
  function mpround(canvas, s, v, opts) {
    const lang = lg(opts), t = ML[lang], ctx = frame(canvas, opts.scale || 2, null);
    if (!v || v.empty) return mpEmpty(ctx, t, v || {}, t.round);
    kicker(ctx, t.round, [[v.category, v.season].filter(Boolean).join(' '), t.rnd + ' ' + v.round + ' / ' + v.total].join('  ·  '), C.gold);
    const tw = v.track ? 760 : 1100; let fs = 64; ctx.font = F(800, fs, true); const nm = String(v.name || '').toUpperCase();
    while (fs > 38 && ctx.measureText(nm).width > tw) { fs -= 4; ctx.font = F(800, fs, true); }
    ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, nm, tw), 44, 132);
    ctx.font = F(600, 17); ctx.fillStyle = C.bgMuted; ctx.fillText(v.rows.length + ' ' + t.teams + (v.field ? '  ·  ' + v.field + (lang === 'nl' ? ' auto’s' : ' cars') : ''), 48, 162);
    if (v.track) Card.helpers.drawTrack(ctx, v.track, 840, 40, W - 48 - 840, 130, { width: 4 });
    // the player teams, best result first
    const rows = v.rows.slice(0, 8), rh = Math.min(80, Math.floor(370 / Math.max(rows.length, 1))), x0 = 48, cw = 700;
    label2(ctx, lang === 'nl' ? 'Uitslag spelersteams' : 'Player teams at the flag', x0, 206);
    ctx.font = F(600, 12); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right'; ctx.fillText(t.champ.toUpperCase(), x0 + cw, 206); ctx.textAlign = 'left';
    rows.forEach((r, k) => {
      const y = 246 + k * rh;
      ctx.font = F(800, 18, true); ctx.fillStyle = C.bgMuted; ctx.fillText(String(k + 1), x0, y);
      nameCell(ctx, r, x0 + 26, y, 360);
      const cx = x0 + 420; chip(ctx, r.pos != null ? 'P' + r.pos : 'DNF', cx, y - 21, resKind(r.pos));
      if (r.pos != null && r.start != null) { ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.fillText(t.from + ' P' + r.start + (r.gain ? (r.gain > 0 ? '  +' : '  ') + r.gain : ''), cx + 66, y - 1); }
      ctx.textAlign = 'right'; ctx.font = F(800, 18, true); ctx.fillStyle = C.bgText; ctx.fillText(r.champ ? 'P' + r.champ : '–', x0 + cw - 34, y);
      if (r.move) { ctx.fillStyle = r.move > 0 ? C.green : C.redText; ctx.font = F(800, 14, true); ctx.fillText((r.move > 0 ? '▲' : '▼') + Math.abs(r.move), x0 + cw, y - 1); }
      ctx.textAlign = 'left';
      if (k < rows.length - 1) { ctx.fillStyle = C.bgLine; ctx.fillRect(x0, y + rh / 2 - 6, cw, 1); }
    });
    // the stories of the round
    const ax = 800, aw = W - 48 - ax; panel(ctx, ax, 190, aw, 400); let ay = 214;
    if (v.top) ay = award(ctx, t.best, pname(v.top) + ' · ' + (v.top.pos != null ? 'P' + v.top.pos : 'DNF'), v.top.player ? v.top.short : null, ax + 18, ay, aw - 30, C.gold);
    if (v.mover) ay = award(ctx, t.climb, pname(v.mover) + ' · +' + v.mover.gain + ' ' + t.places, 'P' + v.mover.start + ' → P' + v.mover.pos, ax + 18, ay, aw - 30, C.green);
    else if (v.climber) ay = award(ctx, t.moved, pname(v.climber) + ' · P' + v.climber.prev + ' → P' + v.climber.champ, null, ax + 18, ay, aw - 30, C.green);
    if (v.out.length && ay < 470) ay = award(ctx, t.out, v.out.map(pname).join(', '), null, ax + 18, ay, aw - 30, C.redText);
    if (v.close && ay < 500) award(ctx, t.close, pname({ player: v.close.ap, short: v.close.a }) + ' v ' + pname({ player: v.close.bp, short: v.close.b }), n1(v.close.gap, lang) + ' ' + t.pts + '  ·  P' + v.close.posA + ' / P' + v.close.posB, ax + 18, ay, aw - 30, C.orange);
    footer(ctx, v.next ? (lang === 'nl' ? 'Volgende: ' : 'Next: ') + v.next.name : '');
  }
  function mptable(canvas, s, v, opts) {
    const lang = lg(opts), t = ML[lang], ctx = frame(canvas, opts.scale || 2, null);
    if (!v || v.empty) return mpEmpty(ctx, t, v || {}, t.table);
    kicker(ctx, t.table, [[v.category, v.season].filter(Boolean).join(' '), t.after + ' ' + v.raced + ' ' + t.of + ' ' + v.total].join('  ·  '), C.gold);
    const a = v.rows[0];
    ctx.font = F(800, 52, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, (pname(a) + (lang === 'nl' ? ' aan kop' : ' on top')).toUpperCase(), 1100), 44, 126);
    ctx.font = F(600, 17); ctx.fillStyle = C.bgMuted;
    ctx.fillText([v.margin != null ? (v.margin === 0 ? (lang === 'nl' ? 'gelijk met ' : 'level with ') : n1(v.margin, lang) + ' ' + t.pts + (lang === 'nl' ? ' voor op ' : ' ahead of ')) + pname(v.rows[1]) : null,
      v.hot && v.hot !== a ? t.hot + ': ' + pname(v.hot) + ' (' + t.avg + ' P' + n1(v.hotAvg, lang) + ')' : null].filter(Boolean).join('  ·  '), 48, 158);
    const rows = v.rows.slice(0, 8), top = 214, rh = Math.min(80, Math.floor(370 / Math.max(rows.length, 1)));
    const cx = { rank: 48, name: 92, overall: 520, pts: 640, gap: 740, form: 820, wp: W - 48 };
    ctx.font = F(600, 12); ctx.fillStyle = C.bgMuted;
    [[t.overall, cx.overall], [t.pts, cx.pts], [t.gap, cx.gap], [t.form, cx.form]].forEach(([h, x]) => ctx.fillText(h.toUpperCase(), x, top - 12));
    ctx.textAlign = 'right'; ctx.fillText(t.wins + ' / ' + t.pods, cx.wp, top - 12); ctx.textAlign = 'left';
    rows.forEach((r, k) => {
      const y = top + 28 + k * rh;
      if (k === 0) { ctx.fillStyle = C.bgRow; ctx.fillRect(40, y - 30, W - 80, rh - 4); }
      ctx.font = F(900, 26, true); ctx.fillStyle = k === 0 ? C.gold : C.bgText; ctx.fillText(String(r.rank), cx.rank, y);
      nameCell(ctx, r, cx.name, y, cx.overall - cx.name - 20);
      ctx.font = F(800, 20, true); ctx.fillStyle = C.bgText; ctx.fillText(r.pos ? 'P' + r.pos : '–', cx.overall, y);
      ctx.font = F(700, 18); ctx.fillText(n1(r.points, lang), cx.pts, y);
      ctx.font = F(500, 15); ctx.fillStyle = C.bgMuted; ctx.fillText(r.gap ? '−' + n1(r.gap, lang) : '', cx.gap, y);
      let fx = cx.form; ctx.save(); ctx.translate(0, 0);
      for (const p of r.form.slice(-6)) { const txt = p == null ? 'DNF' : 'P' + p; ctx.font = F(800, 12, true); const w = Math.max(34, ctx.measureText(txt).width + 10), kd = resKind(p);
        if (kd === 'gold' || kd === 'good') { ctx.fillStyle = kd === 'gold' ? C.gold : C.green; ctx.fillRect(fx, y - 17, w, 22); ctx.fillStyle = C.ink; }
        else { ctx.strokeStyle = kd === 'bad' ? C.redText : C.bgLine; ctx.lineWidth = 1; ctx.strokeRect(fx + .5, y - 16.5, w - 1, 21); ctx.fillStyle = kd === 'bad' ? C.redText : C.bgText; }
        ctx.textAlign = 'center'; ctx.fillText(txt, fx + w / 2, y - 1); ctx.textAlign = 'left'; fx += w + 4; }
      ctx.restore();
      ctx.textAlign = 'right'; ctx.font = F(700, 15); ctx.fillStyle = C.bgText; ctx.fillText(r.wins + ' / ' + r.podiums, cx.wp, y); ctx.textAlign = 'left';
    });
    footer(ctx, rows.length + ' ' + t.teams);
  }
  function mph2h(canvas, s, v, opts) {
    const lang = lg(opts), t = ML[lang], ctx = frame(canvas, opts.scale || 2, null);
    if (!v || v.empty) return mpEmpty(ctx, t, v || {}, t.h2h);
    kicker(ctx, t.h2h, [[v.category, v.season].filter(Boolean).join(' '), v.raced + ' ' + (lang === 'nl' ? 'races' : 'races')].join('  ·  '), C.gold);
    const P = v.players, n = P.length, x0 = 48, nameW = 230, y0 = 150, gw = 700 - nameW, cs = Math.min(100, Math.floor(gw / n), Math.floor(400 / n));
    label2(ctx, t.raceDays, x0, 104);
    // column heads: short names, rotated
    P.forEach((p, j) => { const cx = x0 + nameW + j * cs + cs / 2; ctx.save(); ctx.translate(cx, y0 - 8); ctx.rotate(-Math.PI / 5); ctx.font = F(700, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, pname(p), 120), 0, 0); ctx.restore(); ctx.fillStyle = p.color || C.bgText; ctx.fillRect(x0 + nameW + j * cs + 4, y0, cs - 8, 4); });
    P.forEach((a, i) => {
      const y = y0 + 12 + i * cs;
      ctx.fillStyle = a.color || C.bgText; ctx.fillRect(x0, y + 6, 6, cs - 12);
      ctx.font = F(800, 18, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, pname(a).toUpperCase(), nameW - 30), x0 + 16, y + cs / 2 + 6);
      P.forEach((b, j) => {
        const cx = x0 + nameW + j * cs;
        if (a === b) { ctx.fillStyle = C.bgLine; ctx.fillRect(cx + 3, y + 3, cs - 6, cs - 6); return; }
        const w1 = (v.m[a.id] || {})[b.id] || 0, w2 = (v.m[b.id] || {})[a.id] || 0;
        ctx.fillStyle = w1 > w2 ? 'rgba(52,199,110,0.85)' : w1 < w2 ? 'rgba(232,62,46,0.75)' : C.pit; ctx.fillRect(cx + 3, y + 3, cs - 6, cs - 6);
        ctx.font = F(800, Math.min(20, cs / 3), true); ctx.fillStyle = w1 === w2 ? C.bgText : C.ink; ctx.textAlign = 'center'; ctx.fillText(w1 + '–' + w2, cx + cs / 2, y + cs / 2 + 7); ctx.textAlign = 'left';
      });
    });
    const ax = 800, aw = W - 48 - ax; panel(ctx, ax, 150, aw, 430); let ay = 174;
    const nm = p => pname(p);
    if (v.dominant) ay = award(ctx, t.dom, nm(v.dominant.p), (lang === 'nl' ? 'baas over ' : 'on top of ') + v.dominant.n + ' ' + t.of + ' ' + v.dominant.of, ax + 18, ay, aw - 30, C.gold);
    if (v.oneSided) { const A = v.oneSided.x >= v.oneSided.y ? v.oneSided.a : v.oneSided.b, B = A === v.oneSided.a ? v.oneSided.b : v.oneSided.a;
      ay = award(ctx, t.one, nm(A) + ' v ' + nm(B), Math.max(v.oneSided.x, v.oneSided.y) + '–' + Math.min(v.oneSided.x, v.oneSided.y), ax + 18, ay, aw - 30, C.green); }
    if (v.even && v.even !== v.oneSided) award(ctx, t.even, nm(v.even.a) + ' v ' + nm(v.even.b), v.even.x + '–' + v.even.y, ax + 18, ay, aw - 30, C.orange);
    ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, lang === 'nl' ? 'Lees per rij: groen = deze speler finisht vaker voor de ander.' : 'Read by row: green = this player finishes ahead more often.', 700), x0, 590);
    footer(ctx, n + ' ' + t.teams);
  }

  const AREA = { en: { speed: 'Speed', grip: 'Grip', aero: 'Aero', racePace: 'Race pace', tyreManagement: 'Tyres', dirtyAir: 'Dirty air', overtaking: 'Overtaking', reliability: 'Reliability' },
    nl: { speed: 'Snelheid', grip: 'Grip', aero: 'Aero', racePace: 'Racetempo', tyreManagement: 'Banden', dirtyAir: 'Vuile lucht', overtaking: 'Inhalen', reliability: 'Betrouwbaar' } };
  function mpdev(canvas, s, v, opts) {
    const lang = lg(opts), t = ML[lang], ctx = frame(canvas, opts.scale || 2, null), nl = lang === 'nl';
    const head = nl ? 'Wapenwedloop' : 'Arms race';
    if (!v || v.empty) return mpEmpty(ctx, t, v || {}, head);
    kicker(ctx, head, [[v.category, v.season].filter(Boolean).join(' '), t.teams].join('  ·  '), C.gold);
    ctx.font = F(800, 46, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, (nl ? 'Wie bouwt de snelste auto?' : 'Who builds the fastest car?').toUpperCase(), 1100), 46, 116);
    // car index over the season, one line per player team
    const X0 = 70, X1 = 620, Y0 = 170, Y1 = 520, pts = v.rows.flatMap(r => r.points);
    if (pts.length > 1) {
      const wk = pts.map(p => p.week), val = pts.map(p => p.v), w0 = Math.min(...wk), w1 = Math.max(...wk, w0 + 1), v0 = Math.min(...val), v1 = Math.max(...val, v0 + 0.5), pad = (v1 - v0) * 0.12 + 0.2;
      const xa = w => X0 + (w - w0) / (w1 - w0) * (X1 - X0), ya = x => Y1 - (x - (v0 - pad)) / ((v1 + pad) - (v0 - pad)) * (Y1 - Y0);
      ctx.fillStyle = C.bgLine; for (let i = 0; i <= 4; i++) ctx.fillRect(X0, Y0 + i * (Y1 - Y0) / 4, X1 - X0, 1);
      label2(ctx, nl ? 'Auto-index' : 'Car index', X0, Y1 + 30);
      ctx.font = F(600, 12); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right'; ctx.fillText((nl ? 'week ' : 'week ') + w1, X1, Y1 + 30); ctx.textAlign = 'left';
      for (const r of v.rows) { if (r.points.length < 1) continue; ctx.strokeStyle = r.color || C.bgText; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
        r.points.forEach((p, i) => (i ? ctx.lineTo(xa(p.week), ya(p.v)) : ctx.moveTo(xa(p.week), ya(p.v)))); ctx.stroke();
        const lp = r.points[r.points.length - 1]; ctx.fillStyle = r.color || C.bgText; ctx.beginPath(); ctx.arc(xa(lp.week), ya(lp.v), 6, 0, Math.PI * 2); ctx.fill(); }
    }
    // the teams: car rank, gain, upgrades, strongest and weakest area
    const ax = 660, aw = W - 48 - ax, rows = v.rows.slice(0, 6), rh = Math.min(84, Math.floor(400 / rows.length));
    rows.forEach((r, k) => {
      const y = 186 + k * rh;
      nameCell(ctx, r, ax, y, aw - 110);
      ctx.textAlign = 'right'; ctx.font = F(800, 22, true); ctx.fillStyle = k === 0 ? C.gold : C.bgText; ctx.fillText('#' + (r.carRank || '–'), ax + aw, y);
      ctx.font = F(500, 12); ctx.fillStyle = C.bgMuted; ctx.fillText((nl ? 'auto van ' : 'car of ') + v.of, ax + aw, y + 16); ctx.textAlign = 'left';
      ctx.font = F(600, 14); ctx.fillStyle = r.gain > 0 ? C.green : r.gain < 0 ? C.redText : C.bgMuted;
      const g = (r.gain > 0 ? '+' : '') + n1(r.gain, lang); ctx.fillText(g, ax + 18, y + 22); const gw = ctx.measureText(g).width;
      ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, [(r.ok + r.bad ? r.ok + '✓ ' + r.bad + '✗' : ''), r.strong ? '▲ ' + AREA[lang][r.strong.key] : '', r.weak ? '▼ ' + AREA[lang][r.weak.key] : ''].filter(Boolean).join('  ·  '), aw - gw - 150), ax + 30 + gw, y + 22);
      if (k < rows.length - 1) { ctx.fillStyle = C.bgLine; ctx.fillRect(ax, y + rh - 30, aw, 1); }
    });
    footer(ctx, (nl ? 'Week ' : 'Week ') + v.week + '  ·  ' + v.rows.length + ' ' + t.teams);
  }
  function mpgrid(canvas, s, v, opts) {
    const lang = lg(opts), t = ML[lang], ctx = frame(canvas, opts.scale || 2, null), nl = lang === 'nl';
    const head = nl ? 'Coureurs & strategie' : 'Drivers & strategy';
    if (!v || v.empty) return mpEmpty(ctx, t, v || {}, head);
    kicker(ctx, head, [[v.category, v.season].filter(Boolean).join(' '), v.race ? t.rnd + ' ' + v.round + ' · ' + v.race : ''].filter(Boolean).join('  ·  '), C.gold);
    ctx.font = F(800, 46, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, (nl ? 'Wie haalt het meest uit zijn coureurs?' : 'Who gets the most from the drivers?').toUpperCase(), 1100), 46, 116);
    const x0 = 48, cw = 700, rows = v.rows.slice(0, 6), rh = Math.min(90, Math.floor(400 / rows.length));
    ctx.font = F(600, 12); ctx.fillStyle = C.bgMuted; ctx.fillText((nl ? 'COUREURS (KLASSEMENT)' : 'DRIVERS (STANDINGS)'), x0 + 250, 158); ctx.textAlign = 'right'; ctx.fillText(nl ? 'LAATSTE RACE · STOPS' : 'LAST RACE · STOPS', x0 + cw, 158); ctx.textAlign = 'left';
    rows.forEach((r, k) => {
      const y = 200 + k * rh;
      nameCell(ctx, r, x0, y, 240);
      ctx.font = F(500, 15); ctx.fillStyle = C.bgText;
      r.drivers.slice(0, 2).forEach((d, i) => { const surname = String(d.name).split(' ').slice(-1)[0]; ctx.fillText(fit(ctx, surname + '  P' + (d.pos || '–'), 220), x0 + 250, y - 4 + i * 20); });
      if (r.last) { const cx = x0 + cw - 120; chip(ctx, r.last.pos != null ? 'P' + r.last.pos : 'DNF', cx, y - 21, resKind(r.last.pos));
        ctx.textAlign = 'right'; ctx.font = F(800, 20, true); ctx.fillStyle = C.bgText; ctx.fillText(r.last.stops != null ? String(r.last.stops) : '–', x0 + cw, y); ctx.textAlign = 'left'; }
      if (k < rows.length - 1) { ctx.fillStyle = C.bgLine; ctx.fillRect(x0, y + rh - 34, cw, 1); }
    });
    const ax = 800, aw = W - 48 - ax; panel(ctx, ax, 150, aw, 440); let ay = 174;
    if (v.topDriver) ay = award(ctx, nl ? 'Beste coureur' : 'Top driver', v.topDriver.name + ' · P' + v.topDriver.pos, v.topDriver.player ? String(v.topDriver.player).replace(/^@/, '') + ' · ' + v.topDriver.team : v.topDriver.team, ax + 18, ay, aw - 30, C.gold);
    if (v.winner) ay = award(ctx, nl ? 'Beste strategie' : 'Best strategy', pname(v.winner) + ' · P' + v.winner.last.pos, v.winner.last.stops + (v.winner.last.stops === 1 ? ' stop' : ' stops'), ax + 18, ay, aw - 30, C.green);
    if (v.split) award(ctx, nl ? 'Andere keuze' : 'Split strategies', pname(v.split.few) + ' ' + v.split.few.last.stops + '  v  ' + pname(v.split.many) + ' ' + v.split.many.last.stops, nl ? 'stops in de laatste race' : 'stops in the last race', ax + 18, ay, aw - 30, C.orange);
    footer(ctx, v.rows.length + ' ' + t.teams);
  }

  // ------------------------------------------------------------ race report and strategy room (from the race recap)
  const RLW = { en: { report: 'Race report', strat: 'Strategy room', none: 'Load the race recap to make this card.', laps: 'laps', lap: 'Lap', caution: 'Caution', stage: 'Stage', out: 'Retired',
      top: 'Top 5', from: 'from', win: 'Winner', margin: 'Margin', cautions: 'Cautions', dnf: 'Did not finish', charge: 'Charge of the day', leader: 'Championship leader', newLeader: 'New leader',
      plan: 'Winning strategy', stopsN: 'stops', paid: 'Paid off best', avg: 'avg finish', yellow: 'Under caution', ofStops: 'of all stops', bestPit: 'Best stop', worstPit: 'Most expensive stop', places: 'places', fastest: 'Fastest stop',
      gain: 'gained places in the stop', lose: 'lost places', green: 'green-flag stop', yellowStop: 'stop under caution' },
    nl: { report: 'Raceverslag', strat: 'Strategiekamer', none: 'Laad de racerecap om deze kaart te maken.', laps: 'ronden', lap: 'Ronde', caution: 'Caution', stage: 'Stage', out: 'Uitgevallen',
      top: 'Top 5', from: 'vanaf', win: 'Winnaar', margin: 'Verschil', cautions: 'Cautions', dnf: 'Niet gefinisht', charge: 'Inhaalrace van de dag', leader: 'Leider kampioenschap', newLeader: 'Nieuwe leider',
      plan: 'Winnende strategie', stopsN: 'stops', paid: 'Werkte het best', avg: 'gem. finish', yellow: 'Onder caution', ofStops: 'van alle stops', bestPit: 'Beste stop', worstPit: 'Duurste stop', places: 'plekken', fastest: 'Snelste stop',
      gain: 'plekken gewonnen in de stop', lose: 'plekken verloren', green: 'stop onder groen', yellowStop: 'stop onder caution' } };
  const sur = n => String(n || '').trim().split(/\s+/).slice(-1)[0];
  // lap axis with caution bands and stage ticks
  function lapAxis(ctx, v, x0, x1, y0, y1, t) {
    const L = Math.max(1, v.laps || 1), xa = l => x0 + (Math.max(0, Math.min(L, l)) / L) * (x1 - x0);
    for (const c of v.cautions || []) { ctx.fillStyle = 'rgba(244,196,48,0.16)'; ctx.fillRect(xa(c.from), y0, Math.max(3, xa(c.to) - xa(c.from)), y1 - y0); ctx.fillStyle = C.gold; ctx.fillRect(xa(c.from), y0, 2, y1 - y0); }
    for (const st of v.stages || []) { ctx.setLineDash([4, 4]); ctx.strokeStyle = C.bgMuted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xa(st.lap), y0); ctx.lineTo(xa(st.lap), y1); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = F(700, 11); ctx.fillStyle = C.bgMuted; ctx.fillText('S' + st.n, xa(st.lap) + 4, y0 + 12); }
    ctx.fillStyle = C.bgLine; ctx.fillRect(x0, y1, x1 - x0, 1);
    ctx.font = F(600, 11); ctx.fillStyle = C.bgMuted; for (let k = 0; k <= 4; k++) { const l = Math.round(L * k / 4); ctx.textAlign = k === 0 ? 'left' : k === 4 ? 'right' : 'center'; ctx.fillText(String(l), xa(l), y1 + 16); } ctx.textAlign = 'left';
    return xa;
  }
  function pitwall(canvas, s, v, opts) {
    const lang = lg(opts), t = RLW[lang], ctx = frame(canvas, opts.scale || 2, null);
    if (!v || v.empty) { kicker(ctx, t.strat, [v && v.category, v && v.season].filter(Boolean).join(' ')); ctx.font = F(800, 30, true); ctx.fillStyle = C.bgMuted; ctx.fillText(t.none, 48, 200); footer(ctx, ''); return; }
    kicker(ctx, t.strat, [[v.category, v.season].filter(Boolean).join(' '), v.laps + ' ' + t.laps].join('  ·  '), C.gold);
    ctx.font = F(800, 52, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, String(v.circuit).toUpperCase(), 1100), 44, 122);
    // pit timeline: one row per car to follow
    const x0 = 230, x1 = 740, y0 = 160, rows = v.rows.slice(0, 8), rh = Math.min(48, Math.floor(380 / Math.max(rows.length, 1))), y1 = y0 + rows.length * rh + 6;
    const xa = lapAxis(ctx, v, x0, x1, y0, y1, t);
    rows.forEach((c, k) => {
      const y = y0 + 6 + k * rh + rh / 2;
      ctx.fillStyle = (c.follow && c.follow.color) || C.bgText; ctx.fillRect(48, y - 14, 5, 28);
      ctx.font = F(800, 16, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, sur(c.driver).toUpperCase(), 110), 62, y - 1);
      ctx.font = F(500, 11); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, (c.follow && c.follow.player ? String(c.follow.player).replace(/^@/, '') : c.team), 110), 62, y + 13);
      ctx.font = F(800, 15, true); ctx.fillStyle = c.out ? C.redText : c.pos <= 3 ? C.gold : C.bgText; ctx.textAlign = 'right'; ctx.fillText(c.out ? 'DNF' : 'P' + c.pos, x0 - 14, y + 5); ctx.textAlign = 'left';
      ctx.fillStyle = C.bgLine; ctx.fillRect(x0, y, x1 - x0, 1);
      if (c.out && c.outLap) { ctx.fillStyle = C.redText; ctx.font = F(900, 16, true); ctx.textAlign = 'center'; ctx.fillText('×', xa(c.outLap), y + 6); ctx.textAlign = 'left'; }
      for (const p of c.pits) { const r = 7 + Math.min(5, Math.abs(p.delta || 0) / 2);
        ctx.fillStyle = p.delta > 0 ? C.green : p.delta < 0 ? C.redText : C.bgMuted; ctx.beginPath(); ctx.arc(xa(p.lap), y, r, 0, Math.PI * 2); ctx.fill();
        if (p.caution) { ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.stroke(); }
        if (p.delta) { ctx.font = F(800, 10, true); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText((p.delta > 0 ? '+' : '') + p.delta, xa(p.lap), y + 4); ctx.textAlign = 'left'; } }
    });
    ctx.font = F(500, 12); ctx.fillStyle = C.bgMuted;
    ctx.fillText(fit(ctx, (lang === 'nl' ? 'Bolletje = pitstop (groen: plekken gewonnen, rood: verloren, gouden rand: onder caution) · geel vlak = caution' : 'Dot = pit stop (green: places gained, red: lost, gold ring: under caution) · yellow band = caution'), 692), 48, Math.min(590, y1 + 40));
    // the strategy story
    const ax = 790, aw = W - 48 - ax; panel(ctx, ax, 150, aw, 440); let ay = 172;
    if (v.winner) ay = award(ctx, t.plan, v.winner.stops + ' ' + t.stopsN + ' · ' + sur(v.winner.driver), v.winner.team, ax + 18, ay, aw - 30, C.gold);
    if (v.bestPlan && v.plans.length > 1) ay = award(ctx, t.paid, v.bestPlan.stops + ' ' + t.stopsN + ' · ' + t.avg + ' P' + n1(v.bestPlan.avg, lang), v.plans.map(p => p.stops + ': ' + p.n + '×').join('  ·  '), ax + 18, ay, aw - 30, C.green);
    if (v.cautions.length) ay = award(ctx, t.yellow, v.yellowShare + '% ' + t.ofStops, v.cautions.length + ' cautions', ax + 18, ay, aw - 30, C.gold);
    if (v.bestPit && ay < 470) ay = award(ctx, t.bestPit, sur(v.bestPit.driver) + ' · +' + v.bestPit.delta + ' ' + t.places, t.lap + ' ' + v.bestPit.lap + '  ·  ' + v.bestPit.time + ' s', ax + 18, ay, aw - 30, C.green);
    if (v.fastest && ay < 500) award(ctx, t.fastest, sur(v.fastest.driver) + ' · ' + n1(v.fastest.time, lang) + ' s', v.fastest.team, ax + 18, ay, aw - 30, C.orange);
    footer(ctx, v.stops + ' pit stops');
  }
  function raceboard(canvas, s, v, opts) {
    const lang = lg(opts), t = RLW[lang], ctx = frame(canvas, opts.scale || 2, null);
    if (!v || v.empty) { kicker(ctx, t.report, [v && v.category, v && v.season].filter(Boolean).join(' ')); ctx.font = F(800, 30, true); ctx.fillStyle = C.bgMuted; ctx.fillText(t.none, 48, 200); footer(ctx, ''); return; }
    kicker(ctx, t.report, [[v.category, v.season].filter(Boolean).join(' '), v.laps + ' ' + t.laps, v.field + (lang === 'nl' ? ' starters' : ' starters')].join('  ·  '), C.gold);
    ctx.font = F(800, 52, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, String(v.circuit).toUpperCase(), 1100), 44, 122);
    // the race on one line: cautions, stages, retirements, contacts of the teams to follow
    const x0 = 48, x1 = W - 48, y0 = 150, y1 = 214, xa = lapAxis(ctx, v, x0, x1, y0, y1, t);
    for (const r of v.retired) if (r.lap) { ctx.fillStyle = r.follow ? C.redText : C.bgMuted; ctx.font = F(900, r.follow ? 20 : 14, true); ctx.textAlign = 'center'; ctx.fillText('×', xa(r.lap), y1 - 8); ctx.textAlign = 'left'; }
    for (const m of v.moments) { ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(xa(m.lap), y0 + 34, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = F(500, 12); ctx.fillStyle = C.bgMuted; ctx.fillText(lang === 'nl' ? 'Geel: caution · S: einde stage · ×: uitvaller · oranje: incident van een team om te volgen' : 'Yellow: caution · S: end of stage · ×: retirement · orange: incident of a team to watch', x0, y1 + 34);
    // top 5
    const tx = 48; label2(ctx, t.top, tx, 282);
    v.top.forEach((c, k) => { const y = 318 + k * 52, follow = v.followed.some(f => f.driver === c.driver);
      if (follow) { ctx.fillStyle = C.bgRow; ctx.fillRect(tx - 8, y - 30, 690, 46); ctx.fillStyle = C.gold; ctx.fillRect(tx - 8, y - 30, 3, 46); }
      ctx.font = F(900, 26, true); ctx.fillStyle = k === 0 ? C.gold : C.bgText; ctx.fillText(String(c.pos), tx, y);
      ctx.font = F(800, 20, true); ctx.fillStyle = C.bgText; const nm = fit(ctx, String(c.driver).toUpperCase(), 330); ctx.fillText(nm, tx + 40, y);
      ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, c.team, 240), tx + 50 + ctx.measureText(nm).width * 0 + Math.min(330, ctx.measureText(nm).width) + 30, y - 1);
      ctx.textAlign = 'right'; ctx.font = F(600, 14); ctx.fillStyle = C.bgMuted; ctx.fillText(c.start ? t.from + ' P' + c.start : '', tx + 680, y - 1); ctx.textAlign = 'left'; });
    const ax = 790, aw = W - 48 - ax; panel(ctx, ax, 260, aw, 330); let ay = 282;
    if (v.winner) ay = award(ctx, t.margin, v.margin != null ? (lang === 'nl' ? String(+v.margin.toFixed(3)).replace('.', ',') : String(+v.margin.toFixed(3))) + ' s' : '1+ ' + t.laps, v.second ? (lang === 'nl' ? 'voor ' : 'over ') + sur(v.second.driver) : null, ax + 18, ay, aw - 30, C.gold);
    ay = award(ctx, t.cautions + ' · ' + t.dnf, v.cautions.length + '  ·  ' + v.retired.length, null, ax + 18, ay, aw - 30, C.orange);
    if (v.climb && ay < 470) ay = award(ctx, t.charge, sur(v.climb.driver) + ' · P' + v.climb.start + ' → P' + v.climb.pos, v.climb.team, ax + 18, ay, aw - 30, C.green);
    if ((v.change || v.leader) && ay < 500) award(ctx, v.change ? t.newLeader : t.leader, v.change ? v.change.to : v.leader.team, v.leader ? v.leader.points + ' pts' + (v.leader.gap != null ? '  ·  +' + n1(v.leader.gap, lang) : '') : null, ax + 18, ay, aw - 30, C.bgText);
    footer(ctx, v.followed.length ? v.followed.map(f => sur(f.driver) + ' ' + (f.out ? 'DNF' : 'P' + f.pos)).slice(0, 6).join('  ·  ') : '');
  }

  root.DMExtraCards = { stretch, preview, transfer, duel, devrace, wrapped, mpround, mptable, mph2h, mpdev, mpgrid, pitwall, raceboard };
})(typeof self !== 'undefined' ? self : this);
