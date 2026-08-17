import type {
  CommercePlatform,
  PlatformProfile,
} from './types.js';

export const PLATFORM_PROFILES: PlatformProfile[] = [
  {
    platform: 'meesho',
    hosts: ['meesho.com', 'www.meesho.com'],
    requiresBrowserFallback: true,
  },
  {
    platform: 'amazon',
    hosts: ['amazon.in', 'www.amazon.in'],
    requiresBrowserFallback: true,
  },
  {
    platform: 'flipkart',
    hosts: ['flipkart.com', 'www.flipkart.com'],
    requiresBrowserFallback: true,
  },
  {
    platform: 'myntra',
    hosts: ['myntra.com', 'www.myntra.com'],
    requiresBrowserFallback: true,
  },
  {
    platform: 'ajio',
    hosts: ['ajio.com', 'www.ajio.com'],
    requiresBrowserFallback: true,
  },
  {
    platform: 'nykaa',
    hosts: ['nykaa.com', 'www.nykaa.com'],
    requiresBrowserFallback: true,
  },
];

export function detectPlatform(url: string): CommercePlatform {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    const profile = PLATFORM_PROFILES.find((item) =>
      item.hosts.some(
        (host) =>
          hostname === host ||
          hostname.endsWith(`.${host}`),
      ),
    );

    return profile?.platform ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export function getPlatformProfile(
  platform: CommercePlatform,
): PlatformProfile | null {
  return (
    PLATFORM_PROFILES.find(
      (profile) => profile.platform === platform,
    ) ?? null
  );
}
