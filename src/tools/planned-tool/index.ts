import type { ToolMetadata, ToolModule } from '../../core/tool-contract';
import { toolAssetIcon } from '../../components/asset-icon';

export function createPlannedTool(metadata: ToolMetadata): ToolModule {
  return {
    metadata,
    mount(container) {
      const section = document.createElement('section');
      section.className = 'planned-panel';
      section.innerHTML = `
        <span class="planned-panel__visual">${toolAssetIcon(metadata.icon)}</span>
        <div>
          <p class="eyebrow">กำลังพัฒนาใน Phase 2</p>
          <h2>เครื่องมือนี้อยู่ในแผน Core Tools</h2>
          <p>หน้า Hub, การค้นหา, รายการโปรด และ PWA พร้อมแล้ว ส่วนการประมวลผลของ <strong>${metadata.title}</strong> จะถูกเพิ่มใน Phase ถัดไปโดยยังคงทำงานภายในอุปกรณ์ของคุณ</p>
          <a class="button button--primary" href="#/">ดูเครื่องมือทั้งหมด</a>
        </div>
      `;
      container.append(section);
    },
  };
}
