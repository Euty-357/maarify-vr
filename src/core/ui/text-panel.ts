import * as THREE from 'three';

/**
 * Diegetic text panel: a small world-space plane with a canvas texture.
 *
 * Text is never head-locked and never scrollable; it is engraved on the object it
 * belongs to. Canvas creation is guarded so unit tests can import scene modules in
 * the Node environment without a DOM.
 */

export interface TextPanelOptions {
  widthMeters?: number;
  heightMeters?: number;
  fontSizePx?: number;
  background?: string;
  color?: string;
  accent?: string;
  pixelWidth?: number;
  pixelHeight?: number;
  lines?: number;
  align?: 'left' | 'center';
}

export interface TextPanelUserData {
  canvas?: HTMLCanvasElement;
  texture?: THREE.CanvasTexture;
  options: Required<TextPanelOptions>;
  text: string;
}

const DEFAULTS: Required<TextPanelOptions> = {
  widthMeters: 0.9,
  heightMeters: 0.24,
  fontSizePx: 30,
  background: '#0b1728',
  color: '#e2e8f0',
  accent: '#38bdf8',
  pixelWidth: 768,
  pixelHeight: 192,
  lines: 2,
  align: 'left',
};

export function createTextPanel(text: string, options: TextPanelOptions = {}): THREE.Mesh {
  const resolved = { ...DEFAULTS, ...options };
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xffffff });
  const geometry = new THREE.PlaneGeometry(resolved.widthMeters, resolved.heightMeters);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `text-panel-${slug(text)}`;

  const userData: TextPanelUserData = { options: resolved, text };
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = resolved.pixelWidth;
    canvas.height = resolved.pixelHeight;
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    userData.canvas = canvas;
    userData.texture = texture;
    material.map = texture;
    material.transparent = false;
    mesh.userData.textPanel = userData;
    paintPanel(mesh, text);
  } else {
    material.color.set(resolved.background);
    mesh.userData.textPanel = userData;
  }
  return mesh;
}

export function setTextPanelText(mesh: THREE.Mesh, text: string): void {
  const userData = mesh.userData.textPanel as TextPanelUserData | undefined;
  if (!userData) return;
  userData.text = text;
  if (userData.canvas) paintPanel(mesh, text);
}

function paintPanel(mesh: THREE.Mesh, text: string): void {
  const userData = mesh.userData.textPanel as TextPanelUserData;
  const { canvas, texture, options } = userData;
  if (!canvas || !texture) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { pixelWidth: w, pixelHeight: h, background, color, accent, fontSizePx, align, lines } = options;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 10, h);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.strokeStyle = 'rgba(148,163,184,0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  ctx.fillStyle = color;
  ctx.font = `600 ${fontSizePx}px -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textBaseline = 'top';
  const wrapped = wrapText(text, Math.floor(w / (fontSizePx * 0.56)), lines);
  const lineHeight = fontSizePx * 1.25;
  const startY = (h - wrapped.length * lineHeight) / 2;
  wrapped.forEach((line, index) => {
    const x = align === 'center' ? w / 2 : 24;
    ctx.textAlign = align === 'center' ? 'center' : 'left';
    ctx.fillText(line, x, startY + index * lineHeight);
  });

  texture.needsUpdate = true;
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
}
