/* DM Save Card — playthrough log: a lively first-person update as a player would write it,
   covering the race, the standings, the factory, the plan and what is still possible. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMDiary = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const md = x => String(x == null ? '' : x).replace(/([\\*_~`|>])/g, '\\$1').replace(/@/g, '@\u200b');
  const fillRaw = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
  function rng(seed) { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
  const last = n => String(n || '').trim().split(/\s+/).slice(-1)[0];
  const crew = d => (d || []).map(last).slice(0, 3).join('/');

  const W = {
    en: {
      head: '**{S} · week {W} · {T}**',
      lab: { race: 'The race', standings: 'Standings', factory: 'The factory', plan: 'The plan', chances: 'What is possible' },
      raceGreat: ['What a day at {C}. We started {S} with {D} and brought it home in {P}.', '{C} went better than I dared to hope: from {S} to {P} with {D}.'],
      raceWin: ['We won at {C}! We started {S} with {D} and nobody could stop us.', 'Victory at {C}. From {S} on the grid to the top step with {D}, flawless.'],
      raceOk: ['Solid weekend at {C}: we started {S} with {D} and finished {P}.', '{C} was a decent day at the office. {S} on the grid, {P} at the flag.'],
      raceBad: ['{C} hurt. We started {S} with {D} but dropped to {P}.', 'Not our weekend at {C}: from {S} back to {P}.'],
      raceOut: ['{C} was a disaster: we did not make the finish with {D}{L}.', 'Pain at {C}. Started {S}, out of the race{L}.'],
      stops: [' We made {N} {X}.', ' {N} {X} in the pits.'], winner: ' {W} won the race{F}.', events: ' The race had {X}.',
      stOn: ['We are P{P} with {N} points', 'In the championship we sit P{P} on {N} points'], stLead: ', {X} clear at the top. Now we have to defend it.', stChase: ', {X} behind P{Q} ({R}).',
      stMove: ' That is {M} since the last race.', up: 'up from P{B}', down: 'down from P{B}', drv: ' {D} is {Q} in the drivers’ standings.',
      fOk: 'In the factory {A} of {B} upgrades worked this season.', fNone: 'Nothing developed yet this season.',
      fLast: ' Last one: {N} {R}.', fGood: 'worked ({X})', fBad: 'failed', fStrong: ' Our strongest area is {N} (#{R} of {O}),', fWeak: ' the weakest {N} (#{R}).',
      fBusy: ' {N} is in the works, ready in week {W}.',
      planNext: 'Next stop: {C} (round {R}).', planTarget: ' The board wants P{T}; ', tAhead: ['we are ahead of that, so I can take some risks.', 'we are ahead of schedule, time to gamble a bit on strategy.'], tOn: 'we are exactly on target, no room for mistakes.', tBehind: ['we are behind, so points come first.', 'we are not there yet, so every point counts.'],
      planFix: ' In the factory {N} gets priority.', planFactory: ' Development first: {N} has to come up.',
      chLeft: 'With {L} rounds left we can score up to {M} more points', chLead: ['. The title is ours to lose.', '. Nobody is going to take this away from us without a fight.'], chTitle: [', so the title is still in reach.', '. Mathematically everything is still open, and I am not giving up on it.'], chOut: '. The title is out of reach; ',
      chAim: 'P{Q} is the realistic aim ({X} points away).', chDefend: ' The gap to P{Q} behind us is only {X}.', chContract: ' And I need to decide on {N}: contract ends this season.',
      done: 'The season is over: P{P} with {N} points.', pre: 'Pre-season. Target P{T}, first race {C}.'
    },
    nl: {
      head: '**{S} · week {W} · {T}**',
      lab: { race: 'De race', standings: 'Klassement', factory: 'De fabriek', plan: 'Het plan', chances: 'Wat er nog kan' },
      raceGreat: ['Wat een dag op {C}. We startten als {S} met {D} en brachten hem als {P} binnen.', '{C} ging beter dan ik had durven hopen: van {S} naar {P} met {D}.'],
      raceWin: ['We hebben gewonnen op {C}! We startten als {S} met {D} en niemand kon ons stoppen.', 'Zege op {C}. Van {S} op de grid naar de hoogste trede met {D}, foutloos.'],
      raceOk: ['Degelijk weekend op {C}: we startten als {S} met {D} en finishten als {P}.', '{C} was een prima werkdag. {S} op de grid, {P} bij de finish.'],
      raceBad: ['{C} deed pijn. We startten als {S} met {D} maar zakten naar {P}.', 'Niet ons weekend op {C}: van {S} terug naar {P}.'],
      raceOut: ['{C} was een drama: met {D} haalden we de finish niet{L}.', 'Pijn op {C}. Gestart als {S}, uitgevallen{L}.'],
      stops: [' We stopten {N} keer.', ' {N} {X} in de pits.'], winner: ' {W} won de race{F}.', events: ' De race kende {X}.',
      stOn: ['We staan P{P} met {N} punten', 'In het kampioenschap staan we op P{P} met {N} punten'], stLead: ', {X} voorsprong. Nu moeten we het vasthouden.', stChase: ', {X} achter P{Q} ({R}).',
      stMove: ' Dat is {M} na de vorige race.', up: 'omhoog van P{B}', down: 'omlaag van P{B}', drv: ' {D} staat {Q} bij de coureurs.',
      fOk: 'In de fabriek zijn dit seizoen {A} van {B} upgrades gelukt.', fNone: 'Dit seizoen nog niets ontwikkeld.',
      fLast: ' De laatste: {N} {R}.', fGood: 'gelukt ({X})', fBad: 'mislukt', fStrong: ' Ons sterkste punt is {N} (#{R} van {O}),', fWeak: ' het zwakste {N} (#{R}).',
      fBusy: ' {N} staat in de fabriek, klaar in week {W}.',
      planNext: 'Volgende stop: {C} (ronde {R}).', planTarget: ' Het bestuur wil P{T}; ', tAhead: ['daar zitten we boven, dus ik kan wat risico nemen.', 'we lopen voor op schema, tijd om wat te gokken met de strategie.'], tOn: 'we zitten precies op koers, geen ruimte voor fouten.', tBehind: ['we zitten eronder, dus punten pakken gaat voor.', 'daar zijn we nog niet, dus elk punt telt.'],
      planFix: ' In de fabriek krijgt {N} voorrang.', planFactory: ' Eerst ontwikkelen: {N} moet omhoog.',
      chLeft: 'Met nog {L} ronden te gaan kunnen we maximaal {M} punten pakken', chLead: ['. De titel is van ons om te verliezen.', '. Niemand pakt dit zonder gevecht van ons af.'], chTitle: [', dus de titel is nog haalbaar.', '. Rekenkundig ligt alles nog open, en ik geef het niet op.'], chOut: '. De titel is buiten bereik; ',
      chAim: 'P{Q} is het realistische doel ({X} punten weg).', chDefend: ' Het gat met P{Q} achter ons is maar {X}.', chContract: ' En ik moet beslissen over {N}: contract loopt af na dit seizoen.',
      done: 'Het seizoen zit erop: P{P} met {N} punten.', pre: 'Voorseizoen. Doel P{T}, eerste race {C}.'
    }
  };

  // D = { s, race (DMReport.facts), champ, rnd, paddock }
  function write(D, opts) {
    opts = opts || {};
    const lang = W[opts.lang] ? opts.lang : 'en', w = W[lang], s = D.s, f = s.focus;
    if (!f) return '';
    const r = rng([s.season, s.rounds.done, opts.variant || 0, lang, 'diary'].join('|'));
    const pick = a => (Array.isArray(a) ? a[Math.floor(r() * a.length)] : a);
    const fill = (t, v) => fillRaw(pick(t), v);
    const pts = n => (lang === 'nl' ? (n === 1 ? ' punt' : ' punten') : (n === 1 ? ' point' : ' points'));
    const num = n => { if (n == null) return '–'; const t = Number.isInteger(n) ? String(n) : (+n).toFixed(1); return lang === 'nl' ? t.replace('.', ',') : t; };
    const pos = n => (lang === 'nl' ? 'P' + n : (n % 100 >= 11 && n % 100 <= 13 ? n + 'th' : n + (['th', 'st', 'nd', 'rd'][n % 10] || 'th')));
    const out = [fill(w.head, { S: s.category ? md(s.category) + ' ' + s.season : s.season, W: s.week, T: md(f.short) })];
    const para = (key, text) => { if (text && text.trim()) out.push('', '**' + w.lab[key] + ':** ' + text.trim()); };

    if (s.preseason) {
      out.push('', fill(w.pre, { T: f.expected || '?', C: s.next ? md(s.next.name) : '–' }));
    }
    // The race
    const F = D.race;
    if (F && F.focus && F.focus.results.length) {
      const best = F.focus.results.slice().sort((a, b) => (a.finished === b.finished ? a.position - b.position : a.finished ? -1 : 1))[0];
      const v = { C: md(F.circuit), D: md(crew(best.drivers)), S: pos(best.start || 0), P: pos(best.position || 0),
        L: best.outLap ? (lang === 'nl' ? ' (ronde ' + best.outLap + ')' : ' (lap ' + best.outLap + ')') : '' };
      const g = best.start != null && best.position != null ? best.start - best.position : 0;
      let t = !best.finished ? pick(w.raceOut) : F.winner && F.winner.isFocus ? pick(w.raceWin) : (g >= 5 || best.position <= 3) ? pick(w.raceGreat) : g < -3 ? pick(w.raceBad) : pick(w.raceOk);
      t = fill(t, v);
      if (!best.finished && best.incident) t += ' ' + md(best.incident.replace(/\.?$/, '.'));
      if (best.stops) t += fill(w.stops, { N: best.stops, X: best.stops === 1 ? 'stop' : 'stops' });
      if (F.winner && !F.winner.isFocus) t += fill(w.winner, { W: md(F.winner.team), F: F.winner.start ? (lang === 'nl' ? ' vanaf P' + F.winner.start : ' from ' + pos(F.winner.start)) : '' });
      if (F.export) { const E = F.export, bits = []; if (E.sc) bits.push(E.sc + ' SC'); if (E.vsc) bits.push(E.vsc + ' VSC'); if (E.red) bits.push(E.red + (lang === 'nl' ? ' rode vlag' : ' red flag'));
        if (bits.length) t += fill(w.events, { X: bits.join(', ') }); }
      para('race', t);
    }
    // Standings
    if (f.pos != null && !s.preseason) {
      let t = fill(w.stOn, { P: f.pos, N: num(f.points) });
      if (f.pos === 1) t += fill(w.stLead, { X: num(f.gapBehind || 0) }).replace(/^, 0 /, ', ');
      else t += fill(w.stChase, { X: num(f.gapAhead || 0), Q: f.pos - 1, R: md(f.ahead || '') });
      const B = s.last && s.last.before && s.last.before.focus;
      if (B && B !== f.pos) t += fill(w.stMove, { M: fill(B > f.pos ? w.up : w.down, { B }) });
      const d = (f.drivers || []).slice().sort((a, b) => (a.pos || 99) - (b.pos || 99))[0];
      if (d && d.pos && (f.drivers || []).length && s.drivers.length > s.teams.length) t += fill(w.drv, { D: md(d.name), Q: pos(d.pos) });
      if (s.finished) t = fill(w.done, { P: f.pos, N: num(f.points) });
      para('standings', t);
    }
    // Factory
    const R = D.rnd;
    if (R) {
      let t = R.done ? fill(w.fOk, { A: R.successes, B: R.done }) : w.fNone;
      const u = R.upgrades[0];
      if (u) t += fill(w.fLast, { N: (lang === 'nl' ? (R.attrs.find(a => a.key === u.key) || {}).nl || u.name : u.name).toLowerCase(), R: u.success ? fill(w.fGood, { X: u.to != null && u.from != null ? '+' + num(+(u.to - u.from).toFixed(2)) : '' }) : w.fBad });
      const best = R.attrs.slice().sort((a, b) => a.rank - b.rank)[0], worst = R.attrs.slice().sort((a, b) => b.rank - a.rank)[0];
      const nm = a => (lang === 'nl' ? a.nl : a.label).toLowerCase();
      if (best && worst && best !== worst) t += fill(w.fStrong, { N: nm(best), R: best.rank, O: best.of }) + fill(w.fWeak, { N: nm(worst), R: worst.rank });
      const busy = R.inProgress[0];
      if (busy) t += fill(w.fBusy, { N: lang === 'nl' ? ((R.attrs.find(a => a.key === busy.key) || {}).nl || busy.name) : busy.name, W: busy.ready });
      para('factory', t);
    }
    // Plan
    if (!s.finished) {
      let t = s.next ? fill(w.planNext, { C: md(s.next.name), R: s.next.round }) : '';
      if (f.expected && f.pos && !s.preseason) t += fill(w.planTarget, { T: f.expected }) + pick(f.pos < f.expected ? w.tAhead : f.pos === f.expected ? w.tOn : w.tBehind);
      const worst = R ? R.attrs.slice().sort((a, b) => b.rank - a.rank)[0] : null;
      if (worst && worst.rank > Math.ceil(worst.of / 2)) t += fill(R && R.inProgress.some(d => d.key === worst.key) ? w.planFix : w.planFactory, { N: (lang === 'nl' ? worst.nl : worst.label).toLowerCase() });
      para('plan', t);
    }
    // What is possible
    const C = D.champ;
    if (C && !C.finished && !C.preseason && f.pos != null) {
      const me = C.teams.find(x => x.mine);
      const cars = F && F.focus && F.focus.results.length ? F.focus.results.length : 1;
      const maxOwn = Math.min(C.maxTeam, C.maxDriver * cars);
      let t = fill(w.chLeft, { L: C.left, M: num(maxOwn) });
      if (me && f.pos === 1) t += pick(w.chLead);
      else if (me && me.alive) t += pick(w.chTitle);
      else if (me) { const aim = C.teams.find(x => x.pos === Math.max(1, f.pos - 1)); t += w.chOut + fill(w.chAim, { Q: aim ? aim.pos : f.pos, X: num(aim ? +(aim.points - f.points).toFixed(1) : 0) }); }
      if (f.gapBehind != null && f.gapBehind <= 10 && f.behind) t += fill(w.chDefend, { Q: f.pos + 1, X: num(f.gapBehind) + pts(f.gapBehind) });
      const end = D.paddock && D.paddock.ending.find(c => c.role === 'driver') || (D.paddock && D.paddock.ending[0]);
      if (end) t += fill(w.chContract, { N: md(end.name) });
      para('chances', t);
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 2000);
  }

  // Facts for the AI version of the playthrough log.
  function facts(D) {
    const s = D.s, f = s.focus || {};
    return {
      game: 'Delta Manager (motorsport management game)', category: s.category, season: s.season, week: s.week, round: s.rounds.done, totalRounds: s.rounds.total,
      team: f.short, championshipPosition: f.pos, points: f.points, gapToTeamAhead: f.gapAhead, teamAhead: f.ahead, gapToTeamBehind: f.gapBehind, teamBehind: f.behind,
      positionBeforeLastRace: s.last && s.last.before ? s.last.before.focus : null, targetPosition: f.expected, seasonWins: f.wins, seasonPodiums: f.podiums,
      drivers: (f.drivers || []).map(d => ({ name: d.name, standing: d.pos })), lastRace: D.race || undefined,
      factory: D.rnd ? { upgradesWorked: D.rnd.successes, upgradesTried: D.rnd.done, lastUpgrades: D.rnd.upgrades.slice(0, 4), inProgress: D.rnd.inProgress,
        ranks: D.rnd.attrs.map(a => ({ area: a.label, value: a.value, rank: a.rank, of: a.of })) } : undefined,
      title: D.champ ? { roundsLeft: D.champ.left, maxPointsLeftPerTeam: D.champ.maxTeam, teamsStillInContention: D.champ.contenders, stillInContention: (D.champ.teams.find(x => x.mine) || {}).alive } : undefined,
      contractsEndingThisSeason: D.paddock ? D.paddock.ending.map(c => ({ name: c.name, role: c.role })) : undefined,
      nextRace: s.next ? { circuit: s.next.name, round: s.next.round } : null
    };
  }
  const TOPIC = 'Write it as a playthrough log by the player, in the first person as the team manager ("I", and "we" for the team): what happened in the race, where we stand in the standings, what the factory did, my plan for the next races and what is still possible this season. Lively and personal, honest about setbacks, like a let\'s-play update. Use short paragraphs that start with a bold label (Race, Standings, Factory, Plan, What is possible). No hashtags.';

  return { write, facts, TOPIC };
});
