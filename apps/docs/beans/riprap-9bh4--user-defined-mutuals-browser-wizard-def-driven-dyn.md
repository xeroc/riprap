---
# riprap-9bh4
title: 'User-defined mutuals: browser wizard + def-driven dynamic mutuals'
status: todo
type: milestone
priority: high
created_at: 2026-10-15T07:59:12Z
updated_at: 2026-10-15T07:59:12Z
---

Anyone authors and deploys a mutual from the browser; no app code per mutual.
One artifact (`riprap-def/v1`) carries the machine block and the human terms,
is hashed whole into `policy_hash`, anchored on-chain by the existing
initialize_mutual -> domain_ref binding, and served content-addressed from
the evidence daemon's domain CAS. Every surface - directory listing, pool
page, hero, claim wizard, juror session - derives from that one doc. The
static per-pool registries (data.ts listings, page components, flow packs,
policy packs) remain for first-party pools only.

Decision record (grill, 2026-10-15):

- D1 Artifact: single markdown file - YAML frontmatter (machine block) + the
  11-§ terms body; `policy_hash = sha256(whole file)`; published via the
  hash-gated CAS PUT at the derived domain_ref. Policy change => new mutual
  (existing binding, untouched).
- D2 Machine block (lean): `schema, kind, slug, name,
  period{start,end,claims_close,venue?}, tiers[{name,fee,cap}],
  proof[{slot,kind:file|url,label?,verify?}],
  marketing?{headline,blurb,odds[],share,event?,smallestPayout?}, language?`.
  Everything else: body prose (parsed by fixed § headers), kind-level copy
  templates, or wizard-time instruction args rendered once into §7 prose.
- D3 Scaffolding: claim step-1 self-screen and juror step-2 criteria become
  kind-templated generic questions + the raw terms; `same_person` /
  `evidence_use` are kind defaults. Slot lists single-source from `proof`.
- D4 Discovery: scan -> unknown pubkey -> `seed`+`policyHash` off the Mutual
  account -> derived domain_ref -> CAS GET -> valid def => listed in a
  community band below the founder directory; invalid/missing => dropped.
  First-party pools keep hand-written heroes and rank.
- D5 Hero: one GenericPoolHero rendered from `marketing` (template defaults
  when absent) on the shared PoolPageShell; registry falls back pubkey ->
  generic page. First-party pages untouched.
- D6 Ops: retire the pilot pass gate in claim_payout (ADR-0005's documented
  path; program + reconciler + ADR + spec wording move together) - all five
  cranks permissionless, riprap's cranker covers every mutual. Evidence
  operator: riprap daemon default, advanced override. No protocol fee (pool
  rates stay 0/1/0).
- D7 Deploy: browser end-to-end - wizard builds initialize_mutual via
  @riprap/hanse (wallet signs, pays rent), then CAS-PUTs the doc, then
  verifies. CLI stays as the operator alternative.
- D8 Voice: templates carry the deadpan register; no review, no lint, no
  community marker. `kind` (mutual|bounty) is a copy-selector enum only -
  nothing mechanical differs between the kinds.

Epics: def-format (artifact schema/renderer/validation), pilot-gate
retirement (ADR-0005 path), def-resolution (CAS listings, generic surfaces,
pack builders, de-blading; blocked by def-format), wizard-ui (#/create;
blocked by all three). Ship gate: wizard-ui does not ship before the
pilot-gate epic - a self-serve mutual whose payouts jam without the creator
running a cranker is not self-serve.

Non-goals: migrating first-party pools off hand-written heroes/pages; a
protocol fee; any review/approval gate on user defs; changing the on-chain
tier model; editable defs (immutable by construction - new policy, new
mutual).

## HANDOFF

### 1. Happy Path

1. Operator opens `#/create`, authors the def (name, kind, peril, tiers,
   period, proof slots, optional marketing), sets advanced init params
   (§12 preset pre-filled, evidence_operator = riprap daemon default).
2. Wizard renders the deterministic `riprap-def/v1` doc, displays
   `policy_hash` + derived `domain_ref`, picks a random u64 seed.
3. Wallet signs `initialize_mutual` (one tx: mutual + pool CPI + SAS +
   subaccord CPI + fee float); creator pays rent + fees.
4. Wizard PUTs the exact doc bytes to `{evidence daemon}/domains/{ref}`
   (hash-gated proof mode), then GETs them back to verify.
5. The store scan finds the new Mutual, reads seed+policyHash, derives the
   ref, fetches the def, validates it, and lists the pool in the community
   band. Generic page/hero render; claim wizard and juror session run off
   def-built packs. Cranker settles payouts permissionlessly.

### 2. Data Contract

- Def frontmatter (exact fields): `schema:"riprap-def/v1"`, `kind:
  "mutual"|"bounty"`, `slug`, `name`, `period:{start,end,claims_close,venue?}`,
  `tiers:[{name,fee,cap}]` (1-3), `proof:[{slot,kind:"file"|"url",label?,
  verify?}]`, `marketing?:{headline?,blurb?,odds?[],share?,event?,
  smallestPayout?}`, `language?` (default "en").
- Hash: `policy_hash = sha256(utf8(whole file))`; CAS ref =
  `domainRefHex(seed, policy_hash)` (apps/landing/src/pool/domainRef.ts,
  byte-mirror of initialize_mutual.rs subaccord_domain_ref).
- Modules touched: `apps/landing/src/mutuals/def/` (new: schema, canonical
  renderer, §-section parser, validators), `mutuals/store.ts`,
  `mutuals/registry.ts`, `mutuals/pages/GenericPoolPage|Hero` (new),
  `app/file-claim/{manifest,documents}.ts`, `adjudicate/{package,DocumentsStep,
  AdjudicatePage}.ts`, pack builders (new), `#/create` page (new);
  `programs/hanse/src/instructions/claim_payout.rs`,
  `apps/cranker/src/{reconciler.ts,reconciler.test.ts}`, ADR-0005,
  `meta/specs/EVENT-MUTUAL.md` §7/§12.
- Pack surfaces: existing `ClaimFlow` (app/file-claim/flow.ts) and
  `AdjudicationPolicy` (adjudicate/policy.ts) interfaces, built from the def
  - interfaces unchanged, registries gain a def-driven path.

### 3. Edge Cases & Constraints

- Defs are immutable: any edit changes policy_hash => different domain_ref
  => the old mutual never sees the new doc. Never re-PUT different bytes at
  a live ref (daemon 409s; that 409 is correct).
- Zero-numbers law holds in UI packs (ClaimFlow/AdjudicationPolicy carry no
  numerals - chain reads); doc bytes MAY carry numbers (prices, fees,
  windows) - they are terms, not UI.
- Unknown on-chain mutuals with missing/invalid defs are DROPPED, never
  rendered with fallback content. 404 from CAS is a state, not an error.
- URL proof slots: any https URL (x.com-only validator dies); file slots:
  global jpeg/png/pdf MIME set, 10 MiB cap (unchanged v1).
- First-party surfaces (data.ts listings, hand-written pages/heroes, static
  packs) are untouched by the def path - no migration in this milestone.
- The wizard must never write chain state besides initialize_mutual; doc
  PUT is the only daemon write. No server state anywhere; drafts are
  localStorage fields only.
- claim_payout gate retirement moves program + reconciler + ADR-0005 +
  EVENT-MUTUAL wording in ONE change (AGENTS.md propagation list).

### 4. Business Logic (pseudo-code, target language)

```ts
// canonical render (determinism: fixed key order, stable whitespace)
function renderDef(input: DefInput): string  // frontmatter yaml + 11-§ body
function policyHash(doc: string): Hex        // sha256Hex(utf8(doc))
function domainRef(seed: u64, hash: Hex): Hex // existing domainRefHex

// resolution (store)
for hit of fetchAllMutuals():
  if listing := known.get(hit.address) -> LiveMutual (first-party, today)
  else def := casGet(domainRef(hit.seed, hit.policyHash))   // cached, immutable
       if valid(def) -> LiveMutual(derived listing, def)     // community band
       else drop

// pack building (pure)
buildClaimFlow(def): ClaimFlow        // slots from proof; kind templates
buildAdjudicationPolicy(def): AdjudicationPolicy

// payout (after gate retirement)
claim_payout(cranker: anyone)  // was: cranker == mutual.authority
```

### 5. Definition of Done

- [ ] Deterministic render: same DefInput => identical bytes (test)
- [ ] Worked vectors: Chairmageddon (mutual) + Caffeine Supercycle (bounty)
      render with §5 tables verbatim from doc facts (test)
- [ ] Validation matrix: every rejection path asserted (test)
- [ ] Store: valid def listed / 404 / hash-mismatch / unknown-schema dropped (test)
- [ ] Built packs: zero-numbers assertion + slot-path parity claimant/juror (test)
- [ ] GenericPoolHero: data bindings + {{PARAM}} until chain answers (test)
- [ ] LiteSVM: claim_payout by cranker != mutual.authority succeeds (test)
- [ ] #/create: router case, gate matrix, publish states 200/400/404/409, draft resume (tests)
- [ ] Browser pass on devnet: one mutual created end-to-end from #/create,
      listed in community band, joined, claim filed, juror session runs
- [ ] Full `pnpm verify` exit 0 for the program change; scoped landing legs
      for the rest; changesets per bean (wizard/resolution: minor)
- [ ] AGENTS.md Parts table + propagation list updated with the def module,
      CAS resolution edge, community band, #/create route

### 6. Test Matrix (Given / When / Then)

- Given a DefInput, When rendered twice, Then byte-identical output
- Given tiers with cap < fee, When validated, Then rejection names the tier
- Given an unknown on-chain mutual and a valid CAS def, When the store
  scans, Then it appears in the community band with derived listing fields
- Given an unknown mutual and a CAS 404, When the store scans, Then it is
  dropped (no fallback content)
- Given a def-built ClaimFlow and AdjudicationPolicy, When packs are
  inspected, Then slot paths are identical and no string contains a numeral
- Given url-kind slot with a non-x.com https link, When documents are
  intake'd, Then it is accepted
- Given a settled mutual past a ruling and a cranker key != authority, When
  claim_payout is sent, Then it succeeds (post-retirement)
- Given #/create with all fields valid, When Deploy is signed, Then one
  initialize_mutual tx confirms and the CAS PUT returns 200, and the GET
  round-trip matches the hashed bytes

### 7. Open Questions

- Community-band ordering rule (creation slot vs pot size) - assume creation
  slot until a founder call says otherwise.
- Devnet daemon default URL for the wizard's advanced field is env-pinned
  per cluster - assume the existing useEvidenceDaemonUrl resolution.
- Whether first-party pools ever migrate onto defs: explicitly out of scope
  (non-goal); revisit after community pools exist.
