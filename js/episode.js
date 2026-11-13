/* DM Save Card — chapters: one episode of the playthrough, built from the journal.
   Chapter = number + title + main story + side stories + a callback to an earlier chapter + a cliffhanger.
   Text in English or Dutch (Discord markdown, max 2000 characters), and the facts for the AI version. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./chronicle.js'), require('./angles.js'), require('./text.js'));
  else root.DMEpisode = factory(root.DMChronicle, root.DMAngles, root.DMText);
})(typeof self !== 'undefined' ? self : this, function (Ch, A, TXT) {
  'use strict';
  const md = x => String(x == null ? '' : x).replace(/([\\*_~`|>])/g, '\\$1').replace(/@/g, '@\u200b');
  const fillRaw = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
  function rng(seed) { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
  const surname = n => String(n || '').trim().split(/\s+/).slice(-1)[0];
  const crew = d => (d || []).map(surname).slice(0, 3).join('/');

  // ------------------------------------------------------------ wording
  // title: chapter title (main story) · lead: opening of the main story · line: one line as a side story · cliff: open question
  const W = {
    en: {
      chapter: 'Chapter', round: 'round {R} of {N}', pre: 'pre-season', meanwhile: 'Meanwhile', previously: 'Previously', next: 'Next time',
      callback: 'This storyline started in chapter {N}: “{T}”.', motive: ['For {D} there is more at stake: {M}.', 'Keep an eye on {D}: {M}.'],
      standing: ['We are now P{P} with {X} points{G}.', 'That leaves us P{P} on {X} points{G}.'], gapAhead: ', {A} behind {B}', gapLead: ', {A} clear at the top',
      nextRace: 'Next up: {C}, round {R}.', seasonOver: 'The season is over. Time to plan the next one.',
      k: {
        champions: { title: ['Champions', 'The title is ours'], lead: ['We are champions. {T} closes the season on top with {X} points and {W} wins.'], line: 'Champions of {S}.' },
        season_end: { title: ['The season in one word: P{P}', 'Final standings: P{P}'], lead: ['The season is over: {T} finishes P{P} with {X} points{V}.'], line: 'Season over: P{P}.' },
        season_start: { title: ['A new season, a new chance', 'Season {S} begins'], lead: ['Season {S} starts. The board wants P{E}{L}. Our drivers: {D}.'], line: 'Season {S} has started.' },
        start: { title: ['Where it all begins', 'The story starts here'], lead: ['This is where our story starts: {T} in season {S}. The board wants P{E}. Our drivers: {D}.'], lead2: ['We pick up the story after round {R}: {T} is P{P} with {X} points. The board wants P{E}.'], line: 'The story of {T} starts here.' },
        win: { title: ['Victory at {C}', '^From {SP} to the top step', 'We won {C}'], lead: ['We won at {C}! {D} started {SP} and nobody could stop us.', 'Victory at {C}: from {SP} on the grid to the top step with {D}.', '{C} is ours. {D} took the car from {SP} to the win.', 'First across the line at {C}: {D}, from {SP} on the grid.'], line: 'Win at {C} with {D}.' },
        podium: { title: ['On the podium at {C}', '^{SP} to {FP} at {C}'], lead: ['^Podium at {C}: {D} went from {SP} to {FP}.', '{C} gave us a trophy: {FP} for {D}, from {SP} on the grid.', 'Champagne at {C}: {D} finished {FP} after starting {SP}.'], line: '{FP} at {C} ({D}).' },
        comeback: { title: ['The comeback at {C}', '{G} places at {C}'], lead: ['What a drive at {C}: {D} started {SP} and fought back to {FP}, {G} places gained.', '{SP} on the grid, {FP} at the flag: {D} passed {G} cars at {C}.', 'Nobody gave us a chance from {SP} at {C}. {D} finished {FP}.'], line: '{D} gained {G} places at {C} ({SP} to {FP}).' },
        heartbreak: { title: ['Heartbreak at {C}', 'Out at {C}'], lead: ['{C} hurt. {D} started {SP} and never saw the flag{L}.', 'Pain at {C}: out of the race with {D}{L}, after starting {SP}.'], line: 'DNF at {C} ({D}).' },
        bad_day: { title: ['A long day at {C}', 'Going backwards at {C}'], lead: ['{C} was hard work: {D} dropped from {SP} to {FP}.', 'We went the wrong way at {C}: {SP} at the start, {FP} at the finish for {D}.', 'A race to forget at {C}. {D} lost ground all day: {SP} to {FP}.'], line: '{D} dropped from {SP} to {FP} at {C}.' },
        quiet: { title: ['{FP} at {C}', 'Banking {FP} at {C}'], lead: ['A solid weekend at {C}: {D} started {SP} and finished {FP}.', '{FP} at {C} for {D}, from {SP} on the grid.'],
          leadRel: ['{FP} at {C} for {D}, from {SP} on the grid: {REL}.', '{D} brought it home {FP} at {C} after starting {SP}. That is {REL}.'], line: '{FP} at {C}.' },
        pole: { line: 'Pole position at {C}.' },
        race_digest: { line: 'Results since last time: {X}.' },
        streak_hot: { title: ['{N} podiums in a row', 'On a roll'], lead: ['We are on a roll: {N} podiums in a row.'], line: '{N} podiums in a row.' },
        streak_cold: { title: ['{N} races without points', 'Searching for answers'], lead: ['{N} races without points. Something has to change.'], line: '{N} races without points.' },
        lead_taken: { title: ['Leaders of the championship', 'We lead the championship'], lead: ['We lead the championship! Up from P{F} to the top.'], line: 'We took the championship lead.' },
        lead_lost: { title: ['The lead is gone', 'Knocked off the top'], lead: ['We lost the championship lead to {B}; we are P{P} now.'], line: 'We lost the lead to {B}.' },
        clinch: { title: ['Mathematically champions', 'Nobody can catch us'], lead: ['Nobody can catch us anymore: the title is ours with {L} rounds to go.'], line: 'Title clinched with {L} rounds left.' },
        eliminated: { title: ['The title is gone', 'Out of the title fight'], lead: ['It is official: the title is out of reach with {L} rounds left. New goal: the best possible place.'], line: 'Out of the title fight.' },
        pass_up: { title: ['Past {A}', 'Up to P{P}'], lead: ['We moved past {A} in the championship and are P{P} now.'], line: 'Past {A} in the standings, now P{P}.' },
        pass_down: { title: ['{A} gets past us', 'Down to P{P}'], lead: ['{A} passed us in the championship; we drop to P{P}.'], line: '{A} passed us: P{P}.' },
        target_up: { title: ['Ahead of the board’s target'], lead: ['We are where the board wants us, or better: target P{E}, now P{P}.'], line: 'On or ahead of the board’s target (P{E}).' },
        target_down: { title: ['Below the target'], lead: ['We fell below the board’s target of P{E}.'], line: 'Below the board’s target of P{E}.' },
        title_fight: { cliff: 'The title is still in reach: {X} behind with {L} rounds left. Can we close the gap?' },
        defend_lead: { cliff: 'We lead by {X} over {B} with {L} rounds left. Can we hold on?' },
        chase: { line: '{X} behind {B} (P{P}).', cliff: 'Only {X} to {B} ahead. Do we take P{P} next time?' },
        pressure: { line: '{B} is only {X} behind.', cliff: '{B} is {X} behind us. Can we keep them there?' },
        career_first: { title: ['First win for {D}', '{D} wins at last'], lead: ['A day {D} will never forget: the first win of the career.'], line: 'First career win for {D}.' },
        milestone: { title: ['{D}: {X} wins'], lead: ['{D} reached {X} career wins.'], line: '{D} reached {X} career wins.' },
        injury: { title: ['{D} injured'], lead: ['Bad news: {D} is injured{W}.'], line: '{D} is injured{W}.' },
        morale_up: { line: '{D} is in a {M} mood.' },
        morale_down: { line: 'Morale is down for {D}.' },
        rivalry: { title: ['{D} vs {O}'], lead: ['There is bad blood between {D} and {O}.'], line: '{D} and {O} do not get along.' },
        signing: { title: ['Welcome, {D}'], lead: ['{D} joins us as {R}{U}.'], line: '{D} signed as {R}{U}.' },
        departure: { title: ['Goodbye, {D}'], lead: ['{D} has left the team.'], line: '{D} left the team.' },
        extension: { title: ['{D} stays'], lead: ['{D} signed a new deal until {U}.'], line: '{D} extended until {U}.' },
        teammates: { line: 'Teammate duel: {D} leads {O} by {X} points.' },
        contract: { line: 'Contract ends this season: {D}.', cliff: 'The contract of {D} ends this season. Do we extend?' },
        upgrade_hit: { title: ['Breakthrough in the factory', 'The new {N} works'], lead: ['The factory delivered: the new {N} works{X}.'], line: 'Upgrade worked: {N}{X}.' },
        upgrade_miss: { title: ['Setback in the factory', 'The {N} upgrade failed'], lead: ['A setback in the factory: the {N} upgrade did not work.'], line: 'Upgrade failed: {N}.' },
        factory_best: { line: 'No team improved its car more this season.' },
        dev_start: { line: 'In the factory: {N}, ready in week {X}.' },
        protest: { title: ['Protest!'], lead: ['{B} protested against {A}. {X}'], line: 'Protest {B} vs {A}: {X}' },
        investigation: { line: 'Stewards looked at {A}: {X}' },
        techcheck: { title: ['Failed scrutineering'], lead: ['Our car failed the technical check: {D}.'], line: 'Technical check failed: {D}.' },
        rebrand: { line: '{A} is now {B}.' },
        analyst: { line: 'Testing analyst: {X}.' },
        goal_done: { title: ['Mission accomplished', 'We did it'], lead: ['We did it: {G}. {T} finished P{P} in {S}.'], line: 'Goal reached: {G}.' },
        goal_failed: { title: ['The mission failed', 'Goal out of reach'], lead: ['The goal is out of reach: {G}. P{P} in {S}. Time to regroup.'], line: 'Goal missed: {G}.' },
        goal: { line: 'Goal: {G}.', cliff: '{Q}' },
        analyst_wrong: { line: '{X} Now P{P}.' }
      },
      goals: { title: 'champions within {N} seasons', title1: 'champions this season', top: 'P{P} or better by {Y}', target: 'the board’s target every season' },
      goalQ: { title: 'Goal: {G}. Season {K} of {N}, now P{P}. Are we on course?', top: 'Goal: {G}. Now P{P}. Are we on course?', target: 'Goal: {G}. Target P{E}, now P{P}.', custom: 'Goal: {G}.' },
      rate: ['poor', 'shaky', 'solid', 'strong', 'world-class'],
      pro: { title: ['The story so far'], tag: 'Prologue', past: 'Earlier seasons', season: 'This season', cast: 'The cast', factory: 'The factory', threads: 'Open storylines', premise: 'This playthrough: {N}.', goal: 'The goal: {G}.', rules: 'House rules: {R}.',
        seasonLine: '{R} races: {W}, {P}, {D}.', nW: ['win', 'wins'], nP: ['podium', 'podiums'], nD: ['DNF', 'DNFs'], high: 'High point: {X}.', low: 'Low point: {X}.', now: 'We are P{P} with {X} points{E}{TR}.', trend: ', {D} from P{F} three races ago', up: 'up', down: 'down', steady: ', steady',
        hiRace: '{P} at {C}{G}', loRace: 'out at {C} after starting {S}', loBad: '{P} at {C} from {S}', fromGrid: ' from {S}', target: ' (target P{E})',
        pastSeason: '{S} P{P}', wins: '{N} wins', win1: '1 win', titles: '{N} titles', title1: '1 title',
        driver: '{N} ({X})', drvPos: 'P{P}', careerW: '{N} career wins', careerW1: '1 career win', rival: 'Rival: {B}, {X} {D}.', ahead: 'ahead of us', behind: 'behind us',
        fac: '{A} of {B} upgrades worked.', facNone: 'No upgrades yet this season.', strong: 'Strongest area: {N} ({W}).', weak: 'Weakest: {N} ({W}).', pts1: 'point', pts: 'points' },
      pil: { title: ['Where it all begins'], tag: 'Pilot', intro: '{T} in {C} {S}.', crew: 'The crew', car: 'The car', exp: 'The expectations', board: 'The board wants P{E}.', analyst: 'The testing analyst {X}.',
        driver: '{N} ({A}, {W})', star: ' – the one to follow', calendar: '{R} rounds, starting at {C}.', q: 'The first step towards the goal: does it start well?', rookie: 'rookie' },
      words: { up: 'up', down: 'down', upheld: 'upheld', rejected: 'rejected', clean: 'all clear', notClean: 'under investigation', driver: 'race driver', reserve: 'reserve', tipBehind: 'Tipped among the teams behind in testing.', tipStrong: 'Tipped as one of the strongest in testing.',
        strong: 'tipped us as one of the strongest', watch: 'called us a team to watch', behind: 'had us among the teams behind', moods: { poor: 'poor', shaky: 'shaky', solid: 'solid', strong: 'good', great: 'great' }, target: ' (target P{E})', lastSeason: ', after P{P} last season', weeks: ' for {W} weeks' }
    },
    nl: {
      chapter: 'Hoofdstuk', round: 'ronde {R} van {N}', pre: 'voorseizoen', meanwhile: 'Ondertussen', previously: 'Eerder', next: 'Volgende keer',
      callback: 'Dit verhaal begon in hoofdstuk {N}: “{T}”.', motive: ['Voor {D} staat er meer op het spel: {M}.', 'Let op {D}: {M}.'],
      standing: ['We staan nu P{P} met {X} punten{G}.', 'Daarmee staan we P{P} met {X} punten{G}.'], gapAhead: ', {A} achter {B}', gapLead: ', {A} voorsprong',
      nextRace: 'Volgende race: {C}, ronde {R}.', seasonOver: 'Het seizoen zit erop. Tijd om het volgende te plannen.',
      k: {
        champions: { title: ['Kampioen', 'De titel is binnen'], lead: ['We zijn kampioen. {T} sluit het seizoen af bovenaan met {X} punten en {W} zeges.'], line: 'Kampioen van {S}.' },
        season_end: { title: ['Het seizoen in één woord: P{P}', 'Eindstand: P{P}'], lead: ['Het seizoen zit erop: {T} eindigt als P{P} met {X} punten{V}.'], line: 'Seizoen voorbij: P{P}.' },
        season_start: { title: ['Een nieuw seizoen, een nieuwe kans', 'Seizoen {S} begint'], lead: ['Seizoen {S} begint. Het bestuur wil P{E}{L}. Onze coureurs: {D}.'], line: 'Seizoen {S} is begonnen.' },
        start: { title: ['Waar het allemaal begint', 'Het verhaal begint hier'], lead: ['Hier begint ons verhaal: {T} in seizoen {S}. Het bestuur wil P{E}. Onze coureurs: {D}.'], lead2: ['We pakken het verhaal op na ronde {R}: {T} staat P{P} met {X} punten. Het bestuur wil P{E}.'], line: 'Het verhaal van {T} begint hier.' },
        win: { title: ['Zege op {C}', '^Van {SP} naar de hoogste trede', 'We wonnen {C}'], lead: ['We hebben gewonnen op {C}! {D} startte als {SP} en niemand kon ons stoppen.', 'Zege op {C}: van {SP} op de grid naar de hoogste trede met {D}.'], line: 'Zege op {C} met {D}.' },
        podium: { title: ['Op het podium op {C}', '^{SP} naar {FP} op {C}'], lead: ['^Podium op {C}: {D} ging van {SP} naar {FP}.', '{C} leverde een beker op: {FP} voor {D}, vanaf {SP} op de grid.'], line: '{FP} op {C} ({D}).' },
        comeback: { title: ['De inhaalrace op {C}', '{G} plekken op {C}'], lead: ['Wat een race op {C}: {D} startte als {SP} en vocht zich terug naar {FP}, {G} plekken gewonnen.'], line: '{D} won {G} plekken op {C} ({SP} naar {FP}).' },
        heartbreak: { title: ['Drama op {C}', 'Uitgevallen op {C}'], lead: ['{C} deed pijn. {D} startte als {SP} en zag de finish niet{L}.', 'Pijn op {C}: uitgevallen met {D}{L}, na een start als {SP}.'], line: 'Uitvaller op {C} ({D}).' },
        bad_day: { title: ['Een lange dag op {C}', 'Achteruit op {C}'], lead: ['{C} was zwaar: {D} zakte van {SP} naar {FP}.'], line: '{D} zakte van {SP} naar {FP} op {C}.' },
        quiet: { leadRel: ['{FP} op {C} voor {D}, vanaf {SP} op de grid: {REL}.', '{D} bracht de auto als {FP} thuis op {C} na een start vanaf {SP}. Dat is {REL}.'], title: ['{FP} op {C}', '{FP} binnen op {C}'], lead: ['Degelijk weekend op {C}: {D} startte als {SP} en finishte als {FP}.'], line: '{FP} op {C}.' },
        pole: { line: 'Pole position op {C}.' },
        race_digest: { line: 'Uitslagen sinds de vorige keer: {X}.' },
        streak_hot: { title: ['{N} podiums op rij', 'In vorm'], lead: ['We zijn in vorm: {N} podiums op rij.'], line: '{N} podiums op rij.' },
        streak_cold: { title: ['{N} races zonder punten', 'Op zoek naar antwoorden'], lead: ['{N} races zonder punten. Er moet iets veranderen.'], line: '{N} races zonder punten.' },
        lead_taken: { title: ['Leider in het kampioenschap', 'Wij leiden het kampioenschap'], lead: ['Wij leiden het kampioenschap! Van P{F} naar de top.'], line: 'We namen de leiding in het kampioenschap.' },
        lead_lost: { title: ['De leiding is weg', 'Van de troon gestoten'], lead: ['We zijn de leiding kwijt aan {B}; we staan nu P{P}.'], line: 'Leiding kwijt aan {B}.' },
        clinch: { title: ['Rekenkundig kampioen', 'Niemand haalt ons nog in'], lead: ['Niemand kan ons nog inhalen: de titel is binnen met nog {L} ronden te gaan.'], line: 'Titel binnen met nog {L} ronden.' },
        eliminated: { title: ['De titel is weg', 'Uit de titelstrijd'], lead: ['Het is officieel: de titel is buiten bereik met nog {L} ronden. Nieuw doel: de hoogst mogelijke plek.'], line: 'Uit de titelstrijd.' },
        pass_up: { title: ['Voorbij {A}', 'Omhoog naar P{P}'], lead: ['We zijn {A} voorbij in het kampioenschap en staan nu P{P}.'], line: 'Voorbij {A} in het klassement, nu P{P}.' },
        pass_down: { title: ['{A} gaat ons voorbij', 'Terug naar P{P}'], lead: ['{A} ging ons voorbij in het kampioenschap; we zakken naar P{P}.'], line: '{A} ging ons voorbij: P{P}.' },
        target_up: { title: ['Boven het doel van het bestuur'], lead: ['We zitten waar het bestuur ons wil, of beter: doel P{E}, nu P{P}.'], line: 'Op of boven het doel van het bestuur (P{E}).' },
        target_down: { title: ['Onder het doel'], lead: ['We zakten onder het doel van het bestuur: P{E}.'], line: 'Onder het doel van het bestuur (P{E}).' },
        title_fight: { cliff: 'De titel is nog haalbaar: {X} achter met nog {L} ronden. Lukt het om het gat te dichten?' },
        defend_lead: { cliff: 'We leiden met {X} voor {B}, met nog {L} ronden. Houden we het vast?' },
        chase: { line: '{X} achter {B} (P{P}).', cliff: 'Nog maar {X} naar {B} voor ons. Pakken we volgende keer P{P}?' },
        pressure: { line: '{B} staat maar {X} achter ons.', cliff: '{B} staat {X} achter ons. Houden we ze daar?' },
        career_first: { title: ['Eerste zege voor {D}', '{D} wint eindelijk'], lead: ['Een dag die {D} nooit vergeet: de eerste zege van de carrière.'], line: 'Eerste carrièrezege voor {D}.' },
        milestone: { title: ['{D}: {X} zeges'], lead: ['{D} staat op {X} carrièrezeges.'], line: '{D} staat op {X} carrièrezeges.' },
        injury: { title: ['{D} geblesseerd'], lead: ['Slecht nieuws: {D} is geblesseerd{W}.'], line: '{D} is geblesseerd{W}.' },
        morale_up: { line: '{D} zit {M} in zijn vel.' },
        morale_down: { line: 'Het moreel van {D} is gezakt.' },
        rivalry: { title: ['{D} tegen {O}'], lead: ['Het botert niet tussen {D} en {O}.'], line: '{D} en {O} kunnen niet met elkaar.' },
        signing: { title: ['Welkom, {D}'], lead: ['{D} komt bij ons als {R}{U}.'], line: '{D} getekend als {R}{U}.' },
        departure: { title: ['Vaarwel, {D}'], lead: ['{D} heeft het team verlaten.'], line: '{D} heeft het team verlaten.' },
        extension: { title: ['{D} blijft'], lead: ['{D} tekende bij tot {U}.'], line: '{D} verlengd tot {U}.' },
        teammates: { line: 'Teamgenotenduel: {D} staat {X} punten voor {O}.' },
        contract: { line: 'Contract loopt af dit seizoen: {D}.', cliff: 'Het contract van {D} loopt af na dit seizoen. Verlengen we?' },
        upgrade_hit: { title: ['Doorbraak in de fabriek', 'De nieuwe {N} werkt'], lead: ['De fabriek heeft geleverd: de nieuwe {N} werkt{X}.'], line: 'Upgrade gelukt: {N}{X}.' },
        upgrade_miss: { title: ['Tegenslag in de fabriek', 'Upgrade {N} mislukt'], lead: ['Tegenslag in de fabriek: de upgrade van {N} is mislukt.'], line: 'Upgrade mislukt: {N}.' },
        factory_best: { line: 'Geen team verbeterde zijn auto dit seizoen meer dan wij.' },
        dev_start: { line: 'In de fabriek: {N}, klaar in week {X}.' },
        protest: { title: ['Protest!'], lead: ['{B} protesteerde tegen {A}. {X}'], line: 'Protest {B} tegen {A}: {X}' },
        investigation: { line: 'Stewards keken naar {A}: {X}' },
        techcheck: { title: ['Afgekeurd bij de technische controle'], lead: ['Onze auto werd afgekeurd bij de technische controle: {D}.'], line: 'Technische controle afgekeurd: {D}.' },
        rebrand: { line: '{A} heet nu {B}.' },
        analyst: { line: 'Testanalist: {X}.' },
        goal_done: { title: ['Missie geslaagd', 'Het is gelukt'], lead: ['Het is gelukt: {G}. {T} eindigde als P{P} in {S}.'], line: 'Doel gehaald: {G}.' },
        goal_failed: { title: ['Missie mislukt', 'Doel buiten bereik'], lead: ['Het doel is buiten bereik: {G}. P{P} in {S}. Tijd om te hergroeperen.'], line: 'Doel gemist: {G}.' },
        goal: { line: 'Doel: {G}.', cliff: '{Q}' },
        analyst_wrong: { line: '{X} Nu P{P}.' }
      },
      goals: { title: 'kampioen binnen {N} seizoenen', title1: 'kampioen dit seizoen', top: 'P{P} of beter in {Y}', target: 'elk seizoen het doel van het bestuur halen' },
      goalQ: { title: 'Doel: {G}. Seizoen {K} van {N}, nu P{P}. Liggen we op koers?', top: 'Doel: {G}. Nu P{P}. Liggen we op koers?', target: 'Doel: {G}. Doel P{E}, nu P{P}.', custom: 'Doel: {G}.' },
      rate: ['zwak', 'wankel', 'degelijk', 'sterk', 'wereldklasse'],
      pro: { title: ['Het verhaal tot nu toe'], tag: 'Proloog', past: 'Eerdere seizoenen', season: 'Dit seizoen', cast: 'De hoofdrolspelers', factory: 'De fabriek', threads: 'Open verhaallijnen', premise: 'Deze playthrough: {N}.', goal: 'Het doel: {G}.', rules: 'Eigen regels: {R}.',
        seasonLine: '{R} races: {W}, {P}, {D}.', nW: ['zege', 'zeges'], nP: ['podium', 'podiums'], nD: ['uitvaller', 'uitvallers'], high: 'Hoogtepunt: {X}.', low: 'Dieptepunt: {X}.', now: 'We staan P{P} met {X} punten{E}{TR}.', trend: ', {D} van P{F} drie races geleden', up: 'omhoog', down: 'omlaag', steady: ', stabiel',
        hiRace: '{P} op {C}{G}', loRace: 'uitgevallen op {C} na een start als {S}', loBad: '{P} op {C} vanaf {S}', fromGrid: ' vanaf {S}', target: ' (doel P{E})',
        pastSeason: '{S} P{P}', wins: '{N} zeges', win1: '1 zege', titles: '{N} titels', title1: '1 titel',
        driver: '{N} ({X})', drvPos: 'P{P}', careerW: '{N} carrièrezeges', careerW1: '1 carrièrezege', rival: 'Rivaal: {B}, {X} {D}.', ahead: 'voor ons', behind: 'achter ons',
        fac: '{A} van {B} upgrades gelukt.', facNone: 'Nog geen upgrades dit seizoen.', strong: 'Sterkste gebied: {N} ({W}).', weak: 'Zwakste: {N} ({W}).', pts1: 'punt', pts: 'punten' },
      pil: { title: ['Waar het allemaal begint'], tag: 'Pilot', intro: '{T} in {C} {S}.', crew: 'De ploeg', car: 'De auto', exp: 'De verwachtingen', board: 'Het bestuur wil P{E}.', analyst: 'De testanalist {X}.',
        driver: '{N} ({A}, {W})', star: ' – de hoofdrolspeler', calendar: '{R} ronden, te beginnen op {C}.', q: 'De eerste stap richting het doel: begint het goed?', rookie: 'rookie' },
      words: { up: 'omhoog', down: 'omlaag', upheld: 'toegewezen', rejected: 'afgewezen', clean: 'alles in orde', notClean: 'onderzoek loopt', driver: 'racecoureur', reserve: 'reserve', tipBehind: 'Bij de testdagen getipt als achterblijver.', tipStrong: 'Bij de testdagen getipt als een van de sterksten.',
        strong: 'tipte ons als een van de sterkste teams', watch: 'noemde ons een team om in de gaten te houden', behind: 'zag ons bij de achterblijvers', moods: { poor: 'slecht', shaky: 'niet lekker', solid: 'prima', strong: 'goed', great: 'uitstekend' }, target: ' (doel P{E})', lastSeason: ', na P{P} vorig seizoen', weeks: ' voor {W} weken' }
    }
  };
  const list = (a, lang) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + (lang === 'nl' ? ' en ' : ' and ') + a[a.length - 1]);
  const NAMES_NL = { speed: 'topsnelheid', grip: 'grip', aero: 'aero', racePace: 'racetempo', tyreManagement: 'bandenbeheer', dirtyAir: 'vuile lucht', overtaking: 'inhalen', reliability: 'betrouwbaarheid' };

  // The playthrough goal in words.
  function goalText(G, lang) {
    const w = (W[lang] || W.en).goals;
    if (!G) return '';
    if (G.type === 'title') return (G.seasons || 1) <= 1 ? w.title1 : fillRaw(w.title, { N: G.seasons });
    if (G.type === 'top') return fillRaw(w.top, { P: G.pos || 1, Y: G.by || '' });
    if (G.type === 'target') return w.target;
    return md(G.text || '');
  }
  function goalQ(d, lang) {
    const q = (W[lang] || W.en).goalQ, G = d.goal;
    return fillRaw(q[G.type] || q.custom, { G: goalText(G, lang), K: d.seasonNo, N: d.of, P: d.pos ?? '?', E: d.expected ?? '?' });
  }

  // Templates marked with ^ need places gained (no "from P2 to P2").
  function usable(list, c) {
    const gained = c && c.data && c.data.gain > 0;
    const ok = list.filter(x => gained || !x.startsWith('^'));
    return (ok.length ? ok : list).map(x => x.replace(/^\^/, ''));
  }

  // Placeholders for one angle.
  function vars(c, ctx, lang) {
    const w = W[lang], d = c.data || {}, T = ctx.snap.team;
    const pos = n => (n == null ? '?' : 'P' + n);
    const num = n => { if (n == null) return '–'; const t = Number.isInteger(n) ? String(n) : (+n).toFixed(1); return lang === 'nl' ? t.replace('.', ',') : t; };
    const pts = n => num(n) + (lang === 'nl' ? (n === 1 ? ' punt' : ' punten') : (n === 1 ? ' point' : ' points'));
    const v = { T: md(T.short), S: ctx.snap.season, P: d.to ?? d.pos ?? T.pos, X: '', E: d.expected ?? T.expected ?? '?', N: '', L: '', W: '', V: '', G: '', B: '', A: '', D: '', O: '', R: '', U: '', M: '', F: d.from ?? '' };
    if (d.name && ['win', 'podium', 'comeback', 'heartbreak', 'bad_day', 'quiet', 'pole'].includes(c.key)) {
      Object.assign(v, { C: md(d.name), D: md(crew(d.drivers)), SP: pos(d.start), FP: pos(d.pos), G: d.gain,
        L: d.outLap ? (lang === 'nl' ? ' (ronde ' + d.outLap + ')' : ' (lap ' + d.outLap + ')') : '' });
      v.REL = md(TXT.relative(ctx.snap.story, lang));
    }
    switch (c.key) {
      case 'champions': Object.assign(v, { X: num(d.points), W: d.wins || 0 }); break;
      case 'season_end': Object.assign(v, { P: d.pos, X: num(d.points), V: d.expected ? fillRaw(w.words.target, { E: d.expected }) : '' }); break;
      case 'season_start': Object.assign(v, { E: d.expected || '?', D: md(list(d.people || [], lang)), L: d.last && d.last.pos ? fillRaw(w.words.lastSeason, { P: d.last.pos }) : '' }); break;
      case 'race_digest': v.X = d.races.map(r => md(r.name) + ' ' + r.label).join(', '); break;
      case 'streak_hot': case 'streak_cold': v.N = d.n; break;
      case 'lead_lost': Object.assign(v, { B: md(d.by || ''), P: d.to }); break;
      case 'clinch': case 'eliminated': v.L = d.left; break;
      case 'goal_done': case 'goal_failed': Object.assign(v, { G: goalText(d.goal, lang), P: d.pos, S: d.season }); break;
      case 'goal': Object.assign(v, { G: goalText(d.goal, lang), Q: goalQ(d, lang) }); break;
      case 'target_up': case 'target_down': Object.assign(v, { P: T.pos, E: d.expected || T.expected }); break;
      case 'pass_up': case 'pass_down': Object.assign(v, { A: md(list(d.teams, lang)), P: d.to }); break;
      case 'title_fight': Object.assign(v, { X: pts(d.gap), L: d.left }); break;
      case 'defend_lead': Object.assign(v, { X: pts(d.gap), B: md(d.behind || ''), L: d.left }); break;
      case 'chase': case 'pressure': Object.assign(v, { X: pts(d.gap), B: md(d.team), P: d.pos }); break;
      case 'start': Object.assign(v, { E: d.expected || '?', D: md(list(d.people || [], lang)), R: d.round, P: d.pos, X: num(d.points) }); break;
      case 'career_first': case 'departure': v.D = md(d.name); break;
      case 'milestone': Object.assign(v, { D: md(d.name), X: d.wins }); break;
      case 'injury': Object.assign(v, { D: md(d.name), W: d.weeks ? fillRaw(w.words.weeks, { W: d.weeks }) : '' }); break;
      case 'morale_up': case 'morale_down': Object.assign(v, { D: md(d.name), M: w.words.moods[d.word] || d.word }); break;
      case 'rivalry': Object.assign(v, { D: md(d.name), O: md(d.other) }); break;
      case 'signing': Object.assign(v, { D: md(d.name), R: w.words[d.role] || d.role, U: d.until ? (lang === 'nl' ? ' tot ' : ' until ') + d.until : '' }); break;
      case 'extension': Object.assign(v, { D: md(d.name), U: d.until }); break;
      case 'teammates': Object.assign(v, { D: md(d.lead), O: md(d.other), X: num(d.gap) }); break;
      case 'contract': v.D = md(d.names.join(', ')); break;
      case 'upgrade_hit': Object.assign(v, { N: lang === 'nl' ? (NAMES_NL[d.key] || d.name) : String(d.name || d.key).toLowerCase(), X: d.from != null && d.to != null ? ' (+' + num(+(d.to - d.from).toFixed(1)) + ')' : '' }); break;
      case 'upgrade_miss': v.N = lang === 'nl' ? (NAMES_NL[d.key] || d.name) : String(d.name || d.key).toLowerCase(); break;
      case 'dev_start': Object.assign(v, { N: lang === 'nl' ? (NAMES_NL[d.key] || d.name) : String(d.name || d.key).toLowerCase(), X: d.ready }); break;
      case 'protest': Object.assign(v, { A: md(d.against), B: md(d.by), X: (d.upheld ? w.words.upheld + (d.punishment ? ' (' + md(d.punishment) + ')' : '') : w.words.rejected) + '.' }); break;
      case 'investigation': Object.assign(v, { A: md(d.against), X: (d.clean ? w.words.clean : w.words.notClean) + '.' }); break;
      case 'techcheck': v.D = md((d.failed || []).join(', ')); break;
      case 'rebrand': Object.assign(v, { A: md(d.from), B: md(d.to) }); break;
      case 'analyst': v.X = w.words[d.tip] || d.tip; break;
      case 'analyst_wrong': Object.assign(v, { X: d.tip === 'behind' ? w.words.tipBehind : w.words.tipStrong, P: d.pos }); break;
      default: break;
    }
    return v;
  }

  // ------------------------------------------------------------ build
  // opts: { scope: 'chapter' | 'race' | 'season', race: DMReport facts (optional) }
  function build(journal, opts) {
    opts = opts || {};
    const snap = journal && journal.last;
    if (!snap) return null;
    const first0 = !journal.chapters.length;
    const history0 = snap.round > 0 || !!(snap.team.career && snap.team.career.past && snap.team.career.past.length);
    const kind0 = opts.kind || (first0 ? (history0 ? 'prologue' : journal.series || snap.preseason ? 'pilot' : 'chapter') : 'chapter');
    const saved0 = journal.chapters.find(c => c.season === snap.season && c.round === snap.round && (c.kind || 'chapter') === kind0) || null;
    const scope = opts.scope || 'chapter';
    const events = Ch.eventsSince(journal, scope, scope === 'chapter' ? saved0 : null);
    // Scoring a saved chapter again: compare with the chapters before it, not with itself.
    const jctx = saved0 ? Object.assign({}, journal, { chapters: journal.chapters.filter(c => c !== saved0 && (c.upto || 0) <= (saved0.upto || 0)) }) : journal;
    const ctx = { snap, events, journal: jctx, race: opts.race || null };
    const cands = A.candidates(ctx);
    const pick = A.select(cands);
    const no = (journal.chapters.length ? Math.max(...journal.chapters.map(c => c.no)) : 0) + 1;
    const lastRace = events.filter(e => e.type === 'race').sort((a, b) => a.round - b.round).pop() || null;
    // The first chapter of a career that is already under way is a prologue ("the story so far");
    // the first chapter of a new playthrough at the start of a season is the pilot.
    const kind = kind0, saved = saved0;
    const lang = opts.lang || 'en';
    const series = journal.series ? { name: journal.series.name || '', goal: journal.series.goal || null, focus: journal.series.focus || [], rules: journal.series.rules || '',
      goalText: goalText(journal.series.goal, lang), goalLine: (pick.threads.find(c => c.key === 'goal') || null) ? goalQ(pick.threads.find(c => c.key === 'goal').data, lang) : '' } : null;
    return { kind, recap: kind === 'chapter' ? null : recap(snap, journal, cands), series, lang,
      no: kind === 'prologue' ? 0 : saved ? saved.no : no, saved: !!saved, season: snap.season, round: snap.round, total: snap.total, week: snap.week, category: snap.category,
      team: snap.team, circuit: lastRace ? { name: lastRace.name, cc: lastRace.cc, round: lastRace.round } : null, next: snap.next, finished: snap.finished, preseason: snap.preseason,
      main: pick.main, side: pick.side, cliff: pick.cliff, threads: pick.threads, arcs: pick.arcs, candidates: cands, events, ctx };
  }

  // Everything a prologue or pilot needs, from the snapshot (and the journal for the trend).
  function recap(snap, journal, cands) {
    const T = snap.team;
    const races = snap.races.map(r => {
      const b = r.mine.slice().sort((a, x) => (a.finished === x.finished ? (a.pos || 99) - (x.pos || 99) : a.finished ? -1 : 1))[0] || {};
      return { round: r.round, name: r.name, pos: b.finished ? b.pos : null, start: b.start, finished: !!b.finished, gain: b.finished && b.start ? b.start - b.pos : null, standing: r.standing };
    });
    const fin = races.filter(r => r.finished);
    const high = fin.slice().sort((a, b) => a.pos - b.pos || (b.gain || 0) - (a.gain || 0))[0] || null;
    const outs = snap.races.flatMap(r => r.mine.filter(m => !m.finished).map(m => ({ round: r.round, name: r.name, start: m.start, pos: null, finished: false })))
      .sort((a, b) => (a.start || 99) - (b.start || 99));
    const worst = fin.slice().sort((a, b) => (a.gain || 0) - (b.gain || 0))[0];
    const low = outs[0] ? Object.assign({ out: true }, outs[0]) : worst && worst.gain < 0 && worst !== high ? worst : null;
    const st = races.filter(r => r.standing);
    const back = st.length > 3 ? st[st.length - 4].standing.pos : null;
    const attrs = (snap.rnd && snap.rnd.attrs) || [];
    const strong = attrs.slice().sort((a, b) => a.rank - b.rank)[0] || null, weak = attrs.slice().sort((a, b) => b.rank - a.rank)[0] || null;
    const tip = ((snap.paddock && snap.paddock.items) || []).find(i => i.type === 'analyst') || null;
    const focus = ((journal.series && journal.series.focus) || []);
    return {
      past: (T.career && T.career.past) || [], titles: (T.career && T.career.titles) || 0,
      season: { races: races.length, wins: T.wins || 0, podiums: T.podiums || 0, dnf: T.dnf || 0, poles: T.poles || 0 },
      high, low, trend: back != null && T.pos != null ? { from: back, to: T.pos } : null,
      cast: snap.people.filter(p => p.role === 'driver').map(p => Object.assign({ follow: focus.includes(p.name) }, p)),
      ahead: T.ahead && T.gapAhead != null ? { team: T.ahead, gap: T.gapAhead } : null, behind: T.behind && T.gapBehind != null ? { team: T.behind, gap: T.gapBehind } : null,
      factory: snap.rnd ? { done: snap.rnd.done, ok: snap.rnd.successes, strong, weak } : null, tip,
      first: snap.calendar[0] || null, rounds: snap.total,
      threads: cands.filter(c => c.thread).slice(0, 3)
    };
  }
  const rateIdx = (rank, of) => { const x = of > 1 ? (rank - 1) / (of - 1) : 0; return x <= 0.1 ? 4 : x <= 0.3 ? 3 : x <= 0.6 ? 2 : x <= 0.85 ? 1 : 0; };
  const levelIdx = l => (l == null ? null : l < 4 ? 0 : l < 5.5 ? 1 : l < 7 ? 2 : l < 8.5 ? 3 : 4);

  function writeOpening(ep, opts) {
    const lang = W[opts.lang] ? opts.lang : 'en', w = W[lang], R = ep.recap, T = ep.team;
    const num = n => { if (n == null) return '–'; const t = Number.isInteger(n) ? String(n) : (+n).toFixed(1); return lang === 'nl' ? t.replace('.', ',') : t; };
    const P = w.pro, Q = w.pil, out = [];
    const ttl = opts.title || title(ep, lang, opts.variant);
    const tag = ep.kind === 'prologue' ? P.tag : w.chapter + ' ' + ep.no;
    out.push('## ' + tag + ' · ' + md(ttl));
    out.push('-# ' + [ep.series && ep.series.name ? md(ep.series.name) : null, ep.category ? md(ep.category) + ' ' + ep.season : ep.season, ep.preseason ? w.pre : fillRaw(w.round, { R: ep.round, N: ep.total }), md(T.short)].filter(Boolean).join(' · '));
    const S = ep.series;
    const premise = [S && S.name ? fillRaw(P.premise, { N: md(S.name) }) : '', S && S.goal ? fillRaw(P.goal, { G: S.goalText }) : '', S && S.rules ? fillRaw(P.rules, { R: md(S.rules) }) : ''].filter(Boolean).join(' ');
    const para = (lab, text) => { if (text && text.trim()) out.push('', (lab ? '**' + lab + ':** ' : '') + text.trim()); };
    if (ep.kind === 'pilot') {
      para('', fillRaw(Q.intro, { T: md(T.short), C: md(ep.category || ''), S: ep.season }).replace(/\s+\./, '.') + ' ' + premise);
      const crew = R.cast.map(p => fillRaw(Q.driver, { N: md(p.name), A: p.age != null ? p.age : '?', W: levelIdx(p.level) != null ? w.rate[levelIdx(p.level)] : (p.traits.includes('Rookie') ? Q.rookie : '?') }) + (p.follow ? Q.star : '')).join(', ');
      para(Q.crew, crew);
      if (R.factory && R.factory.strong) para(Q.car, fillRaw(P.strong, { N: aname(R.factory.strong, lang), W: w.rate[rateIdx(R.factory.strong.rank, R.factory.strong.of)] }) + ' ' + fillRaw(P.weak, { N: aname(R.factory.weak, lang), W: w.rate[rateIdx(R.factory.weak.rank, R.factory.weak.of)] }));
      para(Q.exp, [T.expected ? fillRaw(Q.board, { E: T.expected }) : '', R.tip ? fillRaw(Q.analyst, { X: w.words[R.tip.tip] || R.tip.tip }) : '', R.first ? fillRaw(Q.calendar, { R: R.rounds, C: md(R.first.name) }) : ''].filter(Boolean).join(' '));
      const nx = ep.next ? fillRaw(w.nextRace, { C: md(ep.next.name), R: ep.next.round }) : '';
      out.push('', '**' + w.next + ':** ' + [nx, S && S.goal ? Q.q : ''].filter(Boolean).join(' '));
    } else {
      if (premise) para('', premise);
      if (R.past.length) para(P.past, R.past.slice(-5).map(x => fillRaw(P.pastSeason, { S: x.season, P: x.pos ?? '?' }) + (x.wins ? ' (' + (x.wins === 1 ? P.win1 : fillRaw(P.wins, { N: x.wins })) + ')' : '')).join(' · ') + (R.titles ? ' · ' + (R.titles === 1 ? P.title1 : fillRaw(P.titles, { N: R.titles })) : ''));
      if (R.season.races) {
        let t = fillRaw(P.seasonLine, seasonVars(R.season, P));
        if (R.high) t += ' ' + fillRaw(P.high, { X: fillRaw(P.hiRace, { P: 'P' + R.high.pos, C: md(R.high.name), G: R.high.start && R.high.start !== R.high.pos ? fillRaw(P.fromGrid, { S: 'P' + R.high.start }) : '' }) });
        if (R.low) t += ' ' + fillRaw(P.low, { X: R.low.out ? fillRaw(P.loRace, { C: md(R.low.name), S: 'P' + (R.low.start || '?') }) : fillRaw(P.loBad, { P: 'P' + R.low.pos, C: md(R.low.name), S: 'P' + R.low.start }) });
        if (T.pos != null) t += ' ' + fillRaw(P.now, { P: T.pos, X: num(T.points), E: T.expected ? fillRaw(P.target, { E: T.expected }) : '',
          TR: R.trend ? (R.trend.from === R.trend.to ? P.steady : fillRaw(P.trend, { D: R.trend.from > R.trend.to ? P.up : P.down, F: R.trend.from })) : '' });
        para(P.season, t);
      } else if (T.expected) para(P.season, fillRaw(Q.board, { E: T.expected }));
      const cast = R.cast.map(p => { const x = [p.pos && !ep.preseason ? fillRaw(P.drvPos, { P: p.pos }) : null, p.careerWins ? (p.careerWins === 1 ? P.careerW1 : fillRaw(P.careerW, { N: p.careerWins })) : null].filter(Boolean).join(', ');
        return (x ? fillRaw(P.driver, { N: md(p.name), X: x }) : md(p.name)) + (p.follow ? Q.star : ''); }).join(', ');
      const riv = R.ahead && (!R.behind || R.ahead.gap <= R.behind.gap) ? fillRaw(P.rival, { B: md(R.ahead.team), X: num(R.ahead.gap) + ' ' + (R.ahead.gap === 1 ? P.pts1 : P.pts), D: P.ahead })
        : R.behind ? fillRaw(P.rival, { B: md(R.behind.team), X: num(R.behind.gap) + ' ' + (R.behind.gap === 1 ? P.pts1 : P.pts), D: P.behind }) : '';
      para(P.cast, [cast ? cast + '.' : '', riv].filter(Boolean).join(' '));
      if (R.factory) para(P.factory, [R.factory.done ? fillRaw(P.fac, { A: R.factory.ok, B: R.factory.done }) : P.facNone,
        R.factory.strong ? fillRaw(P.strong, { N: aname(R.factory.strong, lang), W: w.rate[rateIdx(R.factory.strong.rank, R.factory.strong.of)] }) : '',
        R.factory.weak && R.factory.weak !== R.factory.strong ? fillRaw(P.weak, { N: aname(R.factory.weak, lang), W: w.rate[rateIdx(R.factory.weak.rank, R.factory.weak.of)] }) : ''].filter(Boolean).join(' '));
      const th = R.threads.map(c => (w.k[c.key] || {}).cliff ? '- ' + fillRaw(w.k[c.key].cliff, vars(c, ep.ctx, lang)) : null).filter(Boolean);
      if (th.length) out.push('', '**' + P.threads + '**', ...th);
      const nx = ep.finished ? w.seasonOver : ep.next ? fillRaw(w.nextRace, { C: md(ep.next.name), R: ep.next.round }) : '';
      if (nx) out.push('', '**' + w.next + ':** ' + nx);
    }
    return TXT.tidy(out.join('\n').replace(/\n{3,}/g, '\n\n').trim()).slice(0, 2000);
  }
  const seasonVars = (x, P) => { const n = (k, a) => k + ' ' + a[k === 1 ? 0 : 1]; return { R: x.races, W: n(x.wins, P.nW), P: n(x.podiums, P.nP), D: n(x.dnf, P.nD) }; };
  const aname = (a, lang) => (lang === 'nl' ? (a.nl || a.label) : a.label).toLowerCase();

  function title(ep, lang, variant) {
    if (ep.kind === 'prologue' || ep.kind === 'pilot') {
      if (ep.kind === 'pilot' && ep.series && ep.series.name) return ep.series.name;
      return ((W[lang] || W.en)[ep.kind === 'prologue' ? 'pro' : 'pil'].title)[0];
    }
    const w = W[lang] || W.en;
    if (!ep.main) return lang === 'nl' ? 'Rustige week' : 'A quiet week';
    if (ep.main.key === 'quiet' && !variant) { const h = TXT.story(ep.ctx ? ep.ctx.snap : {}, lang).headline; if (h) return h; }
    const t = w.k[ep.main.key] && w.k[ep.main.key].title;
    if (!t) return w.k[ep.main.key] && w.k[ep.main.key].line ? fillRaw(w.k[ep.main.key].line, vars(ep.main, ep.ctx, lang)).replace(/\.$/, '') : ep.main.key;
    const r = rng([ep.season, ep.round, ep.main.key, variant || 0, 'title'].join('|'));
    const opts = usable(t, ep.main);
    return fillRaw(opts[Math.floor(r() * opts.length)], vars(ep.main, ep.ctx, lang)).replace(/\\/g, '');
  }

  function write(ep, opts) {
    opts = opts || {};
    const lang = W[opts.lang] ? opts.lang : 'en', w = W[lang];
    if (!ep) return '';
    if (ep.kind === 'prologue' || ep.kind === 'pilot') return writeOpening(ep, Object.assign({}, opts, { lang }));
    const r = rng([ep.season, ep.round, opts.variant || 0, lang, 'episode'].join('|'));
    const pick = a => (Array.isArray(a) ? a[Math.floor(r() * a.length)] : a);
    const num = n => { if (n == null) return '–'; const t = Number.isInteger(n) ? String(n) : (+n).toFixed(1); return lang === 'nl' ? t.replace('.', ',') : t; };
    const T = ep.team, out = [];
    const SL = TXT.story(ep.ctx ? ep.ctx.snap : {}, lang);
    const ttl = opts.title || title(ep, lang, opts.variant);
    out.push('## ' + w.chapter + ' ' + ep.no + ' · ' + md(ttl));
    const sub = [ep.series && ep.series.name ? md(ep.series.name) : null, ep.category ? md(ep.category) + ' ' + ep.season : ep.season, ep.preseason ? w.pre : fillRaw(w.round, { R: ep.round, N: ep.total }), ep.circuit ? md(ep.circuit.name) : null, md(T.short)].filter(Boolean);
    out.push('-# ' + sub.join(' · '));
    // Main story
    if (ep.main) {
      const k = w.k[ep.main.key] || {};
      const mv = vars(ep.main, ep.ctx, lang);
      const leads = ep.main.key === 'start' && ep.main.data.round ? k.lead2 : k.leadRel && mv.REL ? k.leadRel : k.lead;
      let t = fillRaw(pick(usable(leads || [k.line || ''], ep.main)), mv);
      if (ep.main.data && ep.main.data.incident && ep.main.key === 'heartbreak') t += ' ' + md(String(ep.main.data.incident).replace(/\.?$/, '.'));
      if (T.pos != null && !ep.preseason && !['champions', 'season_end', 'lead_taken', 'pass_up', 'pass_down', 'season_start', 'start'].includes(ep.main.key)) {
        const g = T.pos === 1 ? (T.gapBehind != null ? fillRaw(w.gapLead, { A: num(T.gapBehind) }) : '') : T.gapAhead != null && T.ahead ? fillRaw(w.gapAhead, { A: num(T.gapAhead), B: md(T.ahead) }) : '';
        t += ' ' + fillRaw(pick(w.standing), { P: T.pos, X: num(T.points), G: g });
        // What the standing means: the margin to the board's target, or the race-day score against the rival.
        const stake = [SL.target, SL.score].filter(Boolean);
        if (stake.length && ep.no % 2 === 0) t += ' ' + md(stake[(ep.no / 2) % stake.length]);   // every other chapter, alternating
      }
      out.push('', t.trim());
      // The person behind the result: one driver of this story and what they are driving for.
      const crewNames = (ep.main.data && ep.main.data.drivers) || [], people = (ep.ctx.snap.people || []);
      const who = people.filter(p => crewNames.some(n => n === p.name || String(p.name).endsWith(' ' + n) || String(n).endsWith(String(p.name).split(' ').pop()))).map(p => [p, TXT.motive(p, ep.season, lang)]).find(x => x[1]);
      if (who && w.motive && ep.no % 3 === 1) out.push('', fillRaw(pick(w.motive), { D: md(who[0].name), M: who[1] }));
      if (ep.main.callback) out.push('', '*' + fillRaw(w.callback, { N: ep.main.callback.no, T: md(ep.main.callback.title) }) + '*');
    }
    // Side stories
    const lines = ep.side.map(c => { const k = w.k[c.key] || {}; return k.line ? '- ' + fillRaw(k.line, vars(c, ep.ctx, lang)) : null; }).filter(Boolean);
    if (lines.length) out.push('', '**' + w.meanwhile + '**', ...lines);
    // Cliffhanger
    let cl = '';
    if (ep.cliff && (w.k[ep.cliff.key] || {}).cliff) cl = fillRaw(w.k[ep.cliff.key].cliff, vars(ep.cliff, ep.ctx, lang));
    // A chase gets a concrete task for the next race; without any open question the task is the question.
    if (SL.need && !ep.finished && (!cl || (ep.cliff && ep.cliff.key === 'chase'))) cl = md(SL.need);
    const nx = ep.finished ? w.seasonOver : ep.next ? fillRaw(w.nextRace, { C: md(ep.next.name), R: ep.next.round }) : '';
    if (cl || nx) out.push('', '**' + w.next + ':** ' + [nx, cl].filter(Boolean).join(' '));
    let text = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    // Keep under Discord's 2000 characters: drop side stories from the end first.
    while (text.length > 2000 && lines.length) { lines.pop(); return write(Object.assign({}, ep, { side: ep.side.slice(0, lines.length) }), opts); }
    return TXT.tidy(text).slice(0, 2000);
  }

  // Facts for the AI version (only what the journal and the save say).
  function facts(ep, lang) {
    lang = W[lang] ? lang : 'en';
    const one = c => c ? { angle: c.key, importance: c.score, facts: clean(c.data), sideLine: (W[lang].k[c.key] || {}).line ? fillRaw(W[lang].k[c.key].line, vars(c, ep.ctx, lang)).replace(/\\/g, '') : undefined,
      callbackToChapter: c.callback ? { number: c.callback.no, title: c.callback.title } : undefined } : null;
    const chapters = ep.ctx.journal.chapters.slice(-3).map(c => ({ number: c.no, title: c.title, season: c.season, round: c.round, mainStory: c.main }));
    return {
      game: 'Delta Manager (motorsport management game)', chapterKind: ep.kind, chapterNumber: ep.no,
      playthrough: ep.series ? { name: ep.series.name || undefined, goal: ep.series.goalText || undefined, followDrivers: ep.series.focus.length ? ep.series.focus : undefined, houseRules: ep.series.rules || undefined, goalStatus: ep.series.goalLine || undefined } : undefined,
      storySoFar: ep.recap ? clean({ earlierSeasons: ep.recap.past, titles: ep.recap.titles, thisSeason: ep.recap.season, highPoint: ep.recap.high, lowPoint: ep.recap.low, standingTrend: ep.recap.trend,
        rivalAhead: ep.recap.ahead, rivalBehind: ep.recap.behind, factory: ep.recap.factory, testingTip: ep.recap.tip ? ep.recap.tip.tip : undefined }) : undefined, suggestedTitle: title(ep, lang), category: ep.category, season: ep.season, round: ep.round, totalRounds: ep.total,
      team: { name: ep.team.short, championshipPosition: ep.team.pos, points: ep.team.points, gapToTeamAhead: ep.team.gapAhead, teamAhead: ep.team.ahead, gapToTeamBehind: ep.team.gapBehind, teamBehind: ep.team.behind,
        seasonWins: ep.team.wins, seasonPodiums: ep.team.podiums, boardTarget: ep.team.expected },
      lastRace: ep.circuit ? ep.circuit.name : null, mainStory: one(ep.main), sideStories: ep.side.map(one), openThread: one(ep.cliff),
      previousChapters: chapters, nextRace: ep.next ? { circuit: ep.next.name, round: ep.next.round } : null, seasonFinished: ep.finished,
      drivers: ep.ctx.snap.people.filter(p => p.role === 'driver').map(p => ({ name: p.name, standing: p.pos, traits: p.traits.length ? p.traits : undefined, rivals: p.rivals.length ? p.rivals : undefined }))
    };
  }
  const clean = o => JSON.parse(JSON.stringify(o || {}, (k, v) => (k === 'cars' || k === 'id' || k === 'n' ? undefined : v)));

  const TOPIC = 'Write it as the next chapter of an ongoing playthrough story. Start with the heading "## ' + '{CH} {N} · <title>" (use or improve the suggested title), then one short paragraph about the main story, then a bold "{MW}" label with one line per side story, and end with a bold "{NX}:" line with the next race and the open question from openThread. If mainStory has callbackToChapter, refer back to that chapter in one short sentence. Keep the main story central; do not give every fact the same weight.';
  function aiPrompt(ep, opts) {
    opts = opts || {};
    const lang = W[opts.lang] ? opts.lang : 'en', w = W[lang];
    const tones = {
      team: 'Write as the team\'s own official account, in the first person plural ("we", "us"). Proud and energetic, never cringe.',
      hype: 'Write as an excited fan account that follows this team. Punchy, high energy, a few emojis.',
      press: 'Write as a motorsport journalist writing a column about this team. Factual and crisp, no exclamation marks, at most one emoji.',
      diary: 'Write as the player, in the first person ("I" as the team manager, "we" for the team), like a let\'s-play / playthrough chapter for other players. Lively, personal and honest about setbacks and choices.'
    };
    const system = [
      'You write one chapter of a player\'s ongoing playthrough story of the game Delta Manager, to be posted on Discord next to an image card.',
      'Output only the chapter, in ' + (lang === 'nl' ? 'Dutch' : 'English') + ', using Discord markdown (## heading, **bold**, *italic*, "- " lines). No code blocks, no tables, no @mentions, no links.',
      'Use only the facts in the JSON. Never invent results, quotes, names, numbers or events. If a fact is missing, leave it out.',
      'Keep it under ' + (opts.length === 'long' ? 1900 : 1200) + ' characters.',
      tones[opts.tone] || tones.diary,
      ep.kind === 'prologue' ? 'This is the prologue of a playthrough that starts in a career already under way: "## ' + w.pro.tag + ' · <title>". Tell the story so far from storySoFar (earlier seasons, this season with its high and low point, the cast, the factory) and end with the open storylines and a bold "' + w.next + ':" line. If there is a playthrough goal, state it as the premise.'
        : ep.kind === 'pilot' ? 'This is the pilot, the first chapter of a new playthrough: "## ' + w.chapter + ' ' + ep.no + ' · <title>". Introduce the premise (playthrough name, goal, house rules), the team, the drivers (especially the ones to follow), the car and the expectations, and end with a bold "' + w.next + ':" line about the first race and the goal.'
        : fillRaw(TOPIC, { CH: w.chapter, N: ep.no, MW: w.meanwhile, NX: w.next })
    ].join('\n');
    const user = 'Facts (JSON):\n' + JSON.stringify(facts(ep, lang), null, 1) + (opts.extra ? '\n\nExtra wish from the player: ' + String(opts.extra).slice(0, 300) : '');
    return { system, user };
  }

  // Pieces of the chapter for the cards (plain text, no markdown escapes).
  function parts(ep, opts) {
    opts = opts || {};
    const lang = W[opts.lang] ? opts.lang : 'en', w = W[lang];
    const plain = t => String(t || '').replace(/\\([\\*_~`|>])/g, '$1').replace(/@\u200b/g, '@');
    const line = c => { const k = w.k[c.key] || {}; return k.line ? plain(fillRaw(k.line, vars(c, ep.ctx, lang))) : ''; };
    const lead = ep.main ? plain(fillRaw(usable((ep.main.key === 'start' && ep.main.data.round ? w.k.start.lead2 : (w.k[ep.main.key] || {}).lead) || [line(ep.main)], ep.main)[0], vars(ep.main, ep.ctx, lang))) : '';
    const openLead = ep.kind === 'pilot' ? plain([fillRaw(w.pil.intro, { T: ep.team.short, C: ep.category || '', S: ep.season }), ep.series && ep.series.goal ? fillRaw(w.pro.goal, { G: ep.series.goalText }) : '', ep.team.expected ? fillRaw(w.pil.board, { E: ep.team.expected }) : ''].join(' '))
      : ep.kind === 'prologue' && ep.recap ? plain([ep.recap.season.races ? fillRaw(w.pro.seasonLine, seasonVars(ep.recap.season, w.pro)) : '', ep.team.pos ? fillRaw(w.pro.now, { P: ep.team.pos, X: ep.team.points, E: ep.team.expected ? fillRaw(w.pro.target, { E: ep.team.expected }) : '',
        TR: ep.recap.trend ? (ep.recap.trend.from === ep.recap.trend.to ? w.pro.steady : fillRaw(w.pro.trend, { D: ep.recap.trend.from > ep.recap.trend.to ? w.pro.up : w.pro.down, F: ep.recap.trend.from })) : '' }) : '',
        ep.recap.ahead ? fillRaw(w.pro.rival, { B: ep.recap.ahead.team, X: ep.recap.ahead.gap + ' ' + (ep.recap.ahead.gap === 1 ? w.pro.pts1 : w.pro.pts), D: w.pro.ahead }) : ''].join(' ')) : null;
    return { lang, chapter: w.chapter, no: ep.no, title: opts.title || plain(title(ep, lang, opts.variant)), lead: openLead || lead,
      round: ep.preseason ? w.pre : fillRaw(w.round, { R: ep.round, N: ep.total }), meanwhile: w.meanwhile, seasonLabel: w.pro.season, threadsLabel: w.pro.threads, nextLabel: w.next, previously: w.previously,
      side: (ep.kind === 'prologue' && ep.recap ? openingSide(ep, lang, plain) : ep.side.map(c => ({ key: c.key, text: line(c), tone: TONE[c.key] || 'neutral' }))).filter(x => x.text),
      threads: ep.threads.map(c => ({ key: c.key, text: plain(fillRaw((w.k[c.key] || {}).cliff || (w.k[c.key] || {}).line || '', vars(c, ep.ctx, lang))), data: c.data, tone: TONE[c.key] || 'neutral' })),
      cliff: ep.cliff && (w.k[ep.cliff.key] || {}).cliff ? plain(fillRaw(w.k[ep.cliff.key].cliff, vars(ep.cliff, ep.ctx, lang))) : '',
      next: ep.finished ? w.seasonOver : ep.next ? plain(fillRaw(w.nextRace, { C: ep.next.name, R: ep.next.round })) : '',
      tone: ep.main ? TONE[ep.main.key] || 'neutral' : 'neutral' };
  }
  function openingSide(ep, lang, plain) {
    const P = W[lang].pro, R = ep.recap, out = [];
    if (R.high) out.push({ key: 'high', tone: R.high.pos === 1 ? 'gold' : 'good', text: plain(fillRaw(P.high, { X: fillRaw(P.hiRace, { P: 'P' + R.high.pos, C: R.high.name, G: '' }) })) });
    if (R.low) out.push({ key: 'low', tone: 'bad', text: plain(fillRaw(P.low, { X: R.low.out ? fillRaw(P.loRace, { C: R.low.name, S: 'P' + (R.low.start || '?') }) : fillRaw(P.loBad, { P: 'P' + R.low.pos, C: R.low.name, S: 'P' + R.low.start }) })) });
    if (R.past.length) { const x = R.past[R.past.length - 1]; out.push({ key: 'past', tone: 'neutral', text: P.past + ': ' + R.past.slice(-3).map(y => y.season + ' P' + (y.pos ?? '?')).join(' · ') }); }
    return out;
  }
  // Colour of a story on the cards: gold = titles and firsts, green = good news, red = setbacks.
  const TONE = {
    goal_done: 'gold', goal_failed: 'bad', goal: 'gold',
    champions: 'gold', clinch: 'gold', career_first: 'gold', milestone: 'gold', win: 'gold',
    podium: 'good', comeback: 'good', lead_taken: 'good', pass_up: 'good', target_up: 'good', upgrade_hit: 'good', factory_best: 'good', streak_hot: 'good',
    signing: 'good', extension: 'good', morale_up: 'good', analyst_wrong: 'good', defend_lead: 'good', pole: 'good',
    heartbreak: 'bad', bad_day: 'bad', lead_lost: 'bad', eliminated: 'bad', pass_down: 'bad', target_down: 'bad', upgrade_miss: 'bad', streak_cold: 'bad',
    injury: 'bad', techcheck: 'bad', departure: 'bad', morale_down: 'bad', pressure: 'bad', protest: 'warn', investigation: 'warn', rivalry: 'warn', contract: 'warn'
  };

  // Chapter as stored in the journal.
  function toChapter(ep, text, lang, variant) {
    return { kind: ep.kind, title: title(ep, lang, variant), main: ep.kind === 'chapter' && ep.main ? ep.main.key : ep.kind, mainArc: ep.main ? ep.main.arc : null, side: ep.side.map(c => c.key), cliff: ep.cliff ? ep.cliff.key : null, arcs: ep.arcs, text, lang,
      pos: ep.team.pos, points: ep.team.points, circuit: ep.circuit ? ep.circuit.name : null };
  }

  return { build, write, title, facts, aiPrompt, toChapter, parts, goalText, TONE, W };
});
