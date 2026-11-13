/* DM Save Card — turns the files of one Delta Manager save slot into a progress summary.
   Reads only plain save data (standings, results, calendar). No game-engine logic.
   Never reads Steam IDs: the summary carries manager names only when asked to. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMSave = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Files read per slot, relative to sauvegardes/<mode>/slot_N/
  const FILES = {
    meta: 'meta.json', player: 'player.json', season: 'season.json', teams: 'teams.json',
    drivers: 'drivers.json', config: 'config.json',
    teamsCareer: 'career/teams_career.json', driversCareer: 'career/drivers_career.json'
  };
  const REQUIRED = ['meta', 'season', 'teams', 'drivers'];

  const num = v => {
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string') { const m = v.replace(',', '.').match(/-?\d+(?:\.\d+)?/); return m ? parseFloat(m[0]) : null; }
    return null;
  };

  // Flag emoji (🇫🇷, 🏴 England) or flag path (./flags/fr.png) to a short code.
  function countryCode(flag, path) {
    if (flag) {
      const cps = Array.from(flag).map(c => c.codePointAt(0));
      const ri = cps.filter(c => c >= 0x1F1E6 && c <= 0x1F1FF);
      if (ri.length === 2) return String.fromCharCode(ri[0] - 0x1F1E6 + 65, ri[1] - 0x1F1E6 + 65);
      const tag = cps.filter(c => c >= 0xE0061 && c <= 0xE007A).map(c => String.fromCharCode(c - 0xE0061 + 97)).join('');
      if (tag.length > 2) return tag.slice(2).toUpperCase();
    }
    const m = /\/([a-z]{2})(?:-[a-z]+)?\.(?:png|svg|webp)$/i.exec(path || '');
    return m ? m[1].toUpperCase() : '';
  }

  const carNumber = name => { const m = /#\s?(\d{1,3})\b/.exec(name || ''); return m ? m[1] : ''; };
  const finished = status => !status || /RUNNING|FINISH|CLASSIFIED/i.test(status);
  const statusLabel = status => (/DSQ|DISQ/i.test(status) ? 'DSQ' : /DNS/i.test(status) ? 'DNS' : 'DNF');

  // One race → list of cars. Endurance saves list every driver of a car with the same position.
  function carsOf(race) {
    const map = new Map();
    for (const r of race.results || []) {
      const key = r.teamId + '|' + r.position;
      let car = map.get(key);
      if (!car) {
        car = { teamId: r.teamId, team: r.teamName || '', color: r.teamColor || '', position: r.position,
          start: r.startingPosition ?? null, status: r.status || '', finished: finished(r.status),
          pitStops: r.pitStops ?? null, time: num(r.totalTime), drivers: [], driverIds: [] };
        map.set(key, car);
      }
      car.drivers.push(r.driverName || '');
      car.driverIds.push(r.driverId);
    }
    return Array.from(map.values()).sort((a, b) => a.position - b.position);
  }

  function poleTeam(race, cars) {
    const q = (race.qualifying || []).slice().sort((a, b) => a.position - b.position)[0];
    if (q && q.teamId != null) return q.teamId;
    const c = cars.find(x => x.start === 1);
    return c ? c.teamId : null;
  }

  // Standard competition ranking (1, 1, 1, 4) on points, then count-back of finishing places.
  function rank(rows) {
    const key = r => [r.points].concat(r.countback).join(',');
    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const n = Math.max(a.countback.length, b.countback.length);
      for (let i = 0; i < n; i++) { const d = (b.countback[i] || 0) - (a.countback[i] || 0); if (d) return d; }
      return a.order - b.order;
    });
    rows.forEach((r, i) => { r.pos = i > 0 && key(rows[i - 1]) === key(r) ? rows[i - 1].pos : i + 1; });
    rows.forEach((r, i) => { r.tied = rows.some((o, j) => j !== i && o.pos === r.pos); });
    return rows;
  }

  function addCountback(cb, pos) { if (pos >= 1 && pos <= 60) { while (cb.length < pos) cb.push(0); cb[pos - 1]++; } }

  function summarize(files, opts) {
    opts = opts || {};
    for (const k of REQUIRED) if (!files[k]) throw new Error('Missing ' + FILES[k]);
    const meta = files.meta, season = files.season;
    const playerFile = files.player || {};
    const gd = (files.config && files.config.generalData) || {};
    const year = num(season.currentSeason) ?? num(meta.currentSeason);
    const week = num(season.currentWeek) ?? num(meta.currentWeek);
    const mode = meta.isSpectatorMode ? 'spectator' : meta.isCoopMode ? 'coop' : 'solo';

    // Calendar: races only, testing events left out.
    const races = (season.circuits || []).filter(c => c.eventType !== 'testing')
      .slice().sort((a, b) => a.week - b.week)
      .map((c, i) => ({ round: i + 1, name: c.nickname || c.name, cc: countryCode(c.flag, c.flagPath), week: c.week,
        laps: num(c.laps), sprint: !!c.hasSprintWeekend, done: false, km: num(c.length), type: c.category || null, track: trackOf(c) }));
    const results = (season.raceResults || []).filter(r => r.season == null || r.season === year)
      .slice().sort((a, b) => a.week - b.week);
    const rounds = results.map((r, i) => {
      const cal = races.find(c => c.week === r.week && !c.done) || races.find(c => !c.done && c.name === (r.circuit && r.circuit.name));
      if (cal) cal.done = true;
      const cars = carsOf(r);
      return { round: cal ? cal.round : i + 1, week: r.week, name: (r.circuit && r.circuit.name) || (cal && cal.name) || '',
        cc: countryCode(r.circuit && r.circuit.flag) || (cal && cal.cc) || '', cars, pole: poleTeam(r, cars),
        sprint: (r.sprint || []).length > 0 };
    });

    // Teams and their season record from the race results.
    const teamList = (files.teams.teams || []);
    const teamStats = new Map();
    const stat = id => {
      if (!teamStats.has(id)) teamStats.set(id, { wins: 0, podiums: 0, poles: 0, dnf: 0, best: null, countback: [], form: [], sum: 0 });
      return teamStats.get(id);
    };
    for (const rd of rounds) {
      const byTeam = new Map();
      for (const c of rd.cars) { if (!byTeam.has(c.teamId)) byTeam.set(c.teamId, []); byTeam.get(c.teamId).push(c); }
      for (const [id, cars] of byTeam) {
        const s = stat(id);
        let best = null;
        for (const c of cars) {
          if (c.finished) {
            if (c.position === 1) s.wins++;
            if (c.position <= 3) s.podiums++;
            addCountback(s.countback, c.position);
            if (best == null || c.position < best) best = c.position;
          } else s.dnf++;
        }
        if (best != null && (s.best == null || best < s.best)) s.best = best;
        s.form.push({ round: rd.round, pos: best, label: best != null ? 'P' + best : statusLabel(cars[0].status) });
      }
      if (rd.pole != null) stat(rd.pole).poles++;
    }
    const resultPoints = new Map();
    for (const r of results) for (const [id, p] of Object.entries(r.teamPoints || {})) resultPoints.set(+id, (resultPoints.get(+id) || 0) + (num(p) || 0));
    for (const r of results) for (const [id, p] of Object.entries(r.sprintTeamPoints || {})) resultPoints.set(+id, (resultPoints.get(+id) || 0) + (num(p) || 0));

    const teamStandings = rank(teamList.map((t, i) => {
      const s = stat(t.id);
      const pts = num(t.points);
      return { id: t.id, name: t.name, short: shortName(t.name), number: carNumber(t.name), color: t.teamColor || '#8E9AAF',
        logo: t.logo || '', cc: countryCode(t.country, t.flag), engine: t.engine || '',
        points: pts != null ? pts : (resultPoints.get(t.id) || 0),
        wins: s.wins, podiums: s.podiums, poles: s.poles, dnf: s.dnf, best: s.best, form: s.form,
        countback: s.countback, order: i };
    }));

    // Drivers: race seats plus reserves that scored.
    const dfile = files.drivers;
    const drvRaw = (dfile.drivers || []).concat((dfile.reserveDrivers || []).filter(d => (num(d.points) || 0) > 0));
    const drvCb = new Map();
    for (const rd of rounds) for (const c of rd.cars) if (c.finished) for (const id of c.driverIds) {
      if (!drvCb.has(id)) drvCb.set(id, { cb: [], wins: 0, podiums: 0 });
      const d = drvCb.get(id); addCountback(d.cb, c.position); if (c.position === 1) d.wins++; if (c.position <= 3) d.podiums++;
    }
    const teamById = new Map(teamList.map(t => [t.id, t]));
    const seen = new Set();
    const driverStandings = rank(drvRaw.filter(d => !d.retired && !seen.has(d.id) && seen.add(d.id)).map((d, i) => {
      const s = drvCb.get(d.id) || { cb: [], wins: 0, podiums: 0 };
      const t = teamById.get(d.teamId);
      return { id: d.id, name: d.name, cc: countryCode(d.country || d.nationality, d.flagPath), teamId: d.teamId ?? null,
        team: t ? t.name : '', color: t ? (t.teamColor || '#8E9AAF') : '#8E9AAF', points: num(d.points) || 0,
        wins: s.wins, podiums: s.podiums, countback: s.cb, order: i };
    }));

    // Before the first race every team is level on 0: no meaningful position yet.
    const preseason = !rounds.length && teamStandings.every(r => !r.points);
    if (preseason) for (const r of teamStandings.concat(driverStandings)) { r.pos = null; r.tied = false; }

    // Who is "me"? Player team, or the championship leader in spectator saves.
    const player = playerFile.player || (playerFile.teamId != null ? playerFile : null);
    const myId = meta.playerTeamId ?? (player && player.teamId) ?? null;
    const coop = (playerFile.coopPlayers || []).filter(p => p && p.teamId != null);
    const focusRow = teamStandings.find(r => r.id === myId) || null;
    const focus = focusRow ? decorate(focusRow, 'player') : (teamStandings[0] ? decorate(teamStandings[0], 'leader') : null);

    function decorate(row, role) {
      const idx = teamStandings.indexOf(row);
      const ahead = idx > 0 ? teamStandings[idx - 1] : null;
      const behind = idx < teamStandings.length - 1 ? teamStandings[idx + 1] : null;
      const t = teamById.get(row.id) || {};
      const fin = (t.weeklyFinances || []).filter(w => w.season == null || w.season === year);
      const budget = num(t.budget);
      const tc = files.teamsCareer && files.teamsCareer.teams && files.teamsCareer.teams[row.id];
      const past = tc ? (tc.seasonBySeasonStats || []).filter(s => s.season !== year).sort((a, b) => a.season - b.season) : [];
      const coopEntry = coop.find(p => p.teamId === row.id);
      const expected = role === 'player' ? num((coopEntry || player || {}).expectedPosition) : null;
      return Object.assign({}, row, {
        role,
        manager: opts.names && coopEntry && coopEntry.playerName ? String(coopEntry.playerName) : null,
        gapAhead: ahead && !preseason ? +(ahead.points - row.points).toFixed(2) : null, ahead: ahead ? ahead.short : null,
        gapBehind: behind && !preseason ? +(row.points - behind.points).toFixed(2) : null, behind: behind ? behind.short : null,
        leaderGap: preseason ? null : idx > 0 ? +(teamStandings[0].points - row.points).toFixed(2) : 0,
        expected,
        budget, budgetStart: fin.length ? num(fin[0].budget) : null,
        drivers: driverStandings.filter(d => d.teamId === row.id).map(d => ({ name: d.name, pos: d.pos, tied: d.tied, points: d.points })),
        career: tc ? { titles: num(tc.careerStats && tc.careerStats.totalConstructorChampionships) || 0,
          past: past.map(s => ({ season: s.season, pos: num(s.position), points: num(s.points), wins: num(s.wins) })) } : null
      });
    }

    const partners = mode === 'coop'
      ? coop.filter(p => p.teamId !== myId).map(p => {
          const r = teamStandings.find(x => x.id === p.teamId);
          return r ? { id: r.id, name: r.name, short: r.short, number: r.number, color: r.color, pos: r.pos, points: r.points,
            manager: opts.names && p.playerName ? String(p.playerName) : null } : null;
        }).filter(Boolean)
      : [];

    const lastRound = rounds.length ? rounds[rounds.length - 1] : null;
    let last = null;
    if (lastRound) {
      const winner = lastRound.cars.find(c => c.position === 1 && c.finished) || lastRound.cars[0];
      last = { round: lastRound.round, name: lastRound.name, cc: lastRound.cc, week: lastRound.week,
        winner: winner ? { teamId: winner.teamId, team: winner.team, short: shortName(winner.team), color: winner.color, drivers: winner.drivers } : null,
        pole: lastRound.pole,
        mine: focus ? lastRound.cars.filter(c => c.teamId === focus.id).map(c => ({ position: c.position, start: c.start,
          gain: c.start != null && c.finished ? c.start - c.position : null, finished: c.finished,
          label: c.finished ? 'P' + c.position : statusLabel(c.status), drivers: c.drivers, stops: c.pitStops })) : [],
        // Every car of the last race (for the race report).
        cars: lastRound.cars.map(c => ({ teamId: c.teamId, team: shortName(c.team), drivers: c.drivers, position: c.position,
          start: c.start, finished: c.finished, status: c.finished ? '' : statusLabel(c.status), stops: c.pitStops, time: c.time })),
        sprint: lastRound.sprint };
      // Championship before the last race: current points minus what that race paid out.
      const raw = results[results.length - 1];
      const paid = id => (num((raw.teamPoints || {})[id]) || 0) + (num((raw.sprintTeamPoints || {})[id]) || 0);
      const before = teamStandings.map(r => ({ id: r.id, points: r.points - paid(r.id) })).sort((a, b) => b.points - a.points);
      before.forEach((r, i) => { r.pos = i > 0 && before[i - 1].points === r.points ? before[i - 1].pos : i + 1; });
      const posBefore = id => { const r = before.find(x => x.id === id); return r && rounds.length > 1 ? r.pos : null; };
      last.before = { focus: focus ? posBefore(focus.id) : null, leader: rounds.length > 1 ? before[0].id : null,
        gained: focus ? paid(focus.id) : null };
    }
    const finishedSeason = !!season.isSeasonFinished;
    const story = focus && !preseason ? storyOf(focus, teamStandings, rounds, results, races.length) : null;
    const next = finishedSeason ? null : (races.find(c => !c.done && (!lastRound || c.week > lastRound.week)) || races.find(c => !c.done) || null);

    return {
      tool: 'DM Save Card', mode, slot: opts.slot || null,
      savedAt: meta.savedAt || null, cheat: !!meta.cheatModeEnabled, mod: meta.modName || null,
      saveName: meta.customName || meta.displayName || null,
      category: gd.categoryName || null,
      season: year, week, finished: finishedSeason, preseason,
      rounds: { done: rounds.length, total: races.length || rounds.length, list: races.map(c => ({ round: c.round, name: c.name, cc: c.cc, week: c.week, done: c.done, km: c.km, laps: c.laps, type: c.type, track: c.track })) },
      story,
      focus, partners, last, next: next ? { round: next.round, name: next.name, cc: next.cc, week: next.week, laps: next.laps, sprint: next.sprint, km: next.km, type: next.type, track: next.track } : null,
      teams: teamStandings.map(r => ({ pos: r.pos, tied: r.tied, id: r.id, name: r.name, short: r.short, number: r.number, color: r.color, points: r.points, wins: r.wins })),
      drivers: driverStandings.map(d => ({ pos: d.pos, tied: d.tied, id: d.id, name: d.name, cc: d.cc, teamId: d.teamId, team: d.team, color: d.color, points: d.points, wins: d.wins }))
    };
  }

  // The track drawing of a circuit (the game's layout editor: control points on a 1000 × 1000 canvas), kept small.
  function trackOf(c) {
    const tl = c && c.trackLayout, pts = tl && (Array.isArray(tl) ? tl : tl.points);
    if (!Array.isArray(pts) || pts.length < 4) return null;
    const xy = pts.map(p => (Array.isArray(p) ? [num(p[0]), num(p[1])] : [num(p && p.x), num(p && p.y)])).filter(p => p[0] != null && p[1] != null).map(p => [Math.round(p[0]), Math.round(p[1])]);
    if (xy.length < 4) return null;
    const zones = ((!Array.isArray(tl) && tl.speedZones) || []).map(z => [num(z.frac), num(z.length) || 0.03, num(z.severity) || 1]).filter(z => z[0] != null);
    return { p: xy, z: zones, dir: c.circuitDirection === 'ccw' ? 'ccw' : 'cw', start: num(c.startGridIndex) || 0 };
  }

  // What the numbers mean for the story: how big a gap is in races, how we do against our own average,
  // one rival with a head-to-head score, the margin to the board's target.
  function storyOf(f, table, rounds, results, total) {
    const paid = (r, id) => (num((r.teamPoints || {})[id]) || 0) + (num((r.sprintTeamPoints || {})[id]) || 0);
    const best = (rd, id) => { const c = rd.cars.filter(x => x.teamId === id && x.finished).sort((a, b) => a.position - b.position)[0]; return c ? c.position : null; };
    let raceMax = 0;
    for (const r of results) for (const t of table) raceMax = Math.max(raceMax, paid(r, t.id));
    const history = rounds.map((rd, i) => { const mine = rd.cars.filter(x => x.teamId === f.id).sort((a, b) => (a.finished === b.finished ? a.position - b.position : a.finished ? -1 : 1))[0];
      return { round: rd.round, pos: mine && mine.finished ? mine.position : null, start: mine ? mine.start : null, raced: !!mine, gained: results[i] ? +paid(results[i], f.id).toFixed(2) : null }; }).filter(h => h.raced);
    const fin = history.filter(h => h.pos != null);
    const avg = fin.length ? +(fin.reduce((a, h) => a + h.pos, 0) / fin.length).toFixed(1) : null;
    let finishRun = 0; for (let i = history.length - 1; i >= 0 && history[i].pos != null; i--) finishRun++;
    const last = history[history.length - 1] || null;
    let bestIn = 0;   // the last result is the best of the last N races (N counts the last race itself)
    if (last && last.pos != null) { bestIn = 1; for (let i = history.length - 2; i >= 0 && (history[i].pos == null || history[i].pos > last.pos); i--) bestIn++; }
    const idx = table.findIndex(t => t.id === f.id), up = idx > 0 ? table[idx - 1] : null, down = idx >= 0 && idx < table.length - 1 ? table[idx + 1] : null;
    const gUp = up ? up.points - f.points : Infinity, gDown = down ? f.points - down.points : Infinity;
    const rt = gUp <= gDown * 1.5 ? up : down;
    let rival = null;
    if (rt) { let us = 0, them = 0;
      for (const rd of rounds) { const a = best(rd, f.id), b = best(rd, rt.id); if (a == null && b == null) continue; if (b == null || (a != null && a < b)) us++; else if (a == null || b < a) them++; }
      const lr = rounds[rounds.length - 1];
      rival = { id: rt.id, short: rt.short, color: rt.color, ahead: rt === up, gap: +Math.abs(rt.points - f.points).toFixed(2), us, them, pos: rt.pos, lastUs: lr ? best(lr, f.id) : null, lastThem: lr ? best(lr, rt.id) : null }; }
    let target = null;
    if (f.expected && f.pos != null) {
      if (f.pos <= f.expected) { const out = table[f.expected] || null; target = { pos: f.expected, ok: true, margin: out ? +(f.points - out.points).toFixed(2) : null, team: out ? out.short : null, teamPos: out ? out.pos : null }; }
      else { const at = table[f.expected - 1] || null; target = { pos: f.expected, ok: false, margin: at ? +(at.points - f.points).toFixed(2) : null, team: at ? at.short : null, teamPos: f.expected }; }
    }
    const left = Math.max(0, total - rounds.length);
    return { raceMax: +raceMax.toFixed(2), left, races: history.length, history: history.slice(-12), avg, finishRun, bestIn, seasonBest: fin.length ? Math.min(...fin.map(h => h.pos)) : null,
      last: last ? { pos: last.pos, start: last.start, gained: last.gained } : null, rival, target,
      titleOpen: f.leaderGap != null && raceMax > 0 ? f.leaderGap <= left * raceMax / 2 : null };   // the leader scores too: half of what is left is a fair limit
  }

  // "Mercedes-AMG Team Verstappen Racing (#3)" → "Verstappen Racing #3" is too clever; keep the name, drop the brackets.
  function shortName(name) {
    if (!name) return '';
    const n = String(name).replace(/\s*\(#\s?(\d{1,3})\)\s*$/, ' #$1').trim();
    return n;
  }

  // Slot list entry from meta.json only (cheap, for the picker).
  function slotInfo(id, meta) {
    meta = meta || {};
    return { id, mode: meta.isSpectatorMode ? 'spectator' : meta.isCoopMode ? 'coop' : 'solo',
      team: meta.playerTeamName || meta.teamName || null, color: meta.teamColor || null,
      season: num(meta.currentSeason), week: num(meta.currentWeek), position: num(meta.championshipPosition),
      savedAt: meta.savedAt || null, name: meta.customName || meta.displayName || null, coopPlayers: num(meta.coopPlayersCount) || 0 };
  }

  return { FILES, REQUIRED, summarize, slotInfo, countryCode, carNumber, shortName, carsOf, num };
});
