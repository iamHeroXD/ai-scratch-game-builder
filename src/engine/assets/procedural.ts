/**
 * Procedural Vector SVG Generator for Scratch Sprites and Backdrops
 */

export interface GeneratedAsset {
  svg: string;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export function generatePlayerSvg(theme: string = 'hero', color: string = '#4C97FF'): GeneratedAsset {
  const width = 48;
  const height = 48;
  const centerX = 24;
  const centerY = 24;

  let body = '';
  if (theme === 'astronaut' || theme === 'space') {
    body = `
      <rect x="12" y="16" width="24" height="26" rx="8" fill="#F3F4F6" stroke="#1F2937" stroke-width="2.5"/>
      <circle cx="24" cy="18" r="11" fill="#E5E7EB" stroke="#1F2937" stroke-width="2.5"/>
      <ellipse cx="24" cy="17" rx="8" ry="6" fill="#1E293B"/>
      <ellipse cx="22" cy="15" rx="3" ry="2" fill="#38BDF8" opacity="0.8"/>
      <rect x="8" y="22" width="6" height="14" rx="3" fill="#D1D5DB" stroke="#1F2937" stroke-width="2"/>
      <rect x="34" y="22" width="6" height="14" rx="3" fill="#D1D5DB" stroke="#1F2937" stroke-width="2"/>
      <rect x="15" y="40" width="7" height="6" rx="2" fill="#4B5563"/>
      <rect x="26" y="40" width="7" height="6" rx="2" fill="#4B5563"/>
      <circle cx="24" cy="28" r="4" fill="${color}"/>
    `;
  } else if (theme === 'ninja' || theme === 'cyber') {
    body = `
      <rect x="12" y="14" width="24" height="28" rx="6" fill="#1E1E2E" stroke="#313244" stroke-width="2.5"/>
      <circle cx="24" cy="16" r="10" fill="#181825"/>
      <rect x="15" y="15" width="18" height="4" rx="2" fill="${color}"/>
      <circle cx="19" cy="17" r="1.5" fill="#FFFFFF"/>
      <circle cx="29" cy="17" r="1.5" fill="#FFFFFF"/>
      <rect x="14" y="24" width="20" height="14" rx="4" fill="#313244"/>
      <path d="M12 20 L24 28 L36 20" stroke="${color}" stroke-width="2" fill="none"/>
      <rect x="14" y="40" width="8" height="6" rx="2" fill="#11111B"/>
      <rect x="26" y="40" width="8" height="6" rx="2" fill="#11111B"/>
    `;
  } else {
    // Standard Friendly Hero Character
    body = `
      <!-- Cape / Shadow -->
      <path d="M10 24 C8 38 12 44 16 44 L32 44 C36 44 40 38 38 24 Z" fill="#E11D48"/>
      <!-- Body -->
      <rect x="13" y="16" width="22" height="22" rx="7" fill="${color}" stroke="#1E293B" stroke-width="2"/>
      <!-- Head / Face -->
      <circle cx="24" cy="16" r="12" fill="#FDE047" stroke="#1E293B" stroke-width="2"/>
      <!-- Eyes -->
      <circle cx="20" cy="15" r="2.5" fill="#1E293B"/>
      <circle cx="28" cy="15" r="2.5" fill="#1E293B"/>
      <circle cx="21" cy="14" r="0.8" fill="#FFFFFF"/>
      <circle cx="29" cy="14" r="0.8" fill="#FFFFFF"/>
      <!-- Smile -->
      <path d="M20 20 Q24 24 28 20" stroke="#1E293B" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <!-- Hands -->
      <circle cx="10" cy="27" r="4" fill="#FDE047" stroke="#1E293B" stroke-width="1.5"/>
      <circle cx="38" cy="27" r="4" fill="#FDE047" stroke="#1E293B" stroke-width="1.5"/>
      <!-- Feet -->
      <ellipse cx="18" cy="40" rx="5" ry="3.5" fill="#1E293B"/>
      <ellipse cx="30" cy="40" rx="5" ry="3.5" fill="#1E293B"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${body}
  </svg>`.trim();

  return { svg, width, height, centerX, centerY };
}

export function generateEnemySvg(type: string = 'slime', color: string = '#EF4444'): GeneratedAsset {
  const width = 44;
  const height = 44;
  const centerX = 22;
  const centerY = 22;

  let body = '';
  if (type === 'drone' || type === 'ufo') {
    body = `
      <ellipse cx="22" cy="22" rx="18" ry="8" fill="${color}" stroke="#1F2937" stroke-width="2"/>
      <ellipse cx="22" cy="16" rx="9" ry="7" fill="#67E8F9" stroke="#1F2937" stroke-width="2"/>
      <circle cx="14" cy="22" r="2" fill="#FACC15"/>
      <circle cx="22" cy="22" r="2" fill="#FACC15"/>
      <circle cx="30" cy="22" r="2" fill="#FACC15"/>
      <path d="M12 28 L8 36 M32 28 L36 36" stroke="#1F2937" stroke-width="2.5" stroke-linecap="round"/>
    `;
  } else if (type === 'bat' || type === 'flyer') {
    body = `
      <!-- Bat Wings -->
      <path d="M22 22 C14 10 4 14 2 24 C8 24 14 28 22 24 Z" fill="#4B5563" stroke="#111827" stroke-width="1.5"/>
      <path d="M22 22 C30 10 40 14 42 24 C36 24 30 28 22 24 Z" fill="#4B5563" stroke="#111827" stroke-width="1.5"/>
      <!-- Body -->
      <circle cx="22" cy="22" r="9" fill="${color}" stroke="#111827" stroke-width="2"/>
      <!-- Eyes -->
      <circle cx="19" cy="20" r="2" fill="#FEF08A"/>
      <circle cx="25" cy="20" r="2" fill="#FEF08A"/>
      <circle cx="19" cy="20" r="1" fill="#7F1D1D"/>
      <circle cx="25" cy="20" r="1" fill="#7F1D1D"/>
      <!-- Fangs -->
      <polygon points="19,25 20,28 21,25" fill="#FFFFFF"/>
      <polygon points="23,25 24,28 25,25" fill="#FFFFFF"/>
    `;
  } else {
    // Bouncy Slime Enemy
    body = `
      <!-- Slime Body -->
      <path d="M6 34 C4 18 14 8 22 8 C30 8 40 18 38 34 C36 38 8 38 6 34 Z" fill="${color}" stroke="#991B1B" stroke-width="2"/>
      <!-- Inner Gloss -->
      <ellipse cx="16" cy="16" rx="4" ry="2" transform="rotate(-30 16 16)" fill="#FCA5A5" opacity="0.8"/>
      <!-- Eyes -->
      <circle cx="17" cy="22" r="3.5" fill="#FFFFFF" stroke="#1F2937" stroke-width="1.5"/>
      <circle cx="27" cy="22" r="3.5" fill="#FFFFFF" stroke="#1F2937" stroke-width="1.5"/>
      <circle cx="18" cy="22" r="1.8" fill="#1F2937"/>
      <circle cx="28" cy="22" r="1.8" fill="#1F2937"/>
      <!-- Menacing mouth -->
      <path d="M18 28 Q22 25 26 28" stroke="#1F2937" stroke-width="2" fill="none" stroke-linecap="round"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${body}
  </svg>`.trim();

  return { svg, width, height, centerX, centerY };
}

export function generateBossSvg(theme: string = 'dragon', color: string = '#8B5CF6'): GeneratedAsset {
  const width = 80;
  const height = 80;
  const centerX = 40;
  const centerY = 40;

  const body = `
    <!-- Boss Horns/Crown -->
    <polygon points="20,26 12,10 28,18" fill="#F59E0B" stroke="#78350F" stroke-width="2"/>
    <polygon points="60,26 68,10 52,18" fill="#F59E0B" stroke="#78350F" stroke-width="2"/>
    <polygon points="36,16 40,6 44,16" fill="#FBBF24" stroke="#78350F" stroke-width="2"/>
    <!-- Head & Body -->
    <circle cx="40" cy="42" r="28" fill="${color}" stroke="#4C1D95" stroke-width="3"/>
    <ellipse cx="40" cy="54" rx="20" ry="12" fill="#A78BFA"/>
    <!-- Eyes -->
    <ellipse cx="30" cy="36" rx="6" ry="5" fill="#EF4444" stroke="#1E1E2E" stroke-width="2"/>
    <ellipse cx="50" cy="36" rx="6" ry="5" fill="#EF4444" stroke="#1E1E2E" stroke-width="2"/>
    <circle cx="31" cy="36" r="2.5" fill="#FEF08A"/>
    <circle cx="51" cy="36" r="2.5" fill="#FEF08A"/>
    <!-- Angry brows -->
    <line x1="22" y1="28" x2="36" y2="34" stroke="#1E1E2E" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="58" y1="28" x2="44" y2="34" stroke="#1E1E2E" stroke-width="3.5" stroke-linecap="round"/>
    <!-- Sharp Teeth -->
    <path d="M26 50 Q40 60 54 50 Z" fill="#1E1E2E"/>
    <polygon points="30,50 33,56 36,50" fill="#FFFFFF"/>
    <polygon points="38,50 41,57 44,50" fill="#FFFFFF"/>
    <polygon points="46,50 49,56 52,50" fill="#FFFFFF"/>
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${body}
  </svg>`.trim();

  return { svg, width, height, centerX, centerY };
}

export function generateCoinSvg(color: string = '#FBBF24'): GeneratedAsset {
  const width = 32;
  const height = 32;
  const centerX = 16;
  const centerY = 16;

  const body = `
    <!-- Outer Coin Rim -->
    <circle cx="16" cy="16" r="14" fill="${color}" stroke="#B45309" stroke-width="2.5"/>
    <!-- Inner Emboss -->
    <circle cx="16" cy="16" r="10" fill="#FDE047" stroke="#D97706" stroke-width="1.5"/>
    <!-- Star Emblem -->
    <polygon points="16,8 18,13 23,13 19,16 21,21 16,18 11,21 13,16 9,13 14,13" fill="#B45309"/>
    <!-- Shine highlight -->
    <path d="M10 10 A 10 10 0 0 1 20 7" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${body}
  </svg>`.trim();

  return { svg, width, height, centerX, centerY };
}

export function generatePlatformSvg(style: string = 'grass', width = 160, height = 32): GeneratedAsset {
  const centerX = width / 2;
  const centerY = height / 2;

  let body = '';
  if (style === 'metal' || style === 'cyber') {
    body = `
      <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="4" fill="#334155" stroke="#0EA5E9" stroke-width="2"/>
      <line x1="8" y1="8" x2="${width - 8}" y2="8" stroke="#38BDF8" stroke-width="2"/>
      <circle cx="10" cy="20" r="3" fill="#64748B"/>
      <circle cx="${width - 10}" cy="20" r="3" fill="#64748B"/>
    `;
  } else {
    // Grass/Dirt Platform
    body = `
      <!-- Dirt Base -->
      <rect x="2" y="8" width="${width - 4}" height="${height - 10}" rx="4" fill="#854D0E" stroke="#451A03" stroke-width="2"/>
      <!-- Grass Top -->
      <rect x="2" y="2" width="${width - 4}" height="10" rx="3" fill="#22C55E" stroke="#14532D" stroke-width="2"/>
      <!-- Grass Tufts -->
      <polygon points="12,12 16,16 20,12" fill="#16A34A"/>
      <polygon points="40,12 44,17 48,12" fill="#16A34A"/>
      <polygon points="80,12 85,16 90,12" fill="#16A34A"/>
      <polygon points="120,12 125,17 130,12" fill="#16A34A"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${body}
  </svg>`.trim();

  return { svg, width, height, centerX, centerY };
}

export function generateHazardSvg(type: string = 'spike'): GeneratedAsset {
  const width = 36;
  const height = 36;
  const centerX = 18;
  const centerY = 18;

  const body = `
    <!-- Sharp Metal Spikes -->
    <polygon points="4,34 10,6 16,34" fill="#DC2626" stroke="#7F1D1D" stroke-width="2"/>
    <polygon points="14,34 20,4 26,34" fill="#EF4444" stroke="#7F1D1D" stroke-width="2"/>
    <polygon points="24,34 30,8 36,34" fill="#DC2626" stroke="#7F1D1D" stroke-width="2"/>
    <rect x="2" y="32" width="32" height="4" fill="#4B5563"/>
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${body}
  </svg>`.trim();

  return { svg, width, height, centerX, centerY };
}

export function generateProjectileSvg(color: string = '#F59E0B'): GeneratedAsset {
  const width = 24;
  const height = 24;
  const centerX = 12;
  const centerY = 12;

  const body = `
    <!-- Glowing Projectile / Laser Blast -->
    <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.3"/>
    <circle cx="12" cy="12" r="7" fill="${color}" stroke="#FFF" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="3.5" fill="#FFFFFF"/>
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${body}
  </svg>`.trim();

  return { svg, width, height, centerX, centerY };
}

export function generateGoalSvg(): GeneratedAsset {
  const width = 40;
  const height = 50;
  const centerX = 20;
  const centerY = 25;

  const body = `
    <!-- Goal Flag / Portal -->
    <line x1="8" y1="46" x2="8" y2="4" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
    <polygon points="8,6 36,16 8,26" fill="#10B981" stroke="#047857" stroke-width="2"/>
    <circle cx="8" cy="4" r="3" fill="#FBBF24"/>
    <ellipse cx="8" cy="46" rx="6" ry="3" fill="#334155"/>
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${body}
  </svg>`.trim();

  return { svg, width, height, centerX, centerY };
}

export function generateBackdropSvg(theme: string = 'sky', color = '#38BDF8'): GeneratedAsset {
  // Scratch stage standard dimensions: 480 x 360
  const width = 480;
  const height = 360;
  const centerX = 240;
  const centerY = 180;

  let content = '';
  if (theme === 'space') {
    content = `
      <rect width="480" height="360" fill="#090D16"/>
      <!-- Stars -->
      <circle cx="50" cy="40" r="1.5" fill="#FFF"/>
      <circle cx="120" cy="90" r="1" fill="#FFF"/>
      <circle cx="210" cy="50" r="2" fill="#FDE047"/>
      <circle cx="340" cy="70" r="1.5" fill="#FFF"/>
      <circle cx="430" cy="30" r="1.2" fill="#FFF"/>
      <circle cx="80" cy="180" r="1.5" fill="#FFF"/>
      <circle cx="280" cy="190" r="1.8" fill="#67E8F9"/>
      <circle cx="390" cy="160" r="1" fill="#FFF"/>
      <circle cx="150" cy="270" r="2" fill="#FFF"/>
      <circle cx="320" cy="300" r="1.2" fill="#FFF"/>
      <!-- Planet -->
      <circle cx="400" cy="80" r="36" fill="#8B5CF6" opacity="0.6"/>
      <ellipse cx="400" cy="80" rx="50" ry="12" fill="none" stroke="#C4B5FD" stroke-width="3" opacity="0.8" transform="rotate(-20 400 80)"/>
    `;
  } else if (theme === 'dungeon' || theme === 'dark') {
    content = `
      <rect width="480" height="360" fill="#18181B"/>
      <!-- Stone Brick grid lines -->
      <line x1="0" y1="80" x2="480" y2="80" stroke="#27272A" stroke-width="2"/>
      <line x1="0" y1="160" x2="480" y2="160" stroke="#27272A" stroke-width="2"/>
      <line x1="0" y1="240" x2="480" y2="240" stroke="#27272A" stroke-width="2"/>
      <line x1="0" y1="320" x2="480" y2="320" stroke="#27272A" stroke-width="2"/>
      <!-- Torch glow -->
      <circle cx="80" cy="120" r="30" fill="#F97316" opacity="0.15"/>
      <circle cx="80" cy="120" r="6" fill="#FBBF24"/>
      <circle cx="400" cy="120" r="30" fill="#F97316" opacity="0.15"/>
      <circle cx="400" cy="120" r="6" fill="#FBBF24"/>
    `;
  } else {
    // Sky with gentle clouds and distant rolling hills
    content = `
      <!-- Sky Gradient -->
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}"/>
          <stop offset="70%" stop-color="#BAE6FD"/>
          <stop offset="100%" stop-color="#E0F2FE"/>
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#skyGrad)"/>
      <!-- Sun -->
      <circle cx="410" cy="70" r="28" fill="#FDE047" opacity="0.9"/>
      <circle cx="410" cy="70" r="36" fill="#FEF08A" opacity="0.4"/>
      <!-- Clouds -->
      <path d="M60 90 Q75 70 95 85 Q115 75 130 90 Q145 95 135 110 Q115 115 65 110 Z" fill="#FFFFFF" opacity="0.85"/>
      <path d="M260 60 Q275 45 295 55 Q310 48 325 60 Q335 65 325 75 Q310 80 265 75 Z" fill="#FFFFFF" opacity="0.85"/>
      <!-- Distant Hills -->
      <path d="M0 310 Q120 250 240 300 Q360 260 480 300 L480 360 L0 360 Z" fill="#86EFAC" opacity="0.7"/>
      <path d="M0 330 Q160 280 320 320 Q400 300 480 325 L480 360 L0 360 Z" fill="#4ADE80" opacity="0.9"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${content}
  </svg>`.trim();

  return { svg, width, height, centerX, centerY };
}

export function generateBannerSvg(text: string, subtext: string = '', isVictory = false): GeneratedAsset {
  const width = 360;
  const height = 180;
  const centerX = 180;
  const centerY = 90;

  const primaryColor = isVictory ? '#10B981' : '#EF4444';
  const bgColor = '#0F172A';

  const body = `
    <rect x="10" y="10" width="340" height="160" rx="16" fill="${bgColor}" stroke="${primaryColor}" stroke-width="4"/>
    <text x="180" y="85" font-family="system-ui, sans-serif" font-size="34" font-weight="900" fill="${primaryColor}" text-anchor="middle">
      ${text}
    </text>
    ${subtext ? `
    <text x="180" y="125" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#94A3B8" text-anchor="middle">
      ${subtext}
    </text>
    ` : ''}
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${body}
  </svg>`.trim();

  return { svg, width, height, centerX, centerY };
}
