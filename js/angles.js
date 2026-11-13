/* DM Save Card — story angles: which events are worth telling, and how much.
   Works like the "angles" of automated sports writing and the "story sifting" of emergent-narrative
   research: every angle has a condition on the journal events or the current state, a base importance,
   and gets extra weight when the outcome differs from what was expected (grid, board target, testing tips).
   A chapter takes the highest-scoring angle as its main story and a few others as side stories. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMAngles = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ctx = { snap (current), events (in scope), journal, race (DMReport facts, optional) }
  function candidates(ctx) {
    const { snap, events, journal } = ctx;
    if (!snap) return [];
    const T = snap.team, out = [];
    const add = (key, score, data, opts) => out.push(Object.assign({ key, score: +score.toFixed(2), data: data || {}, main: true, arc: null }, opts || {}));
    const of = type => events.filter(e => e.type === type);
    const races = of('race').sort((a, b) => a.round - b.round);
    const lastRace = races[races.length - 1] || null;
    const expected = T.expected || null;
    const total = snap.total || 1;
    const late = snap.champ ? 1 - snap.champ.left / total : snap.round / total;   // 0 at the start, 1 at the end

    // ---- the season frame
    for (const e of of('season_end')) {
      const champ = e.champion && e.champion.mine;
      if (!e.backfill) add(champ ? 'champions' : 'season_end', champ ? 15 : 12 + surprise(e.expected || expected, e.pos) * 2, e, { arc: 'season' });
    }
    for (const e of of('season_start')) add('season_start', 8, Object.assign({ last: (journal.seasons || []).slice(-1)[0] || null }, e), { arc: 'season' });
    for (const e of of('start')) add('start', snap.round ? 3 : 6, { expected, pos: T.pos, points: T.points, round: snap.round, people: snap.people.filter(p => p.role === 'driver').map(p => p.name) }, { arc: 'season' });
    if (!events.length && snap.preseason) add('season_start', 6, { expected, people: snap.people.filter(p => p.role === 'driver').map(p => p.name) }, { arc: 'season' });

    // ---- the race(s)
    if (lastRace) {
      const r = lastRace, sp = r.start, fp = r.pos;
      const gridSurprise = sp && fp ? Math.max(0, sp - fp) / 6 : 0;
      const target = expected && fp ? surprise(expected, fp) : 0;
      const extra = { name: r.name, cc: r.cc, round: r.round, start: sp, pos: fp, gain: r.gain, drivers: r.drivers, winner: r.winner, label: r.label, cars: r.cars,
        outLap: ctx.race && ctx.race.focus ? (ctx.race.focus.results.find(x => !x.finished) || {}).outLap || null : null,
        incident: ctx.race && ctx.race.focus ? (ctx.race.focus.results.find(x => !x.finished) || {}).incident || null : null };
      if (r.won) add('win', 9 + gridSurprise * 2 + target + (T.wins === 1 ? 3 : 0), Object.assign({ firstOfSeason: T.wins === 1 }, extra), { arc: 'results' });
      else if (r.finished && fp <= 3) add('podium', 5 + gridSurprise * 2 + target + (T.podiums === 1 ? 2 : 0), Object.assign({ firstOfSeason: T.podiums === 1 }, extra), { arc: 'results' });
      if (r.finished && r.gain >= 5 && !r.won) add('comeback', 4 + r.gain / 2, extra, { arc: 'results' });
      if (r.finished === false) add('heartbreak', (sp && sp <= 5 ? 7 : 4) + (r.cars.some(c => c.finished) ? -1 : 1), extra, { arc: 'results' });
      if (r.finished && r.gain != null && r.gain <= -4) add('bad_day', 3 + Math.abs(r.gain) / 3, extra, { arc: 'results' });
      if (r.finished && !r.won && fp > 3 && !(r.gain >= 5) && !(r.gain <= -4)) add('quiet', 1.5 + (expected && fp < expected ? 0.5 : 0), extra, { arc: 'results' });
      if (r.pole && !r.won) add('pole', 3, extra, { main: false, arc: 'results' });
    }
    if (races.length > 1) {
      const best = races.filter(r => r.finished).sort((a, b) => a.pos - b.pos)[0];
      if (best) add('race_digest', 2 + races.length * 0.3, { races: races.map(r => ({ round: r.round, name: r.name, label: r.label })), best: { name: best.name, label: best.label } }, { main: false, arc: 'results' });
    }

    // ---- streaks over the whole season (current state, not only new events)
    const season = (snap.races || []).map(r => {
      const b = r.mine.slice().sort((a, x) => (a.finished === x.finished ? (a.pos || 99) - (x.pos || 99) : a.finished ? -1 : 1))[0];
      return { round: r.round, pos: b && b.finished ? b.pos : null };
    });
    const tail = season.slice(-3);
    if (tail.length === 3 && tail.every(x => x.pos != null && x.pos <= 3)) add('streak_hot', 4 + (season.slice(-4).length === 4 && season.slice(-4).every(x => x.pos != null && x.pos <= 3) ? 1 : 0), { n: countTail(season, x => x.pos != null && x.pos <= 3) }, { arc: 'form', state: true });
    if (tail.length === 3 && tail.every(x => x.pos == null || x.pos > 10)) add('streak_cold', 4, { n: countTail(season, x => x.pos == null || x.pos > 10) }, { arc: 'form', state: true });

    // ---- championship
    for (const e of of('lead')) add(e.taken ? 'lead_taken' : 'lead_lost', e.taken ? 9 + late * 3 : 7, e, { arc: 'title' });
    for (const e of of('clinch')) add('clinch', 13, e, { arc: 'title' });
    for (const e of of('eliminated')) add('eliminated', 5 + late * 2, e, { arc: 'title' });
    const passes = of('pass');
    const up = passes.filter(e => e.up), down = passes.filter(e => !e.up);
    if (up.length) add('pass_up', 3.5 + (T.pos <= 3 ? 2 : 0) + up.length * 0.5, { teams: up.map(e => e.team), to: T.pos, gapBehind: T.gapBehind, behind: T.behind }, { arc: 'rival:' + up[up.length - 1].teamId });
    if (down.length) add('pass_down', 3 + down.length * 0.5, { teams: down.map(e => e.team), to: T.pos, gapAhead: T.gapAhead, ahead: T.ahead }, { arc: 'rival:' + down[0].teamId });
    for (const e of of('target')) add(e.to === 'behind' ? 'target_down' : 'target_up', e.to === 'behind' ? 4 : 5, e, { arc: 'target' });
    // Threads that stay open: title fight, a rival close by, the board target
    // A real title fight: still possible and the gap at most a third of what is left to win.
    if (snap.champ && snap.champ.alive && T.pos != null && T.pos > 1 && !snap.finished && late > 0.3 && T.leaderGap != null && T.leaderGap <= snap.champ.maxTeam / 3)
      add('title_fight', 3 + late * 4, { gap: T.leaderGap, left: snap.champ.left, max: snap.champ.maxTeam, pos: T.pos }, { main: false, arc: 'title', thread: true });
    if (snap.champ && T.pos === 1 && !snap.finished && !snap.champ.clinched) add('defend_lead', 3 + late * 4, { gap: T.gapBehind, behind: T.behind, left: snap.champ.left }, { main: false, arc: 'title', thread: true });
    if (!snap.finished && T.pos != null && T.gapAhead != null && T.gapAhead <= 10 && T.ahead) add('chase', 2.5 + (10 - T.gapAhead) / 5, { gap: T.gapAhead, team: T.ahead, pos: T.pos - 1 }, { main: false, arc: 'chase', thread: true });
    if (!snap.finished && T.pos != null && T.gapBehind != null && T.gapBehind <= 10 && T.behind) add('pressure', 2.5 + (10 - T.gapBehind) / 5, { gap: T.gapBehind, team: T.behind, pos: T.pos + 1 }, { main: false, arc: 'pressure', thread: true });

    // ---- people
    for (const e of of('career_first')) add('career_first', 11, e, { arc: 'person:' + e.name });
    for (const e of of('milestone')) add('milestone', 6, e, { arc: 'person:' + e.name });
    for (const e of of('injury')) add('injury', 5, e, { arc: 'person:' + e.name });
    for (const e of of('morale')) add(e.up ? 'morale_up' : 'morale_down', e.up ? 2 : 3, e, { main: false, arc: 'person:' + e.name });
    for (const e of of('rivalry')) add('rivalry', 3.5, e, { arc: 'rivalry:' + [e.name, e.other].sort().join('|') });
    for (const e of of('signing')) add('signing', 4, e, { arc: 'person:' + e.name });
    for (const e of of('departure')) add('departure', 4, e, { arc: 'person:' + e.name });
    for (const e of of('extension')) add('extension', 3, e, { arc: 'person:' + e.name });
    const drv = snap.people.filter(p => p.role === 'driver' && p.pos != null);
    if (drv.length >= 2) {
      const [a, b] = drv.slice().sort((x, y) => x.pos - y.pos);
      if (Math.abs((a.points || 0) - (b.points || 0)) <= 6) add('teammates', 2.5, { lead: a.name, other: b.name, gap: +((a.points || 0) - (b.points || 0)).toFixed(1) }, { main: false, arc: 'teammates', state: true });
    }
    const ending = snap.paddock ? snap.paddock.ending.filter(c => !c.staff) : [];
    if (ending.length && !snap.preseason && late >= 0.5) add('contract', 2.5 + late * 2, { names: ending.map(c => c.name), season: snap.season }, { main: false, arc: 'contract', thread: true });

    // ---- the factory
    const ups = of('upgrade');
    for (const u of ups) {
      if (u.success) add('upgrade_hit', 3 + (u.rankWas && u.rank && u.rank < u.rankWas ? 1.5 : 0), u, { arc: 'factory' });
      else add('upgrade_miss', 3 + (ups.filter(x => !x.success).length >= 2 ? 1.5 : 0), u, { arc: 'factory' });
    }
    if (snap.rnd && snap.rnd.gainRank === 1 && snap.rnd.fieldSize > 3 && snap.round >= 3) add('factory_best', 3.5, { of: snap.rnd.fieldSize }, { main: false, arc: 'factory', state: true });
    for (const d of of('dev_start')) add('dev_start', 1.5, d, { main: false, arc: 'factory' });

    // ---- paddock
    for (const e of of('paddock')) {
      const it = e.item || {};
      if (it.type === 'protest') add('protest', it.upheld ? 6 : 3.5, it, { main: !!it.upheld, arc: 'stewards' });
      else if (it.type === 'investigation') add('investigation', it.clean ? 2 : 4, it, { main: false, arc: 'stewards' });
      else if (it.type === 'techcheck') add('techcheck', 6, it, { arc: 'stewards' });
      else if (it.type === 'rebrand') add('rebrand', 3, it, { main: false, arc: 'identity' });
      else if (it.type === 'analyst' && !e.backfill) add('analyst', 2, it, { main: false, arc: 'analyst' });
    }
    // Testing tips against reality (once the season is under way)
    const tip = ((snap.paddock && snap.paddock.items) || []).find(i => i.type === 'analyst');
    if (tip && T.pos != null && snap.round >= 3) {
      const field = snap.field.length;
      if (tip.tip === 'behind' && T.pos <= Math.ceil(field / 2)) add('analyst_wrong', 3.5, { tip: tip.tip, pos: T.pos }, { main: false, arc: 'analyst' });
      if (tip.tip === 'strong' && T.pos > Math.ceil(field / 2)) add('analyst_wrong', 3.5, { tip: tip.tip, pos: T.pos }, { main: false, arc: 'analyst' });
    }

    // ---- the playthrough goal (new playthrough with a premise)
    const G = journal.series && journal.series.goal;
    if (G && G.type) {
      const st = journal.series.startSeason, n = G.seasons || 1, yr = snap.season, used = yr - st + 1;
      const ends = of('season_end').filter(e => !e.backfill && e.season >= st);
      for (const e of ends) {
        let done = null;
        if (G.type === 'title') done = e.pos === 1 ? true : e.season >= st + n - 1 ? false : null;
        else if (G.type === 'top') done = e.pos != null && e.pos <= G.pos ? true : e.season >= (G.by || st + n - 1) ? false : null;
        else if (G.type === 'target') done = e.expected ? e.pos <= e.expected : null;
        if (done === true) add('goal_done', 13, { goal: G, season: e.season, pos: e.pos }, { arc: 'goal' });
        if (done === false) add('goal_failed', 10, { goal: G, season: e.season, pos: e.pos }, { arc: 'goal' });
      }
      const doneBefore = (journal.events || []).some(e => e.type === 'season_end' && !e.backfill && e.season >= st && e.season < yr &&
        ((G.type === 'title' && e.pos === 1) || (G.type === 'top' && e.pos <= G.pos)));
      if (!doneBefore && !snap.finished) add('goal', 2.5 + late * 2, { goal: G, seasonNo: used, of: n, pos: T.pos, expected: T.expected, left: n - used, by: G.by || st + n - 1 }, { main: false, arc: 'goal', thread: true });
    }

    // Drivers the player follows get more attention.
    const focus = ((journal.series && journal.series.focus) || []).map(x => String(x).toLowerCase());
    if (focus.length) for (const c of out) {
      const blob = JSON.stringify(c.data || {}).toLowerCase();
      if (focus.some(f => blob.includes(f) || blob.includes(f.split(/\s+/).pop()))) { c.score = +(c.score + 1.5).toFixed(2); c.focus = true; }
    }

    // Variety and continuity: the same main story twice in a row is less interesting; an open storyline
    // from an earlier chapter that moves again is more interesting (callback).
    const chapters = journal.chapters || [];
    const prevCh = chapters[chapters.length - 1];
    // A state that stays true (best factory, a long streak) is news once: after that it only fills a side line.
    for (const c of out) {
      if (prevCh && prevCh.main === c.key) c.score = +(c.score * 0.7).toFixed(2);
      if (prevCh && c.thread && prevCh.cliff === c.key) c.score = +(c.score - 1.5).toFixed(2);
      if (prevCh && c.key === 'goal' && prevCh.cliff !== 'goal') c.score = +(c.score + 1.5).toFixed(2);
      if (c.state && chapters.some(ch => (ch.side || []).concat(ch.main || []).includes(c.key))) c.score = +(c.score * 0.5).toFixed(2);
      const back = c.arc && CALLBACK.test(c.arc) && chapters.slice().reverse().find(ch => ch.mainArc === c.arc);
      if (back && !c.thread) { c.callback = { no: back.no, title: back.title, main: back.main }; c.score = +(c.score + 0.5).toFixed(2); }
    }
    return out.sort((a, b) => b.score - a.score);
  }

  // Storylines worth a "this started in chapter N" line (not every race result or factory note).
  const CALLBACK = /^(rival:|title$|person:|rivalry:|contract$|target$|stewards$|season$|chase$|pressure$|goal$)/;

  // How much better (or worse) than expected: 0 = as expected, 1 = three places off or more.
  function surprise(expected, pos) { if (!expected || !pos) return 0; return Math.min(1, Math.abs(expected - pos) / 3); }
  function countTail(list, ok) { let n = 0; for (let i = list.length - 1; i >= 0 && ok(list[i]); i--) n++; return n; }

  // Main story, up to three side stories (other storylines), and the cliffhanger (an open thread).
  function select(cands, opts) {
    opts = opts || {};
    const main = cands.find(c => c.main) || null;
    const side = [], arcs = new Set(main && main.arc ? [main.arc] : []), keys = new Set(main ? [main.key] : []);
    for (const c of cands) {
      if (c === main || side.length >= (opts.side || 3)) continue;
      if (keys.has(c.key) || (c.arc && arcs.has(c.arc) && !c.thread)) continue;
      if (c.thread) continue;
      side.push(c); keys.add(c.key); if (c.arc) arcs.add(c.arc);
    }
    const threads = cands.filter(c => c.thread);
    const cliff = threads.find(c => !main || c.arc !== main.arc) || threads[0] || null;
    return { main, side, cliff, threads, arcs: [...new Set(cands.filter(c => c === main || side.includes(c)).map(c => c.arc).filter(Boolean))] };
  }

  return { candidates, select, surprise };
});
