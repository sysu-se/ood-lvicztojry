import path from 'path';
import { fileURLToPath } from 'url';
const root = process.cwd();
const imports = [
  'src/node_modules/@sudoku/stores/game.js',
  'src/node_modules/@sudoku/stores/grid.js',
  'src/node_modules/@sudoku/stores/settings.js',
  'src/node_modules/@sudoku/stores/cursor.js',
  'src/node_modules/@sudoku/stores/modal.js',
  'src/node_modules/@sudoku/stores/notes.js',
  'src/node_modules/@sudoku/stores/candidates.js',
  'src/node_modules/@sudoku/stores/keyboard.js',
  'src/node_modules/@sudoku/stores/difficulty.js',
  'src/node_modules/@sudoku/stores/timer.js'
];
for (const rel of imports) {
  const file = path.join(root, rel);
  try {
    const m = await import('file://' + file.replace(/\\/g, '/'));
    console.log('MODULE', rel, Object.keys(m));
    for (const k of Object.keys(m)) {
      const v = m[k];
      console.log('  ', k, typeof v, v && typeof v.subscribe, v && typeof v.set, v && typeof v.update);
    }
  } catch (e) {
    console.error('ERROR', rel, e.message);
  }
}
