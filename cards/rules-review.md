# Vitrake ex — current physical TCG audit

Reviewed **11 September 2026** on `fix/card-tcg-audit`. **Pass for rules coherence and conventional wording; no gameplay values need changing.** The old rendered-symbol issue has been corrected separately. This is an original fan card: authentic rules and symbols do not make its species, combined statistics, or release metadata official. It is not tournament legal.

## Current rules checked

The live [official Rules & Resources page](https://www.pokemon.com/us/play-pokemon/about/tournaments-rules-and-resources) links the [Pitch Black rulebook](https://www.pokemon.com/static-assets/content-assets/cms2/pdf/trading-card-game/rulebook/pbl_rulebook_en.pdf), whose cover says **last updated July 2026**, and the [TCG Tournament Handbook](https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-tcg-tournament-handbook-en.pdf), whose cover says **September 1, 2026**. Both documents were opened and visually read in the browser. The former 2023 rulebook citation has been replaced.

Relevant rulebook pages: **4** (Dragon type commonly uses multiple Energy types), **12** (retreat), **13–14** (attack costs, resolution, and the attacking Pokémon's type), and **26** (ordinary Pokémon ex and two Prizes). Those rules support the card's costs and ex structure. The separately checked [Pitch Black announcement](https://www.pokemon.com/us/play-pokemon/about/mega-evolution/mega-evolution-pitch-black-rule-changes-announcement), effective July 31, reports no ban-list changes; it does not require alterations to these attacks.

## Field-by-field findings

| Field | Finding |
|---|---|
| **Vitrake ex; Basic** | Original name with the conventional lowercase **ex** suffix. Basic appropriately represents the single-stage species; no evolution prerequisite is missing. |
| **Dragon; 220 HP** | Plausible fan assignments. [Raging Bolt ex](https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/series/sv8pt5/166) is an official 240-HP Dragon Basic ex. Its [official Asia listing](https://asia.pokemon-card.com/ph/card-search/detail/12338/) confirms Basic status. This comparator supports a range, not an official Vitrake statistic. |
| **No Weakness / Resistance** | Consistent with modern Dragon examples, including Raging Bolt ex and [Dragonite 151](https://asia.pokemon-card.com/hk-en/card-search/detail/10198/). A blank or dash means none. Do not import the game's Bug/Dragon weaknesses. This is a design convention, not a rule for every historical Dragon card. |
| **Retreat: two Colorless** | Standard notation for a retreat cost of 2 Energy. The exact value 2 is custom tuning. |
| **No Ability** | Valid. No ability is compulsory, and game abilities such as Mega Launcher do not transfer automatically. |
| **Two-Prize ex rule** | The existing wording matches the ordinary modern ex rule. Keep the readable rule box; this is not a Mega Evolution ex and must not receive a three-Prize rule. |
| **63 × 88 mm; full art / foil appearance** | Conventional trading-card print proportions and a decorative fan treatment. Neither foil appearance nor full art changes gameplay. |
| **JWS; 001/001; FAN GIFT EDITION; For Jeremy** | Custom gift metadata, clearly separate from official set codes and collector identities. No invented regulation mark, official rarity classification, or official illustrator attribution is needed. |
| **Companion flavorText** | Editorial copy only. It is not an effect and is absent from the rendered ex face. |

## Attack wording and precedents

**Acid Spray — one Colorless, 30 damage.** The effect is exactly the current-style wording used by [Flapple TG02](https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/series/swsh10tg/TG02), apart from a typographic apostrophe. [Accelgor, Noble Victories Card-Dex, p.5](https://assets.pokemon.com/assets/cms/pdf/tcg/carddex/bw_noble_victories.pdf) supplies a historical one-Colorless precedent at **20** damage. Vitrake's **30** is a deliberate fan adjustment, not a copied official damage/cost combination. The coin flip determines Energy removal; the printed 30 damage does not depend on heads. “An Energy” must remain broad; narrowing it to Basic Energy would change the effect.

**Dragon Pulse — Fire, Water, Colorless; 180 damage.** [Dragonite 151](https://asia.pokemon-card.com/hk-en/card-search/detail/10198/) has the same **180 damage plus discarding the top 2 cards of the user's deck**, with exactly the same effect sentence. Dragonite's attack uses two Energy; Vitrake's mixed three-Energy cost is custom. The name and effect are real TCG material. The whole Vitrake attack is not an exact reprint.

The card's Energy costs do not assign separate types to its attacks. Both use this Pokémon's **Dragon** type when applying Weakness and Resistance. Thus Acid Spray does not become a Poison-type TCG attack, and Fire Energy does not make Dragon Pulse a Fire-type attack. The game's restricted Bug/Normal/Dragon learnset remains a separate system. There is no Basic Dragon Energy requirement to add. Attacking does not normally consume the attached Energy; Dragon Pulse discards from the **deck**, not from the attacker.

The proposed values are a reasonable gift-card starting point: a cheap disruption option, 180 fixed damage, two Energy colors, two-Prize liability, and no Ability. Deck self-discard can help some strategies, so it is not a strong guaranteed drawback. No competitive balance, metagame strength, or playtesting result is claimed. The evidence gives no reason to redesign the costs, lower the HP, add weaknesses, or invent another effect.

Historical Flapple, Accelgor, and Dragonite examples establish mechanics; they are not all current Standard-legal cards. The September handbook's §2/p.4 requires genuine cards, with limited judge/organizer-issued proxy exceptions. Its §4.1.1/p.9 lists the current H/I/J context. A fictional species cannot become legal by printing one of those marks. Retain `regulationMark: null` and the fan designation.

## Rendered symbols and prior validation error

The old `valid_energy_symbols` pass checked **cost type names in JSON**, not the geometry actually drawn. `tools/build-print.py` previously hand-drew Dragon, Fire, Water, and Colorless icons. That was a real visual defect and an overstated validation label.

The renderer now places the unchanged official PNGs documented in [the official Druddigon page](https://asia.pokemon-card.com/sg/card-search/detail/2096/): [Dragon](https://asia.pokemon-card.com/various_images/energy/Dragon.png), [Fire](https://asia.pokemon-card.com/various_images/energy/Fire.png), [Water](https://asia.pokemon-card.com/various_images/energy/Water.png), and [Colorless](https://asia.pokemon-card.com/various_images/energy/Colorless.png). `assets/tcg-symbols/sources.json` records URLs and SHA-256 values. This audit independently checked those local hashes, the renderer's asset placement, and the rebuilt card face: correct Dragon header, one Colorless for Acid Spray, Fire/Water/Colorless for Dragon Pulse, and two Colorless for retreat. Typography is legible and no effect or rule text is missing.

`cards/validation.json` now separates data checks, asset provenance, and visual inspection. No gameplay fields were changed by this audit; only source and design-note metadata were revised. Release checks separately verify the downloadable PDFs and archive contents.
