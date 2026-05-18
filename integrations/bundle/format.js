/** Shell RPG single-file bundle (SRG1). */

export const SRG1_MAGIC = 0x31475253; // "SRG1" little-endian
export const SRG1_VERSION_V1 = 1;
export const SRG1_VERSION = 2;
export const SRG1_HEADER_SIZE = 64;
export const SRG1_DEFAULT_MEMORY = 512 * 1024 * 1024;
export const SRG1_MAX_DISK_BYTES = 2 * 1024 * 1024 * 1024;
export const SRG1_MAX_BIOS_BYTES = 4 * 1024 * 1024;

/**
 * @typedef {{
 *   version: number,
 *   flags: number,
 *   memorySize: number,
 *   seabiosSize: number,
 *   vgabiosSize: number,
 *   diskSize: number,
 *   stateZstdSize: number,
 *   seabiosOffset: number,
 *   vgabiosOffset: number,
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
  const flags = view.getUint16(6, true);
  const memorySize = view.getUint32(8, true);

  if (version === SRG1_VERSION_V1) {
    const diskSize = view.getUint32(12, true);
    const stateZstdSize = view.getUint32(16, true);
    const diskOffset = view.getUint32(20, true);
    const stateOffset = view.getUint32(24, true);
    const v86StateVersion = view.getUint32(28, true);
    if (diskOffset !== SRG1_HEADER_SIZE) {
      throw new Error(`Unexpected disk_offset ${diskOffset}`);
    }
    if (stateOffset !== diskOffset + diskSize) {
      throw new Error(`Unexpected state_offset ${stateOffset}`);
    }
    return {
      version,
      flags,
      memorySize,
      seabiosSize: 0,
      vgabiosSize: 0,
      diskSize,
      stateZstdSize,
      seabiosOffset: 0,
      vgabiosOffset: 0,
      diskOffset,
      stateOffset,
      v86StateVersion,
    };
  }

  if (version !== SRG1_VERSION) {
    throw new Error(`Unsupported SRG1 version ${version}`);
  }

  const seabiosSize = view.getUint32(12, true);
  const vgabiosSize = view.getUint32(16, true);
  const diskSize = view.getUint32(20, true);
  const stateZstdSize = view.getUint32(24, true);
  const seabiosOffset = view.getUint32(28, true);
  const vgabiosOffset = view.getUint32(32, true);
  const diskOffset = view.getUint32(36, true);
  const stateOffset = view.getUint32(40, true);
  const v86StateVersion = view.getUint32(44, true);

  if (seabiosOffset !== SRG1_HEADER_SIZE) {
    throw new Error(`Unexpected seabios_offset ${seabiosOffset}`);
  }
  if (
    seabiosSize === 0 ||
    seabiosSize > SRG1_MAX_BIOS_BYTES ||
    vgabiosSize === 0 ||
    vgabiosSize > SRG1_MAX_BIOS_BYTES
  ) {
    throw new Error("Invalid BIOS section sizes");
  }
  if (vgabiosOffset !== seabiosOffset + seabiosSize) {
    throw new Error(`Unexpected vgabios_offset ${vgabiosOffset}`);
  }
  if (diskOffset !== vgabiosOffset + vgabiosSize) {
    throw new Error(`Unexpected disk_offset ${diskOffset}`);
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
  if (memorySize < 16 * 1024 * 1024 || memorySize > 2048 * 1024 * 1024) {
    throw new Error(`Invalid memory_size ${memorySize}`);
  }

  return {
    version,
    flags,
    memorySize,
    seabiosSize,
    vgabiosSize,
    diskSize,
    stateZstdSize,
    seabiosOffset,
    vgabiosOffset,
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
  view.setUint32(12, header.seabiosSize, true);
  view.setUint32(16, header.vgabiosSize, true);
  view.setUint32(20, header.diskSize, true);
  view.setUint32(24, header.stateZstdSize, true);
  view.setUint32(28, header.seabiosOffset, true);
  view.setUint32(32, header.vgabiosOffset, true);
  view.setUint32(36, header.diskOffset, true);
  view.setUint32(40, header.stateOffset, true);
  view.setUint32(44, header.v86StateVersion ?? 0, true);
  return buf;
}

/**
 * @param {number} seabiosSize
 * @param {number} vgabiosSize
 * @param {number} diskSize
 * @param {number} stateZstdSize
 */
export function computeSrpg1Offsets(seabiosSize, vgabiosSize, diskSize, stateZstdSize) {
  const seabiosOffset = SRG1_HEADER_SIZE;
  const vgabiosOffset = seabiosOffset + seabiosSize;
  const diskOffset = vgabiosOffset + vgabiosSize;
  const stateOffset = diskOffset + diskSize;
  return { seabiosOffset, vgabiosOffset, diskOffset, stateOffset };
}
