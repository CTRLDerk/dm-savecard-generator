/* DM Save Card — labels (EN/NL) and the Discord message. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMText = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LABELS = {
    en: {
      season: 'Season', round: 'Round', of: 'of', week: 'week', races: 'races', laps: 'laps',
      championship: 'Championship', target: 'Target', pts: 'pts', leader: 'Leader', champions: 'Champions',
      aheadOf: 'ahead of', behind: 'behind', toLeader: 'to the leader', level: 'level with',
      targetAhead: 'ahead of target', targetOn: 'on target', targetBehind: 'behind target',
      wins: 'Wins', podiums: 'Podiums', poles: 'Poles', dnf: 'DNF', best: 'Best', budget: 'Budget', form: 'Form',
      win1: 'win', winN: 'wins', podium1: 'podium', podiumN: 'podiums', pole1: 'pole', poleN: 'poles',
      lastRace: 'Last race', from: 'from', wonBy: 'Won by', next: 'Next', firstRace: 'First race',
      standings: 'Standings', team: 'Team', drivers: 'Drivers', coop: 'Co-op', mp: 'Multiplayer', player: 'PLAYER', managedBy: 'Managed by',
      preseason: 'Pre-season', finalStandings: 'Final standings', seasonDone: 'Season complete',
      spectator: 'Spectator save', leaderTitle: 'Championship leader', saved: 'Saved', titles: 'Titles',
      thisSeason: 'this season', progress: 'Season progress', cheat: 'cheat mode', seasonProgress: 'races'
    },
    nl: {
      season: 'Seizoen', round: 'Ronde', of: 'van', week: 'week', races: 'races', laps: 'ronden',
      championship: 'Kampioenschap', target: 'Doel', pts: 'ptn', leader: 'Leider', champions: 'Kampioen',
      aheadOf: 'voor op', behind: 'achter op', toLeader: 'op de leider', level: 'gelijk met',
      targetAhead: 'boven verwachting', targetOn: 'op koers', targetBehind: 'onder verwachting',
      wins: 'Zeges', podiums: 'Podiums', poles: 'Poles', dnf: 'DNF', best: 'Beste', budget: 'Budget', form: 'Vorm',
      win1: 'zege', winN: 'zeges', podium1: 'podium', podiumN: 'podiums', pole1: 'pole', poleN: 'poles',
      lastRace: 'Vorige race', from: 'vanaf', wonBy: 'Gewonnen door', next: 'Volgende', firstRace: 'Eerste race',
      standings: 'Stand', team: 'Team', drivers: 'Coureurs', coop: 'Co-op', mp: 'Multiplayer', player: 'SPELER', managedBy: 'Manager',
      preseason: 'Voorseizoen', finalStandings: 'Eindstand', seasonDone: 'Seizoen voorbij',
      spectator: 'Toeschouwersmodus', leaderTitle: 'Leider kampioenschap', saved: 'Opgeslagen', titles: 'Titels',
      thisSeason: 'dit seizoen', progress: 'Seizoensvoortgang', cheat: 'cheatmodus', seasonProgress: 'races'
    }
  };
  const L = lang => LABELS[lang] || LABELS.en;

  const fmtPts = p => (p == null ? '–' : Number.isInteger(p) ? String(p) : p.toFixed(1));
  const fmtGap = g => (g == null ? '' : (Number.isInteger(g) ? String(g) : g.toFixed(1)));
  const fmtMoney = m => (m == null ? '–' : (Math.abs(m) >= 100 ? m.toFixed(0) : m.toFixed(1)) + 'M');
  // ------------------------------------------------------------ story lines
  // Short sentences that give the numbers a meaning (see DMSave.storyOf). Everything here follows from the save.
  const SW = {
    en: { pt: ['point', 'points'], race: ['race', 'races'], win: ['win', 'wins'], finishRun: '{N} finishes in a row', bestIn: 'Best result in {N} races', seasonBest: 'Best result of the season',
      belowAvg: 'Below our average: P{P} against P{A}', aboveAvg: 'Better than our average: P{P} against P{A}', h2h: '{U}–{T} against {B} this season',
      worth: { small: '{X}', half: '{X} (about half a race win)', one: '{X} (about one race win)', many: '{X} (about {N} race wins)' },
      rivalAhead: 'Rival: {B}, {X} ahead of us.', rivalBehind: 'Rival: {B}, {X} behind us.', score: 'Head to head: {U}–{T}.', scoreLead: 'We beat them {U}–{T} on race days.', scoreTrail: 'They beat us {T}–{U} on race days.', scoreEven: 'Level on race days: {U}–{T}.',
      targetOk: 'Target P{E}: {X} clear of {B} in P{Q}.', targetOkNo: 'Target P{E}: on course.', targetMiss: 'Target P{E}: {X} short of {B}.', targetMissNo: 'Target P{E}: not there yet.',
      need: 'Outscore {B} by more than {X} at {C} and P{Q} is ours.', needLevel: 'Finish ahead of {B} at {C} and P{Q} is ours.', needFar: 'P{Q} is {W} away. Catching {B} takes more than one race.', defend: '{B} needs more than {X} on us at {C} to take P{P}.',
      titleOff: 'The title is out of reach.', titleOn: 'The title: {W} behind with {L} to go.',
      types: { speed: 'speed circuit', technical: 'technical circuit', mixed: 'mixed circuit', oval: 'oval', street: 'street circuit', road: 'road course' }, km: 'km', laps: 'laps', brake: 'heavy braking zones',
      poll: { win: 'Win', podium: 'Podium', off: 'Off the podium', top: 'Top {N}', range: 'P{A}–P{B}', lower: 'Lower than P{N}', points: 'Points', none: 'Lower' } },
    nl: { pt: ['punt', 'punten'], race: ['race', 'races'], win: ['zege', 'zeges'], finishRun: '{N} finishes op rij', bestIn: 'Beste resultaat in {N} races', seasonBest: 'Beste resultaat van het seizoen',
      belowAvg: 'Onder ons gemiddelde: P{P} tegen P{A}', aboveAvg: 'Beter dan ons gemiddelde: P{P} tegen P{A}', h2h: '{U}–{T} tegen {B} dit seizoen',
      worth: { small: '{X}', half: '{X} (ongeveer een halve racezege)', one: '{X} (ongeveer één racezege)', many: '{X} (ongeveer {N} racezeges)' },
      rivalAhead: 'Rivaal: {B}, {X} voor ons.', rivalBehind: 'Rivaal: {B}, {X} achter ons.', score: 'Onderling: {U}–{T}.', scoreLead: 'Op racedagen winnen wij met {U}–{T}.', scoreTrail: 'Op racedagen winnen zij met {T}–{U}.', scoreEven: 'Gelijk op racedagen: {U}–{T}.',
      targetOk: 'Doel P{E}: {X} voor op {B} op P{Q}.', targetOkNo: 'Doel P{E}: op koers.', targetMiss: 'Doel P{E}: {X} achter {B}.', targetMissNo: 'Doel P{E}: nog niet gehaald.',
      need: 'Scoor op {C} meer dan {X} meer dan {B} en P{Q} is van ons.', needLevel: 'Finish op {C} voor {B} en P{Q} is van ons.', needFar: 'P{Q} is {W} weg. {B} inhalen kost meer dan één race.', defend: '{B} moet op {C} meer dan {X} op ons goedmaken voor P{P}.',
      titleOff: 'De titel is buiten bereik.', titleOn: 'De titel: {W} achter met nog {L} te gaan.',
      types: { speed: 'snel circuit', technical: 'technisch circuit', mixed: 'gemengd circuit', oval: 'oval', street: 'stratencircuit', road: 'wegcircuit' }, km: 'km', laps: 'ronden', brake: 'zware remzones',
      poll: { win: 'Zege', podium: 'Podium', off: 'Naast het podium', top: 'Top {N}', range: 'P{A}–P{B}', lower: 'Lager dan P{N}', points: 'Punten', none: 'Lager' } }
  };
  const sfill = (t, v) => String(t).replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
  const TYPES = { vitesse: 'speed', speed: 'speed', technique: 'technical', technical: 'technical', mixte: 'mixed', mixed: 'mixed', ovale: 'oval', oval: 'oval', urbain: 'street', street: 'street', route: 'road', road: 'road' };
  function trackType(type, lang) { const k = TYPES[String(type || '').toLowerCase()]; return k ? SW[lang === 'nl' ? 'nl' : 'en'].types[k] : ''; }
  // "84 points, about two race wins": a gap measured against the best single race any team had this season.
  function worth(gap, st, lang) {
    const w = SW[lang === 'nl' ? 'nl' : 'en'], num = lang === 'nl' ? fmtGap(gap).replace('.', ',') : fmtGap(gap), X = num + ' ' + w.pt[gap === 1 ? 0 : 1];
    const r = st && st.raceMax > 0 ? gap / st.raceMax : 0;
    if (r < 0.4) return sfill(w.worth.small, { X });
    if (r < 0.75) return sfill(w.worth.half, { X });
    if (r < 1.5) return sfill(w.worth.one, { X });
    return sfill(w.worth.many, { X, N: Math.round(r) });
  }
  // Driver characteristics as the save names them (French) → EN / NL. Unknown ones are shown as they are.
  const TRAITS = { 'experimente': ['Experienced', 'Ervaren'], 'regulier': ['Consistent', 'Constant'], 'rapide': ['Fast', 'Snel'], 'legende': ['Legend', 'Legende'],
    'maitre des qualifications': ['Qualifying master', 'Kwalificatiespecialist'], 'pilote payant': ['Pay driver', 'Betaalcoureur'], 'potentiel enorme': ['Huge potential', 'Enorm potentieel'],
    'maitre de la pluie': ['Rain master', 'Regenspecialist'], 'rookie': ['Rookie', 'Rookie'], 'superstar': ['Superstar', 'Superster'], 'heros national': ['National hero', 'Nationale held'],
    'agressif': ['Aggressive', 'Agressief'], 'prudent': ['Careful', 'Voorzichtig'], 'irregulier': ['Inconsistent', 'Wisselvallig'], 'fragile': ['Fragile', 'Kwetsbaar'], 'leader': ['Leader', 'Leider'] };
  const tkey = x => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/_/g, ' ').toLowerCase().trim();
  function trait(name, lang) { const m = TRAITS[tkey(name)]; return m ? m[lang === 'nl' ? 1 : 0] : String(name || '').replace(/_/g, ' '); }
  // What a driver is driving for, as a short clause (only from what the save says about them).
  function motive(p, season, lang) {
    if (!p) return '';
    const nl = lang === 'nl', has = k => (p.traits || []).some(t => tkey(t) === k);
    if (p.until != null && season != null && p.until <= season) return nl ? 'het contract loopt na dit seizoen af' : 'the contract runs out after this season';
    if (has('rookie') || (p.age != null && p.age <= 20)) return nl ? 'het is het rookieseizoen' : 'it is the rookie season';
    if (has('legende')) return nl ? 'een legende heeft een naam hoog te houden' : 'a legend has a name to live up to';
    if (p.careerWins === 0 && p.age != null && p.age >= 27) return nl ? 'een eerste zege in de carrière ontbreekt nog' : 'a first career win is still missing';
    if (p.potential != null && p.level != null && p.potential - p.level >= 1.5 && p.age != null && p.age <= 25) return nl ? 'er zit meer talent in dan de resultaten laten zien' : 'there is more talent there than the results show so far';
    if (p.age != null && p.age >= 36) return nl ? 'op ' + p.age + '-jarige leeftijd telt elk seizoen' : 'at ' + p.age + ' every season counts';
    return '';
  }
  // The last result against our own season: a clause for a race that was neither a triumph nor a drama.
  function relative(st, lang) {
    if (!st || !st.last || st.last.pos == null) return '';
    const nl = lang === 'nl', L = st.last, R = st.rival, bits = [];
    if (st.finishRun >= 5 && st.finishRun < st.races) bits.push(nl ? 'de ' + st.finishRun + 'e finish op rij' : 'finish number ' + st.finishRun + ' in a row');
    else if (st.races >= 3 && st.bestIn >= 3) bits.push(nl ? 'ons beste resultaat in ' + st.bestIn + ' races' : 'our best result in ' + st.bestIn + ' races');
    else if (st.races >= 3 && st.avg != null) { const d = Math.round(st.avg - L.pos), a = Math.round(st.avg);
      bits.push(d >= 2 ? (nl ? d + ' plaatsen beter dan ons gemiddelde (P' + a + ')' : d + ' places better than our average (P' + a + ')')
        : d <= -2 ? (nl ? -d + ' plaatsen onder ons gemiddelde (P' + a + ')' : -d + ' places below our average (P' + a + ')') : (nl ? 'precies ons seizoensgemiddelde' : 'right on our season average')); }
    if (R && R.lastUs != null && R.lastThem != null) bits.push(R.lastUs < R.lastThem ? (nl ? 'voor rivaal ' + R.short + ' (P' + R.lastThem + ')' : 'ahead of rival ' + R.short + ' (P' + R.lastThem + ')')
      : (nl ? 'achter rivaal ' + R.short + ' (P' + R.lastThem + ')' : 'behind rival ' + R.short + ' (P' + R.lastThem + ')'));
    else if (R && R.lastUs != null && R.lastThem == null) bits.push(nl ? 'terwijl rivaal ' + R.short + ' uitviel' : 'while rival ' + R.short + ' did not finish');
    return bits.join(nl ? ', ' : ', ');
  }

  // Small grammar repairs on a finished text: "1 races", "Rounds 3–3", "X to X".
  function tidy(text) {
    return String(text == null ? '' : text)
      .replace(/\b1 races\b/g, '1 race').replace(/\b1 stops\b/g, '1 stop').replace(/stopped 1 times/g, 'stopped once').replace(/\b1 times\b/g, 'once').replace(/stopte 1 keer/g, 'stopte één keer').replace(/\b1 wins\b/g, '1 win').replace(/\b1 podiums\b/g, '1 podium').replace(/\b1 zeges\b/g, '1 zege')
      .replace(/\b(Rounds|Ronde|Ronden) (\d+)–\2\b/g, (_, w, n) => (w === 'Rounds' ? 'Round ' : 'Ronde ') + n)
      .replace(/(\b1 race), van ([^\n]+?) tot \2(?=\n|$)/g, '$1, $2').replace(/(\b1 race), ([^\n]+?) to \2(?=\n|$)/g, '$1, $2');
  }

  // s: summary or snapshot-like { story, focus|team, next }. Returns plain sentences (no markdown).
  function story(s, lang) {
    lang = lang === 'nl' ? 'nl' : 'en';
    const w = SW[lang], st = s && s.story, f = s && (s.focus || s.team), out = { headline: '', rival: '', score: '', target: '', need: '', title: '', poll: null };
    const a = st && st.avg != null ? Math.round(st.avg) : null;
    out.poll = a == null ? [w.poll.podium, w.poll.points, w.poll.none] : a <= 3 ? [w.poll.win, w.poll.podium, w.poll.off]
      : a <= 6 ? [w.poll.podium, sfill(w.poll.range, { A: 4, B: a + 2 }), sfill(w.poll.lower, { N: a + 2 })]
      : (x => [sfill(w.poll.top, { N: x }), sfill(w.poll.range, { A: x + 1, B: x + 5 }), sfill(w.poll.lower, { N: x + 5 })])(Math.max(5, 5 * Math.floor((a - 1) / 5)));
    if (!st || !f) return out;
    const pts = g => (lang === 'nl' ? fmtGap(g).replace('.', ',') : fmtGap(g)) + ' ' + w.pt[g === 1 ? 0 : 1];
    const L = st.last, R = st.rival;
    // One headline: the most telling thing about where we are now.
    if (L && L.pos != null && st.races >= 3) {
      if (st.finishRun >= 5 && st.finishRun < st.races) out.headline = sfill(w.finishRun, { N: st.finishRun });
      else if (L.pos === st.seasonBest && st.bestIn >= 3 && st.bestIn === st.races) out.headline = w.seasonBest;
      else if (st.bestIn >= 4) out.headline = sfill(w.bestIn, { N: st.bestIn });
      else if (st.avg != null && L.pos - st.avg >= 4) out.headline = sfill(w.belowAvg, { P: L.pos, A: Math.round(st.avg) });
      else if (st.avg != null && st.avg - L.pos >= 4) out.headline = sfill(w.aboveAvg, { P: L.pos, A: Math.round(st.avg) });
    }
    if (!out.headline && R && R.us + R.them >= 3) out.headline = sfill(w.h2h, { U: R.us, T: R.them, B: R.short });
    if (R) {
      out.rival = sfill(R.ahead ? w.rivalAhead : w.rivalBehind, { B: R.short, X: worth(R.gap, st, lang) });
      if (R.us + R.them >= 2) out.score = sfill(R.us > R.them ? w.scoreLead : R.us < R.them ? w.scoreTrail : w.scoreEven, { U: R.us, T: R.them });
    }
    const tg = st.target;
    if (tg) out.target = tg.ok ? (tg.margin != null && tg.team ? sfill(w.targetOk, { E: tg.pos, X: pts(tg.margin), B: tg.team, Q: tg.teamPos }) : sfill(w.targetOkNo, { E: tg.pos }))
      : (tg.margin != null && tg.team ? sfill(w.targetMiss, { E: tg.pos, X: pts(tg.margin), B: tg.team }) : sfill(w.targetMissNo, { E: tg.pos }));
    const nx = s.next;
    if (nx && f.pos != null && st.left > 0) {
      if (f.pos > 1 && f.ahead && f.gapAhead != null) {
        out.need = f.gapAhead === 0 ? sfill(w.needLevel, { B: f.ahead, C: nx.name, Q: f.pos - 1 })
          : st.raceMax > 0 && f.gapAhead >= st.raceMax ? sfill(w.needFar, { Q: f.pos - 1, W: worth(f.gapAhead, st, lang), B: f.ahead })
          : sfill(w.need, { B: f.ahead, X: pts(f.gapAhead), C: nx.name, Q: f.pos - 1 });
      } else if (f.pos === 1 && f.behind && f.gapBehind != null) out.need = sfill(w.defend, { B: f.behind, X: pts(f.gapBehind), C: nx.name, P: 1 });
    }
    if (f.pos > 1 && f.leaderGap != null && st.titleOpen != null && st.left > 0)
      out.title = st.titleOpen ? sfill(w.titleOn, { W: worth(f.leaderGap, st, lang), L: st.left + ' ' + w.race[st.left === 1 ? 0 : 1] }) : w.titleOff;
    return out;
  }

  // Standings rows to show when space is short: the top 3, then the team above us, us and the team below us.
  // Returns indexes into the list; a jump in the indexes means rows were skipped.
  function standingsRows(n, me, max) {
    max = Math.max(3, max);
    if (n <= max) return [...Array(n).keys()];
    if (me < 0 || me < max - 1) return [...Array(max).keys()];
    const win = [me - 1, me, me + 1].filter(i => i >= 0 && i < n);
    const top = Math.max(1, Math.min(3, max - win.length));
    return [...new Set([...Array(top).keys(), ...win])].slice(0, Math.max(max, top + 2));
  }
  const posLabel = (pos, tied) => (pos == null ? '–' : 'P' + pos + (tied ? '=' : ''));
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  function fmtDate(iso, lang) {
    if (!iso) return '';
    const d = new Date(iso); if (isNaN(d)) return '';
    try { return d.toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }
  // Discord markdown outside code blocks: escape formatting characters, never ping anyone.
  const md = s => String(s == null ? '' : s).replace(/([\\*_~`|>])/g, '\\$1').replace(/@/g, '@\u200b');
  const plain = s => String(s == null ? '' : s).replace(/`/g, "'").replace(/@/g, '@\u200b');
  // Shorten to n characters but keep a trailing car number ("… #3"): that is what tells two entries of one team apart.
  const cut = (s, n) => {
    if (s.length <= n) return s;
    const m = / #\d{1,3}$/.exec(s);
    if (m && n > m[0].length + 4) return s.slice(0, n - m[0].length - 1).trimEnd() + '…' + m[0];
    return s.slice(0, n - 1) + '…';
  };
  const surname = n => { const p = String(n || '').trim().split(/\s+/); return p.length > 1 ? p.slice(1).join(' ') : p[0]; };

  // Short line about where the focus team stands relative to its neighbours.
  function gapLine(f, t) {
    if (!f || f.pos == null) return '';
    if (f.pos === 1 && f.gapBehind != null) return (f.gapBehind > 0 ? '+' + fmtGap(f.gapBehind) + ' ' + t.aheadOf + ' ' : t.level + ' ') + f.behind;
    if (f.gapAhead != null && f.pos > 1) return (f.gapAhead > 0 ? '−' + fmtGap(f.gapAhead) + ' ' + t.behind + ' ' : t.level + ' ') + f.ahead;
    return '';
  }
  function targetState(f) {
    if (!f || f.expected == null || f.pos == null) return null;
    return f.pos < f.expected ? 'ahead' : f.pos === f.expected ? 'on' : 'behind';
  }
  function headerLine(s, t) {
    const parts = [];
    if (s.category) parts.push(s.category);
    parts.push(t.season + ' ' + s.season);
    if (s.preseason) parts.push(t.preseason);
    else if (s.finished) parts.push(t.seasonDone);
    else if (s.rounds.total) parts.push(t.round + ' ' + s.rounds.done + ' ' + t.of + ' ' + s.rounds.total);
    return parts.join(' · ');
  }

  function discord(s, opts) {
    opts = opts || {};
    const t = L(opts.lang);
    const f = s.focus;
    const out = [];
    if (!f) return '**' + headerLine(s, t) + '**';
    const title = s.mode === 'spectator' ? t.leaderTitle + ': ' + f.name : f.name;

    if (opts.short) {
      const bits = [];
      if (s.preseason) { if (f.expected) bits.push(t.target + ' P' + f.expected); }
      else bits.push(posLabel(f.pos, f.tied) + ' · ' + fmtPts(f.points) + ' ' + t.pts + (gapLine(f, t) ? ' (' + gapLine(f, t) + ')' : ''));
      if (s.last && s.last.mine.length) bits.push(t.lastRace + ': ' + s.last.mine.map(m => m.label).join('/') + ' (' + md(s.last.name) + ')');
      return '🏁 **' + md(title) + '**' + (bits.length ? ' — ' + bits.join(' · ') : '') + '\n' + md(headerLine(s, t));
    }

    out.push('🏁 **' + md(title) + '**');
    out.push(md(headerLine(s, t)) + (s.preseason || s.finished ? '' : ' · ' + t.week + ' ' + s.week));
    out.push('');
    if (s.preseason) {
      if (f.expected) out.push('🎯 ' + t.target + ' **P' + f.expected + '**');
      if (s.next) out.push('🔜 ' + t.firstRace + ': ' + md(s.next.name) + ' · ' + t.week + ' ' + s.next.week);
    } else {
      const crown = s.finished && f.pos === 1 ? ' 🏆 ' + t.champions : '';
      out.push('🏆 ' + (s.finished ? t.finalStandings : t.championship) + ': **' + posLabel(f.pos, f.tied) + '** · ' + fmtPts(f.points) + ' ' + t.pts +
        (gapLine(f, t) ? ' · ' + md(gapLine(f, t)) : '') + crown);
      const ts = targetState(f);
      if (ts) out.push('🎯 ' + t.target + ' P' + f.expected + ' · ' + (ts === 'ahead' ? t.targetAhead : ts === 'on' ? t.targetOn : t.targetBehind));
      out.push('📊 ' + [plural(f.wins, t.win1, t.winN), plural(f.podiums, t.podium1, t.podiumN), plural(f.poles, t.pole1, t.poleN), f.dnf + ' ' + t.dnf].join(' · ') +
        (f.form.length ? ' · ' + t.form.toLowerCase() + ' ' + f.form.slice(-5).map(x => x.label).join(' ') : ''));
      if (s.last) {
        const mine = s.last.mine.map(m => '**' + m.label + '**' + (m.start != null && m.finished ? ' ' + t.from + ' P' + m.start + (m.gain ? ' (' + (m.gain > 0 ? '+' : '−') + Math.abs(m.gain) + ')' : '') : '')).join(', ');
        const won = s.last.winner && s.last.winner.teamId !== f.id ? ' · ' + t.wonBy + ' ' + md(s.last.winner.short) : '';
        out.push('🔙 ' + t.round + ' ' + s.last.round + ', ' + md(s.last.name) + ': ' + (mine || '–') + won);
      }
      if (s.next) out.push('🔜 ' + t.round + ' ' + s.next.round + ', ' + md(s.next.name) + ' · ' + t.week + ' ' + s.next.week);
    }
    for (const p of s.partners) out.push('🤝 ' + t.coop + ': ' + md(p.name) + (p.pos != null ? ' · P' + p.pos : '') + ' · ' + fmtPts(p.points) + ' ' + t.pts + (p.manager ? ' · ' + md(p.manager) : ''));
    if (f.manager) out.push('👤 ' + t.managedBy + ' ' + md(f.manager));
    if (f.drivers.length && !s.preseason) out.push('👥 ' + f.drivers.map(d => md(surname(d.name)) + ' ' + posLabel(d.pos, d.tied)).join(' · '));
    if (opts.budget && f.budget != null) out.push('💰 ' + t.budget + ' ' + fmtMoney(f.budget) + (f.budgetStart != null && f.budgetStart !== f.budget ? ' (' + (f.budget - f.budgetStart >= 0 ? '+' : '−') + fmtMoney(Math.abs(f.budget - f.budgetStart)) + ' ' + t.thisSeason + ')' : ''));
    if (f.career && (f.career.titles || f.career.past.length)) {
      const past = f.career.past.slice(-4).map(p => p.season + ' P' + p.pos).join(' · ');
      out.push('📜 ' + (f.career.titles ? t.titles + ' ' + f.career.titles + (past ? ' · ' : '') : '') + past);
    }

    // Standings table in a code block so the columns line up.
    const n = Math.max(3, Math.min(opts.rows || 6, 12));
    const list = opts.table === 'drivers' ? s.drivers : s.teams;
    if (list.length && !s.preseason) {
      const mark = id => (opts.table === 'drivers' ? (f.drivers.some(d => d.name === id) ? ' ◀' : '') : id === f.id ? ' ◀' : s.partners.some(p => p.id === id) ? ' ◁' : '');
      const key = r => (opts.table === 'drivers' ? r.name : r.id);
      const meIdx = list.findIndex(r => (opts.table === 'drivers' ? f.drivers.some(d => d.name === r.name) : r.id === f.id));
      const rows = [];
      standingsRows(list.length, meIdx, n).forEach((i, k, a) => { if (k && i - a[k - 1] > 1) rows.push(null); rows.push(list[i]); });
      const w = 26;
      const dec = list.some(r => !Number.isInteger(r.points));
      const pts = p => (dec ? p.toFixed(1) : String(p));
      const lines = rows.map(r => r == null ? '  …' :
        (String(r.pos == null ? '' : r.pos) + (r.tied ? '=' : '')).padStart(3) + '  ' + cut(plain(opts.table === 'drivers' ? r.name : r.short), w).padEnd(w) + ' ' + pts(r.points).padStart(6) + mark(key(r)));
      out.push('');
      out.push('**' + (opts.table === 'drivers' ? t.drivers : t.standings) + '**');
      out.push('```');
      out.push(...lines);
      out.push('```');
    }
    out.push('-# DM Save Card · ' + t.saved + ' ' + fmtDate(s.savedAt, opts.lang) + (s.cheat ? ' · ' + t.cheat : ''));

    // Discord's limit is 2000 characters: drop table rows, then optional lines, until it fits.
    let text = out.join('\n');
    while (text.length > 2000 && out.length > 1) {
      const open = out.indexOf('```'), close = out.lastIndexOf('```');
      if (open >= 0 && close - open > 3) out.splice(close - 1, 1);            // drop the last table row
      else if (open >= 0) out.splice(open - 2, close - open + 3);              // drop the whole table block
      else out.splice(out.length - 2, 1);                                      // drop the line above the footer
      text = out.join('\n');
    }
    return text.slice(0, 2000);
  }

  return { LABELS, L, discord, cut, fmtPts, fmtGap, fmtMoney, fmtDate, posLabel, standingsRows, story, worth, trackType, trait, motive, relative, tidy, gapLine, targetState, headerLine, surname };
});
