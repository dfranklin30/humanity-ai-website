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

> **Status, 6 Nov 2026.** v1.1.0 (13) — Studio tab + padded adaptive icon —
> is **live on the Internal testing track** ("Available to internal testers",
> published 6 Nov 8:33 PM). The upload key reset (new key from the
> `dfranklin30s-team` Expo keystore) was approved on 4 Nov. Testers join at
> https://play.google.com/apps/internaltest/4701749917874965167 — install,
> open the Studio tab, sign in with a class code, make something, open a
> robot, press back inside the Studio. Then promote the same release to
> Production from Play Console (Release → Production → Create new release →
> Add from library).

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
- The app asks for no camera, microphone or location permission; the
  manifest blocks them explicitly (`app.json → android.blockedPermissions`).

## iOS (App Store)

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios
```
Raise `expo.ios.buildNumber` first. The Studio tab works the same on iOS;
Apple accepts web-content tabs as part of a larger native app.
