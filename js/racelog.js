/* DM Save Card — the whole race from the game's race recap ("=== Race summary — … ==="), told by a journalist.
   Two post types: raceboard (race report: start, cautions and their causes, retirements, the finish, the standings)
   and pitwall (strategy room: stop counts and what they gave, stops under caution, places won and lost in the pit lane).
   The teams to follow are the player teams (multiplayer, co-op) or the player's own team. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMRaceLog = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const KINDS = ['raceboard', 'pitwall'];
  const norm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\(#\s?\d+\)\s*$/, '').replace(/[^a-z0-9]/g, '');
  const last = n => String(n || '').trim().split(/\s+/).slice(-1)[0];

  // ------------------------------------------------------------ data
  function base(s, exp) {
    if (!exp || !exp.cls || !exp.cls.length) return null;
    const teamOf = new Map(exp.cls.map(c => [c.driver, c.team]));
    // teams to follow: player teams, else our own team
    const follow = new Map();
    for (const p of (s && s.players) || []) follow.set(norm(p.name || p.short), { short: p.short, player: p.player || null, color: p.color });
    if (!follow.size && s && s.focus) follow.set(norm(s.focus.name || s.focus.short), { short: s.focus.short, player: null, color: s.focus.color });
    const isF = team => follow.has(norm(team)) || [...follow.keys()].some(k => k && (norm(team).startsWith(k) || k.startsWith(norm(team))));
    const tag = team => { for (const [k, v] of follow) if (k && (norm(team) === k || norm(team).startsWith(k) || k.startsWith(norm(team)))) return v; return null; };
    // caution windows: deployed → green flag
    const cautions = [];
    let open = null;
    for (const e of exp.events) {
      if (/safety car deployed/i.test(e.text) && !/virtual/i.test(e.text)) { open = { from: e.lap, to: null, cause: null }; cautions.push(open);
        const before = exp.events.filter(x => (x.lap === e.lap || x.lap === e.lap - 1) && x !== e && !/safety car|green flag|lapped cars/i.test(x.text) && !x.sub);
        const c = before.reverse().find(x => /stage \d+ complete|shunt|crash|spin|contact|retire|debris|wall|stopped/i.test(x.text));
        open.cause = c ? c.text.replace(/[!.]+$/, '') : null; }
      else if (/green flag|racing resumes/i.test(e.text) && open && open.to == null) open.to = e.lap;
    }
    for (const c of cautions) if (c.to == null) c.to = Math.min(exp.laps, c.from + 4);
    const underCaution = lap => cautions.some(c => lap >= c.from && lap <= c.to);
    const stages = exp.events.filter(e => /stage (\d+) complete/i.test(e.text)).map(e => ({ lap: e.lap, n: +/stage (\d+)/i.exec(e.text)[1] }));
    return { exp, teamOf, isF, tag, cautions, underCaution, stages, laps: exp.laps, follow };
  }

  function pitwall(B, s) {
    const { exp } = B;
    const cars = exp.cls.map(c => {
      const pits = exp.pits.filter(p => p.driver === c.driver).map(p => ({ lap: p.lap, time: p.time, caution: B.underCaution(p.lap), delta: p.before != null && p.after != null ? p.before - p.after : null, from: p.from, to: p.to, botched: p.botched }));
      return { driver: c.driver, team: c.team, pos: c.pos, out: c.out, outLap: c.outLap, start: c.start, stops: c.stops != null ? c.stops : pits.length, pits,
        pitTime: +pits.reduce((a, p) => a + (p.time || 0), 0).toFixed(1), pitNet: pits.reduce((a, p) => a + (p.delta || 0), 0), follow: B.tag(c.team) };
    });
    const fin = cars.filter(c => !c.out && c.pos != null);
    const byStops = new Map();
    for (const c of fin) { const k = c.stops; if (!byStops.has(k)) byStops.set(k, []); byStops.get(k).push(c.pos); }
    const plans = [...byStops].map(([stops, ps]) => ({ stops, n: ps.length, avg: +(ps.reduce((a, x) => a + x, 0) / ps.length).toFixed(1), best: Math.min(...ps) })).sort((a, b) => a.stops - b.stops);
    const allPits = cars.flatMap(c => c.pits.map(p => Object.assign({ driver: c.driver, team: c.team, follow: c.follow }, p)));
    const clean = allPits.filter(p => p.time > 0.05 && !p.botched);
    const winner = fin.find(c => c.pos === 1) || null;
    const green = allPits.filter(p => !p.caution), yellow = allPits.filter(p => p.caution);
    const gain = allPits.filter(p => p.delta != null).sort((a, b) => b.delta - a.delta);
    const followed = cars.filter(c => c.follow);
    const rows = (followed.length ? followed : fin.slice(0, 8)).slice(0, 8);
    return { kind: 'pitwall', circuit: exp.circuit, laps: exp.laps, cautions: B.cautions, stages: B.stages, rows, plans, winner,
      common: plans.slice().sort((a, b) => b.n - a.n)[0] || null, bestPlan: plans.filter(p => p.n >= 2).sort((a, b) => a.avg - b.avg)[0] || null,
      stops: allPits.length, yellowShare: allPits.length ? Math.round(100 * yellow.length / allPits.length) : 0, greenStops: green.length,
      fastest: clean.length ? clean.reduce((a, b) => (b.time < a.time ? b : a)) : null, slowest: clean.length ? clean.reduce((a, b) => (b.time > a.time ? b : a)) : null,
      bestPit: gain[0] && gain[0].delta > 0 ? gain[0] : null, worstPit: gain.length && gain[gain.length - 1].delta < 0 ? gain[gain.length - 1] : null,
      followed: followed.length, season: s && s.season, category: s && s.category, round: s && s.last ? s.last.round : null };
  }

  function raceboard(B, s) {
    const { exp } = B;
    const fin = exp.cls.filter(c => !c.out && c.pos != null), outs = exp.cls.filter(c => c.out);
    const winner = fin[0] || null, p2 = fin[1] || null;
    const pole = exp.cls.find(c => c.start === 1) || null;
    const climb = fin.filter(c => c.start != null).sort((a, b) => (b.start - b.pos) - (a.start - a.pos))[0] || null;
    const fall = fin.filter(c => c.start != null).sort((a, b) => (a.start - a.pos) - (b.start - b.pos))[0] || null;
    // retirements with their cause from race direction
    const retired = outs.map(c => { const e = exp.events.slice().reverse().find(x => x.text.includes(c.driver) && (x.lap === c.outLap || /retire|shunt|crash/i.test(x.text)));
      const cause = e ? (/breakdown|engine|gearbox|failure|mechanical/i.test(e.text) ? 'mech' : /shunt|crash|wall/i.test(e.text) ? 'crash' : /contact|damage/i.test(e.text) ? 'contact' : 'other') : 'other';
      return { driver: c.driver, team: c.team, lap: c.outLap, cause, follow: B.tag(c.team) }; }).sort((a, b) => (a.lap || 0) - (b.lap || 0));
    const contacts = exp.events.filter(e => !e.sub && /make contact|contact with/i.test(e.text));
    // what happened to the teams we follow (incidents, not every wobble)
    const moments = exp.events.filter(e => !e.sub && /contact|spin|shunt|crash|retire|damag|puncture|flat-spot/i.test(e.text))
      .filter(e => [...B.teamOf].some(([d, t]) => B.tag(t) && e.text.includes(d))).slice(0, 6)
      .map(e => ({ lap: e.lap, text: e.text.replace(/[!.]+$/, ''), team: ([...B.teamOf].find(([d, t]) => B.tag(t) && e.text.includes(d)) || [])[1] }));
    // the standings: constructors before and after
    const st = exp.standings, tb = st && st.after.teams.length ? st : null;
    let leader = null, change = null, movers = [];
    if (tb) {
      const a = tb.after.teams, b = tb.before.teams, was = new Map(b.filter(x => x.points > 0).map(x => [x.name, x.pos]));
      leader = a[0] ? { team: a[0].name, points: a[0].points, gap: a[1] ? +(a[0].points - a[1].points).toFixed(1) : null, second: a[1] ? a[1].name : null } : null;
      const bl = b.filter(x => x.points > 0)[0];
      if (bl && a[0] && bl.name !== a[0].name) change = { from: bl.name, to: a[0].name };
      movers = a.filter(x => B.tag(x.name)).map(x => ({ team: x.name, pos: x.pos, was: was.get(x.name) || null, points: x.points }));
    }
    const followed = exp.cls.filter(c => B.tag(c.team)).map(c => ({ driver: c.driver, team: c.team, pos: c.pos, out: c.out, outLap: c.outLap, start: c.start, stops: c.stops, pts: c.pts, follow: B.tag(c.team) }));
    return { kind: 'raceboard', circuit: exp.circuit, laps: exp.laps, cautions: B.cautions, stages: B.stages, winner, margin: p2 ? (p2.gap != null ? p2.gap : null) : null, second: p2,
      top: fin.slice(0, 5), pole, climb: climb && climb.start - climb.pos >= 3 ? climb : null, fall: fall && fall.pos - fall.start >= 5 ? fall : null,
      retired, contacts: contacts.length, moments, leader, change, movers, followed, field: exp.cls.length,
      season: s && s.season, category: s && s.category, round: s && s.last ? s.last.round : null };
  }

  function view(kind, s, exp) {
    const B = base(s, exp);
    if (!B) return { kind, empty: true, season: s && s.season, category: s && s.category };
    return kind === 'pitwall' ? pitwall(B, s) : raceboard(B, s);
  }

  // ------------------------------------------------------------ text: a journalist in the press room
  const md = x => String(x == null ? '' : x).replace(/([\\*_~`|>])/g, '\\$1').replace(/@/g, '@\u200b');
  const fill = (t, v) => String(t).replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
  const pick = (a, seed) => a[Math.abs(seed | 0) % a.length];
  const dn = (c, f) => md(c.driver) + ' (' + md((f && f.player) || c.team) + ')';
  const W = {
    en: { none: 'Load the race recap (“=== Race summary — … ===”) to write this post.',
      rHead: '**RACE REPORT · {C}**', rSub: '-# {S} · {L} laps · {N} starters',
      win: ['{D} won at {C}, {M} ahead of {R}.', '{D} took the win at {C}, beating {R} by {M}.', 'Victory at {C} for {D}, {M} clear of {R}.'], winFrom: ' From P{S} on the grid.',
      pole: ['Polesitter {D} finished {P}.', '{D} started from pole and ended {P}.'],
      cautions0: 'Not a single caution: the race ran green from start to finish.', cautions: '{N} cautions slowed the field: {L}.', stageCaution: 'end of stage {S} (lap {A})', causeCaution: '{X} (lap {A})',
      out: '{N} cars did not finish: {L}.', outMech: '{N} with a mechanical failure', outCrash: '{N} after a crash', outContact: '{N} after contact',
      climb: 'Charge of the day: {D}, from P{S} to P{P}.', fall: 'Hard day for {D}: P{S} on the grid, P{P} at the flag.',
      follow: '**The teams to watch**', fRow: '{D} · {P}{F}{X}', fFrom: ' from P{S}', fStops: ', {N} stops', fOut: 'out on lap {L}',
      moments: '**Moments**', mRow: 'Lap {L}: {X}.',
      lead: '{T} leads the championship on {P} points, {G} ahead of {R}.', change: 'New championship leader: {T} takes over from {F}.', moved: '{T} is now P{P} in the championship{W}.', movedFrom: ' (was P{B})',
      pHead: '**STRATEGY ROOM · {C}**', pSub: '-# {S} · {L} laps · {N} pit stops',
      plan: '{D} won with a {N}-stop strategy.', common: 'Most of the field went for {N} stops ({K} cars).', paid: 'On average the {N}-stop cars finished best: P{A}.',
      yellow: '{Y}% of all stops came under caution; only {G} stops were made under green.', yellowAll: 'Every stop was made under caution.',
      bestPit: 'Best stop in the pit lane: {D} gained {N} places (lap {L}).', worstPit: 'Most expensive stop: {D} lost {N} places (lap {L}).',
      fast: 'Fastest stop: {D}, {T} s. Slowest: {E}, {U} s.',
      fRowP: '{D} · {P} · {N} stops ({L}){Y} · pit lane {G}', yAll: ', all under caution', yNone: ', all under green', ySome: ', {K} under caution', gUp: '+{N} places', gDn: '−{N} places', gEq: '±0' },
    nl: { none: 'Laad de racerecap (“=== Race summary — … ===”) om deze post te schrijven.',
      rHead: '**RACEVERSLAG · {C}**', rSub: '-# {S} · {L} ronden · {N} starters',
      win: ['{D} won op {C}, {M} voor {R}.', '{D} pakte de zege op {C} en hield {R} {M} achter zich.', 'Zege op {C} voor {D}, {M} voor {R}.'], winFrom: ' Vanaf P{S} op de grid.',
      pole: ['Polesitter {D} finishte als {P}.', '{D} startte vanaf pole en eindigde als {P}.'],
      cautions0: 'Geen enkele caution: de race bleef van start tot finish groen.', cautions: '{N} cautions remden het veld af: {L}.', stageCaution: 'einde stage {S} (ronde {A})', causeCaution: '{X} (ronde {A})',
      out: '{N} auto’s haalden de finish niet: {L}.', outMech: '{N} met pech', outCrash: '{N} na een crash', outContact: '{N} na contact',
      climb: 'Inhaalrace van de dag: {D}, van P{S} naar P{P}.', fall: 'Zware dag voor {D}: P{S} op de grid, P{P} bij de vlag.',
      follow: '**De teams om te volgen**', fRow: '{D} · {P}{F}{X}', fFrom: ' vanaf P{S}', fStops: ', {N} stops', fOut: 'uitgevallen in ronde {L}',
      moments: '**Momenten**', mRow: 'Ronde {L}: {X}.',
      lead: '{T} leidt het kampioenschap met {P} punten, {G} voor {R}.', change: 'Nieuwe leider in het kampioenschap: {T} neemt het over van {F}.', moved: '{T} staat nu P{P} in het kampioenschap{W}.', movedFrom: ' (was P{B})',
      pHead: '**STRATEGIEKAMER · {C}**', pSub: '-# {S} · {L} ronden · {N} pitstops',
      plan: '{D} won met {N} stops.', common: 'Het grootste deel van het veld koos {N} stops ({K} auto’s).', paid: 'Gemiddeld finishten de auto’s met {N} stops het best: P{A}.',
      yellow: '{Y}% van alle stops viel onder caution; maar {G} stops onder groen.', yellowAll: 'Elke stop viel onder caution.',
      bestPit: 'Beste stop in de pitstraat: {D} won {N} plekken (ronde {L}).', worstPit: 'Duurste stop: {D} verloor {N} plekken (ronde {L}).',
      fast: 'Snelste stop: {D}, {T} s. Traagste: {E}, {U} s.',
      fRowP: '{D} · {P} · {N} stops ({L}){Y} · pitstraat {G}', yAll: ', alles onder caution', yNone: ', alles onder groen', ySome: ', {K} onder caution', gUp: '+{N} plekken', gDn: '−{N} plekken', gEq: '±0' }
  };
  function text(kind, v, opts) {
    const lang = opts && opts.lang === 'nl' ? 'nl' : 'en', nl = lang === 'nl', w = W[lang], out = [];
    if (!v || v.empty) return w.none;
    const S0 = [v.category, v.season].filter(Boolean).join(' ') + (v.round ? ' · ' + (nl ? 'ronde ' : 'round ') + v.round : '');
    const res = c => (c.out ? (c.out === 'DNF' ? 'DNF' : c.out) : 'P' + c.pos);
    const sec = x => (x == null ? '' : (nl ? String(+x.toFixed(3)).replace('.', ',') : String(+x.toFixed(3))) + ' s');
    if (kind === 'raceboard') {
      out.push(fill(w.rHead, { C: md(v.circuit).toUpperCase() }), fill(w.rSub, { S: md(S0), L: v.laps, N: v.field }), '');
      const para = [];
      if (v.winner) { para.push(fill(pick(w.win, v.laps), { D: '**' + dn(v.winner) + '**', C: md(v.circuit), M: v.margin != null ? sec(v.margin) : (nl ? 'een ronde of meer' : 'a lap or more'), R: v.second ? dn(v.second) : '–' }));
        if (v.winner.start && v.winner.start > 1) para.push(fill(w.winFrom, { S: v.winner.start }).trim()); }
      if (v.pole && v.pole !== v.winner) para.push(fill(pick(w.pole, v.field), { D: dn(v.pole), P: res(v.pole) }));
      out.push(para.join(' '));
      const c2 = [];
      c2.push(v.cautions.length ? fill(w.cautions, { N: v.cautions.length, L: v.cautions.map(c => { const st = /stage (\d+)/i.exec(c.cause || '');
        return st ? fill(w.stageCaution, { S: st[1], A: c.from }) : c.cause ? fill(w.causeCaution, { X: md(c.cause), A: c.from }) : (nl ? 'ronde ' : 'lap ') + c.from; }).join('; ') }) : w.cautions0);
      if (v.retired.length) { const n = k => v.retired.filter(r => r.cause === k).length;
        const parts = [[n('mech'), w.outMech], [n('crash'), w.outCrash], [n('contact'), w.outContact]].filter(([k]) => k).map(([k, t]) => fill(t, { N: k }));
        c2.push(fill(w.out, { N: v.retired.length, L: parts.join(', ') || v.retired.map(r => md(last(r.driver))).join(', ') })); }
      if (v.climb) c2.push(fill(w.climb, { D: dn(v.climb), S: v.climb.start, P: v.climb.pos }));
      if (v.fall) c2.push(fill(w.fall, { D: dn(v.fall), S: v.fall.start, P: v.fall.pos }));
      out.push('', c2.join(' '));
      if (v.followed.length) {
        out.push('', w.follow);
        for (const c of v.followed.slice(0, 10)) out.push('- ' + fill(w.fRow, { D: dn(c, c.follow), P: c.out ? fill(w.fOut, { L: c.outLap || '?' }) : 'P' + c.pos, F: !c.out && c.start ? fill(w.fFrom, { S: c.start }) : '', X: c.stops != null ? fill(w.fStops, { N: c.stops }) : '' }));
      }
      if (v.moments.length) { out.push('', w.moments); for (const m of v.moments.slice(0, 5)) out.push('- ' + fill(w.mRow, { L: m.lap, X: md(m.text) })); }
      const c3 = [];
      if (v.change) c3.push(fill(w.change, { T: '**' + md(v.change.to) + '**', F: md(v.change.from) }));
      else if (v.leader && v.leader.second) c3.push(fill(w.lead, { T: md(v.leader.team), P: v.leader.points, G: v.leader.gap, R: md(v.leader.second) }));
      for (const m of v.movers.filter(m => !(v.leader && m.team === v.leader.team && m.pos === 1)).slice(0, 4)) c3.push(fill(w.moved, { T: md(m.team), P: m.pos, W: m.was && m.was !== m.pos ? fill(w.movedFrom, { B: m.was }) : '' }));
      if (c3.length) out.push('', c3.join(' '));
    } else {
      out.push(fill(w.pHead, { C: md(v.circuit).toUpperCase() }), fill(w.pSub, { S: md(S0), L: v.laps, N: v.stops }), '');
      const a = [];
      if (v.winner) a.push(fill(w.plan, { D: '**' + dn(v.winner) + '**', N: v.winner.stops }));
      if (v.common && v.common.n > 2) a.push(fill(w.common, { N: v.common.stops, K: v.common.n }));
      if (v.bestPlan && v.plans.length > 1) a.push(fill(w.paid, { N: v.bestPlan.stops, A: String(v.bestPlan.avg).replace('.', nl ? ',' : '.') }));
      out.push(a.join(' '));
      const b = [];
      if (v.cautions.length) b.push(v.greenStops ? fill(w.yellow, { Y: v.yellowShare, G: v.greenStops }) : w.yellowAll);
      if (v.bestPit) b.push(fill(w.bestPit, { D: dn(v.bestPit, v.bestPit.follow), N: v.bestPit.delta, L: v.bestPit.lap }));
      if (v.worstPit) b.push(fill(w.worstPit, { D: dn(v.worstPit, v.worstPit.follow), N: -v.worstPit.delta, L: v.worstPit.lap }));
      if (v.fastest && v.slowest && v.fastest !== v.slowest) b.push(fill(w.fast, { D: dn(v.fastest, v.fastest.follow), T: nl ? String(v.fastest.time).replace('.', ',') : v.fastest.time, E: dn(v.slowest, v.slowest.follow), U: nl ? String(v.slowest.time).replace('.', ',') : v.slowest.time }));
      if (b.length) out.push('', b.join(' '));
      if (v.followed) {
        out.push('', w.follow);
        for (const c of v.rows) { const k = c.pits.filter(p => p.caution).length;
          out.push('- ' + fill(w.fRowP, { D: dn(c, c.follow), P: c.out ? 'DNF' : 'P' + c.pos, N: c.stops, L: c.pits.map(p => (nl ? 'r' : 'L') + p.lap).join(', ') || '–',
            Y: !c.pits.length ? '' : k === c.pits.length ? w.yAll : !k ? w.yNone : fill(w.ySome, { K: k }),
            G: c.pitNet > 0 ? fill(w.gUp, { N: c.pitNet }) : c.pitNet < 0 ? fill(w.gDn, { N: -c.pitNet }) : w.gEq })); }
      }
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 2000);
  }

  const TOPIC = {
    raceboard: 'Topic: a race report from the press room, written as a journalist (third person, never "we"): the winner and margin, the polesitter, every caution with its cause, the retirements and why, the charge of the day, what happened to the teams to watch, and how the championship changed.',
    pitwall: 'Topic: the strategy story of the race, written as a journalist (third person, never "we"): the winning strategy, which number of stops paid off, stops under caution versus green, places won and lost in the pit lane, fastest and slowest stops, and the strategy of each team to watch.'
  };
  return { KINDS, view, text, TOPIC, base };
});
