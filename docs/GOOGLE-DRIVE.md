# ไฟล์ผ่านลิงก์ Google Drive (แนะนำ)

ใช้ **Gmail ส่วนตัว (ฟรี)** — ไม่ต้อง Google Workspace ไม่ต้อง Service Account

## โมดูลที่รองรับ

| โมดูล | การใช้งาน |
|--------|-----------|
| **เอกสาร** | เพิ่มเอกสาร → แท็บแนบลิงก์ Drive |
| **KM** | บันทึก KM Session → แนบลิงก์รายงาน PDF |
| **ประชุม** | แนบวาระการประชุม → วางลิงก์แต่ละวาระ |
| **E-learning** | บทเรียนประเภท **ลิงก์** หรือ **วิดีโอ** (รองรับลิงก์ Drive / YouTube) |

## วิธีทำงาน

1. อัปโหลด PDF ไป **Google Drive** ด้วยบัญชี Gmail ของ รพ./ทีม
2. คลิกขวาไฟล์ → **แชร์** → ตั้งเป็น **ใครมีลิงก์ก็ดูได้** (หรือจำกัดตามนโยบาย รพ.)
3. คัดลอกลิงก์ → วางในฟอร์มของโมดูลที่ต้องการ

ระบบเก็บใน MySQL เฉพาะ **เมทาดาตา + ลิงก์** (`file_path` แบบ `url:https://...`) — ไฟล์จริงอยู่บน Drive

---

## ตั้งค่า (แนะนำ)

ใน `apps/web/.env.local`:

```env
# เปิดทุกโมดูล (แนะนำ)
FILE_LINK_MODE=all

# หรือตั้งรายโมดูล
# DOCUMENT_STORAGE_MODE=link
# KM_STORAGE_MODE=link
# MEETING_STORAGE_MODE=link
# ELEARNING_STORAGE_MODE=link
```

เปิด http://localhost:3000/api/health ต้องเห็น:

```json
{
  "ok": true,
  "storage": {
    "documents": "link",
    "km": "link",
    "meetings": "link",
    "elearning": "link"
  }
}
```

เมื่อตั้ง `link` แล้ว หน้าเว็บจะใช้ **แนบลิงก์อย่างเดียว** (ไม่แสดงแท็บอัปโหลด PDF เข้า MySQL)

ถ้าไม่ตั้งตัวแปรนี้ ยังเลือกได้ทั้ง **ลิงก์** และ **อัปโหลด PDF** (เก็บใน MySQL)

---

## ลิงก์ที่รองรับ

- `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
- `https://drive.google.com/open?id=FILE_ID`
- ลิงก์ `https` อื่นที่ชี้ไปไฟล์ PDF โดยตรง

ระบบจะแปลงลิงก์ Drive เป็นโหมด **preview** สำหรับเปิดอ่านในหน้าเว็บ

---

## ข้อควรทราบ

- สิทธิ์การเข้าถึงไฟล์ขึ้นกับการตั้งค่า **แชร์บน Drive** — ถ้าตั้ง “เฉพาะคนในองค์กร” ผู้ใช้นอกองค์กรเปิดไม่ได้
- โควต้า Drive ของ Gmail ฟรี ~15 GB
- บน Vercel ใช้ได้ — ไม่ต้องตั้ง env พิเศษนอกจาก `DOCUMENT_STORAGE_MODE=link` (ถ้าต้องการบังคับโหมดลิงก์)

---

## โหมดขั้นสูง: อัปโหลดไฟล์เข้า Drive อัตโนมัติ (Service Account)

ถ้าต้องการให้ระบบ **อัปโหลดไฟล์เอง** ไป Drive (เอกสาร/KM/ประชุม/e-learning) ใช้:

```env
FILE_STORAGE_BACKEND=drive
GOOGLE_DRIVE_FOLDER_ID="..."
GOOGLE_DRIVE_CLIENT_EMAIL="..."
GOOGLE_DRIVE_PRIVATE_KEY="..."
```

ขั้นตอนละเอียด: สร้าง Google Cloud Project → เปิด Drive API → สร้าง Service Account → แชร์โฟลเดอร์ Drive ให้ `client_email` → ตั้ง env ด้านบน

โหมดนี้ **ไม่จำเป็น** ถ้าใช้วิธีแนบลิงก์สำหรับเอกสาร
