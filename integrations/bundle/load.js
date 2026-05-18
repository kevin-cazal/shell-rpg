import { decompress } from "fzstd";
import {
  parseSrpg1Header,
  SRG1_HEADER_SIZE,
  SRG1_MAGIC,
  SRG1_VERSION,
  validateSrpg1Layout,
} from "./format.js";

const SRG1_EXT = /\.srpg1$/i;

/**
 * @param {File} file
 * @param {{ readSlice: (start: number, length: number, onProgress?: (pct: number) => void) => Promise<ArrayBuffer> }} helpers
 * @returns {Promise<import("@runner/loaderHooks.js").FileLoadResult | null>}
 */
export async function loadShellRpgBundleFile(file, { readSlice }) {
  if (!SRG1_EXT.test(file.name)) {
    const head = await readSlice(0, Math.min(4, file.size));
    if (head.byteLength < 4) {
      return null;
    }
    const magic = new DataView(head).getUint32(0, true);
    if (magic !== SRG1_MAGIC) {
      return null;
    }
  }

  const headerBuf = await readSlice(0, SRG1_HEADER_SIZE);
  const header = parseSrpg1Header(headerBuf);
  validateSrpg1Layout(header, file.size);

  let biosBuffer;
  let vgaBiosBuffer;
  if (header.version >= SRG1_VERSION && header.seabiosSize > 0) {
    biosBuffer = await readSlice(header.seabiosOffset, header.seabiosSize);
    vgaBiosBuffer = await readSlice(header.vgabiosOffset, header.vgabiosSize);
  }

  const diskBuffer = await readSlice(header.diskOffset, header.diskSize);

  const stateZstd = await readSlice(
    header.stateOffset,
    header.stateZstdSize,
  );

  const stateBytes = decompress(new Uint8Array(stateZstd));
  const initialStateBuffer = stateBytes.buffer.slice(
    stateBytes.byteOffset,
    stateBytes.byteOffset + stateBytes.byteLength,
  );

  return {
    diskBuffer,
    initialStateBuffer,
    memorySize: header.memorySize,
    biosBuffer,
    vgaBiosBuffer,
    label: file.name,
  };
}
