/* DM Save Card — multiplayer: the human-run teams of one season, side by side.
   Three post types, written as a journalist covering the league (third person, no "we"):
   mpround (the round in the paddock), mptable (the players' championship) and mph2h (who beats whom).
   Input: the summary (s.players = player-run teams, set by the app) and the season's race results. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./save.js'));
  else root.DMMp = factory(root.DMSave);
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';
  const KINDS = ['mpround', 'mptable', 'mph2h'];
  const num = S.num;

  // ------------------------------------------------------------ data
  // races: [{ round, name, cc, raw, cars }] as DMExtra.seasonRaces gives them.
  function base(files, s, races) {
    const P = (s.players || []).filter(p => p && p.id != null);
    if (P.length < 2) return null;
    const ids = new Set(P.map(p => p.id));
    // standings of every team after every round (cumulative points), to see who moved
    const cum = new Map(), after = [];
    for (const r of races) {
      for (const k of ['teamPoints', 'sprintTeamPoints']) for (const [id, p] of Object.entries(r.raw[k] || {})) cum.set(+id, (cum.get(+id) || 0) + (num(p) || 0));
      const table = [...cum.entries()].sort((a, b) => b[1] - a[1]);
      after.push({ round: r.round, pos: new Map(table.map(([id], i) => [id, i + 1])), pts: new Map(table) });
    }
    const best = (r, id) => { const c = r.cars.filter(x => x.teamId === id).sort((a, b) => (a.finished === b.finished ? a.position - b.position : a.finished ? -1 : 1))[0]; return c || null; };
    const people = P.map(p => {
      const res = races.map((r, i) => { const c = best(r, p.id); const gained = (num((r.raw.teamPoints || {})[p.id]) || 0) + (num((r.raw.sprintTeamPoints || {})[p.id]) || 0);
        return { round: r.round, name: r.name, raced: !!c, pos: c && c.finished ? c.position : null, start: c ? c.start : null, pts: +gained.toFixed(2), champ: after[i].pos.get(p.id) || null }; });
      const run = res.filter(x => x.raced), fin = run.filter(x => x.pos != null);
      return { id: p.id, short: p.short, name: p.name, color: p.color, player: p.player || null, pos: p.pos, points: p.points, res,
        wins: fin.filter(x => x.pos === 1).length, podiums: fin.filter(x => x.pos <= 3).length, dnfs: run.length - fin.length,
        avg: fin.length ? +(fin.reduce((a, x) => a + x.pos, 0) / fin.length).toFixed(1) : null, best: fin.length ? Math.min(...fin.map(x => x.pos)) : null };
    }).sort((a, b) => (a.pos || 999) - (b.pos || 999));
    // head to head on race days: best car against best car, a retirement loses
    const h2h = {};
    for (const a of people) { h2h[a.id] = {}; for (const b of people) if (a !== b) {
      let w = 0; a.res.forEach((x, i) => { const y = b.res[i]; if (!x.raced || !y.raced) return; if (x.pos != null && (y.pos == null || x.pos < y.pos)) w++; });
      h2h[a.id][b.id] = w; } }
    return { P: people, ids, races, after, h2h, season: s.season, category: s.category, total: s.rounds.total, next: s.next };
  }

  const who = p => p.player || p.short;
  function round(B) {
    const last = B.races[B.races.length - 1]; if (!last) return null;
    const i = B.races.length - 1;
    const rows = B.P.map(p => { const x = p.res[i], prev = i > 0 ? p.res[i - 1].champ : null;
      return { id: p.id, short: p.short, color: p.color, player: p.player, raced: x.raced, pos: x.pos, start: x.start, pts: x.pts, champ: x.champ, prev, move: prev && x.champ ? prev - x.champ : 0,
        gain: x.pos != null && x.start != null ? x.start - x.pos : null }; })
      .sort((a, b) => (a.raced === b.raced ? (a.pos == null) - (b.pos == null) || (a.pos || 0) - (b.pos || 0) : a.raced ? -1 : 1));
    const fin = rows.filter(r => r.pos != null);
    const top = fin[0] || null;
    const mover = fin.filter(r => r.gain >= 3 && r !== top).sort((a, b) => b.gain - a.gain)[0] || null;
    const out = rows.filter(r => r.raced && r.pos == null);
    const climber = rows.filter(r => r.move >= 2).sort((a, b) => b.move - a.move)[0] || null;
    const faller = rows.filter(r => r.move <= -2).sort((a, b) => a.move - b.move)[0] || null;
    // the closest fight between two players next to each other in the championship
    const byChamp = B.P.slice().sort((a, b) => (a.pos || 999) - (b.pos || 999));
    let close = null;
    for (let k = 1; k < byChamp.length; k++) { const a = byChamp[k - 1], b = byChamp[k], g = +(a.points - b.points).toFixed(2);
      if (a.pos != null && b.pos != null && (!close || g < close.gap)) close = { a: a.short, ap: a.player, b: b.short, bp: b.player, gap: g, posA: a.pos, posB: b.pos }; }
    return { kind: 'mpround', round: last.round, name: last.name, cc: last.cc, track: ((B.trackOf || {})[last.round]) || null, rows, top, mover, out, climber, faller, close,
      field: last.cars.length, season: B.season, category: B.category, total: B.total, next: B.next };
  }
  function table(B) {
    const rows = B.P.map((p, k) => ({ id: p.id, short: p.short, color: p.color, player: p.player, pos: p.pos, points: p.points, rank: k + 1,
      gap: k ? +(B.P[k - 1].points - p.points).toFixed(2) : null, form: p.res.filter(x => x.raced).slice(-6).map(x => x.pos), wins: p.wins, podiums: p.podiums, dnfs: p.dnfs, avg: p.avg, best: p.best,
      beats: B.P.filter(q => q !== p && (B.h2h[p.id][q.id] || 0) > (B.h2h[q.id][p.id] || 0)).length }));
    const lead = rows[0], second = rows[1];
    const form = rows.filter(r => r.form.length >= 3).map(r => { const f = r.form.slice(-3).filter(x => x != null); return [r, f.length === 3 ? f.reduce((a, x) => a + x, 0) / 3 : 999]; }).sort((a, b) => a[1] - b[1])[0];
    return { kind: 'mptable', rows, lead, margin: lead && second ? +(lead.points - second.points).toFixed(2) : null, hot: form && form[1] < 999 ? form[0] : null, hotAvg: form ? +form[1].toFixed(1) : null,
      raced: B.races.length, total: B.total, season: B.season, category: B.category };
  }
  function h2h(B) {
    const P = B.P.slice(0, 8), pairs = [];
    for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
      const x = B.h2h[P[a].id][P[b].id] || 0, y = B.h2h[P[b].id][P[a].id] || 0; if (x + y) pairs.push({ a: P[a], b: P[b], x, y, n: x + y });
    }
    const oneSided = pairs.slice().sort((p, q) => Math.abs(q.x - q.y) / q.n - Math.abs(p.x - p.y) / p.n || q.n - p.n)[0] || null;
    const even = pairs.filter(p => p.n >= 2).sort((p, q) => Math.abs(p.x - p.y) - Math.abs(q.x - q.y) || q.n - p.n)[0] || null;
    const dominant = P.map(p => [p, P.filter(q => q !== p && (B.h2h[p.id][q.id] || 0) > (B.h2h[q.id][p.id] || 0)).length]).sort((a, b) => b[1] - a[1])[0];
    return { kind: 'mph2h', players: P.map(p => ({ id: p.id, short: p.short, color: p.color, player: p.player })), m: Object.fromEntries(P.map(p => [p.id, B.h2h[p.id]])),
      oneSided, even, dominant: dominant && dominant[1] ? { p: dominant[0], n: dominant[1], of: P.length - 1 } : null, raced: B.races.length, season: B.season, category: B.category };
  }
  function view(kind, files, s, races) {
    const B = base(files, s, races || []);
    if (!B) return { kind, empty: true, season: s.season, category: s.category };
    B.trackOf = Object.fromEntries(s.rounds.list.filter(r => r.track).map(r => [r.round, r.track]));
    if (!B.races.length) return { kind, empty: true, noRaces: true, season: s.season, category: s.category, players: B.P.length };
    return kind === 'mpround' ? round(B) : kind === 'mptable' ? table(B) : kind === 'mph2h' ? h2h(B) : null;
  }

  // ------------------------------------------------------------ text: a journalist covering the league
  const md = x => String(x == null ? '' : x).replace(/([\\*_~`|>])/g, '\\$1').replace(/@/g, '@\u200b');
  const fill = (t, v) => String(t).replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
  const pick = (a, seed) => a[Math.abs(seed | 0) % a.length];
  const name = (r, nl) => (r.player ? md(r.player) + (nl ? ' (' + md(r.short) + ')' : ' (' + md(r.short) + ')') : md(r.short));
  const pts = (x, nl) => { const t = Number.isInteger(x) ? String(x) : (+x).toFixed(1); return (nl ? t.replace('.', ',') : t) + (nl ? (x === 1 ? ' punt' : ' punten') : (x === 1 ? ' point' : ' points')); };
  const res = (r, nl) => (r.pos != null ? 'P' + r.pos : r.raced ? 'DNF' : (nl ? 'niet gestart' : 'did not start'));
  const W = {
    en: { head: '**PADDOCK REPORT · ROUND {R} · {C}**', sub: '-# {S} · {N} player teams', none: 'No multiplayer season with two or more player teams here. Add the players on the Multiplayer tab.', noRaces: 'The player teams are known, but no race has been run yet.',
      top: ['{P} was the best of the players at {C}: {X} from {S} on the grid.', 'Nobody in the player group went faster at {C} than {P}: {X}, after starting {S}.', '{C} belonged to {P}. {X} from {S}, the best result among the human-run teams.'],
      topWin: ['{P} won at {C}. From {S} on the grid to the top step, ahead of the whole field.', 'Victory for {P} at {C}, from {S} on the grid. The rest of the players could only watch.'],
      mover: ['The climb of the day came from {P}: {S} to {X}, {G} places.', '{P} gained {G} places, from {S} to {X}.'],
      out: ['A bad day for {P}: out of the race.', '{P} did not see the flag.'], outMany: 'Out of the race: {L}.',
      climb: 'In the championship, {P} rose from P{A} to P{B}.', fall: '{P} dropped from P{A} to P{B} in the championship.',
      close: ['The tightest fight in the player standings: {A} and {B}, {X} apart (P{PA} and P{PB}).', 'Only {X} separate {A} and {B} in the championship (P{PA} and P{PB}).'],
      all: '**All player teams**', row: '{K}. {P} · {X}{F} · champ. P{C}{M}', from: ' (from P{S})', next: 'Next round: {N}.',
      tHead: '**PLAYERS’ CHAMPIONSHIP · {S}**', tSub: '-# {C} · after {R} of {T} rounds', lead: ['{P} leads the player standings, {X} clear of {Q}.', '{P} is the best-placed player: P{C} overall, {X} ahead of {Q}.'],
      leadTie: '{P} and {Q} are level at the top of the player standings.', hot: '{P} is the player in form: an average of P{A} over the last three races.',
      tRow: '{K}. {P} · P{C} · {X}{G} · {W}', tW: ['win', 'wins'], tPd: ['podium', 'podiums'],
      hHead: '**WHO BEATS WHOM · {S}**', hSub: '-# {C} · race days only, best car against best car', hDom: '{P} finishes ahead of {N} of the {O} other players more often than not.', hDomAll: '{P} has the upper hand on every other player ({O} of {O}).',
      hOne: 'The most one-sided duel: {A} beats {B} {X}–{Y}.', hEven: 'The closest duel: {A} and {B}, {X}–{Y}.', hRow: '{A} v {B}: {X}–{Y}',
      dHead: '**THE ARMS RACE · {S}**', dSub: '-# {C} · car index of every player team, week {W}', dBest: '{P} has the best car of the player teams: {K} in a field of {N}.', dFast: '{P} has found the most this season: {G} on the car index.',
      dRow: '{K}. {P} · car {R}/{N} · {G}{U} · best {S}, weakest {Wk}{Bz}', dUp: ' · upgrades {O} ok, {B} failed', dBusy: ' · working on {L}',
      gHead: '**DRIVERS AND STRATEGY · {S}**', gSub: '-# {C} · last race: {R}', gTop: 'The best-placed driver of the player teams is {D} ({P}): P{X} in the drivers’ standings.',
      gWin: 'At {R}, {P} came out best with {N} stops.', gSplit: 'Strategies split: {A} stopped {X} times, {B} {Y} times.', gRow: '**{P}** · {D}{L}', gLast: ' · last race {X} from P{S}, {N} stops' },
    nl: { head: '**PADDOCKVERSLAG · RONDE {R} · {C}**', sub: '-# {S} · {N} spelersteams', none: 'Geen multiplayerseizoen met twee of meer spelersteams. Voeg de spelers toe op het tabblad Multiplayer.', noRaces: 'De spelersteams zijn bekend, maar er is nog geen race gereden.',
      top: ['{P} was de beste speler op {C}: {X} vanaf {S} op de grid.', 'Niemand uit de spelersgroep was sneller op {C} dan {P}: {X}, na een start vanaf {S}.', '{C} was van {P}. {X} vanaf {S}, het beste resultaat van de spelersteams.'],
      topWin: ['{P} won op {C}. Van {S} op de grid naar de hoogste trede, voor het hele veld.', 'Zege voor {P} op {C}, vanaf {S} op de grid. De andere spelers konden alleen toekijken.'],
      mover: ['De inhaalrace van de dag kwam van {P}: {S} naar {X}, {G} plekken.', '{P} won {G} plekken, van {S} naar {X}.'],
      out: ['Een slechte dag voor {P}: uitgevallen.', '{P} zag de finishvlag niet.'], outMany: 'Uitgevallen: {L}.',
      climb: 'In het kampioenschap steeg {P} van P{A} naar P{B}.', fall: '{P} zakte in het kampioenschap van P{A} naar P{B}.',
      close: ['Het spannendste gevecht in de spelersstand: {A} en {B}, {X} verschil (P{PA} en P{PB}).', 'Maar {X} tussen {A} en {B} in het kampioenschap (P{PA} en P{PB}).'],
      all: '**Alle spelersteams**', row: '{K}. {P} · {X}{F} · kamp. P{C}{M}', from: ' (vanaf P{S})', next: 'Volgende ronde: {N}.',
      tHead: '**SPELERSKAMPIOENSCHAP · {S}**', tSub: '-# {C} · na {R} van {T} ronden', lead: ['{P} leidt de spelersstand, {X} voor op {Q}.', '{P} is de best geplaatste speler: P{C} in het totaal, {X} voor op {Q}.'],
      leadTie: '{P} en {Q} staan gelijk aan kop van de spelersstand.', hot: '{P} is de speler in vorm: gemiddeld P{A} in de laatste drie races.',
      tRow: '{K}. {P} · P{C} · {X}{G} · {W}', tW: ['zege', 'zeges'], tPd: ['podium', 'podiums'],
      hHead: '**WIE VERSLAAT WIE · {S}**', hSub: '-# {C} · alleen racedagen, beste auto tegen beste auto', hDom: '{P} finisht vaker wel dan niet voor {N} van de {O} andere spelers.', hDomAll: '{P} is de baas over elke andere speler ({O} van {O}).',
      hOne: 'Het meest eenzijdige duel: {A} verslaat {B} met {X}–{Y}.', hEven: 'Het spannendste duel: {A} en {B}, {X}–{Y}.', hRow: '{A} tegen {B}: {X}–{Y}',
      dHead: '**DE WAPENWEDLOOP · {S}**', dSub: '-# {C} · auto-index van elk spelersteam, week {W}', dBest: '{P} heeft de beste auto van de spelersteams: {K} in een veld van {N}.', dFast: '{P} heeft dit seizoen het meest gevonden: {G} op de auto-index.',
      dRow: '{K}. {P} · auto {R}/{N} · {G}{U} · sterkst {S}, zwakst {Wk}{Bz}', dUp: ' · upgrades {O} gelukt, {B} mislukt', dBusy: ' · werkt aan {L}',
      gHead: '**COUREURS EN STRATEGIE · {S}**', gSub: '-# {C} · laatste race: {R}', gTop: 'De best geplaatste coureur van de spelersteams is {D} ({P}): P{X} in het coureursklassement.',
      gWin: 'Op {R} kwam {P} er het best uit met {N} stops.', gSplit: 'De strategieën liepen uiteen: {A} stopte {X} keer, {B} {Y} keer.', gRow: '**{P}** · {D}{L}', gLast: ' · laatste race {X} vanaf P{S}, {N} stops' }
  };
  function text(kind, v, opts) {
    const lang = opts && opts.lang === 'nl' ? 'nl' : 'en', nl = lang === 'nl', w = W[lang], out = [];
    if (!v || v.empty) return v && v.noRaces ? w.noRaces : w.none;
    const S0 = [v.category, v.season].filter(Boolean).join(' ');
    if (kind === 'mpround') {
      out.push(fill(w.head, { R: v.round, C: md(v.name).toUpperCase() }), fill(w.sub, { S: md(S0), N: v.rows.length }), '');
      const seed = v.round;
      if (v.top) out.push(fill(pick(v.top.pos === 1 ? w.topWin : w.top, seed), { P: '**' + name(v.top, nl) + '**', C: md(v.name), X: res(v.top, nl), S: v.top.start != null ? 'P' + v.top.start : '?' }));
      const more = [];
      if (v.mover) more.push(fill(pick(w.mover, seed + 1), { P: name(v.mover, nl), S: 'P' + v.mover.start, X: 'P' + v.mover.pos, G: v.mover.gain }));
      if (v.out.length === 1) more.push(fill(pick(w.out, seed), { P: name(v.out[0], nl) }));
      else if (v.out.length > 1) more.push(fill(w.outMany, { L: v.out.map(r => name(r, nl)).join(', ') }));
      if (v.climber) more.push(fill(w.climb, { P: name(v.climber, nl), A: v.climber.prev, B: v.climber.champ }));
      if (v.faller && v.faller !== v.climber) more.push(fill(w.fall, { P: name(v.faller, nl), A: v.faller.prev, B: v.faller.champ }));
      if (more.length) out.push(more.join(' '));
      if (v.close) out.push('', fill(pick(w.close, seed), { A: v.close.ap ? md(v.close.ap) : md(v.close.a), B: v.close.bp ? md(v.close.bp) : md(v.close.b), X: pts(v.close.gap, nl), PA: v.close.posA, PB: v.close.posB }));
      out.push('', w.all);
      v.rows.forEach((r, k) => out.push(fill(w.row, { K: k + 1, P: name(r, nl), X: res(r, nl), F: r.pos != null && r.start != null ? fill(w.from, { S: r.start }) : '', C: r.champ || '–',
        M: r.move > 0 ? ' (▲' + r.move + ')' : r.move < 0 ? ' (▼' + -r.move + ')' : '' })));
      if (v.next) out.push('', fill(w.next, { N: md(v.next.name) }));
    } else if (kind === 'mptable') {
      out.push(fill(w.tHead, { S: v.season }), fill(w.tSub, { C: md(v.category || ''), R: v.raced, T: v.total }), '');
      const a = v.rows[0], b = v.rows[1];
      if (a && b) out.push(v.margin === 0 ? fill(w.leadTie, { P: '**' + name(a, nl) + '**', Q: name(b, nl) }) : fill(pick(w.lead, v.raced), { P: '**' + name(a, nl) + '**', X: pts(v.margin, nl), Q: name(b, nl), C: a.pos }));
      if (v.hot && v.hot !== a) out.push(fill(w.hot, { P: name(v.hot, nl), A: String(v.hotAvg).replace('.', nl ? ',' : '.') }));
      out.push('');
      v.rows.forEach(r => {
        const bits = [r.wins ? r.wins + ' ' + w.tW[r.wins === 1 ? 0 : 1] : '', r.podiums ? r.podiums + ' ' + w.tPd[r.podiums === 1 ? 0 : 1] : '', r.form.length ? r.form.map(x => (x == null ? 'DNF' : 'P' + x)).join(' ') : ''].filter(Boolean).join(' · ');
        out.push(fill(w.tRow, { K: r.rank, P: name(r, nl), C: r.pos || '–', X: pts(r.points, nl), G: r.gap ? ' (−' + (nl ? String(r.gap).replace('.', ',') : r.gap) + ')' : '', W: bits }));
      });
    } else if (kind === 'mph2h') {
      out.push(fill(w.hHead, { S: v.season }), fill(w.hSub, { C: md(v.category || '') }), '');
      const nm = p => (p.player ? md(p.player) : md(p.short));
      if (v.dominant) out.push(fill(v.dominant.n === v.dominant.of ? w.hDomAll : w.hDom, { P: '**' + nm(v.dominant.p) + '**', N: v.dominant.n, O: v.dominant.of }));
      if (v.oneSided) out.push(fill(w.hOne, { A: nm(v.oneSided.x >= v.oneSided.y ? v.oneSided.a : v.oneSided.b), B: nm(v.oneSided.x >= v.oneSided.y ? v.oneSided.b : v.oneSided.a), X: Math.max(v.oneSided.x, v.oneSided.y), Y: Math.min(v.oneSided.x, v.oneSided.y) }));
      if (v.even && v.even !== v.oneSided) out.push(fill(w.hEven, { A: nm(v.even.a), B: nm(v.even.b), X: v.even.x, Y: v.even.y }));
      out.push('');
      for (let i = 0; i < v.players.length; i++) for (let j = i + 1; j < v.players.length; j++) {
        const A = v.players[i], B2 = v.players[j], x = (v.m[A.id] || {})[B2.id] || 0, y = (v.m[B2.id] || {})[A.id] || 0;
        if (x + y) out.push('- ' + fill(w.hRow, { A: nm(A), B: nm(B2), X: x, Y: y }));
      }
    } else if (kind === 'mpdev') {
      const AN = { speed: ['speed', 'topsnelheid'], grip: ['grip', 'grip'], aero: ['aero', 'aero'], racePace: ['race pace', 'racetempo'], tyreManagement: ['tyre management', 'bandenbeheer'], dirtyAir: ['dirty air', 'vuile lucht'], overtaking: ['overtaking', 'inhalen'], reliability: ['reliability', 'betrouwbaarheid'] };
      const an = k => (AN[k] || [k, k])[nl ? 1 : 0];
      const sg = g => (g > 0 ? '+' : '') + (nl ? String(g).replace('.', ',') : g);
      out.push(fill(w.dHead, { S: v.season }), fill(w.dSub, { C: md(v.category || ''), W: v.week }), '');
      if (v.best) out.push(fill(w.dBest, { P: '**' + name(v.best, nl) + '**', K: 'P' + v.best.carRank, N: v.of }));
      if (v.fastest && v.fastest.gain > 0 && v.fastest !== v.best) out.push(fill(w.dFast, { P: name(v.fastest, nl), G: sg(v.fastest.gain) }));
      out.push('');
      v.rows.forEach((r, k) => out.push(fill(w.dRow, { K: k + 1, P: name(r, nl), R: r.carRank || '–', N: v.of, G: sg(r.gain), U: r.ok + r.bad ? fill(w.dUp, { O: r.ok, B: r.bad }) : '', S: r.strong ? an(r.strong.key) : '–', Wk: r.weak ? an(r.weak.key) : '–',
        Bz: r.busy.length ? fill(w.dBusy, { L: r.busy.map(b => an(b.key)).join(', ') }) : '' })));
    } else if (kind === 'mpgrid') {
      out.push(fill(w.gHead, { S: v.season }), fill(w.gSub, { C: md(v.category || ''), R: md(v.race || '–') }), '');
      if (v.topDriver) out.push(fill(w.gTop, { D: '**' + md(v.topDriver.name) + '**', P: v.topDriver.player ? md(v.topDriver.player) : md(v.topDriver.team), X: v.topDriver.pos }));
      if (v.winner && v.race) out.push(fill(w.gWin, { R: md(v.race), P: name(v.winner, nl), N: v.winner.last.stops }));
      if (v.split) out.push(fill(w.gSplit, { A: name(v.split.few, nl), X: v.split.few.last.stops, B: name(v.split.many, nl), Y: v.split.many.last.stops }));
      out.push('');
      v.rows.forEach(r => out.push(fill(w.gRow, { P: name(r, nl), D: r.drivers.map(d => md(d.name) + ' P' + (d.pos || '–')).join(', '),
        L: r.last && r.last.stops != null ? fill(w.gLast, { X: r.last.pos != null ? 'P' + r.last.pos : 'DNF', S: r.last.start || '–', N: r.last.stops }) : '' })));
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 2000);
  }
  return { KINDS, view, text, base };
});
