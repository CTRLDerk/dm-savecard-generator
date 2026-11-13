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
      let rows = list.slice(0, n);
      const meIdx = list.findIndex(r => (opts.table === 'drivers' ? f.drivers.some(d => d.name === r.name) : r.id === f.id));
      if (meIdx >= n) rows = rows.slice(0, n - 1).concat([null, list[meIdx]]);
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

  return { LABELS, L, discord, cut, fmtPts, fmtGap, fmtMoney, fmtDate, posLabel, gapLine, targetState, headerLine, surname };
});
