/**
 * Shell RPG plugin: zone backgrounds + player.json via /dev/hvc1.
 */
import { registerPluginMenu } from "@runner/menu/index.js";
import {
  getPlayerJsonMenuItems,
  registerPlayerJsonBridge,
} from "./shellRpg/playerJson.js";
import {
  getZoneBackgroundMenuItems,
  registerZoneBackground,
} from "./shellRpg/zoneBackground.js";

registerZoneBackground();
registerPlayerJsonBridge();

registerPluginMenu("shellRpg", "shellRpg", () => [
  ...getZoneBackgroundMenuItems(),
  ...getPlayerJsonMenuItems(),
]);
