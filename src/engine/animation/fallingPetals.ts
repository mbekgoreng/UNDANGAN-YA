// ============================================================
// Falling Petals Ambient Effect (Lightweight HTML5 Canvas Particle System)
// Designed for Indonesian Luxury Wedding Invitations
// ============================================================

export interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
}

export class PetalSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private petals: Petal[] = [];
  private animId: number | null = null;
  private isRunning = false;
  private maxPetals = 28;

  constructor(canvas: HTMLCanvasElement, maxPetals = 28) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maxPetals = maxPetals;
    this.initPetals();
  }

  private initPetals() {
    this.petals = [];
    const colors = [
      'rgba(255, 248, 230, 0.75)', // Jasmine white cream
      'rgba(240, 215, 140, 0.65)', // Soft gold
      'rgba(255, 230, 235, 0.7)',  // Soft blush rose
      'rgba(201, 168, 76, 0.6)',   // Champagne
    ];

    const w = this.canvas.width || 390;
    const h = this.canvas.height || 844;

    for (let i = 0; i < this.maxPetals; i++) {
      this.petals.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 6 + Math.random() * 8,
        speedY: 0.8 + Math.random() * 1.4,
        speedX: (Math.random() - 0.5) * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        opacity: 0.4 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const loop = () => {
      this.update();
      this.draw();
      if (this.isRunning) {
        this.animId = requestAnimationFrame(loop);
      }
    };
    this.animId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private update() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (const p of this.petals) {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.y * 0.015) * 0.5;
      p.rotation += p.rotationSpeed;

      // Wrap around
      if (p.y > h + 20) {
        p.y = -15;
        p.x = Math.random() * w;
      }
      if (p.x < -20) p.x = w + 10;
      if (p.x > w + 20) p.x = -10;
    }
  }

  private draw() {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.petals) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      // Draw graceful curved petal shape
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.quadraticCurveTo(p.size * 0.8, -p.size * 0.3, p.size * 0.4, p.size * 0.6);
      ctx.quadraticCurveTo(0, p.size, -p.size * 0.4, p.size * 0.6);
      ctx.quadraticCurveTo(-p.size * 0.8, -p.size * 0.3, 0, -p.size);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }
}
