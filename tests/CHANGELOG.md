# @riprap/tests

## 0.9.0

### Patch Changes

- Updated dependencies []:
  - @riprap/hanse@0.9.0
  - @riprap/pool@0.9.0

## 0.8.0

### Patch Changes

- [#14](https://github.com/xeroc/riprap/pull/14) [`d8db3dd`](https://github.com/xeroc/riprap/commit/d8db3dddfb1c1edc36e4e88fd5276a9830207c89) Thanks [@xeroc](https://github.com/xeroc)! - Sync landing tests with the 2026-10-10 rewording: the headline-set assertion matches the shipped sentence-case `P2P purpose pools`, the lineage test asserts the new Mutuals-first opener instead of the removed "Protection without a protector." closer, and two typos in the new Heritage paragraph (Mututals/prestage) are fixed. The e2e harness now gates accord's loader Deploy on the buffer's actual content — re-sending missing 1 KiB chunks until every byte has landed — instead of an account-size poll that always passed immediately (the allocation is born full-size), which let Deploy race its own fire-and-forget writes and ship a truncated ELF ("Verifier error: jump to middle of LD_DW").
- Updated dependencies []:
  - @riprap/hanse@0.8.0
  - @riprap/pool@0.8.0

## 0.7.0

### Patch Changes

- [#13](https://github.com/xeroc/riprap/pull/13) [`2581435`](https://github.com/xeroc/riprap/commit/25814358e90df4b26ea959655646131a283b9c25) Thanks [@xeroc](https://github.com/xeroc)! - Sync landing tests with the 2026-10-10 rewording: the headline-set assertion matches the shipped sentence-case `P2P purpose pools`, the lineage test asserts the new Mutuals-first opener instead of the removed "Protection without a protector." closer, and two typos in the new Heritage paragraph (Mututals/prestage) are fixed. The e2e harness now gates accord's loader Deploy on the buffer's actual content — re-sending missing 1 KiB chunks until every byte has landed — instead of an account-size poll that always passed immediately (the allocation is born full-size), which let Deploy race its own fire-and-forget writes and ship a truncated ELF ("Verifier error: jump to middle of LD_DW").
- Updated dependencies []:
  - @riprap/hanse@0.7.0
  - @riprap/pool@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [[`1c5fdb6`](https://github.com/xeroc/riprap/commit/1c5fdb6315c31ae41b45d3ae682a2421c6a5e6a5), [`c9f8d7e`](https://github.com/xeroc/riprap/commit/c9f8d7e3b8f420f77c9be20be58432d0adad7b1a)]:
  - @riprap/hanse@0.6.0
  - @riprap/pool@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies []:
  - @riprap/hanse@0.5.0
  - @riprap/pool@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [[`1b7231b`](https://github.com/xeroc/riprap/commit/1b7231b5402da3ba46d527472d60742d4d355222), [`b302c98`](https://github.com/xeroc/riprap/commit/b302c98c78c2299d9be76f699fe6e51a616a4e7a)]:
  - @riprap/hanse@0.4.0
  - @riprap/pool@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies []:
  - @riprap/pool@0.3.0
  - @riprap/hanse@0.3.0

## 0.2.0

### Minor Changes

- initial changeset release

### Patch Changes

- Updated dependencies [`a9f65eb`]:
  - @riprap/hanse@0.2.0
  - @riprap/pool@0.2.0
