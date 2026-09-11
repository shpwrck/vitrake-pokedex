#!/usr/bin/env python3
"""Verify the portable Vitrake release using only the Python standard library.

Run from any directory: python3 /absolute/path/to/kit/tools/verify-release.py
No files are extracted from archives and no network requests are made.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import struct
import sys
import wave
import zipfile


DOWNLOADS = (
    "Vitrake-Pokedex-A4.pdf",
    "Vitrake-Pokedex-Letter.pdf",
    "Vitrake-Card-Print-A4.pdf",
    "Vitrake-Card-Print-Letter.pdf",
    "Vitrake-Art-Print-A4.pdf",
    "Vitrake-Art-Print-Letter.pdf",
    "Vitrake-Sprites.zip",
    "Vitrake-Gift-Kit.zip",
)
SPRITES = (
    "regular-front", "regular-back", "shiny-front", "shiny-back",
    "regular-front-attack", "shiny-front-attack",
)
ASSETS = (
    "assets/portrait.png", "assets/rear-reference.png", "assets/habitat-artwork.png",
    "assets/card-artwork.png", "assets/card-front.png", "assets/pokemon-card-back.jpg",
    "assets/tcg-symbols/dragon.png", "assets/tcg-symbols/fire.png",
    "assets/tcg-symbols/water.png", "assets/tcg-symbols/colorless.png",
    "assets/cry.wav", "assets/cry.mp3", "assets/cry.vtt",
)
STAT_KEYS = ("hp", "attack", "defense", "specialAttack", "specialDefense", "speed")
TYPE_NAMES = {
    "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison",
    "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
}


class ReleaseError(Exception):
    """A release requirement was not met."""


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ReleaseError(message)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def nonempty(path: Path) -> None:
    require(path.is_file(), f"Missing file: {path}")
    require(path.stat().st_size > 0, f"Empty file: {path}")


def digest(handle) -> str:
    result = hashlib.sha256()
    for chunk in iter(lambda: handle.read(1024 * 1024), b""):
        result.update(chunk)
    return result.hexdigest()


def png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as handle:
        header = handle.read(33)
    require(len(header) == 33 and header[:8] == b"\x89PNG\r\n\x1a\n", f"Invalid PNG: {path.name}")
    require(header[12:16] == b"IHDR", f"Missing PNG IHDR: {path.name}")
    return struct.unpack(">II", header[16:24])


def validate_assets(root: Path) -> dict:
    for relative in ASSETS:
        target = root / relative
        nonempty(target)
        if target.suffix == ".png":
            width, height = png_size(target)
            require(width >= 512 and height >= 512, f"Artwork unexpectedly small: {relative}")
    for relative in ("web/index.html", "web/app.js", "web/styles.css", "web/controls.css", "README.md", "index.html", ".nojekyll"):
        target = root / relative
        require(target.is_file(), f"Missing portable-site file: {relative}")
        if relative != ".nojekyll":
            nonempty(target)
    with wave.open(str(root / "assets/cry.wav"), "rb") as audio:
        duration = audio.getnframes() / audio.getframerate()
        require(audio.getcomptype() == "NONE", "Cry WAV must contain PCM audio")
        require(audio.getnchannels() in (1, 2), "Cry must have one or two channels")
        require(audio.getsampwidth() in (1, 2, 3, 4), "Invalid WAV sample width")
        require(8000 <= audio.getframerate() <= 192000, "Invalid WAV sample rate")
        require(0.25 <= duration <= 10, f"Cry duration is invalid: {duration:.3f}s")
        pcm = audio.readframes(audio.getnframes())
        require(any(pcm), "Cry WAV contains only zero samples")
    return {"requiredAssets": len(ASSETS), "cryDurationSeconds": round(duration, 4)}


def validate_downloads(root: Path) -> dict:
    for name in DOWNLOADS:
        target = root / "downloads" / name
        nonempty(target)
        if name.endswith(".pdf"):
            with target.open("rb") as handle:
                require(handle.read(5) == b"%PDF-", f"Invalid PDF signature: {name}")
                handle.seek(max(0, target.stat().st_size - 1024))
                require(b"%%EOF" in handle.read(), f"Missing PDF end marker: {name}")
    return {"downloads": len(DOWNLOADS), "pdfs": 6, "zipFiles": 2}


def validate_species(root: Path) -> dict:
    species = load_json(root / "game/species.json")
    require(species["name"] == "Vitrake", "Wrong species name")
    require(species["types"] == ["Bug", "Dragon"], "Wrong species types")
    require(species["singleStage"] is True, "Vitrake must remain single stage")
    require(set(species["stats"]) == set(STAT_KEYS), "Base stats must contain exactly six fields")
    values = [species["stats"][key] for key in STAT_KEYS]
    require(all(isinstance(value, int) and 1 <= value <= 255 for value in values), "Base stat outside normal game field range")
    require(sum(values) == species["baseStatTotal"] == 520, "Base stat total must be 520")
    moves = species["moves"]
    require(bool(moves), "Learnset must not be empty")
    require(all(move["type"] in {"Bug", "Normal", "Dragon"} for move in moves), "Learnset must use only Bug, Normal and Dragon moves")
    names = {move["name"] for move in moves}
    assignments = {(move["name"], move["method"], move.get("level")) for move in moves}
    require(len(assignments) == len(moves), "Duplicate move acquisition row")
    battle_moves = species["battleSet"]["moves"]
    require(len(battle_moves) == len(set(battle_moves)) == 4 and set(battle_moves) <= names, "Suggested battle set must use four distinct learned moves")
    require(set(species["typeMatchups"]) == TYPE_NAMES, "All eighteen ordinary type matchups are required")
    require(species["typeMatchups"]["Grass"] == 0.25 and species["typeMatchups"]["Fire"] == 1, "Bug/Dragon type cancellation is incorrect")
    require(all(move["method"] in ("Level up", "TM") for move in moves), "Unknown learnset method")
    require(all(move["category"] in ("Physical", "Special", "Status") for move in moves), "Unknown move category")
    return {"baseStatTotal": sum(values), "uniqueMoves": len(names), "learnsetRows": len(moves), "learnsetTypes": sorted({move["type"] for move in moves}), "typeMatchups": 18}


def validate_card(root: Path) -> dict:
    card = load_json(root / "cards/card-data.json")
    require(card["name"] == "Vitrake ex" and card["stage"] == "Basic", "Card must be Basic Vitrake ex")
    require(card["type"] == "Dragon" and card["hp"] == 220, "Card type/HP changed")
    require(card["prizes"] == 2 and card["rule"] == "When your Pokémon ex is Knocked Out, your opponent takes 2 Prize cards.", "Pokémon ex two-Prize rule missing")
    require(card["weakness"] is None and card["resistance"] is None, "Modern Dragon card must use designed blank Weakness/Resistance")
    require(card["retreatCost"] == 2, "Retreat cost must be two Colorless")
    require(card["ability"] is None and card["fanMade"] is True, "Card identity/ability changed")
    require(card["regulationMark"] is None, "Fan card must not claim an official regulation mark")
    attacks = card["attacks"]
    require(len(attacks) == 2, "Card must have exactly two attacks")
    require(attacks[0]["name"] == "Acid Spray" and attacks[0]["damage"] == 30 and attacks[0]["cost"] == ["Colorless"], "Acid Spray cost/damage invariant failed")
    require(attacks[1]["name"] == "Dragon Pulse" and attacks[1]["damage"] == 180 and attacks[1]["cost"] == ["Fire", "Water", "Colorless"], "Dragon Pulse cost/damage invariant failed")
    require(attacks[0]["text"] == "Flip a coin. If heads, discard an Energy from your opponent's Active Pokémon.", "Acid Spray effect wording changed")
    require(attacks[1]["text"] == "Discard the top 2 cards of your deck.", "Dragon Pulse self-mill effect changed")
    require(not any("Dragon" in attack["cost"] for attack in attacks), "Basic Dragon Energy is not an attack cost")
    symbol_dir = root / "assets/tcg-symbols"
    symbols = load_json(symbol_dir / "sources.json")["symbols"]
    names = {"dragon", "fire", "water", "colorless"}
    require(len(symbols) == len(names) and {item["name"] for item in symbols} == names, "Four official TCG symbols required")
    for item in symbols:
        name = item["name"]
        require(item["file"] == f"{name}.png", "Unexpected symbol filename")
        require(item["sourceUrl"] == f"https://asia.pokemon-card.com/various_images/energy/{name.title()}.png", "Symbol must have its official source URL")
        path = symbol_dir / item["file"]
        require(png_size(path) == (item["width"], item["height"]), f"Symbol dimensions changed: {name}")
        with path.open("rb") as handle:
            require(digest(handle) == item["sha256"], f"Official symbol file changed: {name}")
    return {"type": "Dragon", "hp": 220, "prizes": 2, "attacks": 2, "retreatCost": 2, "officialSymbolFilesVerified": len(symbols), "tournamentLegal": False}


def validate_sprites(root: Path) -> dict:
    folder = root / "sprites"
    manifest = load_json(folder / "manifest.json")
    require((manifest["frameWidth"], manifest["frameHeight"]) == (64, 64), "Frames must be true 64×64")
    require((manifest["columns"], manifest["rows"], manifest["frameCount"]) == (8, 5, 40), "Sheet layout must be 8×5 / 40 frames")
    require(manifest["frameDurationMs"] == 50 and manifest["cycleDurationMs"] == 2000, "Animation must contain forty 50ms frames")
    require(manifest["pixelRatio"] == [1, 1] and manifest["paletteEntries"] == 16, "Sprite pixel/palette contract changed")
    require(set(manifest["assets"]) == set(SPRITES), "Six animation asset records required")
    require(set(manifest["sheets"]) == set(SPRITES[:4]), "Four idle sheet mappings required")
    require(manifest["animations"]["idle"]["loop"] is True and manifest["animations"]["attack"]["loop"] is False, "Idle/attack looping contract changed")
    require(set(manifest["animations"]["attack"]["sheets"]) == {"regular-front", "shiny-front"}, "Attack must map both front palettes")
    for key in SPRITES:
        asset = manifest["assets"][key]
        require(asset["nativeDimensions"] == [64, 64] and asset["sheetDimensions"] == [512, 320], f"Bad dimensions in {key}")
        require(asset["frames"] == 40 and asset["durationMs"] == 2000, f"Bad frame/timing metadata in {key}")
        for kind in ("png", "aseprite", "gif", "sheet", "sheetData", "enlargedPng", "enlargedGif"):
            relative = PurePosixPath(asset[kind])
            require(not relative.is_absolute() and ".." not in relative.parts, f"Unsafe sprite path: {asset[kind]}")
            nonempty(folder / asset[kind])
        require(png_size(folder / asset["png"]) == (64, 64), f"Native PNG dimensions wrong: {key}")
        require(png_size(folder / asset["sheet"]) == (512, 320), f"Sheet PNG dimensions wrong: {key}")
        data = load_json(folder / asset["sheetData"])
        frames = data["frames"]
        frames = list(frames.values()) if isinstance(frames, dict) else frames
        require(len(frames) == 40, f"Aseprite sheet JSON must have forty entries: {key}")
        for index, frame in enumerate(frames):
            require(frame["frame"] == {"x": (index % 8) * 64, "y": (index // 8) * 64, "w": 64, "h": 64}, f"Sheet coordinates wrong: {key} frame {index}")
            require(frame["duration"] == 50 and not frame["rotated"] and not frame["trimmed"], f"Frame timing/trim wrong: {key} frame {index}")
            require(frame["sourceSize"] == {"w": 64, "h": 64}, f"Frame source dimensions wrong: {key}")
        with (folder / asset["aseprite"]).open("rb") as handle:
            header = handle.read(128)
        require(len(header) == 128, f"Truncated Aseprite header: {key}")
        size, magic, count, width, height = struct.unpack_from("<IHHHH", header)
        require(magic == 0xA5E0 and count == 40 and (width, height) == (64, 64), f"Aseprite document contract wrong: {key}")
        require(size == (folder / asset["aseprite"]).stat().st_size, f"Aseprite length mismatch: {key}")
    return {"animations": 6, "nativeFrameDimensions": [64, 64], "framesPerAnimation": 40, "verifiedFrames": 240, "frameDurationMs": 50}


def safe_archive(archive: zipfile.ZipFile) -> list[str]:
    names = []
    seen = set()
    for member in archive.infolist():
        name = member.filename
        parts = PurePosixPath(name).parts
        require(name and not name.startswith(("/", "\\")) and not re.match(r"^[A-Za-z]:", name), f"Absolute ZIP path: {name}")
        require("\\" not in name and ".." not in parts and "\x00" not in name, f"Unsafe ZIP path: {name}")
        require(not stat.S_ISLNK(member.external_attr >> 16), f"ZIP symlinks are not allowed: {name}")
        require(name.casefold() not in seen, f"Duplicate/case-colliding ZIP member: {name}")
        seen.add(name.casefold())
        require(not member.flag_bits & 1, f"Encrypted ZIP member: {name}")
        if member.is_dir():
            continue
        require(member.file_size > 0 or PurePosixPath(name).name == ".nojekyll", f"Empty ZIP member: {name}")
        require(PurePosixPath(name).suffix.lower() != ".zip", f"Nested ZIP file: {name}")
        with archive.open(member) as handle:
            require(handle.read(4) not in (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"), f"Nested ZIP payload: {name}")
        names.append(name)
    bad = archive.testzip()
    require(bad is None, f"Archive CRC/integrity failure: {bad}")
    require(names, "ZIP archive contains no files")
    return names


def archive_prefix(names: list[str], marker: str) -> str:
    candidates = [name[:-len(marker)] for name in names if name == marker or name.endswith("/" + marker)]
    require(len(candidates) == 1, f"ZIP must contain exactly one {marker}")
    return candidates[0]


def compare_member(archive: zipfile.ZipFile, member: str, disk: Path) -> None:
    require(disk.is_file(), f"Archive refers to missing local release file: {disk}")
    with archive.open(member) as stored, disk.open("rb") as current:
        require(digest(stored) == digest(current), f"Stale archive member differs from disk: {member}")


def validate_archives(root: Path) -> dict:
    full_path = root / "downloads/Vitrake-Gift-Kit.zip"
    sprite_path = root / "downloads/Vitrake-Sprites.zip"
    public_media = [relative for relative in ASSETS if relative != "assets/cry-info.json"]
    required = ["README.md", "index.html", ".nojekyll", "web/index.html", "web/app.js", "web/styles.css", "web/controls.css", "game/species.json", "cards/card-data.json", "sprites/manifest.json", *public_media]
    required += ["downloads/" + name for name in DOWNLOADS if name.endswith(".pdf")]
    required += [f"sprites/{name}{suffix}" for name in SPRITES for suffix in (".png", ".gif", ".aseprite", "-sheet.png", "-sheet.json")]
    with zipfile.ZipFile(full_path) as full:
        names = safe_archive(full)
        prefix = archive_prefix(names, "game/species.json")
        files = set(names)
        for relative in required:
            require(prefix + relative in files, f"Missing full-kit ZIP asset: {relative}")
        compared = 0
        for name in names:
            require(name.startswith(prefix), f"Member outside full-kit archive root: {name}")
            relative = name[len(prefix):]
            require(not any(part in (".git", "node_modules", "dist", "checks", "qa") for part in PurePosixPath(relative).parts), f"Build/private/debug contents in gift ZIP: {relative}")
            disk = root / relative
            if disk.is_file():
                compare_member(full, name, disk)
                compared += 1
        full_count = len(names)
    with zipfile.ZipFile(sprite_path) as sprites:
        names = safe_archive(sprites)
        prefix = archive_prefix(names, "manifest.json")
        required_sprite = ["manifest.json"] + [f"{name}{suffix}" for name in SPRITES for suffix in (".png", ".gif", ".aseprite", "-sheet.png", "-sheet.json")]
        for relative in required_sprite:
            member = prefix + relative
            require(member in names, f"Missing sprite ZIP asset: {relative}")
            compare_member(sprites, member, root / "sprites" / relative)
        sprite_count = len(names)
    return {"fullKitFiles": full_count, "fullKitFilesHashCompared": compared, "spriteArchiveFiles": sprite_count, "requiredSpriteFilesHashCompared": len(required_sprite), "zipIntegrity": "passed", "noNestedArchivesOrTraversal": True}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, help="JSON report path (default: ROOT/qa/release-verification.json)")
    args = parser.parse_args()
    root = args.root.resolve()
    results = []
    for name, check in (("downloads", validate_downloads), ("assets_and_audio", validate_assets), ("game_profile", validate_species), ("card_rules", validate_card), ("sprite_contract", validate_sprites), ("archive_integrity_and_freshness", validate_archives)):
        try:
            details = check(root)
            results.append({"check": name, "status": "passed", "details": details})
        except (ReleaseError, OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile, wave.Error, struct.error) as error:
            results.append({"check": name, "status": "failed", "error": str(error)})
    passed = all(result["status"] == "passed" for result in results)
    report = {"checkedAt": datetime.now(timezone.utc).isoformat(), "passed": passed, "checks": results}
    output = args.output or root / "qa/release-verification.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
