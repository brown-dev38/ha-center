# HSCS Excel Data

วางไฟล์จริงที่นี่:

```
apps/web/data/hscs/HSCS69.xlsx
```

## Sheet ที่ระบบอ่าน

1. **`export`**
   - Row 0: หมวดหมู่คำถาม / ชื่อมิติ
   - Row 1: รหัสข้อ (A1, B1, …)
   - Row 2+: คำตอบรายบุคคล (รวมคอลัมน์รหัสบุคคลกร)

2. **`HSCS เพื่อออกรายงาน`** (หรือชื่อที่มีคำว่า รายงาน / report)
   - Column 0: รหัสบุคคลกร
   - Column 1: แผนก/วิชาชีพ

## สร้างไฟล์ตัวอย่าง

```powershell
cd C:\ha-center\apps\web
bun scripts/generate-hscs-sample.mjs
```

## ทำความสะอาดข้อมูล

- ตัด whitespace และ `\xa0` (NBSP) จากรหัส / ข้อความ
- คะแนน Likert 1–5 เท่านั้น — ค่า `0` และช่องว่าง **ไม่นำมาคำนวณ** mean / % positive
- % Positive = สัดส่วนคำตอบที่เป็น 4 หรือ 5
