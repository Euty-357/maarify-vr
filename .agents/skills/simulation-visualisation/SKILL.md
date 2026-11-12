---
name: simulation-visualisation
description: >
  Shared patterns for GPU particle fields, stakeholder cause-and-effect simulations,
  and simplified physics visualisation. Load when building simulation scenes.
---

# Simulation Visualisation Skill

## Labelling Rule (MANDATORY)
Every simulation in Maarify must display a visible label:
> "Simplified model — not engineering grade"

This label must appear in the UI while the simulation is active. Never imply a simulation is physically exact.

## GPU Particle Fields
Used for: Cosmos star fields, DNA molecule visualisation, fluid flow approximation.

```ts
// Pattern: shader-animated particles
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(N * 3);
// ... fill positions
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const material = new THREE.ShaderMaterial({
  vertexShader: `
    uniform float time;
    void main() {
      vec3 pos = position;
      // Apply time-based animation
      pos.y += sin(time + position.x) * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = 2.0;
    }
  `,
  fragmentShader: `void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); }`,
  uniforms: { time: { value: 0 } }
});
const points = new THREE.Points(geometry, material);
```

## Stakeholder Cause-and-Effect Simulation
Shared between Environment and Urban Development modules. Lives in `src/core/simulation/stakeholder-sim.ts`.

```ts
interface Stakeholder {
  id: string;
  name: string;
  wellbeing: number;      // 0–100
  dependsOn: string[];    // other stakeholder IDs or resource IDs
}
interface Resource {
  id: string;
  name: string;
  quantity: number;       // 0–100
}
interface SimAction {
  id: string;
  description: string;
  effects: Array<{ targetId: string; delta: number }>;
}
// User applies SimAction → effects propagate → UI shows before/after
```

## Fluid Flow Visualisation (Aerospace)
- Use GPU particle advection in a potential flow field (not Navier-Stokes — too expensive for real-time Quest 3).
- Potential flow: superposition of uniform flow + doublet = flow around a cylinder; transform to airfoil shape.
- Label: "Simplified potential flow model — not CFD. Real airflow is more complex."
- Expert tier may explain what a full CFD solver (Navier-Stokes) would add, without simulating it.
- Sources: https://www.grc.nasa.gov/WWW/K-12/airplane/bern.html

## Simplified Physics Visualisation
- Gravity wells: parametric mesh distortion (not GR geodesics — label as analogy).
- Atomic orbitals: probability cloud (points sampled from hydrogen wavefunctions — label as quantum mechanical probability density, not classical orbits).
- DNA helix: procedural spline geometry.
