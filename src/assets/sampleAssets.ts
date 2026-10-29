// ============================================================
// Sample Indonesian Wedding Assets (Pure Vector SVGs)
// Legally clean, hand-crafted procedural SVGs for luxury Indonesian invitations
// ============================================================

export interface SampleVectorAsset {
  id: string;
  name: string;
  category: 'ornaments' | 'frames' | 'flora' | 'flowers' | 'misc' | 'backgrounds';
  width: number;
  height: number;
  svgContent: string;
}

export const SAMPLE_ASSETS: SampleVectorAsset[] = [
  {
    id: 'sample-gunungan-wayang',
    name: 'Gunungan Wayang Gold',
    category: 'ornaments',
    width: 300,
    height: 420,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="300" height="420">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fad961" />
          <stop offset="50%" stop-color="#c9a84c" />
          <stop offset="100%" stop-color="#8a6d2b" />
        </linearGradient>
      </defs>
      <!-- Gunungan Outer Silhouette -->
      <path d="M 150 15 C 190 70, 260 180, 275 280 C 285 340, 250 375, 210 380 C 190 382, 175 385, 175 410 L 125 410 C 125 385, 110 382, 90 380 C 50 375, 15 340, 25 280 C 40 180, 110 70, 150 15 Z" 
            fill="none" stroke="url(#goldGrad)" stroke-width="3" />
      <!-- Inner Border -->
      <path d="M 150 30 C 185 80, 245 185, 258 275 C 266 330, 235 362, 200 368 C 180 370, 165 375, 165 398 L 135 398 C 135 375, 120 370, 100 368 C 65 362, 34 330, 42 275 C 55 185, 115 80, 150 30 Z" 
            fill="rgba(201,168,76,0.06)" stroke="url(#goldGrad)" stroke-width="1.5" stroke-dasharray="4 2" />
      <!-- Pohon Hayat (Tree of Life Central Spine) -->
      <line x1="150" y1="45" x2="150" y2="370" stroke="url(#goldGrad)" stroke-width="2.5" />
      <!-- Branches -->
      <path d="M 150 110 C 180 90, 210 115, 225 100" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" />
      <path d="M 150 110 C 120 90, 90 115, 75 100" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" />
      <path d="M 150 160 C 195 135, 230 170, 248 150" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" />
      <path d="M 150 160 C 105 135, 70 170, 52 150" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" />
      <path d="M 150 220 C 205 195, 240 230, 255 210" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" />
      <path d="M 150 220 C 95 195, 60 230, 45 210" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" />
      <path d="M 150 280 C 200 260, 235 295, 245 275" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" />
      <path d="M 150 280 C 100 260, 65 295, 55 275" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" />
      <!-- Gate Motif at base -->
      <path d="M 120 370 L 120 325 C 120 310, 180 310, 180 325 L 180 370" fill="none" stroke="url(#goldGrad)" stroke-width="2" />
      <line x1="150" y1="315" x2="150" y2="370" stroke="url(#goldGrad)" stroke-width="1" />
      <!-- Crown / Pucuk Finial -->
      <circle cx="150" cy="16" r="4" fill="url(#goldGrad)" />
      <circle cx="150" cy="35" r="2.5" fill="url(#goldGrad)" />
      <circle cx="150" cy="55" r="2" fill="url(#goldGrad)" />
    </svg>`,
  },
  {
    id: 'sample-floral-arch',
    name: 'Luxury Botanical Arch',
    category: 'frames',
    width: 320,
    height: 460,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 460" width="320" height="460">
      <defs>
        <linearGradient id="goldArch" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f5e197" />
          <stop offset="50%" stop-color="#c9a84c" />
          <stop offset="100%" stop-color="#8c6c28" />
        </linearGradient>
      </defs>
      <!-- Outer Arch -->
      <path d="M 20 440 L 20 160 C 20 70, 300 70, 300 160 L 300 440" fill="none" stroke="url(#goldArch)" stroke-width="2" />
      <!-- Inner Arch -->
      <path d="M 30 440 L 30 165 C 30 85, 290 85, 290 165 L 290 440" fill="none" stroke="url(#goldArch)" stroke-width="1" stroke-dasharray="3 3" />
      <!-- Top Crest Ornament -->
      <circle cx="160" cy="65" r="6" fill="url(#goldArch)" />
      <path d="M 160 50 C 170 58, 175 62, 185 62 C 175 66, 168 72, 160 82 C 152 72, 145 66, 135 62 C 145 62, 150 58, 160 50 Z" fill="url(#goldArch)" />
      <!-- Corner Florals Left -->
      <path d="M 20 160 C 40 150, 50 135, 45 120 C 35 130, 25 145, 20 160 Z" fill="url(#goldArch)" opacity="0.8" />
      <path d="M 20 185 C 45 180, 55 165, 50 150 C 40 160, 25 175, 20 185 Z" fill="url(#goldArch)" opacity="0.8" />
      <!-- Corner Florals Right -->
      <path d="M 300 160 C 280 150, 270 135, 275 120 C 285 130, 295 145, 300 160 Z" fill="url(#goldArch)" opacity="0.8" />
      <path d="M 300 185 C 275 180, 265 165, 270 150 C 280 160, 295 175, 300 185 Z" fill="url(#goldArch)" opacity="0.8" />
    </svg>`,
  },
  {
    id: 'sample-batik-corner',
    name: 'Batik Kawung Corner Motif',
    category: 'ornaments',
    width: 140,
    height: 140,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" width="140" height="140">
      <defs>
        <linearGradient id="goldBatik" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe8a3" />
          <stop offset="60%" stop-color="#c9a84c" />
          <stop offset="100%" stop-color="#7a5c1e" />
        </linearGradient>
      </defs>
      <!-- Corner L-Line -->
      <path d="M 5 130 L 5 5 L 130 5" fill="none" stroke="url(#goldBatik)" stroke-width="2" />
      <path d="M 12 120 L 12 12 L 120 12" fill="none" stroke="url(#goldBatik)" stroke-width="1" stroke-dasharray="2 2" />
      <!-- Kawung 4-petal intersection -->
      <g transform="translate(35, 35)">
        <ellipse cx="0" cy="-14" rx="7" ry="14" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <ellipse cx="0" cy="14" rx="7" ry="14" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <ellipse cx="-14" cy="0" rx="14" ry="7" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <ellipse cx="14" cy="0" rx="14" ry="7" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <circle cx="0" cy="0" r="3.5" fill="url(#goldBatik)" />
      </g>
      <!-- Sub Kawung -->
      <g transform="translate(80, 20) scale(0.65)">
        <ellipse cx="0" cy="-14" rx="7" ry="14" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <ellipse cx="0" cy="14" rx="7" ry="14" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <ellipse cx="-14" cy="0" rx="14" ry="7" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <ellipse cx="14" cy="0" rx="14" ry="7" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <circle cx="0" cy="0" r="3.5" fill="url(#goldBatik)" />
      </g>
      <g transform="translate(20, 80) scale(0.65)">
        <ellipse cx="0" cy="-14" rx="7" ry="14" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <ellipse cx="0" cy="14" rx="7" ry="14" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <ellipse cx="-14" cy="0" rx="14" ry="7" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <ellipse cx="14" cy="0" rx="14" ry="7" fill="none" stroke="url(#goldBatik)" stroke-width="1.5" />
        <circle cx="0" cy="0" r="3.5" fill="url(#goldBatik)" />
      </g>
    </svg>`,
  },
  {
    id: 'sample-gold-divider',
    name: 'Golden Mandorla Divider',
    category: 'ornaments',
    width: 320,
    height: 48,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 48" width="320" height="48">
      <defs>
        <linearGradient id="divGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#c9a84c" stop-opacity="0" />
          <stop offset="30%" stop-color="#c9a84c" stop-opacity="1" />
          <stop offset="50%" stop-color="#fff1c5" stop-opacity="1" />
          <stop offset="70%" stop-color="#c9a84c" stop-opacity="1" />
          <stop offset="100%" stop-color="#c9a84c" stop-opacity="0" />
        </linearGradient>
      </defs>
      <!-- Center Rhombus / Jewel -->
      <polygon points="160,14 168,24 160,34 152,24" fill="url(#divGold)" />
      <circle cx="160" cy="24" r="2.5" fill="#1a1a1a" />
      <!-- Side Flourishes -->
      <path d="M 148 24 C 135 16, 120 32, 100 24 C 80 18, 40 24, 10 24" fill="none" stroke="url(#divGold)" stroke-width="1.5" />
      <path d="M 172 24 C 185 16, 200 32, 220 24 C 240 18, 280 24, 310 24" fill="none" stroke="url(#divGold)" stroke-width="1.5" />
      <!-- Decorative dots -->
      <circle cx="138" cy="24" r="2" fill="url(#divGold)" />
      <circle cx="182" cy="24" r="2" fill="url(#divGold)" />
      <circle cx="118" cy="24" r="1.5" fill="url(#divGold)" />
      <circle cx="202" cy="24" r="1.5" fill="url(#divGold)" />
    </svg>`,
  },
  {
    id: 'sample-wedding-rings',
    name: 'Cincin Pernikahan (Wedding Rings)',
    category: 'misc',
    width: 120,
    height: 100,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" width="120" height="100">
      <defs>
        <linearGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff0bd" />
          <stop offset="40%" stop-color="#d4af37" />
          <stop offset="100%" stop-color="#805d15" />
        </linearGradient>
      </defs>
      <!-- Left Ring (Woman's with diamond) -->
      <circle cx="48" cy="55" r="24" fill="none" stroke="url(#ringGold)" stroke-width="5" />
      <!-- Diamond Gemstone on left ring -->
      <polygon points="48,22 55,30 48,34 41,30" fill="#ffffff" stroke="url(#ringGold)" stroke-width="1.2" />
      <line x1="48" y1="22" x2="48" y2="34" stroke="#d4af37" stroke-width="0.8" />
      <!-- Right Ring (Man's simple band) -->
      <circle cx="72" cy="55" r="24" fill="none" stroke="url(#ringGold)" stroke-width="5" stroke-dasharray="140 18" />
    </svg>`,
  },
  {
    id: 'sample-bunga-melati',
    name: 'Bunga Melati (Jasmine Blossom)',
    category: 'flowers',
    width: 120,
    height: 120,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="petalGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="70%" stop-color="#fdfbf7" />
          <stop offset="100%" stop-color="#e2d9c8" />
        </radialGradient>
      </defs>
      <!-- Sepal Leaves -->
      <path d="M 60 60 C 40 40, 20 65, 25 75 C 35 70, 50 65, 60 60 Z" fill="#4a6b4e" opacity="0.85" />
      <path d="M 60 60 C 80 40, 100 65, 95 75 C 85 70, 70 65, 60 60 Z" fill="#4a6b4e" opacity="0.85" />
      <path d="M 60 60 C 60 90, 45 105, 38 100 C 42 88, 52 75, 60 60 Z" fill="#3f5c42" opacity="0.85" />
      <!-- Jasmine 5 Petals -->
      <g transform="translate(60,60)">
        <path d="M 0 0 C -12 -25, -6 -40, 0 -44 C 6 -40, 12 -25, 0 0 Z" fill="url(#petalGrad)" stroke="#dcd3c0" stroke-width="0.8" />
        <g transform="rotate(72)">
          <path d="M 0 0 C -12 -25, -6 -40, 0 -44 C 6 -40, 12 -25, 0 0 Z" fill="url(#petalGrad)" stroke="#dcd3c0" stroke-width="0.8" />
        </g>
        <g transform="rotate(144)">
          <path d="M 0 0 C -12 -25, -6 -40, 0 -44 C 6 -40, 12 -25, 0 0 Z" fill="url(#petalGrad)" stroke="#dcd3c0" stroke-width="0.8" />
        </g>
        <g transform="rotate(216)">
          <path d="M 0 0 C -12 -25, -6 -40, 0 -44 C 6 -40, 12 -25, 0 0 Z" fill="url(#petalGrad)" stroke="#dcd3c0" stroke-width="0.8" />
        </g>
        <g transform="rotate(288)">
          <path d="M 0 0 C -12 -25, -6 -40, 0 -44 C 6 -40, 12 -25, 0 0 Z" fill="url(#petalGrad)" stroke="#dcd3c0" stroke-width="0.8" />
        </g>
        <!-- Center pistil -->
        <circle cx="0" cy="0" r="5" fill="#f4d160" />
        <circle cx="0" cy="0" r="2.5" fill="#c9a84c" />
      </g>
    </svg>`,
  },
  {
    id: 'sample-floral-wreath',
    name: 'Crest Floral Wedding Wreath',
    category: 'flora',
    width: 260,
    height: 260,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" width="260" height="260">
      <defs>
        <linearGradient id="wreathGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fad961" />
          <stop offset="50%" stop-color="#c9a84c" />
          <stop offset="100%" stop-color="#7a5c1e" />
        </linearGradient>
      </defs>
      <!-- Circular Branches -->
      <path d="M 130 20 C 65 20, 20 75, 20 130 C 20 185, 65 240, 130 240" fill="none" stroke="url(#wreathGold)" stroke-width="1.8" />
      <path d="M 130 20 C 195 20, 240 75, 240 130 C 240 185, 195 240, 130 240" fill="none" stroke="url(#wreathGold)" stroke-width="1.8" />
      <!-- Leaves along left branch -->
      <path d="M 130 20 C 122 10, 110 16, 116 26 Z" fill="url(#wreathGold)" />
      <path d="M 85 36 C 75 30, 68 40, 78 46 Z" fill="url(#wreathGold)" />
      <path d="M 50 68 C 38 64, 34 76, 44 80 Z" fill="url(#wreathGold)" />
      <path d="M 28 110 C 16 112, 16 124, 27 124 Z" fill="url(#wreathGold)" />
      <path d="M 24 155 C 14 160, 18 172, 28 168 Z" fill="url(#wreathGold)" />
      <path d="M 45 195 C 38 205, 50 212, 56 202 Z" fill="url(#wreathGold)" />
      <path d="M 82 226 C 80 238, 92 240, 94 228 Z" fill="url(#wreathGold)" />
      <!-- Leaves along right branch -->
      <path d="M 130 20 C 138 10, 150 16, 144 26 Z" fill="url(#wreathGold)" />
      <path d="M 175 36 C 185 30, 192 40, 182 46 Z" fill="url(#wreathGold)" />
      <path d="M 210 68 C 222 64, 226 76, 216 80 Z" fill="url(#wreathGold)" />
      <path d="M 232 110 C 244 112, 244 124, 233 124 Z" fill="url(#wreathGold)" />
      <path d="M 236 155 C 246 160, 242 172, 232 168 Z" fill="url(#wreathGold)" />
      <path d="M 215 195 C 222 205, 210 212, 204 202 Z" fill="url(#wreathGold)" />
      <path d="M 178 226 C 180 238, 168 240, 166 228 Z" fill="url(#wreathGold)" />
      <!-- Bottom Ribbon Tie -->
      <circle cx="130" cy="240" r="4" fill="url(#wreathGold)" />
      <path d="M 130 240 C 115 252, 105 258, 95 255" fill="none" stroke="url(#wreathGold)" stroke-width="1.5" />
      <path d="M 130 240 C 145 252, 155 258, 165 255" fill="none" stroke="url(#wreathGold)" stroke-width="1.5" />
    </svg>`,
  },
];
