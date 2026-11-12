import * as THREE from 'three';
import { MODULE_FLAGS } from '../config/feature-flags.js';
import { PALETTE, standardMaterial } from '../core/design/tokens.js';
import { createBrandPlaque } from '../core/brand/brand.js';
import { createCreditsPlaque } from '../core/brand/credits.js';

export interface HubPortal {
  id: string;
  title: string;
  angleRad: number;
  portalMesh: THREE.Group;
}

export class HubWorld extends THREE.Group {
  public portals: HubPortal[] = [];
  public depthTierPlinth: THREE.Group;
  public selectedTier: 'foundation' | 'advanced' | 'expert' = 'foundation';

  constructor() {
    super();
    this.name = 'maarify-spatial-hub-world';

    // 1. Central Spatial Hub Floor Ring
    const floorGeo = new THREE.CylinderGeometry(4.5, 4.8, 0.1, 48);
    const floorMat = standardMaterial('oak');
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.05;
    this.add(floor);

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

    // 2. Depth Tier Plinth at center
    this.depthTierPlinth = this.createTierSelectorPlinth();
    this.add(this.depthTierPlinth);

    // 3. 7 Physical Portals along circumferential ring (Radius = 3.5m)
    const moduleTitles = [
      { id: 'cosmos', title: '1. Cosmos' },
      { id: 'quantum', title: '2. Quantum' },
      { id: 'human-body', title: '3. Human Body & Medicine' },
      { id: 'aerospace', title: '4. Aerospace & Propulsion' },
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

    // 4. Brand plaque above the Reading Room's main arch
    const brandPlaque = createBrandPlaque(1.6, 0.6);
    brandPlaque.position.set(0, 2.75, -3.4);
    brandPlaque.lookAt(0, 1.4, 0);
    this.add(brandPlaque);

    // 5. Credits plaque (generated from the module SOURCES tables)
    const creditsPlaque = createCreditsPlaque(1.15, 0.72);
    creditsPlaque.position.set(2.35, 1.5, -1.15);
    creditsPlaque.lookAt(0, 1.4, 0);
    this.add(creditsPlaque);
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

    // 3. Name Badge above the arch (CanvasTexture)
    const badgeMesh = this.createPortalTitleBadge(title, isReady);
    badgeMesh.position.set(0, 0.85, 0);
    portal.add(badgeMesh);

    // 4. Miniature 3D Destination Preview Mesh
    const previewMesh = this.createDestinationPreview(id);
    if (previewMesh) {
      previewMesh.position.set(0, 0, 0.05);
      portal.add(previewMesh);
    }

    return portal;
  }

  private createPortalTitleBadge(title: string, isReady: boolean): THREE.Mesh {
    const width = 256;
    const height = 64;
    const isBrowser = typeof document !== 'undefined';

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
        ctx.fillRect(8, 8, 12, 12);

        // Title text
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(title.slice(0, 20), 28, 22);

        // Readiness text
        ctx.fillStyle = isReady ? '#34d399' : '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText(isReady ? 'READY • FULL SPEC' : 'IN DEVELOPMENT', 28, 44);
      }
      mapTexture = new THREE.CanvasTexture(canvas);
      mapTexture.minFilter = THREE.LinearFilter;
    } else {
      mapTexture = new THREE.Texture();
    }

    const geo = new THREE.PlaneGeometry(0.55, 0.14);
    const mat = new THREE.MeshBasicMaterial({
      map: mapTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }

  private createDestinationPreview(id: string): THREE.Group {
    const preview = new THREE.Group();
    preview.name = `preview-${id}`;

    switch (id) {
      case 'cosmos': {
        // Saturn with tilted ring
        const planetGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const planetMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
        const planet = new THREE.Mesh(planetGeo, planetMat);

        const ringGeo = new THREE.RingGeometry(0.16, 0.24, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfcd34d,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 3;
        preview.add(planet);
        preview.add(ring);
        break;
      }
      case 'quantum': {
        // Bloch sphere / wireframe orbital
        const sphereGeo = new THREE.SphereGeometry(0.14, 8, 8);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0x818cf8, wireframe: true });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        const nucleus = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xec4899 })
        );
        preview.add(sphere);
        preview.add(nucleus);
        break;
      }
      case 'human-body': {
        // Stylized dual chamber heart
        const leftVent = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        leftVent.scale.set(1.0, 1.4, 0.9);
        preview.add(leftVent);
        break;
      }
      case 'aerospace': {
        // Rocket cone & cylinder
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.05, 0.22, 12),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
        );
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.05, 0.09, 12),
          new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        cone.position.y = 0.155;
        preview.add(body);
        preview.add(cone);
        break;
      }
      case 'dna-genetics': {
        // Double helix rung pair
        const rung = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.24, 8),
          new THREE.MeshStandardMaterial({ color: 0xb08d57 })
        );
        rung.rotation.z = Math.PI / 4;
        preview.add(rung);
        break;
      }
      case 'environment': {
        // Blue Earth globe with green continent patch
        const earth = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
        );
        preview.add(earth);
        break;
      }
      case 'urban-development': {
        // Skyscraper block cluster
        for (let i = 0; i < 3; i++) {
          const tower = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.12 + i * 0.06, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 })
          );
          tower.position.set((i - 1) * 0.07, (0.12 + i * 0.06) / 2 - 0.1, 0);
          preview.add(tower);
        }
        break;
      }
    }

    return preview;
  }

  private createTierSelectorPlinth(): THREE.Group {
    const plinthGroup = new THREE.Group();
    plinthGroup.name = 'hub-tier-selector-plinth';
    plinthGroup.position.set(0, 0, -0.6);

    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.7, 16);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x241610,
      metalness: 0.5,
      roughness: 0.4,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.35;
    plinthGroup.add(base);

    // Three physical selector buttons (Foundation, Advanced, Expert)
    const tiers: Array<'foundation' | 'advanced' | 'expert'> = ['foundation', 'advanced', 'expert'];
    tiers.forEach((tier, i) => {
      const btnGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
      const btnMat = new THREE.MeshStandardMaterial({
        color: tier === 'foundation' ? 0xb08d57 : 0x64748b,
      });
      const btn = new THREE.Mesh(btnGeo, btnMat);
      btn.position.set((i - 1) * 0.16, 0.72, 0);
      btn.name = `tier-btn-${tier}`;
      plinthGroup.add(btn);
    });

    return plinthGroup;
  }

  public setTier(tier: 'foundation' | 'advanced' | 'expert'): void {
    this.selectedTier = tier;
    const tiers: Array<'foundation' | 'advanced' | 'expert'> = ['foundation', 'advanced', 'expert'];
    tiers.forEach((t) => {
      const btn = this.depthTierPlinth.getObjectByName(`tier-btn-${t}`) as THREE.Mesh;
      if (btn) {
        (btn.material as THREE.MeshStandardMaterial).color.setHex(
          t === tier ? 0xb08d57 : 0x64748b
        );
      }
    });
  }
}
