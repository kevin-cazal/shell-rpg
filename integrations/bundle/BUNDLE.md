# SRG1 bundle format

## Version 2 (current)

Single file layout:

```
[header 64 B][seabios.bin][vgabios.bin][raw disk][zstd(v86 save_state)]
```

| Offset | Size | Field |
|--------|------|--------|
| 0 | 4 | Magic `SRG1` (`0x31475253` LE) |
| 4 | 2 | Format version (`2`) |
| 6 | 2 | Flags (reserved, 0) |
| 8 | 4 | `memory_size` |
| 12 | 4 | `seabios_size` |
| 16 | 4 | `vgabios_size` |
| 20 | 4 | `disk_size` |
| 24 | 4 | `state_zstd_size` |
| 28 | 4 | `seabios_offset` (= 64) |
| 32 | 4 | `vgabios_offset` |
| 36 | 4 | `disk_offset` |
| 40 | 4 | `state_offset` |
| 44 | 4 | v86 state format version hint |
| 48 | 16 | Reserved (zero) |

Loading a `.srpg1` uses embedded BIOS buffers and `initial_state` (no separate `public/assets` BIOS needed; `v86.wasm` still required from the site).

Create with `npm run pack-bundle -- --disk … --state … -o game.srpg1` (defaults to BIOS from `npm run prepare`).

## Version 1 (legacy)

`[header][raw disk][zstd state]` — BIOS still loaded from `public/assets/` on the host.
