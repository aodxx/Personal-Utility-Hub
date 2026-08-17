import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, setProgressStatus, setToolStatus } from '../../core/tool-ui';
import { MAX_IMAGE_BYTES, validateImageFile } from '../../core/image-processing';
import { ANIMATED_STICKER_PRESET, CHAT_THUMBNAIL_PRESET, MAIN_IMAGE_PRESET, STATIC_STICKER_PRESET } from '../../data/line-sticker-presets';
import { metadata } from './metadata';
import { buildPrompt, contentBounds, createGrid, createValidationSummary, createZip, gridCells, inspectSticker, moveBoundary, removeColorKey, type GridConfig, type QualityResult, type StickerStyle, type StickerTransform, validateAnimatedFrames } from './logic';

interface StickerItem {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;
  transform: StickerTransform;
  style: StickerStyle;
  history: Array<{ transform: StickerTransform; style: StickerStyle }>;
  quality?: QualityResult;
  blob?: Blob;
}

let panel: HTMLElement | undefined;
let stickers: StickerItem[] = [];
let selectedIndex = 0;
let grid: GridConfig | undefined;
let sourceCanvas: HTMLCanvasElement | undefined;
let sourceName = 'stickers';
let currentStep = 'upload';
let mode: 'static' | 'animated' = 'static';
let animatedTimers: number[] = [];
let frameDurations: number[] = [];

const cloneTransform = (value: StickerTransform): StickerTransform => ({ ...value });
const cloneStyle = (value: StickerStyle): StickerStyle => ({ ...value });
const defaultTransform = (): StickerTransform => ({ scale: 1, offsetX: 0, offsetY: 0, rotation: 0, flipX: false, flipY: false, fit: 'contain' });
const defaultStyle = (): StickerStyle => ({ keyColor: '#ffffff', tolerance: 35, feather: 10, strokeColor: '#ffffff', strokeWidth: 0, showSafeMargin: true });
const el = <T extends Element>(selector: string): T => panel!.querySelector<T>(selector)!;

function pushHistory(item: StickerItem): void {
  item.history.push({ transform: cloneTransform(item.transform), style: cloneStyle(item.style) });
  if (item.history.length > 20) item.history.shift();
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas;
}

async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  validateImageFile(file);
  if (file.size > MAX_IMAGE_BYTES) throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 15 MB / File must be 15 MB or smaller');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = createCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Canvas ไม่พร้อมใช้งาน');
    context.drawImage(bitmap, 0, 0);
    return canvas;
  } finally { bitmap.close(); }
}

function splitSourceCanvas(): void {
  const source = sourceCanvas;
  if (!source || !grid) return;
  stickers.forEach((item) => item.canvas.remove()); stickers = []; selectedIndex = 0;
  gridCells(grid).forEach((cell, index) => { const canvas = createCanvas(cell.width, cell.height); canvas.getContext('2d')!.drawImage(source, cell.x, cell.y, cell.width, cell.height, 0, 0, cell.width, cell.height); stickers.push({ id: `${Date.now()}-${index}`, name: `sticker-${String(index + 1).padStart(2, '0')}`, canvas, transform: defaultTransform(), style: defaultStyle(), history: [] }); });
  currentStep = 'split'; renderGridOverlay(); renderWorkspace(); updateStatus(`${stickers.length} stickers split / แยก ${stickers.length} stickers แล้ว`, 'success');
}

function refreshReview(): void {
  const report = panel?.querySelector<HTMLElement>('#line-review-report'); if (!report) return;
  const results = stickers.map((item, index) => { const quality = inspectSticker(item.canvas.getContext('2d')!.getImageData(0, 0, item.canvas.width, item.canvas.height), mode === 'animated' ? ANIMATED_STICKER_PRESET : STATIC_STICKER_PRESET, item.blob?.size); return { name: `${index + 1}`, quality }; });
  const summary = createValidationSummary(results); report.innerHTML = `<strong>${summary.pass} PASS · ${summary.warning} WARNING · ${summary.fail} FAIL</strong><div>${summary.issues.map((issue) => `<p><b>${issue.level}</b> Sticker ${issue.sticker}: ${issue.detail} — ${issue.fix}</p>`).join('')}</div>`;
}

function renderGridOverlay(): void {
  const overlay = panel?.querySelector<HTMLElement>('#line-grid-overlay');
  if (!overlay || !grid) return;
  overlay.innerHTML = '';
  const source = sourceCanvas ?? stickers[0]?.canvas;
  if (!source) return;
  overlay.style.aspectRatio = `${source.width}/${source.height}`;
  [...grid.xBoundaries.slice(1, -1).map((value) => ({ axis: 'x', value, total: source.width })), ...grid.yBoundaries.slice(1, -1).map((value) => ({ axis: 'y', value, total: source.height }))].forEach((line, index) => {
    const input = document.createElement('input'); input.type = 'range'; input.min = '0'; input.max = String(line.total); input.value = String(line.value); input.step = '1'; input.className = `line-grid-handle line-grid-handle--${line.axis}`; input.dataset.axis = line.axis; input.dataset.boundary = String(line.axis === 'x' ? index : index - (grid!.xBoundaries.length - 2)); input.setAttribute('aria-label', `${line.axis === 'x' ? 'Vertical' : 'Horizontal'} grid boundary ${index + 1}`);
    input.addEventListener('input', () => { if (!grid) return; const target = line.axis === 'x' ? grid.xBoundaries : grid.yBoundaries; const boundaryIndex = Number(input.dataset.boundary); const next = moveBoundary(target, boundaryIndex + 1, Number(input.value)); if (line.axis === 'x') grid.xBoundaries = next; else grid.yBoundaries = next; renderGridOverlay(); updateStatus(`${line.axis === 'x' ? 'Vertical' : 'Horizontal'} boundary adjusted`); });
    const percent = (line.value / line.total) * 100; if (line.axis === 'x') input.style.left = `${percent}%`; else input.style.top = `${percent}%`; overlay.append(input);
  });
}

function drawCheckerboard(context: CanvasRenderingContext2D, width: number, height: number): void {
  const size = 12; context.fillStyle = '#f3f4f6'; context.fillRect(0, 0, width, height); context.fillStyle = '#d1d5db';
  for (let y = 0; y < height; y += size) for (let x = 0; x < width; x += size) if ((x / size + y / size) % 2 === 0) context.fillRect(x, y, size, size);
}

function renderSticker(item: StickerItem, target = el<HTMLCanvasElement>('#line-canvas')): void {
  const maxSide = 420; const scale = Math.min(1, maxSide / Math.max(item.canvas.width, item.canvas.height));
  target.width = Math.max(1, Math.round(item.canvas.width * scale)); target.height = Math.max(1, Math.round(item.canvas.height * scale));
  const context = target.getContext('2d', { alpha: true }); if (!context) return;
  drawCheckerboard(context, target.width, target.height); context.save(); context.translate(target.width / 2 + item.transform.offsetX * scale, target.height / 2 + item.transform.offsetY * scale); context.rotate((item.transform.rotation * Math.PI) / 180); context.scale(item.transform.flipX ? -1 : 1, item.transform.flipY ? -1 : 1);
  const drawWidth = item.canvas.width * scale * item.transform.scale; const drawHeight = item.canvas.height * scale * item.transform.scale;
  if (item.style.strokeWidth > 0) { context.globalAlpha = 0.95; context.shadowColor = item.style.strokeColor; context.shadowBlur = item.style.strokeWidth * scale; context.shadowOffsetX = 0; context.shadowOffsetY = 0; }
  context.drawImage(item.canvas, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight); context.restore();
  if (item.style.showSafeMargin) { context.save(); context.strokeStyle = '#f59e0b'; context.setLineDash([5, 5]); context.strokeRect(target.width * 0.08, target.height * 0.08, target.width * 0.84, target.height * 0.84); context.restore(); }
}

function renderThumbnails(): void {
  const rail = el<HTMLElement>('#line-thumbnails'); rail.innerHTML = '';
  stickers.forEach((item, index) => {
    const wrapper = document.createElement('article'); wrapper.className = `line-thumbnail ${index === selectedIndex ? 'is-selected' : ''}`; wrapper.dataset.index = String(index);
    const thumb = document.createElement('canvas'); thumb.width = 96; thumb.height = 96; const ctx = thumb.getContext('2d')!; drawCheckerboard(ctx, 96, 96); const ratio = Math.min(88 / item.canvas.width, 88 / item.canvas.height); ctx.drawImage(item.canvas, (96 - item.canvas.width * ratio) / 2, (96 - item.canvas.height * ratio) / 2, item.canvas.width * ratio, item.canvas.height * ratio); wrapper.append(thumb);
    const label = document.createElement('span'); label.textContent = `${String(index + 1).padStart(2, '0')} ${item.name}`; wrapper.append(label);
    const badge = document.createElement('b'); badge.className = `line-badge line-badge--${item.quality?.level?.toLowerCase() ?? 'warning'}`; badge.textContent = item.quality?.level ?? 'READY'; wrapper.append(badge);
    wrapper.addEventListener('click', () => { selectedIndex = index; renderWorkspace(); }); wrapper.addEventListener('keydown', (event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { selectedIndex = Math.min(stickers.length - 1, index + 1); renderWorkspace(); } if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { selectedIndex = Math.max(0, index - 1); renderWorkspace(); } }); wrapper.tabIndex = 0; wrapper.setAttribute('role', 'button'); rail.append(wrapper);
  });
}

function renderInspector(): void {
  const output = el<HTMLElement>('#line-inspector'); output.innerHTML = '';
  const item = stickers[selectedIndex]; if (!item) { output.textContent = 'Upload images to begin / อัปโหลดรูปเพื่อเริ่มต้น'; return; }
  const imageData = item.canvas.getContext('2d')!.getImageData(0, 0, item.canvas.width, item.canvas.height); item.quality = inspectSticker(imageData, mode === 'animated' ? ANIMATED_STICKER_PRESET : STATIC_STICKER_PRESET, item.blob?.size);
  const summary = document.createElement('div'); summary.className = `line-inspector-summary line-inspector-summary--${item.quality.level.toLowerCase()}`; summary.innerHTML = `<strong>${item.quality.level}</strong><span>${item.quality.checks.filter((check) => check.level === 'PASS').length} PASS · ${item.quality.checks.filter((check) => check.level === 'WARNING').length} WARNING · ${item.quality.checks.filter((check) => check.level === 'FAIL').length} FAIL</span>`; output.append(summary);
  item.quality.checks.forEach((check) => { const row = document.createElement('div'); row.className = 'line-inspector-row'; row.innerHTML = `<b>${check.level}</b><span><strong>${check.label}</strong><small>${check.detail}<br/>${check.fix}</small></span>`; output.append(row); });
}

function renderWorkspace(): void {
  renderThumbnails(); renderInspector(); refreshReview(); const item = stickers[selectedIndex]; if (item) renderSticker(item); const title = panel?.querySelector<HTMLElement>('#line-selected-title'); if (title) title.textContent = item ? `${String(selectedIndex + 1).padStart(2, '0')} · ${item.name}` : 'No sticker selected';
  const buttons = panel?.querySelectorAll<HTMLButtonElement>('[data-line-step]'); buttons?.forEach((button) => button.classList.toggle('is-current', button.dataset.lineStep === currentStep));
}

function updateStatus(message: string, tone: 'neutral' | 'working' | 'success' | 'error' = 'neutral'): void { if (panel) setToolStatus(el<HTMLOutputElement>('#line-status'), message, tone); }

async function loadStaticFiles(files: FileList): Promise<void> {
  const list = Array.from(files); const firstFile = list[0]; if (!firstFile) return; list.forEach(validateImageFile); sourceName = firstFile.name.replace(/\.[^.]+$/, '') || 'stickers';
  const status = el<HTMLOutputElement>('#line-status'); setProgressStatus(status, 10, 'กำลังอ่านภาพในอุปกรณ์ / Reading images locally');
  stickers.forEach((item) => item.canvas.remove()); stickers = []; selectedIndex = 0;
  if (list.length > 1) {
    for (const [index, file] of list.entries()) stickers.push({ id: `${Date.now()}-${index}`, name: file.name, canvas: await fileToCanvas(file), transform: defaultTransform(), style: defaultStyle(), history: [] });
  } else {
    sourceCanvas?.remove(); sourceCanvas = await fileToCanvas(firstFile); const rows = Number(el<HTMLSelectElement>('#line-rows').value); const columns = Number(el<HTMLSelectElement>('#line-columns').value); grid = createGrid(sourceCanvas.width, sourceCanvas.height, rows, columns); splitSourceCanvas();
  }
  renderGridOverlay(); currentStep = 'split'; renderWorkspace(); setProgressStatus(status, 100, `${stickers.length} stickers ready / พร้อม ${stickers.length} stickers`); updateStatus(`${stickers.length} stickers ready / พร้อม ${stickers.length} stickers`, 'success');
}

async function loadAnimatedFiles(files: FileList): Promise<void> {
  const list = Array.from(files); if (!list.length) return; if (list.length > 20) throw new Error('Animated preparation supports up to 20 frames');
  stickers = []; frameDurations = list.map(() => 0.2); selectedIndex = 0; for (const [index, file] of list.entries()) stickers.push({ id: `${Date.now()}-${index}`, name: file.name, canvas: await fileToCanvas(file), transform: defaultTransform(), style: defaultStyle(), history: [] });
  currentStep = 'arrange'; renderWorkspace(); updateAnimatedSummary(); updateStatus(`${stickers.length} frames ready / พร้อม ${stickers.length} frames`, 'success');
}

function updateAnimatedSummary(): void { const summary = panel?.querySelector<HTMLElement>('#line-animated-summary'); if (!summary) return; const seconds = frameDurations.reduce((sum, value) => sum + value, 0); summary.textContent = `Frames ${stickers.length} · Animation Duration ${seconds.toFixed(2)}s · Loop Count ${Number(el<HTMLInputElement>('#line-loops')?.value || 1)} · Total Playback ${seconds.toFixed(2)}s`; }

function applyTo(scope: 'current' | 'selected' | 'all', action: (item: StickerItem) => void): void { const current = stickers[selectedIndex]; const targets: StickerItem[] = scope === 'current' ? (current ? [current] : []) : scope === 'selected' ? stickers.filter((_, index) => panel?.querySelector<HTMLInputElement>(`#line-select-${index}`)?.checked) : stickers; targets.forEach((item) => { pushHistory(item); action(item); }); renderWorkspace(); }

function cleanItem(item: StickerItem): void { const ctx = item.canvas.getContext('2d')!; const imageData = ctx.getImageData(0, 0, item.canvas.width, item.canvas.height); ctx.putImageData(removeColorKey(imageData, item.style.keyColor, item.style.tolerance, item.style.feather), 0, 0); }
function autoFitItem(item: StickerItem): void { const bounds = contentBounds(item.canvas.getContext('2d')!.getImageData(0, 0, item.canvas.width, item.canvas.height)); if (!bounds) return; item.transform.scale = Math.min((item.canvas.width * 0.84) / bounds.width, (item.canvas.height * 0.84) / bounds.height); item.transform.offsetX = (item.canvas.width / 2) - (bounds.left + bounds.width / 2); item.transform.offsetY = (item.canvas.height / 2) - (bounds.top + bounds.height / 2); }

async function encodeItem(item: StickerItem): Promise<Blob> { const canvas = createCanvas(item.canvas.width, item.canvas.height); renderSticker(item, canvas); const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('PNG encoding failed')), 'image/png')); const checkBitmap = await createImageBitmap(blob); checkBitmap.close(); item.blob = blob; item.quality = inspectSticker(canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height), STATIC_STICKER_PRESET, blob.size); canvas.remove(); return blob; }

async function createResizedBlob(item: StickerItem, width: number, height: number): Promise<Blob> { const canvas = createCanvas(width, height); const ctx = canvas.getContext('2d')!; drawCheckerboard(ctx, width, height); const ratio = Math.min((width * 0.84) / item.canvas.width, (height * 0.84) / item.canvas.height) * item.transform.scale; ctx.drawImage(item.canvas, (width - item.canvas.width * ratio) / 2 + item.transform.offsetX, (height - item.canvas.height * ratio) / 2 + item.transform.offsetY, item.canvas.width * ratio, item.canvas.height * ratio); const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('PNG encoding failed')), 'image/png')); canvas.remove(); return blob; }

async function exportSet(): Promise<void> { if (!stickers.length) throw new Error('Add stickers before export'); const current = stickers[selectedIndex] ?? stickers[0]; if (!current) throw new Error('Add stickers before export'); updateStatus('Encoding and validating PNG outputs / กำลัง encode และตรวจ PNG', 'working'); const files = []; for (const [index, item] of stickers.entries()) { const blob = await encodeItem(item); files.push({ name: `stickers/${String(index + 1).padStart(2, '0')}.png`, bytes: new Uint8Array(await blob.arrayBuffer()) }); }
  const main = await createResizedBlob(current, MAIN_IMAGE_PRESET.dimensions.width, MAIN_IMAGE_PRESET.dimensions.height); const tab = await createResizedBlob(current, CHAT_THUMBNAIL_PRESET.dimensions.width, CHAT_THUMBNAIL_PRESET.dimensions.height); const summary = createValidationSummary(stickers.map((item, index) => ({ name: `${index + 1}`, quality: item.quality! }))); const report = JSON.stringify({ generatedAt: new Date().toISOString(), preset: STATIC_STICKER_PRESET.id, technicalOnly: true, summary, stickers: stickers.map((item) => ({ name: item.name, quality: item.quality })) }, null, 2); files.push({ name: 'main.png', bytes: new Uint8Array(await main.arrayBuffer()) }, { name: 'tab.png', bytes: new Uint8Array(await tab.arrayBuffer()) }, { name: 'validation-report.json', bytes: new TextEncoder().encode(report) }); const zip = createZip(files); downloadUrl(URL.createObjectURL(zip), `${sourceName}-line-stickers.zip`); const txt = `LINE Sticker Studio technical validation\nPASS ${summary.pass}\nWARNING ${summary.warning}\nFAIL ${summary.fail}\n\n${summary.issues.map((issue) => `${issue.level} ${issue.sticker}: ${issue.detail} — ${issue.fix}`).join('\n')}`; downloadUrl(URL.createObjectURL(new Blob([txt], { type: 'text/plain' })), `${sourceName}-validation.txt`); updateStatus(`ZIP ready · ${formatBytes(zip.size)} · ${summary.pass} PASS / ${summary.warning} WARNING / ${summary.fail} FAIL`, summary.fail ? 'error' : 'success'); renderWorkspace(); }

function downloadCurrent(): void { const item = stickers[selectedIndex]; if (!item?.blob) { updateStatus('Run ZIP export once to encode the current PNG / กด Export ZIP เพื่อ encode PNG ก่อน', 'error'); return; } downloadUrl(URL.createObjectURL(item.blob), `${sourceName}-${String(selectedIndex + 1).padStart(2, '0')}.png`); }
function undoCurrent(): void { const item = stickers[selectedIndex]; const state = item?.history.pop(); if (!item || !state) return; item.transform = state.transform; item.style = state.style; renderWorkspace(); updateStatus('Undo complete / ย้อนกลับแล้ว', 'success'); }
function reorder(delta: number): void { const next = selectedIndex + delta; const current = stickers[selectedIndex]; const target = stickers[next]; if (!current || !target) return; stickers[selectedIndex] = target; stickers[next] = current; selectedIndex = next; renderWorkspace(); }
function deleteCurrent(): void { if (!stickers.length) return; const removed = stickers.splice(selectedIndex, 1)[0]; if (removed) removed.canvas.remove(); selectedIndex = Math.max(0, Math.min(selectedIndex, stickers.length - 1)); renderWorkspace(); }
function duplicateCurrent(): void { const item = stickers[selectedIndex]; if (!item) return; const copy = createCanvas(item.canvas.width, item.canvas.height); copy.getContext('2d')!.drawImage(item.canvas, 0, 0); stickers.splice(selectedIndex + 1, 0, { ...item, id: `${Date.now()}-copy`, name: `${item.name}-copy`, canvas: copy, transform: cloneTransform(item.transform), style: cloneStyle(item.style), history: [] }); selectedIndex += 1; renderWorkspace(); }

function playAnimation(): void { animatedTimers.forEach(window.clearTimeout); animatedTimers = []; if (!stickers.length) return; let index = 0; const tick = (): void => { selectedIndex = index % stickers.length; renderWorkspace(); index += 1; animatedTimers.push(window.setTimeout(tick, (frameDurations[(index - 1) % frameDurations.length] || 0.2) * 1000)); }; tick(); }
function stopAnimation(): void { animatedTimers.forEach(window.clearTimeout); animatedTimers = []; }
function buildPromptUi(): void { const input = (id: string) => (el<HTMLInputElement>(id)?.value || '').trim(); const prompt = buildPrompt({ character: input('#line-prompt-character'), style: input('#line-prompt-style'), outfit: input('#line-prompt-outfit'), expressions: input('#line-prompt-expressions'), phrases: input('#line-prompt-phrases'), language: input('#line-prompt-language'), count: Number(input('#line-prompt-count') || 8), rows: Number(el<HTMLSelectElement>('#line-rows').value || 2), columns: Number(el<HTMLSelectElement>('#line-columns').value || 4), background: input('#line-prompt-background'), consistency: Array.from(panel!.querySelectorAll<HTMLInputElement>('[data-consistency]:checked')).map((node) => node.value) }); el<HTMLTextAreaElement>('#line-prompt-th').value = prompt.th; el<HTMLTextAreaElement>('#line-prompt-en').value = prompt.en; }

function bindEvents(): void {
  el<HTMLInputElement>('#line-file').addEventListener('change', (event) => { const files = (event.currentTarget as HTMLInputElement).files; if (!files) return; void (mode === 'animated' ? loadAnimatedFiles(files) : loadStaticFiles(files)).catch((error) => updateStatus(getErrorMessage(error), 'error')); });
  el<HTMLSelectElement>('#line-mode').addEventListener('change', (event) => { mode = (event.currentTarget as HTMLSelectElement).value as 'static' | 'animated'; const file = el<HTMLInputElement>('#line-file'); file.multiple = mode === 'animated'; el<HTMLElement>('#line-static-controls').hidden = mode === 'animated'; el<HTMLElement>('#line-animated-controls').hidden = mode !== 'animated'; updateStatus(mode === 'animated' ? 'Animated mode prepares and validates frames locally; APNG export is partial.' : 'Static mode supports sheet split and image sets locally.'); });
  el<HTMLButtonElement>('#line-split').addEventListener('click', () => { if (!sourceCanvas) return; const rows = Number(el<HTMLSelectElement>('#line-rows').value); const columns = Number(el<HTMLSelectElement>('#line-columns').value); grid = createGrid(sourceCanvas.width, sourceCanvas.height, rows, columns); splitSourceCanvas(); });
  el<HTMLButtonElement>('#line-equalize').addEventListener('click', () => { if (!grid || !sourceCanvas) return; grid = createGrid(sourceCanvas.width, sourceCanvas.height, grid.rows, grid.columns); splitSourceCanvas(); });
  el<HTMLButtonElement>('#line-clean').addEventListener('click', () => { const scope = el<HTMLSelectElement>('#line-scope').value as 'current' | 'selected' | 'all'; applyTo(scope, cleanItem); updateStatus('Background cleanup applied locally / ลบพื้นหลังในอุปกรณ์แล้ว', 'success'); });
  el<HTMLButtonElement>('#line-autofit').addEventListener('click', () => { const scope = el<HTMLSelectElement>('#line-scope').value as 'current' | 'selected' | 'all'; applyTo(scope, autoFitItem); updateStatus('Auto Fit applied / จัดวางอัตโนมัติแล้ว', 'success'); });
  el<HTMLButtonElement>('#line-apply-style').addEventListener('click', () => { const scope = el<HTMLSelectElement>('#line-scope').value as 'current' | 'selected' | 'all'; const style = defaultStyle(); style.keyColor = el<HTMLInputElement>('#line-key-color').value; style.tolerance = Number(el<HTMLInputElement>('#line-tolerance').value); style.feather = Number(el<HTMLInputElement>('#line-feather').value); style.strokeColor = el<HTMLInputElement>('#line-stroke-color').value; style.strokeWidth = Number(el<HTMLInputElement>('#line-stroke-width').value); style.showSafeMargin = el<HTMLInputElement>('#line-safe-margin').checked; applyTo(scope, (item) => { item.style = cloneStyle(style); }); updateStatus('Style applied / ใช้ style แล้ว', 'success'); });
  el<HTMLButtonElement>('#line-rotate').addEventListener('click', () => { const item = stickers[selectedIndex]; if (!item) return; pushHistory(item); item.transform.rotation = (item.transform.rotation + 90) % 360; renderWorkspace(); });
  el<HTMLButtonElement>('#line-flip').addEventListener('click', () => { const item = stickers[selectedIndex]; if (!item) return; pushHistory(item); item.transform.flipX = !item.transform.flipX; renderWorkspace(); });
  el<HTMLSelectElement>('#line-fit').addEventListener('change', (event) => { const item = stickers[selectedIndex]; if (!item) return; pushHistory(item); item.transform.fit = (event.currentTarget as HTMLSelectElement).value as StickerTransform['fit']; renderWorkspace(); });
  el<HTMLInputElement>('#line-zoom').addEventListener('input', (event) => { const item = stickers[selectedIndex]; if (!item) return; item.transform.scale = Number((event.currentTarget as HTMLInputElement).value) / 100; renderWorkspace(); });
  el<HTMLButtonElement>('#line-undo').addEventListener('click', undoCurrent); el<HTMLButtonElement>('#line-up').addEventListener('click', () => reorder(-1)); el<HTMLButtonElement>('#line-down').addEventListener('click', () => reorder(1)); el<HTMLButtonElement>('#line-delete').addEventListener('click', deleteCurrent); el<HTMLButtonElement>('#line-duplicate').addEventListener('click', duplicateCurrent); el<HTMLButtonElement>('#line-export-zip').addEventListener('click', () => void exportSet().catch((error) => updateStatus(getErrorMessage(error), 'error'))); el<HTMLButtonElement>('#line-download-current').addEventListener('click', downloadCurrent); el<HTMLButtonElement>('#line-play').addEventListener('click', playAnimation); el<HTMLButtonElement>('#line-stop').addEventListener('click', stopAnimation); el<HTMLButtonElement>('#line-validate-animation').addEventListener('click', () => { const checks = validateAnimatedFrames(stickers.map((item) => ({ width: item.canvas.width, height: item.canvas.height, bytes: item.blob?.size || 0, hasAlpha: inspectSticker(item.canvas.getContext('2d')!.getImageData(0, 0, item.canvas.width, item.canvas.height), ANIMATED_STICKER_PRESET).hasTransparency })), ANIMATED_STICKER_PRESET, frameDurations.reduce((sum, value) => sum + value, 0), Number(el<HTMLInputElement>('#line-loops').value)); updateStatus(checks.map((check) => `${check.level} ${check.label}: ${check.detail}`).join(' · '), checks.some((check) => check.level === 'FAIL') ? 'error' : 'success'); }); el<HTMLButtonElement>('#line-prompt-generate').addEventListener('click', buildPromptUi); el<HTMLButtonElement>('#line-prompt-copy').addEventListener('click', async () => { await navigator.clipboard.writeText(`${el<HTMLTextAreaElement>('#line-prompt-th').value}\n\n${el<HTMLTextAreaElement>('#line-prompt-en').value}`); updateStatus('Prompt copied / คัดลอก prompt แล้ว', 'success'); });
  el<HTMLButtonElement>('#line-review-refresh').addEventListener('click', refreshReview); el<HTMLButtonElement>('#line-fix-next').addEventListener('click', () => { const index = stickers.findIndex((item) => item.quality?.level !== 'PASS'); if (index >= 0) { selectedIndex = index; currentStep = 'edit'; renderWorkspace(); el<HTMLElement>('[data-line-section="edit"]').scrollIntoView({ behavior: 'smooth', block: 'start' }); } else updateStatus('No failing or warning sticker found / ไม่พบปัญหาที่ต้องแก้', 'success'); });
  panel!.querySelectorAll<HTMLButtonElement>('[data-line-step]').forEach((button) => button.addEventListener('click', () => { currentStep = button.dataset.lineStep || currentStep; const step = panel!.querySelector<HTMLElement>(`[data-line-section="${currentStep}"]`); step?.scrollIntoView({ behavior: 'smooth', block: 'start' }); renderWorkspace(); }));
}

const tool: ToolModule = {
  metadata,
  mount(container: HTMLElement) {
    panel = document.createElement('section'); panel.className = 'utility-panel line-sticker-studio';
    panel.innerHTML = `<div class="utility-panel__header line-studio-header"><div><p class="eyebrow">Local Sticker Workspace</p><h2>LINE Sticker Studio</h2><p class="helper-text">Split, clean, edit, inspect and export locally. No upload, no AI server, no account.</p></div><span class="privacy-badge">Local-only / ไม่อัปโหลด</span></div><div class="line-mode-row"><label class="field"><span>Mode</span><select id="line-mode"><option value="static">Static stickers</option><option value="animated">Animated frame preparation</option></select></label><p class="helper-text">Technical preset only; LINE human review is not automatically verified.</p></div><nav class="line-steps" aria-label="Sticker workflow"><button type="button" data-line-step="upload">1 Upload</button><button type="button" data-line-step="split">2 Split</button><button type="button" data-line-step="edit">3 Edit</button><button type="button" data-line-step="review">4 Review</button><button type="button" data-line-step="export">5 Export</button></nav><section data-line-section="upload" class="line-section"><h3>Upload / นำเข้า</h3><label class="file-drop" for="line-file"><strong>Choose PNG, JPEG or WebP</strong><span>Sticker sheet, multiple images, or animation frames</span><input id="line-file" type="file" accept="image/png,image/jpeg,image/webp" multiple /></label><div class="line-privacy-note">ภาพอยู่ใน browser เท่านั้น / Images stay in this browser. Prompt Studio does not call an AI API.</div><div id="line-static-controls"><div class="line-control-grid"><label class="field"><span>Rows</span><select id="line-rows"><option>1</option><option selected>2</option><option>3</option><option>4</option></select></label><label class="field"><span>Columns</span><select id="line-columns"><option>1</option><option>2</option><option selected>4</option><option>3</option><option>4</option></select></label><button id="line-split" class="button" type="button">Apply grid</button><button id="line-equalize" class="button" type="button">Equalize grid</button></div><div id="line-grid-overlay" class="line-grid-overlay" aria-label="Adjustable grid boundaries"></div></div><div id="line-animated-controls" hidden><label class="field"><span>Loop count</span><input id="line-loops" type="number" min="1" max="4" value="1" /></label><p id="line-animated-summary" class="helper-text">Frames 0 · Animation Duration 0s</p><button id="line-validate-animation" class="button" type="button">Validate frames</button><button id="line-play" class="button" type="button">Play</button><button id="line-stop" class="button" type="button">Pause</button></div></section><section data-line-section="split" class="line-section"><h3>Sticker navigator / รายการ stickers</h3><div id="line-thumbnails" class="line-thumbnail-rail"></div><div class="line-toolbar"><button id="line-up" class="button" type="button">Move up</button><button id="line-down" class="button" type="button">Move down</button><button id="line-duplicate" class="button" type="button">Duplicate</button><button id="line-delete" class="button" type="button">Delete</button></div></section><section data-line-section="edit" class="line-section"><div class="line-editor-layout"><aside><h3>Sticker list</h3><div id="line-thumbnails-side" class="line-thumbnail-rail"></div></aside><div class="line-canvas-wrap"><h3 id="line-selected-title">No sticker selected</h3><div class="line-canvas-stage"><canvas id="line-canvas" width="320" height="320" aria-label="Sticker preview"></canvas></div><p class="helper-text">Checkerboard shows transparency. Dashed line shows the technical safe margin.</p></div><aside class="line-inspector-panel"><h3>Inspector / ตรวจคุณภาพ</h3><div id="line-inspector">Upload images to begin</div></aside></div><div class="line-control-grid"><label class="field"><span>Zoom</span><input id="line-zoom" type="range" min="50" max="180" value="100" /></label><label class="field"><span>Fit</span><select id="line-fit"><option value="contain">Contain</option><option value="cover">Cover</option></select></label><button id="line-rotate" class="button" type="button">Rotate</button><button id="line-flip" class="button" type="button">Flip horizontal</button><button id="line-undo" class="button" type="button">Undo</button></div><div class="line-style-controls"><label class="field"><span>Key color</span><input id="line-key-color" type="color" value="#ffffff" /></label><label class="field"><span>Tolerance</span><input id="line-tolerance" type="range" min="0" max="160" value="35" /></label><label class="field"><span>Feather</span><input id="line-feather" type="range" min="1" max="40" value="10" /></label><label class="field"><span>Stroke color</span><input id="line-stroke-color" type="color" value="#ffffff" /></label><label class="field"><span>Stroke width</span><input id="line-stroke-width" type="range" min="0" max="24" value="0" /></label><label class="field"><span>Safe margin <input id="line-safe-margin" type="checkbox" checked /></span></label><label class="field"><span>Apply scope</span><select id="line-scope"><option value="current">Current</option><option value="all">All</option></select></label><button id="line-clean" class="button" type="button">Clean white background</button><button id="line-autofit" class="button" type="button">Auto Fit</button><button id="line-apply-style" class="button" type="button">Apply style</button></div></section><section data-line-section="review" class="line-section"><h3>Review / ตรวจทั้งชุด</h3><div class="line-review-summary"><p>Technical checks are local and do not guarantee LINE content approval.</p><div id="line-review-report"></div></div><button class="button" type="button" id="line-review-refresh">Refresh validation</button><button class="button" type="button" id="line-fix-next">Fix next issue</button></section><section data-line-section="export" class="line-section"><h3>Export / ส่งออก</h3><div class="line-export-grid"><button id="line-export-zip" class="button button--primary" type="button">Export PNG + ZIP + reports</button><button id="line-download-current" class="button" type="button">Download current PNG</button></div><p class="helper-text">ZIP contains stickers/01.png, main.png, tab.png, and validation-report.json. APNG export is partial and not advertised as ready.</p></section><section class="line-prompt"><h3>Prompt Studio</h3><p class="helper-text">สร้าง prompt ให้ copy ไปใช้กับ image generator เอง; ไม่มีการเรียก AI API จากเครื่องมือนี้</p><div class="line-control-grid"><label class="field"><span>Character</span><input id="line-prompt-character" placeholder="friendly cat" /></label><label class="field"><span>Style</span><input id="line-prompt-style" placeholder="clean cartoon" /></label><label class="field"><span>Outfit</span><input id="line-prompt-outfit" placeholder="blue hoodie" /></label><label class="field"><span>Expressions</span><input id="line-prompt-expressions" placeholder="happy, sorry, thanks" /></label><label class="field"><span>Phrases</span><input id="line-prompt-phrases" placeholder="สวัสดี, ขอบคุณ, โอเค" /></label><label class="field"><span>Language</span><input id="line-prompt-language" value="Thai" /></label><label class="field"><span>Count</span><input id="line-prompt-count" type="number" min="1" max="40" value="8" /></label><label class="field"><span>Background</span><input id="line-prompt-background" value="transparent" /></label></div><fieldset><legend>Consistency helpers</legend><label><input type="checkbox" data-consistency value="same character" checked /> same character</label><label><input type="checkbox" data-consistency value="same hairstyle" checked /> same hairstyle</label><label><input type="checkbox" data-consistency value="same colors" checked /> same colors</label><label><input type="checkbox" data-consistency value="same rendering style" checked /> same rendering style</label><label><input type="checkbox" data-consistency value="no extra characters or text" checked /> no extra characters or text</label></fieldset><button id="line-prompt-generate" class="button" type="button">Generate prompt</button><button id="line-prompt-copy" class="button" type="button">Copy prompt</button><label class="field"><span>Thai prompt</span><textarea id="line-prompt-th" rows="4"></textarea></label><label class="field"><span>English prompt</span><textarea id="line-prompt-en" rows="4"></textarea></label><p id="line-status" class="tool-status" aria-live="polite">Choose images to begin / เลือกรูปเพื่อเริ่มต้น</p></section>`;
    container.append(panel); bindEvents(); renderWorkspace();
  },
  unmount() { stopAnimation(); stickers.forEach((item) => item.canvas.remove()); sourceCanvas?.remove(); sourceCanvas = undefined; stickers = []; grid = undefined; panel?.remove(); panel = undefined; },
};

export const { mount, unmount } = tool;
export { metadata };
export default tool;
