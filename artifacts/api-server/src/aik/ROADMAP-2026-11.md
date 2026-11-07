# Kids AI Studio — class feedback roadmap (November 2026)

Source: the Monday club session, feedback relayed by Danielle on 6 Nov 2026.
Status marks: ✅ shipped · 🔧 in progress · ⬜ not started · ⛔ blocked.

## 0. Keep the lights on
| | Item | Status | Notes |
|---|---|---|---|
| 0.1 | **Video Maker has no video model.** Microsoft retired Sora 2 on Azure on 2 Nov 2026 with no successor; our `sora-2` deployment is Disabled. | ⛔ | Needs a new provider account (fal.ai or Google Veo via a Gemini key) that only Danielle can open. Until then Video Maker delivers the storyboard and says the camera is off (0.2). |
| 0.2 | Honest message when every shot fails for a non-content reason. | ✅ | `movie.ts`: "The movie camera is switched off right now… Your facilitator knows." + `system: video_unavailable` flag in the feed. |
| 0.3 | Google Play app with the Studio tab. | 🔧 | Build 1.1.0 (13) ready; upload key reset approved 4 Nov. Upload the `.aab` to Internal testing, test on a phone, promote. |

## 1. Quick wins from the class (this PR)
| | Item | Status |
|---|---|---|
| 1.1 | Default Director's Orders per child: 12 → **20** for new classes; facilitators still change it per class. | ✅ |
| 1.2 | More avatars: 20 → **70** (animals, food, space, sports, fantasy). | ✅ |
| 1.3 | **Remix first**: the Remix tab is the first button and the landing tab; Rooms is one tap away. | ✅ |
| 1.4 | **Go play while it cooks**: while an order runs, the child sees "Hang out in the Lounge" / "Play in the Arcade"; the order keeps going and lands in My stuff. | ✅ |

## 2. Prompts: choices first, typing always available
Every field in every room (Studio and Hub) gets a tap-to-choose menu of many
options *and* a free-text box. Choices are curated per field (who / what
happens / where / look / mood…), with a "Surprise me" that fills the whole
form. Hovering or tapping a chip fills the field; the child can edit the
text afterwards.
- 2.1 ⬜ Shared `ChoiceField` component (chips + "or type your own").
- 2.2 ⬜ Choice banks per mode in `modes.ts` (≥ 12 options per field), kid-tested wording.
- 2.3 ⬜ "Surprise me" per room.
- 2.4 ⬜ Hub tools get the same component (they share `ModeForm`).

## 3. Voice: speak instead of type
- 3.1 ⬜ Microphone button on every text field and the chat box: browser speech recognition (Web Speech API) first, with an Azure Speech fallback for browsers that lack it. Transcript lands in the field for the child to check before sending; nothing is recorded or stored.
- 3.2 ⬜ Facilitator switch to turn microphones off for a class.
- 3.3 ⬜ Android app: microphone permission added only when 3.1 ships (the current build blocks it on purpose).

## 4. Hub hierarchy and sharing
Target structure, child-facing:
```
Studio
├── Remix        (first)
├── Rooms        (the eight makers)
├── My stuff     (everything I made; "Put in the Hub" button)
└── Hub
    ├── Arcade   ← games other kids shared (auto-routed: a game is always a game)
    ├── Lounge   ← facilitator-curated videos & links; always available, also while waiting
    └── Gallery  ← shared books, movies, songs, pictures, quests, robots
```
- 4.1 ✅ One "Put in the Hub" action; the artifact's kind decides where it appears (game → Arcade, everything else → Gallery). Facilitator approval still gates it. (`store.hubShelf`, `GET child/hub`, `Hub.tsx`)
- 4.2 ✅ Hub shows other kids' approved work across the class (and, with the facilitator switch "Hub shows the whole club", across the club's classes), not only games.
- 4.3 ✅ Lounge reachable from the top bar at all times and from the waiting screen (1.4 done).

## 5. Robotics Lab
The 3D robot is one model with paint and moves. The class wants variety and a bridge to physical kits.
- 5.1 ⬜ Several robot bodies (a wheeled rover, a walker, a drone, an arm) chosen from the plan's "moves by" answer; each with its own moves.
- 5.2 ⬜ **LEGO path**: a build mode that produces a brick-style plan (parts list in LEGO/SPIKE terms, step pictures) and MakeCode/SPIKE-compatible code, alongside the micro:bit path.
- 5.3 ⬜ **Sketch path**: the child draws the robot (or uploads a drawing); the image model turns it into the robot's portrait and the 3D stage paints to match. Builds on the hero-portrait pipeline.

## 6. Guardrails: a satisfying "no"
Holds and unblocks work. When the answer stays no, the child needs a good door to walk through, not a wall.
- 6.1 ✅ On a held or blocked order, offer three doors: *Try the idea a different way* (suggested rewording from `POST child/requests/:rid/door`, screened), *Lounge*, and *Advanced Special Training* (when the class has it on). `Doors.tsx`.
- 6.2 🔧 **Advanced Special Training** (opt-in, facilitator-enabled): a track for kids who have outgrown the themes. Shipped: a one-page website (HTML, hardened like a game) and a choose-your-own-adventure (JSON pages and choices), mode `advanced` in `modes.ts`; same screening, output lands in My stuff and can go to the Hub Gallery. Not yet: a data poster, a music video from their own song.
- 6.3 ✅ Facilitator view: every door is audited as `door_taken`; the class dashboard shows the session's counts (reword · Lounge · Advanced).

## 7. Waiting
- 7.1 ✅ Lounge/Arcade from the waiting screen (1.4).
- 7.2 ⬜ Queue position and a rough time ("about 3 minutes") on the status card.
- 7.3 ⬜ Batch the Sora/video lanes per class so one movie never blocks the whole room (depends on 0.1).

## Order of work
1. Play Store upload and test (0.3) — today.
2. Video provider (0.1) — the moment a key exists.
3. Prompts with choices (2) and voice (3) — next sprint; they touch the same form component, so together.
4. Hub hierarchy and sharing (4), guardrail doors (6).
5. Robotics variety, LEGO and sketch (5).
