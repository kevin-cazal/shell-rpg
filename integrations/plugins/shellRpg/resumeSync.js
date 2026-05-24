/**
 * After v86 state restore: guest post-restore hook (hvc1) + host CSS fallback on bundle splash.
 */
import { isHvc1BridgeAttached, sendHvc1Line } from "@runner/vmHVC1Bridge/index.js";
import { applyZoneBackgroundFile } from "./zoneBackground.js";
import { refreshPlayerJsonFromHost9p } from "./playerJson.js";

/** @type {number[]} */
const POST_RESTORE_RETRY_MS = [300, 1000, 2200, 4000];

function requestPostRestoreHook() {
  if (!isHvc1BridgeAttached()) return;
  try {
    sendHvc1Line("post-restore");
  } catch {
    /* bridge not ready */
  }
}

/**
 * @param {{ bundleResume?: boolean }} [opts]
 */
function onVmStateResume(opts = {}) {
  const { bundleResume = false } = opts;
  if (bundleResume) {
    applyZoneBackgroundFile("root.png");
  }
  for (const ms of POST_RESTORE_RETRY_MS) {
    setTimeout(() => {
      requestPostRestoreHook();
      if (ms === POST_RESTORE_RETRY_MS[0]) {
        refreshPlayerJsonFromHost9p();
      }
    }, ms);
  }
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
