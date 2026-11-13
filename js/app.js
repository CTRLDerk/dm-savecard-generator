/* DM Save Card — page logic. Two sources: the local server (reads the save folder itself)
   or, without it, a folder the user picks in the browser. Nothing is uploaded either way. */
(function () {
  'use strict';
  const S = window.DMSave, T = window.DMText, Card = window.DMCard, R = window.DMReport, P = window.DMPost, V = window.DMViews, Cards = window.DMCards, DY = window.DMDiary;
  const RC = window.DMRecap, AS = window.DMAssist, Ch = window.DMChronicle, Ep = window.DMEpisode, EC = window.DMEpCards, Book = window.DMBook, XT = window.DMExtra, XC = window.DMExtraCards;
  if (XT && P.TOPIC) Object.assign(P.TOPIC, XT.TOPIC);
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('dmsc.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('dmsc.' + k, JSON.stringify(v)); } catch (e) { /* storage off: keep in memory */ } },
    del(k) { try { localStorage.removeItem('dmsc.' + k); } catch (e) { /* ignore */ } }
  };
  const MODES = { solo: 'Solo', coop: 'Co-op', spectator: 'Spectator', multiplayer: 'Multiplayer' };
  const isMp = id => /^mp\//.test(id || '');
  const defLang = (navigator.language || '').toLowerCase().startsWith('nl') ? 'nl' : 'en';
  const st = {
    source: null, status: null, slots: [], leagues: [], league: null, sel: store.get('sel', null), files: null, summary: null,
    logo: null, logoKey: null, loadedMtime: null, local: null, busy: false, exp: null, expName: null, variant: 0,
    page: store.get('page', 'chapter'), aiText: null, dirty: false, images: new Map(), tray: [], postText: null, journal: null, journalSlot: null, ep: null, ptForm: false,
    opt: Object.assign({ lang: defLang, table: 'teams', names: false, budget: false, live: true, src: 'social', tone: 'team', about: 'race', len: 'short', wish: '', kind: 'race', epCard: 'cover', epScope: 'chapter', slide: 'intro', person: '', from: '', to: '', whMode: 'notes' }, store.get('opt', {}), { names: false, budget: false })
  };
  const fontsReady = (document.fonts ? Promise.all(Card.helpers.F.FAMILIES.map(f => document.fonts.load(f))) : Promise.resolve()).catch(() => null);

  // ------------------------------------------------------------ data sources
  async function api(path, body) {
    const r = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok && !data.error) data.error = 'HTTP ' + r.status;
    data._status = r.status;
    return data;
  }
  async function getFile(id, name) {
    if (st.source === 'server') {
      const r = await fetch('api/file?slot=' + encodeURIComponent(id) + '&name=' + encodeURIComponent(name), { cache: 'no-store' });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(name + ': HTTP ' + r.status);
      return r.json();
    }
    const f = st.local && st.local.get(id) && st.local.get(id)[name];
    if (!f) return null;
    const data = JSON.parse(await f.text());
    return name === 'player.json' ? stripIds(data) : data;
  }
  const stripIds = o => Array.isArray(o) ? o.map(stripIds) : o && typeof o === 'object'
    ? Object.fromEntries(Object.entries(o).filter(([k]) => !/steam_?id/i.test(k)).map(([k, v]) => [k, stripIds(v)])) : o;

  // ------------------------------------------------------------ playthrough journal (one per save slot)
  async function loadJournal(id) {
    if (st.source === 'server') { try { const r = await api('api/journal?slot=' + encodeURIComponent(id)); return r.journal || null; } catch (e) { return null; } }
    return store.get('journal.' + id, null);
  }
  async function saveJournal() {
    if (!st.journal || !st.journalSlot) return;
    if (st.source === 'server') { try { await api('api/journal', { slot: st.journalSlot, journal: st.journal }); } catch (e) { /* keep in memory */ } }
    else store.set('journal.' + st.journalSlot, st.journal);
  }
  // Take a snapshot of the save and add what changed to the journal.
  async function syncJournal(id) {
    if (!Ch || !st.summary || !st.summary.focus) return;
    if (st.journalSlot !== id) { st.journal = await loadJournal(id); st.journalSlot = id; }
    const snap = Ch.snapshot(st.files, st.summary);
    const u = Ch.update(st.journal, snap, id);
    st.journal = u.journal; st.journalReset = u.reset;
    if (u.added.length || u.reset) await saveJournal();
  }

  // ------------------------------------------------------------ multiplayer seasons (race recaps, no save)
  async function loadLeagues() {
    if (st.source === 'server') { try { st.leagues = (await api('api/leagues')).leagues || []; } catch (e) { st.leagues = []; } }
    else st.leagues = store.get('leagues', []);
  }
  async function getLeague(id) {
    if (st.source === 'server') { const r = await api('api/league?id=' + encodeURIComponent(id)); return r.league || null; }
    return store.get('league.' + id, null);
  }
  async function putLeague(lg) {
    lg.updated = new Date().toISOString();
    const entry = { id: lg.id, name: lg.name, team: lg.team, color: lg.color, category: lg.category, host: lg.host || null, races: lg.recaps.length, mtime: Date.now() / 1000 };
    if (st.source === 'server') { const r = await api('api/league', { id: lg.id, league: lg }); if (!r.ok) throw new Error(r.error || 'Could not save'); }
    else { store.set('league.' + lg.id, lg); store.set('leagues', st.leagues.filter(x => x.id !== lg.id).concat(entry)); }
    await loadLeagues(); renderSlots();
  }
  async function dropLeague(id) {
    if (st.source === 'server') await api('api/league', { id, delete: true });
    else { store.del('league.' + id); store.set('leagues', st.leagues.filter(x => x.id !== id)); }
    await loadLeagues(); renderSlots();
  }
  function newLeagueForm(msg) {
    st.page = 'mp'; renderTabs();
    $('#main').innerHTML = sec('New multiplayer season') + (msg ? '<p class="alert">' + esc(msg) + '</p>' : '') +
      '<p class="note"><b>Hosting?</b> Pick your save below: every card then works from the save, and you only add the players. <b>Not the host?</b> Paste the <b>race summary</b> you copied from the game after each race: the tool builds the standings, your season and the chapters from those recaps (R&amp;D, budgets, contracts and ratings are not in a recap).</p>' +
      '<form class="mpnew" id="mpnew"><label class="f">Name <input id="mpname" type="text" maxlength="60" placeholder="e.g. Single Seater League S1" required></label>' +
      '<label class="f">Category <input id="mpcat" type="text" maxlength="40" placeholder="optional, e.g. Cup Series"></label>' +
      '<label class="f">I am host <select id="mphost0"><option value="">No: I use race recaps</option>' + hostOptions(null) + '</select></label>' +
      (st.slots.length ? '' : '<p class="note">To pick a save as host, choose your save folder first (top right).</p>') +
      '<label class="f col">Players (optional) <textarea class="txt" id="mproster0" spellcheck="false" placeholder="* @discordname - Team name">' + esc(store.get('roster.last', '')) + '</textarea></label>' +
      '<textarea class="txt paste" id="mptext" spellcheck="false" placeholder="Paste the first race summary here (it starts with === Race summary — …). Not needed when you host." aria-label="Race summary"></textarea>' +
      '<div class="actions top"><button class="btn pri" type="submit">Create season</button><span class="note" id="mpnote"></span></div></form>';
    $('#mpnew').addEventListener('submit', async e => {
      e.preventDefault();
      const name = $('#mpname').value.trim(), text = $('#mptext').value, host = $('#mphost0').value || null;
      const c = text.trim() ? RC.check({ recaps: [] }, text) : { ok: !!host, error: 'Pick your save as host, or paste a race summary.' };
      if (!c.ok) { note('#mpnote', c.error, 'err'); return; }
      let id = 'mp/' + RC.slug(name), n = 2;
      while (st.leagues.some(x => x.id === id)) id = 'mp/' + RC.slug(name).slice(0, 36) + '-' + n++;
      const lg = { v: 1, id, name, category: $('#mpcat').value.trim() || null, team: null, color: null, created: new Date().toISOString(), recaps: text.trim() ? [{ text, added: new Date().toISOString() }] : [], host, roster: RC.parseRoster($('#mproster0').value).list };
      try { await putLeague(lg); } catch (err) { note('#mpnote', err.message, 'err'); return; }
      select(id);
    });
  }
  // Two clicks instead of a browser dialog.
  function confirmDel(btn) {
    if (btn.dataset.armed) return true;
    btn.dataset.armed = '1'; const t = btn.textContent; btn.textContent = 'Click again to delete';
    setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = t; } }, 4000);
    return false;
  }
  // Add one or more recaps to the open season.
  async function addRecaps(texts) {
    const lg = st.league; if (!lg) return;
    const msgs = []; let added = 0;
    for (const text of texts) {
      const c = RC.check(lg, text);
      if (!c.ok) { msgs.push(c.error); continue; }
      if (c.replaces) lg.recaps = lg.recaps.filter(r => { const q = RC.parse(r.text); return !q || q.key !== c.parsed.key; });
      lg.recaps.push({ text, added: new Date().toISOString() }); added++;
      msgs.push('Round ' + c.parsed.round + ' · ' + c.parsed.location + (c.replaces ? ' (replaced)' : ''));
    }
    if (added) { await putLeague(lg); await select(lg.id); }
    note('#mprnote', msgs.join(' · ') || 'Nothing added.', added ? 'ok' : 'err');
  }
  // Player-run teams of the newest race, with their result there (best car).
  function mpPlayers(s) {
    const b = st.mpBuild, norm = x => String(x || '').toLowerCase().replace(/\s*\(#\s?\d+\)\s*$/, '').replace(/[^a-z0-9]/g, '');
    const names = new Set(((b && b.players) || []).map(norm));
    const cars = (s.last && s.last.cars) || [];
    s.players = s.teams.filter(t => names.has(norm(t.name))).map(t => {
      const mine = cars.filter(c => c.teamId === t.id).sort((x, y) => (x.finished === y.finished ? x.position - y.position : x.finished ? -1 : 1))[0];
      const ro = ((b && b.roster) || []).find(p => norm(p.match) === norm(t.name));
      return { id: t.id, short: t.short, name: t.name, color: t.color, pos: t.pos, points: t.points, player: ro && ro.name !== '?' ? ro.name : null,
        race: mine ? (mine.finished ? 'P' + mine.position : mine.status || 'DNF') : null, racePos: mine && mine.finished ? mine.position : null };
    });
  }
  async function setRoster(text) {
    const lg = st.league; if (!lg) return;
    const r = RC.parseRoster(text);
    lg.roster = RC.rosterCheck(r.list, st.mpBuild ? st.mpBuild.teams : []).map(p => ({ name: p.name, team: p.match || p.team }));   // spelling as in the recaps
    store.set('roster.last', RC.formatRoster(lg.roster));
    await putLeague(lg); await select(lg.id);
    if (r.bad.length) note('#rosternote', 'Skipped (use “* @name - Team”): ' + r.bad.slice(0, 3).join(' | '), 'err');
  }
  const hostOptions = sel => st.slots.slice().sort((x, y) => (y.mode === 'coop') - (x.mode === 'coop')).map(x => '<option value="' + esc(x.id) + '"' + (x.id === sel ? ' selected' : '') + '>' +
    esc((x.team || x.id) + ' · ' + (MODES[x.mode] || x.mode) + ' · slot ' + x.id.split('_').pop() + (x.season ? ' · S' + x.season : '')) + '</option>').join('');
  function mpPanel() {
    const lg = st.league, b = st.mpBuild; if (!lg || !b) return '';
    const done = new Map(b.races.map(r => [r.round, r]));
    const chips = b.races.map(r => '<span class="chip">R' + r.round + ' · ' + esc(r.location) + '<button type="button" class="rm" data-act="mprm" data-key="' + esc(r.key) + '" aria-label="Remove round ' + r.round + '">×</button></span>').join('');
    const missing = []; if (b.last) for (let i = 1; i <= b.last.round; i++) if (!done.has(i)) missing.push(i);
    return '<section class="mp">' + sec(b.races.length ? 'Race recaps' : 'Multiplayer season') +
      '<div class="filters"><label class="f">I am host <select id="mphost"><option value="">No: recaps only</option>' +
        hostOptions(lg.host) + '</select></label>' +
      (st.hostMode ? '</div><p class="note ok">Hosting: every card uses the save (R&amp;D, budgets, contracts, next race). Recaps add race events and the player list.</p><div class="filters">' : lg.host ? '</div><p class="alert">The host save (' + esc(lg.host) + ') is not in the save folder: using the recaps.</p><div class="filters">' : '') +
      (st.hostMode ? '' : '<label class="f">My team <select id="mpteam"><option value="">Choose…</option>' + b.teams.map(t => '<option' + (t === lg.team ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></label>' +
        '<label class="f">Team colour <input type="color" id="mpcolor" value="' + esc(/^#[0-9a-f]{6}$/i.test(lg.color || '') ? lg.color : '#E2372B') + '"></label>') +
        '<label class="f">Category <input id="mpcat2" type="text" maxlength="40" value="' + esc(lg.category || '') + '" placeholder="e.g. Cup Series"></label></div>' +
      (lg.team || st.hostMode ? '' : '<p class="alert">Choose <b>my team</b>: until then the cards follow the championship leader.</p>') +
      '<div class="chips">' + chips + '</div>' +
      (() => {
        const chk = RC.rosterCheck(lg.roster, b.teams), miss = chk.filter(p => !p.match);
        return '<div class="roster"><span class="sl">Players</span>' +
          '<textarea class="txt" id="mproster" rows="' + Math.max(3, (lg.roster || []).length + 1) + '" spellcheck="false" placeholder="* @discordname - Team name   (one per line)" aria-label="Players">' + esc(RC.formatRoster(lg.roster)) + '</textarea>' +
          '<div class="actions"><button class="btn" type="button" data-act="rosterdl">Save as .txt</button><button class="btn" type="button" data-act="rosterload">Load .txt</button>' +
          '<input type="file" id="rosterfile" accept=".txt,text/plain" hidden><button class="btn" type="button" data-act="rostercopy">Copy</button>' +
            (st.hostMode ? '<button class="btn" type="button" data-act="rosterfill">Fill from save</button>' : '') +
          '<span class="note' + (miss.length ? ' err' : chk.length ? ' ok' : '') + '" id="rosternote">' + (miss.length ? 'No team in the recaps called: ' + esc(miss.map(p => p.team).join(', ')) : chk.length ? chk.length + ' players, all teams found. They start as player teams in every round.' : 'One line per player: * @discordname - Team name') + '</span></div></div>';
      })() +
      (!b.races.length ? '<p class="note">No race recaps: everything comes from your save. Add recaps only if you want safety cars and race events in the texts.</p>' : '') +
      (!b.races.length ? '' : '<div class="players"><span class="sl">Player teams</span><label class="f">in <select id="mpround">' + b.races.slice().reverse().map(r => '<option value="' + esc(r.key) + '"' + (r.key === (st.mpRound || b.last.key) ? ' selected' : '') + '>R' + r.round + ' · ' + esc(r.location) + '</option>').join('') + '</select></label>' +
        (() => { const r = b.races.find(x => x.key === (st.mpRound || b.last.key)) || b.last, on = new Set(r.players);
          return b.teams.map(t => '<label class="pchip' + (t === lg.team ? ' me' : '') + '"><input type="checkbox" data-pteam="' + esc(t) + '"' + (on.has(t) || t === lg.team ? ' checked' : '') + (t === lg.team ? ' disabled' : '') + '> ' + esc(t) + '</label>').join('') +
            '<p class="note">' + (r.ownPlayers ? 'Set for this round.' : 'Taken over from the round before.') + ' Later rounds take over this list until you change it there.</p>'; })() +
      '</div>') +
      (missing.length ? '<p class="note">No recap yet for round ' + missing.join(', ') + ': those races are left out of the season story.</p>' : '') +
      '<div class="actions top"><button class="btn pri" type="button" data-act="mppaste">Paste recap</button><button class="btn" type="button" data-act="mpload">Load .txt</button>' +
        '<input type="file" id="mpfile" accept=".txt,text/plain" multiple hidden><button class="btn" type="button" data-act="mpdel">Delete season</button><span class="note" id="mprnote"></span></div>' +
      '<textarea class="txt paste" id="mppastebox" hidden spellcheck="false" placeholder="Paste the race summary here (=== Race summary — … ===)" aria-label="Race summary"></textarea></section>';
  }

  // ------------------------------------------------------------ webhook per save (falls back to the default webhook)
  const hookFor = id => store.get('hook.' + id, '') || store.get('hook', '');
  function hookNote() {
    const own = !!store.get('hook.' + st.sel, ''), def = !!store.get('hook', '');
    note('#hooknote', own ? 'This save posts to its own webhook.' : def ? 'Using your default webhook.' : 'Not remembered: paste it again next time.', own || def ? 'ok' : '');
  }

  // ------------------------------------------------------------ boot
  async function boot() {
    let status = null;
    try { status = await api('api/status'); } catch (e) { status = null; }
    if (status && status.ok) {
      st.source = 'server'; st.status = status;
      $('#ver').textContent = 'v' + status.version;
      $('#pick').textContent = 'Change folder'; $('#pick').hidden = false;
      showFolder();
      await loadLeagues();
      await refreshSlots(true);
      setInterval(poll, 5000);
    } else {
      st.source = 'local';
      $('#folder').innerHTML = 'No local server: choose your <b>sauvegardes</b> folder. Files stay on your PC.' + (FSA ? '' : ' <span title="Firefox and Safari cannot remember a folder; Chrome and Edge can.">(chosen each visit in this browser)</span>');
      $('#pick').hidden = false;
      await loadLeagues();
      renderSlots();
      let reopened = false;
      if (FSA) { try { const h = await idb.get('dir'); if (h) reopened = await openHandle(h, false); } catch (e) { /* no stored folder */ } }
      if (!reopened && isMp(st.sel) && st.leagues.some(x => x.id === st.sel)) select(st.sel);
    }
  }
  function showFolder() {
    const s = st.status;
    $('#folder').innerHTML = s && s.saves ? '<b>Saves</b> ' + esc(s.saves) : 'Save folder <b>not found</b>';
    $('#folder').title = s && s.saves ? s.saves + ' (' + s.source + ')' : '';
  }

  // ------------------------------------------------------------ save folder in the browser (no server)
  // Chrome/Edge: a folder handle that is remembered and read again every few seconds (updates after each save).
  // Other browsers: the classic folder picker, read once.
  const FSA = typeof window.showDirectoryPicker === 'function';
  const idb = {
    db: () => new Promise((ok, no) => { const r = indexedDB.open('dmsc', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }),
    async get(k) { const d = await this.db(); return new Promise(ok => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); }); },
    async set(k, v) { const d = await this.db(); return new Promise(ok => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => ok(); t.onerror = () => ok(); }); }
  };
  async function readHandle(root) {
    let dir = root;
    try { dir = await root.getDirectoryHandle('sauvegardes'); } catch (e) { /* the saves folder itself was chosen */ }
    const map = new Map();
    for await (const [mode, mh] of dir.entries()) {
      if (mh.kind !== 'directory') continue;
      for await (const [slot, sh] of mh.entries()) {
        if (sh.kind !== 'directory' || !/^slot_\d+$/.test(slot)) continue;
        const files = {};
        for (const name of Object.values(S.FILES)) {
          try { let h = sh; const parts = name.split('/'); for (const d of parts.slice(0, -1)) h = await h.getDirectoryHandle(d); files[name] = await (await h.getFileHandle(parts[parts.length - 1])).getFile(); } catch (e) { /* not in this slot */ }
        }
        if (files['meta.json']) map.set(mode + '/' + slot, files);
      }
    }
    return map;
  }
  async function useLocal(map, label) {
    st.local = map;
    const slots = [];
    for (const [id, fs] of map) {
      if (!fs['meta.json']) continue;
      try { slots.push(Object.assign(S.slotInfo(id, JSON.parse(await fs['meta.json'].text())), { mtime: fs['meta.json'].lastModified / 1000 })); } catch (err) { /* skip broken slot */ }
    }
    const changed = st.slots.find(x => x.id === st.sel) && slots.find(x => x.id === st.sel && x.mtime !== st.loadedMtime);
    st.slots = slots;
    $('#folder').innerHTML = '<b>Folder</b> ' + esc(label || '') + ' · ' + slots.length + ' saves' + (st.dirHandle ? ' · live' : '');
    renderSlots();
    return changed;
  }
  async function openHandle(h, ask) {
    let perm = await h.queryPermission({ mode: 'read' });
    if (perm !== 'granted' && ask) perm = await h.requestPermission({ mode: 'read' });
    if (perm !== 'granted') { st.dirPending = h; showReopen(h); return false; }
    st.dirHandle = h; st.dirPending = null; $('#pick').textContent = 'Change folder';
    await useLocal(await readHandle(h), h.name);
    pickDefault();
    clearInterval(st.localTimer);
    st.localTimer = setInterval(localPoll, 5000);
    return true;
  }
  // The browser remembers the folder, but asks once per visit before the page may read it again.
  // One click on this button is enough (Chrome may offer "Allow on every visit": then not even that).
  function showReopen(h) {
    $('#pick').textContent = 'Reopen ' + h.name;
    $('#folder').innerHTML = '<b>Folder</b> ' + esc(h.name) + ' · click to open';
    if (isMp(st.sel) && st.leagues.some(x => x.id === st.sel)) return;   // a multiplayer season needs no folder
    $('#main').innerHTML = sec('Welcome back') +
      '<p>Your save folder is remembered: <b>' + esc(h.name) + '</b>. The browser only asks once per visit whether the page may read it again.</p>' +
      '<div class="actions top"><button class="btn pri" type="button" id="reopen">Open ' + esc(h.name) + '</button><button class="btn" type="button" id="otherdir">Choose another folder</button></div>' +
      '<p class="note">Tip: when Chrome or Edge asks, pick <b>Allow on every visit</b> and the tool opens your saves straight away next time.</p>';
    $('#reopen').addEventListener('click', () => openHandle(h, true).then(ok => { if (!ok) note('#folder', 'No permission given. Click again to retry.', 'err'); }));
    $('#otherdir').addEventListener('click', () => { st.dirPending = null; $('#pick').click(); });
  }
  async function localPoll() {
    if (!st.dirHandle || document.hidden || st.busy) return;
    let map; try { map = await readHandle(st.dirHandle); } catch (e) { return; }
    const sig = m => [...m].map(([id, f]) => id + (f['meta.json'] ? f['meta.json'].lastModified : '')).join('|');
    if (st.local && sig(map) === sig(st.local)) return;
    const changed = await useLocal(map, st.dirHandle.name);
    const host = st.hostMode && st.league ? st.league.host : st.sel;
    const cur = st.slots.find(x => x.id === host);
    if (cur && st.opt.live && cur.mtime !== st.loadedMtime && (changed || st.hostMode)) {
      const kept = st.dirty || st.aiText;
      await select(st.sel, true);
      note('#imgnote', 'Card updated after your save at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '.', 'ok');
      if (kept) note('#gennote', 'New save data: your text was kept.', 'ok');
    }
  }

  $('#pick').addEventListener('click', async () => {
    if (st.source !== 'local') return showSetFolder();
    if (st.dirPending) return openHandle(st.dirPending, true);
    if (!FSA) return $('#dir').click();
    let h; try { h = await window.showDirectoryPicker({ id: 'dm-saves', mode: 'read' }); } catch (e) { return; }
    await idb.set('dir', h).catch(() => null);
    await openHandle(h, true);
  });
  $('#dir').addEventListener('change', async e => {
    const map = new Map();
    for (const f of e.target.files) {
      const parts = (f.webkitRelativePath || f.name).split('/');
      const i = parts.findIndex(p => /^slot_\d+$/.test(p));
      if (i < 1) continue;
      const id = parts[i - 1] + '/' + parts[i], name = parts.slice(i + 1).join('/');
      if (!map.has(id)) map.set(id, {});
      map.get(id)[name] = f;
    }
    await useLocal(map, (e.target.files[0] && e.target.files[0].webkitRelativePath.split('/')[0]) || '');
    pickDefault();
  });

  function showSetFolder(msg) {
    $('#main').innerHTML = sec('Save folder') +
      (msg ? '<p class="alert">' + msg + '</p>' : '') +
      '<p class="note">Paste the path of your <b>sauvegardes</b> folder (or the Delta Manager install folder). Usually:<br><code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\Delta Manager\\sauvegardes</code></p>' +
      '<form class="setfolder" id="setf"><input id="fpath" type="text" spellcheck="false" value="' + esc((st.status && st.status.saves) || '') + '" aria-label="Save folder path">' +
      '<button class="btn pri" type="submit">Use folder</button></form><p class="note" id="fnote"></p>';
    $('#setf').addEventListener('submit', async e => {
      e.preventDefault();
      const res = await api('api/config', { saves: $('#fpath').value });
      if (!res.ok) { $('#fnote').className = 'note err'; $('#fnote').textContent = res.error || 'That folder did not work.'; return; }
      st.status = Object.assign({}, st.status, res); showFolder();
      await refreshSlots(true);
    });
  }

  // ------------------------------------------------------------ save list
  async function refreshSlots(first) {
    const res = await api('api/slots');
    st.slots = (res.slots || []).map(x => Object.assign(S.slotInfo(x.id, x.meta), { mtime: x.mtime }));
    renderSlots();
    if (!st.slots.length && !(isMp(st.sel) && st.leagues.some(x => x.id === st.sel))) { showSetFolder(st.status && st.status.saves ? 'No save slots in this folder yet.' : 'The save folder was not found automatically.'); return; }
    if (first) pickDefault();
  }
  function pickDefault() {
    const ids = st.slots.map(s => s.id).concat(st.leagues.map(l => l.id));
    const when = s => Date.parse(s.savedAt || '') || (s.mtime || 0) * 1000;
    if (!ids.includes(st.sel)) st.sel = (st.slots.slice().sort((a, b) => when(b) - when(a))[0] || {}).id || null;
    if (st.sel) select(st.sel);
  }
  function ago(iso) {
    const d = new Date(iso); if (!iso || isNaN(d)) return '';
    const m = Math.round((Date.now() - d) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; if (m < 48 * 60) return Math.round(m / 60) + ' h ago';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function renderSlots() {
    const groups = {};
    for (const s of st.slots) (groups[s.mode] = groups[s.mode] || []).push(s);
    const order = ['solo', 'coop', 'spectator'].concat(Object.keys(groups).filter(k => !MODES[k]));
    let html = '';
    for (const m of order) {
      if (!groups[m]) continue;
      html += '<div class="grp">' + esc(MODES[m] || m) + '</div>';
      for (const s of groups[m]) {
        const name = s.team || (s.mode === 'spectator' ? 'Spectator save' : s.id);
        const bits = ['Slot ' + s.id.split('_').pop(), s.season ? 'S' + s.season + (s.week ? ' · W' + s.week : '') : '', s.position && s.mode !== 'spectator' ? 'P' + s.position : ''].filter(Boolean);
        html += '<button type="button" class="srow' + (s.id === st.sel ? ' on' : '') + '" data-id="' + esc(s.id) + '">' +
          '<span class="bar" style="background:' + esc(/^#[0-9a-f]{3,8}$/i.test(s.color || '') ? s.color : '#737B8B') + '"></span>' +
          '<span><span class="nm" style="display:block">' + esc(name) + '</span><span class="v">' + esc(bits.join(' · ')) + ' · ' + esc(ago(s.savedAt)) + '</span></span></button>';
      }
    }
    if (!st.slots.length) html += st.source === 'local' && !st.local ? '<p class="empty">Choose the <b>sauvegardes</b> folder in your Delta Manager install folder.</p>' : '<p class="empty">No saves found.</p>';
    // Multiplayer seasons have their own tab; the column lists the save slots only.
    html += '<button type="button" class="btn mpadd" data-act="mppage">Multiplayer seasons' + (st.leagues.length ? ' (' + st.leagues.length + ')' : '') + ' →</button>';
    // In the browser everything (seasons, journals, notes) lives in this browser: a backup file keeps it safe.
    if (st.source === 'local') html += '<div class="bk"><button type="button" class="btn" data-act="backup">Backup</button><button type="button" class="btn" data-act="restore">Restore</button><input type="file" id="bkfile" accept=".json,application/json" hidden></div><p class="note" id="bknote">Seasons, stories and notes are kept in this browser.</p>';
    $('#slots').innerHTML = html;
  }
  $('#slots').addEventListener('change', async e => {
    if (e.target.id !== 'bkfile' || !e.target.files[0]) return;
    let data; try { data = JSON.parse(await e.target.files[0].text()); } catch (err) { data = null; }
    e.target.value = '';
    if (!data || data.tool !== 'DM Save Card' || !data.data) { note('#bknote', 'Not a DM Save Card backup.', 'err'); return; }
    for (const [k, v] of Object.entries(data.data)) { try { localStorage.setItem(k, v); } catch (err) { note('#bknote', 'The browser storage is full.', 'err'); return; } }
    note('#bknote', 'Restored ' + Object.keys(data.data).length + ' items. Reloading…', 'ok'); setTimeout(() => location.reload(), 800);
  });
  $('#slots').addEventListener('click', e => {
    if (e.target.closest('[data-act=mppage]')) { showPage('mp'); return; }
    if (e.target.closest('[data-act=backup]')) {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('dmsc.') && !k.startsWith('dmsc.hook')) data[k] = localStorage.getItem(k); }
      const url = URL.createObjectURL(new Blob([JSON.stringify({ tool: 'DM Save Card', version: 1, at: new Date().toISOString(), data })], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'dm-savecard-backup-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000); note('#bknote', 'Backup saved (' + Object.keys(data).length + ' items, without the webhook).', 'ok'); return;
    }
    if (e.target.closest('[data-act=restore]')) return $('#bkfile').click();
    if (e.target.closest('[data-act=mpnew]')) return newLeagueForm(); const b = e.target.closest('.srow'); if (b) { st.page = 'chapter'; store.set('page', 'chapter'); select(b.dataset.id).then(renderTabs); } });

  async function poll() {
    if (st.source !== 'server' || document.hidden) return;
    let res; try { res = await api('api/slots'); } catch (e) { return; }
    const slots = (res.slots || []).map(x => Object.assign(S.slotInfo(x.id, x.meta), { mtime: x.mtime }));
    const sig = a => a.map(s => s.id + s.mtime).join('|');
    if (sig(slots) === sig(st.slots)) return;
    st.slots = slots; renderSlots();
    const cur = slots.find(s => s.id === (st.hostMode && st.league ? st.league.host : st.sel));
    if (cur && st.opt.live && cur.mtime !== st.loadedMtime) {
      const kept = st.dirty || st.aiText;
      await select(st.sel, true);
      note('#imgnote', 'Card updated after your save at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '.', 'ok');
      if (kept) note('#gennote', 'New save data: your text was kept. Press “' + (st.opt.src === 'ai' ? 'Open in Claude' : 'New wording') + '” to refresh it.', 'ok');
    }
  }

  // ------------------------------------------------------------ one save
  async function select(id, keepShell) {
    if (id !== st.sel) { st.mpRound = null; st.exp = null; st.expName = null; st.variant = 0; st.dirty = false; st.aiText = null; }
    st.sel = id; store.set('sel', id); renderSlots();
    const slot = st.slots.find(s => s.id === id);
    if (!keepShell) $('#main').innerHTML = '<p class="empty">Reading save…</p>';
    try {
      if (isMp(id)) {
        const lg = await getLeague(id);
        if (!lg) throw new Error('This multiplayer season was not found.');
        let b = RC.build(lg);
        const hostSlot = lg.host && st.slots.find(x => x.id === lg.host);
        if (!b && hostSlot) {   // hosting without recaps: teams and players come from the save
          const tf = await getFile(hostSlot.id, S.FILES.teams);
          const names = ((tf && tf.teams) || []).map(t => S.shortName(t.name));
          const roster = RC.rosterCheck(lg.roster, names).filter(p => p.match);
          b = { files: null, races: [], last: null, season: null, teams: names, roster, players: roster.map(p => p.match) };
        }
        if (!b) { st.league = lg; st.mpBuild = null; throw new Error(lg.host ? 'The host save (' + lg.host + ') is not in the save folder, and this season has no race recaps.' : 'No race recap in this season yet.'); }
        st.league = lg; st.mpBuild = b; st.loadedMtime = null;
        // Hosting: the save is on this PC, so every card can use it; recaps still add race events and players.
        const host = lg.host && st.slots.find(x => x.id === lg.host);
        st.hostMode = !!host;
        if (host) {
          const files = {};
          await Promise.all(Object.entries(S.FILES).map(async ([k, name]) => { files[k] = await getFile(host.id, name); }));
          st.files = files; st.loadedMtime = host.mtime;
        } else st.files = b.files;
        const lastText = b.last ? (lg.recaps.find(r => { const q = RC.parse(r.text); return q && q.key === b.last.key; }) || {}).text : null;
        st.exp = lastText ? R.parseExport(lastText) : null; st.expName = 'Race recap';
      } else {
        st.league = null; st.mpBuild = null; st.hostMode = false;
        const files = {};
        await Promise.all(Object.entries(S.FILES).map(async ([k, name]) => { files[k] = await getFile(id, name); }));
        st.files = files; st.loadedMtime = slot ? slot.mtime : null;
      }
      compute();
      if (isMp(id) && !st.hostMode && !MP_KINDS.has(st.opt.kind)) st.opt.kind = 'race';
      await syncJournal(id);
      if (st.page === 'mp') { renderMpPage(); renderTabs(); return; }
      if (!keepShell || !$('#card')) shell();
      await update();
    } catch (err) {
      $('#main').innerHTML = '<p class="alert"><b>Could not read this save.</b> ' + esc(err.message) + '</p>';
    }
  }
  function compute() { st.summary = S.summarize(st.files, { slot: st.sel, names: false }); if (isMp(st.sel)) { st.summary.mode = 'multiplayer'; st.summary.partners = [];   // other humans are rivals here, not co-op partners
      mpPlayers(st.summary); if (!st.hostMode && st.summary.next && /^Round \d+$/.test(st.summary.next.name)) st.summary.next = null; } }

  // ------------------------------------------------------------ redesign pieces: section heading, team hero, post-type tabs
  const sec = t => '<h2 class="sec"><span aria-hidden="true">//</span> ' + esc(t) + '</h2>';
  function hero(s, f) {
    const col = f && /^#[0-9a-f]{6}$/i.test(f.color || '') ? f.color : '#E2372B';
    const on = Card.helpers.readable(col);
    const tile = (v, l) => '<div class="tile"><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>';
    const round = s.preseason ? 'Pre-season' : s.finished ? 'Season over' : 'Round ' + s.rounds.done + ' / ' + s.rounds.total;
    return '<section class="hero" style="--team:' + col + ';--on:' + on + '"><div class="hero-l">' +
      '<div class="kick">' + esc([MODES[s.mode] || s.mode, isMp(st.sel) ? (st.league && st.league.name) + (st.hostMode ? ' · host' : '') : 'slot ' + String(st.sel).split('_').pop(), s.category, s.season].filter(Boolean).join(' · ')) + '</div>' +
      '<h2>' + esc(f ? f.name : 'Save') + '</h2>' +
      '<p>' + esc([round, s.next && !/^Round \d+$/.test(s.next.name) ? 'next: ' + s.next.name : null].filter(Boolean).join(' · ')) + '</p></div>' +
      '<div class="tiles">' + (f ? tile(s.preseason || f.pos == null ? '–' : 'P' + f.pos + (f.tied ? '=' : ''), 'Championship') + tile(s.preseason ? '–' : T.fmtPts(f.points), 'Points') +
        tile(f.wins + ' · ' + f.podiums, 'Wins · podiums') + (isMp(st.sel) && !st.hostMode ? tile(st.mpBuild ? st.mpBuild.races.length + ' / ' + s.rounds.total : '–', 'Recaps') : tile(f.expected ? 'P' + f.expected : '–', 'Board target')) : '') + '</div></section>';
  }
  // Top bar: Chapter leads (the playthrough), every card type sits underneath it, grouped by when you post it.
  // Multiplayer has its own tab: seasons, recaps, players, host save.
  const GROUPS = [
    ['story', 'Story', [['episode', 'Chapter'], ['stretch', 'Race summary']]],
    ['weekend', 'Race weekend', [['preview', 'Preview'], ['race', 'Race result'], ['strategy', 'Race strategy'], ['us', 'NASCAR recap']]],
    ['team', 'Team', [['duel', 'Teammate duel'], ['devrace', 'Development'], ['rnd', 'R&D update'], ['transfer', 'Contracts'], ['paddock', 'Paddock news']]],
    ['season', 'Season', [['seasonStart', 'Season preview'], ['championship', 'Championship'], ['seasonEnd', 'Season review'], ['wrapped', 'Wrapped']]]
  ];
  // Post types that work on race recaps alone (multiplayer: no save).
  const MP_KINDS = new Set(['race', 'stretch', 'episode', 'duel', 'wrapped', 'championship', 'seasonEnd', 'strategy', 'us']);
  function renderTabs() {
    const k = st.opt.kind, page = st.page || 'chapter';
    $('#tabs').innerHTML = '<button type="button" class="tab' + (page === 'chapter' ? ' on' : '') + '" data-page="chapter"' + (st.sel ? '' : ' disabled') + '>Chapter</button>' +
      '<button type="button" class="tab' + (page === 'mp' ? ' on' : '') + '" data-page="mp">Multiplayer' + (st.leagues.length ? ' <i class="count-pill">' + st.leagues.length + '</i>' : '') + '</button>';
    const sub = $('#subtabs'); if (!sub) return;
    const on = page === 'chapter' && !!st.summary && !!st.sel;
    sub.hidden = !on;
    if (!on) { sub.innerHTML = ''; return; }
    const mp = isMp(st.sel) && !st.hostMode;
    sub.innerHTML = GROUPS.map(([id, name, kinds]) => {
      const ks = kinds.filter(([v]) => !mp || MP_KINDS.has(v)); if (!ks.length) return '';
      return '<div class="sgrp' + (id === 'story' ? ' lead' : '') + '"><span class="sg-name">' + esc(name) + '</span>' +
        ks.map(([v, l]) => '<button type="button" class="sub' + (v === k ? ' on' : '') + (v === 'episode' ? ' main' : '') + '" data-kind="' + v + '"' + (v === k ? ' aria-current="page"' : '') + '>' + esc(l) + '</button>').join('') + '</div>';
    }).join('');
  }
  // Chapter page = the composer for the open save or season; Multiplayer page = manage seasons.
  async function showPage(page) {
    st.page = page; store.set('page', page);
    if (page === 'mp') { renderMpPage(); renderTabs(); return; }
    renderTabs();
    if (!st.sel) { pickDefault(); return; }
    if (st.summary && st.files) { shell(); await update(); } else await select(st.sel);
  }
  function renderMpPage() {
    const cur = isMp(st.sel) ? st.sel : null;
    const cards = st.leagues.map(l => '<button type="button" class="srow' + (l.id === cur ? ' on' : '') + '" data-mp="' + esc(l.id) + '"><span class="bar" style="background:' + esc(/^#[0-9a-f]{3,8}$/i.test(l.color || '') ? l.color : '#737B8B') + '"></span>' +
      '<span><span class="nm" style="display:block">' + esc(l.name || l.id) + '</span><span class="v">' + esc([l.category, l.host ? 'host save' : l.team || 'no team chosen', l.races ? l.races + ' recap' + (l.races === 1 ? '' : 's') : l.host ? null : '0 recaps'].filter(Boolean).join(' · ')) + '</span></span></button>').join('');
    $('#main').innerHTML = sec('Multiplayer seasons') +
      '<p class="note">A multiplayer season follows one league: built from your host save, from race recaps, or both. Pick one to manage it; its cards are under <b>Chapter</b>.</p>' +
      '<div class="mplist">' + (cards || '<p class="note">No multiplayer season yet.</p>') + '</div>' +
      '<div class="actions top"><button class="btn pri" type="button" data-act="mpnew">+ New multiplayer season</button>' + (cur ? '<button class="btn" type="button" data-act="tochapter2">Open its cards (Chapter)</button>' : '') + '</div>' +
      (cur && st.league && st.mpBuild ? mpPanel() : '');
  }
  function chooseKind(k) {
    const sel = $('#o-kind'); if (!sel || !k) return;
    if (k === st.opt.kind) return;
    sel.value = k; sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  // ------------------------------------------------------------ how it works (dialog, opens on the part that fits the screen)
  function openHelp() {
    const H = window.DMHelp, d = $('#help'); if (!H || !d) return;
    d.innerHTML = H.html(st.opt.lang, H.partFor({ hasSave: !!st.summary && !!st.sel, mp: isMp(st.sel), kind: st.opt.kind }));
    d.showModal();
  }
  $('#helpbtn').addEventListener('click', openHelp);
  $('#help').addEventListener('click', e => {
    const d = $('#help');
    if (e.target === d) return d.close();                       // click on the backdrop
    const b = e.target.closest('[data-help]'); if (!b) return;
    if (b.dataset.help === 'close') return d.close();
    d.querySelectorAll('.hlp-tab').forEach(x => x.classList.toggle('on', x === b));
    d.querySelectorAll('.hlp-part').forEach(x => { x.hidden = x.dataset.part !== b.dataset.help; });
  });
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b && !b.disabled) showPage(b.dataset.page); });
  $('#subtabs').addEventListener('click', e => { const b = e.target.closest('[data-kind]'); if (b) chooseKind(b.dataset.kind); });

  // What each post type can do: card options, text sources, voices. The page shows only these.
  const KIND_NAMES = { race: 'Race & season', stretch: 'Race summary', episode: 'Chapter', preview: 'Raceweek preview', transfer: 'Here we go', duel: 'Teammate duel', devrace: 'Development race', wrapped: 'Season wrapped',
    seasonStart: 'Season preview', seasonEnd: 'Season review', us: 'NASCAR recap', strategy: 'Race strategy', championship: 'Championship', rnd: 'R&D update', paddock: 'Paddock news' };
  function caps(kind, src) {
    const extra = XT && XT.KINDS.includes(kind), ep = kind === 'episode';
    const texts = kind === 'race' ? [['social', 'Social post'], ['report', 'Race report'], ['message', 'Progress message'], ['diary', 'Playthrough log'], ['ai', 'Write with AI (chat)']]
      : ep ? [['social', 'Chapter text'], ['ai', 'Write with AI (chat)']]
      : extra ? [['social', 'Ready-made text'], ['ai', 'Write with AI (chat)']]
      : [['social', 'Social post'], ['diary', 'Playthrough log'], ['ai', 'Write with AI (chat)']];
    const voice = src === 'ai' || (src === 'social' && !ep && !extra);
    return {
      texts, voice, voices: src === 'ai' ? [['team', 'Team account'], ['hype', 'Fan account'], ['press', 'Journalist'], ['diary', 'Playthrough (me)']] : [['team', 'Team account'], ['hype', 'Fan account'], ['press', 'Journalist']],
      about: kind === 'race' && (src === 'social' || src === 'ai'), ai: src === 'ai',
      card: { table: kind === 'race', epcard: ep, epscope: ep, slide: kind === 'wrapped', person: kind === 'transfer', range: kind === 'stretch' },
      exp: !isMp(st.sel) && ['race', 'strategy', 'us', 'episode'].includes(kind)
    };
  }

  function shell() {
    const s = st.summary, o = st.opt, f = s.focus;
    const sel = (id, opts, val) => '<select id="' + id + '">' + opts.map(([v, l]) => '<option value="' + v + '"' + (v === val ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
    const cb = (id, label, on) => '<label class="f cb"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '> ' + label + '</label>';
    const hook = hookFor(st.sel), hookOwn = !!store.get('hook.' + st.sel, '');
    const server = st.source === 'server';
    $('#main').innerHTML =
      hero(s, f) + (isMp(st.sel) ? '<p class="note mpnote">Multiplayer season <b>' + esc((st.league && st.league.name) || '') + '</b>: recaps, players and host save are in the <b>Multiplayer</b> tab.</p>' : '') +
      (s.cheat ? '<p class="alert"><b>Cheat mode</b> is on in this save. The card says so in the footer.</p>' : '') +
      // One settings bar: card options and text options for this post type only.
      '<section class="settings" aria-label="Settings">' +
        '<div class="sg" id="sg-card"><span class="sl">Card</span>' +
          '<label class="f" data-cap="table">Table ' + sel('o-table', [['teams', 'Teams'], ['drivers', 'Drivers']], o.table) + '</label>' +
          '<label class="f" data-cap="epcard">Card ' + sel('o-epcard', [['cover', 'Chapter cover'], ['storyline', 'Storyline'], ['next', 'Next time']], o.epCard) + '</label>' +
          '<label class="f" data-cap="epscope">Stories ' + sel('o-epscope', [['chapter', 'Since last chapter'], ['race', 'Last race only'], ['season', 'Whole season']], o.epScope) + '</label>' +
          '<label class="f" data-cap="slide">Slide ' + sel('o-slide', XT.SLIDES.map(x => [x, { intro: '1 · Intro', numbers: '2 · Numbers', moment: '3 · Best moment', driver: '4 · Driver of the year', factory: '5 · Factory', story: '6 · The story' }[x]]), o.slide) + '</label>' +
          '<label class="f" data-cap="person">Person <select id="o-person"></select></label>' +
          '<label class="f" data-cap="range">From <select id="o-from"></select></label><label class="f" data-cap="range">To <select id="o-to"></select></label>' +
        '</div>' +
        '<div class="sg"><span class="sl">Text</span>' +
          '<label class="f">Source <select id="o-src"></select></label>' +
          '<label class="f" data-cap="voice">Voice <select id="o-tone"></select></label>' +
          '<label class="f" data-cap="about">About ' + sel('o-about', [['race', 'Last race'], ['season', 'Season']], o.about) + '</label>' +
          '<label class="f" data-cap="ai">Length ' + sel('o-len', [['short', 'Short'], ['long', 'Longer']], o.len) + '</label>' +
        '</div>' +
        '<div class="sg end">' +
          '<label class="f">' + sel('o-lang', [['en', 'English'], ['nl', 'Nederlands']], o.lang) + '</label>' +
          (server && (!isMp(st.sel) || st.hostMode) ? cb('o-live', 'Update after each save', o.live) : '') +
        '</div>' +
        '<select id="o-kind" hidden>' + Object.entries(KIND_NAMES).map(([v, l]) => '<option value="' + v + '"' + (v === o.kind ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>' +
      '</section>' +
      '<div class="composer">' +
        '<div class="editor">' +
          sec('Post text') +
          '<input class="wish" data-cap="ai" id="o-wish" type="text" maxlength="300" placeholder="Extra wish for the AI (optional), e.g. mention our first win in Monza" value="' + esc(o.wish || '') + '" aria-label="Extra wish for the AI">' +
          '<div class="actions top"><button class="btn pri" type="button" data-act="gen" id="genbtn">New wording</button>' +
            '<button class="btn pri" data-cap="ai" type="button" data-act="pasteai">Paste answer</button>' +
            '<button class="btn" type="button" data-act="prompt">Copy as AI prompt</button><span class="note" id="gennote"></span></div>' +
          '<textarea class="txt" id="txt" spellcheck="true" aria-label="Post text"></textarea>' +
          '<div class="actions"><button class="btn" type="button" data-act="copytxt">Copy text</button><span class="count" id="count"></span><span class="note" id="txtnote"></span></div>' +
          '<div class="help">' + sec('Writing help') +
            '<textarea class="txt notes" id="notes" spellcheck="true" placeholder="My notes: what I decided and why, what I expected, how it felt, what is next… (kept per save and round)" aria-label="My notes"></textarea>' +
            '<div class="filters tight"><label class="f">Help me <select id="wh-mode">' + Object.entries(AS.MODES).map(([v, m]) => '<option value="' + v + '"' + (v === o.whMode ? ' selected' : '') + '>' + m.label + '</option>').join('') + '</select></label><span class="note" id="whgoes"></span></div>' +
            '<div class="actions top"><span class="sl">Export</span><button class="btn" type="button" data-act="whopen">Open in Claude</button><button class="btn" type="button" data-act="whcopy">Copy prompt</button><button class="btn" type="button" data-act="whdl">Download .txt</button></div>' +
            '<div class="actions top"><span class="sl">Import</span><button class="btn pri" type="button" data-act="whpaste">Paste answer</button><button class="btn" type="button" data-act="whload">Load .txt</button><input type="file" id="whfile" accept=".txt,.md,text/plain" hidden><span class="note" id="whnote"></span></div>' +
          '</div>' +
          '<div class="exp-only" data-cap="exp">' + sec('Race export') +
          '<div class="actions top"><button class="btn" type="button" data-act="loadexp">Load (.txt)</button>' +
            '<button class="btn" type="button" data-act="pasteexp">Paste</button><input type="file" id="expfile" accept=".txt,text/plain" hidden>' +
            '<span class="note" id="expnote"></span></div>' +
          '<textarea class="txt paste" id="exppaste" hidden spellcheck="false" placeholder="Paste the race summary from the game here (it starts with === Race summary — …)" aria-label="Race export"></textarea></div>' +
        '</div>' +
        '<div class="preview">' +
          sec('Preview on Discord') +
          '<div class="dc" id="dc"><div class="dc-av" aria-hidden="true">DM</div><div class="dc-body">' +
            '<div class="dc-head"><span class="dc-name" id="dcname"></span><span class="dc-app">APP</span><span class="dc-time" id="dctime"></span></div>' +
            '<div class="dc-text" id="dctext"></div><img class="dc-img" id="cardimg" alt="Save card"></div></div><div id="dcmore"></div>' +
          '<div class="actions"><button class="btn' + (server ? ' pri' : '') + '" type="button" data-act="addtray" id="addtray">Add to post</button>' +
            '<button class="btn' + (server ? '' : ' pri') + '" type="button" data-act="cfd" id="cfdbtn">Copy for Discord</button>' +
            '<button class="btn" type="button" data-act="copyimg">Copy image</button>' +
            '<button class="btn" type="button" data-act="png">Download PNG</button><span class="note" id="imgnote"></span></div>' +
          '<ol class="cfd" id="cfd" hidden></ol>' +
        '</div>' +
      '</div>' +
      '<section class="story" data-cap="story" id="story" aria-label="Playthrough"></section>' +
      '<section class="story" id="ptbar" aria-label="Playthrough"></section>' +
      '<canvas id="card" width="2400" height="1350" hidden></canvas>' +
      ('<section class="post" id="post">' + sec('Post to Discord') +
          '<div class="tray" id="tray"></div>' +
          '<div class="row"><label class="f">Text <select id="posttext"></select></label><span class="count" id="postcount"></span></div>' +
          '<div class="row"><input type="password" id="hook" autocomplete="off" spellcheck="false" placeholder="Webhook URL: ask the moderators of your Discord server for one" value="' + esc(hook) + '" aria-label="Discord webhook URL">' +
          '<button class="btn pri" type="button" data-act="post" id="postbtn">Post</button></div>' +
          '<label class="cb"><input type="checkbox" id="remember"' + (hookOwn ? ' checked' : '') + '> Use this webhook for <b>this save</b> (remembered ' + (server ? 'on this PC' : 'in this browser') + ')</label>' +
          '<label class="cb"><input type="checkbox" id="rememberall"' + (store.get('hook', '') ? ' checked' : '') + '> Use it as the default for saves without their own webhook</label>' +
          '<p class="note" id="hooknote">' + (hookOwn ? 'This save posts to its own webhook.' : hook ? 'Using your default webhook.' : '') + '</p>' +
          '<p class="note" id="postnote">Collect cards from any tab with “Add to post”, pick the text, post them as one message (up to 10 images). Without collected cards the current card is posted. Nobody gets pinged.</p>' +
          '<p class="note">No webhook yet? <b>Ask the moderators of your Discord server</b>: they create one for the channel or your thread. Keep it to yourself; it works like a password.</p></section>'
        );
    syncControls();
    renderTabs();
    renderTray();
    loadNotes();
  }
  function syncControls() {
    const o = st.opt;
    let c = caps(o.kind, o.src);
    if (!c.texts.some(([v]) => v === o.src)) { o.src = 'social'; c = caps(o.kind, o.src); }
    if (!c.voices.some(([v]) => v === o.tone)) o.tone = 'team';
    const fillSel = (id, list, val) => { const el = $('#' + id); if (el) el.innerHTML = list.map(([v, l]) => '<option value="' + v + '"' + (v === val ? ' selected' : '') + '>' + l + '</option>').join(''); };
    fillSel('o-src', c.texts, o.src); fillSel('o-tone', c.voices, o.tone);
    const on = { voice: c.voice, about: c.about, ai: c.ai, exp: c.exp, story: o.kind === 'episode' };
    Object.assign(on, c.card);
    document.querySelectorAll('[data-cap]').forEach(el => { el.hidden = !on[el.dataset.cap]; });
    $('#sg-card').hidden = !Object.values(c.card).some(Boolean);
    $('#genbtn').textContent = c.ai ? 'Open in Claude' : 'New wording';
    if ($('#ptbar')) $('#ptbar').hidden = o.kind === 'episode';   // the chapter tab shows the full playthrough section
    store.set('opt', o);
  }

  // ------------------------------------------------------------ post tray: cards from several tabs in one Discord message
  const TRAY_MAX = 10;
  function trayLabel() {
    const o = st.opt;
    const extra = o.kind === 'wrapped' ? ' · ' + o.slide : o.kind === 'episode' ? ' · ' + o.epCard : o.kind === 'stretch' && st.view && !st.view.empty ? ' · R' + st.view.from + '–' + st.view.to : o.kind === 'transfer' && st.view && st.view.name ? ' · ' + st.view.name : '';
    return (KIND_NAMES[o.kind] || o.kind) + extra;
  }
  function renderTray() {
    const box = $('#tray'); if (!box) return;
    const T = st.tray;
    box.innerHTML = T.length ? T.map((t, i) => '<figure class="ti"><img src="' + t.img + '" alt=""><figcaption>' + (i + 1) + ' · ' + esc(t.label) + '</figcaption>' +
      '<button type="button" class="rm" data-act="trayrm" data-i="' + i + '" aria-label="Remove">×</button></figure>').join('')
      : '<p class="note">No cards collected: the current card is posted.</p>';
    const ps = $('#posttext'), cur = st.postText || ps.value || '';
    ps.innerHTML = '<option value="current">Text box (' + esc(KIND_NAMES[st.opt.kind] || '') + ')</option>' + T.map((t, i) => '<option value="' + i + '">Text of card ' + (i + 1) + ' · ' + esc(t.label) + '</option>').join('') + '<option value="none">No text</option>';
    ps.value = [...ps.options].some(op => op.value === cur) ? cur : T.length ? '0' : 'current';
    st.postText = ps.value;
    $('#postbtn').textContent = 'Post ' + (T.length > 1 ? T.length + ' cards' : 'card') + (ps.value === 'none' ? '' : ' + text');
    const add = $('#addtray'); if (add) { add.textContent = 'Add to post' + (T.length ? ' (' + T.length + ')' : ''); add.disabled = T.length >= TRAY_MAX; }
    postCount();
  }
  function postText() {
    const v = ($('#posttext') || {}).value || 'current';
    return v === 'none' ? '' : v === 'current' ? $('#txt').value : (st.tray[+v] || {}).text || '';
  }
  function postCount() { const n = AS.split(postText()).length, el = $('#postcount'); if (el) { el.textContent = postText().length + ' characters' + (n > 1 ? ' · ' + n + ' messages' : ''); el.className = 'count' + (n > 10 ? ' over' : ''); } }

  async function update() {
    const s = st.summary, o = st.opt;
    await fontsReady;
    await loadLogo();
    if (o.kind === 'episode') return updateEpisode();
    if (XT && XT.KINDS.includes(o.kind)) return updateExtra();
    st.view = o.kind === 'race' ? null : o.kind === 'strategy' ? V.strategy(st.files, s, st.exp) : o.kind === 'us' ? V.usRace(st.files, s, st.exp) : V[o.kind](st.files, s);
    await loadImages(st.view);
    const img = p => (p && st.images.get(p)) || null;
    if (o.kind === 'race') Card.draw($('#card'), s, { lang: o.lang, table: o.table, budget: false, logo: st.logo, scale: 2 });
    else Cards[o.kind]($('#card'), s, st.view, { lang: o.lang, scale: 2, img });
    $('#cardimg').src = $('#card').toDataURL('image/png');
    $('#dcname').textContent = s.focus && s.mode !== 'spectator' ? s.focus.short : 'DM Save Card';
    $('#dctime').textContent = (o.lang === 'nl' ? 'Vandaag om ' : 'Today at ') + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    renderExpNote();
    if (o.kind === 'strategy' && !(st.view && st.view.hasExport)) note('#imgnote', 'Load the race export (left) to fill the strategy card.', '');
    if (!st.dirty && o.src !== 'ai') setText(templateText());
    else if (o.src === 'ai' && !st.dirty && !st.aiText) setText(templateText(), true);
    else renderPreview();
  }

  // ------------------------------------------------------------ playthrough chapter
  function buildEpisode() {
    const F = reportFacts();
    st.ep = st.journal ? Ep.build(st.journal, { scope: st.opt.epScope, race: F && !F.exportMismatch ? F : null, lang: st.opt.lang }) : null;
    return st.ep;
  }
  // Title as written in the text box ("## Chapter 7 · Title"), so the card follows the player's edits.
  function textTitle() {
    const m = /^##\s+.+?\s·\s(.+)$/m.exec(($('#txt') && $('#txt').value) || '');
    return m ? m[1].replace(/\\([\\*_~`|>])/g, '$1').trim() : null;
  }
  function drawEpisodeCard() {
    const o = st.opt, c = $('#card');
    if (!st.ep) {
      const ctx = c.getContext('2d'); c.width = 2400; c.height = 1350; ctx.fillStyle = Card.helpers.C.bg; ctx.fillRect(0, 0, c.width, c.height);
    } else {
      const opts = { lang: o.lang, scale: 2, title: textTitle() || undefined, variant: st.variant };
      if (o.epCard === 'storyline') EC.storyline(c, st.ep, st.journal, opts);
      else if (o.epCard === 'next') EC.nextTime(c, st.ep, st.journal, opts);
      else EC.cover(c, st.ep, opts);
    }
    $('#cardimg').src = c.toDataURL('image/png');
  }
  async function updateEpisode() {
    const s = st.summary, o = st.opt;
    buildEpisode();
    $('#dcname').textContent = s.focus && s.mode !== 'spectator' ? s.focus.short : 'DM Save Card';
    $('#dctime').textContent = (o.lang === 'nl' ? 'Vandaag om ' : 'Today at ') + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    renderExpNote();
    if (!st.dirty && o.src !== 'ai') setText(templateText());
    else if (o.src === 'ai' && !st.dirty && !st.aiText) setText(templateText(), true);
    else renderPreview();
    drawEpisodeCard();
    renderStory();
    if (st.journalReset) { note('#imgnote', 'This save is a different career than the journal had: a new journal was started (the old one is kept as a backup file).', ''); st.journalReset = false; }
  }

  // ------------------------------------------------------------ extra post types (preview, here we go, duel, development, wrapped)
  async function updateExtra() {
    const s = st.summary, o = st.opt;
    st.view = XT.view(o.kind, st.files, s, st.journal, { person: o.person || null, from: o.from || null, to: o.to || null });
    if (o.kind === 'stretch' && st.view && !st.view.empty) {
      const opt = (r, cur) => '<option value="' + r.round + '"' + (r.round === cur ? ' selected' : '') + '>R' + r.round + ' · ' + esc(r.name) + '</option>';
      $('#o-from').innerHTML = st.view.rounds.map(r => opt(r, st.view.from)).join('');
      $('#o-to').innerHTML = st.view.rounds.map(r => opt(r, st.view.to)).join('');
    }
    if (o.kind === 'transfer') {
      const ps = $('#o-person'), list = (st.view && st.view.options) || [];
      ps.innerHTML = '<option value="">Latest news</option>' + list.map(n => '<option value="' + esc(n) + '"' + (n === o.person ? ' selected' : '') + '>' + esc(n) + '</option>').join('');
    }
    await loadImages(st.view);
    const img = p => (p && st.images.get(p)) || null;
    XC[o.kind]($('#card'), s, st.view || {}, { lang: o.lang, scale: 2, img, slide: o.slide });
    $('#cardimg').src = $('#card').toDataURL('image/png');
    $('#dcname').textContent = s.focus && s.mode !== 'spectator' ? s.focus.short : 'DM Save Card';
    $('#dctime').textContent = (o.lang === 'nl' ? 'Vandaag om ' : 'Today at ') + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!st.dirty && o.src !== 'ai') setText(templateText());
    else if (o.src === 'ai' && !st.dirty && !st.aiText) setText(templateText(), true);
    else renderPreview();
  }

  // Story panel: the stories found, the chapters, the playthrough premise.
  const KIND = { prologue: 'Prologue: the story so far', pilot: 'Pilot: the start of a new playthrough', chapter: 'Chapter' };
  function renderStory() {
    const box = $('#story'); if (!box) return;
    const ep = st.ep, J = st.journal;
    if (!ep || !J) { box.innerHTML = sec('Playthrough') + '<p class="note">No team in this save to follow (spectator saves follow the leader once a race has been run).</p>'; return; }
    const pct = c => '<li class="' + (c === ep.main ? 'main' : ep.side.includes(c) ? 'side' : '') + '"><span class="sc">' + c.score.toFixed(1) + '</span><span><span class="an">' + esc(label(c.key)) +
      (c === ep.main ? ' · main story' : ep.side.includes(c) ? ' · side story' : c.thread ? ' · open thread' : '') + (c.focus ? ' · ★' : '') + '</span>' +
      (c.callback ? '<br><span class="ad">callback to chapter ' + esc(c.callback.no) + ': ' + esc(c.callback.title) + '</span>' : '') + '</span></li>';
    const S = J.series;
    const premise = S ? '<p class="note"><b>' + esc(S.name || 'Playthrough') + '</b>' + (S.goal && S.goal.type ? ' · goal: ' + esc(Ep.goalText(S.goal, st.opt.lang)) : '') +
      (S.focus && S.focus.length ? ' · following ' + esc(S.focus.join(', ')) : '') + (S.rules ? ' · rules: ' + esc(S.rules) : '') + ' · since ' + esc(S.startSeason) + (S.startRound ? ' R' + esc(S.startRound) : '') + '</p>'
      : '<p class="note">No playthrough premise yet. The journal follows this save anyway; start a playthrough to give it a name, a goal and drivers to follow.</p>';
    const chapters = J.chapters.slice().sort((a, b) => b.no - a.no).slice(0, 12).map(c => '<li><b>' + (c.kind === 'prologue' ? '0' : esc(c.no)) + '</b><span>' + esc(c.title || '') + ' · ' + esc([c.season, c.round ? 'R' + c.round : null].filter(Boolean).join(' ')) + '</span></li>').join('');
    const people = (J.last && J.last.people || []).filter(p => p.role === 'driver');
    const G = (S && S.goal) || {};
    const form = st.ptForm ? '<form class="ptform" id="ptform">' +
      '<div class="filters tight"><label class="f">Name <input id="pt-name" type="text" maxlength="80" value="' + esc((S && S.name) || '') + '" placeholder="e.g. From the back to the title"></label>' +
      '<label class="f">Goal <select id="pt-goal">' + [['', 'No goal'], ['title', 'Win the title within … seasons'], ['top', 'Reach a position by a season'], ['target', 'Board target every season'], ['custom', 'Own goal (text)']].map(([v, l]) => '<option value="' + v + '"' + ((G.type || '') === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
      '<label class="f">Seasons <input id="pt-seasons" type="number" min="1" max="30" value="' + esc(G.seasons || 3) + '"></label>' +
      '<label class="f">Position <input id="pt-pos" type="number" min="1" max="60" value="' + esc(G.pos || 3) + '"></label>' +
      '<label class="f">By season <input id="pt-by" type="number" min="1900" max="2999" value="' + esc(G.by || ((J.last && J.last.season) || 2026) + 2) + '"></label></div>' +
      '<input class="wish" id="pt-text" type="text" maxlength="200" placeholder="Own goal, e.g. only rookies, or win at Spa" value="' + esc(G.text || '') + '">' +
      '<input class="wish" id="pt-rules" type="text" maxlength="200" placeholder="House rules (optional), e.g. no drivers over 30" value="' + esc((S && S.rules) || '') + '">' +
      (people.length ? '<div class="filters tight"><span class="note">Follow:</span>' + people.map((p, i) => '<label class="f cb"><input type="checkbox" class="pt-follow" value="' + esc(p.name) + '"' + (S && (S.focus || []).includes(p.name) ? ' checked' : '') + '> ' + esc(p.name) + '</label>').join('') + '</div>' : '') +
      '<p class="note">' + (J.last && (J.last.round > 0 || (J.last.team.career && J.last.team.career.past && J.last.team.career.past.length))
        ? 'This save is already under way: a new playthrough starts with a <b>prologue</b> (the story so far: earlier seasons, this season’s high and low point, the cast, open storylines), then chapter 1 follows at the next race.'
        : 'This save is at the start of a season: a new playthrough starts with the <b>pilot</b> (premise, crew, car, expectations).') + '</p>' +
      '<div class="actions top"><button class="btn pri" type="button" data-act="ptstart">Start new playthrough</button>' + (S ? '<button class="btn" type="button" data-act="ptupdate">Update premise only</button>' : '') +
      '<button class="btn" type="button" data-act="ptcancel">Cancel</button></div></form>' : '';
    box.innerHTML = sec('Playthrough') + premise + form +
      '<div class="story-grid"><div><h3>' + esc(KIND[ep.kind]) + ' ' + (ep.kind === 'prologue' ? '' : esc(ep.no)) + (ep.saved ? ' (saved)' : '') + '</h3>' +
        (ep.kind === 'chapter' ? '<ul class="angles">' + ep.candidates.slice(0, 9).map(pct).join('') + '</ul>' + (ep.candidates.length ? '' : '<p class="note">Nothing new since the last chapter. Play on and save the game; the journal picks it up.</p>')
          : '<p class="note">' + (ep.kind === 'prologue' ? 'This save was already under way when the journal started. The first chapter tells the story so far; regular chapters follow from the next race.' : 'The first chapter of the playthrough: the premise and the starting point.') + '</p>') +
        (ep.arcs.length ? '<div class="arcs">' + ep.arcs.map(a => '<span>' + esc(a) + '</span>').join('') + '</div>' : '') + '</div>' +
      '<div><h3>Chapters</h3>' + (chapters ? '<ul class="chapters">' + chapters + '</ul>' : '<p class="note">No chapters saved yet.</p>') +
        '<div class="actions"><button class="btn pri" type="button" data-act="savech">' + (ep.saved ? 'Update saved chapter' : 'Save as ' + (ep.kind === 'prologue' ? 'prologue' : 'chapter ' + ep.no)) + '</button>' +
        '<button class="btn" type="button" data-act="book"' + (J.chapters.length ? '' : ' disabled') + '>Season book (HTML)</button>' +
        '<button class="btn" type="button" data-act="ptform">' + (S ? 'Playthrough settings' : 'Start a playthrough') + '</button><span class="note" id="stnote"></span></div></div></div>';
  }
  const LABELS = { start: 'The story starts', season_start: 'Season start', season_end: 'Season over', champions: 'Champions', win: 'Win', podium: 'Podium', comeback: 'Comeback', heartbreak: 'DNF', bad_day: 'Bad day',
    quiet: 'Race result', pole: 'Pole', race_digest: 'Results since last time', streak_hot: 'Podium streak', streak_cold: 'Pointless streak', lead_taken: 'Championship lead taken', lead_lost: 'Championship lead lost',
    clinch: 'Title clinched', eliminated: 'Out of the title fight', pass_up: 'Passed a rival', pass_down: 'Passed by a rival', target_up: 'Board target reached', target_down: 'Below board target',
    title_fight: 'Title fight', defend_lead: 'Defending the lead', chase: 'Chasing the team ahead', pressure: 'Team behind is close', career_first: 'First career win', milestone: 'Career milestone', injury: 'Injury',
    morale_up: 'Morale up', morale_down: 'Morale down', rivalry: 'Rivalry', signing: 'Signing', departure: 'Departure', extension: 'Contract extended', teammates: 'Teammate duel', contract: 'Contract ends',
    upgrade_hit: 'Upgrade worked', upgrade_miss: 'Upgrade failed', factory_best: 'Best development', dev_start: 'Development started', protest: 'Protest', investigation: 'Stewards', techcheck: 'Technical check failed',
    rebrand: 'Name change', analyst: 'Testing analyst', analyst_wrong: 'Testing tip proved wrong', goal: 'Playthrough goal', goal_done: 'Goal reached', goal_failed: 'Goal missed' };
  const label = k => LABELS[k] || k;

  // Any post (race card, summary, duel, wrapped …) can be a chapter of the playthrough: its text, a small copy of the card, the round.
  async function savePostChapter() {
    if (!st.journal || !st.summary) { note('#ptnote', 'No playthrough journal for this save yet.', 'err'); return; }
    const text = $('#txt').value.trim(); if (!text) { note('#ptnote', 'Write or generate the text first.', 'err'); return; }
    const o = st.opt, s = st.summary, f = s.focus || {};
    const head = (/^\*\*(.+?)\*\*/m.exec(text) || /^#+\s*(.+)$/m.exec(text) || [])[1];
    const kindName = KIND_NAMES[o.kind] || o.kind;
    const extra = o.kind === 'stretch' && st.view && !st.view.empty ? ' R' + st.view.from + '–' + st.view.to : o.kind === 'wrapped' ? ' · ' + o.slide : '';
    let img = null;
    try {   // a smaller JPEG copy of the card; kept on disk with the server, skipped in the browser to spare its storage
      if (st.source === 'server') { const c = document.createElement('canvas'), src = $('#card'); c.width = 1200; c.height = Math.round(1200 * src.height / src.width); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); img = c.toDataURL('image/jpeg', 0.82); }
    } catch (e) { img = null; }
    const ch = Ch.addChapter(st.journal, { kind: 'chapter', source: o.kind + (o.kind === 'wrapped' ? ':' + o.slide : ''), sourceName: kindName + extra,
      title: (head || kindName + extra).replace(/[*_~`]/g, '').slice(0, 90), text, lang: o.lang, img,
      pos: f.pos ?? null, points: f.points ?? null, circuit: s.last ? s.last.name : null });
    await saveJournal();
    renderPtBar();
    note('#ptnote', 'Saved as chapter ' + ch.no + ' (' + kindName + extra + ').', 'ok');
    return ch;
  }
  async function saveChapter(text) {
    if (!st.ep || !st.journal) return null;
    const ch = Ch.addChapter(st.journal, Object.assign(Ep.toChapter(st.ep, text, st.opt.lang, st.variant), textTitle() ? { title: textTitle() } : {}));
    await saveJournal();
    return ch;
  }
  function seriesFromForm() {
    const v = id => ($('#' + id) ? $('#' + id).value.trim() : '');
    const type = v('pt-goal');
    const goal = type ? { type, seasons: Math.max(1, +v('pt-seasons') || 1), pos: Math.max(1, +v('pt-pos') || 1), by: +v('pt-by') || null, text: v('pt-text') } : null;
    return { name: v('pt-name'), goal, focus: [...document.querySelectorAll('.pt-follow:checked')].map(x => x.value), rules: v('pt-rules') };
  }

  // ------------------------------------------------------------ text
  function reportFacts() { return R.facts(st.summary, st.exp); }
  // Everything the playthrough log looks at: last race, standings, factory, paddock.
  function diaryData() {
    const s = st.summary, F = reportFacts(), safe = fn => { try { return fn(); } catch (e) { return null; } };
    return { s, race: F && !F.exportMismatch ? F : (F ? Object.assign({}, F, { export: null }) : null),
      champ: safe(() => V.championship(st.files, s)), rnd: safe(() => V.rnd(st.files, s)), paddock: safe(() => V.paddock(st.files, s)) };
  }
  function templateText() {
    const s = st.summary, o = st.opt, F = reportFacts();
    if (XT && XT.KINDS.includes(o.kind)) return XT.text(o.kind, st.view, { lang: o.lang });
    if (o.kind === 'episode') return st.ep ? Ep.write(st.ep, { lang: o.lang, variant: st.variant }) : (o.lang === 'nl' ? 'Geen team om te volgen in deze save.' : 'No team to follow in this save.');
    if (o.src === 'diary') return DY.write(diaryData(), { lang: o.lang, variant: st.variant });
    if (o.kind !== 'race') return P.templateKind(o.kind, s, st.view, { lang: o.lang, tone: o.tone, variant: st.variant, headlines: o.kind === 'paddock' ? V.paddockHeadlines(st.view, o.lang, o.tone) : null });
    if (o.src === 'report') return F ? R.write(F, { lang: o.lang, variant: st.variant }) : (o.lang === 'nl' ? 'Nog geen race gereden in dit seizoen.' : 'No race run yet this season.');
    if (o.src === 'message') return T.discord(s, { lang: o.lang, table: o.table, budget: false });
    return P.template(s, F, { lang: o.lang, tone: o.tone, content: o.about === 'season' || !F ? 'season' : 'race', variant: st.variant });
  }
  function setText(text, placeholder) {
    $('#txt').value = text; st.dirty = false; st.placeholder = !!placeholder;
    note('#gennote', placeholder ? 'Template shown. Press “Open in Claude” for the AI version.' : '', '');
    renderPreview();
  }
  // Copy for Discord: the card, then each text part, one click per step (Discord takes one thing per paste).
  function cfdSteps() {
    const parts = AS.split($('#txt').value), nl = st.opt.lang === 'nl';
    const steps = [{ kind: 'img', say: nl ? 'Kaart gekopieerd: plak hem in je thread (Ctrl+V).' : 'Card copied: paste it in your thread (Ctrl+V).' }];
    parts.forEach((t, i) => steps.push({ kind: 'txt', text: t, say: i === 0
      ? (nl ? 'Tekst' + (parts.length > 1 ? ' 1/' + parts.length : '') + ' gekopieerd: plak hem bij de kaart en druk op Enter.' : 'Text' + (parts.length > 1 ? ' 1/' + parts.length : '') + ' copied: paste it with the card and press Enter.')
      : (nl ? 'Deel ' + (i + 1) + '/' + parts.length + ' gekopieerd: plak en druk op Enter.' : 'Part ' + (i + 1) + '/' + parts.length + ' copied: paste and press Enter.') }));
    return steps;
  }
  function cfdReset() { st.cfd = 0; const b = $('#cfdbtn'), l = $('#cfd'); if (b) b.textContent = 'Copy for Discord'; if (l) l.hidden = true; }
  async function cfdNext() {
    const steps = cfdSteps(), i = st.cfd || 0, step = steps[i];
    try {
      if (step.kind === 'img') await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob() })]);
      else await navigator.clipboard.writeText(step.text);
    } catch (err) { note('#imgnote', step.kind === 'img' ? 'This browser does not allow copying images: use Download PNG and drag it into Discord.' : 'Copy failed.', 'err'); return; }
    const l = $('#cfd'); l.hidden = false;
    l.innerHTML = steps.map((x, k) => '<li class="' + (k < i ? 'done' : k === i ? 'now' : '') + '">' + esc(k === i ? x.say : x.kind === 'img' ? (st.opt.lang === 'nl' ? 'Kaart' : 'Card') : (st.opt.lang === 'nl' ? 'Tekst ' : 'Text ') + k + '/' + (steps.length - 1)) + '</li>').join('');
    st.cfd = i + 1;
    $('#cfdbtn').textContent = st.cfd >= steps.length ? (st.opt.lang === 'nl' ? 'Klaar · opnieuw' : 'Done · again') : (st.opt.lang === 'nl' ? 'Volgende: ' : 'Next: ') + (steps[st.cfd].kind === 'txt' ? (st.opt.lang === 'nl' ? 'tekst ' : 'text ') + st.cfd + '/' + (steps.length - 1) : '');
    if (st.cfd >= steps.length) st.cfd = 0;
  }
  // Playthrough bar on every other tab: keep this post as a chapter, see the chapters so far.
  function renderPtBar() {
    const box = $('#ptbar'); if (!box || st.opt.kind === 'episode') return;
    const J = st.journal, s = st.summary;
    if (!J || !s || !s.focus) { box.innerHTML = sec('Playthrough') + '<p class="note">No team in this save to follow yet.</p>'; return; }
    const o = st.opt, kindName = KIND_NAMES[o.kind] || o.kind, src = o.kind + (o.kind === 'wrapped' ? ':' + o.slide : '');
    const L = J.last || {};
    const same = J.chapters.find(c => c.season === L.season && c.round === L.round && (c.kind || 'chapter') === 'chapter' && c.source === src);
    const nextNo = same ? same.no : (J.chapters.length ? J.chapters[J.chapters.length - 1].no + 1 : 1);
    const S = J.series;
    const list = J.chapters.slice().sort((a, b) => b.no - a.no).slice(0, 5).map(c => '<li><b>' + (c.kind === 'prologue' ? '0' : esc(c.no)) + '</b><span>' + esc(c.title || '') + ' · ' +
      esc([c.season, c.round ? 'R' + c.round : null, c.sourceName].filter(Boolean).join(' · ')) + '</span></li>').join('');
    box.innerHTML = sec('Playthrough') +
      (S && S.name ? '<p class="note"><b>' + esc(S.name) + '</b>' + (S.goal && S.goal.type ? ' · goal: ' + esc(Ep.goalText(S.goal, o.lang)) : '') + '</p>' : '') +
      '<div class="story-grid"><div><h3>This post</h3>' +
        '<p class="note">Keep this ' + esc(kindName.toLowerCase()) + ' card and its text in the story: it shows in the chapter list, on the storyline card and in the season book. The next Chapter continues from here.</p>' +
        '<div class="actions"><button class="btn pri" type="button" data-act="savepost" id="savepost">' + (same ? 'Update chapter ' + esc(same.no) : 'Save as chapter ' + esc(nextNo)) + '</button><span class="note" id="ptnote"></span></div></div>' +
      '<div><h3>Chapters</h3>' + (list ? '<ul class="chapters">' + list + '</ul>' : '<p class="note">No chapters saved yet.</p>') +
        '<div class="actions"><button class="btn" type="button" data-act="book"' + (J.chapters.length ? '' : ' disabled') + '>Season book (HTML)</button>' +
        '<button class="btn" type="button" data-act="tochapter">Open the Chapter tab</button><span class="note" id="stnote"></span></div></div></div>';
  }
  function renderPreview() {
    cfdReset();
    renderPtBar();
    const txt = $('#txt').value;
    $('#txt').rows = Math.min(22, Math.max(8, txt.split('\n').length + 1));
    // Longer than one Discord message: shown and posted as several messages, split at paragraph breaks.
    const parts = AS.split(txt);
    $('#dctext').innerHTML = P.discordHtml(parts[0] || '');
    $('#dcmore').innerHTML = parts.slice(1).map(p => '<div class="dc more"><div class="dc-av" aria-hidden="true"></div><div class="dc-body"><div class="dc-text">' + P.discordHtml(p) + '</div></div></div>').join('');
    $('#count').textContent = txt.length + ' characters' + (parts.length > 1 ? ' · ' + parts.length + ' Discord messages' : '');
    $('#count').className = 'count' + (parts.length > 10 ? ' over' : parts.length > 1 ? ' split' : '');
  }
  function renderExpNote() {
    const n = $('#expnote'), F = reportFacts();
    if (!st.exp) { n.className = 'note'; n.textContent = 'Optional: adds safety cars, flags, penalties and pit stops.'; }
    else if (F && F.exportMismatch) { n.className = 'note err'; n.textContent = (st.expName || 'Export') + ' is for ' + st.exp.circuit + '; the last race in this save is ' + st.summary.last.name + '.'; }
    else { n.className = 'note ok'; n.textContent = (st.expName || 'Pasted export') + ': ' + st.exp.circuit + ', ' + st.exp.events.length + ' race control events.'; }
  }
  function useExport(text, name) {
    const exp = R.parseExport(text);
    if (!exp) { note('#expnote', 'Not a race summary export (no "=== Race summary — … ===" line).', 'err'); return false; }
    st.exp = exp; st.expName = name || null; st.variant = 0;
    renderExpNote();
    if (st.opt.kind === 'strategy' || st.opt.kind === 'us') { update(); return true; }
    if (!st.dirty && st.opt.src !== 'ai') setText(templateText());
    else note('#gennote', 'Export loaded. Press “' + (st.opt.src === 'ai' ? 'Open in Claude' : 'New wording') + '” to use it.', 'ok');
    return true;
  }
  function aiInput() {
    const s = st.summary, o = st.opt, F = reportFacts();
    const notes = notesText();
    const extra = [o.wish, notes ? 'My own notes (use them, they are mine): ' + notes : ''].filter(Boolean).join('\n');
    if (o.kind === 'episode' && st.ep) return Ep.aiPrompt(st.ep, { lang: o.lang, tone: o.tone, length: o.len, extra });
    const events = st.exp && F && !F.exportMismatch ? st.exp.events.map(e => 'Lap ' + e.lap + ' — ' + e.text) : null;
    return P.aiPrompt(s, F, { lang: o.kind === 'us' ? 'en' : o.lang, tone: o.tone, content: o.about === 'season' || !F ? 'season' : 'race', length: o.len, extra, events,
      kind: o.kind, view: st.view, headlines: o.kind === 'paddock' ? V.paddockHeadlines(st.view, o.lang, 'press') : null,
      diary: o.tone === 'diary' ? DY.facts(diaryData()) : null });
  }

  // ------------------------------------------------------------ writing help: my notes, prompts out, answers in
  const notesKey = () => { const s = st.summary || {}; return 'notes.' + st.sel + '.' + s.season + '.' + (s.rounds ? s.rounds.done : 0); };
  const notesText = () => (($('#notes') && $('#notes').value) || '').trim();
  function loadNotes() { const el = $('#notes'); if (el) el.value = store.get(notesKey(), ''); syncHelp(); }
  function syncHelp() {
    const m = AS.MODES[st.opt.whMode] || AS.MODES.notes, el = $('#whgoes');
    if (el) el.textContent = m.result === 'post' ? 'The answer replaces the post text.' : m.result === 'notes' ? 'The questions go into my notes: answer them there.' : 'The options go into my notes: pick one and use it.';
  }
  function helpPrompt() {
    const o = st.opt, base = aiInput();
    let facts = base.user.replace(/^Facts \(JSON\):\n/, '').split('\n\nExtra wish from the player: ')[0];
    try { const strip = x => Array.isArray(x) ? x.map(strip) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length)).map(([k, v]) => [k, strip(v)])) : x; facts = JSON.stringify(strip(JSON.parse(facts))); } catch (e) { /* keep text */ }
    return AS.prompt(o.whMode, { lang: o.lang, facts, notes: notesText(), draft: $('#txt').value, kindName: KIND_NAMES[o.kind] || o.kind,
      story: st.journal ? st.journal.chapters.slice(-5).map(c => (c.kind === 'prologue' ? 'Prologue' : 'Chapter ' + c.no) + ': ' + c.title) : [] });
  }
  function importAnswer(raw) {
    const text = P.fromChat(raw), m = AS.MODES[st.opt.whMode] || AS.MODES.notes;
    if (!text) { note('#whnote', 'Nothing to import.', 'err'); return; }
    if (m.result === 'post') {
      st.aiText = text; setText(text); st.dirty = true;
      const n = AS.split(text).length;
      note('#whnote', 'Imported into the post text' + (n > 1 ? ', ' + n + ' Discord messages.' : '.'), 'ok');
      if (st.opt.kind === 'episode') { clearTimeout(st.cardTimer); st.cardTimer = setTimeout(drawEpisodeCard, 300); }
    } else {
      const el = $('#notes'); el.value = (el.value.trim() ? el.value.trim() + '\n\n' : '') + text; store.set(notesKey(), el.value);
      note('#whnote', m.result === 'notes' ? 'Questions added to my notes: answer them there, then choose “Turn my notes into the post”.' : 'Options added to my notes.', 'ok');
    }
  }

  // ------------------------------------------------------------ AI via a chat (no API key needed)
  async function openChat() {
    const prompt = P.chatPrompt(aiInput());
    let copied = true;
    try { await navigator.clipboard.writeText(prompt); } catch (e) { copied = false; }
    const url = 'https://claude.ai/new?q=' + encodeURIComponent(prompt);
    // Long prompts do not fit in a link: open an empty chat and paste (Ctrl+V).
    const viaLink = url.length <= 7500;
    window.open(viaLink ? url : 'https://claude.ai/new', '_blank', 'noopener');
    st.waitingChat = true;
    note('#gennote', (viaLink ? 'Claude opened with the prompt filled in.' : copied ? 'Claude opened. Paste the prompt there with Ctrl+V.' : 'Claude opened. Use “Copy as AI prompt” and paste it there.') +
      ' Then copy Claude’s answer (copy button on the code block) and press “Paste answer”.', 'ok');
  }
  async function pasteAnswer() {
    let text = '';
    try { text = await navigator.clipboard.readText(); } catch (e) { text = ''; }
    if (!text.trim()) {
      $('#txt').focus(); $('#txt').select();
      note('#gennote', 'The browser did not allow reading the clipboard: paste the answer into the text box with Ctrl+V.', '');
      return;
    }
    const post = P.fromChat(text);
    if (post.length > 2000) note('#gennote', 'Longer than one Discord message: it will be posted as ' + AS.split(post).length + ' messages.', 'ok');
    st.aiText = post; setText(post); st.waitingChat = false;
    note('#gennote', 'AI answer pasted. Edit freely.', 'ok');
  }


  // Faces and logos named in the save (paths into the game's resources folder), via the local server.
  function loadImages(view) {
    if (st.source !== 'server' || !view) return Promise.resolve();
    const want = new Set();
    (function walk(o, depth) { if (!o || depth > 4) return; if (Array.isArray(o)) { o.slice(0, 40).forEach(x => walk(x, depth + 1)); return; }
      if (typeof o === 'object') for (const [k, v] of Object.entries(o)) { if ((k === 'face' || k === 'logo' || k === 'image') && typeof v === 'string' && v) want.add(v); else if (v && typeof v === 'object') walk(v, depth + 1); } })(view, 0);
    const todo = [...want].filter(p => !st.images.has(p)).slice(0, 60);
    return Promise.all(todo.map(p => new Promise(resolve => {
      const im = new Image(); let done = false;
      const fin = ok => { if (done) return; done = true; st.images.set(p, ok ? im : null); resolve(); };
      im.onload = () => fin(true); im.onerror = () => fin(false); setTimeout(() => fin(false), 3000);
      im.src = 'api/image?path=' + encodeURIComponent(p);
    })));
  }

  function loadLogo() {
    const f = st.summary && st.summary.focus;
    const meta = st.files && st.files.meta;
    const path = st.source === 'server' && f ? (f.logo || (f.role === 'player' && meta && meta.teamLogo) || '') : '';
    if (path === st.logoKey) return Promise.resolve();
    st.logoKey = path; st.logo = null;
    if (!path) return Promise.resolve();
    return new Promise(resolve => {
      const img = new Image();
      const done = ok => { st.logo = ok ? img : null; resolve(); };
      img.onload = () => done(true); img.onerror = () => done(false);
      setTimeout(() => done(false), 3000);
      img.src = 'api/image?path=' + encodeURIComponent(path);
    });
  }

  // ------------------------------------------------------------ options + actions
  $('#main').addEventListener('change', async e => {
    const id = e.target.id, o = st.opt;
    if (id === 'o-kind') {
      o.kind = e.target.value; st.dirty = false; st.aiText = null; syncControls(); renderTabs(); renderTray(); await update();
      if (o.src === 'ai') note('#gennote', 'Press “Open in Claude”, send the prompt, copy the answer and press “Paste answer”.', '');
      return;
    }
    const textOpt = { 'o-src': 'src', 'o-tone': 'tone', 'o-about': 'about', 'o-len': 'len' }[id];
    if (textOpt) {
      o[textOpt] = e.target.value; store.set('opt', o); syncControls();
      if (textOpt === 'src') { st.dirty = false; st.aiText = null; }
      if (o.src !== 'ai' && !st.dirty) setText(templateText());
      else if (o.src === 'ai') { if (!st.aiText) setText(templateText(), true); note('#gennote', 'Press “Open in Claude” to write it with these settings.', ''); }
      return;
    }
    if (id === 'mpfile') { const texts = await Promise.all([...e.target.files].map(f => f.text())); e.target.value = ''; if (texts.length) await addRecaps(texts); return; }
    if (id === 'mproster') { await setRoster(e.target.value); return; }
    if (id === 'rosterfile') { const f = e.target.files[0]; e.target.value = ''; if (f) await setRoster(await f.text()); return; }
    if (id === 'mpround') { st.mpRound = e.target.value; await select(st.league.id); return; }
    if (e.target.dataset && e.target.dataset.pteam != null) {
      const lg = st.league, key = st.mpRound || st.mpBuild.last.key;
      const names = [...document.querySelectorAll('[data-pteam]')].filter(x => x.checked && x.dataset.pteam !== lg.team).map(x => x.dataset.pteam);
      const rec = lg.recaps.find(r => { const q = RC.parse(r.text); return q && q.key === key; });
      if (rec) rec.players = names;
      await putLeague(lg); await select(lg.id); return;
    }
    if (id === 'mphost') { const lg = st.league; lg.host = e.target.value || null; await putLeague(lg); st.journalSlot = null; await select(lg.id); return; }
    if (id === 'mpteam' || id === 'mpcolor' || id === 'mpcat2') {
      const lg = st.league; if (!lg) return;
      if (id === 'mpteam') lg.team = e.target.value || null; else if (id === 'mpcolor') lg.color = e.target.value; else lg.category = e.target.value.trim() || null;
      await putLeague(lg); await select(lg.id); return;
    }
    if (id === 'wh-mode') { o.whMode = e.target.value; store.set('opt', o); syncHelp(); return; }
    if (id === 'whfile') { const file = e.target.files[0]; if (file) importAnswer(await file.text()); e.target.value = ''; return; }
    if (id === 'posttext') { st.postText = e.target.value; renderTray(); return; }
    if (id === 'o-slide') { o.slide = e.target.value; store.set('opt', o); return update(); }
    if (id === 'o-from' || id === 'o-to') { o[id === 'o-from' ? 'from' : 'to'] = +e.target.value; store.set('opt', o); st.dirty = false; st.aiText = null; return update(); }
    if (id === 'o-person') { o.person = e.target.value; store.set('opt', o); st.dirty = false; st.aiText = null; return update(); }
    if (id === 'o-epcard') { o.epCard = e.target.value; store.set('opt', o); return drawEpisodeCard(); }
    if (id === 'o-epscope') { o.epScope = e.target.value; store.set('opt', o); st.dirty = false; st.aiText = null; return update(); }
    if (id && id.startsWith('pt-') || (e.target.classList && e.target.classList.contains('pt-follow'))) return;
    if (id === 'o-lang') { o.lang = e.target.value; if (o.src === 'ai' && st.aiText) note('#gennote', 'Press “Open in Claude” for this language.', ''); }
    else if (id === 'o-table') o.table = e.target.value;
    else if (id === 'o-live') o.live = e.target.checked;
    else if (id === 'expfile') { const file = e.target.files[0]; if (file) useExport(await file.text(), file.name); e.target.value = ''; return; }
    else if (id === 'remember') { if (e.target.checked) store.set('hook.' + st.sel, $('#hook').value.trim()); else { store.del('hook.' + st.sel); $('#hook').value = store.get('hook', ''); } hookNote(); return; }
    else if (id === 'rememberall') { if (e.target.checked) store.set('hook', $('#hook').value.trim()); else store.del('hook'); hookNote(); return; }
    else return;
    store.set('opt', o);
    await update();
  });
  $('#main').addEventListener('input', async e => {
    const id = e.target.id;
    if (id === 'txt') {
      if (st.waitingChat && /```/.test(e.target.value)) { e.target.value = P.fromChat(e.target.value); st.aiText = e.target.value; st.waitingChat = false; }
      st.dirty = true; renderPreview(); postCount();
      if (st.opt.kind === 'episode') { clearTimeout(st.cardTimer); st.cardTimer = setTimeout(drawEpisodeCard, 500); }
    }
    if (id === 'o-wish') { st.opt.wish = e.target.value; store.set('opt', st.opt); }
    if (id === 'notes') store.set(notesKey(), e.target.value);
    if (id === 'mppastebox' && /=+\s*Race summary/i.test(e.target.value) && /## Championship standings AFTER[\s\S]*###\s*Constructors[\s\S]*P\d+\./i.test(e.target.value)) {
      const t = e.target.value; e.target.value = ''; e.target.hidden = true; await addRecaps([t]);
    }
    // Typing changes the webhook of this save when it has its own, otherwise the default one.
    if (id === 'hook') { const v = e.target.value.trim(); if ($('#remember').checked || store.get('hook.' + st.sel, '')) { if ($('#remember').checked) store.set('hook.' + st.sel, v); } else if ($('#rememberall') && $('#rememberall').checked) store.set('hook', v); }
    if (id === 'exppaste' && e.target.value.trim().length > 40 && useExport(e.target.value, 'Pasted export')) e.target.hidden = true;
  });
  // Drop a race export (.txt) anywhere on the page.
  document.addEventListener('dragover', e => { if (st.summary && [...(e.dataTransfer.items || [])].some(i => i.kind === 'file')) e.preventDefault(); });
  document.addEventListener('drop', async e => {
    const file = e.dataTransfer && e.dataTransfer.files[0];
    if (!file || !st.summary || !/\.txt$|text\/plain/i.test(file.name + ' ' + file.type)) return;
    e.preventDefault(); useExport(await file.text(), file.name);
  });

  function note(sel, text, kind) { const n = $(sel); if (n) { n.textContent = text; n.className = 'note' + (kind ? ' ' + kind : ''); } }
  const fileName = () => {
    const s = st.summary;
    if (st.opt.kind === 'wrapped') return ('dm-wrapped-' + s.season + '-' + st.opt.slide + '-' + (s.focus ? s.focus.short : 'card')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
    if (st.opt.kind === 'episode' && st.ep) return ('dm-' + (st.ep.kind === 'prologue' ? 'prologue' : 'chapter-' + st.ep.no) + '-' + st.opt.epCard + '-' + (s.focus ? s.focus.short : 'card')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
    return ('dm-' + (st.opt.kind === 'race' ? 'save' : st.opt.kind) + '-' + (s.focus ? s.focus.short : 'card') + '-' + s.season + '-r' + s.rounds.done).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
  };
  const blob = () => new Promise(r => $('#card').toBlob(r, 'image/png'));
  // The season book is a file on its own: embed the four fonts it uses (about 90 kB) instead of linking a font service.
  async function bookFonts() {
    const F = [['Barlow', 'barlow-latin-400-normal', 400, 'normal'], ['Barlow', 'barlow-latin-600-normal', 600, 'normal'],
      ['Barlow Condensed', 'barlow-condensed-latin-700-normal', 700, 'normal'], ['Barlow Condensed', 'barlow-condensed-latin-800-italic', 800, 'italic']];
    const b64 = async f => { const buf = new Uint8Array(await (await fetch('fonts/' + f + '.woff2')).arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return btoa(s); };
    try { return (await Promise.all(F.map(async ([fam, f, w, st2]) => "@font-face{font-family:'" + fam + "';src:url(data:font/woff2;base64," + await b64(f) + ") format('woff2');font-weight:" + w + ';font-style:' + st2 + '}'))).join(''); }
    catch (e) { return ''; }
  }

  $('#main').addEventListener('click', async e => {
    const mpb = e.target.closest('[data-mp]'); if (mpb) { await select(mpb.dataset.mp); return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'cfd') { await cfdNext(); return; }
    if (act === 'savepost') { await savePostChapter(); return; }
    if (act === 'tochapter') { chooseKind('episode'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (act === 'mpnew') { newLeagueForm(); return; }
    if (act === 'tochapter2') { showPage('chapter'); return; }
    if (act === 'copyimg') {
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob() })]); note('#imgnote', 'Copied. Paste it in Discord with Ctrl+V.', 'ok'); }
      catch (err) { note('#imgnote', 'This browser does not allow copying images. Use Download PNG.', 'err'); }
    } else if (act === 'png') {
      const url = URL.createObjectURL(await blob());
      const a = document.createElement('a'); a.href = url; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      note('#imgnote', 'Saved as ' + fileName(), 'ok');
    } else if (act === 'copytxt') {
      try { await navigator.clipboard.writeText($('#txt').value); note('#txtnote', 'Copied.', 'ok'); }
      catch (err) { $('#txt').select(); note('#txtnote', 'Press Ctrl+C to copy.', ''); }
    } else if (act === 'gen') {
      if (st.opt.src === 'ai') return openChat();
      st.variant++; setText(templateText());
    } else if (act === 'pasteai') { await pasteAnswer();
    } else if (act === 'prompt') {
      const p = aiInput();
      try { await navigator.clipboard.writeText(P.chatPrompt(p)); note('#gennote', 'Prompt copied. Paste it in Claude or another AI chat.', 'ok'); }
      catch (err) { note('#gennote', 'Copy failed.', 'err'); }
    } else if (act === 'savech') {
      const ch = await saveChapter($('#txt').value);
      if (ch) { note('#imgnote', (ch.kind === 'prologue' ? 'Prologue' : 'Chapter ' + ch.no) + ' saved in the journal.', 'ok'); st.dirty = false; st.aiText = null; await update(); }
    } else if (act === 'book') {
      const html = Book.html(st.journal, { lang: st.opt.lang, goalText: st.journal.series ? Ep.goalText(st.journal.series.goal, st.opt.lang) : '', fontCss: await bookFonts() });
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      const a = document.createElement('a'); a.href = url; a.download = ('playthrough-' + ((st.journal.series && st.journal.series.name) || st.journal.team.short || 'dm')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      note('#stnote', 'Season book downloaded.', 'ok');
    } else if (act === 'ptform') { st.ptForm = !st.ptForm; renderStory();
    } else if (act === 'ptcancel') { st.ptForm = false; renderStory();
    } else if (act === 'ptupdate') {
      st.journal.series = Object.assign({}, st.journal.series, seriesFromForm()); st.ptForm = false; await saveJournal(); st.dirty = false; await update();
      note('#imgnote', 'Playthrough premise updated.', 'ok');
    } else if (act === 'ptstart') {
      if (st.journal && st.journal.chapters.length && !confirm('Start a new playthrough? The current journal (' + st.journal.chapters.length + ' chapters) is kept as a backup file and a new one begins.')) return;
      const snap = Ch.snapshot(st.files, st.summary);
      st.journal = Ch.restart(snap, st.sel, seriesFromForm()); st.journalSlot = st.sel; st.ptForm = false;
      await saveJournal(); st.dirty = false; st.aiText = null; st.variant = 0;
      await update();
      note('#imgnote', 'New playthrough started: ' + (st.ep && st.ep.kind === 'prologue' ? 'the first chapter is the prologue (the story so far).' : 'the first chapter is the pilot.'), 'ok');
    } else if (act === 'loadexp') { $('#expfile').click();
    } else if (act === 'pasteexp') { const t = $('#exppaste'); t.hidden = !t.hidden; if (!t.hidden) t.focus();
    } else if (act === 'whcopy' || act === 'whopen' || act === 'whdl') {
      const pr = helpPrompt();
      if (act === 'whdl') {
        const url = URL.createObjectURL(new Blob([pr], { type: 'text/plain;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = 'dm-prompt-' + st.opt.whMode + '-' + (st.summary.season || '') + '-r' + (st.summary.rounds.done || 0) + '.txt';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
        note('#whnote', 'Prompt downloaded. Paste it in any AI chat; load or paste the answer here.', 'ok'); return;
      }
      let copied = true; try { await navigator.clipboard.writeText(pr); } catch (err) { copied = false; }
      if (act === 'whopen') { const url = 'https://claude.ai/new?q=' + encodeURIComponent(pr); window.open(url.length <= 7500 ? url : 'https://claude.ai/new', '_blank', 'noopener'); }
      note('#whnote', act === 'whopen' ? (copied ? 'Claude opened (prompt also copied; paste with Ctrl+V if the chat is empty).' : 'Claude opened.') : copied ? 'Prompt copied.' : 'Copy failed: use Download .txt.', copied ? 'ok' : 'err');
    } else if (act === 'whpaste') {
      let t = ''; try { t = await navigator.clipboard.readText(); } catch (err) { t = ''; }
      if (!t.trim()) { note('#whnote', 'The browser did not allow reading the clipboard: use Load .txt, or paste into the text box or notes yourself.', ''); return; }
      importAnswer(t);
    } else if (act === 'whload') { $('#whfile').click();
    } else if (act === 'rosterdl') {
      const txt = '# ' + (st.league.name || 'Players') + ' — DM Save Card\n' + RC.formatRoster(st.league.roster) + '\n';
      const url = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = 'players-' + RC.slug(st.league.name) + '.txt'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } else if (act === 'rosterfill') {
      // The other human teams in the host save. Steam names are not used: fill in the Discord names.
      const f = st.files, me = (f.meta || {}).playerTeamId ?? ((f.player || {}).player || {}).teamId;
      const byId = new Map(((f.teams || {}).teams || []).map(t => [t.id, t.name]));
      const coop = ((f.player || {}).coopPlayers || []).filter(p => p && p.teamId != null && p.teamId !== me && byId.has(p.teamId));
      if (!coop.length) { note('#rosternote', 'No other human players in this save.', 'err'); return; }
      const lg = st.league, list = (lg.roster || []).slice();
      const match = n => (RC.rosterCheck([{ name: '', team: n }], st.mpBuild.teams)[0].match) || String(n).replace(/\s*\(#\s?\d+\)\s*$/, '');
      let added = 0;
      for (const p of coop) {
        const team = match(byId.get(p.teamId));
        if (!list.some(x => x.team === team)) { list.push({ name: '?', team }); added++; }
      }
      lg.roster = list; await putLeague(lg); await select(lg.id);
      const open = list.filter(x => x.name === '?').length;
      note('#rosternote', (added ? added + ' team' + (added > 1 ? 's' : '') + ' added from the save. ' : 'All player teams were already listed. ') + (open ? 'Replace @? with the Discord name (' + open + ' to go).' : ''), open ? '' : 'ok');
    } else if (act === 'rosterload') { $('#rosterfile').click();
    } else if (act === 'rostercopy') {
      try { await navigator.clipboard.writeText(RC.formatRoster(st.league.roster)); note('#rosternote', 'Copied.', 'ok'); } catch (err) { note('#rosternote', 'Copy failed.', 'err'); }
    } else if (act === 'mppaste') {
      const box = $('#mppastebox');
      if (box.hidden) { box.hidden = false; box.focus(); note('#mprnote', 'Paste the recap in the box; it is added straight away.', ''); }
    } else if (act === 'mpload') { $('#mpfile').click();
    } else if (act === 'mprm') {
      const key = e.target.dataset.key, lg = st.league;
      lg.recaps = lg.recaps.filter(r => { const q = RC.parse(r.text); return !q || q.key !== key; });
      if (!lg.recaps.length) { note('#mprnote', 'A season needs at least one recap. Use “Delete season” to remove it.', 'err'); await select(lg.id, true); return; }
      await putLeague(lg); st.journalSlot = null; await select(lg.id); note('#mprnote', 'Round removed.', 'ok');
    } else if (act === 'mpdel') {
      if (!confirmDel(e.target)) return;
      await dropLeague(st.league.id); st.sel = null; store.del('sel'); pickDefault(); if (!st.sel) newLeagueForm();
    } else if (act === 'addtray') {
      if (st.tray.length >= TRAY_MAX) return;
      const item = { label: trayLabel(), kind: st.opt.kind, img: $('#card').toDataURL('image/png'), text: $('#txt').value, filename: fileName() };
      // A chapter in the tray is saved in the journal once the post goes out.
      if (st.opt.kind === 'episode' && st.ep && !st.ep.saved) item.chapter = Object.assign(Ep.toChapter(st.ep, item.text, st.opt.lang, st.variant), textTitle() ? { title: textTitle() } : {});
      st.tray.push(item);
      if (st.tray.length === 1 && (!st.postText || st.postText === 'current')) st.postText = '0';   // first card: post its own text
      renderTray();
      note('#imgnote', 'Added to the post (' + st.tray.length + '). Switch tabs to add more, then post below.', 'ok');
    } else if (act === 'trayrm') {
      st.tray.splice(+b.dataset.i, 1); if (/^\d+$/.test(st.postText || '') && +st.postText >= st.tray.length) st.postText = st.tray.length ? '0' : 'current'; renderTray();
    } else if (act === 'post') {
      const hook = $('#hook').value.trim();
      if (!hook) { note('#postnote', 'Paste a webhook URL first.', 'err'); return; }
      const text = postText(), parts = AS.split(text);
      if (parts.length > 10) { note('#postnote', 'The text would need ' + parts.length + ' messages; shorten it to at most 10.', 'err'); return; }
      const items = st.tray.length ? st.tray : [{ img: $('#card').toDataURL('image/png'), filename: fileName(), current: true }];
      if (st.busy) return; st.busy = true; b.disabled = true; note('#postnote', 'Posting…');
      try {
        // With start.bat the local server posts; on the site the browser posts to Discord itself.
        const res = st.source === 'server'
          ? await api('api/discord', { webhook: hook, content: parts[0] || '', more: parts.slice(1), images: items.map(t => ({ image: t.img.split(',')[1], filename: t.filename })) })
          : await window.DMWebhook.post(hook, parts[0] || '', parts.slice(1), await Promise.all(items.map(async t => ({ blob: await (await fetch(t.img)).blob(), filename: t.filename }))));
        if (res.ok) {
          let saved = [];
          for (const t of items) if (t.chapter && st.journal) { const ch = Ch.addChapter(st.journal, t.chapter); saved.push(ch.kind === 'prologue' ? 'the prologue' : 'chapter ' + ch.no); }
          if (items[0].current && st.opt.kind === 'episode' && st.ep && !st.ep.saved) { const ch = await saveChapter(text || $('#txt').value); if (ch) saved.push(ch.kind === 'prologue' ? 'the prologue' : 'chapter ' + ch.no); }
          else if (saved.length) await saveJournal();
          note('#postnote', 'Posted ' + items.length + ' card' + (items.length > 1 ? 's' : '') + (parts.length > 1 ? ' and ' + parts.length + ' messages' : '') + ' at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '.' + (saved.length ? ' Saved ' + saved.join(', ') + ' in the journal.' : ''), 'ok');
          st.tray = []; st.postText = 'current'; renderTray(); if (saved.length && st.opt.kind === 'episode') { st.dirty = true; renderStory(); }
        }
        else note('#postnote', res.error || 'Posting failed.', 'err');
      } catch (err) { note('#postnote', 'Posting failed: ' + err.message, 'err'); }
      st.busy = false; b.disabled = false;
    }
  });

  boot();
})();
