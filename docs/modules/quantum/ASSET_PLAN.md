# Quantum — Asset Plan (WP7)

_Data and docs only — not wired into module scenes. Maps each existing anchor
and challenge to a GLB asset, part ids, interaction, tier, and narration key._

## Choreography Steps

| Step | Anchor / Challenge | Asset | Part ids | Interaction | Tier | Narration key | Success condition |
|------|-------------------|-------|----------|-------------|------|---------------|-------------------|
| 1 | quantum-challenge-superposition-tuning | quantum-cryostat | 50k-stage, 4k-stage, 800mk-stage, 100mk-stage, 15mk-stage | tune | Foundation | q-cryostat-foundation | Learner rotates the cryostat stage dial to the labeled base temperature. |
| 2 | quantum-challenge-double-slit-observer | quantum-cryostat | dilution-plate, mixing-chamber | gaze-hold | Advanced | q-superposition-advanced | Learner holds gaze on a slit detector and observes wavefunction collapse. |
| 3 | quantum-challenge-bell-correlation | quantum-cryostat | still, cold-plate | dock | Expert | q-bell-expert | Learner rotates polarizers and verifies Bell inequality violation (S > 2). |
| 4 | quantum-challenge-circuit-assembly | quantum-circuit-kit | h-gate, cnot-gate, photon-source, detector | dock | Expert | q-circuit-expert | Learner slots H and CNOT tokens into circuit rails to evaluate the oracle. |
| 5 | quantum-challenge-superposition-tuning | quantum-circuit-kit | bloch-sphere, state-vector | scrub | Foundation | q-bloch-foundation | Learner rotates the Bloch state vector to the equator (equal superposition). |

## Notes
- All steps are marked **unverified** pending claim-level sourcing in src/modules/quantum/SOURCES.md.
- Quantum assets (cryostat, circuit kit) do not yet exist in C:\MaarifyAssets; they will be added by the asset pipeline.
- Asset part ids and triangle counts come from C:\MaarifyAssets\manifest.json (authored by the asset pipeline).