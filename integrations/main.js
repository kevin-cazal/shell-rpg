import { setFileLoaderHook } from "@runner/loaderHooks.js";
import { loadShellRpgBundleFile } from "./bundle/load.js";

setFileLoaderHook(loadShellRpgBundleFile);

import "./plugins/shellRpg.js";
import "@runner/app.js";
