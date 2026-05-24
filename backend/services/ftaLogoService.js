import fs from 'node:fs';
import path from 'node:path';

export const FTA_LOGO_SOURCE_URL = 'https://tax.gov.ae/datafolder//Images/TAX/FTA.jpg';

let cachedLogo = null;
let cachedAt = 0;

function readLocalFallback() {
  const fallbackPaths = [
    path.resolve('backend/assets/fta-logo.jpg'),
    path.resolve('public/logo.png'),
  ];

  for (const filePath of fallbackPaths) {
    if (fs.existsSync(filePath)) {
      return {
        buffer: fs.readFileSync(filePath),
        contentType: filePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
        source: 'local',
      };
    }
  }

  return null;
}

async function fetchRemoteLogo() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(FTA_LOGO_SOURCE_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'UAE-Tax-Suite/1.0' },
    });

    if (!response.ok) throw new Error(`Failed to fetch remote logo: ${response.status}`);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
      source: 'remote',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getFtaLogoImage() {
  const now = Date.now();
  if (cachedLogo && now - cachedAt < 1000 * 60 * 60 * 6) {
    return cachedLogo;
  }

  try {
    const remote = await fetchRemoteLogo();
    cachedLogo = remote;
    cachedAt = now;
    return remote;
  } catch {
    const fallback = readLocalFallback();
    if (fallback) {
      cachedLogo = fallback;
      cachedAt = now;
      return fallback;
    }
    return null;
  }
}
