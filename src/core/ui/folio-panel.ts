import * as THREE from 'three';
import type { AnchorContent, ContentBlock, TierId } from '../content/schema.js';
import { standardMaterial, PALETTE } from '../design/tokens.js';
import { SpatialGrabPrimitive } from '../input/primitives/grab.js';
import { createTextPanel, setTextPanelText } from './text-panel.js';
import {
  createFolioState,
  currentPage,
  nextPage,
  pageCountFor,
  prevPage,
  setTier,
  toggleCollapsed,
  type FolioState,
} from './folio-state.js';

const TIER_LABELS: Record<TierId, string> = {
  foundation: 'FOUNDATION',
  advanced: 'ADVANCED',
  expert: 'EXPERT',
};

/**
 * Panels v2 folio: a parchment board beside the anchor, not head-locked.
 * Brass tier tabs switch tier while keeping the page for each tier, arrows page the
 * body, and the header collapses the panel. The board is grabbable and turns gently
 * toward the viewer when it is not held.
 */
export class FolioPanel extends THREE.Group {
  public state: FolioState = createFolioState();
  public content: AnchorContent | null = null;
  public grab: SpatialGrabPrimitive;

  private bodyCanvas: HTMLCanvasElement | null = null;
  private bodyTexture: THREE.CanvasTexture | null = null;
  private bodyMesh: THREE.Mesh;
  private header: THREE.Mesh;
  private tabs: THREE.Mesh[] = [];
  private arrows: THREE.Mesh[] = [];
  private footer: THREE.Mesh | null = null;

  constructor() {
    super();
    this.name = 'folio-panel';
    this.visible = false;

    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), standardMaterial('parchment'));
    board.name = 'folio-board';
    this.add(board);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.84, 0.02), standardMaterial('brass'));
    frame.position.z = -0.012;
    frame.name = 'folio-frame';
    this.add(frame);
    this.header = createTextPanel('ANCHOR', {
      widthMeters: 0.8,
      heightMeters: 0.07,
      fontSizePx: 30,
      align: 'center',
      background: '#241610',
      color: '#e8dcc0',
      accent: '#b08d57',
      pixelWidth: 768,
      pixelHeight: 72,
      lines: 1,
    });
    this.header.position.set(0, 0.33, 0.01);
    this.header.name = 'folio-header';
    this.header.userData.activate = () => this.toggleCollapse();
    this.add(this.header);

    const tabNames: TierId[] = ['foundation', 'advanced', 'expert'];
    tabNames.forEach((tier, index) => {
      const tab = createTextPanel(TIER_LABELS[tier], {
        widthMeters: 0.24,
        heightMeters: 0.05,
        fontSizePx: 20,
        align: 'center',
        background: '#3a2416',
        color: '#e8dcc0',
        accent: '#b08d57',
        pixelWidth: 320,
        pixelHeight: 56,
        lines: 1,
      });
      tab.position.set(-0.27 + index * 0.27, 0.255, 0.012);
      tab.name = `folio-tab-${tier}`;
      tab.userData.activate = () => this.switchTier(tier);
      this.tabs.push(tab);
      this.add(tab);
    });

    if (typeof document !== 'undefined') {
      this.bodyCanvas = document.createElement('canvas');
      this.bodyCanvas.width = 1024;
      this.bodyCanvas.height = 640;
      this.bodyTexture = new THREE.CanvasTexture(this.bodyCanvas);
      this.bodyTexture.colorSpace = THREE.SRGBColorSpace;
      this.bodyTexture.minFilter = THREE.LinearMipmapLinearFilter;
      this.bodyTexture.magFilter = THREE.LinearFilter;
      this.bodyTexture.generateMipmaps = true;
      this.bodyTexture.anisotropy = 4;
      this.bodyMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.84, 0.525),
        new THREE.MeshBasicMaterial({ map: this.bodyTexture, toneMapped: false })
      );
    } else {
      this.bodyMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.84, 0.525),
        new THREE.MeshBasicMaterial({ color: PALETTE.parchment })
      );
    }
    this.bodyMesh.position.set(0, -0.04, 0.01);
    this.bodyMesh.name = 'folio-body';
    this.add(this.bodyMesh);

    const left = this.makeArrow('‹');
    left.name = 'folio-prev';
    left.position.set(-0.4, -0.335, 0.012);
    left.userData.activate = () => this.goPrev();
    const right = this.makeArrow('›');
    right.name = 'folio-next';
    right.position.set(0.4, -0.335, 0.012);
    right.userData.activate = () => this.goNext();
    this.arrows.push(left, right);
    this.add(left, right);

    this.footer = createTextPanel('', {
      widthMeters: 0.4,
      heightMeters: 0.035,
      fontSizePx: 18,
      align: 'center',
      background: '#e8dcc0',
      color: '#241610',
      accent: '#b08d57',
      pixelWidth: 512,
      pixelHeight: 40,
      lines: 1,
    });
    this.footer.position.set(0, -0.335, 0.012);
    this.footer.name = 'folio-footer';
    this.add(this.footer);

    this.grab = new SpatialGrabPrimitive(this, { constrainY: false });
    this.makeOverlay();
  }

  /** UI overlay: never let world geometry or leader lines draw over the folio. */
  private makeOverlay(): void {
    for (const child of this.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const material = child.material as THREE.Material | THREE.Material[];
      const materials = Array.isArray(material) ? material : [material];
      for (const entry of materials) {
        entry.transparent = true;
        entry.depthTest = false;
        entry.depthWrite = false;
      }
      const isBack = child === this.bodyMesh || child.name === 'folio-board' || child.name === 'folio-frame';
      child.renderOrder = isBack ? 996 : 998;
    }
  }

  private makeArrow(label: string): THREE.Mesh {
    return createTextPanel(label, {
      widthMeters: 0.07,
      heightMeters: 0.06,
      fontSizePx: 40,
      align: 'center',
      background: '#3a2416',
      color: '#e8dcc0',
      accent: '#b08d57',
      pixelWidth: 96,
      pixelHeight: 96,
      lines: 1,
    });
  }

  public setContent(content: AnchorContent): void {
    this.content = content;
    this.state = createFolioState();
    this.visible = true;
    this.paint();
  }

  public switchTier(tier: TierId): void {
    if (!this.content) return;
    this.state = setTier(this.state, tier);
    this.paint();
  }

  public goNext(): void {
    if (!this.content) return;
    this.state = nextPage(this.state, this.content);
    this.paint();
  }

  public goPrev(): void {
    if (!this.content) return;
    this.state = prevPage(this.state, this.content);
    this.paint();
  }

  public toggleCollapse(): void {
    this.state = toggleCollapsed(this.state);
    this.paint();
  }

  /** Gently yaw toward the viewer; skipped while grabbed. */
  public update(cameraPosition: THREE.Vector3): void {
    if (!this.visible || !this.content || this.grab.isGrabbed) return;
    const dx = cameraPosition.x - this.position.x;
    const dz = cameraPosition.z - this.position.z;
    const targetYaw = Math.atan2(dx, dz);
    let delta = targetYaw - this.rotation.y;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this.rotation.y += delta * 0.08;
  }

  private activeTierTab(): void {
    this.tabs.forEach((tab, index) => {
      const tier = (['foundation', 'advanced', 'expert'] as TierId[])[index];
      tab.position.z = tier === this.state.tier ? 0.016 : 0.012;
    });
  }

  private paint(): void {
    const content = this.content;
    if (!content) return;
    const collapsed = this.state.collapsed;
    this.bodyMesh.visible = !collapsed;
    this.tabs.forEach((tab) => { tab.visible = !collapsed; });
    this.arrows.forEach((arrow) => { arrow.visible = !collapsed; });
    if (this.footer) this.footer.visible = !collapsed;

    setTextPanelText(this.header, `${collapsed ? '▸' : '▾'}  ${content.label}`);

    const page = currentPage(this.state, content);
    const total = pageCountFor(content, this.state.tier);
    if (this.footer) {
      setTextPanelText(
        this.footer,
        `${this.state.tier.toUpperCase()}  ·  ${Math.min(this.state.pages[this.state.tier] + 1, total)}/${total}`
      );
    }
    this.activeTierTab();
    this.paintBody(page?.blocks ?? [], total);
  }

  private paintBody(blocks: ContentBlock[], totalPages: number): void {
    const canvas = this.bodyCanvas;
    const texture = this.bodyTexture;
    if (!canvas || !texture) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = '#e8dcc0';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = '#b08d57';
    context.lineWidth = 6;
    context.strokeRect(3, 3, width - 6, height - 6);

    let y = 58;
    const x = 46;
    const maxWidth = width - 92;
    context.textBaseline = 'top';
    context.fillStyle = '#1a1410';

    for (const block of blocks) {
      if (y > height - 120) break;
      const lines = this.renderBlock(context, block, x, y, maxWidth);
      y += lines;
    }

    context.fillStyle = '#6b4f2a';
    context.font = '22px Georgia, serif';
    context.fillText(`Page ${Math.min(this.state.pages[this.state.tier] + 1, totalPages)} of ${totalPages}`, x, height - 52);

    texture.needsUpdate = true;
  }

  private renderBlock(
    context: CanvasRenderingContext2D,
    block: ContentBlock,
    x: number,
    y: number,
    maxWidth: number
  ): number {
    const lineHeight = 40;
    const wrap = (text: string, font: string): string[] => {
      context.font = font;
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let line = '';
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    const draw = (text: string, font: string, color: string, prefix = '') => {
      context.fillStyle = color;
      for (const line of wrap(prefix + text, font)) {
        context.font = font;
        context.fillText(line, x, y);
        y += lineHeight;
      }
    };

    switch (block.type) {
      case 'paragraph':
        draw(block.text, '34px Georgia, serif', '#1a1410');
        break;
      case 'keyFacts':
        for (const fact of block.facts) draw(fact, '33px Georgia, serif', '#1a1410', '• ');
        break;
      case 'table':
        draw(block.headers.join('  |  '), 'bold 28px Georgia, serif', '#3a2416');
        for (const row of block.rows) draw(row.join('  |  '), '28px Georgia, serif', '#3a2416');
        break;
      case 'equation':
        draw(block.latex, 'italic 36px Georgia, serif', '#5a1f1f');
        draw(block.explanation, '31px Georgia, serif', '#241610');
        break;
      case 'workedExample':
        draw('Worked example — ' + block.context, 'bold 26px Georgia, serif', '#3a2416');
        block.steps.forEach((step, index) => draw(step, '26px Georgia, serif', '#241610', `${index + 1}. `));
        draw('Answer: ' + block.answer, 'italic 26px Georgia, serif', '#5a1f1f');
        break;
      case 'practitionerNote':
        draw(`${block.framework}: ${block.note}`, 'italic 26px Georgia, serif', '#1f3b2c');
        break;
      case 'sources':
        draw('Sources: ' + block.refs.join(', '), '22px Georgia, serif', '#6b4f2a');
        break;
      case 'diagram3d':
        draw(`3D inset — ${block.caption}`, 'italic 26px Georgia, serif', '#1f3b2c');
        break;
      default:
        break;
    }

    return 10;
  }
}
