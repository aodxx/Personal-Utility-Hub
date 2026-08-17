import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ToolModule } from '../../core/tool-contract';
import { metadata } from './metadata';
import { createProject, uid, type GeometryType, type MappingProject } from './schema';
import { ProjectStore, AutosaveController } from './storage';
import { pointsWithinRadius } from './geometry';
import { download, encryptBackup, exportBackup, exportCSV, exportGeoJSON, exportKML, isBackup } from './export';

let activeUnmount: (() => void) | undefined;
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
const tabNames = ['Map', 'Add', 'Layers', 'Records', 'Analyze'] as const;
type TabName = (typeof tabNames)[number];

class CommunityMappingController {
  private project: MappingProject = createProject();
  private map?: L.Map;
  private layerGroup?: L.LayerGroup;
  private basemap?: L.TileLayer;
  private drawing: L.LatLng[] = [];
  private drawingMode: GeometryType | undefined;
  private selectedLayerId: string;
  private activeTab: TabName = 'Map';
  private labelsVisible = true;
  private onlineBasemapEnabled = false;
  private status = '';
  private readonly store = new ProjectStore();
  private readonly autosave = new AutosaveController(this.store, () => this.setStatus('บันทึกในอุปกรณ์แล้ว · Saved locally'));

  constructor(private readonly container: HTMLElement) { this.selectedLayerId = this.project.layers[0]?.id ?? ''; }

  async mount(): Promise<void> {
    this.project = await this.store.get() ?? this.project;
    this.selectedLayerId = this.project.layers[0]?.id ?? '';
    this.render();
  }

  unmount(): void { this.autosave.dispose(); this.map?.remove(); this.map = undefined; activeUnmount = undefined; }

  private setStatus(message: string): void {
    this.status = message;
    const output = this.container.querySelector<HTMLOutputElement>('[data-map-status]');
    if (output) output.textContent = message;
    const mode = this.container.querySelector<HTMLElement>('[data-mode-status]');
    if (mode) mode.textContent = this.drawingMode ? `กำลังวาด ${this.drawingMode} · กด Finish เมื่อเสร็จ` : 'เลือกโหมดเพื่อเริ่มสำรวจ';
  }

  private render(): void {
    this.map?.remove();
    this.map = undefined;
    this.basemap = undefined;
    this.container.innerHTML = `<section class="community-map-tool" aria-labelledby="community-map-title">
      <header class="community-map-header">
        <div><p class="eyebrow">LOCAL-FIRST FIELDWORK WORKSPACE</p><h2 id="community-map-title">แผนที่ชุมชนภาคสนาม</h2><p>วางหมุด วาดพื้นที่ และวิเคราะห์ข้อมูลชุมชนบนอุปกรณ์ของคุณ</p></div>
        <div class="community-map-header-actions"><span class="community-map-save-state" data-map-status aria-live="polite">${escapeHtml(this.status || 'ข้อมูลอยู่ในเครื่องนี้เท่านั้น · Local only')}</span><button class="button button--secondary" data-action="new-project">สร้าง project ใหม่</button></div>
      </header>
      <div class="community-map-privacy"><strong>Privacy Canvas</strong><span>ไม่เรียก tile และไม่ส่ง records ออกนอกเครื่องจนกว่าคุณจะเปิด Online Basemap</span><span class="community-map-mode-pill">${this.onlineBasemapEnabled ? 'Online Basemap เปิดอยู่' : 'Offline Canvas'}</span></div>
      <div class="community-map-shell">
        <aside class="community-map-sidebar" aria-label="Community Mapping controls">
          <div class="community-map-project-card"><span class="eyebrow">CURRENT PROJECT</span><strong>${escapeHtml(this.project.name)}</strong><small>${this.project.features.length} features · ${this.project.layers.length} layers</small></div>
          <div class="community-map-command-grid" aria-label="Map modes">
            <button type="button" class="button button--secondary community-map-command is-active" data-tab="Map">🧭<span>ดูแผนที่</span></button>
            <button type="button" class="button button--secondary community-map-command" data-draw="Point">📌<span>วางสถานที่</span></button>
            <button type="button" class="button button--secondary community-map-command" data-draw="Polygon">⬡<span>วาดพื้นที่</span></button>
            <button type="button" class="button button--secondary community-map-command" data-draw="LineString">〰<span>วาดเส้นทาง</span></button>
          </div>
          <div class="community-map-quick-actions"><button class="button button--secondary" data-action="import-trigger">📥 นำเข้า JSON</button><input type="file" accept="application/json,.json" data-import-file hidden><button class="button button--secondary" data-action="backup">💾 บันทึก</button><button class="button button--secondary" data-action="clear">🗑 ล้างข้อมูล</button></div>
          <section class="community-map-stats" aria-label="Feature statistics"><h3>สถิติข้อมูลพื้นที่</h3><div class="community-map-stat-grid"><span><b>${this.countGeometry('Point')}</b><small>Points</small></span><span><b>${this.countGeometry('Polygon')}</b><small>พื้นที่</small></span><span><b>${this.countGeometry('LineString')}</b><small>เส้นทาง</small></span></div></section>
          <section class="community-map-filter-panel"><h3>ค้นหาและคัดกรอง</h3><input type="search" placeholder="ค้นหา ID หรือข้อมูล..." aria-label="ค้นหา records" data-search><select aria-label="กรองตาม layer" data-filter-layer><option value="all">ทุก layer</option>${this.project.layers.map((layer) => `<option value="${escapeHtml(layer.id)}">${escapeHtml(layer.name)}</option>`).join('')}</select><select aria-label="กรองตาม geometry" data-filter-geometry><option value="all">ทุกประเภท geometry</option><option value="Point">Point</option><option value="LineString">LineString</option><option value="Polygon">Polygon</option></select></section>
          <nav class="community-map-tabs" aria-label="Community Mapping sections">${tabNames.map((tab) => `<button type="button" class="button button--secondary ${this.activeTab === tab ? 'is-active' : ''}" data-tab="${tab}">${tab === 'Map' ? 'แผนที่' : tab === 'Add' ? 'เพิ่มข้อมูล' : tab === 'Layers' ? 'Layers' : tab === 'Records' ? 'Records' : 'วิเคราะห์'}</button>`).join('')}</nav>
        </aside>
        <main class="community-map-main"><div class="community-map-map-toolbar"><div><strong>แผนที่ชุมชน</strong><span data-mode-status>เลือกโหมดเพื่อเริ่มสำรวจ</span></div><div class="community-map-map-actions"><button class="button button--secondary" data-action="toggle-labels">👁️ ${this.labelsVisible ? 'ปิด' : 'เปิด'}ป้ายชื่อ</button><button class="button button--secondary" data-action="locate">🧭 หาพิกัดฉัน</button><button class="button" data-action="online">${this.onlineBasemapEnabled ? 'ปิด Online Basemap' : 'เปิด Online Basemap'}</button></div></div><div class="community-map-canvas" data-map-host aria-label="Community map canvas"></div><div class="community-map-map-footer"><span>${this.onlineBasemapEnabled ? 'Online tiles อาจเห็น viewport ของคุณ' : 'Privacy Canvas · ไม่มี external tile requests'}</span><button class="button button--secondary" data-action="finish">Finish</button><button class="button button--secondary" data-action="cancel">Cancel</button></div></main>
      </div>
      <div class="community-map-mobile-actions"><button class="button" data-draw="Point">📌 วางจุด</button><button class="button" data-draw="Polygon">⬡ วาดพื้นที่</button><button class="button" data-draw="LineString">〰 วาดเส้น</button><button class="button button--secondary" data-tab="Analyze">วิเคราะห์</button></div>
      <div class="community-map-panel-stack">${this.renderPanel('Map')} ${this.renderPanel('Add')} ${this.renderPanel('Layers')} ${this.renderPanel('Records')} ${this.renderPanel('Analyze')}</div>
    </section>`;
    this.bind();
    this.initMap();
  }

  private renderPanel(tab: TabName): string {
    const hidden = this.activeTab === tab ? '' : ' hidden';
    if (tab === 'Map') return `<section class="community-map-panel" data-panel="Map"${hidden}><h3>เริ่มสำรวจพื้นที่</h3><p>เลือกโหมดจากแผงด้านข้างหรือปุ่มลอยบนมือถือ แล้วแตะบนแผนที่เพื่อสร้างข้อมูล</p><div class="community-map-guide"><span><b>01</b> กำหนดอาณาเขต</span><span><b>02</b> ปักหมุด/วาดเส้น</span><span><b>03</b> วิเคราะห์และส่งออก</span></div><div class="community-map-export-actions"><button class="button button--secondary" data-action="geojson">GeoJSON</button><button class="button button--secondary" data-action="kml">KML</button><button class="button button--secondary" data-action="csv">CSV</button><button class="button button--secondary" data-action="encrypted">Encrypted backup</button></div></section>`;
    if (tab === 'Add') return `<section class="community-map-panel" data-panel="Add"${hidden}><h3>เพิ่มข้อมูลภาคสนาม</h3><p>การวาดจะถูกบันทึกใน IndexedDB หลังจากสร้าง geometry สำเร็จ</p><div class="community-map-draw"><button class="button" data-draw="Point">เพิ่ม Point</button><button class="button" data-draw="LineString">วาดเส้น</button><button class="button" data-draw="Polygon">วาดพื้นที่</button></div><output class="community-map-help">${escapeHtml(this.status || 'เลือก layer ก่อนเริ่มงานภาคสนาม')}</output></section>`;
    if (tab === 'Layers') return `<section class="community-map-panel" data-panel="Layers"${hidden}><h3>Layers และ schema</h3><form data-form="layer"><input name="name" required placeholder="ชื่อ layer ใหม่" aria-label="ชื่อ layer ใหม่"><select name="geometry" aria-label="ประเภท geometry"><option>Point</option><option>LineString</option><option>Polygon</option></select><button class="button" type="submit">เพิ่ม layer</button></form><div class="community-map-list">${this.project.layers.map((layer) => `<label><input type="radio" name="active-layer" value="${layer.id}" ${layer.id === this.selectedLayerId ? 'checked' : ''}> ${escapeHtml(layer.name)} · ${layer.geometry}</label>`).join('')}</div><h3>Custom Schema Builder</h3><form data-form="field"><input name="name" required placeholder="ชื่อ field" aria-label="ชื่อ field"><select name="type" aria-label="ประเภท field"><option value="text">Text</option><option value="number">Number</option><option value="boolean">Boolean</option><option value="date">Date</option></select><button class="button" type="submit">เพิ่ม field</button></form><p>${this.project.schema.map((field) => `${escapeHtml(field.name)} · ${field.type}`).join(' · ') || 'ยังไม่มี custom fields'}</p></section>`;
    if (tab === 'Records') return `<section class="community-map-panel" data-panel="Records"${hidden}><h3>Records จากพื้นที่จริง</h3><p data-record-count>${this.project.records.length} records จาก ${this.project.features.length} features</p><ol data-record-list>${this.renderFeatureList()}</ol></section>`;
    return `<section class="community-map-panel" data-panel="Analyze"${hidden}><h3>วิเคราะห์ชุมชน</h3><div class="community-map-analysis"><h4>Point-in-Polygon</h4><p>ใช้ pure geometry ใน browser และถือ boundary เป็น inside</p><h4>Radius</h4><label>รัศมีเมตร <input type="number" value="1000" min="1" data-radius></label><button class="button" data-action="radius">คำนวณจาก Point แรก</button><output data-analysis-status></output></div></section>`;
  }

  private renderFeatureList(): string {
    const search = this.container.querySelector<HTMLInputElement>('[data-search]')?.value.trim().toLowerCase() ?? '';
    const layer = this.container.querySelector<HTMLSelectElement>('[data-filter-layer]')?.value ?? 'all';
    const geometry = this.container.querySelector<HTMLSelectElement>('[data-filter-geometry]')?.value ?? 'all';
    const filtered = this.project.features.filter((feature) => (layer === 'all' || feature.layerId === layer) && (geometry === 'all' || feature.geometry.type === geometry) && (!search || `${feature.id} ${JSON.stringify(feature.properties)}`.toLowerCase().includes(search)));
    return filtered.map((feature) => `<li>${feature.geometry.type} · ${escapeHtml(feature.id)}</li>`).join('') || '<li>ไม่มีข้อมูลสอดคล้อง</li>';
  }

  private countGeometry(type: GeometryType): number { return this.project.features.filter((feature) => feature.geometry.type === type).length; }

  private bind(): void {
    this.container.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => button.addEventListener('click', () => { this.activeTab = button.dataset.tab as TabName; this.render(); }));
    this.container.querySelectorAll<HTMLButtonElement>('[data-draw]').forEach((button) => button.addEventListener('click', () => { this.activeTab = 'Map'; this.drawingMode = button.dataset.draw as GeometryType; this.drawing = []; this.setStatus(`กำลังวาด ${this.drawingMode} · แตะบนแผนที่แล้วกด Finish`); }));
    this.container.querySelector<HTMLButtonElement>('[data-action="finish"]')?.addEventListener('click', () => this.finishDrawing());
    this.container.querySelector<HTMLButtonElement>('[data-action="cancel"]')?.addEventListener('click', () => { this.drawing = []; this.drawingMode = undefined; this.setStatus('ยกเลิกการวาดแล้ว'); });
    this.container.querySelector<HTMLButtonElement>('[data-action="online"]')?.addEventListener('click', () => { this.onlineBasemapEnabled = !this.onlineBasemapEnabled; this.render(); this.setStatus(this.onlineBasemapEnabled ? 'Online Basemap เปิดแล้ว · provider อาจเห็น viewport' : 'กลับสู่ Privacy Canvas แล้ว'); });
    this.container.querySelector<HTMLButtonElement>('[data-action="toggle-labels"]')?.addEventListener('click', () => { this.labelsVisible = !this.labelsVisible; this.renderMapFeatures(); this.render(); });
    this.container.querySelector<HTMLButtonElement>('[data-action="locate"]')?.addEventListener('click', () => { navigator.geolocation?.getCurrentPosition((position) => this.map?.setView([position.coords.latitude, position.coords.longitude], 16), () => this.setStatus('ไม่สามารถอ่านพิกัดอุปกรณ์ได้')); });
    this.container.querySelector<HTMLButtonElement>('[data-action="import-trigger"]')?.addEventListener('click', () => this.container.querySelector<HTMLInputElement>('[data-import-file]')?.click());
    this.container.querySelector<HTMLInputElement>('[data-import-file]')?.addEventListener('change', async (event) => { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; try { const parsed: unknown = JSON.parse(await file.text()); if (!isBackup(parsed)) throw new Error('ไฟล์นี้ไม่ใช่ Community Mapping backup'); this.project = parsed.project; this.selectedLayerId = this.project.layers[0]?.id ?? ''; this.autosave.schedule(this.project); this.setStatus('นำเข้า backup สำเร็จในเครื่องนี้'); this.render(); } catch (error) { this.setStatus(error instanceof Error ? error.message : 'นำเข้าไม่สำเร็จ'); } });
    this.container.querySelector<HTMLButtonElement>('[data-action="clear"]')?.addEventListener('click', () => { if (!window.confirm('ล้างข้อมูล project นี้จากอุปกรณ์หรือไม่?')) return; this.project = createProject(); this.selectedLayerId = this.project.layers[0]?.id ?? ''; this.autosave.schedule(this.project); this.setStatus('ล้างข้อมูลแล้ว'); this.render(); });
    this.container.querySelector<HTMLButtonElement>('[data-action="new-project"]')?.addEventListener('click', () => { const name = window.prompt('ชื่อ project ใหม่', 'Community Survey'); if (name?.trim()) { this.project = createProject(name.trim()); this.selectedLayerId = this.project.layers[0]?.id ?? ''; this.autosave.schedule(this.project); this.render(); } });
    this.container.querySelector<HTMLButtonElement>('[data-action="backup"]')?.addEventListener('click', () => { this.autosave.schedule(this.project); download('community-map.json', exportBackup(this.project), 'application/json'); this.setStatus('ดาวน์โหลด backup แล้ว'); });
    this.container.querySelector<HTMLButtonElement>('[data-action="geojson"]')?.addEventListener('click', () => download('community-map.geojson', exportGeoJSON(this.project), 'application/geo+json'));
    this.container.querySelector<HTMLButtonElement>('[data-action="kml"]')?.addEventListener('click', () => download('community-map.kml', exportKML(this.project), 'application/vnd.google-earth.kml+xml'));
    this.container.querySelector<HTMLButtonElement>('[data-action="csv"]')?.addEventListener('click', () => download('community-map.csv', exportCSV(this.project), 'text/csv'));
    this.container.querySelector<HTMLButtonElement>('[data-action="encrypted"]')?.addEventListener('click', async () => { const password = window.prompt('ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร'); if (!password) return; try { download('community-map.encrypted.json', await encryptBackup(this.project, password), 'application/json'); this.setStatus('สร้าง encrypted backup แบบ local แล้ว'); } catch (error) { this.setStatus(error instanceof Error ? error.message : 'สร้าง encrypted backup ไม่สำเร็จ'); } });
    this.container.querySelector<HTMLInputElement>('[data-search]')?.addEventListener('input', () => this.refreshRecordList());
    this.container.querySelector<HTMLSelectElement>('[data-filter-layer]')?.addEventListener('change', () => this.refreshRecordList());
    this.container.querySelector<HTMLSelectElement>('[data-filter-geometry]')?.addEventListener('change', () => this.refreshRecordList());
    this.container.querySelector<HTMLButtonElement>('[data-action="radius"]')?.addEventListener('click', () => { const first = this.project.features.find((feature) => feature.geometry.type === 'Point'); const center = first?.geometry.type === 'Point' ? first.geometry.coordinates : undefined; const radius = Number(this.container.querySelector<HTMLInputElement>('[data-radius]')?.value ?? 1000); const count = center ? pointsWithinRadius(this.project.features, center, radius).length : 0; const output = this.container.querySelector<HTMLOutputElement>('[data-analysis-status]'); if (output) output.textContent = `พบ ${count} features ในรัศมี ${radius} m`; });
    this.container.querySelectorAll<HTMLInputElement>('[name="active-layer"]').forEach((input) => input.addEventListener('change', () => { this.selectedLayerId = input.value; }));
    this.container.querySelector<HTMLFormElement>('[data-form="layer"]')?.addEventListener('submit', (event) => { event.preventDefault(); const form = new FormData(event.currentTarget as HTMLFormElement); const name = String(form.get('name') ?? '').trim(); if (!name) return; this.project.layers.push({ id: uid('layer'), name, geometry: String(form.get('geometry')) as GeometryType, color: '#2563eb', visible: true }); this.selectedLayerId = this.project.layers.at(-1)?.id ?? this.selectedLayerId; this.autosave.schedule(this.project); this.render(); });
    this.container.querySelector<HTMLFormElement>('[data-form="field"]')?.addEventListener('submit', (event) => { event.preventDefault(); const form = new FormData(event.currentTarget as HTMLFormElement); const name = String(form.get('name') ?? '').trim(); if (!name) return; this.project.schema.push({ id: uid('field'), name, type: String(form.get('type')) as 'text' | 'number' | 'boolean' | 'date', required: false }); this.autosave.schedule(this.project); this.render(); });
  }

  private refreshRecordList(): void { const list = this.container.querySelector<HTMLOListElement>('[data-record-list]'); if (list) list.innerHTML = this.renderFeatureList(); const count = this.container.querySelector<HTMLElement>('[data-record-count]'); if (count) count.textContent = `${this.project.records.length} records จาก ${this.project.features.length} features`; }

  private initMap(): void { const host = this.container.querySelector<HTMLElement>('[data-map-host]'); if (!host) return; this.map = L.map(host, { zoomControl: true }).setView([13.7563, 100.5018], 13); this.layerGroup = L.layerGroup().addTo(this.map); if (this.onlineBasemapEnabled) this.enableBasemap(); this.map.on('click', (event) => { if (!this.drawingMode) return; this.drawing.push(event.latlng); if (this.drawingMode === 'Point') this.finishDrawing(); else L.circleMarker(event.latlng, { radius: 5, color: '#2563eb' }).addTo(this.layerGroup!); }); this.renderMapFeatures(); }

  private enableBasemap(): void { if (!this.map || this.basemap) return; this.basemap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(this.map); }

  private renderMapFeatures(): void { if (!this.layerGroup) return; this.layerGroup.clearLayers(); for (const feature of this.project.features) { const geometry = feature.geometry; if (geometry.type === 'Point') { const marker = L.marker([geometry.coordinates[1], geometry.coordinates[0]]); if (this.labelsVisible) marker.bindTooltip(feature.id); marker.addTo(this.layerGroup); } else if (geometry.type === 'LineString') { L.polyline(geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]), { color: '#2563eb' }).addTo(this.layerGroup); } else { const ring = geometry.coordinates[0] ?? []; L.polygon(ring.map(([lng, lat]) => [lat, lng] as [number, number]), { color: '#2563eb', fillOpacity: 0.18 }).addTo(this.layerGroup); } } }

  private finishDrawing(): void { if (!this.map || !this.drawingMode || !this.drawing.length) return; const coords = this.drawing.map((point) => [point.lng, point.lat] as [number, number]); const first = coords[0]; if (!first) return; if (this.drawingMode === 'Point') this.project.features.push({ id: uid('feature'), layerId: this.selectedLayerId, geometry: { type: 'Point', coordinates: first }, properties: {}, createdAt: new Date().toISOString() }); else if (this.drawingMode === 'LineString' && coords.length >= 2) this.project.features.push({ id: uid('feature'), layerId: this.selectedLayerId, geometry: { type: 'LineString', coordinates: coords }, properties: {}, createdAt: new Date().toISOString() }); else if (this.drawingMode === 'Polygon' && coords.length >= 3) { coords.push(first); this.project.features.push({ id: uid('feature'), layerId: this.selectedLayerId, geometry: { type: 'Polygon', coordinates: [coords] }, properties: {}, createdAt: new Date().toISOString() }); } else { this.setStatus('ต้องมีจุดเพียงพอสำหรับ geometry นี้'); return; } this.project.updatedAt = new Date().toISOString(); this.autosave.schedule(this.project); this.drawing = []; this.drawingMode = undefined; this.render(); }
}

export { metadata };
export const mount = async (container: HTMLElement): Promise<void> => { const controller = new CommunityMappingController(container); activeUnmount = () => controller.unmount(); await controller.mount(); };
export const unmount = (): void => activeUnmount?.();
export default { metadata, mount, unmount } satisfies ToolModule;
