/** Shell RPG product entry: plugins, then generic v86 runner. */
import { initOfficialBundleDownloadLink } from "./bundleRelease.js";
import "./plugins/shellRpg.js";
import "@runner/app.js";

initOfficialBundleDownloadLink();
initFrenchPickStatus();

/** Garde le texte d’accueil en français sur l’écran de choix du fichier. */
function initFrenchPickStatus() {
  const statusEl = document.getElementById("status");
  const pickOverlay = document.getElementById("pick-overlay");
  if (!statusEl || !pickOverlay) return;
  const label = "En attente du fichier du jeu";
  const apply = () => {
    if (!pickOverlay.hidden) statusEl.textContent = label;
  };
  apply();
  new MutationObserver(apply).observe(pickOverlay, {
    attributes: true,
    attributeFilter: ["hidden"],
  });
}
