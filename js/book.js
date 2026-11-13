/* DM Save Card — season book: every saved chapter of a playthrough in one HTML page
   (opens in any browser, prints to PDF, can be shared as a file). Redesign style. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./post.js'));
  else root.DMBook = factory(root.DMPost);
})(typeof self !== 'undefined' ? self : this, function (P) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const L = {
    en: { book: 'Playthrough', chapters: 'chapters', seasons: 'Seasons', season: 'Season', pos: 'Final', pts: 'Points', wins: 'Wins', target: 'Target', champion: 'Champion',
      goal: 'Goal', rules: 'House rules', follow: 'Following', made: 'Made with DM Save Card from the save files. Facts only from the game.', prologue: 'Prologue', chapter: 'Chapter', none: 'No chapters saved yet.' },
    nl: { book: 'Playthrough', chapters: 'hoofdstukken', seasons: 'Seizoenen', season: 'Seizoen', pos: 'Eindstand', pts: 'Punten', wins: 'Zeges', target: 'Doel', champion: 'Kampioen',
      goal: 'Doel', rules: 'Eigen regels', follow: 'Hoofdrolspelers', made: 'Gemaakt met DM Save Card uit de savebestanden. Alleen feiten uit de game.', prologue: 'Proloog', chapter: 'Hoofdstuk', none: 'Nog geen hoofdstukken bewaard.' }
  };

  function html(journal, opts) {
    opts = opts || {};
    const lang = opts.lang === 'nl' ? 'nl' : 'en', t = L[lang];
    const team = (journal && journal.team) || {}, S = journal.series || null;
    const color = /^#[0-9a-f]{3,8}$/i.test(team.color || '') ? team.color : '#E2372B';
    const title = S && S.name ? S.name : team.name || team.short || 'Delta Manager';
    const chapters = (journal.chapters || []).slice().sort((a, b) => a.no - b.no);
    const seasons = (journal.seasons || []).slice().sort((a, b) => a.season - b.season);
    const premise = [];
    if (S && (opts.goalText || S.goalText)) premise.push('<b>' + t.goal + ':</b> ' + esc(opts.goalText || S.goalText));
    if (S && S.focus && S.focus.length) premise.push('<b>' + t.follow + ':</b> ' + esc(S.focus.join(', ')));
    if (S && S.rules) premise.push('<b>' + t.rules + ':</b> ' + esc(S.rules));
    const toc = chapters.map(c => '<li><a href="#ch' + c.no + '"><b>' + (c.kind === 'prologue' ? '0' : c.no) + '</b><span>' + esc(c.title || '') + '</span><i>' + esc([c.season, c.round ? 'R' + c.round : null, c.circuit].filter(Boolean).join(' · ')) + '</i></a></li>').join('');
    const body = chapters.map(c => '<article id="ch' + c.no + '"><div class="kick">' + esc(c.kind === 'prologue' ? t.prologue : t.chapter + ' ' + c.no) + ' · ' + esc([c.season, c.round ? 'R' + c.round : null].filter(Boolean).join(' · ')) +
      (c.pos ? ' · P' + esc(c.pos) : '') + '</div>' + P.discordHtml(c.text || '') + '</article>').join('');
    const table = seasons.length ? '<h2>' + t.seasons + '</h2><table><tr><th>' + t.season + '</th><th>' + t.pos + '</th><th>' + t.pts + '</th><th>' + t.wins + '</th><th>' + t.target + '</th><th>' + t.champion + '</th></tr>' +
      seasons.map(x => '<tr><td>' + esc(x.season) + '</td><td>' + (x.pos ? 'P' + esc(x.pos) : '–') + '</td><td>' + esc(x.points ?? '–') + '</td><td>' + esc(x.wins ?? '–') + '</td><td>' + (x.expected ? 'P' + esc(x.expected) : '–') + '</td><td>' + esc(x.champion ? x.champion.team : '–') + '</td></tr>').join('') + '</table>' : '';
    return '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(title) + '</title>' +
      // Fonts are embedded by the page (opts.fontCss), so the book works offline and loads nothing from elsewhere.
      '<style>' + (opts.fontCss || '') + CSS.replace(/TEAM/g, color) + '</style></head><body>' +
      '<div class="stripe"></div><div class="redline"></div><header><div class="band"></div><div><div class="kick">' + t.book + ' · ' + esc(team.short || '') + ' · ' + chapters.length + ' ' + t.chapters + '</div><h1>' + esc(title) + '</h1>' +
      (premise.length ? '<p class="premise">' + premise.join('<br>') + '</p>' : '') + '</div></header><main>' +
      (toc ? '<nav><ol>' + toc + '</ol></nav>' : '<p>' + t.none + '</p>') + table + body + '</main><footer>' + t.made + '</footer></body></html>';
  }

  const CSS = [
    ':root{--asphalt:#15120F;--pit:#1E1A16;--raised:#29231D;--line:#3A322A;--chrome:#F4EDE2;--muted:#B3A797;--red:#E2372B;--green:#3DC36B;--gold:#F5C04A}',
    '*{box-sizing:border-box}body{margin:0;background:var(--asphalt);color:var(--chrome);font:17px/1.55 Barlow,system-ui,sans-serif}',
    '.stripe{height:10px;background-color:var(--chrome);background-image:repeating-conic-gradient(var(--asphalt) 0 25%,var(--chrome) 0 50%);background-size:10px 10px}.redline{height:3px;background:var(--red)}',
    'header{display:flex;gap:22px;max-width:860px;margin:0 auto;padding:40px 24px 10px}.band{width:10px;background:TEAM;flex:none}',
    'h1{margin:6px 0 10px;font:italic 800 56px/1 "Barlow Condensed",sans-serif;text-transform:uppercase;letter-spacing:.02em}',
    '.kick{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.premise{color:var(--chrome);margin:0}',
    'main{max-width:860px;margin:0 auto;padding:10px 24px 40px}nav ol{list-style:none;margin:24px 0;padding:0;border-top:1px solid var(--line)}',
    'nav li a{display:grid;grid-template-columns:44px 1fr auto;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);color:inherit;text-decoration:none}',
    'nav li a:hover span{color:var(--gold)}nav b{font:italic 800 24px/1 "Barlow Condensed",sans-serif}nav i{font-style:normal;color:var(--muted);font-size:14px}',
    'h2{font:italic 800 30px/1 "Barlow Condensed",sans-serif;text-transform:uppercase;margin:34px 0 12px}',
    'table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line)}th{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600}',
    'article{background:var(--pit);border:1px solid var(--line);border-left:4px solid TEAM;padding:22px 26px;margin:22px 0}',
    'article .h2{font:italic 800 34px/1.05 "Barlow Condensed",sans-serif;text-transform:uppercase;margin:6px 0 4px}article .h1{font:italic 800 40px/1 "Barlow Condensed",sans-serif}article .h3{font-weight:700}',
    'article .sub{color:var(--muted);font-size:13px;margin-bottom:6px}article b{color:#fff}article code{background:var(--asphalt);padding:0 4px}',
    'footer{max-width:860px;margin:0 auto;padding:20px 24px 50px;color:var(--muted);font-size:13px}',
    '@media print{body{background:#fff;color:#111}article{background:#fff;break-inside:avoid}.kick,th,footer,article .sub,nav i{color:#555}article b{color:#000}}'
  ].join('');

  return { html };
});
