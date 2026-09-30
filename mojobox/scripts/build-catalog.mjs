import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const digest = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
export const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

export async function createValidators() {
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  const paths = {
    plugin: 'vendor/dsh-std/dsh-plugin-0.15.schema.json',
    packageMetadata: 'vendor/schemas/official-package-metadata.schema.json',
    pack: 'vendor/schemas/pack.schema.json',
    lock: 'vendor/schemas/pack-lock.schema.json',
  };
  return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([name, path]) => [name, ajv.compile(await readJson(path))])));
}

export async function buildCatalog({ write = false, configuration } = {}) {
  const config = configuration ?? await readJson('adapter.config.json');
  const sourceBytes = await readFile(resolve(root, config.sourceMetadata));
  const source = JSON.parse(sourceBytes);
  const sourceDigest = digest(sourceBytes);
  const sources = new Map(source.skins.map((skin) => [skin.id, skin]));
  if (sources.size !== source.skins.length) throw new Error('Duplicate source skin id');
  const validators = await createValidators();
  const files = new Map();
  const records = [];
  const recordIds = new Set();

  for (const specification of config.records) {
    const skin = sources.get(specification.skinId);
    if (!skin) throw new Error(`Unknown source skin: ${specification.skinId}`);
    if (recordIds.has(specification.id)) throw new Error(`Duplicate catalog id: ${specification.id}`);
    recordIds.add(specification.id);
    const packageBytes = await readFile(resolve(root, specification.packageSnapshot));
    const pkg = JSON.parse(packageBytes);
    const reference = skin.installation.pluginRefs.find((entry) => entry.ref === pkg.name)
      ?? (skin.installation.type === 'github' ? skin.installation.pluginRefs[0] : undefined);
    if (!reference || (reference.version && reference.version !== pkg.version)) throw new Error(`Source/package version mismatch: ${specification.id}`);
    if (!pkg.main || !pkg.dsh?.bundle) throw new Error(`Missing upstream plugin entry or bundle: ${specification.id}`);
    const published = Boolean(specification.artifact);
    const locallyVerified = published && specification.artifactVerification !== 'publisher-digest';
    const npmPublished = published && specification.artifact.path.startsWith('https://registry.npmjs.org/');
    const packLockEligible = locallyVerified && npmPublished;
    const manifest = {
      $schema: `https://raw.githubusercontent.com/Yan-Zero/dsh-std/${config.mojobox.pluginSchemaRevision}/packages/manifest/schema/dsh-plugin-0.15.schema.json`,
      manifestVersion: '0.15',
      id: specification.id,
      name: pkg.name,
      version: pkg.version,
      facets: { host: { entry: pkg.main.replace(/^\.\//, ''), apiVersion: 'v1alpha1' } },
      license: specification.license,
      source: { repository: skin.sources[0].repositoryUrl, revision: skin.sources[0].revision },
      ...(published ? { artifact: specification.artifact } : {}),
      'x-mojobox-maintenance': {
        source: 'registry-maintained',
        reason: 'Catalog projection maintained by DSH-EAC from upstream package metadata. Host entry is the Cordis package entry; v1alpha1 follows the Mojobox catalog convention and does not assert dsh-std negotiation. Fixed Git sources and published npm bytes are independently recorded; their equivalence is not asserted.',
      },
      'x-mojobox-publication': {
        status: published ? 'published' : 'unpublished',
        reason: !published ? 'Fixed GitHub package source is available; no verified artifact for this exact package/version was found.' : locallyVerified ? `Exact ${npmPublished ? 'npm' : 'GitHub Release'} tarball downloaded without executing plugins or lifecycle scripts; SHA-256 measured from its bytes.` : 'GitHub Release asset and SHA-256 confirmed by the GitHub API. Full local download verification is pending; source package metadata is not projected as artifact metadata.',
        artifactVerification: !published ? 'not-available' : locallyVerified ? 'local-sha256' : 'publisher-digest',
        npmPublished,
      },
      'x-mojobox-source-metadata': {
        skinId: skin.id,
        displayName: specification.displayName,
        author: skin.author,
        description: skin.description,
        tags: skin.tags,
        references: skin.references,
        installation: skin.installation,
        sourceMetadataDigest: sourceDigest,
        packageSnapshotDigest: digest(packageBytes),
        loaderIntegration: 'not-verified',
        runtimeVerification: 'not-tested',
      },
    };
    // Official package fields are projected only from a verified published artifact.
    if (locallyVerified) {
      manifest['x-mojobox-package'] = Object.fromEntries(['dependencies', 'peerDependencies', 'engines', 'dsh'].filter((key) => key in pkg).map((key) => [key, pkg[key]]));
    }
    if (!validators.plugin(manifest)) throw new Error(`${manifest.id}: ${JSON.stringify(validators.plugin.errors)}`);
    if (locallyVerified && !validators.packageMetadata(manifest['x-mojobox-package'])) throw new Error(`${manifest.id}: ${JSON.stringify(validators.packageMetadata.errors)}`);
    const path = `catalog/plugins/${manifest.id}.json`;
    const bytes = jsonBytes(manifest);
    files.set(path, bytes);
    records.push({ skinId: skin.id, id: manifest.id, version: manifest.version, path, manifestDigest: digest(bytes), publication: published ? 'published' : 'unpublished', packLockEligible, ...(packLockEligible ? { source: `npm:${pkg.name}@${pkg.version}` } : {}), ...(published ? { artifactDigest: manifest.artifact.digest, artifactVerification: locallyVerified ? 'local-sha256' : 'publisher-digest' } : {}) });
  }

  const sourceOnly = config.sourceOnly.map((item) => {
    const skin = sources.get(item.skinId);
    if (!skin || skin.installation.type !== 'source-overlay') throw new Error(`Invalid source-only mapping: ${item.skinId}`);
    const path = `source-only/${item.skinId}.json`;
    files.set(path, jsonBytes({ ...skin, sourceMetadataDigest: sourceDigest, mojobox: { status: 'source-only', reason: item.reason } }));
    return { skinId: skin.id, path, reason: item.reason };
  });
  const covered = new Set([...records, ...sourceOnly].map((item) => item.skinId));
  if (covered.size !== sources.size || [...sources.keys()].some((id) => !covered.has(id))) throw new Error('The adapter must retain every requested source');
  const report = {
    contract: 'Mojobox Catalog / dsh-std 0.15',
    mojobox: config.mojobox,
    sourceMetadata: { path: 'skin-prompts/community-metadata.json', digest: sourceDigest, preserved: true },
    records,
    sourceOnly,
    sharedCatalogReferences: [{ id: config.loaderCatalogId, repository: source.skinLoader.repositoryUrl, integrationStatus: 'not-verified', npmPublication: 'not-available-at-check' }],
    pack: {
      status: 'blocked',
      reason: 'The complete five-project loader pack requires published exact npm sources, verified artifact bytes and loader registration. GitHub refs and source-overlay projects cannot be locked as npm sources under the pinned Mojobox contract.',
      blockers: [...records.filter((item) => !item.packLockEligible).map((item) => ({ skinId: item.skinId, id: item.id, code: item.publication === 'published' ? 'exact-npm-source-not-published' : 'missing-published-artifact' })), ...sourceOnly.map((item) => ({ skinId: item.skinId, code: 'source-overlay-not-plugin' })), { id: config.loaderCatalogId, code: 'loader-npm-version-not-published' }, { code: 'upstream-loader-integration-not-verified' }],
    },
    validation: { catalogSchema: 'passed', officialPackageProjection: 'passed', productionEvidence: 'not-issued', mojoboxCatalogSubmission: 'not-submitted' },
  };
  files.set('import-report.json', jsonBytes(report));
  if (write) {
    for (const [path, bytes] of files) {
      const target = resolve(root, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
    }
  }
  return { files, report };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { report } = await buildCatalog({ write: true });
  console.log(`Generated ${report.records.length} Mojobox plugin records and ${report.sourceOnly.length} source-only record. All five sources preserved; complete Pack/Lock status: ${report.pack.status}.`);
}
