/**
 * After v86 state restore, re-apply zone background via host CSS and hvc1 guest commands.
 */
import { isHvc1BridgeAttached, sendHvc1Line } from "@runner/vmHVC1Bridge/index.js";
import { applyZoneBackgroundFile } from "./zoneBackground.js";
import { refreshPlayerJsonFromHost9p } from "./playerJson.js";

/** @type {number[]} */
const SYNC_RETRY_MS = [300, 1000, 2200, 4000];

/**
 * Host→guest: sync-zone-bg (guest vm-bridge-send) and bg-set (direct bg line).
 * @param {string} [filename] e.g. root.png — if set, also send bg-set for splash/bundle resume
 */
function injectZoneBackgroundViaHvc1(filename) {
  if (!isHvc1BridgeAttached()) return;
  try {
    sendHvc1Line("sync-zone-bg");
    if (filename) {
      sendHvc1Line(`bg-set ${filename}`);
    }
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

  for (const ms of SYNC_RETRY_MS) {
    setTimeout(() => {
      injectZoneBackgroundViaHvc1(bundleResume ? "root.png" : undefined);
      if (ms === SYNC_RETRY_MS[0]) {
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
