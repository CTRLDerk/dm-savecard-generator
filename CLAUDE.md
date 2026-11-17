# dm-savecard-generator

**Alleen uitvoer.** Deze publieke repo (GitHub Pages) wordt gevuld door `site.yml` in `CTRLDerk/dm-savecard`. **Hier niets met de hand wijzigen**: elke wijziging gaat via dm-savecard en wordt bij de volgende publicatie overschreven.

## Controles

Geen: alle controles draaien in dm-savecard.

## Werkwijze (geldt voor alle Delta Manager-repo's)

Doel: kwaliteit bewaken, en **niets wordt gepubliceerd zonder dat de eigenaar zelf ingrijpt**.

1. **Altijd op een eigen branch.** Nooit committen of pushen op `main`. Eén onderwerp per branch.
2. **Eerst controleren, dan committen.** Draai de controles hieronder. Rood = niet committen, eerst oplossen. Meld eerlijk wat er faalde.
3. **Changelog bijwerken** waar de repo er een heeft (zie hieronder), in dezelfde commit als de wijziging.
4. **Pushen naar de eigen branch mag.** Een pull request alleen als de eigenaar erom vraagt.
5. **Nooit zelf:** een PR mergen of auto-merge aanzetten, een tag maken of pushen, een GitHub Release maken, een workflow handmatig starten, force-pushen, of via de GitHub-API bestanden direct op een branch zetten. Dit is ook technisch geblokkeerd (`.claude/settings.json` en `.claude/hooks/guard.js`). Pas die bestanden niet aan zonder dat de eigenaar erom vraagt.
6. **Publiceren doet de eigenaar:** PR mergen → tag/release maken → in GitHub Actions de job in environment `publish` goedkeuren.
7. Geen privébestanden in Git: mod-slots van spelers, saves, webhook-URL's, e-mailadressen, tokens.

### CI

Elke push en PR draait de workflow `check`. Die publiceert niets. Een PR mag pas gemerged worden als `check` groen is.
