# M6 DNA / Genetics — Build & Closeout Plan
_Status: AWAITING USER APPROVAL. No module code changed yet._
_Scope set by user 2026-11-10: complete M6 to full Ready, then stop. M7–M9 out of scope._
_Binding rules: [AGENTS.md](../AGENTS.md), [IMMERSION_CHARTER.md](IMMERSION_CHARTER.md), [MODULE_TEMPLATE.md](MODULE_TEMPLATE.md)._

## 1. Goal

Take the experimental M6 scaffold (170 lines, hidden, uncommitted) to a fully playable, sourced, emulator-verified module that satisfies all seven Ready criteria in [MODULE_TEMPLATE.md](MODULE_TEMPLATE.md), earns four reviewer sign-offs, and is committed and tagged `v0.6-dna-genetics`.

The blocker is not the tests — they pass. It is that three SPEC beats have no spatial implementation and four others are placeholders. This plan fixes both the content and the fact that **no module can currently be entered or navigated on the headset**, because M6's seated-completability gate depends on that working.

## 2. Definition of Done (all must be true)

- [ ] Seven beats playable in order; Immersion Map rows 1–5 all realised spatially.
- [ ] Five physical challenges, all seated-completable, awarding 1,025 XP total.
- [ ] Five diegetic anchors with three tiers each, sourced.
- [ ] `npm run verify` exit 0 (typecheck, lint, unit, 7 Playwright specs, Tier A budget, hygiene, report).
- [ ] Zero console errors in the M6 playthrough.
- [ ] Four sign-offs: immersion, science-medical, comfort-accessibility, performance (+ architect/QA per [DECISIONS.md](DECISIONS.md)).
- [ ] Claim-level sourcing in `SOURCES.md`, including a corrected Williams citation.
- [ ] Feature flag flipped to `ready` + `enabled`; hub portal lit.
- [ ] `STATE.md`, `TASKS.md`, `PROGRESS_LOG.md`, `DEVICE_TEST_BACKLOG.md` updated; tag pushed to `main` and `master`.
- [ ] Every hardware claim labelled **NOT verified on headset**.

## 3. Design per beat

Spatial layout: stations on a 1.5 m arc in front of spawn (angles −60° … +60°), cell behind at +2.2 m, badge/exit plinth behind at +2.6 m. All controls within 0.9 m of their station centre so a seated learner can reach without standing.

| Beat | Experience | Physical mechanic | Seated parity |
|---|---|---|---|
| 1 Cell entry | 2.6 m translucent cell with organelles and a 0.9 m nucleus; layered reveal into the nuclear interior (no camera motion) | Grab the membrane window and pull, or turn the 3-detent scale dial | Dial detents; upper-body lean |
| 2 Helix walk-through | 4.0 m tall, 0.55 m radius instanced double helix at (0, 2.2, −1.6); slow rotation for groove parallax | Walk/teleport around it; two-hand pull to unzip | Snap turn; unzip slider |
| 3 Base snapping | Template strand (T,G,C,A) + tray of four free nucleotides | Grab → release into socket; magnetic snap, wrong-pair spring-back + error haptic | Same, all within 0.6 m |
| 4 Replication + ribosome | Fork opens; polymerase travels adding rungs. Room-scale ribosome (1.05 m torus) with A/P/E sites | Two-hand unzip; plug three tRNA anticodons A→P→E; peptide chain grows | Slider + raycast-drag sockets |
| 5 CRISPR | DNA target with 5′-NGG PAM; Cas9 RNP with sgRNA loop | Rotate guide to match, push in to lock detent, then choose NHEJ vs HDR gate | Rotator detents |
| 6 Diversity & trait | Variation wall (shared-variation framing, sourced), genotype dial HbAA/HbAS/HbSS, red-cell morph, malaria context panel | Assemble 3-link causal chain; set genotype dial | Dial rotation; snap chain |
| 7 Reflection & exit | "Genomics Architect" badge plinth, Kenyan agri-biotech genome-selection vignette, exit portal | Complete all five challenges → badge unlocks with light column + chime; step into portal | Portal reachable seated; raycast activation |

**Content guardrails:** trait ≠ disease, no individual prediction, CRISPR is a non-clinical targeting model, every simulation labelled "simplified model — not engineering grade", no treatment instructions.

## 4. Work breakdown

### Phase B — Headset enablement (core, ~140 lines)
Without this, no reviewer can verify seated completability and the user's headset test fails at the hub.

| Item | File | Change |
|---|---|---|
| B1 Camera rig | [main.ts](../src/main.ts) | Add `cameraRig` group; camera centred in it; rig at desktop offset, reset to origin on `sessionstart`. Fixes XR spawn offset. |
| B2 Teleport | main.ts | Instantiate existing `SpatialTeleportPrimitive`; poll thumbstick, aim, commit; vignette flash. |
| B3 Snap turn | main.ts | Instantiate existing `SpatialSnapTurnPrimitive`; right-stick X with cooldown. |
| B4 Portal entry | main.ts | Controller raycast against `hub-portal-*`; trigger activates nearest portal. Thin visible ray line. |
| B5 Haptics | main.ts | Capture `XRInputSource` on controller `connected`; pass into `tryGrab`/`release` and haptic calls. |
| B6 Return to hub | main.ts | Handle `maarify:return-to-hub`: unload module, restore hub + smoke zone. |
| B7 Module tick | [types.ts](../src/core/types.ts), [index.ts](../src/modules/dna-genetics/index.ts), main.ts | Add optional `update(dt)` to `ModuleDefinition`; call it each frame. M6 animations currently never run. |

_Acceptance:_ teleport/snap-turn/portal entry/haptics verified in Playwright/emulator; existing 6 specs still green; budget unchanged. **NOT verified on headset.**

### Phase C — Beat 1 + Beat 2 (~200 lines)
- New `genetics.ts` starts here with pure data/functions (no THREE import).
- Cell group: membrane (double-sided transparent), 5 organelles, nucleus, nuclear pore ring, membrane window handle.
- Layered dive state machine: `exterior → membrane → nucleus → chromatin`; each stage fades a layer and expands the next; 1.4 s eased transition; vignette pulse; haptic detent per stage.
- Helix rebuild at 4 m with instancing (2 × 60 beads + 30 rungs), slow rotation, two grab handles, unzip distance tracking.
- _Acceptance:_ dive stages reachable and reversible; unzip reaches 100 %; triangles < 30 k.

### Phase D — Beat 3 + Beat 4 (~230 lines)
- New `src/core/input/primitives/slot.ts`: generic grab-and-slot primitive (snap radius, accept predicate, onAccept/onReject, springs back on reject). Used by Beat 3 and Beat 6 — satisfies the repetition rule.
- Base tray with correct/incorrect complement logic in `genetics.ts` (`isComplement`).
- Ribosome enlarged to 1.05 m; mRNA with a real 3-codon sequence; three tRNAs keyed to codons; A/P/E sockets; peptide beads appended per successful translocation.
- _Acceptance:_ wrong base rejected with error haptic and no XP; four correct bases complete challenge 1; unzip completes challenge 2; three codons complete challenge 3.

### Phase E — Beat 5 + Beat 6 (~220 lines)
- CRISPR target duplex, PAM marker, sgRNA loop, alignment tolerance ±8°, push-to-lock detent, NHEJ/HDR gates with two outcome states.
- Variation wall with five region clusters; genotype dial; red-cell morph (biconcave ↔ crescent); malaria context panel; three-link causal chain using `slot.ts`.
- `genetics.ts` additions: `GENOTYPES`, `traitFraming()`, `codonTable`, `translate()`, `gcFraction()`.
- _Acceptance:_ lock only fires when aligned; HDR gate shows corrected model sequence; chain assembly completes challenge 5; all copy reviewed against sources.

### Phase F — Beat 7 + gamification (~160 lines)
- New `src/gamification/badge-plinth.ts`: stone plinth, engraved canvas badge, unlock column + chime, exit portal ring; emits `maarify:return-to-hub`.
- Agri-biotech vignette: crop model + selection dial showing drought-tolerance selection across generations (sourced, simplified).
- Badge unlocks only when 5/5 challenges complete.
- _Acceptance:_ badge state visible in `__MAARIFY_CHALLENGES__`; portal returns to hub; XP total 1,025.

### Phase G — Tests, sources, docs (~120 lines)
- Unit: `genetics` (pairing, complement, transcription, translation, genotype/trait framing, GC fraction), `slot` primitive, badge unlock logic; update module contract test to 5 anchors / 5 challenges / 1,025 XP.
- E2E: assert dive stages, base rejection path, four challenge completions, CRISPR lock, chain assembly, badge, exit portal, 5 anchors; capture 2 poses; record worst-case budget state.
- `SOURCES.md`: add H3Africa / African Genome Variation Project for diversity; KALRO/ILRI for agri-biotech; reconcile Williams 2005 (curriculum cites *Nature* 437:1092; file cites PLoS Med PMID 15916466) — science reviewer decides which supports the sentence.
- Docs: STATE/TASKS/PROGRESS_LOG/DEVICE_TEST_BACKLOG (DT-009 for M6 beats), clear stale P0-10/P3-12 checkboxes.

### Phase H — Gate, review, commit (~verify runs)
1. `npm run typecheck` and targeted `playwright test tests/e2e/m6-dna-genetics.spec.ts`.
2. Full `npm run verify`; fix until exit 0; first run also validates Phase B against the other six specs.
3. Four reviewer passes against the packed evidence (screenshots, budget, sources).
4. Flip `MODULE_FLAGS['dna-genetics']` to `ready`/`true`; confirm hub portal lit.
5. `git status` inspection, commit `feat(dna-genetics): complete M6 …`, tag `v0.6-dna-genetics`, push `main:main main:master`.

## 5. Credit-efficient execution

The expensive part is not writing code, it is repeated Playwright/verify loops. Rules for this build:

1. **Two full `npm run verify` runs maximum** (after Phase B, after Phase F). Everything else uses `tsc --noEmit` plus the single M6 spec.
2. Read each file once; no re-reads except after edits.
3. Batch independent edits in one call.
4. No subagent fan-out for a single module — it costs more than it saves.
5. Checkpoint after Phase B and Phase E with a short status line.

**MUST / SHOULD split** so credit exhaustion still leaves a shippable module:
- **MUST:** B1–B6, Beats 1/6/7 at full fidelity, tests, flag, docs, commit+tag. This is what clears the immersion blocker.
- **SHOULD:** full ribosome complexity, NHEJ/HDR dual outcomes, agri-biotech vignette, slot extraction.
If credits get tight after Phase E, I stop, report, and we ship the MUST set.

## 6. Estimate

| Phase | Agent time | Risk |
|---|---|---|
| B headset enablement | 45–60 min | Medium — XR rig change touches every spec |
| C beats 1–2 | 60 min | Low |
| D beats 3–4 | 60–75 min | Medium — slot primitive + ribosome state machine |
| E beats 5–6 | 75 min | Medium — sourcing decisions |
| F beat 7 | 40 min | Low |
| G tests/sources/docs | 50 min | Low |
| H verify + review + tag | 60 min | Medium — flake risk |

Total ≈ **6–7 hours of agent work**, likely **600 k–1.2 M tokens**. At DeepSeek-flash-class pricing (~$0.28/M in, $0.42/M out) 5 CNY ≈ $0.69 should cover M6 with room for two verify loops, **but not M7/M8**. Estimate, not a guarantee; I will report burn after Phase B.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Camera-rig change breaks existing e2e spawn poses | Keep `__MAARIFY_SET_CAMERA__` semantics; run full verify immediately after Phase B |
| Playwright flake (known orphaned-worker issue) | One worker already configured; kill stale `test-server` before the final run |
| Sourcing gap blocks Beat 6 copy | Draft copy only after sources are added; science reviewer signs the exact sentences |
| Review-bar inconsistency (M5 Beat 7 only narrated) | Badge/exit kit lives in `src/gamification/`, reusable to backfill M2–M5 in M9; logged as debt, not silently accepted |
| Credit exhaustion | MUST/SHOULD split above; checkpoint reports |
| XR-only bugs invisible to emulator | Documented as DT-009, labelled NOT verified on headset |

## 8. Out of scope (explicitly)

- M7 Environment, M8 Urban Development, M9 integration.
- Dynamic quality controller, KTX2 pipeline, passthrough MR, locomotion comfort tuning beyond defaults.
- Backfilling challenge/XP wiring and Beat 7 into M2–M5 (logged as M9 debt).
- Photoreal assets — M6 stays primitive-based.

## 9. Approval

Approve as written, or change: beat count (4→5 challenges), anchor count (4→5), XP total (875→1,025), and whether Phase B (headset enablement) is included. Phase B is recommended; without it the headset test cannot reach a module and no seated-completability sign-off is honest.
