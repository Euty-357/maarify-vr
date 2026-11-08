---
name: science-content-review
description: >
  Accuracy checks, source logging, misconception lists, reading-level checks,
  and medical sensitivity guidelines. Load when reviewing or writing learner-facing content.
---

# Science Content Review Skill

## Principles
- Accuracy over spectacle.
- Every factual claim has a source in `SOURCES.md`.
- Known misconceptions are explicitly listed and countered (never silently taught).
- Analogies must state where they break down.
- Unverified numbers must be flagged "unverified."

## Misconception Lists (key examples per module)

### Cosmos
- ❌ "Space begins where the atmosphere ends" — the Karman line (~100 km) is a **convention**, not a physical boundary. IAF definition; some argue for lower altitudes.
- ❌ "FTL travel is possible (like in sci-fi)" — faster-than-light travel is not known to be physically possible. Cinematic warp is fiction; label it explicitly.
- ❌ "The Sun is on fire" — the Sun fuses hydrogen via nuclear fusion, not combustion.
- ❌ "Black holes suck things in" — black holes have the same gravitational pull as a star of the same mass; objects must pass inside the photon sphere to be unable to escape.

### Aerospace
- ❌ Equal transit time (Bernoulli lift) — the idea that air molecules split at the leading edge must meet at the trailing edge simultaneously is false. Actual lift comes from net downward deflection of air (Newton's 3rd law) and pressure differential from airfoil shape + angle of attack.
- Source: https://www.grc.nasa.gov/WWW/K-12/airplane/wrong1.html (NASA Glenn Research)

### Quantum
- ❌ "Quantum computers are always faster" — quantum advantage is problem-specific. Current NISQ devices have high error rates. Honestly represent limitations.
- ❌ "Superposition means the qubit is 0 AND 1" — it is a probabilistic amplitude; explain the measurement collapse honestly.

### Human Body / Medical
- ❌ Stigmatising HIV framing — HIV is a manageable condition with ART. Avoid language that implies moral judgement.
- ❌ "Cancer is always fatal" — many cancers are treatable or curable; use current survival statistics with sources.
- Education-only disclaimer: "This content is educational. Consult a qualified health professional for medical advice."

## Reading-Level Check
- Foundation tier: Flesch-Kincaid Grade ≤ 10 (target: 8–10).
- Advanced tier: Grade ≤ 14.
- Expert tier: no limit, but prefer clarity over jargon.
- Level 1 cards: Grade ≤ 8.

## Source Requirements
- Each module's `SOURCES.md` must list: author/org, title, URL, date accessed, what claim it supports.
- Prefer: NASA, ESA, WHO, CDC, peer-reviewed journals, national science bodies.
- Do not cite Wikipedia as a primary source (may cite as a starting point, then verify at primary source).
