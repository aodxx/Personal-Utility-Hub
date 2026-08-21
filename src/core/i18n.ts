import type { ToolMetadata } from './tool-contract';

export type AppLocale = 'th' | 'en';

export const supportedLocales = ['th', 'en'] as const;

const messages = {
  th: {
    skip: 'ข้ามไปยังเนื้อหา', home: 'Personal Utility Hub หน้าแรก', install: 'ติดตั้ง', installLabel: 'ติดตั้งแอป', settings: 'ตั้งค่า',
    footer: 'เครื่องมือ Client-side ประมวลผลข้อมูลภายในอุปกรณ์ของคุณ', tools: 'เครื่องมือ', privacy: 'ความเป็นส่วนตัว', footerNav: 'ลิงก์ท้ายเว็บไซต์', privacyPageTitle: 'ข้อมูลของคุณไปไหน?', privacyPageIntro: 'Personal Utility Hub ออกแบบให้การประมวลผลหลักเกิดขึ้นใน Browser ของคุณ โดยไม่ใช้ Backend เก็บไฟล์ผู้ใช้', privacyFlowFile: 'ไฟล์ของคุณ', privacyFlowBrowser: 'Browser บนอุปกรณ์ของคุณ', privacyFlowTool: 'เครื่องมือประมวลผล', privacyFlowResult: 'ผลลัพธ์', privacyFlowDownload: 'ดาวน์โหลด', privacyWhatWeDo: 'สิ่งที่เราทำ', privacyWhatWeDoDetail: 'ไฟล์หลักถูกอ่านและประมวลผลภายในอุปกรณ์ ไม่มีบัญชี ไม่มี Cloud Storage และไม่มี Analytics ที่อ่านข้อความหรือเนื้อหาไฟล์', privacyWhatWeStore: 'สิ่งที่เก็บในอุปกรณ์', privacyWhatWeStoreDetail: 'LocalStorage ใช้สำหรับ Settings, Favorites, Recent, Locale และ usage-related settings; IndexedDB/Cache Storage ใช้สำหรับ Offline state/assets ตาม implementation', privacyDoNotPromise: 'สิ่งที่เราไม่ควรรับประกัน', privacyDoNotPromiseDetail: 'เราไม่อ้างว่าปลอดภัย 100% หรือไม่มีความเสี่ยง เราอธิบายเฉพาะสิ่งที่ architecture ปัจจุบันทำจริง', privacySource: 'ตรวจสอบ source code บน GitHub', privacyGuide: 'วิธีใช้งาน', howToUse: 'วิธีใช้งาน', guideClose: 'ปิดคู่มือ', guideOverview: 'เครื่องมือนี้ใช้ทำอะไร', guideUseCases: 'เหมาะกับกรณีไหน', guideInputs: 'Input ที่รองรับ', guideOutputs: 'Output ที่ได้', guideSteps: 'ขั้นตอนการใช้งาน', guideLimitations: 'ข้อจำกัด', guidePrivacy: 'การจัดการข้อมูล', guideFaq: 'คำถามที่พบบ่อย', guideTips: 'Tips', firstUseTitle: 'ใช้งานครั้งแรก?', firstUseDetail: 'อ่านวิธีใช้งานประมาณ 30 วินาที แล้วค่อยเริ่มด้วยข้อมูลของคุณ', firstUseRead: 'อ่านวิธีใช้', firstUseDismiss: 'ข้าม', privacyExplain: 'ไฟล์หลักประมวลผลใน Browser ของคุณ', offlineExplain: 'เตรียม asset ตาม capability ปัจจุบันเพื่อใช้งาน Offline', sampleData: 'ลองด้วยข้อมูลตัวอย่าง', sampleLoaded: 'ใส่ข้อมูลตัวอย่างแล้ว',
    back: '← กลับหน้า Hub', localProcessing: 'ประมวลผลในเครื่อง', localDetail: 'ไม่อัปโหลดข้อมูลหรือไฟล์ของคุณไปยังเซิร์ฟเวอร์', offlineSuffix: ' · รองรับการใช้งาน Offline', loading: 'กำลังโหลด Module…', loadFailed: 'โหลดเครื่องมือไม่สำเร็จ',
    heroTitle: 'เครื่องมือที่ต้องใช้', heroAccent: 'รวมไว้ในที่เดียว', heroDescription: 'ค้นหา เปิดใช้ และบันทึกเครื่องมือโปรดได้ทันที ข้อมูลของคุณประมวลผลภายในเบราว์เซอร์โดยไม่ต้องสมัครสมาชิก',
    searchPlaceholder: 'ค้นหา เช่น JSON, QR Code, รูปภาพ…', favoritesOnly: 'เฉพาะรายการโปรด', trustLabel: 'หลักการความเป็นส่วนตัว',
    trust1: 'ทำงานในเครื่อง', trust1Detail: 'ไฟล์ไม่ถูกอัปโหลด', trust2: 'ไม่ต้องมีบัญชี', trust2Detail: 'เปิดแล้วใช้งานได้ทันที', trust3: 'พร้อม Offline', trust3Detail: 'ติดตั้งเป็น PWA ได้', trustOnDevice: 'ทำงานในเครื่อง', trustOnDeviceDetail: 'ไฟล์หลักถูกประมวลผลภายใน Browser ของคุณ', trustNoAccount: 'ไม่ต้องมีบัญชี', trustNoAccountDetail: 'เปิด Tool แล้วใช้งานได้ทันทีโดยไม่ต้องสมัครสมาชิก', trustOffline: 'พร้อม Offline', trustOfflineDetail: 'Tool ที่รองรับสามารถเตรียมไว้ใช้งาน Offline ได้', trustChipHint: 'กดหรือเลื่อนไปที่ชิปเพื่ออ่านคำอธิบาย', mostUsedEyebrow: 'Local personalization', mostUsedTitle: 'ใช้บ่อยของคุณ', mostUsedDetail: 'อ้างอิงจากการใช้งานบนอุปกรณ์นี้ ไม่ใช่ข้อมูลรวมของผู้ใช้ทุกคน', carouselHint: 'เลื่อนเพื่อดูเพิ่มเติม', carouselPrevious: 'เครื่องมือก่อนหน้า', carouselNext: 'เครื่องมือถัดไป', carouselPosition: 'ตำแหน่งเครื่องมือ', carouselActive: 'กำลังเลือก', resetUsage: 'ล้างประวัติการใช้บ่อย', resetUsageDetail: 'ล้างเฉพาะ usage count แล้วกลับไปชุดแนะนำเริ่มต้น', resetUsageDone: 'ล้างประวัติการใช้บ่อยแล้ว',
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
    footer: 'Client-side tools process your data on this device', tools: 'Tools', privacy: 'Privacy', footerNav: 'Footer links', privacyPageTitle: 'Where does your data go?', privacyPageIntro: 'Personal Utility Hub is designed so core processing happens in your browser without a backend storing user files.', privacyFlowFile: 'Your file', privacyFlowBrowser: 'Browser on your device', privacyFlowTool: 'Processing tool', privacyFlowResult: 'Result', privacyFlowDownload: 'Download', privacyWhatWeDo: 'What we do', privacyWhatWeDoDetail: 'Primary files are read and processed on-device. There is no account, cloud storage, or analytics that reads file content.', privacyWhatWeStore: 'What stays on your device', privacyWhatWeStoreDetail: 'LocalStorage stores Settings, Favorites, Recent, Locale and usage-related settings; IndexedDB/Cache Storage stores Offline state/assets as implemented.', privacyDoNotPromise: 'What we do not promise', privacyDoNotPromiseDetail: 'We do not claim 100% safety or zero risk. We describe only what the current architecture actually does.', privacySource: 'Inspect the source on GitHub', privacyGuide: 'How to use', howToUse: 'How to use', guideClose: 'Close guide', guideOverview: 'What it does', guideUseCases: 'Good for', guideInputs: 'Supported inputs', guideOutputs: 'Output', guideSteps: 'Steps', guideLimitations: 'Limitations', guidePrivacy: 'Privacy', guideFaq: 'FAQ', guideTips: 'Tips', firstUseTitle: 'First time here?', firstUseDetail: 'Read this short guide before starting with your own data.', firstUseRead: 'Read the guide', firstUseDismiss: 'Skip', privacyExplain: 'Primary files are processed in your browser', offlineExplain: 'Prepare the assets supported by the current Offline capability', sampleData: 'Try sample data', sampleLoaded: 'Sample data loaded',
    back: '← Back to Hub', localProcessing: 'Processed on this device', localDetail: 'Your data and files are never uploaded to a server', offlineSuffix: ' · Available offline', loading: 'Loading module…', loadFailed: 'Unable to load this tool',
    heroTitle: 'Every tool you need', heroAccent: 'in one private hub', heroDescription: 'Find, open and save useful tools instantly. Everything runs in your browser with no account required.',
    searchPlaceholder: 'Search JSON, QR Code, images…', favoritesOnly: 'Favorites only', trustLabel: 'Privacy principles',
    trust1: 'Runs locally', trust1Detail: 'Files are never uploaded', trust2: 'No account', trust2Detail: 'Open and use instantly', trust3: 'Offline ready', trust3Detail: 'Installable as a PWA', trustOnDevice: 'On-device', trustOnDeviceDetail: 'Primary files are processed in your browser', trustNoAccount: 'No account', trustNoAccountDetail: 'Open a tool and use it without signing up', trustOffline: 'Offline ready', trustOfflineDetail: 'Supported tools can be prepared for Offline use', trustChipHint: 'Focus or select a chip to read a short explanation', mostUsedEyebrow: 'Local personalization', mostUsedTitle: 'Your Most Used', mostUsedDetail: 'Based on usage on this device, not a global popularity list', carouselHint: 'Swipe to see more', carouselPrevious: 'Previous tool', carouselNext: 'Next tool', carouselPosition: 'Tool position', carouselActive: 'Active', resetUsage: 'Reset Most Used history', resetUsageDetail: 'Clear usage counts only and return to the default recommendations', resetUsageDone: 'Most Used history reset',
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
  'QR Code และบาร์โค้ด': 'QR & Barcodes', 'เสียงและดนตรี': 'Audio & Music', 'แผนที่และภูมิสารสนเทศ': 'Maps & Geospatial', 'ไฟล์และข้อมูลเมตา': 'Files & Metadata', 'ไดอะแกรม': 'Diagrams', 'เกม': 'Games', 'ดูดวง': 'Fortune & Astrology', 'Developer Tools': 'Developer Tools', 'อื่น ๆ': 'Other',
};

  const toolEnglish: Record<string, Pick<ToolMetadata, 'title' | 'description'>> = {
  'audio-compressor': { title: 'Audio Resampler (WAV)', description: 'Resample audio to a lower sample rate and export honest WAV size metrics.' },
  'audio-merger': { title: 'Audio Merger Studio', description: 'Reorder audio files, add gap or crossfade, and choose the output format.' },
  'silence-remover': { title: 'Silence Remover', description: 'Remove long pauses with threshold, minimum silence and padding controls.' },
  'audio-finisher': { title: 'Audio Finisher', description: 'Polish gain, normalization and fades with peak and clipping protection.' },
  'audio-speed-pitch': { title: 'Audio Speed & Pitch', description: 'Preview and export predictable offline speed and pitch changes.' },
  'audio-trimmer': { title: 'Audio Trimmer', description: 'Trim, preview and fade audio locally without uploading the file.' },
  'privacy-redactor': { title: 'Privacy Redactor Studio', description: 'Find and redact sensitive text locally before sharing a file.' },
  'file-diff': { title: 'File Diff & Change Map', description: 'Compare text or JSON versions and export a readable change report locally.' },
  'image-contact-sheet': { title: 'Image Contact Sheet Studio', description: 'Create labeled image contact sheets and catalogs without uploading your photos.' },
  'csv-profiler': { title: 'CSV Data Cleaner & Profiler', description: 'Profile, clean and export CSV data privately in your browser.' },
  'audio-chapter-marker': { title: 'Audio Chapter Marker & Cue Sheet', description: 'Mark chapters on a local waveform and export cue sheets for podcasts and lectures.' },
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
