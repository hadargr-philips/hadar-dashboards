import { ReleaseType } from '../types/release';

const DEFAULT_LIST_URL =
  'https://share.philips.com/sites/RI-VueT4/Lists/VuePACS%20SP_GSP%20Release%202026/AllItems.aspx';

interface SharePointItem {
  [key: string]: unknown;
}

function normalizeType(raw: string | null): ReleaseType | null {
  if (!raw) return null;
  const text = raw.trim().toUpperCase();
  if (text.includes('GSP')) return 'GSP';
  if (text.includes('SP')) return 'SP';
  if (text.includes('LR')) return 'LR';
  if (text.includes('FOK')) return 'FOK';
  return null;
}

function getFieldValue(item: SharePointItem, candidates: string[]): string | null {
  const keys = Object.keys(item);
  for (const candidate of candidates) {
    const key = keys.find(k => k.toLowerCase() === candidate.toLowerCase());
    if (!key) continue;
    const value = item[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return null;
}

function getListApiUrl(allItemsUrl: string): string {
  const url = new URL(allItemsUrl);
  const match = url.pathname.match(/^(.*)\/Lists\/([^/]+)\/AllItems\.aspx$/i);
  if (!match) {
    throw new Error('Invalid SharePoint list URL. Expected a /Lists/<list>/AllItems.aspx path.');
  }
  const sitePath = match[1];
  const listName = decodeURIComponent(match[2]).replace(/'/g, "''");
  return `${url.origin}${sitePath}/_api/web/lists/getByTitle('${listName}')/items?$orderby=Id asc&$top=5000`;
}

function extractItems(payload: unknown): SharePointItem[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as { value?: unknown; d?: { results?: unknown } };
  if (Array.isArray(root.value)) return root.value as SharePointItem[];
  if (root.d && Array.isArray(root.d.results)) return root.d.results as SharePointItem[];
  return [];
}

export async function fetchSharePointReleases(
  sourceUrl: string = DEFAULT_LIST_URL
): Promise<Array<{ number: string; type: ReleaseType }>> {
  const apiUrl = getListApiUrl(sourceUrl);
  const response = await fetch(apiUrl, {
    credentials: 'include',
    headers: {
      Accept: 'application/json;odata=nometadata',
    },
  });
  if (!response.ok) {
    throw new Error(`SharePoint request failed (${response.status}).`);
  }

  const payload = (await response.json()) as unknown;
  const items = extractItems(payload);

  const releases: Array<{ number: string; type: ReleaseType }> = [];
  for (const item of items) {
    const number =
      getFieldValue(item, [
        'number',
        'release number',
        'release_number',
        'version',
        'build',
        'title',
      ]) ?? null;

    if (!number) continue;

    const rawType = getFieldValue(item, ['type', 'release type', 'release_type', 'category']);
    const type = normalizeType(rawType) ?? 'SP';
    releases.push({ number, type });
  }

  return releases;
}

export { DEFAULT_LIST_URL };
