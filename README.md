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
doas ./build.sh
```

Produces `alpine-bios-256M.img` in the repo root. For the legacy 512 MiB disk:

```sh
IMAGE_SIZE=512M doas ./build.sh
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

**Automated** (headless boot + pack; rebuild the disk image first so guest bridge hooks are present):

```sh
npm install
cd submodules/v86-runner && npm install && cd ../..
npm run prepare
VITE_VM_MEMORY_MB=256 npm run build-bundle -- \
  --disk submodules/vm-image/alpine-bios-256M.img \
  -o shell-rpg-256M.v86b
```

Boot progress is printed on **serial0**; the snapshot is taken at the splash (`[Press Enter to start]` on hvc0) after guest `splash-ready` / `state-ready` vm-bridge lines.

**Manual fallback:** run the VM in the browser, menu → **Save memory…**, then:

```sh
VITE_VM_MEMORY_MB=256 npm run pack-bundle -- \
  --disk alpine-bios-256M.img \
  --state alpine-bios-256M.v86state \
  -o shell-rpg-256M.v86b
```

Requires `zstd` on the host. **`memory_size` in the bundle must match** the RAM used when the snapshot was taken (256 MiB by default).

## Host file share (`/mnt/host`)

The guest mounts a virtio 9p export at **`/mnt/host`** (see `submodules/vm-image` fstab).

- Host paths are the **9p root** (e.g. `/player.json`), not `/mnt/host/...`.
- Guest paths are under **`/mnt/host`** (e.g. `/mnt/host/player.json`).
- **Player state (menu → View player state…):** the engine keeps `/tmp/player.json` and mirrors it to `/mnt/host/player.json` on each save; the browser reads host `/player.json` via `getHost9pVfs()` (integrations). Devtools may still use **`window.host9p.vfs`** for debugging.
- **`localStorage.host9pDebug=1`** then reload for 9p request logs.

Host VFS state is not saved in v86 memory snapshots; the guest re-copies `player.json` to `/mnt/host` on the next in-game save after loading an old `.v86b`.

## Play online (GitHub Pages)

After enabling **GitHub Pages** (Actions source) on `main`, the app is published at:

**https://kevin-cazal.github.io/shell-rpg/**

1. Use **Download official bundle (.v86b)** on the home screen (from [vm-image releases](https://github.com/kevin-cazal/shell-rpg-vm-image/releases/latest)).
2. Choose the downloaded file with **Choose disk or bundle…**.

The app does not fetch the ~330 MiB bundle automatically on each visit.

## Deploy (GitHub Pages)

Pushes to `main` run `.github/workflows/pages.yml` (Vite build + deploy). Set repository **Pages → Build and deployment → GitHub Actions**.

## Deploy under a path prefix

`npm run build` emits relative asset URLs (`base: ./`) so you can serve `dist/` behind nginx at e.g. `/games/shell-rpg/`. See `submodules/v86-runner` for `VITE_BASE`.

## Submodule layout

| Path | Repository |
|------|------------|
| `submodules/alpine-make-vm-image` | Image builder (fork) |
| `submodules/vm-image` | Guest rootfs + `build.sh` |
| `submodules/v86-runner` | Generic browser runner |
