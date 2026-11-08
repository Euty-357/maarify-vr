---
name: test-and-report
description: >
  Test pyramid, WebXR emulator usage, Playwright autopilot playthroughs,
  report format, and npm run verify pipeline.
  Load when writing tests, running tests, or generating reports.
---

# Test and Report Skill

## Test Pyramid
1. **Unit tests (Vitest):** Pure logic — gamification, store, challenge scoring, info-card state machine, travel-time calculations.
2. **Integration tests (Vitest + JSDOM / IWER):** XR session lifecycle, input routing, locomotion state.
3. **E2E / autopilot tests (Playwright + IWER):** Full module playthroughs in headless browser with emulated Quest 2.

## npm run verify Pipeline
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src tests --ext .ts",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:budget": "node scripts/check-budgets.mjs",
    "verify": "npm run typecheck && npm run lint && npm run test:unit && npm run test:e2e && npm run test:budget && node scripts/generate-report.mjs"
  }
}
```

## Playwright Autopilot Test (per module)
Scripted playthrough that:
1. Loads the module in flat mode (no headset required).
2. Taps every interactive object → verifies LEVEL_1 card opens.
3. Taps again → verifies LEVEL_2 card opens with correct tier content.
4. Taps again → verifies card closes.
5. Completes every challenge programmatically (simulates user actions).
6. Verifies XP was awarded.
7. Checks elapsed "simulated time" totals 10–20 minutes (beat timeline coverage).
8. Checks browser console for errors (zero tolerance).
9. Screenshots each major beat.

## Report Format
```
reports/latest.md         — human-readable summary
reports/history/<ts>.json — machine-readable full results
```
Report must include:
- Date/time
- Commit hash
- Per-test pass/fail
- Budget numbers (triangles, draw calls)
- Console errors (list all)
- Screenshots (paths)
- Verification labels for each result
- Links to relevant DEVICE_TEST_BACKLOG.md items

## Console Error Check
```ts
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});
// After test: assert errors.length === 0
```
