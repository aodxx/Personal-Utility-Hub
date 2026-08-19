import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const toolsDir = path.join(root, 'src', 'tools');
const registryPath = path.join(root, 'src', 'data', 'tools.ts');
const registrySource = fs.readFileSync(registryPath, 'utf8');
const errors = [];
const ids = new Set();
const routes = new Set();

for (const entry of fs.readdirSync(toolsDir, { withFileTypes: true }).filter((item) => item.isDirectory())) {
  const id = entry.name;
  const metadataPath = path.join(toolsDir, id, 'metadata.ts');
  if (!fs.existsSync(metadataPath)) continue;
  const source = fs.readFileSync(metadataPath, 'utf8');
  const idMatch = source.match(/\bid:\s*['\"]([^'\"]+)['\"]/);
  const routeMatch = source.match(/\broute:\s*['\"]([^'\"]+)['\"]/);
  const categoryMatch = source.match(/\bcategory:\s*['\"]([^'\"]+)['\"]/);
  const statusMatch = source.match(/\bstatus:\s*['\"]([^'\"]+)['\"]/);
  const versionMatch = source.match(/\bversion:\s*['\"]([^'\"]+)['\"]/);
  const metadataId = idMatch?.[1];
  const route = routeMatch?.[1];
  if (!metadataId) errors.push(`${id}: missing metadata id`);
  if (metadataId && metadataId !== id) errors.push(`${id}: metadata id is ${metadataId}`);
  if (!route) errors.push(`${id}: missing route`);
  if (route && route !== `/tools/${id}`) errors.push(`${id}: route is ${route}`);
  if (!categoryMatch?.[1]?.trim()) errors.push(`${id}: missing category`);
  if (!statusMatch?.[1] || !['active', 'beta', 'planned', 'disabled'].includes(statusMatch[1])) errors.push(`${id}: invalid status`);
  if (!versionMatch?.[1] || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(versionMatch[1])) errors.push(`${id}: invalid version`);
  if (metadataId && ids.has(metadataId)) errors.push(`${id}: duplicate id ${metadataId}`);
  if (route && routes.has(route)) errors.push(`${id}: duplicate route ${route}`);
  if (metadataId) ids.add(metadataId);
  if (route) routes.add(route);
  if (!registrySource.includes(`../tools/${id}`)) errors.push(`${id}: missing lazy registry registration`);
}

if (errors.length) {
  console.error(`Registry check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Registry check passed: ${ids.size} metadata modules, unique routes, required fields, and lazy registrations verified.`);
}
