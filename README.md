# GILDED NIGHT — a museum heist game

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/DKAnbu/best-heist-game-20261122-0559/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/DKAnbu/best-heist-game-20261122-0559/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

A top-down heist game for the [make.fun best heist game bounty](https://make.fun/c/best-heist-game-20261122-0559).
Three dense rooms, one crew, no plan B: read the patrols, mind the cameras, grab the target loot and slip out the getaway door.

## The heist

- **Room 1 — The Gallery.** Steal the Starlit Bust from the Marlowe Museum. Two big uniformed guards on patrol, one sweeping camera, glass display cases, velvet ropes and marble pillars to hide behind, and three ways across the floor: the open floor, between the cases, or crawling the service duct.
- **Room 2 — The Vault Corridor.** Find the keycard, open the keycard door, take the gold bars. Three guards, two cameras, a zig-zag corridor with a service duct running under it.
- **Room 3 — The Vault.** The Aurora Diamond sits in its alcove under three cameras and two crossing patrols, behind red laser beams. Take it and run.

## How it plays

- **WASD / arrow keys** — move the thief. Walls and cover block movement; tall cover also blocks sight.
- **Click** — toss a coin. The nearest guard walks over to investigate the clink.
- **1 — smoke pellet** (3 per room). A cloud that hides the thief from guards and cameras.
- **2 — EMP pulse** (2 per room). Knocks every camera out for six seconds.
- **Service ducts** — crawl through the floor grates to pass unseen (slower, but invisible).
- **R** — retry the room. **M** — mute.

The **alarm meter** rises while a guard or a camera has eyes on you and falls while you stay hidden. At 100% the crew gets pinched — but a guard only chases once the alarm is high, and a "?" / "!" over his head always warns you first, so getting caught is fair.

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome. No network request, no build step, all sounds synthesized with WebAudio.

```sh
node serve.ts   # http://localhost:8080
```

## Layout

- `game/index.html`, `game/style.css` — the page and the canvas.
- `game/js/main.js` — bootstrap, game loop, state machine, input.
- `game/js/level.js` — the three dense rooms and collision.
- `game/js/guard.js` — patrol, suspicion, chase, coin investigation.
- `game/js/vision.js` — cones and line-of-sight geometry.
- `game/js/camera.js` — sweeping security cameras and EMP.
- `game/js/player.js` — movement, tools, loot and keycard pickup.
- `game/js/render.js` — everything drawn on the canvas, HUD included.
- `game/js/audio.js` — synthesized WebAudio sounds.
- `game/js/shots.js` — deterministic scene presets for screenshots.
- `main.ts` — the make.fun hand-in: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT — see `LICENSE`.
