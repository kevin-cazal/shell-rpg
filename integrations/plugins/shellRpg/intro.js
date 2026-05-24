/**
 * After the VM is ready and the terminal size is synced, ask the guest to show
 * the intro pager (post-snapshot: tty size, root background, less).
 */
import { sendHvc1Line } from "@runner/vmHVC1Bridge/index.js";

const INTRO_DELAY_MS = 1200;

export function registerIntroAfterVmReady() {
  window.addEventListener("vm-guest-ready", () => {
    setTimeout(() => sendHvc1Line("show-intro"), INTRO_DELAY_MS);
  });
}
