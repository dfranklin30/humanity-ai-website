# Releasing the Humanity + AI app

The same Expo project ships to both stores:

| | id | where |
|---|---|---|
| Android | `org.humanityplusai.app` | Google Play — https://play.google.com/store/apps/details?id=org.humanityplusai.app |
| iOS | `org.humanityplusai.app` | App Store |

Builds run on EAS (project `db6173b4-…`, owner `dfranklin30s-team`). Nothing
is built or uploaded from this repo automatically: every store release is a
person running the steps below.

## Android (Google Play)

> **Status, 7 Nov 2026.** v1.2.0 (14) — the **Kids AI** tab now holds all
> three AI for Kids pages behind a Studio · Hub · Facilitator switcher,
> opens https://aiforkids.humanityplusai.org/aiforkids/… links straight into
> the right panel, and offers the camera for Homework Help photos. Built on
> EAS, **not yet uploaded**: the next person uploads the `.aab` to Internal
> testing, installs it from
> https://play.google.com/apps/internaltest/4701749917874965167 and checks:
> sign in with a class code → make something → switch to Hub (still signed
> in) → Facilitator (email + password) → tap a flyer link → press back
> inside a panel. Then promote to Production.
>
> v1.1.0 (13) — Studio tab only — has been on Internal testing since 6 Nov.
> Production is still the 19 Aug build without any Studio.

1. **Version.** In `app.json`, raise `expo.android.versionCode` above the
   highest code Play has ever seen for this app (Play Console → Release →
   App bundle explorer shows it). Codes only go up; Play rejects a bundle
   with an equal or lower code. Bump `expo.version` too if the change is
   visible to people (it is shown on the store listing).
2. **Build** (from this folder, signed in to Expo as the team):
   ```bash
   npx eas-cli build --platform android --profile production
   ```
   EAS manages the upload keystore; Google Play App Signing re-signs it.
   The result is an `.aab` download link.
3. **Test it first.** Play Console → Testing → Internal testing → create a
   release, upload the `.aab`, add yourself as a tester, install from the
   opt-in link. Open the **Studio** tab, sign in with a class code, make
   something in a room, open a robot, play a movie, press the phone's back
   button inside the Studio.
4. **Release.** Promote the internal release to Production (or create a new
   production release with the same bundle), write the release notes, roll
   out. Review usually takes hours to a couple of days.

### Listing notes for this update
- The Studio is for children in a club, with a facilitator present. The
  listing's target audience is currently *not* children; if that is ever
  changed to include kids, Google's Families Policy applies (target-audience
  declaration, Data safety form review, no ads — the app has none).
- **Camera is optional (build 15).** Build 14 asked for CAMERA without saying
  the camera was optional, so Play dropped 438 devices, 67 of 77 Chromebooks
  among them. `plugins/withOptionalCamera.js` declares the camera features
  `required="false"`; check "Changes to your supported devices" shows no
  drop before publishing any future build.
- **Camera (new in 1.2.0).** Homework Help lets a child photograph a
  worksheet; the page's file picker offers the camera, and Android asks for
  permission the first time. Update the Data safety form: photos are sent
  to the AI helper for the answer and are not stored by the app. Microphone
  and location stay blocked (`app.json → android.blockedPermissions`); the
  Studio's mic buttons use the browser's speech API, which Android's
  WebView does not have, so in the app children use the keyboard's own
  voice-typing key instead.
- **Links.** The app registers for https://aiforkids.humanityplusai.org/aiforkids/…
  (no auto-verify, so Android shows an "open with" choice the first time).
  `app/+native-intent.ts` maps the link to the right panel.

## iOS (App Store)

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios
```
Raise `expo.ios.buildNumber` first. The Studio tab works the same on iOS;
Apple accepts web-content tabs as part of a larger native app.
