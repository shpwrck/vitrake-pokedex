# Vitrake — the Blast Horn Pokémon

[Open the public Pokédex](https://shpwrck.github.io/vitrake-pokedex/)

An original Bug/Dragon Pokémon gift for Jeremy, inspired by the bombardier beetle.
Two transparent horns feed a chemical blast through its dragon-faced shell.

The gift includes a Pokédex webapp, artwork, an original cry, a 520-point stat profile,
31 existing moves, regular and shiny sprites, editable Aseprite animations, a full-art
Vitrake ex card, and printable Pokédex guides, card sheets and artwork.

## Downloads and printing

Open the Gift kit tab in the app, or use the files in downloads.
Print card sheets at **100% / actual size**. Check the 50 mm calibration bar before cutting.
Ordinary paper does not reproduce the screen's animated foil effect.

## Run locally

From this folder, run:

    python3 -m http.server 4173 --bind 127.0.0.1

Then open http://127.0.0.1:4173/web/. The webapp needs HTTP to load its JSON records.
The complete ZIP contains the app and gift assets; ZIP download links appear only
on the hosted site. The individual PDFs and editable sprite projects are included.

## Sprite editing

Open the .aseprite files in sprites with Aseprite. See sprites/README.md.
Sprites use 64 × 64 square pixels and 16-entry palettes; enlarged copies use nearest-neighbor scaling.

## Game systems

Video-game mechanics follow Scarlet/Violet-era rules; Gen III describes the sprite style.
The species, move assignments and card are original fan designs. The card follows the physical
TCG with ordinary ex rules: two Prize cards, mixed Energy costs, and no Dragon Basic Energy.
Balance has been checked against existing examples but has not been established by playtesting.
Source links are included in the webapp and JSON records.

## Website maintenance

    npm --prefix web run lint
    npm --prefix web run build
    python3 tools/verify-release.py

GitHub Actions validates changes and publishes web/dist to GitHub Pages.
The public repository contains only the distributable app, gift files and deployment checks.

## Credits

Vitrake is a personal fan gift, not an official Pokémon or tournament-legal card.
Pokémon terminology and the standard card-back artwork belong to their respective owners.
This project is not affiliated with Nintendo, Game Freak, Creatures or The Pokémon Company.
Illustrations were generated for this project. Sprites were built and animated with Aseprite.
The original cry uses synthesis without sampled Pokémon audio.
