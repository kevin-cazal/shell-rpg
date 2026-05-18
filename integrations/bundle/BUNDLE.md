# SRG1 bundle format (version 1)

Single file: **header (64 B) + raw disk + zstd(v86 save_state)**.

| Offset | Size | Field |
|--------|------|--------|
| 0 | 4 | Magic `SRG1` (`0x31475253` LE) |
| 4 | 2 | Format version (`1`) |
| 6 | 2 | Flags (reserved, 0) |
| 8 | 4 | `memory_size` (bytes, must match v86 config) |
| 12 | 4 | `disk_size` |
| 16 | 4 | `state_zstd_size` |
| 20 | 4 | `disk_offset` (= 64) |
| 24 | 4 | `state_offset` (= 64 + disk_size) |
| 28 | 4 | v86 state format version hint (optional) |
| 32 | 32 | Reserved (zero) |

The browser loads `initial_state` from decompressed state; disk is mapped as `hda` unchanged.

Create with `npm run pack-bundle -- --disk … --state … -o game.srpg1`.
