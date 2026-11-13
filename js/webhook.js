/* DM Save Card — post to a Discord webhook straight from the browser (the site has no server).
   Same rules as server.py: only discord.com webhook URLs, optional ?thread_id=, at most 10 PNGs,
   never ping anyone, the rest of a long text as follow-up messages. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMWebhook = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const RE = /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/webhooks\/\d{5,25}\/[A-Za-z0-9_-]{20,100}$/;
  const MAX_IMAGES = 10;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // "https://discord.com/api/webhooks/1/abc?thread_id=2" → { base, query } or null.
  function parse(url) {
    let u; try { u = new URL(String(url || '').trim()); } catch (e) { return null; }
    const base = u.origin + u.pathname.replace(/\/+$/, '');
    if (!RE.test(base)) return null;
    const q = new URLSearchParams({ wait: 'true' });
    const t = u.searchParams.get('thread_id');
    if (t && /^\d+$/.test(t)) q.set('thread_id', t);
    return { base, query: q.toString() };
  }

  async function errorOf(res) {
    let msg = 'Discord answered ' + res.status;
    try { const j = await res.json(); if (j && j.message) msg += ': ' + j.message; if (j && j.retry_after) msg += ' (try again in ' + Math.ceil(j.retry_after) + ' s)'; } catch (e) { /* no body */ }
    if (res.status === 404 || res.status === 401) msg += '. Is the webhook deleted?';
    return msg;
  }

  // images: [{ blob, filename }]. fetchFn for tests.
  async function post(webhook, content, more, images, fetchFn) {
    const f = fetchFn || fetch;
    const w = parse(webhook);
    if (!w) return { ok: false, error: 'That is not a Discord webhook URL.' };
    images = images || [];
    if (images.length > MAX_IMAGES) return { ok: false, error: 'At most ' + MAX_IMAGES + ' images per post.' };
    if (!content && !images.length) return { ok: false, error: 'Nothing to post.' };
    const used = new Set();
    const files = images.map((im, i) => {
      let name = String(im.filename || 'save-card.png').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
      if (used.has(name)) name = name.slice(0, -4) + '-' + (i + 1) + '.png';
      used.add(name);
      return { blob: im.blob, name };
    });
    const payload = { content: String(content || '').slice(0, 2000), allowed_mentions: { parse: [] } };
    if (files.length) payload.attachments = files.map((x, i) => ({ id: i, filename: x.name }));
    const form = new FormData();
    form.append('payload_json', JSON.stringify(payload));
    files.forEach((x, i) => form.append('files[' + i + ']', x.blob, x.name));
    const url = w.base + '?' + w.query;
    let res;
    try { res = await f(url, { method: 'POST', body: form }); }
    catch (e) { return { ok: false, error: 'The browser could not reach Discord (offline or blocked). Use Copy for Discord instead.' }; }
    if (!res.ok) return { ok: false, error: await errorOf(res) };
    let sent = 1;
    for (const part of (more || []).slice(0, 9)) {
      await sleep(700);                                   // stay well under the webhook rate limit
      try {
        res = await f(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: String(part).slice(0, 2000), allowed_mentions: { parse: [] } }) });
      } catch (e) { return { ok: false, error: 'Card posted, but part ' + (sent + 1) + ' of the text did not get through.' }; }
      if (!res.ok) return { ok: false, error: 'Card posted, but part ' + (sent + 1) + ': ' + await errorOf(res) };
      sent++;
    }
    return { ok: true, messages: sent };
  }

  return { parse, post, RE, MAX_IMAGES };
});
