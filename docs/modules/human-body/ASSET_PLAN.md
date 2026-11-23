# Human Body & Medicine — Asset Plan (WP7)

_Data and docs only — not wired into module scenes. Maps each existing anchor
and challenge to a GLB asset, part ids, interaction, tier, and narration key._

## Choreography Steps

| Step | Anchor / Challenge | Asset | Part ids | Interaction | Tier | Narration key | Success condition |
|------|-------------------|-------|----------|-------------|------|---------------|-------------------|
| 1 | human-body-anchor-heart-valve | heart_cutaway | valve-mitral, valve-aortic, valve-pulmonary, valve-tricuspid | scrub | Foundation | heart-valve-foundation | Learner scrubs ventricular pressure and observes valves sealing under systolic load. |
| 2 | human-body-challenge-pacemaker-timing | heart_cutaway | aorta, pulmonary-trunk, vena-cavae | flow | Advanced | heart-flow-advanced | Learner toggles the deoxygenated and oxygenated flow paths and identifies chambers. |
| 3 | human-body-challenge-art-blockade | hiv_integrase_insti | integrase-dimer, insti-drug, viral-dna-end, magnesium-ions | dock | Expert | hiv-inst-dock-expert | Learner docks INSTI drug into integrase catalytic triad with Mg2+ ions. |
| 4 | human-body-challenge-synaptic-vesicle | hiv_cd4_cell | cd4-receptors, ccr5-coreceptors, membrane-front | dock | Foundation | hiv-entry-foundation | Learner aligns CD4/CCR5 receptors to demonstrate viral entry co-receptor usage. |
| 5 | human-body-anchor-heart-valve | heart_cutaway | myocardium-front, myocardium-back, papillary-chordae | explode | Expert | heart-anatomy-expert | Learner explodes the heart into myocardium/valve/great-vessel layers and re-snaps. |

## Notes
- All steps are marked **unverified** pending claim-level sourcing in src/modules/human-body/SOURCES.md.
- Medical content: accurate, destigmatising, non-diagnostic, education-only disclaimer. U=U framing applied for HIV content.
- Asset part ids and triangle counts come from C:\MaarifyAssets\manifest.json (authored by the asset pipeline).