# Avatar pictures

67 PNGs, one per emoji in the Studio's avatar list (`api-server/src/aik/avatars.ts`),
named by the emoji's code point (`1f98a.png` is 🦊). The Studio draws avatars from
these so every child sees the same glossy 3D fox on a Chromebook, a phone and the
projector, instead of each device's own emoji font. `Avatar.tsx` holds the map.

Source: Microsoft **Fluent Emoji**, the 3D style, MIT licence —
https://github.com/microsoft/fluentui-emoji (`assets/<Name>/3D/<name>_3d.png`, and
`assets/<Name>/Default/3D/…` for the people). Downscaled from 256 px to 128 px with
`sips` on 7 Nov 2026. 🧜 has no Fluent picture and falls back to the character.

To add an emoji: add it to `AVATARS` on the server, drop its PNG here, and add the
code point to `ART` in `Avatar.tsx`.
