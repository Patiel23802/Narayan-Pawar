import { getBaseUrl } from '../services/api';

export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getBaseUrl()}${path}`;
}
