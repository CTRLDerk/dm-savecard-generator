/* DM Save Card — five extra post types for a playthrough rhythm:
   raceweek preview · "here we go" (signings, extensions, departures) · teammate duel ·
   development race · season wrapped. Data from the save and the journal; text in EN/NL.
   Ratings are shown as words, never as numbers. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./save.js'), require('./views.js'), require('./text.js'));
  else root.DMExtra = factory(root.DMSave, root.DMViews, root.DMText);
})(typeof self !== 'undefined' ? self : this, function (S, V, T) {
  'use strict';
  const num = S.num, short = S.shortName;
  const KINDS = ['stretch', 'preview', 'transfer', 'duel', 'devrace', 'wrapped'];
  const WORDS = { en: ['Poor', 'Shaky', 'Solid', 'Strong', 'World-class'], nl: ['Zwak', 'Wankel', 'Degelijk', 'Sterk', 'Wereldklasse'] };
  const rankWord = (rank, of) => { const x = of > 1 ? (rank - 1) / (of - 1) : 0; return x <= 0.1 ? 4 : x <= 0.3 ? 3 : x <= 0.6 ? 2 : x <= 0.85 ? 1 : 0; };
  const levelWord = l => (l == null ? null : l < 4 ? 0 : l < 5.5 ? 1 : l < 7 ? 2 : l < 8.5 ? 3 : 4);
  const allDrivers = files => ((files.drivers || {}).drivers || []).concat((files.drivers || {}).reserveDrivers || []);
  const best = cars => cars.slice().sort((a, b) => (a.finished === b.finished ? (a.position || 99) - (b.position || 99) : a.finished ? -1 : 1))[0] || null;

  // Races of this season with their round number from the calendar.
  function seasonRaces(files, s) {
    const cal = s.rounds.list, used = new Set();
    return ((files.season || {}).raceResults || []).filter(r => r.season == null || r.season === s.season).slice().sort((a, b) => a.week - b.week).map((r, i) => {
      const c = cal.find(x => x.week === r.week && !used.has(x.round)) || cal.find(x => !used.has(x.round) && x.name === (r.circuit && r.circuit.name));
      if (c) used.add(c.round);
      return { round: c ? c.round : i + 1, name: (r.circuit && r.circuit.name) || (c && c.name) || '', cc: (c && c.cc) || '', raw: r, cars: S.carsOf(r) };
    });
  }

  // ------------------------------------------------------------ 0. race summary (a stretch of races, from–to)
  // For long calendars (NASCAR): the stretch in one card, with the races worth telling picked out.
  function stretch(files, s, from, to) {
    const f = s.focus; if (!f) return null;
    const all = seasonRaces(files, s);
    const done = all.map(r => r.round);
    if (!done.length) return { kind: 'stretch', empty: true, team: f.short, color: f.color, season: s.season, category: s.category, rounds: [] };
    let a = +from || Math.max(1, done[done.length - 1] - 4), b = +to || done[done.length - 1];
    if (a > b) [a, b] = [b, a];
    const last = done[done.length - 1];
    a = Math.max(done[0], Math.min(a, last)); b = Math.max(done[0], Math.min(b, last));
    // Standings per round (cumulative team points) to show where the stretch took us.
    const teams = (files.teams && files.teams.teams) || [];
    const cum = new Map(), table = [];
    for (const r of all) {
      for (const [id, p] of Object.entries(r.raw.teamPoints || {})) cum.set(+id, (cum.get(+id) || 0) + (num(p) || 0));
      for (const [id, p] of Object.entries(r.raw.sprintTeamPoints || {})) cum.set(+id, (cum.get(+id) || 0) + (num(p) || 0));
      const t = teams.map(x => ({ id: x.id, p: cum.get(x.id) || 0 })).sort((x, y) => y.p - x.p);
      t.forEach((x, i) => { x.pos = i > 0 && t[i - 1].p === x.p ? t[i - 1].pos : i + 1; });
      const me = t.find(x => x.id === f.id) || {};
      table.push({ round: r.round, pos: me.pos ?? null, points: me.p ?? 0 });
    }
    const before = table.filter(x => x.round < a).slice(-1)[0] || null, after = table.filter(x => x.round <= b).slice(-1)[0] || null;
    const races = all.filter(r => r.round >= a && r.round <= b).map(r => {
      const mine = r.cars.filter(c => c.teamId === f.id), bb = best(mine);
      const pts = num((r.raw.teamPoints || {})[f.id]) || 0;
      const fin = bb && bb.finished, pos = fin ? bb.position : null, gain = fin && bb.start ? bb.start - bb.position : null;
      const out = mine.filter(c => !c.finished);
      const outFront = out.filter(c => c.start && c.start <= 10).sort((x, y) => x.start - y.start)[0] || null;
      const winner = r.cars.find(c => c.position === 1 && c.finished);
      // How much this race is worth telling.
      let score = 0, why = null;
      if (pos === 1) { score = 10; why = 'win'; }
      else if (pos != null && pos <= 3) { score = 6; why = 'podium'; }
      if (outFront && score < 5) { score = 5 + (10 - outFront.start) / 3; why = 'dnf'; }
      if (gain != null && gain >= 5 && score < 3 + gain / 2) { score = 3 + gain / 2; why = 'climb'; }
      if (gain != null && gain <= -5 && score < 3) { score = 3; why = 'drop'; }
      if (pos != null && pos <= 5 && score < 3) { score = 3; why = 'top5'; }
      const pole = (r.raw.qualifying || []).slice().sort((x, y) => x.position - y.position)[0];
      if (pole && pole.teamId === f.id && score < 2) { score = 2; why = 'pole'; }
      return { round: r.round, name: r.name, cc: r.cc, pos, start: bb ? bb.start : null, gain, label: bb ? (fin ? 'P' + pos : 'DNF') : '–', cars: mine.length,
        dnf: out.length, outFront: outFront ? { start: outFront.start, drivers: outFront.drivers } : null, drivers: bb ? bb.drivers : [], points: pts,
        winner: winner ? { team: short(winner.team), mine: winner.teamId === f.id } : null, score: +score.toFixed(2), why,
        show: why === 'dnf' ? 'DNF' : bb ? (fin ? 'P' + pos : 'DNF') : '–' };
    });
    const fins = races.filter(r => r.pos != null);
    const pick = races.filter(r => r.score > 0).slice().sort((x, y) => y.score - x.score || x.round - y.round).slice(0, 3).sort((x, y) => x.round - y.round);
    const low = races.filter(r => r.why === 'dnf' || r.why === 'drop').sort((x, y) => y.score - x.score)[0] || null;
    return { kind: 'stretch', season: s.season, category: s.category, team: f.short, color: f.color, from: a, to: b,
      rounds: all.map(r => ({ round: r.round, name: r.name })), races, highlights: pick, low,
      wins: races.filter(r => r.pos === 1).length, podiums: races.filter(r => r.pos != null && r.pos <= 3).length, top5: races.filter(r => r.pos != null && r.pos <= 5).length,
      top10: races.filter(r => r.pos != null && r.pos <= 10).length, dnfs: races.reduce((n, r) => n + r.dnf, 0), points: +races.reduce((n, r) => n + r.points, 0).toFixed(1),
      avg: fins.length ? +(fins.reduce((n, r) => n + r.pos, 0) / fins.length).toFixed(1) : null,
      startPos: before ? before.pos : null, endPos: after ? after.pos : null, endPoints: after ? after.points : null,
      trend: table.filter(x => x.round >= a - 1 && x.round <= b), field: teams.length,
      fromName: (races[0] || {}).name || '', toName: (races[races.length - 1] || {}).name || '' };
  }

  // ------------------------------------------------------------ 1. raceweek preview
  function preview(files, s, journal) {
    const f = s.focus; if (!f) return null;
    const nx = s.next;
    const races = seasonRaces(files, s);
    const form = races.slice(-5).map(r => { const b = best(r.cars.filter(c => c.teamId === f.id)); return { round: r.round, cc: r.cc, pos: b && b.finished ? b.position : null, label: b ? (b.finished ? 'P' + b.position : 'DNF') : '–' }; });
    // Earlier visits to this circuit, from the journal (previous seasons of this playthrough).
    const here = nx && journal ? (journal.events || []).filter(e => e.type === 'race' && e.name === nx.name && e.season < s.season).sort((a, b) => b.season - a.season)
      .map(e => ({ season: e.season, label: e.label, pos: e.pos, won: e.won })) : [];
    const cal = (files.season || {}).circuits || [];
    const c = nx ? cal.find(x => x.name === nx.name && x.week === nx.week) || {} : {};
    const rnd = safe(() => V.rnd(files, s));
    const strong = rnd ? rnd.attrs.slice().sort((a, b) => a.rank - b.rank)[0] : null, weak = rnd ? rnd.attrs.slice().sort((a, b) => b.rank - a.rank)[0] : null;
    const champ = safe(() => V.championship(files, s));
    return { kind: 'preview', season: s.season, category: s.category, team: f.short, color: f.color, logo: f.logo || null,
      next: nx ? { name: nx.name, cc: nx.cc, round: nx.round, total: s.rounds.total, week: nx.week, laps: num(c.laps) || nx.laps || null, sprint: !!nx.sprint, length: num(c.length || c.lengthKm || c.trackLength) } : null,
      pos: f.pos, points: f.points, expected: f.expected, ahead: f.ahead, gapAhead: f.gapAhead, behind: f.behind, gapBehind: f.gapBehind, leaderGap: f.leaderGap,
      form, here, finished: s.finished, preseason: s.preseason,
      left: champ ? champ.left : null, maxTeam: champ ? champ.maxTeam : null, alive: champ ? (champ.teams.find(t => t.mine) || {}).alive : null,
      strong: strong ? { key: strong.key, label: strong.label, nl: strong.nl, w: rankWord(strong.rank, strong.of) } : null,
      weak: weak ? { key: weak.key, label: weak.label, nl: weak.nl, w: rankWord(weak.rank, weak.of) } : null,
      drivers: f.drivers.map(d => ({ name: d.name, pos: d.pos })),
      track: nx ? nx.track || null : null, type: nx ? nx.type || null : null, story: s.story || null, lines: T.story(s, 'en'), linesNl: T.story(s, 'nl') };
  }

  // ------------------------------------------------------------ 2. here we go (signings, extensions, departures)
  // person: name to show (optional). Without it: the latest signing / extension / departure in the journal,
  // else the contract that ends first.
  function transfer(files, s, journal, person) {
    const f = s.focus; if (!f) return null;
    const people = (journal && journal.last && journal.last.people) || [];
    const evs = journal ? (journal.events || []).filter(e => ['signing', 'extension', 'departure'].includes(e.type)) : [];
    let ev = null;
    if (person) ev = evs.filter(e => e.name === person).slice(-1)[0] || null;
    else ev = evs.slice(-1)[0] || null;
    const pad = safe(() => V.paddock(files, s));
    const contracts = pad ? pad.contracts : [];
    let name = person || (ev && ev.name) || null;
    if (!name) { const c = contracts.filter(x => !x.staff).sort((a, b) => (a.until || 9999) - (b.until || 9999))[0]; name = c ? c.name : null; }
    if (!name) return { kind: 'transfer', empty: true, team: f.short, color: f.color, season: s.season, options: [] };
    const d = allDrivers(files).find(x => x.name === name) || {};
    const p = people.find(x => x.name === name) || {};
    const c = contracts.find(x => x.name === name) || {};
    const type = ev && ev.name === name ? ev.type : c.until === s.season ? 'expiring' : 'contract';
    const lw = levelWord(num(d.level));
    // The case for and against keeping this driver, from this season's results only.
    const pro = { en: [], nl: [] }, con = { en: [], nl: [] };
    const add = (o, en, nl) => { o.en.push(en); o.nl.push(nl); };
    if (type === 'expiring' || type === 'contract') {
      const mine = seasonRaces(files, s).map(r => r.cars.filter(c => c.teamId === f.id)), res = [], mates = [];
      for (const cars of mine) for (const c of cars) { const isHim = (c.driverIds || []).includes(d.id) || (c.drivers || []).includes(name); (isHim ? res : mates).push(c); }
      const fin = res.filter(c => c.finished), avg = fin.length ? fin.reduce((a, c) => a + c.position, 0) / fin.length : null;
      const mfin = mates.filter(c => c.finished), mavg = mfin.length ? mfin.reduce((a, c) => a + c.position, 0) / mfin.length : null;
      const row = s.drivers.find(x => x.id === d.id), teamPts = f.drivers.reduce((a, x) => a + (x.points || 0), 0), share = row && teamPts > 0 && f.drivers.length > 1 ? Math.round(100 * row.points / teamPts) : null;
      const age = num(d.age), lvl = num(d.level), pot = num(d.potential), dn = res.length - fin.length;
      if (res.length && fin.length) { const b = Math.min(...fin.map(c => c.position)); if (b <= 5) add(pro, 'Best result this season: P' + b, 'Beste resultaat dit seizoen: P' + b); }
      if (share != null && share >= 55 && mates.length) add(pro, 'Scores ' + share + '% of our driver points', 'Scoort ' + share + '% van onze coureurspunten');
      if (avg != null && mavg != null && avg + 1 <= mavg) add(pro, 'Ahead of the other car on average: P' + avg.toFixed(1) + ' v P' + mavg.toFixed(1), 'Gemiddeld voor de andere auto: P' + avg.toFixed(1).replace('.', ',') + ' om P' + mavg.toFixed(1).replace('.', ','));
      if (pot != null && lvl != null && pot - lvl >= 1 && age != null && age <= 26) add(pro, 'Still improving at ' + age, 'Wordt op ' + age + '-jarige leeftijd nog beter');
      if (res.length >= 3 && dn === 0) add(pro, 'Finished every race started (' + res.length + ')', 'Elke gestarte race uitgereden (' + res.length + ')');
      if (!res.length && s.rounds.done > 0) add(con, 'Has not raced for us this season', 'Reed dit seizoen niet voor ons');
      if (share != null && share <= 35 && mates.length) add(con, 'Scores only ' + share + '% of our driver points', 'Scoort maar ' + share + '% van onze coureurspunten');
      if (avg != null && mavg != null && mavg + 1 <= avg) add(con, 'Behind the other car on average: P' + avg.toFixed(1) + ' v P' + mavg.toFixed(1), 'Gemiddeld achter de andere auto: P' + avg.toFixed(1).replace('.', ',') + ' om P' + mavg.toFixed(1).replace('.', ','));
      if (dn >= 3) add(con, dn + ' retirements this season', dn + ' uitvalbeurten dit seizoen');
      if (age != null && age >= 35) add(con, age + ' years old', age + ' jaar oud');
      if (pot != null && lvl != null && pot - lvl < 0.3 && age != null && age >= 28) add(con, 'Little room left to improve', 'Weinig groei meer te verwachten');
    }
    return { kind: 'transfer', type, pro, con, season: s.season, category: s.category, team: f.short, teamName: f.name, color: f.color, logo: f.logo || null,
      name, face: d.image || null, cc: S.countryCode(d.country || d.nationality, d.flagPath), age: num(d.age), role: (ev && ev.role) || c.role || p.role || 'driver',
      until: (ev && ev.until) || c.until || p.until || null, levelWord: lw, potentialWord: levelWord(num(d.potential)),
      careerWins: num(d.careerWins), titles: num(d.championships), traits: p.traits || [], week: ev ? ev.week : s.week,
      options: Array.from(new Set(people.map(x => x.name).concat(evs.map(e => e.name)))).filter(Boolean) };
  }

  // ------------------------------------------------------------ 3. teammate duel
  function duel(files, s) {
    const f = s.focus; if (!f) return null;
    const races = seasonRaces(files, s);
    // The two drivers who raced most for us this season (a reserve or a driver who never started is no duel).
    const ids = new Map(), starts = new Map();
    for (const r of races) for (const x of r.raw.results || []) if (x.teamId === f.id) { ids.set(x.driverId, x.driverName); starts.set(x.driverId, (starts.get(x.driverId) || 0) + 1); }
    const ranked = s.drivers.filter(d => d.teamId === f.id).sort((a, b) => (a.pos || 99) - (b.pos || 99)).map(d => d.id);
    let pair = races.length ? [...starts.keys()].sort((a, b) => starts.get(b) - starts.get(a) || ranked.indexOf(a) - ranked.indexOf(b)).slice(0, 2) : ranked.slice(0, 2);
    if (pair.length < 2) return { kind: 'duel', empty: true, single: pair.length === 1 ? (ids.get(pair[0]) || '') : null, team: f.short, color: f.color, season: s.season };
    const all = allDrivers(files);
    const side = id => { const d = all.find(x => x.id === id) || {}, st = s.drivers.find(x => x.id === id) || {};
      return { id, name: d.name || ids.get(id) || '', face: d.image || null, cc: S.countryCode(d.country || d.nationality, d.flagPath), pos: st.pos ?? null, points: st.points ?? 0,
        race: 0, quali: 0, best: null, dnf: 0, sum: 0, n: 0, gained: 0, wins: 0, podiums: 0 }; };
    const A = side(pair[0]), B = side(pair[1]);
    const rows = [];
    let sameCar = 0;
    for (const r of races) {
      const a = (r.raw.results || []).find(x => x.driverId === A.id), b = (r.raw.results || []).find(x => x.driverId === B.id);
      const fin = x => !x.status || /RUNNING|FINISH|CLASSIFIED/i.test(x.status);
      if (a && b && a.position === b.position) { sameCar++; continue; }   // endurance: same car, no duel
      for (const [D, x] of [[A, a], [B, b]]) {
        if (!x) continue;   // did not race this round: own stats still count, no head-to-head
        if (fin(x)) { D.n++; D.sum += x.position; D.best = D.best == null ? x.position : Math.min(D.best, x.position); if (x.position === 1) D.wins++; if (x.position <= 3) D.podiums++;
          if (x.startingPosition) D.gained += x.startingPosition - x.position; } else D.dnf++;
      }
      if (!a || !b) { rows.push({ round: r.round, cc: r.cc, winner: null, a: a ? (fin(a) ? 'P' + a.position : 'DNF') : null, b: b ? (fin(b) ? 'P' + b.position : 'DNF') : null }); continue; }
      const ra = fin(a) ? a.position : 999, rb = fin(b) ? b.position : 999;
      const w = ra === rb ? null : ra < rb ? 'A' : 'B';
      if (w === 'A') A.race++; else if (w === 'B') B.race++;
      if (a.startingPosition && b.startingPosition) { if (a.startingPosition < b.startingPosition) A.quali++; else if (b.startingPosition < a.startingPosition) B.quali++; }
      rows.push({ round: r.round, cc: r.cc, winner: w, a: fin(a) ? 'P' + a.position : 'DNF', b: fin(b) ? 'P' + b.position : 'DNF' });
    }
    for (const D of [A, B]) D.avg = D.n ? +(D.sum / D.n).toFixed(1) : null;
    return { kind: 'duel', season: s.season, category: s.category, team: f.short, color: f.color, a: A, b: B, rows, races: races.length, sameCar: sameCar > 0 && rows.every(r => r.winner == null) };
  }

  // ------------------------------------------------------------ 4. development race
  // Car index = average of every attribute as a share of its scale (0–100). Us, the leader, and the teams around us.
  function devrace(files, s) {
    const f = s.focus; if (!f) return null;
    const teams = (files.teams && files.teams.teams) || [];
    const idx = p => { if (!p) return null; let sum = 0, n = 0; for (const [k, , scale] of V.ATTRS) { const v = num(p[k]); if (v != null) { sum += v / scale; n++; } } return n ? +(sum / n * 100).toFixed(2) : null; };
    const line = t => {
      const pts = (t.performanceHistory || []).filter(h => h.season == null || h.season === s.season).map(h => ({ week: num(h.week) || 0, v: idx(h.performance) })).filter(x => x.v != null);
      const now = idx(t.performance);
      if (now != null) pts.push({ week: s.week || (pts.length ? pts[pts.length - 1].week + 1 : 1), v: now });
      const byWeek = new Map(); for (const x of pts.sort((a, b) => a.week - b.week)) byWeek.set(x.week, x.v);
      return [...byWeek].map(([week, v]) => ({ week, v }));
    };
    const st = s.teams;
    const me = st.find(t => t.id === f.id);
    const myIdx = st.indexOf(me);
    const pick = [st[0], st[myIdx - 1], me, st[myIdx + 1]].filter(Boolean).filter((t, i, a) => a.findIndex(x => x.id === t.id) === i).slice(0, 4);
    const series = pick.map(t => { const raw = teams.find(x => x.id === t.id) || {}; const l = line(raw);
      return { id: t.id, team: t.short, color: t.color, mine: t.id === f.id, pos: t.pos, points: l, start: l.length ? l[0].v : null, now: l.length ? l[l.length - 1].v : null }; });
    for (const x of series) x.gain = x.start != null && x.now != null ? +(x.now - x.start).toFixed(2) : null;
    // Field ranking of the car index now and of the gain this season (as words).
    const all = teams.map(t => { const l = line(t); return { id: t.id, now: l.length ? l[l.length - 1].v : null, gain: l.length > 1 ? l[l.length - 1].v - l[0].v : 0 }; }).filter(x => x.now != null);
    const rankOf = (arr, key) => arr.slice().sort((a, b) => b[key] - a[key]).findIndex(x => x.id === f.id) + 1;
    const mine = (teams.find(t => t.id === f.id) || {});
    const ups = (mine.recentDevelopmentResults || []).filter(r => r.season == null || r.season === s.season).map(r => ({ week: num(r.week), name: r.perfName || r.perfType, key: r.perfType, success: !!r.isSuccess }));
    return { kind: 'devrace', season: s.season, week: s.week, category: s.category, team: f.short, color: f.color, series, upgrades: ups,
      budget: num(mine.budget), spending: num(mine.seasonDevSpending),
      carRank: rankOf(all, 'now'), gainRank: rankOf(all, 'gain'), of: all.length, carWord: rankWord(rankOf(all, 'now'), all.length), gainWord: rankWord(rankOf(all, 'gain'), all.length) };
  }

  // ------------------------------------------------------------ 5. season wrapped (slides)
  function wrapped(files, s, journal) {
    const f = s.focus; if (!f) return null;
    const races = seasonRaces(files, s);
    const mine = races.map(r => ({ r, b: best(r.cars.filter(c => c.teamId === f.id)) })).filter(x => x.b);
    const fin = mine.filter(x => x.b.finished);
    const top = fin.slice().sort((a, b) => a.b.position - b.b.position || ((b.b.start || 0) - b.b.position) - ((a.b.start || 0) - a.b.position))[0] || null;
    const climb = fin.filter(x => x.b.start).sort((a, b) => (b.b.start - b.b.position) - (a.b.start - a.b.position))[0] || null;
    const drv = s.drivers.filter(d => d.teamId === f.id).sort((a, b) => b.points - a.points)[0] || null;
    const all = allDrivers(files);
    const dv = devrace(files, s);
    const my = dv ? dv.series.find(x => x.mine) : null;
    const ch = journal ? (journal.chapters || []).filter(c => c.season === s.season) : [];
    const counts = {}; if (journal) for (const e of journal.events.filter(e => e.season === s.season)) counts[e.type] = (counts[e.type] || 0) + 1;
    // races where the team actually scored (team points per race from the save; NASCAR pays every place and stages), else top 10
    const hasPts = mine.some(x => x.r.raw && x.r.raw.teamPoints && Object.keys(x.r.raw.teamPoints).length);
    const pointsRaces = hasPts ? mine.filter(x => (num((x.r.raw.teamPoints || {})[f.id]) || 0) + (num((x.r.raw.sprintTeamPoints || {})[f.id]) || 0) > 0).length : fin.filter(x => x.b.position <= 10).length;
    return { kind: 'wrapped', season: s.season, category: s.category, team: f.short, teamName: f.name, color: f.color, logo: f.logo || null, finished: s.finished,
      pos: f.pos, points: f.points, expected: f.expected, wins: f.wins, podiums: f.podiums, poles: f.poles, dnf: f.dnf, races: mine.length, total: s.rounds.total, pointsRaces,
      best: top ? { name: top.r.name, cc: top.r.cc, pos: top.b.position, start: top.b.start, drivers: top.b.drivers } : null,
      climb: climb && climb.b.start - climb.b.position > 0 ? { name: climb.r.name, gain: climb.b.start - climb.b.position, start: climb.b.start, pos: climb.b.position, drivers: climb.b.drivers } : null,
      driver: drv ? { name: drv.name, points: drv.points, pos: drv.pos, wins: drv.wins, face: (all.find(x => x.id === drv.id) || {}).image || null } : null,
      dev: dv ? { gain: my ? my.gain : null, gainRank: dv.gainRank, of: dv.of, carWord: dv.carWord, upgrades: dv.upgrades.length, worked: dv.upgrades.filter(u => u.success).length } : null,
      story: { chapters: ch.length, firstTitle: ch[0] ? ch[0].title : null, lastTitle: ch.length ? ch[ch.length - 1].title : null, events: counts,
        series: journal && journal.series ? journal.series.name || null : null } };
  }
  const SLIDES = ['intro', 'numbers', 'moment', 'driver', 'factory', 'story'];

  const safe = fn => { try { return fn(); } catch (e) { return null; } };
  function view(kind, files, s, journal, opts) {
    opts = opts || {};
    if (kind === 'stretch') return stretch(files, s, opts.from, opts.to);
    if (kind === 'preview') return preview(files, s, journal);
    if (kind === 'transfer') return transfer(files, s, journal, opts.person);
    if (kind === 'duel') return duel(files, s);
    if (kind === 'devrace') return devrace(files, s);
    if (kind === 'wrapped') return wrapped(files, s, journal);
    return null;
  }

  // ------------------------------------------------------------ text (EN/NL)
  const md = x => String(x == null ? '' : x).replace(/([\\*_~`|>])/g, '\\$1').replace(/@/g, '@\u200b');
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
  const TX = {
    en: {
      stretch: { head: '**Rounds {A}–{B} in short · {T}**', sub: '-# {S} · {N} races, {F} to {L}', nums: '{W} · {PD} · {T5} · {DN} · {X} points.', move: 'Standings: {M}.', up: 'up from P{F} to P{T}', down: 'down from P{F} to P{T}', same: 'still P{T}', avg: 'Average finish P{A}.',
        hl: 'Worth telling', why: { win: 'win', podium: 'podium', dnf: 'out from P{S}', climb: 'from P{S}, +{G}', drop: 'from P{S} to P{P}', top5: 'top 5', pole: 'pole' }, pl: { win: ['win', 'wins'], pod: ['podium', 'podiums'], t5: ['top 5', 'top 5s'], dnf: ['DNF', 'DNFs'] } },
      preview: { head: '**Raceweek: {C}**', sub: '-# {S} · round {R} of {N}{SP}', form: 'Form: {F}.', stand: 'We are P{P} with {X} points{G}.', here: 'Last time here: {H}.', never: 'First visit to {C} in this playthrough.',
        car: 'Our car: {A} is {AW}, {B} is {BW}.', aim: 'Board target P{E}.', title: 'Title: {X} points behind with {L} rounds left.', ask: 'Where do we finish? Vote with a reaction.', sprint: ' · sprint weekend' },
      transfer: { signing: '**HERE WE GO!** {D} joins {T}', extension: '**HERE WE GO!** {D} stays at {T}', departure: '**Goodbye, {D}**', expiring: '**Contract watch: {D}**', contract: '**{D}**',
        until: 'Contract until {U}.', role: 'Role: {R}.', facts: '{A} years old · level: {L}{P}.', wins: 'Career: {W} wins{T}.', traits: 'Known as: {X}.', leaving: '{D} leaves {T}.', ends: 'The contract ends after this season. Extend or replace?', ok: 'Done deal.' },
      duel: { head: '**Teammate duel: {A} vs {B}**', race: 'Races: {A} {RA}–{RB} {B}.', quali: 'Qualifying: {QA}–{QB}.', pts: 'Points: {PA} vs {PB}.', best: 'Best result: {BA} vs {BB}.', dnf: 'DNFs: {DA} vs {DB}.', lead: '{X} leads the duel.', level: 'All square.', same: 'Our drivers share one car: no duel this season.' },
      devrace: { head: '**Development race · {S}**', us: 'Our car: {W} in the field (#{R} of {O}).', gain: 'Development this season: {GW} (#{GR} of {O}).', vs: '{T}: {X}.', up: 'gained more than us', down: 'gained less than us', ups: 'Upgrades: {A} of {B} worked.' },
      wrapped: { head: '**{T} · Season {S} Wrapped**', pos: '{F}: P{P} with {X} points{E}.', nums: '{R} races · {W} · {PD} · {PR} in the points.', pl: { win: ['win', 'wins'], pod: ['podium', 'podiums'], times: ['time', 'times'], place: ['place', 'places'] }, best: 'Best moment: {B}.', climb: 'Biggest climb: {G} at {C}.', drv: 'Driver of the year: {D} ({X} points).', dev: 'Factory: {A} of {B} upgrades worked, development {W} in the field.', story: 'The story: {N} chapters, from “{A}” to “{B}”.', final: 'Final standings', now: 'So far' }
    },
    nl: {
      stretch: { head: '**Ronde {A}–{B} in het kort · {T}**', sub: '-# {S} · {N} races, van {F} tot {L}', nums: '{W} · {PD} · {T5} · {DN} · {X} punten.', move: 'Klassement: {M}.', up: 'omhoog van P{F} naar P{T}', down: 'omlaag van P{F} naar P{T}', same: 'nog steeds P{T}', avg: 'Gemiddelde finish P{A}.',
        hl: 'Het vertellen waard', why: { win: 'zege', podium: 'podium', dnf: 'uitgevallen vanaf P{S}', climb: 'vanaf P{S}, +{G}', drop: 'van P{S} naar P{P}', top5: 'top 5', pole: 'pole' }, pl: { win: ['zege', 'zeges'], pod: ['podium', 'podiums'], t5: ['top 5', 'top 5'], dnf: ['uitvaller', 'uitvallers'] } },
      preview: { head: '**Raceweek: {C}**', sub: '-# {S} · ronde {R} van {N}{SP}', form: 'Vorm: {F}.', stand: 'We staan P{P} met {X} punten{G}.', here: 'Vorige keer hier: {H}.', never: 'Eerste bezoek aan {C} in deze playthrough.',
        car: 'Onze auto: {A} is {AW}, {B} is {BW}.', aim: 'Doel van het bestuur: P{E}.', title: 'Titel: {X} punten achter met nog {L} ronden.', ask: 'Waar eindigen we? Stem met een reactie.', sprint: ' · sprintweekend' },
      transfer: { signing: '**HERE WE GO!** {D} komt naar {T}', extension: '**HERE WE GO!** {D} blijft bij {T}', departure: '**Vaarwel, {D}**', expiring: '**Contract loopt af: {D}**', contract: '**{D}**',
        until: 'Contract tot {U}.', role: 'Rol: {R}.', facts: '{A} jaar · niveau: {L}{P}.', wins: 'Carrière: {W} zeges{T}.', traits: 'Bekend als: {X}.', leaving: '{D} verlaat {T}.', ends: 'Het contract loopt af na dit seizoen. Verlengen of vervangen?', ok: 'De deal is rond.' },
      duel: { head: '**Teamgenotenduel: {A} tegen {B}**', race: 'Races: {A} {RA}–{RB} {B}.', quali: 'Kwalificatie: {QA}–{QB}.', pts: 'Punten: {PA} tegen {PB}.', best: 'Beste resultaat: {BA} tegen {BB}.', dnf: 'Uitvallers: {DA} tegen {DB}.', lead: '{X} leidt het duel.', level: 'Gelijkspel.', same: 'Onze coureurs delen één auto: geen duel dit seizoen.' },
      devrace: { head: '**Ontwikkelingsrace · {S}**', us: 'Onze auto: {W} in het veld (#{R} van {O}).', gain: 'Ontwikkeling dit seizoen: {GW} (#{GR} van {O}).', vs: '{T}: {X}.', up: 'ontwikkelde meer dan wij', down: 'ontwikkelde minder dan wij', ups: 'Upgrades: {A} van {B} gelukt.' },
      wrapped: { head: '**{T} · Seizoen {S} Wrapped**', pos: '{F}: P{P} met {X} punten{E}.', nums: '{R} races · {W} · {PD} · {PR} in de punten.', pl: { win: ['zege', 'zeges'], pod: ['podium', 'podiums'], times: ['keer', 'keer'], place: ['plek', 'plekken'] }, best: 'Beste moment: {B}.', climb: 'Grootste inhaalrace: {G} op {C}.', drv: 'Coureur van het jaar: {D} ({X} punten).', dev: 'Fabriek: {A} van {B} upgrades gelukt, ontwikkeling {W} in het veld.', story: 'Het verhaal: {N} hoofdstukken, van “{A}” tot “{B}”.', final: 'Eindstand', now: 'Tot nu toe' }
    }
  };
  const ROLES = { en: { driver: 'race driver', reserve: 'reserve driver' }, nl: { driver: 'racecoureur', reserve: 'reservecoureur' } };

  function text(kind, v, opts) {
    opts = opts || {};
    const lang = TX[opts.lang] ? opts.lang : 'en', t = TX[lang][kind], w = WORDS[lang];
    const n1 = x => { if (x == null) return '–'; const s = Number.isInteger(x) ? String(x) : (+x).toFixed(1); return lang === 'nl' ? s.replace('.', ',') : s; };
    const out = [];
    if (!v) return '';
    if (kind === 'stretch') {
      if (v.empty) return lang === 'nl' ? 'Nog geen races gereden dit seizoen.' : 'No races run yet this season.';
      const pl = (n, a) => n + ' ' + a[n === 1 ? 0 : 1];
      out.push(fill(t.head, { A: v.from, B: v.to, T: md(v.team) }), fill(t.sub, { S: v.category ? md(v.category) + ' ' + v.season : v.season, N: v.races.length, F: md(v.fromName), L: md(v.toName) }), '');
      out.push(fill(t.nums, { W: pl(v.wins, t.pl.win), PD: pl(v.podiums, t.pl.pod), T5: pl(v.top5, t.pl.t5), DN: pl(v.dnfs, t.pl.dnf), X: n1(v.points) }) + (v.avg != null ? ' ' + fill(t.avg, { A: n1(v.avg) }) : ''));
      if (v.endPos != null) out.push(fill(t.move, { M: v.startPos == null || v.startPos === v.endPos ? fill(t.same, { T: v.endPos }) : fill(v.endPos < v.startPos ? t.up : t.down, { F: v.startPos, T: v.endPos }) }));
      if (v.highlights.length) {
        out.push('', '**' + t.hl + '**');
        for (const h of v.highlights) out.push('- R' + h.round + ' ' + md(h.name) + ': **' + h.show + '** (' + fill(t.why[h.why] || '', { S: h.outFront ? h.outFront.start : h.start, G: h.gain, P: h.pos }) + ')');
      }
    } else if (kind === 'preview') {
      if (!v.next) return lang === 'nl' ? 'Geen volgende race: het seizoen zit erop.' : 'No next race: the season is over.';
      out.push(fill(t.head, { C: md(v.next.name) }), fill(t.sub, { S: v.category ? md(v.category) + ' ' + v.season : v.season, R: v.next.round, N: v.next.total, SP: v.next.sprint ? t.sprint : '' }), '');
      if (v.form.length) out.push(fill(t.form, { F: v.form.map(x => x.label).join(' · ') }));
      if (v.pos != null && !v.preseason) out.push(fill(t.stand, { P: v.pos, X: n1(v.points), G: v.pos > 1 && v.ahead ? (lang === 'nl' ? ', ' + n1(v.gapAhead) + ' achter ' : ', ' + n1(v.gapAhead) + ' behind ') + md(v.ahead) : v.behind ? (lang === 'nl' ? ', ' + n1(v.gapBehind) + ' voor ' : ', ' + n1(v.gapBehind) + ' ahead of ') + md(v.behind) : '' }));
      out.push(v.here.length ? fill(t.here, { H: v.here.slice(0, 3).map(h => h.season + ' ' + h.label).join(', ') }) : fill(t.never, { C: md(v.next.name) }));
      if (v.strong && v.weak && v.strong.key !== v.weak.key && v.strong.w !== v.weak.w) out.push(fill(t.car, { A: (lang === 'nl' ? v.strong.nl : v.strong.label).toLowerCase(), AW: w[v.strong.w].toLowerCase(), B: (lang === 'nl' ? v.weak.nl : v.weak.label).toLowerCase(), BW: w[v.weak.w].toLowerCase() }));
      if (v.alive && v.pos > 1 && v.leaderGap != null && v.maxTeam && v.leaderGap <= v.maxTeam / 3) out.push(fill(t.title, { X: n1(v.leaderGap), L: v.left }));
      else if (v.expected) out.push(fill(t.aim, { E: v.expected }));
      out.push('', t.ask);
    } else if (kind === 'transfer') {
      if (v.empty) return lang === 'nl' ? 'Geen contracten of transfers gevonden voor ons team.' : 'No contracts or transfers found for our team.';
      out.push(fill(t[v.type] || t.contract, { D: md(v.name), T: md(v.team) }), '');
      if (v.type === 'departure') out.push(fill(t.leaving, { D: md(v.name), T: md(v.team) }));
      else {
        if (v.until) out.push(fill(t.until, { U: v.until }) + ' ' + fill(t.role, { R: (ROLES[lang][v.role] || v.role) }));
        if (v.age != null || v.levelWord != null) out.push(fill(t.facts, { A: v.age ?? '?', L: v.levelWord != null ? w[v.levelWord].toLowerCase() : '?', P: v.potentialWord != null && v.potentialWord > (v.levelWord ?? -1) ? (lang === 'nl' ? ', potentieel ' : ', potential ') + w[v.potentialWord].toLowerCase() : '' }));
        if (v.careerWins) out.push(fill(t.wins, { W: v.careerWins, T: v.titles ? (lang === 'nl' ? ', ' + v.titles + ' titel' + (v.titles > 1 ? 's' : '') : ', ' + v.titles + ' title' + (v.titles > 1 ? 's' : '')) : '' }));
        if (v.traits.length) out.push(fill(t.traits, { X: md(v.traits.map(x => T.trait(x, lang)).join(', ')) }));
        const pro = (v.pro && v.pro[lang]) || [], con = (v.con && v.con[lang]) || [];
        if (pro.length) out.push('', '**' + (lang === 'nl' ? 'Voor verlengen' : 'The case for') + '**', ...pro.map(x => '- ' + md(x)));
        if (con.length) out.push('', '**' + (lang === 'nl' ? 'Tegen' : 'The case against') + '**', ...con.map(x => '- ' + md(x)));
        out.push('', v.type === 'expiring' ? t.ends : v.type === 'signing' || v.type === 'extension' ? t.ok : '');
      }
    } else if (kind === 'duel') {
      if (v.empty || v.sameCar) return v.sameCar ? t.same : (lang === 'nl' ? 'Geen twee coureurs om te vergelijken.' : 'No two drivers to compare.');
      const A = v.a, B = v.b, sn = n => md(String(n).trim().split(/\s+/).slice(-1)[0]);
      out.push(fill(t.head, { A: md(A.name), B: md(B.name) }), '');
      out.push(fill(t.race, { A: sn(A.name), B: sn(B.name), RA: A.race, RB: B.race }) + ' ' + fill(t.quali, { QA: A.quali, QB: B.quali }));
      out.push(fill(t.pts, { PA: n1(A.points), PB: n1(B.points) }) + ' ' + fill(t.best, { BA: A.best ? 'P' + A.best : '–', BB: B.best ? 'P' + B.best : '–' }) + ' ' + fill(t.dnf, { DA: A.dnf, DB: B.dnf }));
      out.push('', A.race === B.race ? t.level : fill(t.lead, { X: sn(A.race > B.race ? A.name : B.name) }));
    } else if (kind === 'devrace') {
      out.push(fill(t.head, { S: v.season }), '');
      out.push(fill(t.us, { W: w[v.carWord].toLowerCase(), R: v.carRank, O: v.of }) + ' ' + fill(t.gain, { GW: w[v.gainWord].toLowerCase(), GR: v.gainRank, O: v.of }));
      const me = v.series.find(x => x.mine);
      for (const x of v.series.filter(x => !x.mine && x.gain != null && me && me.gain != null)) out.push('- ' + fill(t.vs, { T: md(x.team), X: x.gain > me.gain ? t.up : t.down }));
      if (v.upgrades.length) out.push('', fill(t.ups, { A: v.upgrades.filter(u => u.success).length, B: v.upgrades.length }));
    } else if (kind === 'wrapped') {
      out.push(fill(t.head, { T: md(v.team), S: v.season }), '');
      out.push(fill(t.pos, { F: v.finished ? t.final : t.now, P: v.pos ?? '–', X: n1(v.points), E: v.expected ? (lang === 'nl' ? ' (doel P' : ' (target P') + v.expected + ')' : '' }));
      const pl = (n, a) => n + ' ' + a[n === 1 ? 0 : 1];
      out.push(fill(t.nums, { R: v.races, W: pl(v.wins, t.pl.win), PD: pl(v.podiums, t.pl.pod), PR: pl(v.pointsRaces, t.pl.times) }));
      if (v.best) out.push(fill(t.best, { B: 'P' + v.best.pos + (lang === 'nl' ? ' op ' : ' at ') + md(v.best.name) }));
      if (v.climb && v.climb.gain >= 3) out.push(fill(t.climb, { G: pl(v.climb.gain, t.pl.place), C: md(v.climb.name) }));
      if (v.driver) out.push(fill(t.drv, { D: md(v.driver.name), X: n1(v.driver.points) }));
      if (v.dev && v.dev.upgrades) out.push(fill(t.dev, { A: v.dev.worked, B: v.dev.upgrades, W: w[rankWord(v.dev.gainRank, v.dev.of)].toLowerCase() }));
      if (v.story.chapters > 1) out.push(fill(t.story, { N: v.story.chapters, A: md(v.story.firstTitle), B: md(v.story.lastTitle) }));
      out.push('', '#DeltaManager #Wrapped');
    }
    return T.tidy(out.join('\n').replace(/\n{3,}/g, '\n\n').trim()).slice(0, 2000);
  }

  const TOPIC = {
    stretch: 'Topic: a summary of a stretch of races (rounds from–to) for this team: the totals (wins, podiums, top 5s, DNFs, points, average finish), how the championship position moved over the stretch, and only the races worth telling (in "highlights"); leave the other races out.',
    preview: 'Topic: a raceweek preview for this team before the next race: the circuit, our recent form, where we stand, how we did here before, our car\'s strong and weak point (as words), the board target or title chances. End with a question for the community (e.g. "where do we finish?").',
    transfer: 'Topic: a contract or transfer announcement in the style of a transfer reporter ("Here we go!" for a done signing or extension, a goodbye for a departure, "contract watch" for a contract that ends): who, role, contract length, age, level (as a word), career record.',
    duel: 'Topic: the head-to-head between the two teammates this season: races won against each other, qualifying, points, best result, DNFs, who leads the duel.',
    devrace: 'Topic: the development race: how our car developed this season compared with the leader and the teams around us; ratings only as words (poor, shaky, solid, strong, world-class), never as numbers.',
    wrapped: 'Topic: a "Season Wrapped" year-in-review for this team, like Spotify Wrapped: one big fact per line (final position, races, wins, podiums, best moment, biggest climb, driver of the year, factory, the story in chapters). Personal and celebratory, honest about setbacks.'
  };

  return { KINDS, SLIDES, WORDS, view, text, TOPIC, rankWord, levelWord, preview, transfer, duel, devrace, wrapped };
});
