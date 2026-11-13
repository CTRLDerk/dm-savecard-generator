/* DM Save Card — playthrough cards (1200 × 675), Delta Manager redesign style:
   cover (chapter title, main story, side stories), storyline (the season so far with chapters and scars)
   and next time (open questions, the car in words, contracts). Uses the journal snapshot only. */
(function (root) {
  'use strict';
  const Card = root.DMCard, E = root.DMEpisode, TX = root.DMText;
  const { C, F, fit, wrap, spaced, label, stripe, logoBox, readable } = Card.helpers;
  const W = Card.W, H = Card.H;
  const L = {
    en: { story: 'The story so far', after: 'after round {R} of {N}', chapters: 'Chapters', noCh: 'No chapters saved yet. Save one with “Save as chapter”.', thisSeason: 'This season', podiums: 'Podiums', seasonHigh: 'season high', best: 'Best result', top10: 'Top 10s', dnfs: 'DNFs', ups: 'Upgrades', champRun: 'Championship', toGo: 'to go', round: 'Round', worked: 'worked', bestPos: 'best',
      champ: 'Championship', result: 'Race result', dnf: 'DNF', upOk: 'upgrade', upBad: 'failed upgrade', protest: 'stewards', injury: 'injury', ch: 'chapter',
      open: 'Open questions', car: 'Our car', contracts: 'Contracts ending', none: 'None', target: 'Board target', now: 'now', next: 'Next race',
      words: ['Poor', 'Shaky', 'Solid', 'Strong', 'World-class'], ahead: 'ahead of target', on: 'on target', behind: 'behind target', week: 'week', pts: 'pts',
      prologue: 'Prologue', pilot: 'Pilot', goal: 'Goal', season: 'Season', lead: 'lead', gap: 'gap' },
    nl: { story: 'Het verhaal tot nu toe', after: 'na ronde {R} van {N}', chapters: 'Hoofdstukken', noCh: 'Nog geen hoofdstukken bewaard. Bewaar er een met “Bewaar als hoofdstuk”.', thisSeason: 'Dit seizoen', podiums: 'Podiums', seasonHigh: 'hoogste dit seizoen', best: 'Beste resultaat', top10: 'Top 10', dnfs: 'Uitvallers', ups: 'Upgrades', champRun: 'Kampioenschap', toGo: 'nog te gaan', round: 'Ronde', worked: 'gelukt', bestPos: 'beste',
      champ: 'Kampioenschap', result: 'Raceuitslag', dnf: 'DNF', upOk: 'upgrade', upBad: 'mislukte upgrade', protest: 'stewards', injury: 'blessure', ch: 'hoofdstuk',
      open: 'Open vragen', car: 'Onze auto', contracts: 'Aflopende contracten', none: 'Geen', target: 'Doel bestuur', now: 'nu', next: 'Volgende race',
      words: ['Zwak', 'Wankel', 'Degelijk', 'Sterk', 'Wereldklasse'], ahead: 'boven het doel', on: 'op koers', behind: 'onder het doel', week: 'week', pts: 'ptn',
      prologue: 'Proloog', pilot: 'Pilot', goal: 'Doel', season: 'Seizoen', lead: 'voorsprong', gap: 'gat' }
  };
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
  const WORD_COL = [C.redText, C.orange, C.bgText, C.green, C.gold];
  const toneCol = t => (t === 'gold' ? C.gold : t === 'good' ? C.green : t === 'bad' ? C.redText : t === 'warn' ? C.orange : C.bgMuted);
  // Rank in the field → a word (ratings as words, never numbers).
  const word = (rank, of) => { const x = of > 1 ? (rank - 1) / (of - 1) : 0; return x <= 0.1 ? 4 : x <= 0.3 ? 3 : x <= 0.6 ? 2 : x <= 0.85 ? 1 : 0; };

  function frame(canvas, scale, color) {
    canvas.width = W * scale; canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    stripe(ctx, 0, 14); ctx.fillStyle = C.red; ctx.fillRect(0, 14, W, 4);
    if (color) { ctx.fillStyle = color; ctx.fillRect(0, 18, 10, H - 18); }
    return ctx;
  }
  function slash(ctx, x, y, h) {
    ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -0.32, 1, 0, 0);
    ctx.fillStyle = C.red; ctx.fillRect(0, 0, 6, h); ctx.fillStyle = C.green; ctx.fillRect(10, 0, 6, h); ctx.restore();
  }
  function footer(ctx, left) {
    ctx.fillStyle = C.bgLine; ctx.fillRect(48, 610, W - 96, 1);
    ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, left || '', 820), 48, 642);
    ctx.font = F(900, 20, true); ctx.textAlign = 'right'; ctx.fillStyle = C.red; ctx.fillText('SAVE CARD', W - 48, 643);
    const bw = ctx.measureText('SAVE CARD').width; ctx.fillStyle = C.bgText; ctx.fillText('DM ', W - 48 - bw, 643); ctx.textAlign = 'left';
  }
  function panel(ctx, x, y, w, h) { ctx.fillStyle = C.pit; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.bgLine; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1); }
  function chapterTag(p) { return p.no === 0 ? p.prologueLabel : p.chapter + ' ' + p.no; }

  // The big number on the cover, chosen by the main story.
  function hero(ep, t) {
    const m = ep.main, d = (m && m.data) || {}, T = ep.team;
    if (ep.kind === 'prologue' || ep.kind === 'pilot') return { big: ep.preseason || T.pos == null ? (T.expected ? 'P' + T.expected : '–') : 'P' + T.pos, small: ep.preseason ? (t.lang === 'nl' ? 'doel' : 'target') : T.points + ' ' + t.pts, gain: 0 };
    if (m && ['win', 'podium', 'comeback', 'heartbreak', 'bad_day', 'quiet'].includes(m.key))
      return { big: d.pos ? 'P' + d.pos : (d.label || 'DNF'), small: d.start ? (t.lang === 'nl' ? 'van P' : 'from P') + d.start + (d.gain > 0 ? '  +' + d.gain : d.gain < 0 ? '  −' + Math.abs(d.gain) : '') : '', gain: d.gain, out: d.pos == null };
    if (m && (m.key === 'upgrade_hit' || m.key === 'upgrade_miss')) return { big: m.key === 'upgrade_hit' && d.to != null && d.from != null ? '+' + (+(d.to - d.from).toFixed(1)) : '✕', small: String(d.name || d.key || ''), gain: m.key === 'upgrade_hit' ? 1 : -1 };
    if (m && (m.key === 'season_end' || m.key === 'champions')) return { big: 'P' + d.pos, small: (d.points != null ? d.points + ' ' + t.pts : ''), gain: m.key === 'champions' ? 1 : 0 };
    return { big: T.pos != null ? 'P' + T.pos : '–', small: T.points != null && !ep.preseason ? T.points + ' ' + t.pts : '', gain: 0 };
  }

  // ------------------------------------------------------------ cover
  function cover(canvas, ep, opts) {
    opts = opts || {};
    const lang = opts.lang === 'nl' ? 'nl' : 'en', t = Object.assign({ lang }, L[lang]);
    const p = E.parts(ep, { lang, title: opts.title, variant: opts.variant });
    p.prologueLabel = ep.kind === 'prologue' ? t.prologue : p.chapter;
    const ctx = frame(canvas, opts.scale || 2, ep.team.color);
    // Kicker: chapter + series/season + round
    slash(ctx, 48, 40, 22);
    ctx.font = F(800, 22, true); ctx.fillStyle = C.bgText;
    const tag = (ep.kind === 'prologue' ? t.prologue : ep.kind === 'pilot' ? p.chapter + ' ' + ep.no + ' · ' + t.pilot : p.chapter + ' ' + ep.no).toUpperCase();
    ctx.fillText(tag, 76, 60);
    const tw = ctx.measureText(tag).width;
    label(ctx, [ep.series ? ep.series.name : null, (ep.category || '') + ' ' + ep.season, p.round].filter(Boolean).join('  ·  '), 76 + tw + 18, 59, C.bgMuted);
    // Title
    ctx.font = F(800, 74, true); ctx.fillStyle = C.bgText;
    const lines = wrap(ctx, p.title.toUpperCase(), 1100, 2);
    lines.forEach((ln, i) => ctx.fillText(ln, 46, 142 + i * 74));
    const ty = 142 + (lines.length - 1) * 74;
    // Hero number + lead
    const h = hero(ep, t);
    const hx = 48, hy = ty + 168;
    ctx.font = F(800, 150, true); ctx.fillStyle = ep.main && p.tone === 'gold' ? C.gold : h.out ? C.redText : C.bgText;
    ctx.fillText(h.big, hx - 4, hy);
    const bw = ctx.measureText(h.big).width;
    if (h.small) { ctx.font = F(700, 26); ctx.fillStyle = h.gain > 0 ? C.green : h.gain < 0 ? C.redText : C.bgMuted; ctx.fillText(fit(ctx, h.small, 240), hx + bw + 14, hy - 12); }
    ctx.font = F(500, 19); ctx.fillStyle = C.bgText;
    const leadW = 560 - 48;
    wrap(ctx, p.lead, leadW, 4).forEach((ln, i) => ctx.fillText(ln, hx, hy + 44 + i * 26));
    // Side stories
    const sx = 640, sw = W - 48 - sx;
    let sy = ty + 52;
    label(ctx, ep.kind === 'prologue' ? p.seasonLabel : ep.kind === 'pilot' ? p.threadsLabel : p.meanwhile, sx, sy, C.bgMuted); sy += 14;
    const side = (ep.kind === 'pilot' ? p.threads.map(x => ({ text: x.text, tone: x.tone })) : p.side).slice(0, 3);
    if (!side.length) { ctx.font = F(500, 16); ctx.fillStyle = C.bgMuted; ctx.fillText('–', sx, sy + 26); }
    for (const s of side) {
      panel(ctx, sx, sy, sw, 70);
      ctx.fillStyle = toneCol(s.tone); ctx.fillRect(sx, sy, 4, 70);
      ctx.font = F(600, 17); ctx.fillStyle = C.bgText;
      wrap(ctx, s.text, sw - 34, 2).forEach((ln, i) => ctx.fillText(ln, sx + 20, sy + 30 + i * 23));
      sy += 80;
    }
    // Next time
    const ny = 568;
    if (p.cliff || p.next) {
      ctx.font = F(800, 20, true); ctx.fillStyle = C.red; const nl = p.nextLabel.toUpperCase() + ':';
      ctx.fillText(nl, 48, ny); const nw = ctx.measureText(nl).width;
      ctx.font = F(500, 18); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, [p.next, p.cliff].filter(Boolean).join('  '), W - 96 - nw - 12), 48 + nw + 12, ny);
    }
    footer(ctx, [ep.team.short, ep.team.pos != null && !ep.preseason ? 'P' + ep.team.pos + ' · ' + ep.team.points + ' ' + t.pts : null].filter(Boolean).join('  ·  '));
    return canvas;
  }

  // ------------------------------------------------------------ storyline
  function storyline(canvas, ep, journal, opts) {
    opts = opts || {};
    const lang = opts.lang === 'nl' ? 'nl' : 'en', t = L[lang];
    const snap = journal.last, T = snap.team;
    const ctx = frame(canvas, opts.scale || 2, T.color);
    slash(ctx, 48, 40, 22);
    ctx.font = F(800, 22, true); ctx.fillStyle = C.bgText; const k = t.story.toUpperCase(); ctx.fillText(k, 76, 60);
    label(ctx, [(snap.category || '') + ' ' + snap.season, snap.preseason ? '' : fill(t.after, { R: snap.round, N: snap.total })].filter(Boolean).join('  ·  '), 76 + ctx.measureText(k).width + 18, 59, C.bgMuted);
    ctx.font = F(800, 46, true); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, (ep.series ? ep.series.name : T.short).toUpperCase(), 760), 46, 114);

    // Chart: rounds across, positions down (P1 on top).
    const X0 = 96, X1 = 800, Y0 = 150, Y1 = 470;
    const n = Math.max(1, snap.total || snap.races.length);
    const bestOf = r => r.mine.slice().sort((a, b) => (a.finished === b.finished ? (a.pos || 99) - (b.pos || 99) : a.finished ? -1 : 1))[0] || null;
    const races = snap.races.map(r => Object.assign({}, r, { best: bestOf(r) }));
    // Depth of the scale: the worst place we actually saw (results and standings), at least the number of teams.
    const seen = races.flatMap(r => [r.best && r.best.finished ? r.best.pos : null, r.standing ? r.standing.pos : null, r.cars || null]).filter(Boolean);
    const field = Math.max(3, snap.field.length, ...seen);
    // One row per position, P1 on top.
    const rowH = (Y1 - Y0) / (field - 1);
    const yAt = p => Y0 + (Math.min(p, field) - 1) * rowH;
    const xAt = r => X0 + (n === 1 ? (X1 - X0) / 2 : (r - 1) * (X1 - X0) / (n - 1));
    const done = races.length ? Math.max(...races.map(r => r.round)) : 0;
    // rounds still to come: a quiet band
    if (done < n) {
      const fx = xAt(done) + (n > 1 ? (X1 - X0) / (n - 1) / 2 : 0);
      ctx.fillStyle = 'rgba(244,237,226,0.035)'; ctx.fillRect(fx, Y0 - 12, X1 + 8 - fx, Y1 - Y0 + 24);
      ctx.font = F(700, 12); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right'; ctx.fillText((n - done) + ' ' + t.toGo, X1 + 4, Y0 - 18); ctx.textAlign = 'left';
    }
    // grid: a line for every position; every label when there is room, else every 5th (plus P1 and the last)
    const labelEvery = rowH >= 15 ? 1 : rowH >= 7.5 ? 2 : 5;
    const fs = Math.max(10, Math.min(14, Math.floor(rowH * (labelEvery === 1 ? 0.95 : 1.6))));
    ctx.textAlign = 'right';
    for (let p = 1; p <= field; p++) {
      const strong = p === 1 || p % 5 === 0 || p === field;
      ctx.fillStyle = strong ? C.bgLine : 'rgba(244,237,226,0.06)';
      ctx.fillRect(X0 - 8, Math.round(yAt(p)), X1 - X0 + 16, 1);
      // labels on P1, P3, P5 … (or every one / every 5th); the last position too, unless the one above it is labelled
      const on = q => labelEvery === 1 || (labelEvery === 2 ? (q - 1) % 2 === 0 : q === 1 || q % 5 === 0);
      if (on(p) || p === field && !on(field - 1)) {
        ctx.font = F(strong ? 700 : 600, fs); ctx.fillStyle = strong ? C.bgMuted : 'rgba(179,167,151,0.7)';
        ctx.fillText('P' + p, X0 - 16, yAt(p) + fs * 0.36);
      }
    }
    ctx.textAlign = 'left';
    // chapter markers (this season)
    const chs = (journal.chapters || []).filter(c => c.season === snap.season && c.round > 0);
    // several chapters in one round share one marker: "1–3"
    const byRound = new Map(); for (const c of chs) { if (!byRound.has(c.round)) byRound.set(c.round, []); byRound.get(c.round).push(c.no); }
    for (const [round, nos] of byRound) {
      const c = { round, no: nos.length > 1 ? Math.min(...nos) + '–' + Math.max(...nos) : nos[0] };
      const x = xAt(c.round);
      ctx.strokeStyle = C.bgMuted; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x, Y0 - 16); ctx.lineTo(x, Y1 + 4); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = F(700, 13); const lab = String(c.no); const lw = ctx.measureText(lab).width + 10;
      ctx.fillStyle = C.bgText; ctx.fillRect(x - lw / 2, Y0 - 34, lw, 18); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(lab, x, Y0 - 20); ctx.textAlign = 'left';
    }
    // race results (under the line), podiums named
    const used = { dnf: false, result: false };
    for (const r of races) {
      const best = r.best; if (!best) continue;
      const x = xAt(r.round);
      if (!best.finished) { cross(ctx, x, Y1 + 26, 7, C.redText); used.dnf = true; continue; }
      const y = yAt(best.pos); used.result = true;
      ctx.fillStyle = best.pos === 1 ? C.gold : best.pos <= 3 ? C.green : C.bg; ctx.strokeStyle = best.pos <= 3 ? ctx.fillStyle : C.bgMuted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, best.pos <= 3 ? 7.5 : 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (best.pos <= 3) { ctx.font = F(800, 15, true); ctx.fillStyle = ctx.strokeStyle; ctx.textAlign = 'center'; ctx.fillText('P' + best.pos, x, y - 13); ctx.textAlign = 'left'; }
    }
    // championship line on top
    const pts = races.filter(r => r.standing).map(r => [xAt(r.round), yAt(r.standing.pos)]);
    if (pts.length) {
      ctx.strokeStyle = T.color || C.bgText; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      const [lx, ly] = pts[pts.length - 1];
      ctx.fillStyle = T.color || C.bgText; ctx.beginPath(); ctx.arc(lx, ly, 8, 0, Math.PI * 2); ctx.fill();
      ctx.font = F(800, 22, true); ctx.fillStyle = C.bgText; ctx.fillText('P' + races.filter(r => r.standing).slice(-1)[0].standing.pos, lx + 14, ly + 8);
    }
    // scars row: upgrades, stewards, injuries; several in one round sit side by side
    const evs = journal.events.filter(e => e.season === snap.season);
    const sy = Y1 + 58, per = new Map(), marks = [];
    for (const e of evs) {
      const kind = e.type === 'upgrade' ? (e.success ? 'upOk' : 'upBad') : e.type === 'paddock' && /protest|investigation|techcheck/.test((e.item || {}).type) ? 'protest' : e.type === 'injury' ? 'injury' : null;
      if (!kind) continue;
      const r = Math.max(1, Math.min(n, e.round || 1));
      marks.push({ r, kind, i: per.get(r) || 0 }); per.set(r, (per.get(r) || 0) + 1);
    }
    const step = Math.min(15, (X1 - X0) / Math.max(1, n - 1) * 0.9);
    const usedK = new Set();
    for (const m of marks) {
      const k = per.get(m.r), x = xAt(m.r) + (m.i - (k - 1) / 2) * step;
      usedK.add(m.kind);
      if (m.kind === 'upOk') tri(ctx, x, sy, C.green, true);
      else if (m.kind === 'upBad') tri(ctx, x, sy, C.redText, false);
      else if (m.kind === 'protest') bang(ctx, x, sy);
      else plus(ctx, x, sy, C.redText);
    }
    // x labels: country codes say little when they repeat (NASCAR: all US), then round numbers
    const cal = snap.calendar.filter(c => c.round <= n);
    const ccs = new Set(cal.map(c => c.cc).filter(Boolean));
    const useCc = ccs.size >= Math.min(6, cal.length * 0.4);
    const every = n > 26 ? 2 : 1;
    ctx.font = F(600, 11); ctx.textAlign = 'center';
    for (const c of cal) {
      if (!useCc && c.round % every && c.round !== 1 && c.round !== n && c.round !== done) continue;
      ctx.fillStyle = c.round === done ? C.bgText : C.bgMuted; ctx.font = F(c.round === done ? 800 : 600, 11);
      ctx.fillText(useCc ? (c.cc || String(c.round)) : String(c.round), xAt(c.round), sy + 30);
    }
    ctx.textAlign = 'left';
    if (!useCc) { ctx.font = F(600, 11); ctx.fillStyle = C.bgMuted; ctx.textAlign = 'right'; ctx.fillText(t.round.toUpperCase(), X0 - 16, sy + 30); ctx.textAlign = 'left'; }
    // legend: only what is on the card
    let lx = X0 - 8; const ly = 600 - 4;
    const key = (draw, text) => { draw(lx + 8, ly - 5); ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(text, lx + 22, ly); lx += 30 + ctx.measureText(text).width; };
    if (pts.length) key((x, y) => { ctx.fillStyle = T.color || C.bgText; ctx.fillRect(x - 8, y - 2, 16, 5); }, t.champ);
    if (used.result) key((x, y) => { ctx.strokeStyle = C.bgMuted; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke(); }, t.result);
    if (used.dnf) key((x, y) => cross(ctx, x, y, 5, C.redText), t.dnf);
    if (usedK.has('upOk')) key((x, y) => tri(ctx, x, y + 1, C.green, true), t.upOk);
    if (usedK.has('upBad')) key((x, y) => tri(ctx, x, y + 1, C.redText, false), t.upBad);
    if (usedK.has('protest')) key((x, y) => bang(ctx, x, y + 1), t.protest);
    if (usedK.has('injury')) key((x, y) => plus(ctx, x, y, C.redText), t.injury);

    // Right panel: the chapters so far, or (none yet) the season in numbers.
    const PX = 846, PW2 = W - 48 - PX;
    panel(ctx, PX, 90, PW2, 498);
    const list = (journal.chapters || []).slice(-9);
    if (list.length) {
      label(ctx, t.chapters, PX + 18, 118, C.bgMuted);
      list.forEach((c, i) => {
        const y = 148 + i * 50;
        ctx.font = F(800, 26, true); ctx.fillStyle = C.bgText; ctx.fillText(c.no === 0 ? '0' : String(c.no), PX + 18, y + 14);
        ctx.font = F(600, 15); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, c.title || '', PW2 - 80), PX + 62, y + 2);
        ctx.font = F(500, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, [c.season, c.round ? 'R' + c.round : null, c.sourceName || c.circuit].filter(Boolean).join(' · '), PW2 - 80), PX + 62, y + 21);
        if (i < list.length - 1) { ctx.fillStyle = C.bgLine; ctx.fillRect(PX + 18, y + 33, PW2 - 36, 1); }
      });
    } else {
      label(ctx, t.thisSeason, PX + 18, 118, C.bgMuted);
      const fin = races.filter(r => r.best && r.best.finished);
      const top = fin.slice().sort((a, b) => a.best.pos - b.best.pos)[0];
      const stand = races.filter(r => r.standing).map(r => r.standing.pos);
      const ups = evs.filter(e => e.type === 'upgrade');
      const rows = [
        [t.best, top ? 'P' + top.best.pos : '–', top ? t.round + ' ' + top.round + (top.name ? ' · ' + top.name : '') : ''],
        [t.top10, String(fin.filter(r => r.best.pos <= 10).length), '/ ' + races.length],
        [t.dnfs, String(races.filter(r => r.best && !r.best.finished).length), ''],
        ups.length ? [t.ups, ups.filter(e => e.success).length + '/' + ups.length, t.worked]
          : [t.podiums, String(fin.filter(r => r.best.pos <= 3).length), '/ ' + races.length],   // no factory data (multiplayer recaps)
        [t.champRun, stand.length ? 'P' + stand[stand.length - 1] : '–', !stand.length ? '' : Math.min(...stand) < stand[stand.length - 1] ? t.bestPos + ' P' + Math.min(...stand) : t.seasonHigh]
      ];
      rows.forEach(([k, v, sub], i) => {
        const y = 166 + i * 78;
        ctx.font = F(600, 13); ctx.fillStyle = C.bgMuted; ctx.fillText(k.toUpperCase(), PX + 18, y);
        ctx.font = F(800, 40, true); ctx.fillStyle = C.bgText; ctx.fillText(v, PX + 18, y + 42);
        const vw = ctx.measureText(v).width;
        ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted; ctx.fillText(fit(ctx, sub, PW2 - 52 - vw), PX + 30 + vw, y + 40);
        if (i < rows.length - 1) { ctx.fillStyle = C.bgLine; ctx.fillRect(PX + 18, y + 58, PW2 - 36, 1); }
      });
    }
    footer(ctx, [T.short, T.pos != null && !snap.preseason ? 'P' + T.pos + ' · ' + T.points + ' ' + t.pts : null, ep.series && ep.series.goalText ? t.goal + ': ' + ep.series.goalText : null].filter(Boolean).join('  ·  '));
    return canvas;
  }
  function cross(ctx, x, y, r, col) { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke(); }
  function tri(ctx, x, y, col, up) { ctx.fillStyle = col; ctx.beginPath(); if (up) { ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y + 5); ctx.lineTo(x - 7, y + 5); } else { ctx.moveTo(x, y + 7); ctx.lineTo(x + 7, y - 5); ctx.lineTo(x - 7, y - 5); } ctx.closePath(); ctx.fill(); }
  function bang(ctx, x, y) { ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.ink; ctx.font = F(800, 13, true); ctx.textAlign = 'center'; ctx.fillText('!', x, y + 5); ctx.textAlign = 'left'; }
  function plus(ctx, x, y, col) { ctx.fillStyle = col; ctx.fillRect(x - 2, y - 7, 4, 14); ctx.fillRect(x - 7, y - 2, 14, 4); }

  // ------------------------------------------------------------ next time
  function nextTime(canvas, ep, journal, opts) {
    opts = opts || {};
    const lang = opts.lang === 'nl' ? 'nl' : 'en', t = L[lang];
    const p = E.parts(ep, { lang, title: opts.title, variant: opts.variant });
    const snap = journal.last, T = snap.team;
    const ctx = frame(canvas, opts.scale || 2, T.color);
    slash(ctx, 48, 40, 22);
    ctx.font = F(800, 22, true); ctx.fillStyle = C.red; const k = p.nextLabel.toUpperCase(); ctx.fillText(k, 76, 60);
    label(ctx, [ep.series ? ep.series.name : null, (snap.category || '') + ' ' + snap.season, ep.kind === 'prologue' ? t.prologue : p.chapter + ' ' + ep.no].filter(Boolean).join('  ·  '), 76 + ctx.measureText(k).width + 18, 59, C.bgMuted);
    ctx.font = F(800, 64, true); ctx.fillStyle = C.bgText;
    const nx = snap.next;
    const hasTrack = !!(nx && nx.track), tw = hasTrack ? 800 : 1100, nm = (nx ? nx.name : snap.finished ? (lang === 'nl' ? 'Nieuw seizoen' : 'New season') : '–').toUpperCase();
    let fs = 64; while (fs > 40 && ctx.measureText(nm).width > tw) { fs -= 4; ctx.font = F(800, fs, true); }
    ctx.fillText(fit(ctx, nm, tw), 46, 132);
    if (nx) { ctx.font = F(600, 17); ctx.fillStyle = C.bgMuted; ctx.fillText([(lang === 'nl' ? 'Ronde ' : 'Round ') + nx.round + ' / ' + snap.total, t.week + ' ' + nx.week,
      nx.km ? String(+nx.km.toFixed(1)).replace('.', lang === 'nl' ? ',' : '.') + ' km' : null, nx.laps ? nx.laps + (lang === 'nl' ? ' ronden' : ' laps') : null, TX.trackType(nx.type, lang) || null].filter(Boolean).join('  ·  '), 48, 162); }
    if (hasTrack) Card.helpers.drawTrack(ctx, nx.track, 880, 44, W - 48 - 880, 130, { width: 4 });

    // Open questions
    const qx = 48, qw = 620;
    label(ctx, t.open, qx, 206, C.bgMuted);
    // Every question once: the series goal and a goal thread often say the same thing.
    const seen = new Set(), norm = x => String(x || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const qs = (ep.series && ep.series.goalLine ? [{ key: 'goal', text: ep.series.goalLine, tone: 'gold', data: {} }] : []).concat(p.threads)
      .filter(q => { const k = norm(q.text); if (!k || seen.has(k) || (q.key === 'goal' && seen.has('#goal'))) return false; seen.add(k); if (q.key === 'goal') seen.add('#goal'); return true; });
    // Room left: what is at stake, from the standings (rival, target, what the next race can change).
    const SL = TX.story(snap, lang), has = k => qs.some(q => q.key === k);
    if (qs.length < 3 && SL.need && !has('chase') && !has('pressure') && !has('defend_lead')) qs.push({ key: 'need', text: SL.need, tone: 'gold', data: {} });
    if (qs.length < 3 && SL.rival) qs.push({ key: 'rival', text: [SL.rival, SL.score].filter(Boolean).join(' '), tone: 'warn', data: {} });
    if (qs.length < 3 && SL.target && !has('goal')) qs.push({ key: 'target', text: SL.target, tone: 'good', data: {} });
    let qy = 220;
    for (const q of qs.slice(0, 3)) {
      panel(ctx, qx, qy, qw, 104);
      ctx.fillStyle = toneCol(q.tone); ctx.fillRect(qx, qy, 4, 104);
      const g = q.data && q.data.gap != null ? q.data.gap : null;
      let tx = qx + 22;
      if (g != null) {
        ctx.font = F(800, 44, true); ctx.fillStyle = C.bgText; const gs = String(Number.isInteger(g) ? g : (+g).toFixed(1));
        ctx.fillText(gs, tx, qy + 62); const gw = ctx.measureText(gs).width;
        ctx.font = F(600, 12); ctx.fillStyle = C.bgMuted; ctx.fillText(t.pts.toUpperCase(), tx + 2, qy + 84);
        tx += Math.max(gw, 36) + 22;
      }
      ctx.font = F(600, 18); ctx.fillStyle = C.bgText;
      wrap(ctx, q.text, qx + qw - tx - 18, 3).forEach((l, i) => ctx.fillText(l, tx, qy + 38 + i * 24));
      qy += 114;
    }
    if (!qs.length) { ctx.font = F(500, 16); ctx.fillStyle = C.bgMuted; ctx.fillText(p.next || '–', qx, qy + 26); }

    // Our car in words
    const cx = 712, cw = W - 48 - cx;
    panel(ctx, cx, 190, cw, 270);
    label(ctx, t.car, cx + 18, 218, C.bgMuted);
    const attrs = (snap.rnd && snap.rnd.attrs) || [];
    attrs.slice(0, 8).forEach((a, i) => {
      const y = 248 + i * 26, wi = word(a.rank, a.of);
      ctx.font = F(500, 15); ctx.fillStyle = C.bgText; ctx.fillText(fit(ctx, lang === 'nl' ? a.nl || a.label : a.label, 190), cx + 18, y);
      ctx.font = F(700, 17); ctx.fillStyle = WORD_COL[wi]; ctx.textAlign = 'right'; ctx.fillText(t.words[wi], cx + cw - 18, y); ctx.textAlign = 'left';
    });
    if (!attrs.length) { ctx.font = F(500, 15); ctx.fillStyle = C.bgMuted; ctx.fillText('–', cx + 18, 250); }
    // Board target and contracts
    panel(ctx, cx, 470, cw, 118);
    label(ctx, t.target, cx + 18, 496, C.bgMuted);
    const ts = T.expected && T.pos ? (T.pos < T.expected ? 'ahead' : T.pos === T.expected ? 'on' : 'behind') : null;
    ctx.font = F(800, 30, true); ctx.fillStyle = C.bgText; const tt = T.expected ? 'P' + T.expected : '–'; ctx.fillText(tt, cx + 18, 532);
    if (ts) { const x2 = cx + 18 + ctx.measureText(tt).width + 12; ctx.font = F(700, 17); ctx.fillStyle = ts === 'behind' ? C.redText : ts === 'ahead' ? C.green : C.bgText; ctx.fillText(t.now + ' P' + T.pos + ' · ' + t[ts], x2, 530); }
    const end = snap.paddock ? snap.paddock.ending.filter(c => !c.staff) : [];
    ctx.font = F(500, 14); ctx.fillStyle = C.bgMuted;
    ctx.fillText(fit(ctx, t.contracts + ': ' + (end.length ? end.map(c => c.name).join(', ') : t.none), cw - 36), cx + 18, 568);
    footer(ctx, [T.short, T.pos != null && !snap.preseason ? 'P' + T.pos + ' · ' + T.points + ' ' + t.pts : null].filter(Boolean).join('  ·  '));
    return canvas;
  }

  root.DMEpCards = { cover, storyline, nextTime, word, L };
})(typeof self !== 'undefined' ? self : this);
