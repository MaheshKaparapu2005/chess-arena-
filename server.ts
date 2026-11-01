import fs from 'node:fs';
import path from 'node:path';

const prodBundle = path.resolve(process.cwd(), 'dist/server.bundle.mjs');
// Detect if running under tsx (development mode) or node (production Cloud Run deployment)
const isTsx = process.execArgv.some((arg) => arg.includes('tsx'));

if (!isTsx && fs.existsSync(prodBundle)) {
  await import(`file://${prodBundle}`);
} else {
  const devEntry = './server/main.ts';
  await import(devEntry);
}
