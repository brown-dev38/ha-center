/**
 * หลัง next build — copy static + public เข้า standalone (Next.js ต้องการเอง)
 * รัน: node scripts/prepare-standalone.mjs
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const standaloneDir = join(root, '.next', 'standalone')
const staticSrc = join(root, '.next', 'static')
const staticDest = join(standaloneDir, '.next', 'static')
const publicSrc = join(root, 'public')
const publicDest = join(standaloneDir, 'public')

if (!existsSync(join(standaloneDir, 'server.js'))) {
  console.error('ไม่พบ .next/standalone/server.js — ตรวจว่า next.config มี output: "standalone" แล้วรัน npm run build')
  process.exit(1)
}

mkdirSync(dirname(staticDest), { recursive: true })
cpSync(staticSrc, staticDest, { recursive: true })
console.log('copied .next/static -> .next/standalone/.next/static')

if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true })
  console.log('copied public -> .next/standalone/public')
} else {
  console.log('skip public (folder not found)')
}

console.log('standalone bundle ready')
