# @riprap/pool

## 0.3.0

### Minor Changes

- Add a trailing `padding: [u8; 64]` upgrade-headroom field to every account (`Pool`, `Depositor` here; `Mutual`/`Member`/`Claim` in `@riprap/hanse`). Always the last field, zero bytes, never read or written — future fields consume it so live accounts never need size migration (ADR-0006). Account layouts grow by 64 bytes; memcmp offsets are unchanged. Existing accounts on any cluster decode only against the new layout — devnet/localnet deployments must re-init under a fresh seed.

## 0.2.0

### Minor Changes

- initial changeset release
