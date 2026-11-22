// VAULTBREAK hand-in (Node 22, standard library only).
//
// This program is the entrypoint make.fun grades: it gathers the game
// and the screenshots that sit beside it and lays them out under the
// output directory, then asks the vendored make.fun library to write
// the dossier the judge reads. The grader runs it twice and the two
// runs must produce identical bytes, so it only copies files and
// writes the dossier — it never stamps a time or a random value.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fresh output directory, then the game folder in full.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

// The screenshots, when the maker has taken them.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier, written by the kit's own library with the gate's caps:
// at most 160 KiB of source text, 4 screenshots of at most 256 KiB,
// a game of at most 993 files and 48 MiB, paths at most 1000 bytes.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
