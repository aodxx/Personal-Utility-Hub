export class ToolNotFoundError extends Error {
  constructor(toolId: string) {
    super(`ไม่พบเครื่องมือ “${toolId}” ใน Registry`);
    this.name = 'ToolNotFoundError';
  }
}

export class ToolLoadError extends Error {
  constructor(toolId: string, options?: ErrorOptions) {
    super(`ไม่สามารถโหลดเครื่องมือ “${toolId}” ได้`, options);
    this.name = 'ToolLoadError';
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
}
