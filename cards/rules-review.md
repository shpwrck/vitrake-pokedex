# Vitrake ex — independent TCG rules review

Reviewed 10 September 2026 against `card-data.json`. **Pass: no mechanical correction required.** This is a review of a fan card for the physical Pokémon TCG, not Pokémon TCG Pocket, official legality, or deck playtesting.

## Card identity and rules

**Basic Dragon Pokémon ex, 220 HP, two Prizes:** coherent with the single-stage species. The lowercase **ex** naming and two-Prize rule use the modern card family. [Raging Bolt ex](https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/series/sv8pt5/166) provides an official Dragon Basic ex comparator at 240 HP, with no Weakness or Resistance. The [official Asia listing](https://asia.pokemon-card.com/sg/card-search/detail/14173/) independently identifies its Basic stage.

**No Weakness or Resistance:** suitable for a modern Dragon card. It should not receive the video game's five weaknesses. Blank Weakness and Resistance entries also appear on [Dragonite from Scarlet & Violet—151](https://asia.pokemon-card.com/hk-en/card-search/detail/10198/). This is a supported design convention, not a universal law applying to every historical Dragon card.

**Fire + Water + Colorless:** a valid attack requirement for a Dragon Pokémon. Dragon type does not require a Basic Dragon Energy card. A Colorless requirement accepts any Energy type; the two colored requirements must also be fulfilled. Neither attack instructs the player to discard Vitrake's attached Energy, so that Energy ordinarily stays attached. Retreat 2 uses two Colorless symbols. These follow the [physical TCG rulebook](https://assets.pokemon.com/assets/cms2/pdf/trading-card-game/rulebook/par_rulebook_en.pdf), especially printed pages 6, 12–14 and 23.

The Fire and Water costs do not change attack type. Both attacks come from this **Dragon-type Pokémon**; the video-game Poison type of Acid Spray and the video-game Mega Launcher ability do not transfer to this card. The `ability: null` choice keeps that separation clear.

## Attacks

| Attack | Proposed mechanics | Review |
|---|---|---|
| Acid Spray | One Colorless; 30 damage; coin flip can discard an Energy from the opposing Active Pokémon. | Effect wording matches the modern [Flapple Trainer Gallery card](https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/series/swsh10tg/TG02). [Accelgor in the official Noble Victories Card-Dex, printed page 5](https://assets.pokemon.com/assets/cms/pdf/tcg/carddex/bw_noble_victories.pdf) establishes the same one-Colorless concept at 20 damage. Raising that to 30 on a two-Prize Basic ex is a plausible fan adjustment. |
| Dragon Pulse | Fire, Water, Colorless; 180 damage; discard the top two cards of the user's deck. | The 180-damage/two-card discard pairing and exact effect wording appear on [Dragonite](https://asia.pokemon-card.com/hk-en/card-search/detail/10198/). The extra Energy requirement, two-Prize liability, and lack of an Ability keep this from being an obvious numerical outlier. |

The Acid Spray coin determines only Energy removal; damage is not conditional on heads. Dragon Pulse's deck discard is its printed attack effect, not an invented requirement to detach Energy before attacking. The exact proposed text is already conventional; avoid adding explanatory clauses to the small card text.

## Balance judgment

The card has a clear choice: inexpensive disruption or a heavier attack that needs two Energy types. A fixed 180 damage does not knock out a fresh 220-HP peer without another modifier or prior damage. Self-discard can help some decks rather than being purely a drawback, so it should not be described as a strong balancing cost on its own. The 220 HP, two-Prize risk, mixed Energy requirements and absence of an Ability are the more meaningful limits.

This supports **reasonable starting values for a gift card**. It does not demonstrate a particular tournament power level. There is no need to add weakness, invent Dragon Energy, lower Acid Spray, or add an Energy-discard penalty solely to make the rules coherent.

## Presentation and source notes

- Keep **FAN GIFT EDITION** legible on the printed face. `fanMade: true`, the custom JWS set identifier, no regulation mark, and the explicit non-tournament note already separate it from an official release.
- Foiling and full art can stay decorative. It is an ordinary Pokémon ex, so do not add a Mega label or Mega rules.
- Optional layout refinement: use `flavorText` as companion/app copy if space is tight. A modern ex layout needs a readable ex rule box; its tagline should not crowd that box or mimic a regular card's Pokédex-flavor footer.
- The JSON accurately says attack assignment and numeric tuning are fan design, while identifying the official precedents. The rulebook is a 2023 Scarlet/Violet-era publication; its reviewed ordinary ex, attack and Energy rules are the relevant parts. The review does not rely on its older Mega-EX appendix for current Mega cards.

No edit to `card-data.json` was made. `validation.json` records the reviewed file's hash so later mechanical changes can be recognized.
