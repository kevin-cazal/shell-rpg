/**
 * After v86 state restore, ask the guest to re-send zone background (hvc1 "bg …").
 */
import { sendHvc1Line } from "@runner/vmHVC1Bridge/index.js";
import { refreshPlayerJsonFromHost9p } from "./playerJson.js";

const SYNC_DELAY_MS = 400;

function onVmStateResume() {
  setTimeout(() => {
    sendHvc1Line("sync-zone-bg");
    refreshPlayerJsonFromHost9p();
  }, SYNC_DELAY_MS);
}

export function registerResumeSync() {
  window.addEventListener("vm-guest-ready", (event) => {
    if (event.detail?.resuming) {
      onVmStateResume();
    }
  });
  window.addEventListener("vm-state-restored", () => {
    onVmStateResume();
  });
}
