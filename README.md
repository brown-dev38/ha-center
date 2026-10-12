# ศูนย์ HA — ซอร์สโค้ดสำหรับเจ้าหน้าที่ไอที

ระบบเว็บของศูนย์ประสานงาน HA โรงพยาบาลมหาวิทยาลัยพะเยา พัฒนาด้วย Next.js 16, React, Prisma และ MySQL

## โครงสร้าง

- `apps/web` คือแอปหลัก ทั้งหน้าเว็บและ API
- `apps/web/app` คือหน้าและเส้นทาง API แยกตามงาน เช่น `documents`, `admin`, `patient-experience`, `meetings`
- `apps/web/prisma/schema.prisma` คือโครงสร้างฐานข้อมูล
- `apps/web/.env.production.example` คือตัวอย่างค่าที่ต้องตั้งบนเซิร์ฟเวอร์

## รันบนเครื่องพัฒนา

ต้องมี Node.js 20 ขึ้นไป และ MySQL

```bat
cd apps\web
copy .env.production.example .env.local
```

แก้ `DATABASE_URL` และ `AUTH_SECRET` ใน `.env.local` จากนั้นที่โฟลเดอร์รากของโปรเจกต์:

```bat
npm install
npm run dev
```

เปิด http://localhost:3000

บัญชีพัฒนาเริ่มต้นหลัง seed คือ `admin` / `admin1234` ใช้ได้เมื่อ `DEV_LOGIN_ENABLED` ไม่ได้ปิดไว้

## ขึ้นเซิร์ฟเวอร์โรงพยาบาล

วางซอร์สที่ `C:\ha-center\web` แล้วใช้ไฟล์ `.env.local` เดิมของเซิร์ฟเวอร์ ห้ามทับด้วยไฟล์จากเครื่องพัฒนา

```bat
cd C:\ha-center\web
npm install
npm run build
npm run pm2:restart
```

เว็บสาธารณะคือ https://hacenter.uph.up.ac.th และ IIS ส่งต่อเข้าพอร์ต 3000

## สิ่งที่ห้ามส่งต่อ

ไม่รวมในชุดนี้ และห้ามคัดลอกออกนอกหน่วยงาน:

- `.env` และ `.env.local` เพราะมีรหัสฐานข้อมูลและรหัสลับ
- `node_modules` และ `.next` เพราะสร้างใหม่ได้จากคำสั่งด้านบน
- โฟลเดอร์ `uploads` เพราะเป็นไฟล์เอกสารของโรงพยาบาล
