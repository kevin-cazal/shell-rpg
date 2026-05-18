# shell-rpg

Shell RPG — Alpine guest + browser runner. Uses three submodules.

## Prerequisites

- git, Node.js 20+, Linux root for disk build

## First-time setup

```sh
git clone --recursive https://github.com/kevin-cazal/shell-rpg.git
cd shell-rpg
git submodule update --init --recursive
```

## Build disk image (default 256 MiB)

```sh
sudo ./build.sh
```

Produces `alpine-bios-256M.img` in the repo root. For the legacy 512 MiB disk:

```sh
IMAGE_SIZE=512M sudo ./build.sh
```

## Web UI (BIOS, wasm, zone backgrounds)

Zone background PNGs live in `assets/zone-bg/` (browser only). `npm run prepare` copies them into the v86-runner `public/bg/` tree.

```sh
npm install
cd submodules/v86-runner && npm install && cd ../..
npm run prepare
npm run dev
```

Open the URL shown, then pick a **`.v86b` bundle** or **`alpine-bios-256M.img`**.

Guest RAM defaults to **256 MiB** via `.env` (`VITE_VM_MEMORY_MB=256`). Override when starting dev if needed.

## V86B bundle (disk + saved state, one file)

Format implemented in [v86-runner](https://github.com/kevin-cazal/v86-runner): `.v86b` = header + BIOS + raw disk + zstd-compressed v86 `save_state`.

After the VM is running, use the menu → **Save memory…**, then pack:

```sh
VITE_VM_MEMORY_MB=256 npm run pack-bundle -- \
  --disk alpine-bios-256M.img \
  --state alpine-bios-256M.v86state \
  -o shell-rpg-256M.v86b
```

Requires `zstd` on the host. **`memory_size` in the bundle must match** the RAM used when the snapshot was taken (256 MiB by default).

## Deploy under a path prefix

`npm run build` emits relative asset URLs (`base: ./`) so you can serve `dist/` behind nginx at e.g. `/games/shell-rpg/`. See `submodules/v86-runner` for `VITE_BASE`.

## Submodule layout

| Path | Repository |
|------|------------|
| `submodules/alpine-make-vm-image` | Image builder (fork) |
| `submodules/vm-image` | Guest rootfs + `build.sh` |
| `submodules/v86-runner` | Generic browser runner |
