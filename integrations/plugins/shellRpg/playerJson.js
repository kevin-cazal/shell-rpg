/**
 * Guest mirrors /tmp/player.json to /mnt/host/player.json (host9p).
 * Host reads /player.json via getHost9pVfs() and shows level + quests in a popup.
 */
import { getHost9pVfs } from "@runner/host9p/access.js";
import { showPopup } from "@runner/popup/index.js";

const PLAYER_JSON_PATH = "/player.json";
const textDecoder = new TextDecoder("utf-8");

/** @param {...unknown} args */
function vmbLog(...args) {
  try {
    if (localStorage.getItem("VM_BRIDGE_DEBUG") === "0") return;
  } catch {
    /* ignore */
  }
  console.log("[shellRpg][player.json]", ...args);
}

/** Latest player state from host9p /player.json. */
/** @type {object | null} */
let latestPlayerJson = null;

/** @type {number} */
let lastSeenMtime = 0;
/** @type {number} */
let lastSeenSize = 0;
/** @type {ReturnType<typeof setInterval> | null} */
let pollTimer = null;

/**
 * @returns {boolean} true if player JSON was loaded
 */
export function refreshPlayerJsonFromHost9p() {
  const vfs = getHost9pVfs();
  if (!vfs) {
    latestPlayerJson = null;
    return false;
  }

  const st = vfs.stat(PLAYER_JSON_PATH);
  if (!st) {
    latestPlayerJson = null;
    lastSeenMtime = 0;
    lastSeenSize = 0;
    return false;
  }

  const bytes = vfs.get(PLAYER_JSON_PATH);
  if (!bytes || bytes.length === 0) {
    latestPlayerJson = null;
    lastSeenMtime = st.mtime;
    lastSeenSize = st.size;
    return false;
  }

  try {
    latestPlayerJson = JSON.parse(textDecoder.decode(bytes));
    lastSeenMtime = st.mtime;
    lastSeenSize = st.size;
    vmbLog(`updated from host9p mtime=${st.mtime} size=${st.size}`);
    window.dispatchEvent(
      new CustomEvent("shellRpg:playerJson", { detail: latestPlayerJson }),
    );
    return true;
  } catch (err) {
    vmbLog("parse failed", err);
    console.warn("[shellRpg] player.json parse failed:", err);
    latestPlayerJson = null;
    return false;
  }
}

function pollPlayerJsonFromHost9p() {
  const vfs = getHost9pVfs();
  if (!vfs) {
    return;
  }
  const st = vfs.stat(PLAYER_JSON_PATH);
  if (!st) {
    if (latestPlayerJson !== null) {
      latestPlayerJson = null;
      lastSeenMtime = 0;
      lastSeenSize = 0;
    }
    return;
  }
  if (st.mtime === lastSeenMtime && st.size === lastSeenSize) {
    return;
  }
  refreshPlayerJsonFromHost9p();
}

export function registerPlayerJsonHost9p() {
  if (pollTimer !== null) {
    return;
  }
  pollTimer = setInterval(pollPlayerJsonFromHost9p, 1000);
}

/** @returns {object | null} */
export function getPlayerJson() {
  return latestPlayerJson;
}

/** Total gained level (same field as engine save: sum of completed quest levels). */
/** @param {object} data */
function playerLevel(data) {
  if (typeof data.level === "number") {
    return data.level;
  }
  const done = Array.isArray(data.quests_done) ? data.quests_done : [];
  return done.reduce((sum, q) => sum + (Number(q?.level) || 0), 0);
}

/** Quests with level > 0 (in-game filter). */
/** @param {unknown} quests */
function questsWithLevel(quests) {
  if (!Array.isArray(quests)) return [];
  return quests.filter(
    (q) => q && typeof q === "object" && (Number(q.level) || 0) > 0,
  );
}

/** @param {HTMLElement} parent */
/** @param {string} title */
/** @param {(body: HTMLElement) => boolean} buildBody */
function appendSection(parent, title, buildBody) {
  const section = document.createElement("section");
  section.className = "player-state-section";

  const heading = document.createElement("h3");
  heading.className = "player-state-section-title";
  heading.textContent = title;
  section.append(heading);

  const body = document.createElement("div");
  body.className = "player-state-section-body";
  const hasContent = buildBody(body);
  if (!hasContent) {
    const empty = document.createElement("p");
    empty.className = "player-state-empty";
    empty.textContent = "None";
    body.append(empty);
  }

  section.append(body);
  parent.append(section);
}

/** @param {HTMLElement} listEl */
/** @param {{ name: string, level: number, desc: string }[]} items */
function fillQuestList(listEl, items) {
  for (const item of items) {
    const li = document.createElement("li");
    li.className = "player-state-quest";

    const head = document.createElement("div");
    head.className = "player-state-quest-head";

    const name = document.createElement("span");
    name.className = "player-state-quest-name";
    name.textContent = item.name;

    const level = document.createElement("span");
    level.className = "player-state-quest-level";
    level.textContent = `Lv ${item.level}`;

    head.append(name, level);
    li.append(head);

    if (item.desc) {
      const desc = document.createElement("p");
      desc.className = "player-state-quest-desc";
      desc.textContent = item.desc;
      li.append(desc);
    }

    listEl.append(li);
  }
}

/** @param {object} q */
function questRow(q) {
  return {
    name: typeof q.name === "string" ? q.name : "?",
    level: Number(q.level) || 0,
    desc: typeof q.desc === "string" ? q.desc.trim() : "",
  };
}

/** @param {HTMLElement} container */
/** @param {object} data */
function renderPlayerStateView(container, data) {
  const root = document.createElement("div");
  root.className = "player-state-view";

  const hero = document.createElement("div");
  hero.className = "player-state-hero";

  const levelBlock = document.createElement("div");
  levelBlock.className = "player-state-level";
  const levelValue = document.createElement("span");
  levelValue.className = "player-state-level-value";
  levelValue.textContent = String(playerLevel(data));
  const levelLabel = document.createElement("span");
  levelLabel.className = "player-state-level-label";
  levelLabel.textContent = "Level";
  levelBlock.append(levelValue, levelLabel);
  hero.append(levelBlock);

  root.append(hero);

  const active = questsWithLevel(data.quests).map(questRow);
  appendSection(root, "Active quests", (body) => {
    if (!active.length) return false;
    const list = document.createElement("ul");
    list.className = "player-state-quest-list";
    fillQuestList(list, active);
    body.append(list);
    return true;
  });

  const done = questsWithLevel(data.quests_done).map(questRow);
  appendSection(root, "Completed quests", (body) => {
    if (!done.length) return false;
    const list = document.createElement("ul");
    list.className = "player-state-quest-list";
    fillQuestList(list, done);
    body.append(list);
    return true;
  });

  container.append(root);
}

/** @param {object} data */
function showPlayerJsonPopup(data) {
  showPopup({
    title: "Player state",
    render(container) {
      renderPlayerStateView(container, data);
    },
  });
}

/** @param {string} message */
function showPlayerJsonMessage(message) {
  showPopup({
    title: "Player state",
    render(container) {
      const p = document.createElement("p");
      p.className = "player-state-empty";
      p.textContent = message;
      container.append(p);
    },
  });
}

/** @returns {import("@runner/menu/index.js").MenuItem[]} */
export function getPlayerJsonMenuItems() {
  return [
    {
      type: "action",
      label: "View player state…",
      onClick() {
        if (refreshPlayerJsonFromHost9p()) {
          const data = getPlayerJson();
          if (data) {
            showPlayerJsonPopup(data);
            return;
          }
        }
        showPlayerJsonMessage("Not available.");
      },
    },
  ];
}
