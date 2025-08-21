/**
 * Utility functions for handling game platform names and display
 */

export type UnifiedPlatform =
  | 'PC'
  | 'MAC'
  | 'PS'
  | 'XBOX'
  | 'NINTENDO'
  | 'SWITCH'
  | 'GAMEBOY'
  | 'MOBILE'
  | 'Wii';

/**
 * Comprehensive platform mapping based on IGDB platform database
 * Organized by platform families for better maintenance
 */
const PLATFORM_MAPPING: Record<string, UnifiedPlatform> = {
  // ==================== PC PLATFORMS ====================
  // Windows PC (ID: 6, 13)
  'pc (microsoft windows)': 'PC',
  pc: 'PC',
  windows: 'PC',
  'microsoft windows': 'PC',
  'pc dos': 'PC',
  win: 'PC',

  // Linux (ID: 3)
  linux: 'PC',

  // PC Gaming Platforms/Stores
  steam: 'PC',
  'epic games': 'PC',
  'epic games store': 'PC',
  gog: 'PC',
  origin: 'PC',
  uplay: 'PC',
  'ubisoft connect': 'PC',
  'battle.net': 'PC',
  'microsoft store': 'PC',
  'xbox live arcade': 'PC',

  // ==================== MAC PLATFORMS ====================
  // Apple Mac (ID: 14)
  mac: 'MAC',
  macos: 'MAC',
  'mac os': 'MAC',
  'os x': 'MAC',
  macintosh: 'MAC',
  'apple mac': 'MAC',

  // ==================== PLAYSTATION PLATFORMS ====================
  // PlayStation Consoles (ID: 7, 8, 9, 48, 167)
  playstation: 'PS',
  'playstation 1': 'PS',
  'playstation 2': 'PS',
  'playstation 3': 'PS',
  'playstation 4': 'PS',
  'playstation 5': 'PS',
  ps1: 'PS',
  ps2: 'PS',
  ps3: 'PS',
  ps4: 'PS',
  ps5: 'PS',
  'sony playstation': 'PS',

  // PlayStation Handhelds (ID: 38, 46)
  psp: 'PS',
  'playstation portable': 'PS',
  'ps vita': 'PS',
  'playstation vita': 'PS',
  'sony psp': 'PS',
  'sony ps vita': 'PS',

  // PlayStation Services (ID: 45)
  'playstation network': 'PS',
  psn: 'PS',

  // ==================== XBOX PLATFORMS ====================
  // Xbox Consoles (ID: 11, 12, 49, 169)
  xbox: 'XBOX',
  'xbox 360': 'XBOX',
  'xbox one': 'XBOX',
  'xbox series x': 'XBOX',
  'xbox series s': 'XBOX',
  'xbox series x|s': 'XBOX',
  'xbox series x/s': 'XBOX',
  'microsoft xbox': 'XBOX',

  // Xbox Services
  'xbox game pass': 'XBOX',
  'xbox live': 'XBOX',
  'xbox game pass for pc': 'PC', // This is PC gaming

  // ==================== NINTENDO PLATFORMS ====================

  // Modern Nintendo Switch (ID: 130)
  'nintendo switch': 'SWITCH',
  'nintendo switch 2': 'SWITCH',
  switch: 'SWITCH',
  ns: 'SWITCH',

  // Nintendo Handhelds - Game Boy Family (ID: 20, 22, 24, 33, 37)
  'game boy': 'GAMEBOY',
  gameboy: 'GAMEBOY',
  gb: 'GAMEBOY',
  'game boy color': 'GAMEBOY',
  'game boy colour': 'GAMEBOY',
  gbc: 'GAMEBOY',
  'game boy advance': 'GAMEBOY',
  gba: 'GAMEBOY',
  'nintendo ds': 'GAMEBOY',
  nds: 'GAMEBOY',
  'nintendo 3ds': 'GAMEBOY',
  '3ds': 'GAMEBOY',

  // Classic Nintendo Home Consoles (ID: 4, 5, 18, 19, 21, 41, 51, 58)
  'nintendo entertainment system': 'NINTENDO',
  'nintendo entertainment system (nes)': 'NINTENDO',
  nes: 'NINTENDO',
  famicom: 'NINTENDO',
  'super nintendo entertainment system': 'NINTENDO',
  'super nintendo entertainment system (snes)': 'NINTENDO',
  snes: 'NINTENDO',
  'super famicom': 'NINTENDO',
  'family computer disk system': 'NINTENDO',
  'nintendo 64': 'NINTENDO',
  n64: 'NINTENDO',
  'nintendo gamecube': 'NINTENDO',
  gamecube: 'NINTENDO',
  gc: 'NINTENDO',
  wii: 'Wii',
  'wii u': 'Wii',

  // Nintendo Services (ID: 47, 56)
  'virtual console': 'NINTENDO',
  'virtual console (nintendo)': 'NINTENDO',
  wiiware: 'NINTENDO',
  'nintendo eshop': 'NINTENDO',

  // ==================== MOBILE PLATFORMS ====================
  // iOS (ID: 39)
  ios: 'MOBILE',
  iphone: 'MOBILE',
  ipad: 'MOBILE',
  'apple ios': 'MOBILE',
  'apple iphone': 'MOBILE',
  'apple ipad': 'MOBILE',

  // Android (ID: 34)
  android: 'MOBILE',
  'google android': 'MOBILE',
  'google play': 'MOBILE',

  // Generic Mobile (ID: 55)
  mobile: 'MOBILE',
  smartphone: 'MOBILE',
  tablet: 'MOBILE',

  // Mobile Gaming Devices (ID: 42, 44, 57)
  'n‑gage': 'MOBILE',
  'nokia n-gage': 'MOBILE',
  'tapwave zodiac': 'MOBILE',
  wonderswan: 'MOBILE',
  'wonderswan color': 'MOBILE',

  // ==================== LEGACY/RETRO PLATFORMS ====================
  // These map to PC for broad compatibility and emulation availability

  // Commodore Systems (ID: 15, 16)
  'commodore c64/128': 'PC',
  'commodore 64': 'PC',
  c64: 'PC',
  amiga: 'PC',
  'commodore amiga': 'PC',

  // Atari Systems (ID: 59, 60, 61, 62, 63)
  'atari 2600': 'PC',
  'atari 7800': 'PC',
  'atari lynx': 'PC',
  'atari jaguar': 'PC',
  'atari st': 'PC',
  'atari st/ste': 'PC',

  // Sega Systems (ID: 23, 29, 30, 32, 35)
  dreamcast: 'PC',
  'sega dreamcast': 'PC',
  'sega mega drive': 'PC',
  'sega mega drive/genesis': 'PC',
  'sega genesis': 'PC',
  'mega drive': 'PC',
  genesis: 'PC',
  'sega 32x': 'PC',
  'sega saturn': 'PC',
  'sega game gear': 'PC',
  'game gear': 'PC',

  // Other Retro Systems (ID: 25, 26, 27, 50, 52, 53)
  'amstrad cpc': 'PC',
  'zx spectrum': 'PC',
  'sinclair zx spectrum': 'PC',
  msx: 'PC',
  msx2: 'PC',
  '3do': 'PC',
  '3do interactive multiplayer': 'PC',
  arcade: 'PC',
  'neo geo': 'PC',
  'turbografx-16': 'PC',
  'pc engine': 'PC',
};

/**
 * Alternative names and abbreviations for better matching
 */
const ALTERNATIVE_MAPPINGS: Record<string, string> = {
  // Common abbreviations to full names
  win: 'windows',
  ps: 'playstation',
  xbox: 'xbox',
  nintendo: 'nintendo switch',
  mobile: 'mobile',
};

/**
 * Converts a single platform name to unified format
 */
function unifyPlatformName(platform: string): UnifiedPlatform | null {
  const normalized = platform.toLowerCase().trim();

  // Direct mapping first
  const directMatch = PLATFORM_MAPPING[normalized];
  if (directMatch) return directMatch;

  // Try alternative mappings
  const alternative = ALTERNATIVE_MAPPINGS[normalized];
  if (alternative && PLATFORM_MAPPING[alternative]) {
    return PLATFORM_MAPPING[alternative];
  }

  // Partial matching for complex names
  for (const [key, value] of Object.entries(PLATFORM_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}

/**
 * Converts an array of platform names to unified format, removes duplicates
 */
export function unifyPlatforms(
  platforms: string[] | null | undefined,
): UnifiedPlatform[] {
  if (!platforms || platforms.length === 0) {
    return [];
  }

  const unified = new Set<UnifiedPlatform>();

  for (const platform of platforms) {
    const unifiedPlatform = unifyPlatformName(platform);
    if (unifiedPlatform) {
      unified.add(unifiedPlatform);
    }
  }

  // Return in priority order (most common/relevant first)
  const order: UnifiedPlatform[] = [
    'PC',
    'PS',
    'XBOX',
    'SWITCH',
    'NINTENDO',
    'GAMEBOY',
    'MAC',
    'MOBILE',
    'Wii',
  ];
  return order.filter((platform) => unified.has(platform));
}
