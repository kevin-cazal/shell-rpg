#!/usr/bin/env node
/**
 * Pack a raw disk image + v86 save_state into an SRG1 bundle (.srpg1).
 *
 * Usage:
 *   node scripts/pack-bundle.mjs --disk alpine.img --state game.v86state -o game.srpg1
 *   node scripts/pack-bundle.mjs --disk alpine.img --state game.v86state.zst -o game.srpg1
 *
 * State may be raw save_state output or zstd-compressed (.zst); output state section is always zstd.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  encodeSrpg1Header,
  SRG1_DEFAULT_MEMORY,
  SRG1_HEADER_SIZE,
} from "../integrations/bundle/format.js";

const { values } = parseArgs({
  options: {
    disk: { type: "string" },
    state: { type: "string" },
    output: { type: "string", short: "o" },
    memory: { type: "string", default: String(SRG1_DEFAULT_MEMORY) },
  },
});

const diskPath = values.disk;
const statePath = values.state;
const outPath = values.output;
const memorySize = Number(values.memory);

if (!diskPath || !statePath || !outPath) {
  console.error(
    "Usage: pack-bundle.mjs --disk DISK.img --state SNAP.v86state -o OUT.srpg1",
  );
  process.exit(1);
}

const disk = readFileSync(diskPath);
let stateRaw = readFileSync(statePath);

if (statePath.endsWith(".zst")) {
  try {
    stateRaw = execFileSync("zstd", ["-d", "-c", statePath], {
      maxBuffer: 2 * 1024 * 1024 * 1024,
    });
  } catch (e) {
    console.error("zstd decompress failed; install zstd or pass raw .v86state", e);
    process.exit(1);
  }
} else {
  try {
    stateRaw = execFileSync("zstd", ["-19", "-c", "-"], {
      input: stateRaw,
      maxBuffer: 2 * 1024 * 1024 * 1024,
    });
  } catch (e) {
    console.error("zstd compress failed; install zstd", e);
    process.exit(1);
  }
}

const diskOffset = SRG1_HEADER_SIZE;
const stateOffset = diskOffset + disk.length;
const header = encodeSrpg1Header({
  memorySize,
  diskSize: disk.length,
  stateZstdSize: stateRaw.length,
  diskOffset,
  stateOffset,
  v86StateVersion: 6,
  flags: 0,
});

const out = Buffer.alloc(stateOffset + stateRaw.length);
Buffer.from(header).copy(out, 0);
disk.copy(out, diskOffset);
stateRaw.copy(out, stateOffset);

writeFileSync(outPath, out);
console.log(
  `Wrote ${outPath}: disk ${disk.length} bytes, state zstd ${stateRaw.length} bytes, total ${out.length}`,
);
