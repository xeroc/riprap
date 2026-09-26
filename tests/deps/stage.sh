#!/usr/bin/env bash
# Stage the checked-in external program binaries (tests/deps) into
# target/deploy so the Surfpool deployment runbook picks them up.
#
# tests/deps holds BUILT artifacts of the sibling checkouts so the e2e is
# reproducible without building the siblings. They drift silently — refresh
# them on every accord / solana-attestation-service change (see
# tests/README.md and AGENTS.md).
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p target/deploy
cp tests/deps/sas.so target/deploy/solana_attestation_service.so
cp tests/deps/sas-keypair.json target/deploy/solana_attestation_service-keypair.json
echo "staged SAS into target/deploy for the deployment runbook"
