import * as THREE from 'three';
import { MODULE_FLAGS } from '../config/feature-flags.js';
import { PALETTE, standardMaterial } from '../core/design/tokens.js';
import { createCreditsPlaque } from '../core/brand/credits.js';
import { buildFloorInlay } from './floor-inlay.js';
import { buildPortalPreview } from './portal-previews.js';
import { createTextPanel, setTextPanelText } from '../core/ui/text-panel.js';

export interface HubPortal {
  id: string;
  title: string;
  angleRad: number;
  portalMesh: THREE.Group;
}

// Tutorial state machine
const enum TutorialState {
  Step1 = 0,
  Step2 = 1,
  Step3 = 2,
  Done = 3,
}

export class HubWorld extends THREE.Group {
  public portals: HubPortal[] = [];
  public selectedTier: 'foundation' | 'advanced' | 'expert' = 'foundation';
  public readonly exitLectern: THREE.Group;
  private creditsPlaque: THREE.Object3D;

  /** Per-frame update callbacks collected from portal preview animations. */
  private portalUpdates: ((dt: number) => void)[] = [];

  // Tutorial state
  private tutorialPanel: THREE.Mesh | null = null;
  private tutorialState: TutorialState = TutorialState.Done;
  private tutorialTimer = 0;

  constructor() {
    super();
    this.name = 'maarify-spatial-hub-world';

    this.add(this.createReadingRoomArchitecture());

    // 1. Central Spatial Hub Floor Ring
    const floorGeo = new THREE.CylinderGeometry(4.5, 4.8, 0.1, 48);
    const floorMat = standardMaterial('oak');
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.05;
    this.add(floor);

    // Floor crest inlay — Maarify medallion at world origin
    this.add(buildFloorInlay());

    // Brass floor accent ring
    const ringGeo = new THREE.RingGeometry(3.2, 3.25, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: PALETTE.brassBright,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    const floorRing = new THREE.Mesh(ringGeo, ringMat);
    floorRing.position.y = 0.005;
    this.add(floorRing);

    // Walkable boundary ring — soft blue glow at 4.0m radius showing teleport limit inside hub
    const boundaryGeo = new THREE.RingGeometry(3.95, 4.05, 64);
    boundaryGeo.rotateX(-Math.PI / 2);
    const boundaryMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
    });
    const boundaryRing = new THREE.Mesh(boundaryGeo, boundaryMat);
    boundaryRing.name = 'hub-walkable-boundary-ring';
    boundaryRing.position.y = 0.002;
    this.add(boundaryRing);


    // 2. 7 Physical Portals along circumferential ring (Radius = 3.5m)
    const moduleTitles = [
      { id: 'cosmos', title: '1. Cosmos' },
      { id: 'quantum', title: '2. Quantum' },
      { id: 'human-body', title: '3. Medicine' },
      { id: 'aerospace', title: '4. Aerospace' },
      { id: 'dna-genetics', title: '5. DNA / Genetics' },
      { id: 'environment', title: '6. Environment' },
      { id: 'urban-development', title: '7. Urban Development' },
    ];

    const angleStep = (Math.PI * 2) / moduleTitles.length;
    moduleTitles.forEach((mod, idx) => {
      const angle = idx * angleStep - Math.PI / 2; // Start from front
      const portal = this.createPhysicalPortal(mod.id, mod.title, angle);
      this.portals.push({ id: mod.id, title: mod.title, angleRad: angle, portalMesh: portal });
      this.add(portal);
    });

    // 4. Brand plaque removed — logo now lives on the floor inlay only.

    // 5. Credits plaque — mounted on library wall; opened via credits lectern
    this.creditsPlaque = createCreditsPlaque(1.15, 0.72);
    this.creditsPlaque.position.set(3.4, 1.6, 1.6);
    this.creditsPlaque.lookAt(0, 1.5, 0);
    this.creditsPlaque.visible = false;
    // Clicking the panel itself closes it
    this.creditsPlaque.userData['activate'] = () => {
      this.creditsPlaque.visible = false;
    };
    this.add(this.creditsPlaque);

    this.exitLectern = this.createExitLectern();
    this.add(this.exitLectern);

    // Credits lectern — a dedicated brass button lectern separated from the plaque
    const creditsLectern = this.createCreditsLectern();
    this.add(creditsLectern);
  }

  // ---------------------------------------------------------------------------
  // Public update — drives portal preview animations and the tutorial state machine
  // ---------------------------------------------------------------------------

  public update(dt: number): void {
    for (const fn of this.portalUpdates) fn(dt);
    this.updateTutorial(dt);
  }

  // ---------------------------------------------------------------------------
  // Hub orientation tutorial
  // ---------------------------------------------------------------------------

  public showOrientationTutorial(): void {
    // Idempotency / session-storage guard
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('maarify-hub-tutorial-dismissed')) {
      return;
    }

    this.tutorialState = TutorialState.Step1;
    this.tutorialTimer = 0;

    const panel = createTextPanel(
      'Welcome to Maarify\nLook around — seven portals surround you.',
      {
        widthMeters: 1.1,
        heightMeters: 0.26,
        fontSizePx: 28,
        align: 'center',
        lines: 2,
        pixelWidth: 896,
        pixelHeight: 208,
      },
    );
    panel.name = 'hub-orientation-tutorial-panel';
    panel.position.set(0, 1.6, -0.9);
    panel.lookAt(0, 1.6, 2);
    this.tutorialPanel = panel;
    this.add(panel);
  }

  private updateTutorial(dt: number): void {
    if (this.tutorialState === TutorialState.Done || !this.tutorialPanel) return;

    this.tutorialTimer += dt;

    if (this.tutorialState === TutorialState.Step1 && this.tutorialTimer >= 5) {
      this.tutorialState = TutorialState.Step2;
      this.tutorialTimer = 0;
      setTextPanelText(
        this.tutorialPanel,
        'Point at a portal arch to see its name. Step through to enter.',
      );
    } else if (this.tutorialState === TutorialState.Step2 && this.tutorialTimer >= 5) {
      this.tutorialState = TutorialState.Step3;
      this.tutorialTimer = 0;
      setTextPanelText(
        this.tutorialPanel,
        'Use the left thumbstick or aim and teleport to move.\nPress A/X to rewind displaced objects.',
      );

      // Attach a "GOT IT / SKIP" dismiss handler to the panel itself
      this.tutorialPanel.userData['activate'] = () => this.dismissTutorial();
    } else if (this.tutorialState === TutorialState.Step3 && this.tutorialTimer >= 5) {
      this.dismissTutorial();
    }
  }

  private dismissTutorial(): void {
    if (this.tutorialPanel) {
      this.tutorialPanel.visible = false;
    }
    this.tutorialState = TutorialState.Done;
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('maarify-hub-tutorial-dismissed', '1');
      }
    } catch {
      /* sessionStorage may be unavailable in some sandboxed contexts */
    }
  }

  // ---------------------------------------------------------------------------
  // Architecture helpers
  // ---------------------------------------------------------------------------

  private createReadingRoomArchitecture(): THREE.Group {
    const room = new THREE.Group();
    room.name = 'reading-room-architecture';

    const ceiling = new THREE.Mesh(
      new THREE.CylinderGeometry(4.75, 4.75, 0.12, 48),
      standardMaterial('walnut'),
    );
    ceiling.position.y = 3.9;
    room.add(ceiling);

    // Seven wall bays sit behind the seven portals, giving the room a real boundary
    // while leaving the doorway views clear from the central floor.
    for (let index = 0; index < 7; index += 1) {
      const angle = index * (Math.PI * 2 / 7) - Math.PI / 2;
      const bay = new THREE.Group();
      bay.position.set(Math.cos(angle) * 4.28, 1.85, Math.sin(angle) * 4.28);
      bay.lookAt(0, 1.85, 0);

      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(1.32, 3.7, 0.16),
        standardMaterial('walnut'),
      );
      bay.add(wall);
      const crown = new THREE.Mesh(
        new THREE.BoxGeometry(1.44, 0.12, 0.26),
        standardMaterial('brass'),
      );
      crown.position.y = 1.76;
      bay.add(crown);

      // Shelves at either side of each doorway bay add the enclosed library cue.
      for (const side of [-0.55, 0.55]) {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 2.15, 0.28),
          standardMaterial('walnut'),
        );
        shelf.position.set(side, -0.55, -0.14);
        bay.add(shelf);
        for (let row = 0; row < 5; row += 1) {
          const book = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.27, 0.09),
            new THREE.MeshStandardMaterial({
              color: [0x5a1f1f, 0x1e2e4b, 0x3a2416][(row + index) % 3],
              roughness: 0.68,
            }),
          );
          book.position.set(side, -1.26 + row * 0.42, -0.31);
          bay.add(book);
        }
      }
      room.add(bay);
    }

    return room;
  }

  private createCreditsLectern(): THREE.Group {
    const lectern = new THREE.Group();
    lectern.name = 'hub-credits-lectern';
    // Positioned cleanly on the right perimeter, separated from exit and wall plaque
    lectern.position.set(2.2, 0, 1.2);
    lectern.lookAt(0, 0.7, 0);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.25, 0.78, 16),
      standardMaterial('walnut'),
    );
    base.position.y = 0.39;
    lectern.add(base);

    const badge = this.createPortalTitleBadge('CREDITS', true);
    badge.name = 'hub-credits-lectern-badge';
    badge.position.set(0, 0.84, 0.03);
    lectern.add(badge);

    // The glowing button — activating this opens the credits panel
    const button = new THREE.Mesh(
      new THREE.CircleGeometry(0.09, 20),
      new THREE.MeshBasicMaterial({ color: PALETTE.brassBright, transparent: true, opacity: 0.82 }),
    );
    button.name = 'hub-credits-lectern-button';
    button.position.set(0, 0.72, 0.04);
    button.userData['activate'] = () => {
      this.creditsPlaque.visible = !this.creditsPlaque.visible;
    };
    lectern.add(button);

    return lectern;
  }

  private createExitLectern(): THREE.Group {
    const lectern = new THREE.Group();
    lectern.name = 'hub-exit-lectern';
    // Positioned cleanly on the left perimeter
    lectern.position.set(-2.2, 0, 1.2);
    lectern.lookAt(0, 0.7, 0);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.3, 0.88, 16),
      standardMaterial('walnut'),
    );
    base.position.y = 0.44;
    lectern.add(base);

    const plaque = this.createPortalTitleBadge('LEAVE MAARIFY', true);
    plaque.name = 'hub-exit-lectern-plaque';
    plaque.position.set(0, 0.92, 0.03);
    plaque.scale.set(1.18, 1.18, 1.18);
    lectern.add(plaque);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 20),
      new THREE.MeshBasicMaterial({ color: PALETTE.brassBright, transparent: true, opacity: 0.82 }),
    );
    glow.name = 'hub-exit-lectern-button';
    glow.position.set(0, 0.78, 0.04);
    glow.userData['activate'] = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('maarify:exit-xr'));
      }
    };
    lectern.add(glow);
    return lectern;
  }

  private createPhysicalPortal(id: string, title: string, angleRad: number): THREE.Group {
    const portal = new THREE.Group();
    portal.name = `hub-portal-${id}`;

    const r = 3.5;
    const x = Math.cos(angleRad) * r;
    const z = Math.sin(angleRad) * r;
    portal.position.set(x, 1.3, z);
    portal.lookAt(0, 1.3, 0); // Face inward to center plinth

    const flag = MODULE_FLAGS[id];
    const isReady = flag?.readiness === 'ready';

    // 1. Outer Portal Frame Arch (with emissive neon trim)
    const archGeo = new THREE.TorusGeometry(0.75, 0.045, 16, 32, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({
      color: isReady ? 0xb08d57 : 0x475569,
      emissive: isReady ? 0x6b4f2a : 0x1e293b,
      emissiveIntensity: isReady ? 0.6 : 0.2,
      metalness: 0.8,
      roughness: 0.2,
    });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.z = Math.PI;
    portal.add(arch);

    // 2. Inner threshold with depth portal effect
    const innerGeo = new THREE.CircleGeometry(0.70, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: isReady ? 0x5a1f1f : 0x241610,
      transparent: true,
      opacity: isReady ? 0.75 : 0.4,
      side: THREE.DoubleSide,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    portal.add(inner);

    // 3. Name Badge above the arch (CanvasTexture) — raised to y=1.0 to clear preview
    const badgeMesh = this.createPortalTitleBadge(title, isReady);
    badgeMesh.position.set(0, 1.0, 0);
    portal.add(badgeMesh);

    // 4. Portal preview from portal-previews.ts (replaces inline createDestinationPreview)
    const preview = buildPortalPreview(id);
    preview.mesh.position.set(0, 0, 0.05);
    portal.add(preview.mesh);
    if (preview.update) {
      this.portalUpdates.push(preview.update);
    }

    return portal;
  }

  private createPortalTitleBadge(title: string, isReady: boolean): THREE.Mesh {
    // Task 7.3: enlarged canvas (512×96) and larger font (28 px) for legibility at 3.5 m
    const width = 512;
    const height = 96;
    const isBrowser = typeof document !== 'undefined';

    // Determine second line: locked portals show "COMING SOON", not "IN DEVELOPMENT"
    const isLocked = !isReady;
    const secondLine = isReady ? 'READY • FULL SPEC' : 'COMING SOON';

    let mapTexture: THREE.Texture;
    if (isBrowser) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isReady ? '#1e293b' : '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Border
        ctx.strokeStyle = isReady ? '#d9b877' : '#64748b';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, width - 4, height - 4);

        // Status pill
        ctx.fillStyle = isReady ? '#b08d57' : '#64748b';
        ctx.fillRect(10, 10, 14, 14);

        // Title text — Task 7.3: bold 28px, y=36
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(title.slice(0, 28), 34, 36);

        // Readiness / status second line
        ctx.fillStyle = isReady ? '#34d399' : (isLocked ? '#94a3b8' : '#94a3b8');
        ctx.font = '16px sans-serif';
        ctx.fillText(secondLine, 34, 64);
      }
      mapTexture = new THREE.CanvasTexture(canvas);
      mapTexture.minFilter = THREE.LinearFilter;
    } else {
      mapTexture = new THREE.Texture();
    }

    // Slightly wider plane to match the larger canvas aspect ratio
    const geo = new THREE.PlaneGeometry(0.72, 0.135);
    const mat = new THREE.MeshBasicMaterial({
      map: mapTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }

  public setTier(tier: 'foundation' | 'advanced' | 'expert'): void {
    this.selectedTier = tier;
  }
}
