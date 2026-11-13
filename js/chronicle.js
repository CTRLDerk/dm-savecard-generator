/* DM Save Card — chronicle: the running history of one career.
   A save file is a snapshot without history. After every save the tool takes a compact snapshot,
   compares it with the previous one and writes what changed as events into a journal
   (per save slot, kept by the local server or in the browser). Episodes and the storyline card
   are built from that journal. Plain save data only, no game-engine logic. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./save.js'), require('./views.js'));
  else root.DMChronicle = factory(root.DMSave, root.DMViews);
})(typeof self !== 'undefined' ? self : this, function (S, V) {
  'use strict';
  const VERSION = 1;
  const MAX_EVENTS = 1500;
  const num = S.num, short = S.shortName;
  const safe = fn => { try { return fn(); } catch (e) { return null; } };

  // ------------------------------------------------------------ snapshot
  // Everything later steps need, small enough to keep one per journal.
  function snapshot(files, s) {
    const f = s && s.focus;
    if (!f) return null;
    const season = files.season || {};
    const teams = (files.teams && files.teams.teams) || [];
    const dfile = files.drivers || {};
    const allDrivers = (dfile.drivers || []).concat(dfile.reserveDrivers || []);
    const driverById = new Map(allDrivers.map(d => [d.id, d]));
    const champ = safe(() => V.championship(files, s));
    const rnd = safe(() => V.rnd(files, s));
    const pad = safe(() => V.paddock(files, s));

    // Every race of this season: our cars, winner, pole; standings after each round.
    const cal = s.rounds.list;
    const results = (season.raceResults || []).filter(r => r.season == null || r.season === s.season).slice().sort((a, b) => a.week - b.week);
    const used = new Set(), cum = new Map(), races = [];
    results.forEach((r, i) => {
      let c = cal.find(x => x.week === r.week && !used.has(x.round)) || cal.find(x => !used.has(x.round) && x.name === (r.circuit && r.circuit.name));
      if (c) used.add(c.round);
      const cars = S.carsOf(r);
      for (const [id, p] of Object.entries(r.teamPoints || {})) cum.set(+id, (cum.get(+id) || 0) + (num(p) || 0));
      for (const [id, p] of Object.entries(r.sprintTeamPoints || {})) cum.set(+id, (cum.get(+id) || 0) + (num(p) || 0));
      const table = teams.map(t => ({ id: t.id, p: cum.get(t.id) || 0 })).sort((a, b) => b.p - a.p);
      table.forEach((x, k) => { x.pos = k > 0 && table[k - 1].p === x.p ? table[k - 1].pos : k + 1; });
      const me = table.find(x => x.id === f.id);
      const winner = cars.find(x => x.position === 1 && x.finished) || null;
      const q = (r.qualifying || []).slice().sort((a, b) => a.position - b.position)[0];
      races.push({
        round: c ? c.round : i + 1, week: r.week, name: (r.circuit && r.circuit.name) || (c && c.name) || '', cc: (c && c.cc) || '',
        mine: cars.filter(x => x.teamId === f.id).map(x => ({ pos: x.finished ? x.position : null, start: x.start, finished: x.finished,
          label: x.finished ? 'P' + x.position : (/DSQ/i.test(x.status) ? 'DSQ' : 'DNF'), drivers: x.drivers, stops: x.pitStops })),
        winner: winner ? { teamId: winner.teamId, team: short(winner.team), drivers: winner.drivers } : null,
        pole: q && q.teamId != null ? q.teamId : (cars.find(x => x.start === 1) || {}).teamId ?? null,
        cars: cars.length,
        standing: me ? { pos: me.pos, points: +me.p.toFixed(2) } : null,
        leader: table[0] ? { id: table[0].id, points: +table[0].p.toFixed(2) } : null
      });
    });

    // Our people: race drivers and reserves, with what the save keeps about them.
    const me = teams.find(t => t.id === f.id) || {};
    const seats = (me.pilots || []).map(p => ({ id: p.id, role: 'driver', until: num(p.contract) }))
      .concat((me.reserves || []).map(p => ({ id: p.id, role: 'reserve', until: num(p.contract) })));
    if (!seats.length) for (const d of allDrivers) if (d.teamId === f.id && !d.retired) seats.push({ id: d.id, role: 'driver', until: num(d.contractEndYear) });
    const standing = new Map(s.drivers.map(d => [d.id, d]));
    const people = seats.map(x => {
      const d = driverById.get(x.id) || {};
      const st = standing.get(x.id) || {};
      return { id: x.id, name: d.name || '', role: x.role, until: x.until, age: num(d.age), level: num(d.level), potential: num(d.potential),
        morale: num(d.morale), careerWins: num(d.careerWins), titles: num(d.championships), injured: !!d.injured,
        pos: st.pos ?? null, points: st.points ?? null, wins: st.wins ?? null, face: d.image || null,
        traits: traitsOf(d), rivals: relationsOf(d, driverById, 'low'), friends: relationsOf(d, driverById, 'high') };
    }).filter(p => p.name);

    // This season's upgrades (all of them, oldest first).
    const upgrades = (me.recentDevelopmentResults || []).filter(r => r.season == null || r.season === s.season)
      .map(r => ({ week: num(r.week), key: r.perfType, name: r.perfName || r.perfType, success: !!r.isSuccess, from: num(r.oldValue), to: num(r.newValue), risk: r.riskLevel || null }))
      .sort((a, b) => (a.week || 0) - (b.week || 0));

    const myChamp = champ ? champ.teams.find(t => t.mine) : null;
    return {
      v: VERSION, at: s.savedAt || null, mod: s.mod || null, category: s.category || null, mode: s.mode,
      season: s.season, week: s.week, round: s.rounds.done, total: s.rounds.total, finished: !!s.finished, preseason: !!s.preseason,
      calendar: cal.map(c => ({ round: c.round, name: c.name, cc: c.cc, week: c.week })),
      team: { id: f.id, name: f.name, short: f.short, color: f.color, logo: f.logo || null, pos: f.pos, tied: !!f.tied, points: f.points,
        wins: f.wins, podiums: f.podiums, poles: f.poles, dnf: f.dnf, best: f.best, expected: f.expected,
        gapAhead: f.gapAhead, ahead: f.ahead, gapBehind: f.gapBehind, behind: f.behind, leaderGap: f.leaderGap, role: f.role,
      career: f.career ? { titles: f.career.titles, past: f.career.past } : null },
      field: s.teams.map(t => ({ id: t.id, short: t.short, color: t.color, pos: t.pos, points: t.points, wins: t.wins })),
      leaderDriver: s.drivers[0] ? { id: s.drivers[0].id, name: s.drivers[0].name, teamId: s.drivers[0].teamId, points: s.drivers[0].points } : null,
      races,
      next: s.next ? { round: s.next.round, name: s.next.name, cc: s.next.cc, week: s.next.week } : null,
      champ: champ ? { left: champ.left, maxTeam: champ.maxTeam, maxDriver: champ.maxDriver, contenders: champ.contenders,
        alive: myChamp ? myChamp.alive : null, clinched: !!(myChamp && myChamp.pos === 1 && !champ.preseason && champ.teams[1] && myChamp.points - champ.teams[1].points > champ.maxTeam) } : null,
      rnd: rnd ? { done: rnd.done, successes: rnd.successes, upgrades, inProgress: rnd.inProgress.map(d => ({ key: d.key, name: d.name, ready: d.ready })),
        attrs: rnd.attrs.map(a => ({ key: a.key, label: a.label, nl: a.nl, rank: a.rank, of: a.of })), gainRank: rnd.myGainRank, fieldSize: rnd.fieldSize } : null,
      paddock: pad ? { items: pad.items, contracts: pad.contracts.map(c => ({ name: c.name, role: c.role, until: c.until, staff: !!c.staff })),
        ending: pad.ending.map(c => ({ name: c.name, role: c.role, staff: !!c.staff })), injured: pad.injured } : null,
      people
    };
  }

  // Traits / passives as plain names, whatever shape the save uses (optional field).
  function traitsOf(d) {
    const raw = d.traits || d.passives || d.characteristics || d.passiveTraits || null;
    if (!raw) return [];
    const list = Array.isArray(raw) ? raw : typeof raw === 'object' ? Object.keys(raw).filter(k => raw[k]) : [raw];
    return list.map(t => typeof t === 'string' ? t : t && (t.name || t.label || t.id || t.key)).filter(Boolean).map(String).slice(0, 8);
  }
  // Relations 0–10 per other driver (5 = neutral): names of the worst (≤ 2) or best (≥ 8) ones (optional field).
  function relationsOf(d, byId, side) {
    const rel = d.relations;
    if (!rel || typeof rel !== 'object') return [];
    const pairs = Array.isArray(rel) ? rel.map(r => [r.driverId ?? r.id, num(r.value ?? r.relation)]) : Object.entries(rel).map(([k, v]) => [isNaN(+k) ? k : +k, num(v)]);
    return pairs.filter(([, v]) => v != null && (side === 'low' ? v <= 2 : v >= 8))
      .sort((a, b) => (side === 'low' ? a[1] - b[1] : b[1] - a[1]))
      .map(([id]) => (byId.get(id) || {}).name).filter(Boolean).slice(0, 3);
  }

  // ------------------------------------------------------------ diff → events
  const ev = (snap, type, data, key) => Object.assign({ id: [type, snap.season, snap.round, key == null ? '' : key].join('|'), type,
    season: snap.season, round: snap.round, week: snap.week }, data || {});

  function raceEvent(snap, r, detailed) {
    const best = r.mine.slice().sort((a, b) => (a.finished === b.finished ? (a.pos || 99) - (b.pos || 99) : a.finished ? -1 : 1))[0] || null;
    return Object.assign(ev(snap, 'race', {
      round: r.round, week: r.week, name: r.name, cc: r.cc, detailed: !!detailed,
      pos: best ? best.pos : null, start: best ? best.start : null, finished: best ? best.finished : null, label: best ? best.label : null,
      gain: best && best.finished && best.start != null ? best.start - best.pos : null, drivers: best ? best.drivers : [],
      cars: r.mine.map(m => ({ pos: m.pos, start: m.start, finished: m.finished, label: m.label, drivers: m.drivers })),
      winner: r.winner, won: !!(r.winner && r.winner.teamId === snap.team.id), pole: r.pole === snap.team.id,
      standing: r.standing
    }, 'r' + r.round), { id: ['race', snap.season, r.round].join('|') });
  }

  function diff(prev, cur) {
    const out = [];
    if (!cur) return out;
    const T = cur.team;
    const fresh = !prev || prev.season !== cur.season;

    if (!prev) out.push(ev(cur, 'start', { team: T.short, pos: T.pos, points: T.points, preseason: cur.preseason }));
    if (prev && prev.season !== cur.season) {
      if (!prev.finished) out.push(Object.assign(ev(prev, 'season_end', seasonFinal(prev)), { id: ['season_end', prev.season].join('|') }));
      out.push(Object.assign(ev(cur, 'season_start', { expected: T.expected, people: cur.people.filter(p => p.role === 'driver').map(p => p.name) }), { id: ['season_start', cur.season].join('|') }));
    }

    // Races since the previous snapshot (all of them on a first look).
    const before = fresh ? 0 : prev.round;
    const newRaces = cur.races.filter(r => r.round > before);
    newRaces.forEach((r, i) => out.push(raceEvent(cur, r, i === newRaces.length - 1)));

    if (prev && !fresh) {
      if (!prev.finished && cur.finished) out.push(Object.assign(ev(cur, 'season_end', seasonFinal(cur)), { id: ['season_end', cur.season].join('|') }));
      const P = prev.team;
      // Standings
      if (P.pos != null && T.pos != null && P.pos !== T.pos) out.push(ev(cur, 'standing', { from: P.pos, to: T.pos, points: T.points }, P.pos + '>' + T.pos));
      if (P.pos !== 1 && T.pos === 1 && !cur.preseason) out.push(ev(cur, 'lead', { taken: true, from: P.pos }));
      if (P.pos === 1 && T.pos > 1) out.push(ev(cur, 'lead', { taken: false, to: T.pos, by: (cur.field[0] || {}).short }));
      // Rivals: who did we pass, who passed us
      const was = id => (prev.field.find(x => x.id === id) || {}).pos;
      for (const t of cur.field) {
        if (t.id === T.id || was(t.id) == null || P.pos == null || T.pos == null) continue;
        if (was(t.id) < P.pos && t.pos > T.pos) out.push(ev(cur, 'pass', { up: true, team: t.short, teamId: t.id, gap: +(T.points - t.points).toFixed(2), to: T.pos }, 'up' + t.id));
        if (was(t.id) > P.pos && t.pos < T.pos) out.push(ev(cur, 'pass', { up: false, team: t.short, teamId: t.id, gap: +(t.points - T.points).toFixed(2), to: T.pos }, 'down' + t.id));
      }
      // Target from the board
      const ts = x => (x.expected && x.pos ? (x.pos < x.expected ? 'ahead' : x.pos === x.expected ? 'on' : 'behind') : null);
      if (ts(P) && ts(T) && ts(P) !== ts(T) && !cur.preseason) out.push(ev(cur, 'target', { from: ts(P), to: ts(T), expected: T.expected }, ts(T)));
      // Title chances
      if (prev.champ && cur.champ) {
        if (prev.champ.alive && cur.champ.alive === false) out.push(ev(cur, 'eliminated', { left: cur.champ.left }));
        if (!prev.champ.clinched && cur.champ.clinched) out.push(ev(cur, 'clinch', { left: cur.champ.left }));
      }
      // Season firsts
      for (const k of ['wins', 'podiums', 'poles']) if (!P[k] && T[k] > 0) out.push(ev(cur, 'first', { what: k }, k));
      // People: career wins, milestones, morale, injuries, rivalries
      for (const p of cur.people) {
        const o = prev.people.find(x => x.id === p.id);
        if (!o) continue;
        if (o.careerWins != null && p.careerWins != null && p.careerWins > o.careerWins) {
          if (o.careerWins === 0) out.push(ev(cur, 'career_first', { name: p.name }, p.id));
          const m = [5, 10, 25, 50, 100].find(x => o.careerWins < x && p.careerWins >= x);
          if (m) out.push(ev(cur, 'milestone', { name: p.name, wins: m }, p.id + '-' + m));
        }
        if (o.morale != null && p.morale != null) {
          const scale = Math.max(10, o.morale, p.morale) > 10 ? 100 : 10;
          if (Math.abs(p.morale - o.morale) >= scale * 0.2) out.push(ev(cur, 'morale', { name: p.name, up: p.morale > o.morale, word: moodWord(p.morale, scale) }, p.id));
        }
        if (!o.injured && p.injured) out.push(ev(cur, 'injury', { name: p.name, weeks: ((cur.paddock && cur.paddock.injured) || []).find(x => x.name === p.name)?.weeks ?? null }, p.id));
        for (const r of p.rivals) if (!o.rivals.includes(r)) out.push(ev(cur, 'rivalry', { name: p.name, other: r }, p.id + '-' + r));
      }
      // Contracts: signings, departures, extensions (race drivers and reserves)
      const pc = new Map(prev.people.map(p => [p.name, p])), cc = new Map(cur.people.map(p => [p.name, p]));
      for (const [n, p] of cc) if (!pc.has(n)) out.push(ev(cur, 'signing', { name: n, role: p.role, until: p.until }, n));
      for (const [n, p] of pc) if (!cc.has(n)) out.push(ev(cur, 'departure', { name: n, role: p.role }, n));
      for (const [n, p] of cc) { const o = pc.get(n); if (o && o.until != null && p.until != null && p.until > o.until) out.push(ev(cur, 'extension', { name: n, role: p.role, until: p.until }, n + p.until)); }
      // Factory
      if (prev.rnd && cur.rnd) {
        const seen = new Set(prev.rnd.upgrades.map(u => u.week + '|' + u.key + '|' + u.success));
        for (const u of cur.rnd.upgrades) if (!seen.has(u.week + '|' + u.key + '|' + u.success)) {
          const rankNow = (cur.rnd.attrs.find(a => a.key === u.key) || {}).rank, rankWas = (prev.rnd.attrs.find(a => a.key === u.key) || {}).rank;
          out.push(ev(cur, 'upgrade', { key: u.key, name: u.name, success: u.success, from: u.from, to: u.to, rank: rankNow ?? null, rankWas: rankWas ?? null,
            of: (cur.rnd.attrs.find(a => a.key === u.key) || {}).of ?? null }, u.week + u.key));
        }
        const busy = new Set(prev.rnd.inProgress.map(d => d.key));
        for (const d of cur.rnd.inProgress) if (!busy.has(d.key)) out.push(ev(cur, 'dev_start', { key: d.key, name: d.name, ready: d.ready }, d.key + d.ready));
      }
      // Paddock (protests, stewards, technical checks, testing analyst, rebrands)
      if (prev.paddock && cur.paddock) {
        const k = it => [it.type, it.week, it.by, it.against, it.tip, it.from, (it.failed || []).join(',')].join('|');
        const seen = new Set(prev.paddock.items.map(k));
        for (const it of cur.paddock.items) if (!seen.has(k(it))) out.push(ev(cur, 'paddock', { item: it }, k(it)));
      }
    } else {
      // First look at this season (a save that is already under way): rebuild what we can as history.
      const bf = (e, round) => Object.assign(e, { backfill: true, round: round == null ? e.round : round });
      if (!prev && T.career && T.career.past) for (const x of T.career.past) out.push(Object.assign(ev(cur, 'season_end', { final: true, pos: x.pos, points: x.points, wins: x.wins, backfill: true }), { id: ['season_end', x.season].join('|'), season: x.season, round: null }));
      let was = null;
      for (const r of cur.races) {
        const st = r.standing; if (!st) continue;
        if (was != null && st.pos !== was) out.push(bf(ev(cur, 'standing', { from: was, to: st.pos, points: st.points }, 'r' + r.round), r.round));
        if (was != null && was !== 1 && st.pos === 1) out.push(bf(ev(cur, 'lead', { taken: true, from: was }, 'r' + r.round), r.round));
        if (was === 1 && st.pos > 1) out.push(bf(ev(cur, 'lead', { taken: false, to: st.pos }, 'r' + r.round), r.round));
        was = st.pos;
      }
      if (cur.rnd) for (const u of cur.rnd.upgrades) {
        const r = (cur.races.filter(x => x.week <= (u.week || 0)).slice(-1)[0] || { round: 0 }).round;
        out.push(bf(ev(cur, 'upgrade', { key: u.key, name: u.name, success: u.success, from: u.from, to: u.to }, u.week + u.key), r));
      }
      if (cur.paddock) for (const it of cur.paddock.items) {
        const r = (cur.races.filter(x => x.week <= (it.week || 0)).slice(-1)[0] || { round: 0 }).round;
        out.push(bf(ev(cur, 'paddock', { item: it }, [it.type, it.week, it.by, it.against].join('|')), r));
      }
    }
    return out;
  }
  function seasonFinal(snap) {
    const T = snap.team;
    return { final: true, pos: T.pos, points: T.points, wins: T.wins, podiums: T.podiums, poles: T.poles, dnf: T.dnf, expected: T.expected,
      champion: snap.field[0] ? { team: snap.field[0].short, mine: snap.field[0].id === T.id } : null, team: T.short };
  }
  const moodWord = (v, scale) => { const x = v / scale; return x < 0.25 ? 'poor' : x < 0.45 ? 'shaky' : x < 0.65 ? 'solid' : x < 0.85 ? 'strong' : 'great'; };

  // ------------------------------------------------------------ journal
  const identity = snap => [snap.mod || '', snap.category || '', snap.team.id].join('|');
  function create(snap, slot) {
    return { v: VERSION, slot: slot || null, key: identity(snap), created: snap.at || new Date().toISOString(),
      team: { id: snap.team.id, name: snap.team.name, short: snap.team.short, color: snap.team.color },
      seq: 0, events: [], chapters: [], seasons: [], last: null };
  }
  // A new playthrough: a fresh journal with a premise (name, goal, drivers to follow, own rules).
  // series = { name, goal: { type: 'title'|'top'|'target'|'custom', seasons, pos, by, text }, focus: [names], rules }
  function restart(snap, slot, series) {
    const j = create(snap, slot);
    j.series = series ? Object.assign({}, series, { startSeason: snap.season, startRound: snap.round, started: new Date().toISOString() }) : null;
    return update(j, snap, slot).journal;
  }

  // Add a snapshot. Returns { journal, added, reset }.
  function update(journal, snap, slot) {
    if (!snap) return { journal, added: [], reset: false };
    let reset = false;
    const stale = j => !j || j.v !== VERSION || j.key !== identity(snap) || (j.last && (snap.season < j.last.season || (snap.season === j.last.season && snap.round < j.last.round)));
    if (stale(journal)) { reset = !!journal; journal = create(snap, slot); }
    const L = journal.last;
    if (L && L.season === snap.season && L.week === snap.week && L.round === snap.round && L.at === snap.at) return { journal, added: [], reset };
    const known = new Set(journal.events.map(e => e.id));
    const added = diff(L, snap).filter(e => !known.has(e.id) && known.add(e.id));
    for (const e of added) e.n = ++journal.seq;
    journal.events.push(...added);
    for (const e of added) if (e.type === 'season_end') {
      journal.seasons = journal.seasons.filter(x => x.season !== e.season).concat([{ season: e.season, pos: e.pos, points: e.points, wins: e.wins, expected: e.expected, champion: e.champion }]);
    }
    if (journal.events.length > MAX_EVENTS) journal.events = journal.events.slice(-MAX_EVENTS);
    journal.last = snap;
    journal.team = { id: snap.team.id, name: snap.team.name, short: snap.team.short, color: snap.team.color };
    return { journal, added, reset };
  }

  // Events of one season, or since the last saved chapter.
  function eventsSince(journal, scope, saved) {
    const L = journal.last; if (!L) return [];
    const evs = journal.events;
    if (scope === 'season') return evs.filter(e => e.season === L.season);
    if (scope === 'race') { const r = L.round; return evs.filter(e => e.season === L.season && e.round === r); }
    // A chapter that is already saved: show the events it was written from again.
    if (saved) {
      const before = journal.chapters.filter(c => c !== saved && (c.upto || 0) < (saved.upto || 0)).map(c => c.upto || 0);
      const from = before.length ? Math.max(...before) : 0;
      const list = evs.filter(e => e.n > from && e.n <= (saved.upto || 0));
      return from ? list : list.filter(e => e.season === saved.season);
    }
    const ch = journal.chapters[journal.chapters.length - 1];
    if (!ch) return evs.filter(e => e.season === L.season);
    return evs.filter(e => e.n > (ch.upto || 0));
  }

  // Save a chapter (the text as it was posted). Replaces a chapter of the same round.
  function addChapter(journal, ch) {
    const L = journal.last || {};
    const entry = Object.assign({ season: L.season, round: L.round, week: L.week, at: new Date().toISOString(), upto: journal.seq }, ch);
    const same = journal.chapters.findIndex(c => c.season === entry.season && c.round === entry.round && (c.kind || 'chapter') === (entry.kind || 'chapter'));
    if (same >= 0) { entry.no = journal.chapters[same].no; journal.chapters[same] = entry; }
    else { entry.no = entry.kind === 'prologue' ? 0 : journal.chapters.length ? journal.chapters[journal.chapters.length - 1].no + 1 : 1; journal.chapters.push(entry); }
    return entry;
  }

  return { VERSION, snapshot, diff, update, create, restart, eventsSince, addChapter, identity };
});
