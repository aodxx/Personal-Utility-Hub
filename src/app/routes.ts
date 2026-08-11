export type AppRoute =
  | { kind: 'home' }
  | { kind: 'tool'; toolId: string }
  | { kind: 'not-found'; path: string };

export function parseHash(hash: string): AppRoute {
  const rawPath = hash.replace(/^#/, '') || '/';
  let path: string;

  try {
    path = decodeURI(rawPath);
  } catch {
    return { kind: 'not-found', path: rawPath };
  }

  if (path === '/' || path === '') return { kind: 'home' };

  const toolMatch = path.match(/^\/tools\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  if (toolMatch?.[1]) return { kind: 'tool', toolId: toolMatch[1] };

  return { kind: 'not-found', path };
}
