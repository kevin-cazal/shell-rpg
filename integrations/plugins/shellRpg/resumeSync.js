/**
 * After v86 state restore: host CSS fallback for bundle splash; refresh player.json.
 * Zone bg for in-game restore is driven by hvc0 inject (cd .) in v86-runner app.js.
 */
import { applyZoneBackgroundFile } from "./zoneBackground.js";
import { refreshPlayerJsonFromHost9p } from "./playerJson.js";

function onVmStateResume(opts = {}) {
  const { bundleResume = false } = opts;
  if (bundleResume) {
    applyZoneBackgroundFile("root.png");
  }
  setTimeout(() => refreshPlayerJsonFromHost9p(), 400);
}

export function registerResumeSync() {
  window.addEventListener("vm-guest-ready", (event) => {
    if (event.detail?.resuming) {
      onVmStateResume({ bundleResume: true });
    }
  });
  window.addEventListener("vm-state-restored", () => {
    onVmStateResume({ bundleResume: false });
  });
}
