---
version: alpha
name: Passive Pulse — Riprap video score house style
purpose: soundtrack
key: riprap family — Gb major
bpm: 120
timeSignature: 4/4
structure: fixed
duration: 30–90 s, set per video by its scene map
references:
  - "the Accord Project's MUSIC.md (../accord worktree) is the parent brief — this file records only the Riprap family deltas"
  - "audio/blade-pool-intro-30s.strudel — the canonical Riprap implementation; read it before composing anything"
---

# Overview

Same passive-pulse blood as the Accord corpus: soft-heel 909 pulse under
hushed piano arpeggios, one chord per bar, markers as punctuation, the
structural high point is a subtraction (the thinning), the only cadence is
the whispered endcard button. Muted-first videos — the music must lose
every attention contest to the on-screen reading.

# Riprap family deltas

- **Key: Gb major** — flat side, one step past the corpus's darkest (synod
  Bb minor); warm, grave, kin. Loop: Gbmaj9 · Ebm9 · Dbmaj9.
- **The V refuses as a maj9**: the parent brief's V7sus needs a Cb spelling
  the dough piano sample map does not carry, so the dominant function is
  voiced Dbmaj9 (enharmonic C in the 9th) — still no leading-tone pull,
  still no resolution slammed home.
- **Accent lane: piano hum** (the accord-family recipe, not canon's pluck
  or synod's moog) — the stones-and-harbor world keeps it unornamented.
- **Marker law unchanged**: wood tick on cuts, rise on uncovers, shadow on
  gravitas (rulings, dissolution), bloom on the brand line, octave-doubled
  tonic button on the link. ≥70% of bars marker-free.

# Commands

```bash
pnpm --filter @riprap/remotion score blade-pool-intro-30s 34   # bake the wav (needs network once)
pnpm --filter @riprap/remotion studio                          # renders chain score --stale first
```
