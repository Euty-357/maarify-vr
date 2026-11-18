/**
 * Black hole gravitational lensing shader for Maarify Cosmos module.
 *
 * Approach: a large screen-facing quad with a custom ShaderMaterial that:
 *   1. Distorts background UV sampling using the Schwarzschild lensing formula
 *      (simplified to |alpha| = 2*rs/b for small deflections near photon sphere)
 *   2. Renders an accretion disc with Doppler beaming (blueshift on approach side,
 *      redshift on recession side) and thermal gradient (white → orange → dark red)
 *   3. Draws a bright photon ring at the shadow boundary
 *   4. Paints the event horizon pure black
 *
 * Honest comparison with EHT M87* image:
 *   - Shadow shape: circular symmetric → matches M87* broadly (M87* shadow ellipticity
 *     is < 10%, within our symmetric approximation).
 *   - Photon ring: present and bright → correct qualitatively.
 *   - Doppler beaming: brighter arc on one side → matches M87* (south bright arc).
 *   - Gravitational lensing of background: halo warp visible → qualitatively correct;
 *     true ray-traced lensing (Kerr metric) is NOT reproduced — this is a 2-D screen
 *     deflection approximation.
 *   - Disc warp / upper/lower image: NOT reproduced (requires ray tracing).
 *   - Verdict: significantly more realistic than three flat plain-colour rings.
 *     NOT physically exact. NOT verified on headset. Labelled "Simplified model" in scene.
 *
 * Quest 3 budget impact:
 *   - 1 draw call, 2 triangles, 1 ShaderMaterial (no textures needed — starfield is
 *     procedurally approximated in the fragment shader using a cheap hash function).
 *   - Shader complexity: ~80 fragment instructions. Acceptable on Quest 3 GPU.
 *   - Labelled: NOT measured on device.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// GLSL vertex shader — standard pass-through, outputs world-space direction
// ---------------------------------------------------------------------------
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// GLSL fragment shader
// ---------------------------------------------------------------------------
const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;        // seconds since start (for disc rotation animation)
  uniform float uRS;          // Schwarzschild radius in scene metres (visual)
  uniform vec3  uCamPos;      // camera world position (for Doppler beaming direction)
  uniform vec3  uBHWorldPos;  // black hole world position

  varying vec2 vUv;
  varying vec3 vWorldPos;

  // ---- Cheap procedural starfield (avoids texture dependency) ----------------
  float hash(vec2 p) {
    p = fract(p * vec2(234.37, 435.71));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  vec3 starfield(vec2 uv) {
    vec2 g = floor(uv * 180.0);
    float h = hash(g);
    float brightness = step(0.985, h); // ~1.5% of cells have a star
    // Spectral tint
    vec3 col = mix(vec3(1.0, 0.7, 0.4), vec3(0.6, 0.8, 1.0), hash(g + 0.5));
    return col * brightness * 1.8;
  }

  // ---- Gravitational lensing deflection (Schwarzschild approx) ---------------
  // For a ray passing at impact parameter b from the black hole:
  //   angular deflection alpha ≈ 2*rs/b  (weak field)
  // We work in 2-D on the quad UV plane, treating the BH centre as origin.
  vec2 lensedUV(vec2 offset, float rs) {
    float b = length(offset);
    if (b < 0.001) return vec2(0.5); // inside shadow — handled separately
    float alpha = 2.0 * rs / b;
    alpha = min(alpha, 0.6); // clamp to prevent UV blow-up far from BH
    // Deflect the sampling direction toward the BH
    vec2 dir = -normalize(offset);
    return (offset + dir * alpha * b) + vec2(0.5);
  }

  // ---- Accretion disc SDF (torus cross-section in 2-D) -----------------------
  // Returns [0,1] disc brightness, clamped. angle = azimuthal angle in disc plane.
  float discBrightness(vec2 offset, float rInner, float rOuter, out float angle) {
    float r = length(offset);
    angle = atan(offset.y, offset.x); // azimuth −PI..+PI
    if (r < rInner || r > rOuter) return 0.0;
    float t = (r - rInner) / (rOuter - rInner); // 0=inner hot, 1=outer cool
    // Gaussian falloff peaking at inner edge
    return exp(-t * 2.5) * smoothstep(0.0, 0.05, t + 0.001);
  }

  // ---- Doppler beaming factor -------------------------------------------------
  // Disc rotates counter-clockwise (prograde). Approach side (left in EHT view)
  // is blue-shifted and amplified; recession side is dimmer and red-shifted.
  // We approximate: beta (v/c) ~ 0.3 near ISCO; beaming exponent p=3.
  float dopplerFactor(float angle, float animTime) {
    // Disc rotation: add time-based rotation offset
    float phi = angle + animTime * 0.4;
    // Approach side is at phi ~ -PI/2 (bottom of disc faces camera default)
    // Simple cos approximation: factor = 1 + beta*cos(phi)
    float beta = 0.30;
    float f = 1.0 + beta * cos(phi);
    return pow(clamp(f, 0.1, 2.5), 3.0); // intensity ~ f^(3+alpha_spec), use 3
  }

  // ---- Thermal disc colour (temperature gradient) ----------------------------
  vec3 discColor(float t, float dopplerF) {
    // t=0 inner (white/blue-white hot), t=1 outer (dark red/maroon)
    vec3 innerCol = vec3(1.0, 0.95, 0.85);   // near-white thermal
    vec3 midCol   = vec3(1.0, 0.45, 0.10);   // orange
    vec3 outerCol = vec3(0.45, 0.05, 0.02);  // dark maroon
    vec3 baseCol = t < 0.5
      ? mix(innerCol, midCol, t * 2.0)
      : mix(midCol, outerCol, (t - 0.5) * 2.0);
    // Doppler beaming: blueshift on approach (cool base → whiter), redshift on recession
    float blueness = clamp((dopplerF - 1.0) * 0.6, 0.0, 1.0);
    float redness  = clamp((1.0 - dopplerF) * 0.5, 0.0, 1.0);
    baseCol = mix(baseCol, vec3(0.75, 0.90, 1.00), blueness);
    baseCol = mix(baseCol, vec3(0.50, 0.03, 0.03), redness);
    return baseCol * dopplerF;
  }

  // ===========================================================================
  void main() {
    // UV offset from BH centre on this quad [-0.5, 0.5]
    vec2 offset = vUv - 0.5;

    float rs      = uRS;          // Schwarzschild radius (visual), e.g. 0.35
    float rPhoton = rs * 1.5;     // photon sphere radius
    float rShadow = rPhoton * 1.08; // apparent shadow slightly larger than photon sphere
    float rDiscIn = rPhoton * 1.25; // ISCO inner edge of accretion disc
    float rDiscOut= rs * 4.0;     // outer edge of disc

    float dist = length(offset);

    // 1. Event horizon — pure black
    if (dist < rShadow) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // 2. Photon ring — bright thin annulus just outside the shadow
    float photonWidth = rShadow * 0.08;
    float photonMask = smoothstep(rShadow, rShadow + photonWidth * 0.3, dist)
                     * (1.0 - smoothstep(rShadow + photonWidth, rShadow + photonWidth * 1.6, dist));
    vec3 photonCol = vec3(1.0, 0.92, 0.70) * 2.5 * photonMask;

    // 3. Lensed starfield background
    vec2 lUV = lensedUV(offset, rs);
    // Tile the starfield UV for variety
    vec3 bgCol = starfield(lUV * 3.5) + starfield(lUV * 7.0 + 0.3) * 0.5;

    // 4. Accretion disc (oriented horizontally — disc plane = XZ in local space)
    // We project the 2-D quad position to treat Y-component as "disc thickness" falloff
    // and XZ as the disc plane. On the flat quad we approximate: horizontal = disc plane.
    float angle;
    float discB = discBrightness(offset, rDiscIn, rDiscOut, angle);
    float discThicknessFalloff = 1.0; // flat quad always faces camera; disc is naturally flat
    float dopplerF = dopplerFactor(angle, uTime);
    float tDisc = (length(offset) - rDiscIn) / max(rDiscOut - rDiscIn, 0.001);
    vec3 dCol = discColor(clamp(tDisc, 0.0, 1.0), dopplerF);
    vec3 discContrib = dCol * discB * discThicknessFalloff;

    // 5. Compose: background + disc + photon ring; no disc inside shadow
    vec3 final = bgCol + discContrib + photonCol;

    // Transparency: disc pixels are fully opaque, background pixels partially transparent
    // so the WebGL scene starfield behind also contributes (additive blending)
    float alpha = max(discB * 0.95, photonMask * 0.9);
    alpha = max(alpha, 0.0);

    gl_FragColor = vec4(final, alpha);
  }
`;

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------
export interface BlackHoleShaderOptions {
  /** Visual Schwarzschild radius in scene metres. Default 0.35. */
  rs?: number;
}

/**
 * Build the black hole rendering group.
 *
 * Returns:
 *   - `group`: THREE.Group (add to scene)
 *   - `update(dt)`: call every frame with delta seconds to animate the disc
 *
 * The group contains:
 *   1. `lens-quad`: a large billboard quad with the lensing ShaderMaterial
 *   2. `event-horizon-sphere`: a solid black sphere clipping the quad centre
 *   3. `plasma-jet-north` / `plasma-jet-south`: relativistic jet cones
 *   4. `bh-point-light`: accent PointLight
 */
export function buildBlackHoleShader(
  options: BlackHoleShaderOptions = {}
): { group: THREE.Group; update: (dt: number) => void } {
  const rs = options.rs ?? 0.35;

  const group = new THREE.Group();
  group.name = 'bh-shader-group';

  // ---- Uniforms ----
  const uniforms: Record<string, THREE.IUniform> = {
    uTime:      { value: 0.0 },
    uRS:        { value: rs },
    uCamPos:    { value: new THREE.Vector3() },
    uBHWorldPos:{ value: new THREE.Vector3() },
  };

  // ---- Lens quad (large plane, always facing camera via billboarding) --------
  // Size: rDiscOut * 2 + margin = rs*4*2 + 0.4 = ~3.2m at rs=0.35
  const quadSize = rs * 10.0;
  const lensGeo = new THREE.PlaneGeometry(quadSize, quadSize, 1, 1);
  const lensMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const lensQuad = new THREE.Mesh(lensGeo, lensMat);
  lensQuad.name = 'lens-quad';
  lensQuad.userData.billboard = true;  // main.ts traverse will lookAt camera
  group.add(lensQuad);

  // ---- Solid black sphere — event horizon (always occludes behind the quad) --
  const horizonSphere = new THREE.Mesh(
    new THREE.SphereGeometry(rs * 1.08, 32, 32),  // rShadow radius
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  horizonSphere.name = 'event-horizon-sphere';
  horizonSphere.renderOrder = 1;  // render after lens quad
  group.add(horizonSphere);

  // ---- Relativistic plasma jets (3C 273 / M87-style bipolar) -----------------
  const northJetMat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const southJetMat = new THREE.MeshBasicMaterial({
    color: 0x1e3a8a,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const jetGeo = new THREE.ConeGeometry(rs * 0.4, rs * 5.5, 16, 1, true);
  const northJet = new THREE.Mesh(jetGeo, northJetMat);
  northJet.name = 'plasma-jet-north';
  northJet.position.y = rs * 2.8;
  const southJet = new THREE.Mesh(jetGeo, southJetMat);
  southJet.name = 'plasma-jet-south';
  southJet.position.y = -rs * 2.8;
  southJet.rotation.x = Math.PI;
  group.add(northJet);
  group.add(southJet);

  // ---- Accent point light ----------------------------------------------------
  const bhLight = new THREE.PointLight(0x60a5fa, 1.4, rs * 14);
  bhLight.name = 'bh-point-light';
  group.add(bhLight);

  // ---- Simplified model label (browser only) ---------------------------------
  if (typeof document !== 'undefined') {
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512; labelCanvas.height = 80;
    const ctx = labelCanvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, 512, 80);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '17px sans-serif';
    ctx.fillText('Sagittarius A* — simplified gravitational lensing model', 12, 28);
    ctx.fillText('2D screen-space approximation; true ray-traced Kerr metric not reproduced', 12, 54);
    ctx.fillText('Shader vs EHT M87*: shadow shape ✓, photon ring ✓, Doppler ✓, disc warp ✗', 12, 72);
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.32),
      new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, side: THREE.FrontSide })
    );
    labelPlane.name = 'bh-label';
    labelPlane.position.set(0, rs * 5.5 + 0.3, 0);
    group.add(labelPlane);
  }

  // ---- Update function -------------------------------------------------------
  let elapsed = 0;
  function update(dt: number): void {
    elapsed += dt;
    uniforms['uTime'].value = elapsed;
    // Jets pulse
    const jScale = 1 + Math.sin(elapsed * 2.8) * 0.12;
    northJet.scale.set(jScale, 1, jScale);
    southJet.scale.set(jScale, 1, jScale);
  }

  return { group, update };
}
