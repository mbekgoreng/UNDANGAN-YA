// ============================================================
// Indonesian Digital Invitation Template Factory
// Builds full, production-ready scene structures with authentic Indonesian typography and layouts
// ============================================================
import type { Project, Scene, TextObject, ShapeObject, ImageObject } from '../../schemas/project';
import { createDefaultScene } from '../../schemas/project';

function createText(
  name: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  overrides?: Partial<TextObject>
): TextObject {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: Date.now() + Math.floor(Math.random() * 100),
    text,
    fontFamily: 'Playfair Display, Georgia, serif',
    fontSize,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    lineHeight: 1.3,
    letterSpacing: 0.5,
    fill: '#f0ece4',
    textDecoration: 'none',
    animation: {
      preset: 'fadeIn',
      duration: 1,
      delay: 0.2,
      easing: 'easeOut',
      loop: false,
      startTime: 0,
      endTime: 1,
    },
    ...overrides,
  };
}

function createShape(
  name: string,
  shapeType: 'rect' | 'ellipse',
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke = 'transparent',
  strokeWidth = 0,
  cornerRadius = 0
): ShapeObject {
  return {
    id: crypto.randomUUID(),
    type: 'shape',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: Date.now() + Math.floor(Math.random() * 100),
    shapeType,
    fill,
    stroke,
    strokeWidth,
    cornerRadius,
    animation: {
      preset: 'none',
      duration: 1,
      delay: 0,
      easing: 'easeOut',
      loop: false,
      startTime: 0,
      endTime: 1,
    },
  };
}

function createImage(
  name: string,
  assetId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  animPreset: any = 'fadeIn'
): ImageObject {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: Date.now() + Math.floor(Math.random() * 100),
    assetId,
    flipX: false,
    flipY: false,
    animation: {
      preset: animPreset,
      duration: 1.2,
      delay: 0.2,
      easing: 'easeOut',
      loop: false,
      startTime: 0,
      endTime: 1.2,
    },
  };
}

export function buildJavaneseGoldTemplate(): Scene[] {
  const bg = '#161922';

  // 1. Opening Envelope
  const s1: Scene = createDefaultScene({
    name: '1. Opening Envelope',
    backgroundColor: bg,
    duration: 5,
    objects: [
      createShape('Card Border', 'rect', 20, 30, 350, 784, 'rgba(201,168,76,0.03)', '#c9a84c', 1, 8),
      createImage('Gunungan Motif', 'sample-gunungan-wayang', 95, 80, 200, 280, 'softPop'),
      createText('Tagline', 'THE WEDDING INVITATION', 45, 390, 300, 24, 11, {
        fill: '#c9a84c',
        letterSpacing: 3,
        fontWeight: 'bold',
        animation: { preset: 'fadeIn', duration: 0.8, delay: 0.5, easing: 'easeOut', loop: false, startTime: 0, endTime: 0.8 },
      }),
      createText('Mempelai Title', 'Raden & Dian', 35, 430, 320, 56, 36, {
        fill: '#f5e8c7',
        animation: { preset: 'slideUp', duration: 1, delay: 0.8, easing: 'easeOut', loop: false, startTime: 0, endTime: 1 },
      }),
      createText('Tamu Label', 'Kepada Yth. Bapak/Ibu/Saudara/i', 45, 520, 300, 24, 11, {
        fill: '#9a9590',
        animation: { preset: 'fadeIn', duration: 0.8, delay: 1.1, easing: 'easeOut', loop: false, startTime: 0, endTime: 0.8 },
      }),
      createText('Tamu Nama', '{nama}', 45, 545, 300, 30, 16, {
        fill: '#e2d3af',
        fontWeight: 'bold',
        animation: { preset: 'fadeIn', duration: 0.8, delay: 1.3, easing: 'easeOut', loop: false, startTime: 0, endTime: 0.8 },
      }),
      createShape('Button Buka Undangan BG', 'rect', 105, 620, 180, 44, '#c9a84c', 'transparent', 0, 22),
      createText('Button Buka Undangan Text', '✉ Buka Undangan', 105, 630, 180, 24, 12, {
        fill: '#1a1917',
        fontWeight: 'bold',
        letterSpacing: 1,
        animation: { preset: 'slowPulse', duration: 2, delay: 1.5, easing: 'easeInOut', loop: true, startTime: 0, endTime: 2 },
      }),
    ],
  });

  // 2. Main Hero
  const s2: Scene = createDefaultScene({
    name: '2. Main Hero',
    backgroundColor: '#1a1e29',
    duration: 5,
    objects: [
      createImage('Botanical Arch', 'sample-floral-arch', 35, 40, 320, 460, 'fadeIn'),
      createImage('Wedding Rings', 'sample-wedding-rings', 145, 120, 100, 80, 'softPop'),
      createText('Subtitle', 'WALIMATUL ‘URS', 45, 230, 300, 24, 12, {
        fill: '#c9a84c',
        letterSpacing: 4,
        fontWeight: 'bold',
        animation: { preset: 'fadeIn', duration: 0.8, delay: 0.3, easing: 'easeOut', loop: false, startTime: 0, endTime: 0.8 },
      }),
      createText('Hero Names', 'Raden Bagus\n&\nDian Laksmi', 35, 270, 320, 140, 32, {
        fill: '#f0ece4',
        lineHeight: 1.4,
        animation: { preset: 'slideUp', duration: 1.2, delay: 0.6, easing: 'easeOut', loop: false, startTime: 0, endTime: 1.2 },
      }),
      createImage('Gold Divider', 'sample-gold-divider', 45, 430, 300, 40, 'fadeIn'),
      createText('Date', 'SABTU, 12 DESEMBER 2026', 45, 480, 300, 30, 13, {
        fill: '#c9a84c',
        letterSpacing: 2,
        fontWeight: 'bold',
        animation: { preset: 'fadeIn', duration: 0.8, delay: 1, easing: 'easeOut', loop: false, startTime: 0, endTime: 0.8 },
      }),
    ],
  });

  // 3. Couple Introduction
  const s3: Scene = createDefaultScene({
    name: '3. Mempelai',
    backgroundColor: bg,
    duration: 6,
    objects: [
      createText('Salam', 'Assalamu’alaikum Warahmatullahi Wabarakatuh', 35, 60, 320, 30, 11, {
        fill: '#c9a84c',
        animation: { preset: 'fadeIn', duration: 0.8, delay: 0.2, easing: 'easeOut', loop: false, startTime: 0, endTime: 0.8 },
      }),
      createText('Ayat', '“Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya...”\n(QS. Ar-Rum: 21)', 40, 95, 310, 80, 10, {
        fill: '#9a9590',
        fontStyle: 'italic',
        lineHeight: 1.5,
        animation: { preset: 'fadeIn', duration: 1, delay: 0.5, easing: 'easeOut', loop: false, startTime: 0, endTime: 1 },
      }),
      // Groom
      createShape('Groom Photo Frame', 'ellipse', 145, 190, 100, 100, 'rgba(201,168,76,0.1)', '#c9a84c', 2),
      createText('Groom Name', 'Raden Bagus Prakoso, S.T.', 35, 305, 320, 32, 17, {
        fill: '#f0ece4',
        fontWeight: 'bold',
        animation: { preset: 'slideUp', duration: 0.8, delay: 0.8, easing: 'easeOut', loop: false, startTime: 0, endTime: 0.8 },
      }),
      createText('Groom Parents', 'Putra pertama dari\nBpk. Hartono & Ibu Sri Rahayu', 35, 340, 320, 36, 11, {
        fill: '#9a9590',
        lineHeight: 1.4,
        animation: { preset: 'fadeIn', duration: 0.8, delay: 1, easing: 'easeOut', loop: false, startTime: 0, endTime: 0.8 },
      }),
      createImage('Divider Middle', 'sample-gold-divider', 70, 395, 250, 32, 'fadeIn'),
      // Bride
      createShape('Bride Photo Frame', 'ellipse', 145, 440, 100, 100, 'rgba(201,168,76,0.1)', '#c9a84c', 2),
      createText('Bride Name', 'dr. Dian Laksmi Wardani', 35, 555, 320, 32, 17, {
        fill: '#f0ece4',
        fontWeight: 'bold',
        animation: { preset: 'slideUp', duration: 0.8, delay: 1.2, easing: 'easeOut', loop: false, startTime: 0, endTime: 0.8 },
      }),
      createText('Bride Parents', 'Putri kedua dari\nBpk. Bambang Irawan & Ibu Ratna Dewi', 35, 590, 320, 36, 11, {
        fill: '#9a9590',
        lineHeight: 1.4,
        animation: { preset: 'fadeIn', duration: 0.8, delay: 1.4, easing: 'easeOut', loop: false, startTime: 0, endTime: 0.8 },
      }),
    ],
  });

  // 4. Event Details
  const s4: Scene = createDefaultScene({
    name: '4. Jadwal Acara',
    backgroundColor: '#1a1e29',
    duration: 5,
    objects: [
      createText('Event Title', 'RANGKAIAN ACARA', 45, 60, 300, 28, 14, {
        fill: '#c9a84c',
        letterSpacing: 3,
        fontWeight: 'bold',
      }),
      // Akad Card
      createShape('Akad Card BG', 'rect', 35, 110, 320, 240, 'rgba(255,255,255,0.03)', '#c9a84c', 1, 8),
      createText('Akad Label', 'AKAD NIKAH', 45, 130, 300, 26, 16, { fill: '#f5e8c7', fontWeight: 'bold' }),
      createImage('Melati Akad', 'sample-bunga-melati', 165, 160, 60, 60, 'gentleFloat'),
      createText('Akad Time', 'Sabtu, 12 Desember 2026\nPukul 08.00 - 10.00 WIB', 45, 230, 300, 44, 13, { fill: '#c9a84c', lineHeight: 1.4 }),
      createText('Akad Place', 'Masjid At-Tin, TMII\nJakarta Timur', 45, 280, 300, 36, 12, { fill: '#9a9590' }),
      // Resepsi Card
      createShape('Resepsi Card BG', 'rect', 35, 380, 320, 260, 'rgba(255,255,255,0.03)', '#c9a84c', 1, 8),
      createText('Resepsi Label', 'RESEPSI PERNIKAHAN', 45, 400, 300, 26, 16, { fill: '#f5e8c7', fontWeight: 'bold' }),
      createImage('Melati Resepsi', 'sample-bunga-melati', 165, 435, 60, 60, 'gentleFloat'),
      createText('Resepsi Time', 'Sabtu, 12 Desember 2026\nPukul 11.00 - 14.00 WIB', 45, 505, 300, 44, 13, { fill: '#c9a84c', lineHeight: 1.4 }),
      createText('Resepsi Place', 'Gedung Sasana Kriya, TMII\nJakarta Timur', 45, 555, 300, 36, 12, { fill: '#9a9590' }),
      createShape('Maps Button', 'rect', 115, 600, 160, 32, 'rgba(201,168,76,0.15)', '#c9a84c', 1, 16),
      createText('Maps Text', '📍 Buka Google Maps', 115, 607, 160, 20, 11, { fill: '#f5e8c7', fontWeight: 'bold' }),
    ],
  });

  // 5. Photo Gallery
  const s5: Scene = createDefaultScene({
    name: '5. Galeri Foto',
    backgroundColor: bg,
    duration: 5,
    objects: [
      createText('Gallery Title', 'MOMEN BAHAGIA', 45, 60, 300, 28, 14, {
        fill: '#c9a84c',
        letterSpacing: 3,
        fontWeight: 'bold',
      }),
      createShape('Photo Frame 1', 'rect', 35, 110, 320, 220, 'rgba(201,168,76,0.05)', '#c9a84c', 1, 6),
      createText('Placeholder Photo 1', '📸 Galeri Pre-Wedding 1\n(Tarik foto dari panel Assets)', 45, 200, 300, 44, 12, { fill: '#7a7670' }),
      createShape('Photo Frame 2', 'rect', 35, 350, 155, 180, 'rgba(201,168,76,0.05)', '#c9a84c', 1, 6),
      createText('Placeholder Photo 2', '📸 Foto 2', 40, 420, 145, 30, 11, { fill: '#7a7670' }),
      createShape('Photo Frame 3', 'rect', 200, 350, 155, 180, 'rgba(201,168,76,0.05)', '#c9a84c', 1, 6),
      createText('Placeholder Photo 3', '📸 Foto 3', 205, 420, 145, 30, 11, { fill: '#7a7670' }),
      createImage('Corner Top Left', 'sample-batik-corner', 25, 100, 70, 70, 'fadeIn'),
    ],
  });

  // 6. Closing
  const s6: Scene = createDefaultScene({
    name: '6. Penutup & Doa',
    backgroundColor: '#12141c',
    duration: 5,
    objects: [
      createImage('Wreath Crest', 'sample-floral-wreath', 115, 80, 160, 160, 'gentleFloat'),
      createText('Inisial', 'R & D', 95, 138, 200, 44, 26, { fill: '#c9a84c', fontWeight: 'bold' }),
      createText('Ucapan Terima Kasih', 'UNGKAPAN SYUKUR & DOA', 45, 270, 300, 28, 13, {
        fill: '#c9a84c',
        letterSpacing: 2,
        fontWeight: 'bold',
      }),
      createText('Closing Message', 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu kepada kedua mempelai.\n\nAtas kehadiran dan doa restunya, kami ucapkan terima kasih.', 45, 320, 300, 140, 12, {
        fill: '#9a9590',
        lineHeight: 1.6,
      }),
      createImage('Divider Closing', 'sample-gold-divider', 45, 470, 300, 36, 'fadeIn'),
      createText('Family Names', 'Kami yang berbahagia,\nKeluarga Besar Bpk. Hartono\n&\nKeluarga Besar Bpk. Bambang Irawan', 45, 520, 300, 90, 12, {
        fill: '#f0ece4',
        lineHeight: 1.5,
      }),
      createText('Brand Watermark', 'UndangYa! Digital Invitation', 45, 750, 300, 24, 10, {
        fill: '#4a4640',
        letterSpacing: 1,
      }),
    ],
  });

  return [s1, s2, s3, s4, s5, s6];
}

// ---- Non-wedding celebration templates (birthday, khitanan, aqiqah) ----
interface CelebrationConfig {
  bg: string;
  accent: string;
  soft: string;
  tagline: string;
  heroTitle: string;
  heroName: string;
  dateText: string;
  detailLines: string[];
  closingText: string;
  familyLine: string;
}

function buildCelebrationTemplate(cfg: CelebrationConfig): Scene[] {
  const fade = (delay: number) => ({ preset: 'fadeIn' as const, duration: 0.8, delay, easing: 'easeOut' as const, loop: false, startTime: 0, endTime: 0.8 });

  const s1: Scene = createDefaultScene({
    name: '1. Opening Envelope',
    backgroundColor: cfg.bg,
    duration: 5,
    objects: [
      createShape('Card Border', 'rect', 20, 30, 350, 784, 'rgba(255,255,255,0.02)', cfg.accent, 1, 8),
      createImage('Botanical Arch', 'sample-floral-arch', 55, 70, 280, 380, 'softPop'),
      createText('Tagline', cfg.tagline, 45, 470, 300, 24, 11, { fill: cfg.accent, letterSpacing: 3, fontWeight: 'bold', animation: fade(0.5) }),
      createText('Hero Name', cfg.heroName, 35, 505, 320, 56, 34, { fill: cfg.soft, animation: { preset: 'slideUp', duration: 1, delay: 0.8, easing: 'easeOut', loop: false, startTime: 0, endTime: 1 } }),
      createText('Tamu Label', 'Kepada Yth. Bapak/Ibu/Saudara/i', 45, 600, 300, 24, 11, { fill: '#9a9590', animation: fade(1.1) }),
      createText('Tamu Nama', '{nama}', 45, 625, 300, 30, 16, { fill: cfg.soft, fontWeight: 'bold', animation: fade(1.3) }),
      createShape('Button Buka Undangan BG', 'rect', 105, 690, 180, 44, cfg.accent, 'transparent', 0, 22),
      createText('Button Buka Undangan Text', '✉ Buka Undangan', 105, 700, 180, 24, 12, { fill: '#1a1917', fontWeight: 'bold', letterSpacing: 1, animation: { preset: 'slowPulse', duration: 2, delay: 1.5, easing: 'easeInOut', loop: true, startTime: 0, endTime: 2 } }),
    ],
  });

  const s2: Scene = createDefaultScene({
    name: '2. Sambutan',
    backgroundColor: cfg.bg,
    duration: 5,
    objects: [
      createText('Hero Title', cfg.heroTitle, 35, 90, 320, 90, 30, { fill: cfg.soft, lineHeight: 1.35, animation: { preset: 'slideUp', duration: 1, delay: 0.3, easing: 'easeOut', loop: false, startTime: 0, endTime: 1 } }),
      createImage('Gold Divider', 'sample-gold-divider', 45, 200, 300, 40, 'fadeIn'),
      createText('Date', cfg.dateText, 45, 260, 300, 30, 14, { fill: cfg.accent, letterSpacing: 2, fontWeight: 'bold', animation: fade(0.8) }),
      createText('Intro', 'Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa terbaik.', 45, 330, 300, 90, 13, { fill: '#c9c4bb', lineHeight: 1.6, animation: fade(1) }),
    ],
  });

  const s3: Scene = createDefaultScene({
    name: '3. Detail Acara',
    backgroundColor: cfg.bg,
    duration: 5,
    objects: [
      createText('Detail Title', 'WAKTU & TEMPAT', 45, 90, 300, 30, 15, { fill: cfg.accent, letterSpacing: 3, fontWeight: 'bold', animation: fade(0.3) }),
      ...cfg.detailLines.map((line, i) => createText(`Detail ${i + 1}`, line, 45, 150 + i * 56, 300, 44, 14, { fill: cfg.soft, lineHeight: 1.5, animation: fade(0.5 + i * 0.2) })),
      createText('Note', 'Hitung mundur, peta lokasi, RSVP, dan amplop digital tampil otomatis dari menu Acara & Musik.', 45, 560, 300, 60, 11, { fill: '#9a9590', lineHeight: 1.5, animation: fade(1.2) }),
    ],
  });

  const s4: Scene = createDefaultScene({
    name: '4. Penutup',
    backgroundColor: cfg.bg,
    duration: 5,
    objects: [
      createText('Closing', cfg.closingText, 45, 200, 300, 120, 13, { fill: '#c9c4bb', lineHeight: 1.7, animation: fade(0.3) }),
      createText('Thanks', 'Terima Kasih', 35, 360, 320, 50, 30, { fill: cfg.soft, animation: { preset: 'slideUp', duration: 1, delay: 0.6, easing: 'easeOut', loop: false, startTime: 0, endTime: 1 } }),
      createText('Family', cfg.familyLine, 45, 430, 300, 30, 12, { fill: cfg.accent, animation: fade(0.9) }),
    ],
  });

  return [s1, s2, s3, s4];
}

const CELEBRATION_TEMPLATES: Record<string, CelebrationConfig> = {
  'birthday-sweet': {
    bg: '#221334', accent: '#e8a2c8', soft: '#fdf3e7',
    tagline: 'UNDANGAN ULANG TAHUN',
    heroTitle: 'Sweet Seventeen\nAlesha Putri',
    heroName: 'Alesha Putri',
    dateText: 'SABTU, 20 MARET 2027',
    detailLines: ['Sabtu, 20 Maret 2027', 'Pukul 16.00 WIB — selesai', 'The Garden Hall, Jakarta Selatan', 'Dresscode: pastel & putih'],
    closingText: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami sekeluarga apabila Bapak/Ibu/Saudara/i berkenan hadir untuk merayakan hari istimewa putri kami.',
    familyLine: 'Keluarga Besar Alesha Putri',
  },
  'khitanan-teal': {
    bg: '#0b2536', accent: '#7fd4c1', soft: '#eef7f2',
    tagline: 'WALIMATUL KHITAN',
    heroTitle: 'Khitanan\nRaffasya Alfarezi',
    heroName: 'Raffasya Alfarezi',
    dateText: 'MINGGU, 11 APRIL 2027',
    detailLines: ['Minggu, 11 April 2027', 'Pukul 09.00 WIB — selesai', 'Kediaman Bapak Hendra, Jakarta Timur', 'Dilanjutkan ramah tamah & hiburan'],
    closingText: 'Semoga ananda menjadi anak yang saleh, berbakti kepada orang tua, serta berguna bagi agama, bangsa, dan negara. Aamiin.',
    familyLine: 'Keluarga Bapak Hendra & Ibu Ratna',
  },
  'aqiqah-cream': {
    bg: '#2b1d16', accent: '#e8c39e', soft: '#fdf6ec',
    tagline: 'TASYAKURAN AQIQAH',
    heroTitle: 'Aqiqah\nAruna Sekar Ayu',
    heroName: 'Aruna Sekar Ayu',
    dateText: 'SABTU, 8 MEI 2027',
    detailLines: ['Sabtu, 8 Mei 2027', 'Pukul 10.00 WIB — selesai', 'Kediaman kami, Depok', 'Dresscode: putih & krem'],
    closingText: 'Puji syukur ke hadirat Allah SWT atas kelahiran putri kami. Kami mengundang Bapak/Ibu/Saudara/i untuk hadir memberikan doa pada tasyakuran aqiqah ananda.',
    familyLine: 'Keluarga Bapak Dimas & Ibu Ayu',
  },
};

export function buildTemplateProject(templateId: string, name: string): Project {
  let scenes: Scene[] = [];
  let bgColor = '#161922';

  if (CELEBRATION_TEMPLATES[templateId]) {
    scenes = buildCelebrationTemplate(CELEBRATION_TEMPLATES[templateId]);
    bgColor = CELEBRATION_TEMPLATES[templateId].bg;
  } else if (templateId === 'javanese-gold' || templateId === 'luxury-wedding') {
    scenes = buildJavaneseGoldTemplate();
    bgColor = '#161922';
  } else if (templateId === 'emerald-botanical') {
    bgColor = '#0e241b';
    scenes = buildJavaneseGoldTemplate().map(s => ({
      ...s,
      backgroundColor: bgColor,
    }));
  } else if (templateId === 'royal-maroon') {
    bgColor = '#290c14';
    scenes = buildJavaneseGoldTemplate().map(s => ({
      ...s,
      backgroundColor: bgColor,
    }));
  } else {
    scenes = buildJavaneseGoldTemplate();
  }

  return {
    meta: {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
    },
    canvas: {
      width: 390,
      height: 844,
      preset: 'mobile',
      backgroundColor: bgColor,
    },
    scenes,
    exportConfig: {
      outputDir: 'dist-invitation',
      minify: true,
      includeAnimations: true,
    },
    event: { dateISO: '', venueName: '', venueAddress: '', mapsUrl: '', rsvpWhatsapp: '', giftAccounts: [] },
    music: {},
  };
}
