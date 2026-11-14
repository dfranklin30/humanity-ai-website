/**
 * The camera is a nice-to-have, not a requirement.
 *
 * Asking for the CAMERA permission (Homework Help photographs a worksheet)
 * makes Android assume the device must have a camera, and Google Play then
 * hides the app from every device without one — most school Chromebooks
 * among them (build 14 lost 67 of 77). Declaring the camera features as
 * not required keeps the app on those devices; where there is a camera,
 * the page's file picker still offers it.
 */
const { withAndroidManifest } = require("expo/config-plugins");

const OPTIONAL = ["android.hardware.camera", "android.hardware.camera.autofocus", "android.hardware.camera.any", "android.hardware.camera.front"];

module.exports = function withOptionalCamera(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const features = (manifest["uses-feature"] = manifest["uses-feature"] ?? []);
    for (const name of OPTIONAL) {
      const existing = features.find((f) => f.$?.["android:name"] === name);
      if (existing) existing.$["android:required"] = "false";
      else features.push({ $: { "android:name": name, "android:required": "false" } });
    }
    return cfg;
  });
};
