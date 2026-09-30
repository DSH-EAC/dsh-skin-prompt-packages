# Package Metadata Snapshots

These are package metadata snapshots, not plugin implementations.
JSON line endings are normalized to LF; the adapter hashes the snapshot bytes.

| Snapshot | Fact Source |
| --- | --- |
| `whale-manager.package.json` | `package/package.json` in npm `@smalltailqwq/dsh-client-ui-skin-deep-whale-manager@0.1.6` |
| `maid-atelier.package.json` | `package/package.json` in npm `@smalltailqwq/dsh-client-ui-skin-maid-atelier@0.1.7` |
| `orca-link.package.json` | `package/package.json` in npm `@smalltailqwq/dsh-client-ui-skin-orca-link@0.1.7` |
| `liang.package.json` | `kingOfSoySauce/dsh-liang-skin@976fcbf9b4a91b79f14b90c16cbe0d3f553c2bd3/package.json` |
| `deep-whale-day-night.package.json` | `GGBond2424648901/deep-whale-day-night-theme@3f6c4f14716d1e500f585be0c0d3c139c7a8a90b/package.json` |
| `endfield.package.json` | `ymh0000123/dsh-theme-endfield@a9f79fd197b7c2530a59ab0c4133169db5318784/package.json` |

The three npm tarballs were downloaded with `npm pack --ignore-scripts` on
2026-09-30. Their SHA-256 values in `adapter.config.json` were measured from
the original compressed bytes. Package names, versions, host entries and
official `dsh` projections were read from those tarballs. The downloaded
plugins were not executed. Tarballs are cached locally and not committed.

The source metadata's fixed Git commits identify design sources. npm does
not supply a matching `gitHead` here, so the adapter does not assert that
the published tarballs are identical to those commits.

License scope follows each upstream project. These metadata snapshots and
the adapter's MIT license do not grant rights to third-party artwork.

Liang v0.1.7 and Day/Night v0.1.12 also have GitHub Release assets. Their
SHA-256 values were obtained from GitHub's release asset API (asset IDs
523160379 and 520503316 respectively). Slow downloads prevented full local
byte verification in this run. Catalog records mark `publisher-digest`, do
not project the source snapshots as artifact package metadata, and do not
claim PackLock eligibility or runtime Evidence for these assets.
