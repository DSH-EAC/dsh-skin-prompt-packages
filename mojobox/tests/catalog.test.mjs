import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { buildCatalog, createValidators, digest, root } from '../scripts/build-catalog.mjs';

test('all five sources are preserved without a fictitious Beauty plugin', async () => {
  const sourceBytes = await readFile(resolve(root, '../skin-prompts/community-metadata.json'));
  const { files, report } = await buildCatalog();
  assert.equal(report.records.length, 6);
  assert.equal(report.sourceOnly.length, 1);
  assert.equal(report.sourceOnly[0].skinId, 'beauty-skins');
  assert.equal(report.sourceMetadata.digest, digest(sourceBytes));
  assert.deepEqual(await readFile(resolve(root, '../skin-prompts/community-metadata.json')), sourceBytes);
  const beauty = JSON.parse(files.get('source-only/beauty-skins.json'));
  assert.equal(beauty.mojobox.status, 'source-only');
  assert.equal(beauty.facets, undefined);
  assert.equal(beauty.version, undefined);
});

test('measured artifacts have package projections; only exact npm sources are lock eligible', async () => {
  const { files, report } = await buildCatalog();
  for (const record of report.records) {
    const bytes = files.get(record.path);
    const manifest = JSON.parse(bytes);
    assert.equal(digest(bytes), record.manifestDigest);
    assert.equal(manifest['x-mojobox-maintenance'].source, 'registry-maintained');
    assert.equal(manifest['x-mojobox-source-metadata'].loaderIntegration, 'not-verified');
    if (record.packLockEligible) {
      assert.ok(manifest.artifact);
      assert.ok(manifest['x-mojobox-package'].dsh);
      assert.equal(record.source, `npm:${manifest.name}@${manifest.version}`);
      assert.equal(record.artifactDigest, manifest.artifact.digest);
    } else if (record.publication === 'unpublished') {
      assert.equal(manifest.artifact, undefined);
      assert.equal(manifest['x-mojobox-package'], undefined);
      assert.equal(manifest['x-mojobox-publication'].status, 'unpublished');
    } else {
      assert.ok(manifest.artifact);
      assert.ok(manifest['x-mojobox-package'].dsh);
      assert.equal(record.source, undefined);
      assert.equal(record.artifactVerification, 'local-sha256');
    }
  }
  assert.equal(report.records.filter((item) => item.packLockEligible).length, 3);
  assert.equal(report.records.filter((item) => item.publication === 'published').length, 5);
  assert.equal(report.pack.status, 'blocked');
  assert.equal(report.validation.productionEvidence, 'not-issued');
  assert.ok(report.pack.blockers.some((item) => item.code === 'source-overlay-not-plugin'));
});

test('generation is deterministic and committed output matches source inputs', async () => {
  const first = await buildCatalog();
  const second = await buildCatalog();
  assert.deepEqual(first, second);
  for (const [path, bytes] of first.files) assert.deepEqual(await readFile(resolve(root, path)), bytes, path);
});

test('unknown sources and duplicate catalog identities are rejected', async () => {
  const config = JSON.parse(await readFile(resolve(root, 'adapter.config.json'), 'utf8'));
  const unknown = structuredClone(config);
  unknown.records[0].skinId = 'missing-source';
  await assert.rejects(buildCatalog({ configuration: unknown }), /Unknown source skin/);
  const duplicate = structuredClone(config);
  duplicate.records.push(duplicate.records[0]);
  await assert.rejects(buildCatalog({ configuration: duplicate }), /Duplicate catalog id/);
});

test('pinned Mojobox schemas reject invented catalog fields and floating lock sources', async () => {
  const validators = await createValidators();
  const { files, report } = await buildCatalog();
  const manifest = JSON.parse(files.get(report.records[0].path));
  assert.equal(validators.plugin({ ...manifest, installer: 'custom.js' }), false);
  const component = report.records[0];
  const lock = {
    $schema: 'https://mojobox.dev/schemas/pack-lock-v1alpha1.json',
    apiVersion: 'packs.mojobox.dev/v1alpha1', kind: 'PackLock', pack: 'dev.example.skins@1.0.0',
    components: [{ id: component.id, version: component.version, source: component.source, manifest: component.path, manifestDigest: component.manifestDigest, artifactDigest: component.artifactDigest }],
  };
  assert.equal(validators.lock(lock), true, JSON.stringify(validators.lock.errors));
  lock.components[0].source = 'github:Small-tailqwq/dsh-deep-whale';
  assert.equal(validators.lock(lock), false);
});
