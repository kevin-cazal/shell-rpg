/**
 * Shell RPG plugin: zone backgrounds + player.json via host9p (/mnt/host).
 */
import { registerPluginMenu } from "@runner/menu/index.js";
import {
  getPlayerJsonMenuItems,
  registerPlayerJsonHost9p,
} from "./shellRpg/playerJson.js";
import {
  getZoneBackgroundMenuItems,
  registerZoneBackground,
} from "./shellRpg/zoneBackground.js";
import { registerIntroAfterVmReady } from "./shellRpg/intro.js";

registerZoneBackground();
registerPlayerJsonHost9p();
registerIntroAfterVmReady();

registerPluginMenu("shellRpg", "shellRpg", () => [
  ...getZoneBackgroundMenuItems(),
  ...getPlayerJsonMenuItems(),
]);
