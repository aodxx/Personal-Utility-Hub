import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'orbit-catcher',
  title: 'Orbit Catcher',
  description: 'เกมเก็บดาวแบบ local-first บังคับยานด้วยคีย์บอร์ด เมาส์ หรือ touch และเอาตัวรอดให้ได้นานที่สุด',
  category: 'เกม',
  route: '/tools/orbit-catcher',
  icon: 'tool-orbit-catcher',
  tags: ['game', 'arcade', 'stars', 'touch', 'keyboard', 'เกม', 'เก็บดาว'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
};
