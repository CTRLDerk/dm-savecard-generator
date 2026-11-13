/* DM Save Card — writing help: prompts that help the player write (not write for them),
   exported to any AI chat and imported back; and splitting long text into Discord posts. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DMAssist = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const LIMIT = 2000;

  // ------------------------------------------------------------ splitting
  // Split at paragraph breaks, then lines, then sentences; never inside a word if it can be helped.
  // A heading or bold label stays with the paragraph after it. Each part ends with a small "1/3" line.
  function split(text, max) {
    max = max || LIMIT;
    text = String(text || '').replace(/\r/g, '').trim();
    if (text.length <= max) return text ? [text] : [];
    const lim = max - 12;                                   // room for "\n-# 10/10"
    const pieces = [];
    for (const block of text.split(/\n{2,}/)) {
      if (block.length <= lim) { pieces.push(block); continue; }
      let cur = '';
      for (const unit of byLines(block, lim)) {
        if (!cur) cur = unit; else if (cur.length + 1 + unit.length <= lim) cur += '\n' + unit; else { pieces.push(cur); cur = unit; }
      }
      if (cur) pieces.push(cur);
    }
    const parts = [];
    let cur = '';
    for (const p of pieces) {
      if (!cur) cur = p;
      else if (cur.length + 2 + p.length <= lim) cur += '\n\n' + p;
      else { parts.push(cur); cur = p; }
    }
    if (cur) parts.push(cur);
    // Keep a trailing heading / bold label with the next part.
    for (let i = 0; i < parts.length - 1; i++) {
      const lines = parts[i].split('\n'), lastLine = lines[lines.length - 1];
      if (/^(#{1,3} |\*\*[^*]+\*\*:?\s*$|-# )/.test(lastLine) && lines.length > 1 && (lastLine.length + 2 + parts[i + 1].length) <= lim) {
        parts[i] = lines.slice(0, -1).join('\n').trim(); parts[i + 1] = lastLine + '\n' + parts[i + 1];
      }
    }
    const n = parts.length;
    return parts.map((p, i) => p.trim() + '\n-# ' + (i + 1) + '/' + n);
  }
  function byLines(block, lim) {
    const out = [];
    for (const line of block.split('\n')) {
      if (line.length <= lim) { out.push(line); continue; }
      let cur = '';
      for (const sent of line.split(/(?<=[.!?…])\s+/)) {
        const chunks = sent.length <= lim ? [sent] : hard(sent, lim);
        for (const c of chunks) { if (!cur) cur = c; else if (cur.length + 1 + c.length <= lim) cur += ' ' + c; else { out.push(cur); cur = c; } }
      }
      if (cur) out.push(cur);
    }
    return out;
  }
  function hard(s, lim) {
    const out = [];
    while (s.length > lim) { let cut = s.lastIndexOf(' ', lim); if (cut < lim * 0.6) cut = lim; out.push(s.slice(0, cut).trim()); s = s.slice(cut).trim(); }
    if (s) out.push(s);
    return out;
  }

  // ------------------------------------------------------------ writing help prompts
  const MODES = {
    notes: { label: 'Turn my notes into the post', result: 'post' },
    interview: { label: 'Interview me first (questions)', result: 'notes' },
    gaps: { label: 'Fill the gaps in my draft', result: 'post' },
    voice: { label: 'Give a driver or the team boss a voice', result: 'snippet' },
    titles: { label: 'Titles and opening lines', result: 'snippet' },
    polish: { label: 'Polish my draft (keep my voice)', result: 'post' }
  };
  const TASK = {
    notes: 'Write the post from MY NOTES and the FACTS. My notes are the heart of it: keep my words, my opinions and my decisions, and put them first. Use the facts only to support and fill in. Do not add events, numbers or quotes that are not in the notes or facts.',
    interview: 'Do NOT write the post yet. Ask me 5 short, concrete questions that draw out the story behind these facts: the decisions I made and why, what I expected, how I felt, what I fear or hope for next, and one question about a driver or a rival as a person. Number the questions. I will answer them and paste the answers back as my notes.',
    gaps: 'Read MY DRAFT next to the FACTS. Keep my draft as it is and add at most 4 short passages where the story has a gap: a decision and the trade-off behind it, what was at stake, a character moment, or a link to an earlier storyline. Mark every line you add with ✍️ at the start so I can see and edit it. Return the full draft with the additions in place.',
    voice: 'Write 3 short options (one or two sentences each) for a quote or inner thought of a driver or the team boss about this moment, in character, based on the facts (their result, traits, rivals, mood). Mark each option clearly as invented roleplay with *(in character)*. No new facts.',
    titles: 'Give 5 chapter titles (max 6 words, punchy, no clickbait lies) and 3 opening lines (one sentence each) that hook a reader who has never followed this save. Base them on the facts and my notes.',
    polish: 'Polish MY DRAFT: fix spelling, grammar and flow, tighten repetition, keep my voice, my words where possible, my structure and every fact. Do not add new events, numbers or quotes. Return the full draft.'
  };

  // facts: JSON string or object; notes/draft: text; kindName: e.g. "Race summary"
  function prompt(mode, ctx) {
    const m = MODES[mode] ? mode : 'notes';
    const lang = ctx.lang === 'nl' ? 'Dutch' : 'English';
    const facts = typeof ctx.facts === 'string' ? ctx.facts : JSON.stringify(ctx.facts || {});
    const lines = [
      'You help me, the player, write a post for my Delta Manager playthrough on Discord (' + (ctx.kindName || 'post') + '). You are my writing assistant, not the author: the story and the voice are mine.',
      'Language: ' + lang + '. Use Discord markdown (**bold**, *italic*, "## " for a heading, "- " for lists). No @mentions, no links, no hashtags unless I use them.',
      'Length: as long as the story needs. If it gets longer than 2000 characters that is fine: the tool splits it into several Discord messages at paragraph breaks, so use short paragraphs.',
      'Facts come from the game save and are correct; never invent results, numbers, names or events beyond them.' + (m === 'voice' ? ' Invented roleplay lines are allowed only when clearly marked.' : ''),
      '',
      'TASK: ' + TASK[m],
      '',
      MODES[m].result === 'notes' ? 'Reply with only the numbered questions inside one code block (```).' : 'Reply with only the result inside one code block (```), nothing before or after it, so I can copy it with one click.'
    ];
    const parts = [lines.join('\n'), 'FACTS (JSON):\n' + facts];
    if (ctx.notes && ctx.notes.trim()) parts.push('MY NOTES:\n' + ctx.notes.trim());
    if (['gaps', 'polish'].includes(m) || (ctx.draft && m === 'notes' && ctx.useDraft)) parts.push('MY DRAFT:\n' + String(ctx.draft || '').trim());
    if (ctx.story && ctx.story.length) parts.push('EARLIER CHAPTERS (titles, for links back):\n' + ctx.story.map(c => '- ' + c).join('\n'));
    return parts.join('\n\n');
  }

  return { LIMIT, split, MODES, prompt };
});
