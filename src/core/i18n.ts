import type { ToolMetadata } from './tool-contract';

export type AppLocale = 'th' | 'en';

export const supportedLocales = ['th', 'en'] as const;

const messages = {
  th: {
    skip: 'ข้ามไปยังเนื้อหา', home: 'Personal Utility Hub หน้าแรก', install: 'ติดตั้ง', installLabel: 'ติดตั้งแอป', settings: 'ตั้งค่า',
    footer: 'เครื่องมือ Client-side ประมวลผลข้อมูลภายในอุปกรณ์ของคุณ', tools: 'เครื่องมือ', privacy: 'ความเป็นส่วนตัว', footerNav: 'ลิงก์ท้ายเว็บไซต์',
    back: '← กลับหน้า Hub', localProcessing: 'ประมวลผลในเครื่อง', localDetail: 'ไม่อัปโหลดข้อมูลหรือไฟล์ของคุณไปยังเซิร์ฟเวอร์', offlineSuffix: ' · รองรับการใช้งาน Offline', loading: 'กำลังโหลด Module…', loadFailed: 'โหลดเครื่องมือไม่สำเร็จ',
    heroTitle: 'เครื่องมือที่ต้องใช้', heroAccent: 'รวมไว้ในที่เดียว', heroDescription: 'ค้นหา เปิดใช้ และบันทึกเครื่องมือโปรดได้ทันที ข้อมูลของคุณประมวลผลภายในเบราว์เซอร์โดยไม่ต้องสมัครสมาชิก',
    searchPlaceholder: 'ค้นหา เช่น JSON, QR Code, รูปภาพ…', favoritesOnly: 'เฉพาะรายการโปรด', trustLabel: 'หลักการความเป็นส่วนตัว',
    trust1: 'ทำงานในเครื่อง', trust1Detail: 'ไฟล์ไม่ถูกอัปโหลด', trust2: 'ไม่ต้องมีบัญชี', trust2Detail: 'เปิดแล้วใช้งานได้ทันที', trust3: 'พร้อม Offline', trust3Detail: 'ติดตั้งเป็น PWA ได้',
    catalog: 'เลือกเครื่องมือ', catalogLabel: 'Tool catalog', filterCategories: 'กรองตามหมวดหมู่', toolCount: 'เครื่องมือ',
    noResults: 'ไม่พบเครื่องมือที่ตรงกับการค้นหา', noResultsDetail: 'ลองเปลี่ยนคำค้น หมวดหมู่ หรือตัวกรองรายการโปรด', favorites: 'รายการโปรด', savedLocally: 'Saved locally', noFavorites: 'ยังไม่มีรายการโปรด', noFavoritesDetail: 'กดรูปดาวบน Tool Card เพื่อเก็บเครื่องมือไว้ในอุปกรณ์นี้',
    recent: 'เปิดล่าสุด', onDevice: 'On this device', clearHistory: 'ล้างประวัติ', noRecent: 'ยังไม่มีประวัติ', noRecentDetail: 'เครื่องมือที่คุณเปิดจะปรากฏตรงนี้โดยเก็บเฉพาะในอุปกรณ์',
    addFavorite: 'เพิ่มในรายการโปรด', removeFavorite: 'นำออกจากรายการโปรด', addedFavorite: 'เพิ่ม', removedFavorite: 'นำ', favoriteTailAdd: 'ในรายการโปรดแล้ว', favoriteTailRemove: 'ออกจากรายการโปรดแล้ว',
    onDeviceBadge: '✓ ในเครื่อง', prepareOffline: 'เตรียม Offline', offlineReady: '✓ Offline พร้อม', preparing: 'กำลังเตรียม…', retry: 'ลองเตรียมอีกครั้ง', planned: 'เร็ว ๆ นี้',
    notFoundLabel: 'Route not found', notFound: 'ไม่พบหน้าที่คุณต้องการ', notFoundDetail: 'เส้นทางนี้ไม่มีอยู่ใน Hub หรืออาจถูกย้ายแล้ว',
    lightTheme: 'เปลี่ยนเป็นธีมสว่าง', darkTheme: 'เปลี่ยนเป็นธีมมืด',
    settingsTitle: 'ตั้งค่าและข้อมูลในเครื่อง', settingsIntro: 'ควบคุมภาษา ลำดับเครื่องมือ และสำรองค่าที่เก็บเฉพาะในอุปกรณ์นี้', language: 'ภาษา', order: 'ลำดับเครื่องมือ', orderCatalog: 'ค่าเริ่มต้น', orderFrequent: 'ใช้บ่อยก่อน',
    exportSettings: 'ส่งออกการตั้งค่า', importSettings: 'นำเข้าการตั้งค่า', importHint: 'ไฟล์ JSON เท่านั้น · ไม่ส่งข้อมูลออกจากอุปกรณ์', close: 'ปิด', settingsSaved: 'บันทึกการตั้งค่าแล้ว', exportDone: 'ส่งออกการตั้งค่าแล้ว', importDone: 'นำเข้าการตั้งค่าแล้ว', importFailed: 'นำเข้าการตั้งค่าไม่สำเร็จ',
    compatibility: 'Compatibility Check', compatible: 'พร้อมใช้งาน', limited: 'มีข้อจำกัด', required: 'จำเป็น', optional: 'เสริม', compatibilitySummary: 'ความสามารถเบราว์เซอร์', backendDecision: 'ไม่ใช้ Backend', backendReason: 'Phase 5 ทำงานในอุปกรณ์ได้ทั้งหมด จึงไม่มีการส่งการตั้งค่าหรือไฟล์ขึ้นเซิร์ฟเวอร์',
  },
  en: {
    skip: 'Skip to content', home: 'Personal Utility Hub home', install: 'Install', installLabel: 'Install app', settings: 'Settings',
    footer: 'Client-side tools process your data on this device', tools: 'Tools', privacy: 'Privacy', footerNav: 'Footer links',
    back: '← Back to Hub', localProcessing: 'Processed on this device', localDetail: 'Your data and files are never uploaded to a server', offlineSuffix: ' · Available offline', loading: 'Loading module…', loadFailed: 'Unable to load this tool',
    heroTitle: 'Every tool you need', heroAccent: 'in one private hub', heroDescription: 'Find, open and save useful tools instantly. Everything runs in your browser with no account required.',
    searchPlaceholder: 'Search JSON, QR Code, images…', favoritesOnly: 'Favorites only', trustLabel: 'Privacy principles',
    trust1: 'Runs locally', trust1Detail: 'Files are never uploaded', trust2: 'No account', trust2Detail: 'Open and use instantly', trust3: 'Offline ready', trust3Detail: 'Installable as a PWA',
    catalog: 'Choose a tool', catalogLabel: 'Tool catalog', filterCategories: 'Filter by category', toolCount: 'tools',
    noResults: 'No matching tools', noResultsDetail: 'Try another search, category or Favorites filter', favorites: 'Favorites', savedLocally: 'Saved locally', noFavorites: 'No favorites yet', noFavoritesDetail: 'Tap the star on a Tool Card to save it on this device',
    recent: 'Recently opened', onDevice: 'On this device', clearHistory: 'Clear history', noRecent: 'No recent tools', noRecentDetail: 'Tools you open appear here and stay on this device',
    addFavorite: 'Add to Favorites', removeFavorite: 'Remove from Favorites', addedFavorite: 'Added', removedFavorite: 'Removed', favoriteTailAdd: 'to Favorites', favoriteTailRemove: 'from Favorites',
    onDeviceBadge: '✓ On device', prepareOffline: 'Prepare offline', offlineReady: '✓ Offline ready', preparing: 'Preparing…', retry: 'Try again', planned: 'Coming soon',
    notFoundLabel: 'Route not found', notFound: 'Page not found', notFoundDetail: 'This route does not exist in the Hub or may have moved',
    lightTheme: 'Switch to light theme', darkTheme: 'Switch to dark theme',
    settingsTitle: 'Settings and local data', settingsIntro: 'Control language and tool order, and back up settings stored only on this device.', language: 'Language', order: 'Tool order', orderCatalog: 'Default order', orderFrequent: 'Most used first',
    exportSettings: 'Export settings', importSettings: 'Import settings', importHint: 'JSON only · data never leaves this device', close: 'Close', settingsSaved: 'Settings saved', exportDone: 'Settings exported', importDone: 'Settings imported', importFailed: 'Could not import settings',
    compatibility: 'Compatibility Check', compatible: 'Ready', limited: 'Limited', required: 'Required', optional: 'Optional', compatibilitySummary: 'Browser capabilities', backendDecision: 'No backend', backendReason: 'Every Phase 5 feature runs on this device, so settings and files are never sent to a server.',
  },
} as const;

export type MessageKey = keyof typeof messages.th;

export function t(locale: AppLocale, key: MessageKey): string {
  return messages[locale][key];
}

const categoryEnglish: Record<string, string> = {
  'ทั้งหมด': 'All', 'รูปภาพ': 'Images', 'PDF และเอกสาร': 'PDF & Documents', 'ข้อความและข้อมูล': 'Text & Data',
  'QR Code และบาร์โค้ด': 'QR & Barcodes', 'เสียงและวิดีโอ': 'Audio & Video', 'Developer Tools': 'Developer Tools', 'อื่น ๆ': 'Other',
};

  const toolEnglish: Record<string, Pick<ToolMetadata, 'title' | 'description'>> = {
  'audio-compressor': { title: 'Audio Compressor Pro', description: 'Compress audio with target size, presets and honest before/after metrics.' },
  'audio-merger': { title: 'Audio Merger Studio', description: 'Reorder audio files, add gap or crossfade, and choose the output format.' },
  'silence-remover': { title: 'Silence Remover', description: 'Remove long pauses with threshold, minimum silence and padding controls.' },
  'audio-finisher': { title: 'Audio Finisher', description: 'Polish gain, normalization and fades with peak and clipping protection.' },
  'audio-speed-pitch': { title: 'Audio Speed & Pitch', description: 'Preview and export predictable offline speed and pitch changes.' },
  'audio-trimmer': { title: 'Audio Trimmer', description: 'Trim, preview and fade audio locally without uploading the file.' },
  'foundation-demo': { title: 'Foundation Demo', description: 'Verify the registry, routing, lazy loading and module lifecycle.' },
  'json-formatter': { title: 'JSON Formatter / Validator', description: 'Format, minify and validate JSON directly in your browser.' },
  base64: { title: 'Base64 Encoder / Decoder', description: 'Encode and decode Unicode text or Base64 data in your browser.' },
  'text-formatter': { title: 'Text Formatter', description: 'Clean whitespace, blank lines and letter case without uploading text.' },
  'qr-generator': { title: 'QR Code Generator', description: 'Create downloadable QR Code images entirely on this device.' },
  'image-resizer': { title: 'Image Resizer', description: 'Resize images with aspect-ratio control and a local preview.' },
  'image-converter': { title: 'Image Converter', description: 'Convert images between PNG, JPEG and WebP locally.' },
  'qr-reader': { title: 'QR Code Reader', description: 'Read QR Codes from an image or camera without uploading media.' },
  'image-compressor': { title: 'Image Compressor', description: 'Reduce JPEG or WebP file size with local quality controls.' },
  'images-to-pdf': { title: 'Images to PDF', description: 'Turn up to 20 images into a private A4 PDF.' },
  'pdf-merge': { title: 'PDF Merge', description: 'Combine up to 10 PDF files in the selected order.' },
  'pdf-split': { title: 'PDF Split', description: 'Extract pages or page ranges into a new PDF.' },
  'pdf-to-image': { title: 'PDF to Image', description: 'Render a selected PDF page as PNG or JPEG.' },
  'file-metadata': { title: 'File Metadata Viewer', description: 'Inspect file details and SHA-256 without uploading the file.' },
};

export function localizeCategory(category: string, locale: AppLocale): string {
  return locale === 'en' ? (categoryEnglish[category] ?? category) : category;
}

export function localizeTool(tool: ToolMetadata, locale: AppLocale): ToolMetadata {
  if (locale === 'th') return tool;
  const translated = toolEnglish[tool.id];
  return { ...tool, ...(translated ?? {}), category: localizeCategory(tool.category, locale) };
}
