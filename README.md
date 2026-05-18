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

## Build disk image

```sh
sudo ./build.sh
```

## Web UI (BIOS, wasm, zone backgrounds)

```sh
npm install
cd submodules/v86-runner && npm install && cd ../..
npm run prepare
npm run dev
```

Open the URL shown, pick a `.v86b` bundle or a raw `.img` from this repo root.

## V86B bundle (disk + saved state, one file)

Generic v86-runner format (`.v86b`): 64-byte header, **seabios + vgabios**, raw disk, zstd-compressed v86 `save_state`. Self-contained except for `v86.wasm` from the web app. Loading resumes from saved state (fast start).

Create a bundle after saving memory from the running VM (menu → Save memory…):

```sh
npm run pack-bundle -- \
  --disk alpine-bios-YYYY-MM-DD.img \
  --state snapshot.v86state \
  -o game.v86b
```

Requires `zstd` on the host. Use the same disk buffer the snapshot was taken with (re-build or copy the image used during save).

## Submodule layout

| Path | Repository |
|------|------------|
| `submodules/alpine-make-vm-image` | Image builder (fork) |
| `submodules/vm-image` | Guest rootfs + `build.sh` |
| `submodules/v86-runner` | Generic browser runner |
