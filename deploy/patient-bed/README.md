# patient-bed — Deploy แบบ Next.js standalone

คัดลอกไฟล์ในโฟลเดอร์นี้ไปที่ `C:\apps\patient-bed` บน server (หรือ repo patient-bed)

## 1) next.config — ต้องมี

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/patient-bed',
  output: 'standalone',
}

module.exports = nextConfig
```

(ถ้าเป็น `next.config.ts` ให้ใส่ `output: 'standalone'` ใน object เดียวกัน)

## 2) package.json — เพิ่ม script

```json
{
  "scripts": {
    "build": "next build && node scripts/prepare-standalone.mjs",
    "start:standalone": "node .next/standalone/server.js"
  }
}
```

## 3) คัดลอกไฟล์จาก deploy/patient-bed

- `scripts/prepare-standalone.mjs` → `C:\apps\patient-bed\scripts\`
- `ecosystem.config.cjs` → `C:\apps\patient-bed\ecosystem.config.cjs`

## 4) บน server — build + PM2

```powershell
pm2 stop patient-bed
cd C:\apps\patient-bed
npm install
npm run build
pm2 delete patient-bed
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs patient-bed --lines 20
```

## 5) ทดสอบ

```powershell
(Invoke-WebRequest http://localhost:3002/patient-bed/ -UseBasicParsing -MaximumRedirection 10).StatusCode
```

Browser: `https://hacenter.uph.up.ac.th/patient-bed/`
