# Anatomical ownership and animation notes

The approved reference is a tiny beetle under a red dragon-faced carapace. Only the two curved horns are translucent chemical containers. Neither horn is an independent tail. The carapace has no extra reservoir windows and no additional actual head.

## Left and right

| Feature | Anatomical side | Front three-quarter drawing | Direct rear drawing |
| --- | --- | --- | --- |
| Blue liquid horn | Left | Right side of the image, nearer the viewer | Left side of the image |
| Amber liquid horn | Right | Left side of the image, farther from the viewer | Right side of the image |

This reverses screen position without changing the creature's anatomy. Reservoir fill colors also remain unchanged in the shiny palette.

## Six legs

The real thorax owns every hip socket. Three stations each have a near/far mate; source coordinates are available in `sprite-source-data.json`.

| View | Pair | Hip coordinates | Minimum visible pixels, each leg, across idle |
| --- | --- | --- | --- |
| Front | Front | Far (24,46), near (24,48) | 30 / 40 |
| Front | Middle | Far (34,47), near (34,49) | 5 / 68 |
| Front | Hind | Far (44,46), near (44,48) | 20 / 84 |
| Back | Front | Left (25,44), right (39,44) | 15 / 15 |
| Back | Middle | Left (25,47), right (39,47) | 39 / 39 |
| Back | Hind | Left (25,50), right (39,50) | 53 / 53 |

The carapace naturally occludes most upper legs. The far middle foot in front view is intentionally only a small visible cluster, rather than adding a misleading extra limb. Every leg has its own upper/lower source layer and planted contact point.

## Rig rules

- `body`: one orthonormal rotation plus a small translation. Shell plates and horns share that transform.
- Six leg chains: exact two-circle inverse kinematics; hip follows the thorax, ground contact remains fixed, and both segment lengths stay constant.
- `jaw`: rotates around (44,40), allowing the lower shell lip to open without stretching the face.
- `beetle-head`: rotates around its attachment at (26,48).
- `antenna-far` / `antenna-near`: rotate about the real head's antenna roots. Both remain uniformly dark.
- Horn liquids: authored bubble positions inside the fixed liquid regions. Container contours never swell or deform.
- `chemical-spray`: independent attack effect, separate from body layers.

There is no shell subdivision into animation strips. Its overlapping plate details are static artwork on one rigid layer. Aseprite's RotSprite expansion supplies contour-aware sampling for articulated parts; sampling returns exact palette indices at native size. Every visible boundary is then assigned the dark contour color without adding or removing silhouette pixels.

The 2-second idle has 39 distinct frames. Its movements are deliberately restrained for a heavy beetle wearing a large carapace. The attack braces first, opens the jaw, sprays during frames 14–27 and recovers. All six contacts remain planted for both actions.

## Verification

`sprite-validate.py` independently decodes indexed cels from the saved `.aseprite` documents and recomposes every native frame. It compares those results with every frame PNG and corresponding sprite-sheet rectangle. The runtime motion report separately records every joint, fixed contact and visible layer count.

All 240 frames are within the 16-entry palette and use binary alpha. Four idle variants retain canvas margins and a single connected creature silhouette in every frame. The chemical attack may have detached spray droplets by design. No muzzle, horn tip or foot is cropped.
