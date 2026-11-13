/* DM Save Card — extra post types built from the save:
   championship overview, R&D update and paddock news. Plain save data only. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./save.js'));
  else root.DMViews = factory(root.DMSave);
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';
  const num = S.num, short = S.shortName;

  // ------------------------------------------------------------ championship overview
  function championship(files, s) {
    const gp = ((files.config || {}).generalData || {}).gameplay || {};
    const pts = (gp.pointsSystem || [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]).map(Number);
    const sprintPts = (gp.sprintPointsSystem || []).map(Number);
    const qPts = (gp.qualifyingPointsSystem || []).map(Number);
    const fl = num(gp.fastestLapPoint) || 0;
    // Cars per team: most cars one team had in a race (2 in F1, 1 in endurance where a car has 3 drivers).
    const season = files.season || {};
    const results = (season.raceResults || []).filter(r => r.season == null || r.season === s.season);
    let carsPerTeam = 1;
    for (const r of results) {
      const byTeam = {};
      for (const c of S.carsOf(r)) byTeam[c.teamId] = (byTeam[c.teamId] || 0) + 1;
      carsPerTeam = Math.max(carsPerTeam, ...Object.values(byTeam));
    }
    if (!results.length) {
      const rr = gp.raceRules || {};
      carsPerTeam = Math.max(1, Math.round((num(rr.driversPerTeam) || 2) / (num(rr.driversPerCar) || 1)));
    }
    const left = s.rounds.list.filter(r => !r.done);
    const sprintLeft = (season.circuits || []).filter(c => c.eventType !== 'testing' && c.hasSprintWeekend && left.some(l => l.week === c.week)).length;
    const sum = (a, n) => a.slice(0, n).reduce((x, y) => x + y, 0);
    const perRaceTeam = sum(pts, carsPerTeam) + sum(qPts, 1) + fl;
    const perRaceDriver = (pts[0] || 0) + (qPts[0] || 0) + fl;
    const maxTeam = left.length * perRaceTeam + sprintLeft * sum(sprintPts, carsPerTeam);
    const maxDriver = left.length * perRaceDriver + sprintLeft * (sprintPts[0] || 0);

    const leader = s.teams[0];
    const before = s.last && s.last.before;
    // Position before the last race, per team: points minus what that race paid.
    const lastRaw = results.length ? results.slice().sort((a, b) => a.week - b.week)[results.length - 1] : null;
    const paid = id => lastRaw ? (num((lastRaw.teamPoints || {})[id]) || 0) + (num((lastRaw.sprintTeamPoints || {})[id]) || 0) : 0;
    const prev = s.teams.map(t => ({ id: t.id, p: t.points - paid(t.id) })).sort((a, b) => b.p - a.p);
    prev.forEach((r, i) => { r.pos = i > 0 && prev[i - 1].p === r.p ? prev[i - 1].pos : i + 1; });
    const posBefore = id => (results.length > 1 ? (prev.find(r => r.id === id) || {}).pos : null);
    const teams = s.teams.map(t => ({
      pos: t.pos, tied: t.tied, id: t.id, team: t.short, color: t.color, points: t.points, wins: t.wins,
      gap: leader ? +(leader.points - t.points).toFixed(2) : 0,
      move: posBefore(t.id) && t.pos ? posBefore(t.id) - t.pos : 0,
      alive: s.preseason || s.finished ? null : leader ? t.points + maxTeam >= leader.points : true,
      mine: s.focus && t.id === s.focus.id, partner: s.partners.some(p => p.id === t.id)
    }));
    const lastWin = s.last && s.last.winner ? { team: s.last.winner.short, circuit: s.last.name } : null;
    const mostWins = s.teams.slice().sort((a, b) => b.wins - a.wins)[0];
    const leadDriver = s.drivers[0];
    return {
      kind: 'championship', season: s.season, category: s.category, round: s.rounds.done, total: s.rounds.total,
      left: left.length, maxTeam, maxDriver, carsPerTeam, finished: s.finished, preseason: s.preseason,
      teams, drivers: s.drivers.slice(0, 8).map(d => ({ pos: d.pos, tied: d.tied, name: d.name, team: short(d.team), color: d.color, points: d.points, wins: d.wins })),
      contenders: teams.filter(t => t.alive).length,
      leader: leader ? { team: leader.short, points: leader.points, lead: s.teams[1] ? +(leader.points - s.teams[1].points).toFixed(2) : null, second: s.teams[1] ? s.teams[1].short : null } : null,
      leaderDriver: leadDriver ? { name: leadDriver.name, team: short(leadDriver.team), points: leadDriver.points } : null,
      mostWins: mostWins && mostWins.wins ? { team: mostWins.short, wins: mostWins.wins } : null,
      lastWin, next: s.next, focus: s.focus ? { team: s.focus.short, pos: s.focus.pos, points: s.focus.points, before: before ? before.focus : null } : null
    };
  }

  // ------------------------------------------------------------ R&D update
  const ATTRS = [['speed', 'Speed', 100], ['grip', 'Grip', 200], ['aero', 'Aero', 200], ['racePace', 'Race pace', 200],
    ['tyreManagement', 'Tyre management', 200], ['dirtyAir', 'Dirty air', 200], ['overtaking', 'Overtaking', 200], ['reliability', 'Reliability', 100]];
  const NAMES_NL = { speed: 'Topsnelheid', grip: 'Grip', aero: 'Aero', racePace: 'Racetempo', tyreManagement: 'Bandenbeheer', dirtyAir: 'Vuile lucht', overtaking: 'Inhalen', reliability: 'Betrouwbaarheid' };

  function rnd(files, s) {
    const teams = (files.teams && files.teams.teams) || [];
    const f = s.focus; if (!f) return null;
    const me = teams.find(t => t.id === f.id); if (!me) return null;
    const perf = t => t.performance || {};
    const startPerf = t => { const h = (t.performanceHistory || []).filter(x => x.season === s.season).sort((a, b) => a.week - b.week)[0]; return h ? h.performance || {} : null; };
    const attrs = ATTRS.map(([key, label, scale]) => {
      const vals = teams.map(t => ({ id: t.id, team: short(t.name), v: num(perf(t)[key]) })).filter(x => x.v != null).sort((a, b) => b.v - a.v);
      const mine = num(perf(me)[key]);
      const st0 = startPerf(me);
      return { key, label, nl: NAMES_NL[key], scale, value: mine, rank: vals.findIndex(x => x.id === me.id) + 1, of: vals.length,
        best: vals[0] || null, min: vals.length ? vals[vals.length - 1].v : null, avg: vals.length ? vals.reduce((a, b) => a + b.v, 0) / vals.length : null,
        delta: st0 && num(st0[key]) != null && mine != null ? +(mine - num(st0[key])).toFixed(1) : null };
    }).filter(a => a.value != null);
    const res = (me.recentDevelopmentResults || []).filter(r => r.season == null || r.season === s.season).sort((a, b) => b.week - a.week);
    const ok = res.filter(r => r.isSuccess).length;
    const upgrades = res.slice(0, 6).map(r => ({ week: r.week, key: r.perfType, name: r.perfName || r.perfType, success: !!r.isSuccess,
      from: num(r.oldValue), to: num(r.newValue), cost: num(r.cost), risk: r.riskLevel || null }));
    const busy = (me.developmentSlots || []).filter(d => d.status === 'in_progress').map(d => ({ key: d.perfType, name: (ATTRS.find(a => a[0] === d.perfType) || [0, d.perfType])[1],
      ready: num(d.completionWeek), risk: d.riskLevel || null, target: d.developmentType || null }));
    // Field: who improved most this season (sum of attribute gains).
    const gains = teams.map(t => { const a = startPerf(t), b = perf(t); if (!a) return null;
      const g = ATTRS.reduce((sum, [k]) => sum + ((num(b[k]) || 0) - (num(a[k]) || 0)), 0); return { team: short(t.name), gain: +g.toFixed(1), mine: t.id === me.id }; })
      .filter(Boolean).sort((a, b) => b.gain - a.gain);
    const strongest = attrs.slice().sort((a, b) => a.rank - b.rank)[0], weakest = attrs.slice().sort((a, b) => b.rank - a.rank)[0];
    return { kind: 'rnd', season: s.season, week: s.week, category: s.category, team: f.short, name: f.name, color: f.color,
      spending: num(me.seasonDevSpending), budget: num(me.budget),
      attrs, upgrades, inProgress: busy, done: res.length, successes: ok, failures: res.length - ok,
      history: res.slice().reverse().map(r => !!r.isSuccess),
      topGainers: gains.slice(0, 3), myGainRank: gains.findIndex(g => g.mine) + 1 || null, fieldSize: gains.length,
      strongest: strongest ? { label: strongest.label, nl: strongest.nl, rank: strongest.rank } : null,
      weakest: weakest ? { label: weakest.label, nl: weakest.nl, rank: weakest.rank } : null };
  }

  // ------------------------------------------------------------ paddock news (own team only)
  function paddock(files, s) {
    const season = files.season || {}, yr = s.season;
    const teams = (files.teams && files.teams.teams) || [];
    const f = s.focus, fid = f ? f.id : null;
    const me = teams.find(t => t.id === fid) || null;
    const myName = me ? me.name : '';
    const isMe = name => !!myName && (name === myName || short(name) === short(myName));
    const items = [];
    // Protests by or against our team
    for (const p of (season.regulatoryHistory || []).filter(r => r.season === yr && (r.teamId === fid || r.attackerId === fid))) {
      items.push({ type: 'protest', week: num(p.week), by: short(p.attackerName), against: short(p.teamName), ours: p.attackerId === fid,
        upheld: !!p.success, punishment: p.punishment || null });
    }
    // Mails about our team: technical checks, stewards, pre-season tips, name changes
    let checks = 0, failedChecks = [];
    for (const m of season.mails || []) {
      if (m.season != null && m.season !== yr) continue;
      const week = num(m.week) ?? num(m.date), subj = String(m.subject || ''), c = String(m.content || '');
      if (/Technical Verification/i.test(subj)) {
        const team = m.techCheck ? m.techCheck.teamName : subj.split(/ - /).pop().trim();
        if (!(m.techCheck ? m.techCheck.teamId === fid : isMe(team))) continue;
        let drivers = m.techCheck && m.techCheck.drivers;
        if (!drivers) drivers = (c.match(/[^\n]*Verification (passed|failed)/gi) || []).map(l => { const x = /(?:✅|❌|⚠️)?\s*([^:\n]+): Verification (passed|failed)/i.exec(l); return x ? { driverName: x[1].trim(), passed: /passed/i.test(x[2]) } : null; }).filter(Boolean);
        checks++;
        const failed = drivers.filter(d => !d.passed).map(d => d.driverName);
        if (failed.length) failedChecks.push({ type: 'techcheck', week, failed });
      } else if (/stewards/i.test(m.from || '') && /complaint|investigation/i.test(subj + c)) {
        const who = /^(.+?) filed a complaint against (.+?) with the stewards/i.exec(c);
        const against = who ? who[2] : subj.replace(/^Investigation:\s*/i, '');
        if (!isMe(against) && !(who && isMe(who[1]))) continue;
        items.push({ type: 'investigation', week, by: who ? short(who[1]) : null, against: short(against), clean: /no irregularities/i.test(c) });
      } else if (/Pre-season testing analysis/i.test(subj)) {
        const grab = re => { const x = re.exec(c); return x ? x[1].split(/,\s*| and /).map(v => v.replace(/[.\s]+$/, '').trim()) : []; };
        const groups = [['strong', grab(/strongest this season are (.+?)\.\n/i)], ['watch', grab(/\n(.+?) is a team to keep an eye on/i)], ['behind', grab(/seem to be behind: (.+?)\.\n/i)]];
        const hit = groups.find(([, list]) => list.some(isMe));
        if (hit) items.push({ type: 'analyst', week, tip: hit[0], now: f ? f.pos : null });
      } else if (/Team Movements/i.test(subj)) {
        for (const l of c.match(/🔄\s*(.+?) becomes (.+)/g) || []) { const x = /🔄\s*(.+?) becomes (.+)/.exec(l); if (isMe(x[1]) || isMe(x[2])) items.push({ type: 'rebrand', week, from: x[1].trim(), to: x[2].trim() }); }
      }
    }
    items.push(...failedChecks);
    items.sort((a, b) => (b.week || 0) - (a.week || 0));
    // Our contracts: race drivers, reserves and staff
    const dfile = files.drivers || {};
    const allDrivers = (dfile.drivers || []).concat(dfile.reserveDrivers || []);
    const drv = id => allDrivers.find(d => d.id === id) || {};
    const staff = id => (season.staff || []).find(x => x.id === id) || {};
    const contracts = [];
    if (me) {
      for (const [list, role] of [[me.pilots || [], 'driver'], [me.reserves || [], 'reserve']])
        for (const p of list) { const d = drv(p.id); if (d.name) contracts.push({ name: d.name, role, until: num(p.contract), level: num(d.level), age: num(d.age), morale: num(d.morale) }); }
      for (const sl of me.staffSlots || []) { if (sl.id === 'player') continue; const x = staff(sl.id); if (x.name) contracts.push({ name: x.name, role: sl.role, until: num(sl.contract), level: num(x.level), staff: true }); }
    }
    contracts.sort((a, b) => (a.until || 9999) - (b.until || 9999) || (b.level || 0) - (a.level || 0));
    const injured = allDrivers.filter(d => d.injured && d.teamId === fid).map(d => ({ name: d.name, weeks: num(d.injuryWeeksRemaining) }));
    return { kind: 'paddock', season: yr, week: s.week, category: s.category, focusTeam: f ? f.short : null,
      items, checks, failedChecks: failedChecks.length,
      contracts, ending: contracts.filter(c => c.until === yr), injured };
  }


  // ------------------------------------------------------------ race strategy (last race)
  // From the save: grid → finish per car. With the race export: stints, compounds, pit stops and caution periods.
  const FALLBACK_TYRES = [[/soft|tendre|super/i, '#D9343C'], [/medium|medi|moyen/i, '#E2B43C'], [/hard|dur/i, '#F2F4F7'], [/inter/i, '#3BA55C'], [/wet|pluie|rain/i, '#3B82F6']];
  function tyreColors(files) {
    const rr = ((((files.config || {}).generalData || {}).gameplay || {}).raceRules) || {};
    const map = {};
    for (const t of (rr.dryTyres || []).concat(rr.wetTyres || [])) if (t && t.name) map[t.name] = t.color || null;
    return name => {
      if (!name) return '#8E9AAF';
      if (map[name]) return map[name];
      const hit = FALLBACK_TYRES.find(([re]) => re.test(name));
      return hit ? hit[1] : '#8E9AAF';
    };
  }
  function cautions(events, laps) {
    const out = []; let open = null;
    for (const e of events) {
      const t = e.text;
      const kind = /red flag/i.test(t) && !/(resum|restart|lifted)/i.test(t) ? 'red' : /virtual safety car/i.test(t) && !/(end|ending|withdrawn)/i.test(t) ? 'vsc' : /safety car deployed/i.test(t) ? 'sc' : null;
      if (kind) { if (!open || (kind === 'red' && open.kind !== 'red')) { if (open) out.push(Object.assign(open, { to: e.lap })); open = { kind, from: e.lap }; } continue; }
      if (/green flag|race resumes|restart/i.test(t) && open) { if (e.lap >= open.from) out.push(Object.assign(open, { to: e.lap })); open = null; }
    }
    if (open) out.push(Object.assign(open, { to: laps }));
    return out;
  }
  function strategy(files, s, exp) {
    const L = s.last; if (!L) return null;
    const f = s.focus, fid = f ? f.id : null;
    const useExp = exp && exp.circuit && L.name && (exp.circuit.toLowerCase().includes(L.name.toLowerCase()) || L.name.toLowerCase().includes(exp.circuit.toLowerCase()));
    const cars = L.cars.map(c => ({ teamId: c.teamId, team: c.team, drivers: c.drivers, start: c.start, finish: c.position, finished: c.finished,
      status: c.status, stops: c.stops, time: c.time, color: (s.teams.find(t => t.id === c.teamId) || {}).color || '#8E9AAF', mine: c.teamId === fid,
      partner: s.partners.some(p => p.id === c.teamId) }));
    const out = { kind: 'strategy', season: s.season, round: L.round, circuit: L.name, category: s.category, team: f ? f.short : null,
      cars, hasExport: !!useExp, exportMismatch: exp && !useExp ? exp.circuit : null };
    if (!useExp) return out;
    const color = tyreColors(files);
    out.laps = exp.laps;
    out.cautions = cautions(exp.events, exp.laps);
    const inCaution = lap => out.cautions.some(c => lap >= c.from && lap <= c.to);
    // Pit stops per car (in endurance every driver of a car can be named on a stop).
    for (const c of cars) {
      const pits = exp.pits.filter(p => c.drivers.includes(p.driver)).sort((a, b) => a.lap - b.lap);
      const seen = new Set();
      c.pits = pits.filter(p => { const k = p.lap + '|' + p.what; if (seen.has(k)) return false; seen.add(k); return true; }).map(p => {
        const m = /^(.+?)\s*>\s*(.+)$/.exec(p.what);
        return { lap: p.lap, time: p.time, fuelOnly: p.fuel, from: m ? m[1].trim() : null, to: m ? m[2].trim() : null, botched: p.botched,
          free: p.time <= 0.05, caution: inCaution(p.lap) };
      });
      const tyreStops = c.pits.filter(p => !p.fuelOnly);
      const first = tyreStops.find(p => p.from) ;
      let comp = first ? first.from : null, startLap = 0;
      c.stints = [];
      for (const p of tyreStops) { c.stints.push({ from: startLap, to: p.lap, compound: comp, color: color(comp) }); startLap = p.lap; comp = p.to || comp; }
      const end = c.finished ? exp.laps : (exp.cls.find(x => c.drivers.includes(x.driver) && x.outLap) || {}).outLap || exp.laps;
      c.stints.push({ from: startLap, to: end, compound: comp, color: color(comp) });
      c.outLap = c.finished ? null : end;
      c.pitTime = +c.pits.reduce((a, p) => a + (p.time || 0), 0).toFixed(1);
      c.cautionStops = c.pits.filter(p => p.caution && !p.free).length;
    }
    const compounds = {};
    for (const c of cars) for (const st of c.stints || []) if (st.compound) compounds[st.compound] = st.color;
    out.compounds = Object.entries(compounds).map(([name, col]) => ({ name, color: col }));
    return out;
  }


  // ------------------------------------------------------------ US race recap (NASCAR style, American Oval Series)
  const isUS = s => /nascar|arca|oval|indycar|truck series|xfinity|cup series/i.test(String(s.category || ''));
  function usRace(files, s, exp) {
    const L = s.last; if (!L) return null;
    const season = files.season || {};
    const raw = (season.raceResults || []).filter(r => r.season == null || r.season === s.season).sort((a, b) => a.week - b.week).slice(-1)[0] || {};
    const circ = (season.circuits || []).find(c => c.week === L.week && c.name === L.name) || (season.circuits || []).find(c => c.name === L.name) || {};
    const drivers = ((files.drivers || {}).drivers || []).concat((files.drivers || {}).reserveDrivers || []);
    const dname = id => (drivers.find(d => d.id === id) || {}).name || null;
    const fid = s.focus && s.focus.role === 'player' ? s.focus.id : null;
    const face = id => (drivers.find(d => d.id === id) || {}).image || null;
    const teamsAll = (files.teams && files.teams.teams) || [];
    const logo = id => (teamsAll.find(t => t.id === id) || {}).logo || null;
    const rows = (raw.results || []).slice().sort((a, b) => a.position - b.position).map(r => ({ face: face(r.driverId), logo: logo(r.teamId),
      pos: r.position, driver: r.driverName, team: short(r.teamName), color: r.teamColor, start: r.startingPosition,
      gain: r.status === 'RUNNING' && r.startingPosition ? r.startingPosition - r.position : null, finished: !r.status || /RUNNING|FINISH/i.test(r.status),
      status: r.status, stops: r.pitStops, points: num((raw.driverPoints || {})[r.driverId]), mine: r.teamId === fid }));
    // Stage winners: stored for background series; for your own race the export may name them.
    let stages = (raw.stageWinners || []).map((id, i) => ({ stage: i + 1, driver: dname(id) })).filter(x => x.driver);
    if (!stages.length && exp && exp.events) {
      for (const e of exp.events) { const m = /stage\s*(\d)\b.*?(?:won by|winner:?|goes to)\s+([^,.(]+)/i.exec(e.text) || /^(.+?) wins stage\s*(\d)/i.exec(e.text);
        if (m) stages.push(/wins stage/i.test(e.text) ? { stage: +m[2], driver: m[1].trim(), lap: e.lap } : { stage: +m[1], driver: m[2].trim(), lap: e.lap }); }
    }
    const km = num(circ.length);
    const st = s.drivers;
    const leader = st[0];
    const mineSt = st.filter(d => d.teamId === fid).map(d => ({ name: d.name, pos: d.pos, tied: d.tied, points: d.points, back: leader ? +(leader.points - d.points).toFixed(1) : null }));
    const cautions = exp && exp.events ? exp.events.filter(e => /safety car deployed|caution/i.test(e.text) && !/virtual/i.test(e.text)).length : null;
    return { kind: 'us', series: s.category, season: s.season, round: L.round, total: s.rounds.total, track: L.name,
      laps: num(circ.laps), miles: km ? +(km / 1.609344).toFixed(3) : null, raceMiles: km && circ.laps ? Math.round(km * circ.laps / 1.609344) : null,
      winner: rows.find(r => r.pos === 1) || null, top: rows.slice(0, 10), ours: rows.filter(r => r.mine), field: rows.length,
      stages, cautions, dnf: rows.filter(r => !r.finished).length,
      standings: st.slice(0, 5).map(d => ({ pos: d.pos, tied: d.tied, name: d.name, team: short(d.team), color: d.color, points: d.points, back: leader ? +(leader.points - d.points).toFixed(1) : null, mine: d.teamId === fid })),
      ourStandings: mineSt, team: s.focus ? s.focus.short : null,
      next: s.next ? { track: s.next.name, round: s.next.round, week: s.next.week } : null };
  }


  // ------------------------------------------------------------ season start (preview) and season end (review)
  function lineupOf(files, teamId, yr) {
    const teams = (files.teams && files.teams.teams) || [];
    const t = teams.find(x => x.id === teamId); if (!t) return [];
    const all = ((files.drivers || {}).drivers || []).concat((files.drivers || {}).reserveDrivers || []);
    const pick = (list, role) => (list || []).map(p => { const d = all.find(x => x.id === p.id); return d ? { name: d.name, role, age: num(d.age), level: num(d.level), potential: num(d.potential),
      cc: S.countryCode(d.country, d.flagPath), face: d.image || null, until: num(p.contract), wins: num(d.careerWins), titles: num(d.championships) } : null; }).filter(Boolean);
    const list = pick(t.pilots, 'driver').concat(pick(t.reserves, 'reserve'));
    if (list.length) return list;
    return all.filter(d => d.teamId === teamId && !d.retired).map(d => ({ name: d.name, role: 'driver', age: num(d.age), level: num(d.level), potential: num(d.potential),
      cc: S.countryCode(d.country, d.flagPath), face: d.image || null, until: num(d.contractEndYear), wins: num(d.careerWins), titles: num(d.championships) }));
  }
  function pastChampion(files, yr) {
    const tc = files.teamsCareer && files.teamsCareer.teams, dc = files.driversCareer && files.driversCareer.drivers;
    // Champion = position 1 when the career file keeps it, else most points that season.
    const find = (obj) => {
      if (!obj) return null; let best = null;
      for (const [id, x] of Object.entries(obj)) for (const z of (x.seasonBySeasonStats || []).filter(z => z.season === yr)) {
        const c = { id: +id, name: x.name, image: x.image || null, points: num(z.points), wins: num(z.wins), pos: num(z.position) };
        if (c.pos === 1) return c;
        if (z.position == null && (!best || (c.points || 0) > (best.points || 0))) best = c;
      }
      return best;
    };
    return { team: find(tc), driver: find(dc) };
  }
  function seasonStart(files, s) {
    const f = s.focus; const season = files.season || {};
    const races = s.rounds.list;
    const teams = (files.teams && files.teams.teams) || [];
    const me = f ? teams.find(t => t.id === f.id) : null;
    const prev = s.season - 1, champ = pastChampion(files, prev);
    let tips = [];
    for (const m of season.mails || []) if (/Pre-season testing analysis/i.test(m.subject || '')) {
      const x = /strongest this season are (.+?)\.\n/i.exec(String(m.content || '')); if (x) tips = x[1].split(/,\s*| and /).map(v => short(v.trim()));
    }
    return { kind: 'seasonStart', season: s.season, category: s.category, team: f ? f.short : null, name: f ? f.name : null, color: f ? f.color : null,
      logo: me ? me.logo || null : null, role: f ? f.role : null, target: f ? f.expected : null,
      lineup: f ? lineupOf(files, f.id, s.season) : [], last: f && f.career && f.career.past.length ? f.career.past[f.career.past.length - 1] : null,
      titles: f && f.career ? f.career.titles : 0,
      rounds: races.length, first: races[0] || null, finale: races[races.length - 1] || null,
      sprints: (season.circuits || []).filter(c => c.eventType !== 'testing' && c.hasSprintWeekend).length,
      champion: champ, prevSeason: prev, tips, started: !s.preseason, round: s.rounds.done };
  }
  function seasonEnd(files, s) {
    const f = s.focus; if (!f) return null;
    const teams = (files.teams && files.teams.teams) || [];
    const all = ((files.drivers || {}).drivers || []).concat((files.drivers || {}).reserveDrivers || []);
    const face = name => (all.find(d => d.name === name) || {}).image || null;
    const logo = id => (teams.find(t => t.id === id) || {}).logo || null;
    // Pre-season of a new year: review the season that just ended (only what the career files keep).
    if (s.preseason && f.career && f.career.past.length) {
      const p = f.career.past[f.career.past.length - 1], ch = pastChampion(files, p.season);
      return { kind: 'seasonEnd', limited: true, season: p.season, category: s.category, team: f.short, color: f.color, logo: logo(f.id), finished: true,
        pos: p.pos, points: p.points, wins: p.wins, target: null, form: [], champion: ch.team ? { team: short(ch.team.name), points: ch.team.points } : null,
        championDriver: ch.driver ? { name: ch.driver.name, face: ch.driver.image || face(ch.driver.name) } : null, drivers: [] };
    }
    const names = s.rounds.list;
    const form = f.form.map(x => ({ round: x.round, pos: x.pos, label: x.label, track: (names.find(r => r.round === x.round) || {}).name || '', cc: (names.find(r => r.round === x.round) || {}).cc || '' }));
    const bestRace = form.filter(x => x.pos != null).sort((a, b) => a.pos - b.pos)[0] || null;
    const champT = s.teams[0], champD = s.drivers[0];
    return { kind: 'seasonEnd', season: s.season, category: s.category, team: f.short, color: f.color, logo: logo(f.id), finished: s.finished,
      round: s.rounds.done, total: s.rounds.total, pos: f.pos, tied: f.tied, points: f.points, wins: f.wins, podiums: f.podiums, poles: f.poles, dnf: f.dnf,
      target: f.expected, verdict: f.expected && f.pos ? (f.pos < f.expected ? 'ahead' : f.pos === f.expected ? 'on' : 'behind') : null,
      gapToTop: champT ? +(champT.points - f.points).toFixed(1) : null, best: bestRace, form,
      champion: champT ? { team: champT.short, points: champT.points, color: champT.color, logo: logo(champT.id), mine: champT.id === f.id } : null,
      championDriver: champD ? { name: champD.name, team: short(champD.team), points: champD.points, face: face(champD.name) } : null,
      drivers: f.drivers.map(d => ({ name: d.name, pos: d.pos, tied: d.tied, points: d.points, face: face(d.name) })) };
  }

  // Paddock headlines in priority order (own team first), shared by card and text.
  const PW = {
    en: { protestMine: '{B} protests against {A}', protestUp: 'Protest upheld: {B} against {A}', protest: '{B} protests against {A}',
      rejected: 'Rejected by the stewards.', upheld: 'Penalty: {P}.', investigation: 'Stewards clear {A}', investigationBad: 'Stewards investigate {A}',
      investigationBy: 'Complaint filed by {B}.', techFail: 'Technical check failed: {A}', techFailD: '{D} did not pass.',
      techAll: '{N} technical checks, all passed', techOne: 'Technical check passed', techAllD: 'No car failed post-race scrutineering.', 
      analyst: 'Testing tips vs reality', analystD: 'Tipped as strongest: {X}.',
      rebrand: '{A} becomes {B}', rebrandD: 'Team name change for the new season.', protests: '{N} protests, none upheld', protestsD: 'Teams keep testing the stewards.',
      weProtest: 'We protest against {A}', analyst_strong: 'Testing analyst tipped us as one of the strongest', analyst_watch: 'Testing analyst: a team to keep an eye on', analyst_behind: 'Testing analyst had us among the teams behind', analystNow: 'Now P{P} in the championship.',
      techOursD: 'Every car of {T} passed post-race scrutineering.',
      third: { weProtest: '{T} protests against {A}', analyst_strong: 'Testing analyst tipped {T} as one of the strongest', analyst_watch: 'Testing analyst: {T} a team to keep an eye on', analyst_behind: 'Testing analyst had {T} among the teams behind' }, contract1: '1 contract ends in {Y}', contractN: '{N} contracts end in {Y}', reserve: 'reserve', injured: '{D} injured', injuredD: 'Out for {W} more weeks.' },
    nl: { protestMine: '{B} protesteert tegen {A}', protestUp: 'Protest toegewezen: {B} tegen {A}', protest: '{B} protesteert tegen {A}',
      rejected: 'Afgewezen door de stewards.', upheld: 'Straf: {P}.', investigation: 'Stewards: {A} in orde', investigationBad: 'Stewards onderzoeken {A}',
      investigationBy: 'Klacht ingediend door {B}.', techFail: 'Technische controle afgekeurd: {A}', techFailD: '{D} niet goedgekeurd.',
      techAll: '{N} technische controles, alles goedgekeurd', techOne: 'Technische controle goedgekeurd', techAllD: 'Geen enkele auto afgekeurd na de race.',
      analyst: 'Testvoorspelling vs werkelijkheid', analystD: 'Getipt als sterkst: {X}.',
      rebrand: '{A} wordt {B}', rebrandD: 'Nieuwe teamnaam voor het nieuwe seizoen.', protests: '{N} protesten, geen toegewezen', protestsD: 'De teams blijven de stewards testen.',
      weProtest: 'Wij protesteren tegen {A}', analyst_strong: 'Testanalist tipte ons als een van de sterkste teams', analyst_watch: 'Testanalist: een team om in de gaten te houden', analyst_behind: 'Testanalist zag ons bij de achterblijvers', analystNow: 'Nu P{P} in het kampioenschap.',
      techOursD: 'Alle auto’s van {T} goedgekeurd na de race.',
      third: { weProtest: '{T} protesteert tegen {A}', analyst_strong: 'Testanalist tipte {T} als een van de sterkste teams', analyst_watch: 'Testanalist: {T} een team om in de gaten te houden', analyst_behind: 'Testanalist zag {T} bij de achterblijvers' }, contract1: '1 contract loopt af in {Y}', contractN: '{N} contracten lopen af in {Y}', reserve: 'reserve', injured: '{D} geblesseerd', injuredD: 'Nog {W} weken uit de roulatie.' }
  };
  const fillT = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
  // voice 'press' (and the card) speaks about the team in the third person; 'team'/'hype' say "we".
  function paddockHeadlines(view, lang, voice) {
    const T = view.focusTeam, base = PW[lang] || PW.en;
    const w = voice === 'press' ? Object.assign({}, base, base.third) : base, out = [];
    const add = (it, head, detail) => out.push({ week: it ? it.week : null, head, detail, mine: true, type: it ? it.type : 'summary' });
    const inv = view.items.filter(i => i.type === 'investigation');
    for (const it of view.items) {
      if (it.type === 'protest') {
        if (!it.ours && inv.some(v => v.week === it.week)) continue;   // same event as the stewards mail
        add(it, fillT(it.upheld ? w.protestUp : it.ours ? w.weProtest : w.protestMine, { A: it.against, B: it.by, T }), it.upheld ? fillT(w.upheld, { P: it.punishment || '?' }) : w.rejected);
      } else if (it.type === 'investigation') add(it, fillT(it.clean ? w.investigation : w.investigationBad, { A: it.against }), it.by ? fillT(w.investigationBy, { B: it.by }) : '');
      else if (it.type === 'techcheck') add(it, fillT(w.techFail, { A: T }), fillT(w.techFailD, { D: it.failed.join(', ') }));
      else if (it.type === 'analyst') add(it, fillT(w['analyst_' + it.tip], { T }), it.now ? fillT(w.analystNow, { P: it.now }) : '');
      else if (it.type === 'rebrand') add(it, fillT(w.rebrand, { A: it.from, B: it.to }), w.rebrandD);
    }
    if (view.checks && !view.failedChecks) add(null, view.checks === 1 ? w.techOne : fillT(w.techAll, { N: view.checks }), fillT(w.techOursD, { T }));
    const end = view.ending.filter(c => !c.staff);
    if (end.length) add(null, fillT(end.length === 1 ? w.contract1 : w.contractN, { N: end.length, Y: view.season }), end.map(c => c.name + (c.role === 'reserve' ? ' (' + w.reserve + ')' : '')).join(', '));
    for (const d of view.injured) add(null, fillT(w.injured, { D: d.name }), d.weeks ? fillT(w.injuredD, { W: d.weeks }) : '');
    return out;
  }
  return { championship, rnd, paddock, strategy, usRace, isUS, seasonStart, seasonEnd, paddockHeadlines, ATTRS, NAMES_NL };
});
