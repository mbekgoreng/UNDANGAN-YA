// ============================================================
// Sample Flawed AI-Generated Invitation Project
// Simulates realistic AI outputs with overlapping floral decor, misplaced rings, and awkward mobile alignment
// ============================================================
import fs from 'fs';
import path from 'path';

export function createSampleInvitation(targetDir: string) {
  if (fs.existsSync(targetDir)) return;
  fs.mkdirSync(targetDir, { recursive: true });

  const assetsDir = path.join(targetDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  // 1. Assets (Clean SVG vectors)
  const gununganSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="300" height="420">
    <defs>
      <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fad961" />
        <stop offset="50%" stop-color="#c9a84c" />
        <stop offset="100%" stop-color="#8a6d2b" />
      </linearGradient>
    </defs>
    <path d="M 150 15 C 190 70, 260 180, 275 280 C 285 340, 250 375, 210 380 C 190 382, 175 385, 175 410 L 125 410 C 125 385, 110 382, 90 380 C 50 375, 15 340, 25 280 C 40 180, 110 70, 150 15 Z" fill="none" stroke="url(#goldG)" stroke-width="3" />
    <line x1="150" y1="45" x2="150" y2="370" stroke="url(#goldG)" stroke-width="2" />
    <circle cx="150" cy="16" r="4" fill="url(#goldG)" />
  </svg>`;
  fs.writeFileSync(path.join(assetsDir, 'gunungan.svg'), gununganSvg, 'utf-8');

  const ringsSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" width="120" height="100">
    <circle cx="48" cy="55" r="24" fill="none" stroke="#d4af37" stroke-width="5" />
    <polygon points="48,22 55,30 48,34 41,30" fill="#ffffff" stroke="#d4af37" stroke-width="1.2" />
    <circle cx="72" cy="55" r="24" fill="none" stroke="#d4af37" stroke-width="5" />
  </svg>`;
  fs.writeFileSync(path.join(assetsDir, 'wedding-rings.svg'), ringsSvg, 'utf-8');

  const flowerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <circle cx="60" cy="60" r="18" fill="#c9a84c" />
    <circle cx="60" cy="30" r="14" fill="#fdfbf7" opacity="0.9" />
    <circle cx="90" cy="60" r="14" fill="#fdfbf7" opacity="0.9" />
    <circle cx="60" cy="90" r="14" fill="#fdfbf7" opacity="0.9" />
    <circle cx="30" cy="60" r="14" fill="#fdfbf7" opacity="0.9" />
  </svg>`;
  fs.writeFileSync(path.join(assetsDir, 'flower-ornament.svg'), flowerSvg, 'utf-8');

  const archSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 460" width="320" height="460">
    <path d="M 20 440 L 20 160 C 20 70, 300 70, 300 160 L 300 440" fill="none" stroke="#c9a84c" stroke-width="2" />
  </svg>`;
  fs.writeFileSync(path.join(assetsDir, 'botanical-arch.svg'), archSvg, 'utf-8');

  // 2. index.html (realistic invitation with some elements overlapping or misplaced)
  const indexHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pernikahan Raden & Dian - The Wedding</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="invitation-container">
    <!-- SECTION 1: COVER / OPENING -->
    <section class="section section-cover" id="cover">
      <div class="decorative-arch">
        <img src="assets/botanical-arch.svg" class="arch-img" id="arch-top" alt="Arch Border">
      </div>
      
      <!-- Overlapping misplaced asset (AI mistake: placed too low and overlapping text) -->
      <img src="assets/gunungan.svg" class="gunungan-asset" id="gunungan-main" alt="Gunungan Wayang">

      <div class="cover-content">
        <p class="tagline" id="tagline-text">THE WEDDING OF</p>
        <h1 class="couple-title" id="couple-main-title">Raden & Dian</h1>
        <p class="date-badge" id="wedding-date">12 . 12 . 2026</p>

        <div class="guest-box" id="guest-card">
          <p class="guest-label">Kepada Yth. Bapak/Ibu/Saudara/i</p>
          <h3 class="guest-name" id="guest-name-text">Tamu Undangan</h3>
          <button class="btn-open" id="btn-open-invitation">✉ Buka Undangan</button>
        </div>
      </div>

      <!-- Misplaced corner flower (AI mistake: cropped by container boundary) -->
      <img src="assets/flower-ornament.svg" class="flower-corner" id="flower-bottom-left" alt="Corner Flower">
    </section>

    <!-- SECTION 2: MEMPELAI -->
    <section class="section section-couple" id="couple">
      <h2 class="section-title">Kedua Mempelai</h2>
      <p class="verse-text" id="verse-rum">
        "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri..." (QS. Ar-Rum: 21)
      </p>

      <!-- Misplaced rings ornament -->
      <img src="assets/wedding-rings.svg" class="rings-decor" id="rings-couple" alt="Wedding Rings">

      <div class="couple-grid">
        <div class="profile-card profile-groom" id="profile-groom">
          <div class="avatar-circle">
            <span class="avatar-letter">R</span>
          </div>
          <h3 class="person-name">Raden Bagus Prakoso, S.T.</h3>
          <p class="parents-info">Putra pertama dari Bpk. Hartono & Ibu Sri Rahayu</p>
        </div>

        <div class="ampersand-sign">&</div>

        <div class="profile-card profile-bride" id="profile-bride">
          <div class="avatar-circle">
            <span class="avatar-letter">D</span>
          </div>
          <h3 class="person-name">dr. Dian Laksmi Wardani</h3>
          <p class="parents-info">Putri kedua dari Bpk. Bambang Irawan & Ibu Ratna Dewi</p>
        </div>
      </div>
    </section>

    <!-- SECTION 3: ACARA -->
    <section class="section section-events" id="events">
      <h2 class="section-title">Waktu & Tempat</h2>
      
      <div class="event-card" id="card-akad">
        <h3 class="event-name">AKAD NIKAH</h3>
        <p class="event-time">Pukul 08.00 - 10.00 WIB</p>
        <p class="event-loc">Masjid At-Tin, TMII, Jakarta Timur</p>
      </div>

      <div class="event-card" id="card-resepsi">
        <h3 class="event-name">RESEPSI PERNIKAHAN</h3>
        <p class="event-time">Pukul 11.00 - 14.00 WIB</p>
        <p class="event-loc">Gedung Sasana Kriya, TMII, Jakarta Timur</p>
      </div>
    </section>
  </div>

  <script src="script.js"></script>
</body>
</html>`;
  fs.writeFileSync(path.join(targetDir, 'index.html'), indexHtml, 'utf-8');

  // 3. style.css (includes realistic CSS rules that need tuning)
  const styleCss = `/* Stylesheet for AI-generated Invitation */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #0d0f14;
  color: #f0ece4;
  font-family: 'Plus Jakarta Sans', sans-serif;
  display: flex;
  justify-content: center;
}

.invitation-container {
  width: 100%;
  max-width: 420px;
  background-color: #141720;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 50px rgba(0,0,0,0.8);
}

.section {
  padding: 40px 20px;
  position: relative;
  text-align: center;
  border-bottom: 1px solid rgba(201, 168, 76, 0.15);
}

/* SECTION COVER */
.section-cover {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at center, #1c2230 0%, #10131a 100%);
}

.decorative-arch {
  position: absolute;
  top: 10px;
  left: 20px;
  right: 20px;
  pointer-events: none;
}

.arch-img {
  width: 100%;
  opacity: 0.6;
}

/* AI flaw: placed too low and covers text */
.gunungan-asset {
  position: absolute;
  top: 130px;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  opacity: 0.85;
  z-index: 1;
}

.cover-content {
  position: relative;
  z-index: 2;
  margin-top: 180px;
}

.tagline {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: 4px;
  color: #c9a84c;
  margin-bottom: 12px;
}

.couple-title {
  font-family: 'Playfair Display', serif;
  font-size: 38px;
  font-weight: 700;
  color: #fcefd2;
  margin-bottom: 14px;
}

.date-badge {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  letter-spacing: 3px;
  color: #c9a84c;
  margin-bottom: 24px;
}

.guest-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 8px;
  padding: 16px 20px;
  margin-top: 20px;
}

.guest-label {
  font-size: 10px;
  color: #8f9ba8;
  margin-bottom: 6px;
}

.guest-name {
  font-size: 16px;
  color: #f0ece4;
  font-weight: 600;
  margin-bottom: 14px;
}

.btn-open {
  background: #c9a84c;
  color: #141720;
  border: none;
  border-radius: 20px;
  padding: 8px 24px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-open:hover {
  transform: scale(1.05);
}

/* AI flaw: misplaced flower element */
.flower-corner {
  position: absolute;
  bottom: -20px;
  left: -20px;
  width: 100px;
  opacity: 0.7;
}

/* SECTION COUPLE */
.section-couple {
  background-color: #161a24;
}

.section-title {
  font-family: 'Cinzel', serif;
  font-size: 18px;
  color: #c9a84c;
  letter-spacing: 2px;
  margin-bottom: 16px;
}

.verse-text {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 11px;
  color: #8f9ba8;
  line-height: 1.6;
  margin-bottom: 24px;
}

/* AI flaw: awkward position */
.rings-decor {
  width: 70px;
  margin: 0 auto 20px auto;
  display: block;
}

.couple-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 8px;
  padding: 20px;
}

.avatar-circle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 2px solid #c9a84c;
  margin: 0 auto 12px auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-letter {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  color: #c9a84c;
}

.person-name {
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  color: #fcefd2;
  margin-bottom: 6px;
}

.parents-info {
  font-size: 11px;
  color: #8f9ba8;
  line-height: 1.4;
}

.ampersand-sign {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: #c9a84c;
}

/* SECTION EVENTS */
.section-events {
  background-color: #12151e;
}

.event-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(201, 168, 76, 0.25);
  border-radius: 8px;
  padding: 18px;
  margin-bottom: 16px;
}

.event-name {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  color: #c9a84c;
  margin-bottom: 8px;
}

.event-time {
  font-size: 13px;
  color: #f0ece4;
  margin-bottom: 6px;
}

.event-loc {
  font-size: 11px;
  color: #8f9ba8;
}
`;
  fs.writeFileSync(path.join(targetDir, 'style.css'), styleCss, 'utf-8');

  // 4. script.js (interactive invitation script)
  const scriptJs = `// Simple interaction
document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('btn-open-invitation');
  if (btn) {
    btn.addEventListener('click', function() {
      var coupleSec = document.getElementById('couple');
      if (coupleSec) {
        coupleSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});`;
  fs.writeFileSync(path.join(targetDir, 'script.js'), scriptJs, 'utf-8');
}
