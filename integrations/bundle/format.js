/** Shell RPG single-file bundle (SRG1). */

export const SRG1_MAGIC = 0x31475253; // "SRG1" little-endian
export const SRG1_VERSION = 1;
export const SRG1_HEADER_SIZE = 64;
export const SRG1_DEFAULT_MEMORY = 512 * 1024 * 1024;
export const SRG1_MAX_DISK_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * @typedef {{
 *   version: number,
 *   flags: number,
 *   memorySize: number,
 *   diskSize: number,
 *   stateZstdSize: number,
 *   diskOffset: number,
 *   stateOffset: number,
 *   v86StateVersion: number,
 * }} Srpg1Header
 */

/**
 * @param {ArrayBuffer} buf Must be at least 64 bytes.
 * @returns {Srpg1Header}
 */
export function parseSrpg1Header(buf) {
  const view = new DataView(buf);
  const magic = view.getUint32(0, true);
  if (magic !== SRG1_MAGIC) {
    throw new Error("Not an SRG1 bundle (bad magic)");
  }
  const version = view.getUint16(4, true);
  if (version !== SRG1_VERSION) {
    throw new Error(`Unsupported SRG1 version ${version}`);
  }
  const flags = view.getUint16(6, true);
  const memorySize = view.getUint32(8, true);
  const diskSize = view.getUint32(12, true);
  const stateZstdSize = view.getUint32(16, true);
  const diskOffset = view.getUint32(20, true);
  const stateOffset = view.getUint32(24, true);
  const v86StateVersion = view.getUint32(28, true);

  if (diskOffset !== SRG1_HEADER_SIZE) {
    throw new Error(`Unexpected disk_offset ${diskOffset}`);
  }
  if (memorySize < 16 * 1024 * 1024 || memorySize > 2048 * 1024 * 1024) {
    throw new Error(`Invalid memory_size ${memorySize}`);
  }
  if (diskSize === 0 || diskSize > SRG1_MAX_DISK_BYTES) {
    throw new Error(`Invalid disk_size ${diskSize}`);
  }
  if (stateZstdSize === 0) {
    throw new Error("SRG1 bundle requires zstd state section");
  }
  if (stateOffset !== diskOffset + diskSize) {
    throw new Error(`Unexpected state_offset ${stateOffset}`);
  }

  return {
    version,
    flags,
    memorySize,
    diskSize,
    stateZstdSize,
    diskOffset,
    stateOffset,
    v86StateVersion,
  };
}

/**
 * @param {Srpg1Header} header
 * @param {number} fileSize
 */
export function validateSrpg1Layout(header, fileSize) {
  const need = header.stateOffset + header.stateZstdSize;
  if (fileSize < need) {
    throw new Error(
      `Bundle truncated: need ${need} bytes, file is ${fileSize}`,
    );
  }
}

/**
 * @param {Srpg1Header} header
 * @returns {ArrayBuffer}
 */
export function encodeSrpg1Header(header) {
  const buf = new ArrayBuffer(SRG1_HEADER_SIZE);
  const view = new DataView(buf);
  view.setUint32(0, SRG1_MAGIC, true);
  view.setUint16(4, SRG1_VERSION, true);
  view.setUint16(6, header.flags ?? 0, true);
  view.setUint32(8, header.memorySize, true);
  view.setUint32(12, header.diskSize, true);
  view.setUint32(16, header.stateZstdSize, true);
  view.setUint32(20, header.diskOffset, true);
  view.setUint32(24, header.stateOffset, true);
  view.setUint32(28, header.v86StateVersion ?? 0, true);
  return buf;
}
