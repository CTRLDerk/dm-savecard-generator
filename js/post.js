/* DM Save Card — social post: a short post in social-media style (template or AI),
   the prompt for the AI, and a Discord-style preview of the finished post. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./text.js'));
  else root.DMPost = factory(root.DMText);
})(typeof self !== 'undefined' ? self : this, function (TXT) {
  'use strict';

  const md = x => String(x == null ? '' : x).replace(/([\\*_~`|>])/g, '\\$1').replace(/@/g, '@\u200b');
  const crew = d => (d || []).map(n => String(n).trim().split(/\s+/).slice(-1)[0]).slice(0, 3).join('/');
  const tag = s => {
    const n = String(s || '');
    if (/nascar|truck series|xfinity|cup series/i.test(n)) return '#NASCAR ' + (/truck/i.test(n) ? '#TruckSeries' : /xfinity|o'reilly/i.test(n) ? '#XfinitySeries' : '#CupSeries');
    return '#' + n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^./, c => c.toUpperCase());
  };
  const short = n => /^Circuit of the Americas$/i.test(String(n || '').trim()) ? 'COTA' : String(n || '').replace(/^(Autodromo|Autódromo|Circuit de|Circuit|Circuito|Nazionale)\s+/i, '').replace(/\s+(Circuit|Grand Prix Circuit|International Circuit|Raceway|Speedway)$/i, '').replace(/^Nazionale\s+/i, '') || n;

  function rng(seed) { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));

  // Words per language and tone. team = the team's own account ("we"), hype = fan account, press = reporter.
  const W = {
    en: {
      win: { team: ['WE WIN AT {C}! 🏆', 'VICTORY AT {C}! 🏆'], hype: ['WHAT A WIN AT {C}! 🏆🔥', '{T} CONQUERS {C}! 🏆'], press: ['{T} wins at {C}'] },
      podium: { team: ['P{P} AND A PODIUM AT {C}! 🍾', 'ON THE PODIUM AT {C}! 🥂'], hype: ['PODIUM! P{P} AT {C} 🍾', '{T} ON THE BOX AT {C}! 🍾'], press: ['P{P} for {T} at {C}'] },
      points: { team: ['P{P} AT {C} 🏁', 'POINTS AT {C}: P{P} 🏁'], hype: ['P{P} AT {C} — KEEP PUSHING 🏁'], press: ['{T} finishes P{P} at {C}'] },
      out: { team: ['TOUGH DAY AT {C} 💔', 'NOT OUR DAY AT {C} 💔'], hype: ['HEARTBREAK AT {C} 💔'], press: ['Retirement for {T} at {C}'] },
      leader: { team: ['{W} WINS AT {C} 🏆'], hype: ['{W} WINS AT {C}! 🏆'], press: ['{W} wins at {C}'] },
      season: { team: ['SEASON UPDATE: P{P} AFTER ROUND {R} 📈', 'WHERE WE STAND: P{P} 📈'], hype: ['P{P} IN THE CHAMPIONSHIP! 📈'], press: ['{T} P{P} after round {R}'] },
      pre: { team: ['A NEW SEASON STARTS 🚦', 'LIGHTS OUT SOON 🚦'], hype: ['NEW SEASON, NEW CHANCES 🚦'], press: ['{T} ready for season {S}'] },
      fromWin: { team: ['From P{S} to the top step with {D}. {M}', '{D} bring it home from P{S}. {M}'], hype: ['From P{S} to P1. {D} were unstoppable. {M}'], press: ['{D} won from P{S}. {M}'] },
      fromPos: { team: ['{D} bring the car home in P{P} after starting P{S}.', 'P{S} on the grid, P{P} at the flag.'], hype: ['P{S} → P{P}. That is how you race.'], press: ['{T} started P{S} and finished P{P}.'] },
      outLine: { team: ['The race ended early for us{L}. We go again.'], hype: ['Out{L}. Gutted, but we bounce back.'], press: ['{T} retired{L}.'] },
      won: ['Win for {W}.', '{W} took the win.'],
      margin: ['{X} s clear of {R}.', '{X} s ahead of {R}.'],
      champ: '📊 Championship: **P{P}** · {N} pts', lead: ' · +{X} on P2', gap: ' · −{X} to P{Q}', up: ' ⬆️ from P{B}', down: ' ⬇️ from P{B}',
      target: { ahead: '🎯 Target P{P}: ahead of plan', on: '🎯 Target P{P}: on plan', behind: '🎯 Target P{P}: work to do' },
      events: '🚩 {X}', sc: ['SC', 'SC'], vsc: ['VSC', 'VSC'], red: ['red flag', 'red flags'], clean: '🟢 Clean race, no safety car', players: '🎮 Other players', beat: '🎮 Ahead of {X} of the {N} other players', beatAll: '🎮 Ahead of all other players', beatNone: '🎮 Behind every other player this time',
      stats: '🏁 {W} wins · {P} podiums · {O} poles', next: '🔜 Next: {C} · round {R}', last: '🏁 That was the final round.', firstRace: '🔜 First race: {C}'
    },
    nl: {
      win: { team: ['WIJ WINNEN OP {C}! 🏆', 'ZEGE OP {C}! 🏆'], hype: ['WAT EEN ZEGE OP {C}! 🏆🔥', '{T} VEROVERT {C}! 🏆'], press: ['{T} wint op {C}'] },
      podium: { team: ['P{P} EN EEN PODIUM OP {C}! 🍾', 'OP HET PODIUM OP {C}! 🥂'], hype: ['PODIUM! P{P} OP {C} 🍾'], press: ['P{P} voor {T} op {C}'] },
      points: { team: ['P{P} OP {C} 🏁', 'PUNTEN OP {C}: P{P} 🏁'], hype: ['P{P} OP {C}, DOORDRUKKEN 🏁'], press: ['{T} finisht als P{P} op {C}'] },
      out: { team: ['ZWARE DAG OP {C} 💔', 'NIET ONZE DAG OP {C} 💔'], hype: ['DRAMA OP {C} 💔'], press: ['Uitvaller voor {T} op {C}'] },
      leader: { team: ['{W} WINT OP {C} 🏆'], hype: ['{W} WINT OP {C}! 🏆'], press: ['{W} wint op {C}'] },
      season: { team: ['SEIZOENSUPDATE: P{P} NA RONDE {R} 📈', 'DAAR STAAN WE: P{P} 📈'], hype: ['P{P} IN HET KAMPIOENSCHAP! 📈'], press: ['{T} P{P} na ronde {R}'] },
      pre: { team: ['EEN NIEUW SEIZOEN BEGINT 🚦'], hype: ['NIEUW SEIZOEN, NIEUWE KANSEN 🚦'], press: ['{T} klaar voor seizoen {S}'] },
      fromWin: { team: ['Van P{S} naar de hoogste trede met {D}. {M}', '{D} brengen hem thuis vanaf P{S}. {M}'], hype: ['Van P{S} naar P1. {D} waren niet te stoppen. {M}'], press: ['{D} wonnen vanaf P{S}. {M}'] },
      fromPos: { team: ['{D} brengen de auto als P{P} binnen na een start vanaf P{S}.', 'P{S} op de grid, P{P} bij de finish.'], hype: ['P{S} → P{P}. Zo race je.'], press: ['{T} startte als P{S} en finishte als P{P}.'] },
      outLine: { team: ['Voor ons was de race vroeg voorbij{L}. Volgende keer beter.'], hype: ['Uit{L}. Balen, maar we komen terug.'], press: ['{T} viel uit{L}.'] },
      won: ['Zege voor {W}.', '{W} pakte de zege.'],
      margin: ['{X} s voor {R}.', 'Met {X} s voorsprong op {R}.'],
      champ: '📊 Kampioenschap: **P{P}** · {N} ptn', lead: ' · +{X} op P2', gap: ' · −{X} op P{Q}', up: ' ⬆️ van P{B}', down: ' ⬇️ van P{B}',
      target: { ahead: '🎯 Doel P{P}: voor op schema', on: '🎯 Doel P{P}: op schema', behind: '🎯 Doel P{P}: werk aan de winkel' },
      events: '🚩 {X}', sc: ['SC', 'SC'], vsc: ['VSC', 'VSC'], red: ['rode vlag', 'rode vlaggen'], clean: '🟢 Schone race, geen safety car', players: '🎮 Andere spelers', beat: '🎮 Voor {X} van de {N} andere spelers gefinisht', beatAll: '🎮 Voor alle andere spelers gefinisht', beatNone: '🎮 Deze keer achter alle andere spelers',
      stats: '🏁 {W} zeges · {P} podiums · {O} poles', next: '🔜 Volgende: {C} · ronde {R}', last: '🏁 Dat was de laatste ronde.', firstRace: '🔜 Eerste race: {C}'
    }
  };

  // Template post. F = race facts from DMReport.facts (or null), s = save summary.
  function template(s, F, opts) {
    opts = opts || {};
    const lang = W[opts.lang] ? opts.lang : 'en', w = W[lang], tone = ['team', 'hype', 'press'].includes(opts.tone) ? opts.tone : 'team';
    const r = rng([s.season, s.rounds.done, opts.variant || 0, tone, lang].join('|'));
    const pick = a => a[Math.floor(r() * a.length)];
    const num = n => { const t = Number.isInteger(n) ? String(n) : (+n).toFixed(1); return lang === 'nl' ? t.replace('.', ',') : t; };
    const f = s.focus; if (!f) return '';
    const T = f.short, out = [];
    const race = opts.content !== 'season' && F;
    const best = race && F.focus && F.focus.results.length ? F.focus.results.slice().sort((a, b) => (a.finished === b.finished ? a.position - b.position : a.finished ? -1 : 1))[0] : null;
    const upper = x => (tone === 'press' ? x : x.toUpperCase());
    let head;
    const v = { C: race ? upper(short(F.circuit)) : '', T: upper(T), W: race && F.winner ? upper(F.winner.team) : '', P: best ? best.position : f.pos, R: s.rounds.done, S: s.season };
    if (s.preseason) head = pick(w.pre[tone]);
    else if (!race) head = pick(w.season[tone]);
    else if (F.focusRole === 'leader') head = pick(w.leader[tone]);
    else if (F.winner && F.winner.isFocus) head = pick(w.win[tone]);
    else if (best && !best.finished) head = pick(w.out[tone]);
    else if (best && best.position <= 3) head = pick(w.podium[tone]);
    else if (best) head = pick(w.points[tone]);
    else head = pick(w.leader[tone]);
    out.push('**' + md(fill(head, v)) + '**');

    if (race) {
      const M = F.margin != null && F.runnerUp && !F.lapsDown ? fill(pick(w.margin), { X: num(F.margin), R: md(F.runnerUp.team === F.winner.team ? crew(F.runnerUp.drivers) : F.runnerUp.team) }) : '';
      // Templates are written for a crew; one driver gets the singular verb.
      const one = (list, t) => (list || []).length !== 1 ? t : lang === 'nl' ? t.replace(/ brengen /, ' brengt ').replace(/ waren /, ' was ').replace(/ wonnen /, ' won ') : t.replace(/ bring /, ' brings ').replace(/ were /, ' was ');
      if (F.winner && F.winner.isFocus) out.push(one(F.winner.drivers, fill(pick(w.fromWin[tone]), { S: F.winner.start || '?', D: md(crew(F.winner.drivers)), M })).trim());
      else if (best && best.finished) out.push(one(best.drivers, fill(pick(w.fromPos[tone]), { D: md(crew(best.drivers)), P: best.position, S: best.start, T: md(T) })) + (F.winner ? ' ' + fill(pick(w.won), { W: md(F.winner.team) }) : ''));
      else if (best) out.push(fill(pick(w.outLine[tone]), { T: md(T), L: best.outLap ? (lang === 'nl' ? ' in ronde ' : ' on lap ') + best.outLap : '' }) + (F.winner ? ' ' + fill(pick(w.won), { W: md(F.winner.team) }) : ''));
      else if (F.winner) out.push(fill(pick(w.won), { W: md(F.winner.team) }) + ' ' + M);
      // An ordinary result gets its meaning from our own season: the run we are on, our average, the rival.
      if (best && best.finished && best.position > 3 && !(F.winner && F.winner.isFocus)) { const rel = TXT.relative(s.story, lang); if (rel) out.push(md(rel.charAt(0).toUpperCase() + rel.slice(1)) + '.'); }
      out.push('');
      if (F.export) {
        const E = F.export, bits = [];
        const c = (n, pair) => n + ' ' + (n === 1 ? pair[0] : pair[1]);
        if (E.sc) bits.push(c(E.sc, w.sc)); if (E.vsc) bits.push(c(E.vsc, w.vsc)); if (E.red) bits.push(c(E.red, w.red));
        out.push(bits.length ? fill(w.events, { X: bits.join(' · ') }) : w.clean);
      }
    } else out.push('');

    if (!s.preseason && f.pos != null) {
      let c = fill(w.champ, { P: f.pos + (f.tied ? '=' : ''), N: num(f.points) });
      if (f.pos === 1 && f.gapBehind) c += fill(w.lead, { X: num(f.gapBehind) });
      else if (f.pos > 1 && f.gapAhead != null) c += fill(w.gap, { X: num(f.gapAhead), Q: f.pos - 1 });
      const B = s.last && s.last.before && s.last.before.focus;
      if (B && B !== f.pos) c += fill(B > f.pos ? w.up : w.down, { B });
      out.push(c);
      if (!race || opts.content === 'both') out.push(fill(w.stats, { W: f.wins, P: f.podiums, O: f.poles }));
    }
    // Multiplayer: how the other player-run teams did.
    const PL = (s.players || []).filter(p => p.id !== f.id);
    if (PL.length && !s.preseason) {
      const res = p => race && p.race ? p.race : null;
      const who = p => (p.player ? '@' + String(p.player).replace(/([\\*_~`|>])/g, '\\$1') + ' (' + md(p.short) + ')' : md(p.short));
      out.push(w.players + ': ' + PL.map(p => who(p) + (res(p) ? ' ' + res(p) : '') + (p.pos != null ? ' (' + (lang === 'nl' ? 'kamp. P' : 'champ. P') + p.pos + ')' : '')).join(' · '));
      if (race && best && best.finished) {
        const beat = PL.filter(p => p.racePos == null || p.racePos > best.position).length;
        out.push(beat === PL.length ? w.beatAll : beat === 0 ? w.beatNone : fill(w.beat, { X: beat, N: PL.length }));
      }
    }
    if (f.expected && f.role === 'player') {
      const ts = s.preseason || f.pos == null ? 'on' : f.pos < f.expected ? 'ahead' : f.pos === f.expected ? 'on' : 'behind';
      const SLp = TXT.story(s, lang);
      if (!s.preseason) out.push(SLp.target ? '🎯 ' + md(SLp.target) : fill(w.target[ts], { P: f.expected }));
      if (!s.preseason && SLp.score && s.story && s.story.rival) out.push('🆚 ' + md(s.story.rival.short) + ': ' + md(SLp.score));
    }
    if (s.next) out.push(fill(s.preseason ? w.firstRace : w.next, { C: md(s.next.name), R: s.next.round }));
    else if (s.finished) out.push(w.last);
    const tags = ['#DeltaManager'];
    if (s.category) tags.push(tag(s.category));
    if (tone !== 'press') out.push('', tags.join(' '));
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }


  // ------------------------------------------------------------ other post types
  const K = {
    en: {
      champ: { team: 'CHAMPIONSHIP AFTER ROUND {R}/{N} 📊', hype: 'THE TITLE FIGHT AFTER ROUND {R}/{N} 🔥', press: 'Championship standings after round {R} of {N}' },
      champFinal: { team: 'FINAL STANDINGS {S} 🏆', hype: 'FINAL STANDINGS {S} 🏆', press: 'Final standings {S}' },
      champPre: { team: 'A NEW SEASON: {S} 🚦', hype: 'SEASON {S} IS COMING 🚦', press: 'Season {S}: the field' },
      usLead: { team: 'We lead the way by {X} points. 💪', hype: '{T} on top, {X} clear!', press: '' },
      usChase: { team: 'We are P{P}, {X} behind the leader.', hype: '{T} P{P}, {X} off the top. Game on.', press: '' },
      drivers: '👤 Drivers: {D} lead with {X}', driver1: '👤 Drivers: {D} leads with {X}', left: '🔢 {L} rounds left · max {M} pts per team · {C} teams still in it',
      rnd: { team: 'R&D UPDATE: {A} OF {B} UPGRADES WORKED 🔧', hype: 'FACTORY REPORT: {A}/{B} UPGRADES WORKED 🔧', press: 'R&D update {T}: {A} of {B} upgrades successful' },
      rndMood: { good: { team: 'The factory is flying. 🚀', hype: 'The factory is flying! 🚀' }, bad: { team: 'Not our best weeks in the factory. Back to the drawing board.', hype: 'Rough weeks in the factory…' } },
      ok: '✅ {N} {D} (W{W})', fail: '❌ {N} failed (W{W})', factory: '🏭 In the factory: {X}', ready: '{N}, ready week {W}',
      strong: '💪 Best in the field: {X}', weak: '⚠️ Weakest: {N} (#{R} of {O})', gain: '📈 Season gain {X}, #{R} of {O} teams',
      paddock: { team: 'NEWS FROM OUR GARAGE · WEEK {W} 📰', hype: 'PADDOCK NEWS: {T} · WEEK {W} 📰', press: 'Paddock news {T}, week {W}' },
      lineup: '📝 Drivers under contract until: {X}', nothing: 'Quiet weeks: no paddock news about us.'
    },
    nl: {
      champ: { team: 'KAMPIOENSCHAP NA RONDE {R}/{N} 📊', hype: 'DE TITELSTRIJD NA RONDE {R}/{N} 🔥', press: 'Stand in het kampioenschap na ronde {R} van {N}' },
      champFinal: { team: 'EINDSTAND {S} 🏆', hype: 'EINDSTAND {S} 🏆', press: 'Eindstand {S}' },
      champPre: { team: 'EEN NIEUW SEIZOEN: {S} 🚦', hype: 'SEIZOEN {S} KOMT ERAAN 🚦', press: 'Seizoen {S}: het veld' },
      usLead: { team: 'Wij gaan aan kop met {X} punten voorsprong. 💪', hype: '{T} bovenaan, {X} voorsprong!', press: '' },
      usChase: { team: 'We staan P{P}, {X} achter de leider.', hype: '{T} P{P}, {X} achter de top. Alles ligt nog open.', press: '' },
      drivers: '👤 Coureurs: {D} aan kop met {X}', driver1: '👤 Coureurs: {D} aan kop met {X}', left: '🔢 Nog {L} ronden · max {M} ptn per team · {C} teams nog in de race',
      rnd: { team: 'R&D-UPDATE: {A} VAN {B} UPGRADES GELUKT 🔧', hype: 'FABRIEKSRAPPORT: {A}/{B} UPGRADES GELUKT 🔧', press: 'R&D-update {T}: {A} van {B} upgrades gelukt' },
      rndMood: { good: { team: 'De fabriek draait op volle toeren. 🚀', hype: 'De fabriek draait op volle toeren! 🚀' }, bad: { team: 'Geen beste weken in de fabriek. Terug naar de tekentafel.', hype: 'Zware weken in de fabriek…' } },
      ok: '✅ {N} {D} (W{W})', fail: '❌ {N} mislukt (W{W})', factory: '🏭 In de fabriek: {X}', ready: '{N}, klaar in week {W}',
      strong: '💪 Beste van het veld: {X}', weak: '⚠️ Zwakste punt: {N} (#{R} van {O})', gain: '📈 Vooruitgang dit seizoen {X}, #{R} van {O} teams',
      paddock: { team: 'NIEUWS UIT ONZE GARAGE · WEEK {W} 📰', hype: 'PADDOCKNIEUWS: {T} · WEEK {W} 📰', press: 'Paddocknieuws {T}, week {W}' },
      lineup: '📝 Coureurs onder contract tot: {X}', nothing: 'Rustige weken: geen paddocknieuws over ons.'
    }
  };
  function templateKind(kind, s, v, opts) {
    opts = opts || {};
    const lang = K[opts.lang] ? opts.lang : 'en', k = K[lang], tone = ['team', 'hype', 'press'].includes(opts.tone) ? opts.tone : 'team';
    const num = n => { if (n == null) return '–'; const t = Number.isInteger(n) ? String(n) : (+n).toFixed(1); return lang === 'nl' ? t.replace('.', ',') : t; };
    const surname = n => String(n || '').trim().split(/\s+/).slice(-1)[0];
    const out = [], tags = ['#DeltaManager'].concat(s.category ? [tag(s.category)] : []);
    const end = () => { if (tone !== 'press') out.push('', tags.join(' ')); return out.join('\n').replace(/\n{3,}/g, '\n\n').trim(); };
    if (kind === 'championship') {
      const h = v.finished ? k.champFinal : v.preseason ? k.champPre : k.champ;
      out.push('**' + md(fill(h[tone], { R: v.round, N: v.total, S: v.season })) + '**');
      const f = v.focus;
      if (f && f.pos && !v.preseason && s.focus && s.focus.role === 'player') {
        const line = f.pos === 1 ? fill(k.usLead[tone], { X: num(v.leader.lead), T: md(f.team) }) : fill(k.usChase[tone], { P: f.pos, X: num(v.teams.find(t => t.mine).gap), T: md(f.team) });
        if (line) out.push(line);
      }
      out.push('');
      const medal = ['🥇', '🥈', '🥉'];
      const dec = v.teams.some(t => !Number.isInteger(t.points));
      const fmt = p => (dec ? (lang === 'nl' ? (+p).toFixed(1).replace('.', ',') : (+p).toFixed(1)) : String(p));
      let rows = v.teams.slice(0, 5); const mi = v.teams.findIndex(t => t.mine);
      for (const t of rows) out.push((t.pos && t.pos <= 3 && !v.preseason ? medal[t.pos - 1] : (t.pos || '–') + '.') + ' ' + (t.mine ? '**' + md(t.team) + '**' : md(t.team)) + (v.preseason ? '' : ' — ' + fmt(t.points) + (t.gap ? ' (−' + num(t.gap) + ')' : '')) + (t.move > 0 ? ' ⬆️' : t.move < 0 ? ' ⬇️' : ''));
      if (mi >= 5) out.push('…', v.teams[mi].pos + '. **' + md(v.teams[mi].team) + '** — ' + fmt(v.teams[mi].points) + ' (−' + num(v.teams[mi].gap) + ')');
      if (!v.preseason && v.drivers.length) {
        const top = v.drivers.filter(d => d.pos === v.drivers[0].pos);
        out.push('', fill(top.length > 1 ? k.drivers : k.driver1, { D: md(top.map(d => surname(d.name)).join('/')), X: num(top[0].points) }));
      }
      if (!v.preseason && !v.finished) out.push(fill(k.left, { L: v.left, M: num(v.maxTeam), C: v.contenders }));
      if (v.next && !v.finished) out.push(fill(W[lang].next, { C: md(v.next.name), R: v.next.round }));
      return end();
    }
    if (kind === 'rnd') {
      if (!v) return '';
      out.push('**' + md(fill(k.rnd[tone], { A: v.successes, B: v.done, T: v.team })) + '**');
      const rate = v.done ? v.successes / v.done : null;
      if (rate != null && tone !== 'press' && v.done >= 3) { const m = rate >= 0.66 ? k.rndMood.good : rate <= 0.34 ? k.rndMood.bad : null; if (m) out.push(m[tone]); }
      out.push('');
      for (const u of v.upgrades.slice(0, 4)) {
        const nm = lang === 'nl' ? (V_NL[u.key] || u.name) : u.name;
        out.push(u.success ? fill(k.ok, { N: nm, D: u.to != null && u.from != null ? '+' + num(+(u.to - u.from).toFixed(2)) : '', W: u.week }) : fill(k.fail, { N: nm, W: u.week }));
      }
      if (v.inProgress.length) out.push(fill(k.factory, { X: v.inProgress.slice(0, 2).map(d => fill(k.ready, { N: lang === 'nl' ? (V_NL[d.key] || d.name) : d.name, W: d.ready })).join(' · ') }));
      const best = v.attrs.filter(a => a.rank === 1);
      if (best.length) out.push(fill(k.strong, { X: best.map(a => (lang === 'nl' ? a.nl : a.label).toLowerCase() + ' (#1)').join(', ') }));
      if (v.weakest && v.weakest.rank > Math.ceil(v.attrs[0].of / 2)) out.push(fill(k.weak, { N: (lang === 'nl' ? v.weakest.nl : v.weakest.label).toLowerCase(), R: v.weakest.rank, O: v.attrs[0].of }));
      const g = v.topGainers.find(x => x.mine);
      if (g && v.myGainRank) out.push(fill(k.gain, { X: (g.gain >= 0 ? '+' : '') + num(g.gain), R: v.myGainRank, O: v.fieldSize }));
      return end();
    }
    if (kind === 'seasonStart' || kind === 'seasonEnd') {
      if (!v) return '';
      const ordE = n => { const x = n % 100; return n + (x >= 11 && x <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'); };
      const nl = lang === 'nl', P1 = n => (nl ? 'P' + n : ordE(n));
      const first = d => String(d || '').trim().split(/\s+/).slice(-1)[0];
      if (kind === 'seasonStart') {
        const H = { team: nl ? 'KLAAR VOOR {Y}! 🚦' : 'READY FOR {Y}! 🚦', hype: nl ? 'SEIZOEN {Y} KAN BEGINNEN! 🔥🚦' : 'SEASON {Y} IS HERE! 🔥🚦', press: nl ? '{T} klaar voor seizoen {Y}' : '{T} ready for the {Y} season' };
        out.push('**' + md(fill(H[tone], { Y: v.season, T: v.team })) + '**');
        if (v.started) out.push(nl ? '(Seizoen al begonnen: ronde ' + v.round + ' gereden.)' : '(Season already under way: ' + v.round + (v.round === 1 ? ' round' : ' rounds') + ' run.)');
        const lu = v.lineup.filter(d => d.role === 'driver');
        if (lu.length) out.push((tone === 'press' ? (nl ? 'Coureurs: ' : 'Drivers: ') : (nl ? '👥 Onze line-up: ' : '👥 Our line-up: ')) + lu.map(d => md(d.name) + (d.age ? ' (' + d.age + ')' : '')).join(', '));
        const rs = v.lineup.filter(d => d.role === 'reserve'); if (rs.length) out.push((nl ? '🔄 Reserve: ' : '🔄 Reserve: ') + rs.map(d => md(d.name)).join(', '));
        if (v.target) out.push('🎯 ' + (nl ? 'Doel: P' + v.target : 'Target: ' + ordE(v.target)) + (v.last ? (nl ? ' · vorig jaar P' + v.last.pos : ' · last year ' + ordE(v.last.pos)) : ''));
        out.push('📅 ' + v.rounds + (nl ? ' ronden' : ' rounds') + (v.first ? (nl ? ' · start in ' : ' · opener at ') + md(v.first.name) : '') + (v.finale ? (nl ? ' · finale in ' : ' · finale at ') + md(v.finale.name) : ''));
        if (v.champion && v.champion.driver) out.push('🏆 ' + (nl ? 'Kampioen ' + v.prevSeason + ': ' : v.prevSeason + ' champion: ') + md(v.champion.driver.name));
        if (v.tips.length) out.push((nl ? '🔮 Favorieten volgens de tests: ' : '🔮 Tipped in testing: ') + v.tips.slice(0, 3).map(md).join(', '));
        return end();
      }
      // season end / so far
      const done = v.finished;
      const H = v.pos === 1 && done ? { team: nl ? 'KAMPIOEN {Y}! 🏆' : '{Y} CHAMPIONS! 🏆', hype: nl ? 'WIJ ZIJN KAMPIOEN! 🏆🔥' : 'CHAMPIONS!!! 🏆🔥', press: nl ? '{T} kampioen {Y}' : '{T} win the {Y} title' }
        : done ? { team: nl ? 'SEIZOEN {Y} ZIT EROP 🏁' : 'THAT’S A WRAP ON {Y} 🏁', hype: nl ? 'WAT EEN SEIZOEN! {Y} 🏁' : 'WHAT A SEASON! {Y} 🏁', press: nl ? 'Seizoensoverzicht {Y}: {T}' : '{Y} season review: {T}' }
        : { team: nl ? 'TUSSENSTAND {Y} 📊' : '{Y} SO FAR 📊', hype: nl ? 'HET SEIZOEN TOT NU TOE 📊' : 'THE SEASON SO FAR 📊', press: nl ? '{T} na ronde {R} van {N}' : '{T} after round {R} of {N}' };
      out.push('**' + md(fill(H[tone], { Y: v.season, T: v.team, R: v.round, N: v.total })) + '**');
      if (v.pos) out.push((done ? (nl ? '🏁 Eindstand: ' : '🏁 Final position: ') : (nl ? '📊 Stand: ' : '📊 Standing: ')) + '**' + P1(v.pos) + '** · ' + num(v.points) + (nl ? ' punten' : ' points') + (v.gapToTop && v.pos > 1 ? ' (' + num(v.gapToTop) + (nl ? ' achter P1)' : ' back)') : ''));
      if (!v.limited) out.push('📈 ' + [v.wins + (nl ? (v.wins === 1 ? ' zege' : ' zeges') : (v.wins === 1 ? ' win' : ' wins')), v.podiums + (nl ? ' podiums' : (v.podiums === 1 ? ' podium' : ' podiums')), v.poles + ' poles', v.dnf + ' DNF'].join(' · '));
      if (v.best) out.push((nl ? '⭐ Beste race: ' : '⭐ Best race: ') + P1(v.best.pos) + (nl ? ' in ' : ' at ') + md(v.best.track));
      if (v.verdict) out.push('🎯 ' + (nl ? 'Doel P' + v.target + ': ' + { ahead: 'boven verwachting', on: 'gehaald', behind: 'niet gehaald' }[v.verdict] : 'Target ' + ordE(v.target) + ': ' + { ahead: 'beaten', on: 'hit', behind: 'missed' }[v.verdict]));
      if (v.drivers.length > 1) out.push((nl ? '👥 Coureurs: ' : '👥 Drivers: ') + v.drivers.map(d => md(first(d.name)) + ' ' + (d.pos ? P1(d.pos) : '–')).join(' · '));
      if (v.championDriver && !(v.champion && v.champion.mine)) out.push('🏆 ' + (done ? (nl ? 'Kampioen: ' : 'Champion: ') : (nl ? 'Leider: ' : 'Leader: ')) + md(v.championDriver.name) + (v.championDriver.team ? ' (' + md(v.championDriver.team) + ')' : ''));
      if (!done && s.next) out.push((nl ? '⏭️ Volgende: ' : '⏭️ Next up: ') + md(s.next.name));
      return end();
    }
    if (kind === 'us') {
      if (!v) return '';
      const ord = n => { if (n == null) return '–'; const x = n % 100; return n + (x >= 11 && x <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'); };
      const trackShort = String(v.track || '').replace(/\s+(International\s+|Motor\s+)?(Super)?[Ss]peedway$|\s+Raceway(\s+Park)?$|\s+International$/i, '').replace(/^Circuit of The Americas$/i, 'COTA');
      const T = trackShort.toUpperCase(), o = v.ours.slice().sort((a, b) => (a.finished === b.finished ? a.pos - b.pos : a.finished ? -1 : 1))[0];
      const sTag = /truck/i.test(v.series || '') ? '#TruckSeries' : /xfinity|o'reilly/i.test(v.series || '') ? '#XfinitySeries' : /cup/i.test(v.series || '') ? '#CupSeries' : '';
      const H = !o ? { team: '🏁 CHECKERED FLAG AT ' + T, hype: '🏁 CHECKERED FLAG AT ' + T + '!', press: v.winner ? md(v.winner.driver) + ' wins at ' + md(v.track) : 'Results from ' + md(v.track) }
        : !o.finished ? { team: 'TOUGH DAY AT ' + T + ' 💔', hype: 'HEARTBREAK AT ' + T + ' 💔', press: md(o.driver) + ' out of the race at ' + md(v.track) }
        : o.pos === 1 ? { team: '🏆 VICTORY LANE AT ' + T + '!', hype: '🏆 WE WIN AT ' + T + '!!', press: md(o.driver) + ' wins at ' + md(v.track) }
        : o.pos <= 5 ? { team: 'TOP-5 AT ' + T + '! 🔥', hype: 'P' + o.pos + ' AT ' + T + '! 🔥🔥', press: md(o.driver) + ' finishes ' + ord(o.pos) + ' at ' + md(v.track) }
        : o.pos <= 10 ? { team: 'TOP-10 AT ' + T + ' 🏁', hype: 'TOP-10 AT ' + T + '! 💪', press: md(o.driver) + ' finishes ' + ord(o.pos) + ' at ' + md(v.track) }
        : { team: 'P' + o.pos + ' AT ' + T + ' 🏁', hype: 'P' + o.pos + ' AT ' + T + ', ON TO THE NEXT ONE 🏁', press: md(o.driver) + ' finishes ' + ord(o.pos) + ' at ' + md(v.track) };
      out.push('**' + (tone === 'press' ? H.press : md(H[tone])) + '**');
      if (o) {
        if (!o.finished) out.push(tone === 'press' ? md(o.driver) + ' (' + md(o.team) + ') retired after starting ' + ord(o.start) + '.' : md(o.driver) + ' started ' + ord(o.start) + ' but our day ended early. We regroup and go again.');
        else if (o.pos === 1) out.push(tone === 'press' ? md(o.driver) + ' won from ' + ord(o.start) + ' for ' + md(o.team) + '.' : md(o.driver) + ' takes the checkered flag from ' + ord(o.start) + '! 🏁');
        else {
          const g = o.gain > 0 ? (tone === 'press' ? ', up ' + o.gain + ' spots' : ' (+' + o.gain + ')') : '';
          out.push(tone === 'press' ? md(o.driver) + ' started ' + ord(o.start) + ' and finished ' + ord(o.pos) + g + ' for ' + md(o.team) + '.'
            : md(o.driver) + (o.gain > 0 ? ' charges from ' + ord(o.start) + ' to ' + ord(o.pos) : ' brings it home ' + ord(o.pos) + ' after starting ' + ord(o.start)) + g + (tone === 'hype' ? '! 💪' : '. 💪'));
        }
        if (o.finished) out.push([o.stops != null ? o.stops + ' pit stops' : '', o.points != null ? o.points + ' points earned' : ''].filter(Boolean).join(' · '));
      }
      out.push('');
      if (v.winner && !(o && o.pos === 1)) out.push('🏆 ' + md(v.winner.driver) + ' (' + md(v.winner.team) + ') wins from ' + ord(v.winner.start));
      if (v.stages.length) out.push('🏁 Stage winners: ' + v.stages.map(x => 'S' + x.stage + ' ' + md(x.driver)).join(' · '));
      { // one entry per car: a crew that shares a car (endurance) is one finisher
        const cars = []; for (const r of v.top) { const c = cars.find(x => x.pos === r.pos && x.team === r.team); const nm = r.driver.split(' ').slice(-1)[0]; if (c) c.names.push(nm); else cars.push({ pos: r.pos, team: r.team, names: [nm] }); }
        out.push('🔝 Top 5: ' + cars.slice(0, 5).map(c => c.pos + '. ' + md(c.names.slice(0, 3).join('/'))).join(' · ')); }
      for (const d of (v.ourStandings || []).slice(0, 2)) out.push('📊 Points: ' + md(d.name) + ' ' + ord(d.pos) + (d.back ? ', ' + num(d.back) + ' back' : ', points leader'));
      if (v.next) out.push('⏭️ Next up: ' + md(v.next.track) + ' (Round ' + v.next.round + ')');
      if (tone !== 'press') out.push('', [/nascar|truck series|xfinity|cup series/i.test(v.series || '') ? '#NASCAR' : (v.series ? tag(v.series) : ''), sTag, '#DeltaManager'].filter(Boolean).join(' '));
      return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }
    if (kind === 'strategy') {
      if (!v) return '';
      const S2 = lang === 'nl'
        ? { h: { team: 'ONZE RACESTRATEGIE OP {C} 🧠', hype: 'ZO GING HET OP {C} 🧠', press: 'Strategie {T} op {C}' }, hp: { team: 'VAN P{S} NAAR P{P} OP {C} 📈', hype: 'P{S} → P{P} OP {C} 📈', press: '{T}: van P{S} naar P{P} op {C}' },
            line: '{P} vanaf P{S} · {N} · {X} s in de pits', stints: 'Stints: {X} ronden', fuel: '⛽ {N}× alleen tanken', sc: '🟡 {N}× gestopt onder caution', race: '🚩 {X}',
            win: 'Winnaar {W}: {N}, {X} s in de pits', climb: 'Grootste stijger: {T}, P{F} → P{P}', gain: '{G} plaatsen · {N}', stops: n => n === 1 ? '1 stop' : n + ' stops', laps: 'ronde', out: 'uitgevallen' }
        : { h: { team: 'OUR RACE STRATEGY AT {C} 🧠', hype: 'HOW IT WENT DOWN AT {C} 🧠', press: '{T} strategy at {C}' }, hp: { team: 'FROM P{S} TO P{P} AT {C} 📈', hype: 'P{S} → P{P} AT {C} 📈', press: '{T}: from P{S} to P{P} at {C}' },
            line: '{P} from P{S} · {N} · {X} s in the pits', stints: 'Stints: {X} laps', fuel: '⛽ {N}× fuel only', sc: '🟡 {N}× stopped under caution', race: '🚩 {X}',
            win: 'Winner {W}: {N}, {X} s in the pits', climb: 'Biggest climber: {T}, P{F} → P{P}', gain: '{G} places · {N}', stops: n => n === 1 ? '1 stop' : n + ' stops', laps: 'lap', out: 'retired' };
      const me = v.cars.find(c => c.mine) || v.cars[0], C2 = short(v.circuit), up = x => (tone === 'press' ? x : x.toUpperCase());
      const P2 = me.finished ? 'P' + me.finish : (me.status || 'DNF');
      if (v.hasExport) {
        out.push('**' + md(fill(S2.h[tone], { C: up(C2), T: v.team })) + '**');
        const stops = (me.pits || []).filter(p => !p.free).length;
        out.push(fill(S2.line, { P: P2, S: me.start, N: S2.stops(stops), X: num(me.pitTime) }));
        if (me.stints && me.stints.length) out.push(fill(S2.stints, { X: me.stints.map(st => st.to - st.from).join(' · ') }));
        const fuel = (me.pits || []).filter(p => p.fuelOnly).length; if (fuel) out.push(fill(S2.fuel, { N: fuel }));
        if (me.cautionStops) out.push(fill(S2.sc, { N: me.cautionStops }));
        if (v.cautions.length) out.push(fill(S2.race, { X: v.cautions.map(c => (c.kind === 'sc' ? 'SC' : c.kind === 'vsc' ? 'VSC' : (lang === 'nl' ? 'rode vlag' : 'red flag')) + ' ' + c.from + (c.to > c.from ? '–' + c.to : '')).join(' · ') }));
      } else {
        out.push('**' + md(fill(S2.hp[tone], { C: up(C2), T: v.team, S: me.start, P: me.finished ? me.finish : '–' })) + '**');
        const g = me.finished && me.start != null ? me.start - me.finish : null;
        out.push(fill(S2.gain, { G: g == null ? S2.out : (g > 0 ? '+' : g < 0 ? '−' : '±') + Math.abs(g), N: S2.stops(me.stops || 0) }));
      }
      return end();
    }
    if (kind === 'paddock') {
      out.push('**' + md(fill(k.paddock[tone], { W: v.week, T: v.focusTeam || '' })) + '**', '');
      const heads = (opts.headlines || []).slice(0, 5);
      if (!heads.length) out.push(k.nothing);
      for (const h of heads) out.push('• **' + md(h.head) + '**' + (h.detail ? ' — ' + md(h.detail) : ''));
      const line = v.contracts.filter(c => c.role === 'driver');
      if (line.length) out.push('', fill(k.lineup, { X: line.map(c => md(surname(c.name)) + ' ' + c.until).join(' · ') }));
      return end();
    }
    return '';
  }
  const V_NL = { speed: 'Topsnelheid', grip: 'Grip', aero: 'Aero', racePace: 'Racetempo', tyreManagement: 'Bandenbeheer', dirtyAir: 'Vuile lucht', overtaking: 'Inhalen', reliability: 'Betrouwbaarheid' };
  const TOPIC = {
    seasonStart: 'Topic: a season preview / introduction for this team: line-up (drivers, ages), reserve, target position, last season, the calendar (rounds, opener, finale), last year\'s champion and who was tipped in testing. Build anticipation; do not predict results beyond the target in the facts.',
    seasonEnd: 'Topic: a season review for this team (or the season so far if not finished): final or current position, points, wins, podiums, poles, DNFs, best race, target hit or missed, the champion or leader. Use the round-by-round results for the story of the year (strong and weak spells).',
    us: 'Topic: a race recap in the style of a NASCAR team social media post, in American English (regardless of the language setting above): ordinals (5th, 13th), "Victory Lane", "top-5", "top-10", points as "X back", stage winners if given, distances in miles. Focus on this team\'s driver(s); name the race winner. Hashtags: #NASCAR plus the series tag (#CupSeries, #XfinitySeries or #TruckSeries).',
    strategy: 'Topic: how the race went for this team only and the strategy it used: grid to finish, stints and stint lengths, pit stops (tyre or fuel only, under caution or green), time in the pits, safety cars. Do not discuss other teams. If there is no stint data, talk about grid to finish and places gained.',
    championship: 'Topic: an overview of the championship standings right now (title fight, gaps, who is still in contention, next race). The image shows the table, so pick the story, do not list every team.',
    rnd: 'Topic: an R&D / factory update for this team: which upgrades worked or failed, where the car ranks per attribute, what is still in development.',
    paddock: 'Topic: paddock news about this team only: protests by or against the team and the stewards decisions, its technical checks, what the pre-season analyst said about it, and its contracts. Do not mention other teams except as the other side of a protest. Report only what is in the facts.'
  };

  const DIARY_TOPIC = 'Topic: a playthrough log of my save: what happened in the last race, where we stand in the standings and what changed, what the factory did (upgrades, strongest and weakest areas, work in progress), my plan for the coming races (target, next circuit, priorities) and what is still possible this season (points left, rivals close by, contracts to decide on). The facts are in "playthrough".';
  // Prompt for the AI. Facts only; the model writes the words.
  const TONES = {
    team: 'Write as the team\'s own official social media account, in the first person plural ("we", "us"). Proud and energetic, never cringe.',
    hype: 'Write as an excited fan account that follows this team. Punchy, high energy, a few emojis.',
    press: 'Write as a motorsport journalist posting a news update. Factual and crisp, no exclamation marks, at most one emoji.',
    diary: 'Write as the player, in the first person ("I" as the team manager, "we" for the team), like a let\'s-play / playthrough update for other players. Lively, personal and honest about setbacks and choices, at most a few emojis.'
  };
  function aiPrompt(s, F, opts) {
    opts = opts || {};
    const lang = opts.lang === 'nl' ? 'Dutch' : 'English';
    const diary = opts.tone === 'diary' && opts.diary;
    const max = diary ? (opts.length === 'long' ? 1900 : 1200) : opts.length === 'long' ? 1200 : 600;
    const f = s.focus;
    const facts = {
      game: 'Delta Manager (motorsport management game)', category: s.category, season: s.season, mode: s.mode,
      round: s.rounds.done, totalRounds: s.rounds.total, preseason: s.preseason, seasonFinished: s.finished,
      team: f ? { name: f.name, short: f.short, championshipPosition: f.pos, tied: f.tied, points: f.points, gapToTeamAhead: f.gapAhead, teamAhead: f.ahead,
        leadOverNext: f.pos === 1 ? f.gapBehind : null, seasonWins: f.wins, seasonPodiums: f.podiums, seasonPoles: f.poles, seasonDNF: f.dnf,
        targetPosition: f.expected, drivers: f.drivers.map(d => d.name), role: f.role, manager: f.manager || undefined,
        positionBeforeLastRace: s.last && s.last.before ? s.last.before.focus : null } : null,
      coopPartners: s.partners.map(p => ({ team: p.short, position: p.pos, points: p.points })),
      otherPlayerTeams: s.players && s.players.length ? s.players.map(p => ({ player: p.player || undefined, team: p.short, championshipPosition: p.pos, points: p.points, lastRace: p.race })) : undefined,
      lastRace: opts.content === 'season' ? undefined : F || undefined,
      raceControl: opts.content === 'season' || !opts.events ? undefined : opts.events.slice(0, 40),
      standingsTop6: s.teams.slice(0, 6).map(t => ({ pos: t.pos, team: t.short, points: t.points })),
      nextRace: s.next ? { circuit: s.next.name, round: s.next.round } : null
    };
    if (opts.kind && opts.kind !== 'race') {
      facts.lastRace = undefined; facts.raceControl = undefined;
      facts[opts.kind] = opts.kind === 'strategy' && opts.view ? Object.assign({}, opts.view, { cars: opts.view.cars.filter(c => c.mine) }) : opts.view;
      if (opts.headlines) facts.paddockHeadlines = opts.headlines.map(h => ({ week: h.week, headline: h.head, detail: h.detail, ownTeam: h.mine }));
    }
    if (diary) facts.playthrough = opts.diary;
    const system = [
      'You write one social media post about a player\'s save in the game Delta Manager, to be posted on Discord next to an image card that already shows the standings.',
      'Output only the post, in ' + lang + ', using Discord markdown (**bold**, *italic*). No code blocks, no tables, no @mentions, no links.',
      diary ? 'Start with a short bold headline. Then short paragraphs that each start with a bold label: the race, the standings, the factory, my plan, what is still possible (skip a paragraph when its facts are missing). No hashtags.'
        : 'Start with a short bold headline. Then 2 to 4 short lines or one short paragraph. End with at most 3 hashtags; one of them is #DeltaManager.',
      'Use only the facts in the JSON. Never invent results, quotes, names, numbers, lap times or events. If a fact is missing, leave it out.',
      'Keep it under ' + max + ' characters.',
      TONES[opts.tone] || TONES.team,
      diary ? DIARY_TOPIC + (opts.kind && TOPIC[opts.kind] ? ' Give extra attention to this: ' + TOPIC[opts.kind].replace(/^Topic: /, '') : '')
        : opts.kind && TOPIC[opts.kind] ? TOPIC[opts.kind] : opts.content === 'season' ? 'Topic: a season progress update.' : 'Topic: the last race, with one line on the championship.'
    ].join('\n');
    const user = 'Facts (JSON):\n' + JSON.stringify(facts, null, 1) + (opts.extra ? '\n\nExtra wish from the player: ' + String(opts.extra).slice(0, 300) : '');
    return { system, user };
  }

  // One message for a chat (Claude, ChatGPT…): instructions + compact facts, answer in one code block.
  function chatPrompt(p) {
    const facts = p.user.replace(/^Facts \(JSON\):\n/, '');
    let compact = facts;
    try {
      const strip = o => Array.isArray(o) ? o.map(strip) : o && typeof o === 'object'
        ? Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length)).map(([k, v]) => [k, strip(v)])) : o;
      const cut = facts.split('\n\nExtra wish from the player: ');
      compact = JSON.stringify(strip(JSON.parse(cut[0]))) + (cut[1] ? '\n\nExtra wish from the player: ' + cut[1] : '');
    } catch (e) { /* keep as is */ }
    return p.system + '\nReply with only the post inside one code block (```), nothing before or after it, so it can be copied with one click.\n\nFacts (JSON):\n' + compact;
  }
  // Take the post out of a chat answer: the code block if there is one, otherwise the whole answer.
  function fromChat(answer) {
    const t = String(answer || '').replace(/\r/g, '');
    const m = /```(?:[a-z]*)\n?([\s\S]*?)```/i.exec(t);
    return (m ? m[1] : t).trim();
  }

  // Discord markdown → HTML for the preview (safe: escapes everything first).
  function discordHtml(text) {
    const esc = x => x.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const blocks = [];
    let t = esc(String(text || '')).replace(/```(?:[a-z]*\n)?([\s\S]*?)```/g, (_, code) => { blocks.push(code.replace(/\n$/, '')); return '\u0000' + (blocks.length - 1) + '\u0000'; });
    const inline = s => s
      .replace(/\\([\\*_~`|&gt;])/g, (_, c) => '\u0001' + c.charCodeAt(0) + '\u0001')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/__(.+?)__/g, '<u>$1</u>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/(^|\W)_(.+?)_(?=\W|$)/g, '$1<i>$2</i>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>').replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>')
      .replace(/\u0001(\d+)\u0001/g, (_, c) => String.fromCharCode(+c));
    const lines = t.split('\n').map(l => {
      let m;
      if ((m = /^-# (.*)$/.exec(l))) return '<div class="sub">' + inline(m[1]) + '</div>';
      if ((m = /^(#{1,3}) (.*)$/.exec(l))) return '<div class="h' + m[1].length + '">' + inline(m[2]) + '</div>';
      if ((m = /^&gt; (.*)$/.exec(l))) return '<div class="quote">' + inline(m[1]) + '</div>';
      return '<div>' + (inline(l) || '<br>') + '</div>';
    }).join('');
    return lines.replace(/\u0000(\d+)\u0000/g, (_, i) => '<pre>' + blocks[+i] + '</pre>');
  }

  return { template, templateKind, aiPrompt, chatPrompt, fromChat, discordHtml, TONES, TOPIC };
});
