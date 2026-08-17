export const categories = [
  'รูปภาพ',
  'PDF และเอกสาร',
  'ข้อความและข้อมูล',
  'QR Code และบาร์โค้ด',
  'เสียง',
  'Developer Tools',
  'อื่น ๆ',
] as const;

export const allCategories = ['ทั้งหมด', ...categories] as const;
