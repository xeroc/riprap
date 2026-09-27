---
status: accepted
---

# 0006 — Every account carries 64 bytes of trailing `padding`

Decided 2026-09-27. EVENT-MUTUAL §4/§6 amendment (account layouts); no instruction, gate, or math changes.

## Why

The trigger was the devnet incident the same day: the deployed `Mutual` predated the SAS fields (`juror_credential`/`juror_schema`, ADR-0004), so the current SDK's fixed-size decoder — correctly — refused the 330-byte account and the pool page rendered its error state while the RPC round-trip was fine. Live Anchor accounts cannot grow fields: a layout change strands every existing account at its old size, and the only recovery is a fresh PDA generation (new seed, re-init, re-point every consumer).

Both programs are localnet/devnet-only today, but the pilot deploys to mainnet before the pool necessarily reaches its final shape. Post-mainnet, "add one field" must not mean "migrate every Member".

## Decision

- `Pool`, `Depositor`, `Mutual`, `Member`, `Claim` each end with `padding: [u8; 64]` — reserved zero bytes, exactly two pubkeys' worth, **always the last field** (the accord dependency's `AccordState`/`Dispute`/`Subaccord` already follow this convention; this matches house style).
- The field is dead weight: no instruction reads or writes it. `InitSpace` and the `*_SPACE` consts pick it up automatically; init pays the rent.
- Future growth consumes the tail: a new field is inserted before `padding`, `padding` shrinks by its size, total account size is unchanged — accounts already on chain decode without realloc or migration (zeroed padding reads as zero defaults).

## Consequences

- Rent-exemption grows by the 64-byte increment per account (well under 0.001 SOL each; the Member fleet is the multiplier, not the Mutual).
- Trailing placement keeps every memcmp offset stable: the cranker's server-side `CLAIM_MUTUAL_OFFSET`/`CLAIM_STATUS_OFFSET` filters and the fetch-test byte-exact assertions survived this change untouched.
- The generated Codama clients are strict fixed-size decoders — they reject both too-short (stale) and too-long accounts, so any future layout change that forgets to shrink `padding` symmetrically fails loudly in the SDK tests, not silently in production.
- Padding does NOT make an upgrade free: the program still must be rebuilt/redeployed, and instructions still validate discriminators. It removes only the account-size migration, which was the unfixable part.
