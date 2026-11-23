import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..', '..');

describe('asset budget script', () => {
  const source = readFileSync(join(REPO_ROOT, 'scripts', 'check-asset-budgets.mjs'), 'utf8');

  it('counts draw calls from mesh primitives, not meshes x materials', () => {
    // The old estimate multiplied mesh count by material count, which
    // over-counted single-material meshes. The exact count is one draw call
    // per primitive.
    expect(source).toContain('countFromGltf');
    expect(source).toContain('primitiveCount');
    expect(source).not.toContain('estimatedDrawCalls');
    expect(source).not.toContain('countTrianglesFromGltf');
  });

  it('sums the per-scene budget across the assets one station holds', () => {
    expect(source).toContain('SCENE_ASSET_CAP');
    expect(source).toContain('Per-Scene Budget');
    expect(source).toContain('reduce((sum, a) => sum + a.drawCalls, 0)');
  });

  it('provides a merge helper without implementing the merge', () => {
    expect(source).toContain('findMergeCandidates');
    expect(source).toContain('merge NOT implemented');
  });

  it('fails above the hard ceilings and warns above the working target', () => {
    expect(source).toContain('maxTriangles: 250_000');
    expect(source).toContain('maxDrawCalls: 180');
    expect(source).toContain('workingTriangles: 150_000');
    expect(source).toContain('workingDrawCalls: 108');
    expect(source).toContain('stats.failed = true');
  });
});

describe('asset registry', () => {
  it('is generated with every synced asset', () => {
    const registry = readFileSync(
      join(REPO_ROOT, 'src', 'core', 'assets', 'registry.generated.ts'),
      'utf8',
    );
    const entries = (registry.match(/assetName: '/g) ?? []).length;
    expect(entries).toBeGreaterThan(0);
  });

  it('covers every asset in public/models', () => {
    const modelsDir = join(REPO_ROOT, 'public', 'models');
    const registry = readFileSync(
      join(REPO_ROOT, 'src', 'core', 'assets', 'registry.generated.ts'),
      'utf8',
    );

    let glbCount = 0;
    for (const module of readdirSync(modelsDir)) {
      const moduleDir = join(modelsDir, module);
      if (!statSync(moduleDir).isDirectory()) continue;
      for (const file of readdirSync(moduleDir)) {
        if (!file.endsWith('.glb')) continue;
        glbCount += 1;
        const assetName = file.replace('.glb', '');
        expect(registry).toContain(`assetName: '${assetName}'`);
      }
    }
    expect(glbCount).toBeGreaterThan(0);
  });
});