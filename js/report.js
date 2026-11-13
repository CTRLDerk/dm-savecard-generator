/* DM Save Card — race report: a short written summary of the last race (EN/NL).
   Facts come from the save (always) and, when loaded, from the game's race summary export
   (safety cars, red flags, retirements with lap, penalties, pit stops). Wording varies per race,
   but the same race and variant always give the same text. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMReport = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ------------------------------------------------------------ race summary export
  const DASH = '[—–-]';
  const RX = {
    head: new RegExp('=+\\s*Race summary\\s*' + DASH + '\\s*(.+?)\\s*\\((\\d+)\\s*laps?\\)\\s*=+', 'i'),
    cls: new RegExp('^(?:P(\\d+)|(DNF|DSQ|NC|DNS))\\.?\\s+(.+?)\\s+' + DASH + '\\s+(.*)$'),
    pit: new RegExp('^Lap\\s+(\\d+)\\s+' + DASH + '\\s+(.+?):\\s+(.+?),\\s*([\\d.]+)\\s*s', 'i'),
    ev: new RegExp('^Lap\\s+(\\d+)\\s+' + DASH + '\\s+(.*)$', 'i')
  };

  function parseExport(text) {
    text = String(text || '').replace(/\r/g, '');
    const m = RX.head.exec(text);
    if (!m) return null;
    const out = { circuit: m[1].trim(), laps: +m[2], cls: [], pits: [], events: [] };
    let section = '';
    for (const line of text.split('\n')) {
      const s = line.trim();
      if (s.startsWith('## ')) { section = s.slice(3).toLowerCase(); continue; }
      if (!s) continue;
      if (section.startsWith('final classification')) {
        const c = RX.cls.exec(s); if (!c) continue;
        const who = /^(.+?)\s+\((.+)\)$/.exec(c[3].trim());
        const rest = c[4];
        const dnf = /\b(DNF|DSQ|DNS|NC)\b(?:\s*\(Lap\s*(\d+)\))?/i.exec(rest) || (c[2] ? [c[2], c[2]] : null);
        const gapS = /\+\s*(?:(\d+):)?(\d+(?:\.\d+)?)\s*s\b/.exec(rest), gapL = /\+\s*(\d+)\s*laps?\b/i.exec(rest);
        out.cls.push({ pos: c[1] ? +c[1] : null, driver: who ? who[1] : c[3].trim(), team: who ? who[2] : '',
          start: (/started\s+P(\d+)/i.exec(rest) || [])[1] ? +/started\s+P(\d+)/i.exec(rest)[1] : null,
          stops: (/(\d+)\s*stop/i.exec(rest) || [])[1] != null ? +/(\d+)\s*stop/i.exec(rest)[1] : null,
          out: dnf ? dnf[1].toUpperCase() : null, outLap: dnf && dnf[2] ? +dnf[2] : null,
          gap: gapS ? (gapS[1] ? +gapS[1] * 60 : 0) + +gapS[2] : null, lapsDown: gapL ? +gapL[1] : null });
      } else if (section.startsWith('pit stop')) {
        const p = RX.pit.exec(s); if (!p) continue;
        out.pits.push({ lap: +p[1], driver: p[2].trim(), what: p[3].trim(), time: +p[4], botched: /botch/i.test(s), fuel: /^fuel/i.test(p[3].trim()) });
      } else if (section.startsWith('race direction')) {
        const e = RX.ev.exec(s); if (e) out.events.push({ lap: +e[1], text: e[2].trim() });
      }
    }
    const ev = out.events.map(e => e.text);
    out.sc = ev.filter(t => /safety car deployed/i.test(t) && !/virtual/i.test(t)).length;
    out.vsc = ev.filter(t => /virtual safety car/i.test(t) && !/(end|ending|withdrawn|green)/i.test(t)).length;
    out.red = ev.filter(t => /red flag/i.test(t) && !/(resum|restart|lifted)/i.test(t)).length;
    out.penalties = ev.filter(t => /penalt/i.test(t)).length;
    out.botched = out.pits.filter(p => p.botched).length;
    const real = out.pits.filter(p => p.time > 0.05 && !p.fuel && !p.botched);   // fastest = a clean tyre stop
    out.fastestPit = real.length ? real.reduce((a, b) => (b.time < a.time ? b : a)) : null;
    return out;
  }

  // ------------------------------------------------------------ facts
  // One plain object with everything the text needs; also what the AI prompt receives.
  function facts(s, exp) {
    const L = s.last; if (!L) return null;
    const f = s.focus;
    const match = exp && sameTrack(exp.circuit, L.name);
    const useExp = exp && match;
    const teamOf = name => { const c = L.cars.find(x => x.drivers.includes(name)); return c ? c.team : null; };
    const winner = L.cars.find(c => c.position === 1 && c.finished) || L.cars[0];
    const second = L.cars.find(c => c.position === 2 && c.finished);
    let margin = null, lapsDown = null;
    if (useExp) { const p2 = exp.cls.find(c => c.pos === 2); if (p2) { margin = p2.gap; lapsDown = p2.lapsDown; } }
    if (margin == null && lapsDown == null && winner && second && winner.time && second.time) margin = +(second.time - winner.time).toFixed(1);
    const finished = L.cars.filter(c => c.finished && c.start != null);
    const climber = finished.slice().sort((a, b) => (b.start - b.position) - (a.start - a.position))[0];
    const poleCar = L.cars.find(c => c.start === 1);
    const outCars = L.cars.filter(c => !c.finished);
    const mine = (L.mine || []).map(m => {
      const o = Object.assign({}, m);
      if (useExp && !m.finished) {
        const row = exp.cls.find(c => m.drivers.includes(c.driver) && c.outLap);
        if (row) o.outLap = row.outLap;
        const inc = exp.events.find(e => m.drivers.some(d => e.text.includes(d)) && /(spin|damag|crash|collision|retire|puncture|failure|engine|gearbox)/i.test(e.text));
        if (inc) { o.incident = inc.text; o.incidentLap = inc.lap; }
      }
      return o;
    });
    return {
      round: L.round, circuit: L.name, laps: useExp ? exp.laps : null, season: s.season, category: s.category,
      totalRounds: s.rounds.total, focusRole: f ? f.role : null,
      focus: f ? { team: f.short, name: f.name, results: mine, wins: f.wins, podiums: f.podiums,
        pos: f.pos, tied: f.tied, points: f.points, gained: L.before ? L.before.gained : null, posBefore: L.before ? L.before.focus : null,
        gapAhead: f.gapAhead, ahead: f.ahead, gapBehind: f.gapBehind, behind: f.behind, expected: f.expected } : null,
      winner: winner ? { team: winner.team, drivers: winner.drivers, start: winner.start, isFocus: !!(f && winner.teamId === f.id) } : null,
      runnerUp: second ? { team: second.team, drivers: second.drivers } : null,
      margin, lapsDown,
      pole: poleCar ? { team: poleCar.team, finish: poleCar.finished ? poleCar.position : null, status: poleCar.status, isWinner: poleCar === winner } : null,
      climber: climber && climber.start - climber.position >= 3 ? { team: climber.team, drivers: climber.drivers, from: climber.start, to: climber.position } : null,
      retirements: outCars.length, retired: outCars.slice(0, 3).map(c => c.team),
      leader: s.teams[0] ? { team: s.teams[0].short, points: s.teams[0].points } : null,
      next: s.next ? { circuit: s.next.name, round: s.next.round, week: s.next.week } : null,
      export: useExp ? { sc: exp.sc, vsc: exp.vsc, red: exp.red, penalties: exp.penalties, botched: exp.botched,
        fastestPit: exp.fastestPit ? { driver: exp.fastestPit.driver, team: teamOf(exp.fastestPit.driver), time: exp.fastestPit.time } : null } : null,
      exportMismatch: exp && !match ? exp.circuit : null
    };
  }
  const norm = n => String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  function sameTrack(a, b) { a = norm(a); b = norm(b); return !!a && !!b && (a === b || a.includes(b) || b.includes(a)); }

  // ------------------------------------------------------------ wording
  function rng(seed) { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
  const num = n => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const crew = d => { const names = (d || []).map(n => String(n).trim().split(/\s+/).slice(-1)[0]); return names.length > 3 ? names.slice(0, 3).join('/') + '…' : names.join('/'); };
  const md = x => String(x == null ? '' : x).replace(/([\\*_~`|>])/g, '\\$1').replace(/@/g, '@\u200b');

  const W = {
    en: {
      h: { win: ['Victory for {T} at {C}', '{T} takes the win at {C}', '{C}: {T} on top'], winBack: ['{T} wins from P{S} at {C}', 'From P{S} to victory: {T} at {C}'],
        podium: ['Podium for {T} at {C}', '{T} on the podium at {C}'], pts: ['{W} wins at {C}, P{P} for {T}', '{C}: {W} wins, {T} P{P}'],
        out: ['Retirement for {T} at {C}', 'Bad day for {T} at {C}'], other: ['{W} wins at {C}'] },
      win: ['{D} won the race for {W}{G}{M}.', '{W} took the win{G}{M}, with {D} at the wheel.', 'The win went to {W} ({D}){G}{M}.'],
      oneTwo: [' A one-two for {W}.', ' {W} finished first and second.'],
      margin: [', {X} s ahead of {R}', ', {X} s clear of {R}'], marginLaps: [', a lap or more ahead of the rest'], close: [' by just {X} s from {R}'],
      fromPole: [' from pole', ' after starting on pole'], fromGrid: [' after starting P{S}', ' from P{S} on the grid'],
      me: ['{T} finished P{P}{G}{N}.', 'For {T} it was P{P}{G}{N}.'], gainUp: [' after starting P{S}, {X} places gained', ', up from P{S} on the grid'],
      gainDown: [' after starting P{S}'], gainSame: [' from P{S} on the grid'], stops: [' with {N} stops', ', {N} stops'],
      meOut: ['{T} did not finish{L}{I}.', 'The race ended early for {T}{L}{I}.'], outLap: [' (lap {L})'], incident: [' after this: “{X}”'],
      winCount: [' It is win number {N} of the season.', ' That makes {N} wins this season.'],
      events: ['The race saw {X}.', 'Race control was busy: {X}.'], sc: ['safety car', 'safety cars'], vsc: ['virtual safety car', 'virtual safety cars'], red: ['red flag', 'red flags'],
      quiet: ['A clean race without safety cars.'], dnf: ['{N} cars retired.', '{N} retirements.'], dnf1: ['One car retired.'],
      climber: ['Biggest climber: {T}, from P{F} to P{P}.', '{T} gained the most places, from P{F} to P{P}.'],
      pole: ['Polesitter {T} finished P{P}.', '{T} started from pole and ended P{P}.'], poleOut: ['Polesitter {T} did not finish.'],
      pen: ['{N} penalties were handed out.'], pen1: ['One penalty was handed out.'], botched: ['{N} pit stops went wrong.'], botched1: ['One pit stop went wrong.'],
      fastPit: ['Fastest stop: {T}, {X} s.'],
      champLead: ['{T} leads the championship with {P} points, {X} ahead of {R}.', 'In the standings {T} is on top: {P} points, +{X} over {R}.'],
      champLeadLevel: ['{T} shares the championship lead on {P} points.'],
      champOther: ['In the championship {T} is P{Q} with {P} points, {X} behind {R}.', '{T} sits P{Q} in the standings, {X} points behind {R}.'],
      champLevel: ['In the championship {T} is P{Q} with {P} points, level with {R}.'],
      moved: [' (up from P{B})', ' (was P{B})'], dropped: [' (down from P{B})'],
      next: ['Next up: {C}, round {R}.', 'Next: round {R} at {C}.'], last: ['That was the final round of the season.'],
      foot: 'Race report', src: { exp: 'race export', save: 'save data' }, mismatch: 'The loaded race export is for {X}, not for this race; it was not used.'
    },
    nl: {
      h: { win: ['Zege voor {T} op {C}', '{T} wint op {C}', '{C}: {T} de sterkste'], winBack: ['{T} wint vanaf P{S} op {C}', 'Van P{S} naar de zege: {T} op {C}'],
        podium: ['Podium voor {T} op {C}', '{T} op het podium op {C}'], pts: ['{W} wint op {C}, P{P} voor {T}', '{C}: zege voor {W}, {T} P{P}'],
        out: ['Uitvaller voor {T} op {C}', 'Zware dag voor {T} op {C}'], other: ['{W} wint op {C}'] },
      win: ['{D} won de race voor {W}{G}{M}.', '{W} pakte de zege{G}{M}. Achter het stuur: {D}.', 'De zege ging naar {W} ({D}){G}{M}.'],
      oneTwo: [' Een één-twee voor {W}.', ' {W} werd eerste en tweede.'],
      margin: [', {X} s voor {R}', ', met {X} s voorsprong op {R}'], marginLaps: [', een ronde of meer voor de rest'], close: [' met maar {X} s voorsprong op {R}'],
      fromPole: [' vanaf pole', ' na een start vanaf pole'], fromGrid: [' na een start vanaf P{S}', ' vanaf P{S} op de grid'],
      me: ['{T} finishte als P{P}{G}{N}.', 'Voor {T} werd het P{P}{G}{N}.'], gainUp: [' na een start vanaf P{S}, {X} plaatsen gewonnen', ', vanaf P{S} op de grid'],
      gainDown: [' na een start vanaf P{S}'], gainSame: [' vanaf P{S} op de grid'], stops: [' met {N} stops', ', {N} stops'],
      meOut: ['{T} haalde de finish niet{L}{I}.', 'De race was vroeg voorbij voor {T}{L}{I}.'], outLap: [' (ronde {L})'], incident: [' na dit moment: “{X}”'],
      winCount: [' Het is zege nummer {N} dit seizoen.', ' Daarmee staat de teller op {N} zeges dit seizoen.'],
      events: ['De race kende {X}.', 'Druk voor de wedstrijdleiding: {X}.'], sc: ['safety car', 'safety cars'], vsc: ['virtual safety car', 'virtual safety cars'], red: ['rode vlag', 'rode vlaggen'],
      quiet: ['Een schone race zonder safety car.'], dnf: ['{N} auto’s vielen uit.', '{N} uitvallers.'], dnf1: ['Eén auto viel uit.'],
      climber: ['Grootste stijger: {T}, van P{F} naar P{P}.', '{T} won de meeste plaatsen, van P{F} naar P{P}.'],
      pole: ['Polesitter {T} finishte als P{P}.', '{T} startte vanaf pole en werd P{P}.'], poleOut: ['Polesitter {T} haalde de finish niet.'],
      pen: ['Er werden {N} straffen uitgedeeld.'], pen1: ['Er werd één straf uitgedeeld.'], botched: ['{N} pitstops gingen mis.'], botched1: ['Eén pitstop ging mis.'],
      fastPit: ['Snelste stop: {T}, {X} s.'],
      champLead: ['{T} leidt het kampioenschap met {P} punten, {X} voor {R}.', 'In de stand staat {T} bovenaan: {P} punten, +{X} op {R}.'],
      champLeadLevel: ['{T} deelt de leiding in het kampioenschap met {P} punten.'],
      champOther: ['In het kampioenschap staat {T} op P{Q} met {P} punten, {X} achter {R}.', '{T} is P{Q} in de stand, {X} punten achter {R}.'],
      champLevel: ['In het kampioenschap staat {T} op P{Q} met {P} punten, gelijk met {R}.'],
      moved: [' (was P{B})', ' (omhoog van P{B})'], dropped: [' (omlaag van P{B})'],
      next: ['Volgende race: {C}, ronde {R}.', 'Hierna: ronde {R} op {C}.'], last: ['Dat was de laatste ronde van het seizoen.'],
      foot: 'Raceverslag', src: { exp: 'race-export', save: 'savegegevens' }, mismatch: 'De geladen race-export is van {X}, niet van deze race; hij is niet gebruikt.'
    }
  };

  function list(parts, lang) {
    if (parts.length < 2) return parts.join('');
    return parts.slice(0, -1).join(', ') + (lang === 'nl' ? ' en ' : ' and ') + parts[parts.length - 1];
  }

  function write(F, opts) {
    opts = opts || {};
    const lang = W[opts.lang] ? opts.lang : 'en', w = W[lang];
    if (!F) return '';
    const r = rng([F.season, F.round, F.circuit, opts.variant || 0].join('|'));
    const pick = a => a[Math.floor(r() * a.length)];
    const num = n => { const t = Number.isInteger(n) ? String(n) : n.toFixed(1); return lang === 'nl' ? t.replace('.', ',') : t; };
    const C = md(F.circuit), f = F.focus, win = F.winner;
    const best = f && f.results.length ? f.results.slice().sort((a, b) => (a.finished === b.finished ? a.position - b.position : a.finished ? -1 : 1))[0] : null;

    // Headline
    let h;
    const v = { C, T: f ? md(f.team) : '', W: win ? md(win.team) : '', S: best ? best.start : '', P: best ? best.position : '' };
    if (!f || F.focusRole === 'leader') h = pick(win && win.isFocus ? w.h.win : w.h.other);
    else if (win && win.isFocus) h = pick(best && best.start >= 6 ? w.h.winBack : w.h.win);
    else if (best && best.finished && best.position <= 3) h = pick(w.h.podium);
    else if (best && !best.finished) h = pick(w.h.out);
    else if (best) h = pick(w.h.pts);
    else h = pick(w.h.other);
    const out = ['📰 **' + fill(h, v) + '**\n*' + [F.category, (lang === 'nl' ? 'Ronde ' : 'Round ') + F.round + (F.totalRounds ? '/' + F.totalRounds : ''), F.season].filter(Boolean).map(x => md(String(x))).join(' · ') + '*'];

    // 1. Winner
    if (win) {
      let M = '';
      if (F.lapsDown) M = pick(w.marginLaps);
      else if (F.margin != null && F.runnerUp) M = fill(pick(F.margin < 1.5 ? w.close : w.margin), { X: num(F.margin), R: md(F.runnerUp.team === win.team ? crew(F.runnerUp.drivers) : F.runnerUp.team) });
      const G = win.start === 1 ? pick(w.fromPole) : win.start ? fill(pick(w.fromGrid), { S: win.start }) : '';
      let p1 = fill(pick(w.win), { D: md(crew(win.drivers)), W: md(win.team), M, G });
      if (F.runnerUp && F.runnerUp.team === win.team) p1 += fill(pick(w.oneTwo), { W: md(win.team) });
      if (win.isFocus && f && f.wins > 1) p1 += fill(pick(w.winCount), { N: f.wins });
      out.push(p1);
    }

    // 2. Focus team (when it did not win)
    if (f && F.focusRole === 'player' && !(win && win.isFocus) && f.results.length) {
      const lines = f.results.map(m => {
        if (!m.finished) return fill(pick(w.meOut), { T: md(f.team), L: m.outLap ? fill(pick(w.outLap), { L: m.outLap }) : '', I: m.incident ? fill(pick(w.incident), { X: md(m.incident) }) : '' });
        const g = m.start == null ? '' : m.gain > 0 ? fill(pick(w.gainUp), { S: m.start, X: m.gain }) : m.gain < 0 ? fill(pick(w.gainDown), { S: m.start }) : fill(pick(w.gainSame), { S: m.start });
        return fill(pick(w.me), { T: md(f.team), P: m.position, G: g, N: m.stops ? fill(pick(w.stops), { N: m.stops }) : '' });
      });
      out.push(lines.slice(0, 2).join(' '));
    }

    // 3. Race events
    const ev = [];
    const E = F.export;
    if (E) {
      const bits = [];
      const cnt = (n, pair) => (n === 1 ? (lang === 'nl' ? 'één ' : 'one ') + pair[0] : n + ' ' + pair[1]);
      if (E.sc) bits.push(cnt(E.sc, w.sc)); if (E.vsc) bits.push(cnt(E.vsc, w.vsc)); if (E.red) bits.push(cnt(E.red, w.red));
      ev.push(bits.length ? fill(pick(w.events), { X: list(bits, lang) }) : pick(w.quiet));
    }
    if (F.retirements) ev.push(F.retirements === 1 ? pick(w.dnf1) : fill(pick(w.dnf), { N: F.retirements }));
    if (F.climber && !(f && F.climber.team === f.team)) ev.push(fill(pick(w.climber), { T: md(F.climber.team), F: F.climber.from, P: F.climber.to }));
    if (F.pole && !F.pole.isWinner) ev.push(F.pole.finish ? fill(pick(w.pole), { T: md(F.pole.team), P: F.pole.finish }) : fill(pick(w.poleOut), { T: md(F.pole.team) }));
    if (E && E.penalties) ev.push(E.penalties === 1 ? pick(w.pen1) : fill(pick(w.pen), { N: E.penalties }));
    if (E && E.botched) ev.push(E.botched === 1 ? pick(w.botched1) : fill(pick(w.botched), { N: E.botched }));
    if (E && E.fastestPit && E.fastestPit.team) ev.push(fill(pick(w.fastPit), { T: md(E.fastestPit.team), X: (lang === 'nl' ? E.fastestPit.time.toFixed(1).replace('.', ',') : E.fastestPit.time.toFixed(1)) }));
    if (ev.length) out.push(ev.join(' '));

    // 4. Championship and next race
    if (f && f.pos != null) {
      let c;
      if (f.pos === 1 && f.gapBehind) c = fill(pick(w.champLead), { T: md(f.team), P: num(f.points), X: num(f.gapBehind), R: md(f.behind) });
      else if (f.pos === 1) c = fill(pick(w.champLeadLevel), { T: md(f.team), P: num(f.points) });
      else if (f.gapAhead === 0 && f.ahead) c = fill(pick(w.champLevel), { T: md(f.team), Q: f.pos, P: num(f.points), R: md(f.ahead) });
      else c = fill(pick(w.champOther), { T: md(f.team), Q: f.pos, P: num(f.points), X: num(f.gapAhead != null && f.ahead ? f.gapAhead : 0), R: md(f.ahead) });
      if (f.posBefore && f.posBefore !== f.pos) c = c.replace(/\.$/, fill(pick(f.posBefore > f.pos ? w.moved : w.dropped), { B: f.posBefore }) + '.');
      out.push(c + ' ' + (F.next ? fill(pick(w.next), { C: md(F.next.circuit), R: F.next.round }) : pick(w.last)));
    }
    if (F.exportMismatch) out.push('_' + fill(w.mismatch, { X: md(F.exportMismatch) }) + '_');
    out.push('-# ' + w.foot + ' · ' + (E ? w.src.exp : w.src.save) + ' · DM Save Card');
    return out.join('\n\n').slice(0, 2000);
  }

  // A prompt the user can paste into an AI chat for a freer write-up, with only these facts.
  function prompt(F, opts) {
    const nl = opts && opts.lang === 'nl';
    return (nl
      ? 'Schrijf een kort, levendig raceverslag (max. 150 woorden) in het Nederlands voor een Discord-kanaal over deze race in het spel Delta Manager. Gebruik alleen deze feiten en verzin niets. Begin met een vette kop.\n\n'
      : 'Write a short, lively race report (max 150 words) in English for a Discord channel about this race in the game Delta Manager. Use only these facts and invent nothing. Start with a bold headline.\n\n')
      + '```json\n' + JSON.stringify(F, null, 1) + '\n```';
  }

  return { parseExport, facts, write, prompt, sameTrack };
});
