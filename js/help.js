/* DM Save Card — "How it works": a short guide in a dialog, in English or Dutch.
   Opens on the part that fits what is on screen (a post type, multiplayer, posting). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMHelp = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // [id, title, html]. Kept short: one screen per part.
  const TEXT = {
    en: {
      title: 'How DM Save Card works',
      close: 'Close',
      parts: [
        ['start', 'Getting started', `
<p>DM Save Card turns your Delta Manager save into Discord posts: a card (image) and a text. It only <b>reads</b> your save; nothing is changed or uploaded.</p>
<ol><li><b>Choose your save folder</b> (top right): <code>sauvegardes</code> in the Delta Manager folder. With <code>start.bat</code> it is found by itself.</li>
<li><b>Pick a save</b> in the left column.</li>
<li><b>Pick a post type</b> in the bar at the top (Race, Summary, Chapter…).</li>
<li>Check the card and text, then <b>post</b> (see “Posting”).</li></ol>
<p>Save in the game and the card follows (Chrome/Edge or <code>start.bat</code>).</p>`],
        ['types', 'Post types', `
<p>The bar at the top groups the post types by when you post them. Pick a group, then a type in the row underneath.</p>
<table><tr><td><b>Race weekend</b></td><td>Preview (the coming race) · Race result · Race strategy · NASCAR recap</td></tr>
<tr><td><b>Story</b></td><td>Chapter (your playthrough) · Race summary (a run of races, from–to)</td></tr>
<tr><td><b>Team</b></td><td>Teammate duel · Development · R&amp;D update · Contracts · Paddock news</td></tr>
<tr><td><b>Season</b></td><td>Season preview · Championship · Season review · Wrapped (six slides)</td></tr></table>
<p>A group opens on the type you used last. The settings bar only shows what the chosen type can do.</p>`],
        ['text', 'Text', `
<ul><li><b>Source</b>: a ready-made text (<b>New wording</b> gives another version) or <b>Write with AI (chat)</b>: the facts go to a Claude chat, you paste the answer back.</li>
<li><b>My notes</b> (under Writing help): what you decided and why. Kept per save and round, and used in every AI prompt.</li>
<li><b>Help me …</b>: turn notes into a post, get interviewed first, fill the gaps in your draft, give a driver a voice, find titles, polish. Export the prompt (Claude, copy, .txt), import the answer (paste, .txt).</li>
<li>Over 2000 characters the text is split into several Discord messages (1/2, 2/2…).</li></ul>`],
        ['story', 'Story', `
<p>After every save the tool notes what changed (results, standings, firsts, signings, upgrades) in a journal. <b>Chapter</b> turns that into a story.</p>
<ul><li>A save that is already going: the first chapter is a <b>prologue</b> (the story so far).</li>
<li>A new career: <b>Start new playthrough</b> with a name, a goal and the drivers you follow.</li>
<li><b>Save as chapter</b> marks where the next chapter starts. <b>Season book (HTML)</b> gives all chapters as one page.</li>
<li>Every other post can be a chapter too: <b>Save as chapter</b> in the <i>Playthrough</i> section below the post keeps a race card, summary, duel, wrapped slide … with its text in the story and the book.</li></ul>`],
        ['post', 'Posting', `
<ul><li><b>Copy for Discord</b>: click, paste the card in your thread (Ctrl+V); click, paste the text with it and press Enter; click again for part 2 … One thing per paste, that is how Discord works.</li>
<li><b>Copy image</b> / <b>Download PNG</b>: just the card.</li>
<li>Each save can have its own webhook: tick <b>Use this webhook for this save</b> under Post to Discord.</li>
<li><b>Add to post</b> collects cards from several tabs, <b>Post</b> sends them as one message through a webhook. Nobody is pinged.</li>
<li><b>A webhook is requested from the Discord moderators</b> of your server. They create it for the channel (add <code>?thread_id=…</code> for your own thread). Keep it to yourself: whoever has it can post in that channel.</li></ul>`],
        ['mp', 'Multiplayer', `
<p>Only the host has the save. Every player can copy the <b>race summary</b> after a race.</p>
<ol><li>Left column: <b>+ New season from race recaps</b>, paste the first recap.</li>
<li>Choose <b>My team</b> and a team colour.</li>
<li>After each race: <b>Paste recap</b> or <b>Load .txt</b>.</li>
<li><b>Players</b>: one line per player, <code>* @discordname - Team name</code>. <b>Save as .txt</b> to read it back next season.</li>
<li><b>Player teams</b>: tick who drove in which round.</li></ol>
<p>Are you the host? Choose your save at <b>I am host</b>: then every card uses the save, and <b>Fill from save</b> lists the other human teams.</p>`],
        ['backup', 'Backup', `
<p>On the site everything you make (seasons, stories, notes) is kept in <b>this browser</b>.</p>
<ul><li><b>Backup</b> (left column) saves it as one .json file. <b>Restore</b> puts it back, also on another PC.</li>
<li>The webhook is never in a backup.</li>
<li>With <code>start.bat</code>: copy the folders <code>journal/</code> and <code>multiplayer/</code> next to the tool.</li></ul>`],
        ['privacy', 'Privacy', `
<ul><li>Your save is read on your own PC; nothing is uploaded.</li>
<li>Steam IDs are never read; manager names are left out.</li>
<li>AI text only goes through a chat you open yourself.</li>
<li>DM Save Card is a community tool, not part of Delta Manager.</li></ul>`]
      ]
    },
    nl: {
      title: 'Zo werkt DM Save Card',
      close: 'Sluiten',
      parts: [
        ['start', 'Beginnen', `
<p>DM Save Card maakt van je Delta Manager-save een Discord-post: een kaart (afbeelding) en een tekst. De tool <b>leest</b> je save alleen; er wordt niets gewijzigd of geüpload.</p>
<ol><li><b>Kies je savemap</b> (rechtsboven): <code>sauvegardes</code> in de map van Delta Manager. Met <code>start.bat</code> vindt de tool hem zelf.</li>
<li><b>Kies een save</b> in de linkerkolom.</li>
<li><b>Kies een posttype</b> in de balk bovenaan (Race, Summary, Chapter…).</li>
<li>Bekijk kaart en tekst en <b>post</b> (zie “Posten”).</li></ol>
<p>Sla je op in de game, dan werkt de kaart mee (Chrome/Edge of <code>start.bat</code>).</p>`],
        ['types', 'Posttypes', `
<p>De balk bovenaan groepeert de posttypes naar wanneer je ze post. Kies een groep, daarna een type in de rij eronder.</p>
<table><tr><td><b>Race weekend</b></td><td>Preview (de komende race) · Race result · Race strategy · NASCAR recap</td></tr>
<tr><td><b>Story</b></td><td>Chapter (je playthrough) · Race summary (een reeks races, van–tot)</td></tr>
<tr><td><b>Team</b></td><td>Teammate duel · Development · R&amp;D update · Contracts · Paddock news</td></tr>
<tr><td><b>Season</b></td><td>Season preview · Championship · Season review · Wrapped (zes slides)</td></tr></table>
<p>Een groep opent op het type dat je het laatst gebruikte. De instellingenbalk toont alleen wat het gekozen type kan.</p>`],
        ['text', 'Tekst', `
<ul><li><b>Source</b>: een kant-en-klare tekst (<b>New wording</b> geeft een andere versie) of <b>Write with AI (chat)</b>: de feiten gaan naar een Claude-chat, jij plakt het antwoord terug.</li>
<li><b>My notes</b> (onder Writing help): wat je besloot en waarom. Bewaard per save en ronde, en gebruikt in elke AI-prompt.</li>
<li><b>Help me …</b>: notities omzetten in een post, eerst geïnterviewd worden, gaten in je concept vullen, een coureur een stem geven, titels bedenken, oppoetsen. Prompt exporteren (Claude, kopiëren, .txt), antwoord importeren (plakken, .txt).</li>
<li>Boven de 2000 tekens wordt de tekst over meerdere Discord-berichten verdeeld (1/2, 2/2…).</li></ul>`],
        ['story', 'Verhaal', `
<p>Na elke save noteert de tool wat er veranderde (uitslagen, stand, primeurs, transfers, upgrades) in een dagboek. <b>Chapter</b> maakt daar een verhaal van.</p>
<ul><li>Een save die al loopt: het eerste hoofdstuk is een <b>proloog</b> (het verhaal tot nu toe).</li>
<li>Een nieuwe carrière: <b>Start new playthrough</b> met een naam, een doel en de coureurs die je volgt.</li>
<li><b>Save as chapter</b> legt vast waar het volgende hoofdstuk begint. <b>Season book (HTML)</b> geeft alle hoofdstukken op één pagina.</li>
<li>Elke andere post kan ook een hoofdstuk zijn: <b>Save as chapter</b> in het blok <i>Playthrough</i> onder de post bewaart een racekaart, samenvatting, duel, wrapped-slide … met tekst in het verhaal en het boek.</li></ul>`],
        ['post', 'Posten', `
<ul><li><b>Copy for Discord</b>: klik, plak de kaart in je thread (Ctrl+V); klik, plak de tekst erbij en druk op Enter; klik opnieuw voor deel 2 … Eén ding per keer plakken, zo werkt Discord.</li>
<li><b>Copy image</b> / <b>Download PNG</b>: alleen de kaart.</li>
<li>Elke save kan een eigen webhook hebben: vink <b>Use this webhook for this save</b> aan onder Post to Discord.</li>
<li><b>Add to post</b> verzamelt kaarten uit meerdere tabs, <b>Post</b> stuurt ze als één bericht via een webhook. Niemand wordt gepingd.</li>
<li><b>Een webhook vraag je aan bij de Discord-moderators</b> van je server. Zij maken hem aan voor het kanaal (met <code>?thread_id=…</code> erachter voor je eigen thread). Houd hem voor jezelf: wie hem heeft, kan in dat kanaal posten.</li></ul>`],
        ['mp', 'Multiplayer', `
<p>Alleen de host heeft de save. Elke speler kan na een race de <b>race summary</b> kopiëren.</p>
<ol><li>Linkerkolom: <b>+ New season from race recaps</b>, plak de eerste recap.</li>
<li>Kies <b>My team</b> en een teamkleur.</li>
<li>Na elke race: <b>Paste recap</b> of <b>Load .txt</b>.</li>
<li><b>Players</b>: één regel per speler, <code>* @discordnaam - Teamnaam</code>. <b>Save as .txt</b> om hem volgend seizoen weer in te lezen.</li>
<li><b>Player teams</b>: vink aan wie in welke ronde meereed.</li></ol>
<p>Ben jij de host? Kies je save bij <b>I am host</b>: dan gebruiken alle kaarten de save, en <b>Fill from save</b> zet de andere menselijke teams klaar.</p>`],
        ['backup', 'Back-up', `
<p>Op de site staat alles wat je maakt (seizoenen, verhalen, notities) in <b>deze browser</b>.</p>
<ul><li><b>Backup</b> (linkerkolom) bewaart het als één .json-bestand. <b>Restore</b> zet het terug, ook op een andere pc.</li>
<li>De webhook zit nooit in een back-up.</li>
<li>Met <code>start.bat</code>: kopieer de mappen <code>journal/</code> en <code>multiplayer/</code> naast de tool.</li></ul>`],
        ['privacy', 'Privacy', `
<ul><li>Je save wordt op je eigen pc gelezen; er wordt niets geüpload.</li>
<li>Steam-ID's worden nooit gelezen; managernamen blijven weg.</li>
<li>AI-tekst gaat alleen via een chat die je zelf opent.</li>
<li>DM Save Card is een community-tool, geen onderdeel van Delta Manager.</li></ul>`]
      ]
    }
  };

  // Which part fits the screen: multiplayer season, chapter tab, otherwise the start.
  function partFor(ctx) {
    ctx = ctx || {};
    if (!ctx.hasSave) return 'start';
    if (ctx.mp) return 'mp';
    if (ctx.kind === 'episode') return 'story';
    return 'types';
  }

  function html(lang, open) {
    const T = TEXT[lang] || TEXT.en;
    return '<div class="hlp-head"><h2>' + T.title + '</h2><button type="button" class="btn" data-help="close">' + T.close + '</button></div>' +
      '<nav class="hlp-nav">' + T.parts.map(([id, t]) => '<button type="button" class="hlp-tab' + (id === open ? ' on' : '') + '" data-help="' + id + '">' + t + '</button>').join('') + '</nav>' +
      T.parts.map(([id, t, body]) => '<section class="hlp-part" data-part="' + id + '"' + (id === open ? '' : ' hidden') + '><h3>' + t + '</h3>' + body + '</section>').join('');
  }

  return { TEXT, partFor, html };
});
