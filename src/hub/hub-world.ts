import * as THREE from 'three';

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
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.05;
    this.add(floor);

    // 2. Depth Tier Plinth at center
    this.depthTierPlinth = this.createTierSelectorPlinth();
    this.add(this.depthTierPlinth);

    // 3. 7 Physical Portals along circumferential ring (Radius = 3.8m)
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
  }

  private createPhysicalPortal(id: string, _title: string, angleRad: number): THREE.Group {
    const portal = new THREE.Group();
    portal.name = `hub-portal-${id}`;

    const r = 3.5;
    const x = Math.cos(angleRad) * r;
    const z = Math.sin(angleRad) * r;
    portal.position.set(x, 1.3, z);
    portal.lookAt(0, 1.3, 0); // Face inward to center plinth

    // Outer Portal Frame Arch
    const archGeo = new THREE.TorusGeometry(0.7, 0.05, 16, 32, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.7,
      roughness: 0.3,
    });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.z = Math.PI;
    portal.add(arch);

    // Inner glowing threshold
    const innerGeo = new THREE.CircleGeometry(0.65, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a8a,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    portal.add(inner);

    return portal;
  }

  private createTierSelectorPlinth(): THREE.Group {
    const plinthGroup = new THREE.Group();
    plinthGroup.name = 'hub-tier-selector-plinth';
    plinthGroup.position.set(0, 0, -0.6);

    const baseGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.7, 16);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
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
        color: tier === 'foundation' ? 0x10b981 : 0x64748b,
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
          t === tier ? 0x10b981 : 0x64748b
        );
      }
    });
  }
}
