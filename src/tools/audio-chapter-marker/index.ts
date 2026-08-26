import type { ToolModule } from '../../core/tool-contract';
import { audioCapabilityHint, decodeAudioFile } from '../../core/audio-decoder';
import { downloadUrl, getErrorMessage, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

interface Marker { time: number; title: string; note: string; }
let panel: HTMLElement | undefined; let audioUrl = ''; let markers: Marker[] = []; let audio: HTMLAudioElement | undefined; let decodeRequest = 0;

function formatTime(value: number): string { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${(value % 60).toFixed(2).padStart(5, '0')}`; }
function renderMarkers(): void {
  const list = panel?.querySelector<HTMLElement>('#chapter-list');
  if (!list) return;
  list.replaceChildren();
  markers.forEach((marker, index) => {
    const row = document.createElement('li');
    const seek = document.createElement('button');
    seek.className = 'text-button'; seek.type = 'button'; seek.dataset.chapterAction = 'seek'; seek.dataset.index = String(index); seek.textContent = formatTime(marker.time); seek.setAttribute('aria-label', `ไปยัง marker ${formatTime(marker.time)}`);
    const titleLabel = document.createElement('label');
    const titleText = document.createElement('span'); titleText.className = 'visually-hidden'; titleText.textContent = 'Title';
    const titleInput = document.createElement('input'); titleInput.dataset.markerField = 'title'; titleInput.dataset.index = String(index); titleInput.value = marker.title; titleInput.setAttribute('aria-label', `ชื่อ marker ${index + 1}`);
    titleLabel.append(titleText, titleInput);
    const noteLabel = document.createElement('label');
    const noteText = document.createElement('span'); noteText.className = 'visually-hidden'; noteText.textContent = 'Note';
    const noteInput = document.createElement('input'); noteInput.dataset.markerField = 'note'; noteInput.dataset.index = String(index); noteInput.value = marker.note; noteInput.placeholder = 'Note / หมายเหตุ'; noteInput.setAttribute('aria-label', `หมายเหตุ marker ${index + 1}`);
    noteLabel.append(noteText, noteInput);
    const remove = document.createElement('button'); remove.className = 'text-button'; remove.type = 'button'; remove.dataset.chapterAction = 'remove'; remove.dataset.index = String(index); remove.textContent = 'ลบ / Remove'; remove.setAttribute('aria-label', `ลบ marker ${index + 1}`);
    row.append(seek, titleLabel, noteLabel, remove);
    list.append(row);
  });
}
function downloadCue(format: 'json' | 'csv' | 'txt'): void { const name = (panel?.querySelector<HTMLInputElement>('#chapter-name')?.value || 'audio-chapters').trim(); let content = ''; let type = 'text/plain'; if (format === 'json') { content = JSON.stringify({ title: name, markers }, null, 2); type = 'application/json'; } else if (format === 'csv') { content = ['time,title,note', ...markers.map((marker) => `${marker.time.toFixed(3)},"${marker.title.replace(/"/g, '""')}","${marker.note.replace(/"/g, '""')}"`)].join('\n'); type = 'text/csv'; } else content = markers.map((marker) => `${formatTime(marker.time)}\t${marker.title}${marker.note ? `\t${marker.note}` : ''}`).join('\n'); const url = URL.createObjectURL(new Blob([content], { type })); downloadUrl(url, `${name.replace(/\s+/g, '-').toLowerCase()}.${format}`); setTimeout(() => URL.revokeObjectURL(url), 0); }

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section'); panel.className = 'utility-panel';
    panel.innerHTML = `<div class="utility-panel__header"><div><p class="eyebrow">Audio structure</p><h2>ทำ Chapter ให้เสียง / Cue sheet</h2><p class="helper-text">วาง marker ระหว่างฟังเสียง แล้วส่งออกเป็น JSON, CSV หรือ TXT โดยไม่อัปโหลดไฟล์</p></div></div><label class="file-drop" for="chapter-file"><strong>เลือกไฟล์เสียง / Select audio</strong><span>MP3, WAV, M4A, OGG, WebM</span><input id="chapter-file" type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm" /></label><p class="helper-text">Supported on this browser (playback hint) / คำใบ้การเล่นบน Browser นี้: ${audioCapabilityHint()}</p><label class="field" for="chapter-name"><span>ชื่อรายการ / Project title</span><input id="chapter-name" value="audio-chapters" /></label><div class="audio-preview-row"><audio id="chapter-audio" controls preload="metadata"></audio><button class="button button--primary" type="button" data-chapter-action="add">เพิ่ม marker ณ เวลาปัจจุบัน / Add marker</button></div><div class="chapter-timeline"><input id="chapter-scrubber" type="range" min="0" max="1" step="0.01" value="0" aria-label="Chapter timeline" /><output id="chapter-time">00:00.00</output></div><ol id="chapter-list" class="chapter-list"></ol><div class="tool-actions"><button class="button" type="button" data-chapter-action="export-json">Export JSON</button><button class="button" type="button" data-chapter-action="export-csv">Export CSV</button><button class="button" type="button" data-chapter-action="export-txt">Export TXT</button><button class="text-button" type="button" data-chapter-action="clear">ล้าง markers / Clear</button></div><output id="chapter-status" class="tool-status" aria-live="polite">เลือกเสียงเพื่อเริ่มต้น / Choose audio to begin</output>`;
    audio = panel.querySelector<HTMLAudioElement>('#chapter-audio')!;
    panel.querySelector<HTMLInputElement>('#chapter-file')?.addEventListener('change', (event) => { const file = (event.currentTarget as HTMLInputElement).files?.[0]; const player = audio; if (!file || !player) return; const request = ++decodeRequest; if (audioUrl) URL.revokeObjectURL(audioUrl); audioUrl = URL.createObjectURL(file); markers = []; renderMarkers(); const status = panel!.querySelector<HTMLOutputElement>('#chapter-status')!; setToolStatus(status, 'กำลังตรวจ codec และอ่าน metadata / Checking codec and metadata', 'working'); void decodeAudioFile(file).then(() => { if (request === decodeRequest && panel) { player.src = audioUrl; player.load(); setToolStatus(status, 'ไฟล์เสียงพร้อมแล้ว / Audio ready', 'success'); } }).catch((error: unknown) => { if (request === decodeRequest && panel) setToolStatus(status, getErrorMessage(error), 'error'); }); });
    const player = audio;
    player.addEventListener('timeupdate', () => { const scrubber = panel?.querySelector<HTMLInputElement>('#chapter-scrubber'); const time = panel?.querySelector<HTMLOutputElement>('#chapter-time'); if (scrubber) { scrubber.max = String(player.duration || 1); scrubber.value = String(player.currentTime); } if (time) time.textContent = formatTime(player.currentTime); });
    panel.querySelector<HTMLInputElement>('#chapter-scrubber')?.addEventListener('input', (event) => { player.currentTime = Number((event.currentTarget as HTMLInputElement).value); });
    panel.addEventListener('input', (event) => { const target = event.target as HTMLInputElement; const index = Number(target.dataset.index); const field = target.dataset.markerField; if (field && markers[index]) markers[index][field as 'title' | 'note'] = target.value; });
    panel.addEventListener('click', (event) => { const target = event.target as HTMLElement; const action = target.closest<HTMLElement>('[data-chapter-action]')?.dataset.chapterAction; if (!action) return; const status = panel!.querySelector<HTMLOutputElement>('#chapter-status')!; try { const index = Number(target.closest<HTMLElement>('[data-index]')?.dataset.index); if (action === 'add') { const player = audio; if (!player?.src) throw new Error('กรุณาเลือกไฟล์เสียง'); markers.push({ time: player.currentTime, title: `Chapter ${markers.length + 1}`, note: '' }); markers.sort((a, b) => a.time - b.time); renderMarkers(); setToolStatus(status, 'เพิ่ม marker แล้ว / Marker added', 'success'); } if (action === 'seek' && markers[index] && audio) audio.currentTime = markers[index].time; if (action === 'remove') { markers.splice(index, 1); renderMarkers(); } if (action === 'export-json') downloadCue('json'); if (action === 'export-csv') downloadCue('csv'); if (action === 'export-txt') downloadCue('txt'); if (action === 'clear') { markers = []; renderMarkers(); } } catch (error) { setToolStatus(status, getErrorMessage(error), 'error'); } });
    container.append(panel);
  },
  unmount() { decodeRequest += 1; if (audioUrl) URL.revokeObjectURL(audioUrl); panel?.remove(); panel = undefined; audio = undefined; markers = []; audioUrl = ''; },
};

export const { mount, unmount } = tool;
export { metadata };
