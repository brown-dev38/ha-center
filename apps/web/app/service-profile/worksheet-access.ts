export const WORKSHEET_NO_EDIT_PERMISSION_MESSAGE =
  'คุณไม่มีสิทธิ์แก้ไขไฟล์ของคนอื่น แก้ได้เฉพาะไฟล์ของตนเอง ไฟล์ของคนอื่นจะดูได้กับโหลดได้อย่างเดียว'

export function alertNoWorksheetEditPermission() {
  window.alert(WORKSHEET_NO_EDIT_PERMISSION_MESSAGE)
}
