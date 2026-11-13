/* DM Save Card — multiplayer without a save. Only the host has the save; every player can copy
   the game's race summary ("=== Race summary — … ==="). This module reads those recaps and builds
   the same plain files the tool reads from a save (meta, season, teams, drivers), so the cards,
   the journal and the chapters work on them. Data the recap does not carry (R&D, budgets,
   contracts, ratings) is simply missing. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./report.js'));
  else root.DMRecap = factory(root.DMReport);
})(typeof self !== 'undefined' ? self : this, function (R) {
  'use strict';
  const DASH = '[—–-]';
  const COUNTRY = { 'united states': 'US', usa: 'US', canada: 'CA', mexico: 'MX', brazil: 'BR', argentina: 'AR', 'united kingdom': 'GB', 'great britain': 'GB',
    england: 'GB', france: 'FR', italy: 'IT', germany: 'DE', spain: 'ES', portugal: 'PT', belgium: 'BE', netherlands: 'NL', austria: 'AT', hungary: 'HU',
    monaco: 'MC', switzerland: 'CH', poland: 'PL', 'czech republic': 'CZ', finland: 'FI', sweden: 'SE', japan: 'JP', china: 'CN', 'south korea': 'KR',
    singapore: 'SG', india: 'IN', australia: 'AU', 'new zealand': 'NZ', bahrain: 'BH', 'saudi arabia': 'SA', qatar: 'QA', 'united arab emirates': 'AE',
    azerbaijan: 'AZ', turkey: 'TR', russia: 'RU', 'south africa': 'ZA', malaysia: 'MY', thailand: 'TH', indonesia: 'ID' };
  const PALETTE = ['#4E79A7', '#59A14F', '#B07AA1', '#76B7B2', '#EDC948', '#9C755F', '#FF9DA7', '#86BCB6', '#D4A6C8', '#8CD17D', '#F1CE63', '#A0CBE8', '#BAB0AC', '#D37295', '#79706E'];

  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0); };
  const idOf = (kind, name) => 1000 + (hash(kind + ':' + String(name).trim().toLowerCase()) % 8999000);   // stable across imports
  const flag = cc => cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '';
  const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'season';

  // ------------------------------------------------------------ one recap
  function parse(text) {
    text = String(text || '').replace(/\r/g, '');
    const base = R.parseExport(text);
    if (!base) return null;
    const out = Object.assign(base, { season: null, round: null, total: null, week: null, location: null, country: '',
      pts: {}, drivers: [], teams: [], driversBefore: [], teamsBefore: [] });
    let section = '', sub = '';
    const val = (k, s) => { const m = new RegExp('^' + k + ':\\s*(.+)$', 'i').exec(s); return m ? m[1].trim() : null; };
    for (const line of text.split('\n')) {
      const s = line.trim();
      if (!s) continue;
      if (s.startsWith('## ')) { section = s.slice(3).toLowerCase(); sub = ''; continue; }
      if (s.startsWith('### ')) { sub = s.slice(4).toLowerCase(); continue; }
      if (section === 'context') {
        let v;
        if ((v = val('Season', s))) out.season = parseInt(v, 10) || null;
        else if ((v = val('Round', s))) { const m = /(\d+)\s*\/\s*(\d+)/.exec(v); if (m) { out.round = +m[1]; out.total = +m[2]; } else out.round = parseInt(v, 10) || null; }
        else if ((v = val('Week', s))) out.week = parseFloat(v) || null;
        else if ((v = val('Location', s))) {
          const m = /^(.+?)\s*\(([^()]+)\)\s*$/.exec(v);
          out.location = m ? m[1].trim() : v;
          out.country = m ? (COUNTRY[m[2].trim().toLowerCase()] || '') : '';
        }
      } else if (section.startsWith('final classification')) {
        const m = new RegExp('^(?:P\\d+|DNF|DSQ|NC|DNS)\\.?\\s+(.+?)\\s+\\(.+?\\)\\s+' + DASH + '.*\\|\\s*(-?\\d+(?:[.,]\\d+)?)\\s*pts?\\s*$', 'i').exec(s);
        if (m) out.pts[m[1].trim()] = parseFloat(m[2].replace(',', '.'));
      } else if (section.startsWith('championship standings')) {
        const before = /before/.test(section);
        const m = new RegExp('^P(\\d+)\\.?\\s+(.+?)\\s+' + DASH + '\\s+(-?\\d+(?:[.,]\\d+)?)\\s*pts?', 'i').exec(s);
        if (!m) continue;
        const who = /^(.+?)\s+\((.+)\)$/.exec(m[2].trim());
        const pts = parseFloat(m[3].replace(',', '.'));
        if (/driver/.test(sub)) (before ? out.driversBefore : out.drivers).push({ pos: +m[1], name: who ? who[1] : m[2].trim(), team: who ? who[2] : '', points: pts });
        else if (/constructor|team/.test(sub)) (before ? out.teamsBefore : out.teams).push({ pos: +m[1], name: m[2].trim(), points: pts });
      }
    }
    out.location = out.location || base.circuit;
    out.key = (out.season || 0) + '-' + (out.round || 0) + '-' + slug(out.location);
    return out;
  }

  // ------------------------------------------------------------ roster: "@discordname - Team name", one per line
  // Kept with the season and saved as a plain .txt, so the next season reads it back in one go.
  function parseRoster(text) {
    const out = [], bad = [];
    for (const raw of String(text || '').replace(/\r/g, '').split('\n')) {
      const s = raw.trim(); if (!s || s.startsWith('#')) continue;
      const m = /^(?:[*•\-]\s+)?@?(.+?)\s+[-–—]\s+(.+?)\s*$/.exec(s);
      if (m) out.push({ name: m[1].trim(), team: m[2].trim() }); else bad.push(s);
    }
    return { list: out, bad };
  }
  const formatRoster = list => (list || []).map(p => '* @' + p.name + ' - ' + p.team).join('\n');
  // Roster team names that do not match a team in the recaps (typos, short names).
  function rosterCheck(list, teams) {
    const norm = x => String(x).toLowerCase().replace(/[^a-z0-9]/g, '');
    return (list || []).map(p => {
      if (teams.includes(p.team)) return Object.assign({}, p, { match: p.team });
      const hit = teams.find(t => norm(t) === norm(p.team)) || teams.find(t => norm(t).includes(norm(p.team)) || norm(p.team).includes(norm(t)));
      return Object.assign({}, p, { match: hit || null });
    });
  }

  // ------------------------------------------------------------ league → save-like files
  // league: { id, name, team, color, category, recaps: [{ text, added }] }
  function build(league) {
    league = league || {};
    const byKey = new Map();
    for (const r of league.recaps || []) {
      const p = parse(r.text);
      if (p && p.round) { p.added = r.added || null; p.ownPlayers = Array.isArray(r.players) ? r.players : null; byKey.set(p.key, p); }      // later import of the same race wins
    }
    const all = [...byKey.values()].sort((a, b) => (a.season || 0) - (b.season || 0) || a.round - b.round);
    if (!all.length) return null;
    const season = all[all.length - 1].season;
    const races = all.filter(r => r.season === season);
    const last = races[races.length - 1];
    const total = Math.max(...races.map(r => r.total || 0), last.round);

    // Teams and drivers: everyone who appears; points from the newest standings.
    const teamNames = new Set(), drv = new Map();
    for (const r of races) {
      r.cls.forEach(c => { if (c.team) teamNames.add(c.team); drv.set(c.driver, c.team || (drv.get(c.driver) || '')); });
      r.teams.forEach(t => teamNames.add(t.name));
      r.drivers.forEach(d => { if (d.team) teamNames.add(d.team); drv.set(d.name, d.team || drv.get(d.name) || ''); });
    }
    const mine = league.team && teamNames.has(league.team) ? league.team : null;
    const color = name => name === mine && /^#[0-9a-f]{6}$/i.test(league.color || '') ? league.color
      : (league.colors && league.colors[name]) || PALETTE[hash(name) % PALETTE.length];
    const ptsTeam = new Map(last.teams.map(t => [t.name, t.points]));
    const ptsDrv = new Map(last.drivers.map(d => [d.name, d.points]));
    const teams = [...teamNames].map(name => ({ id: idOf('team', name), name, teamColor: color(name), points: ptsTeam.get(name) ?? 0 }));
    const drivers = [...drv].map(([name, team]) => ({ id: idOf('driver', name), name, teamId: team ? idOf('team', team) : null, points: ptsDrv.get(name) ?? 0 }));

    // Calendar: rounds we have a recap for, placeholders for the rest (week slots in between).
    const known = new Map(races.map(r => [r.round, r]));
    const weekOf = rd => {
      if (known.has(rd) && known.get(rd).week != null) return known.get(rd).week;
      const prev = races.filter(r => r.round < rd && r.week != null).slice(-1)[0];
      return (prev ? prev.week : 0) + (rd - (prev ? prev.round : 0)) / 100;
    };
    const circuits = [];
    for (let rd = 1; rd <= total; rd++) {
      const r = known.get(rd);
      circuits.push({ name: r ? r.location : 'Round ' + rd, week: weekOf(rd), laps: r ? r.laps : null, flag: r ? flag(r.country) : '', eventType: 'race' });
    }

    // Teams run by players, per race: the race's own list, else the one before it.
    const roster = rosterCheck(league.roster, [...teamNames]).filter(p => p.match);
    let carry = roster.length ? roster.map(p => p.match) : Array.isArray(league.players) ? league.players : [];
    for (const r of races) { if (r.ownPlayers) carry = r.ownPlayers; r.players = carry.filter(n => teamNames.has(n)); }

    // Race results with team points per race (standings after − before).
    let prevTeams = null;
    const raceResults = races.map(r => {
      const before = r.teamsBefore.length ? new Map(r.teamsBefore.map(t => [t.name, t.points])) : prevTeams;
      const teamPoints = {};
      for (const t of r.teams) teamPoints[idOf('team', t.name)] = +(t.points - ((before && before.get(t.name)) || 0)).toFixed(2);
      prevTeams = new Map(r.teams.map(t => [t.name, t.points]));
      return {
        season, week: weekOf(r.round), circuit: { name: r.location, flag: flag(r.country) },
        results: r.cls.map((c, i) => ({ teamId: c.team ? idOf('team', c.team) : null, teamName: c.team, teamColor: color(c.team), position: c.pos || i + 1,
          startingPosition: c.start, status: c.out ? c.out : 'FINISHED', pitStops: c.stops, driverId: idOf('driver', c.driver), driverName: c.driver,
          totalTime: null, points: r.pts[c.driver] ?? null })),
        teamPoints, players: r.players.map(n => idOf('team', n))
      };
    });

    const files = {
      meta: { currentSeason: season, currentWeek: last.week, playerTeamId: mine ? idOf('team', mine) : null, playerTeamName: mine, teamColor: mine ? color(mine) : null,
        savedAt: last.added || null, customName: league.name || null, isMultiplayer: true },
      player: {},
      season: { currentSeason: season, currentWeek: last.week, circuits, raceResults, isSeasonFinished: last.round >= total },
      teams: { teams },
      drivers: { drivers },
      config: { generalData: { categoryName: league.category || null } },
      teamsCareer: null, driversCareer: null
    };
    return { files, races, last, season, players: last.players, roster, teams: teams.map(t => t.name).sort((a, b) => (ptsTeam.get(b) || 0) - (ptsTeam.get(a) || 0)) };
  }

  // A recap pasted twice, or a text that is not a recap.
  function check(league, text) {
    const p = parse(text);
    if (!p) return { ok: false, error: 'Not a race summary (no “=== Race summary — … ===” line).' };
    if (!p.round) return { ok: false, error: 'The recap has no “Round:” line in its Context.' };
    const dup = (league.recaps || []).some(r => { const q = parse(r.text); return q && q.key === p.key; });
    return { ok: true, parsed: p, replaces: dup };
  }

  return { parse, build, check, slug, idOf, parseRoster, formatRoster, rosterCheck };
});
