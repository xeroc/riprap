// /2026-breakpoint-blade-pool — the policy, in full, hidden by default
// (landing-page.md § /2026-breakpoint-blade-pool "Policy details", 2026-09-27):
// a native <details>, collapsed on load, carrying two tabs — EXPLAINED (the
// §1–§13 cards; copy verbatim or lightly compressed from the policy doc; §5
// tier table bound to mutual.tiers with {{PARAM}} mono placeholders whenever
// the chain hasn't answered — never static fallback numbers; §6/§7/§10 keep
// their policy-doc example numbers, their source is the document not the
// chain) and RAW POLICY (the anchored cover terms, folded in from the retired
// band 2026-09-27, states unchanged — the exact pinned bytes off the evidence
// daemon's CAS; 404 → upload remedy per HANSE_DOMAIN_SPEC_UPLOAD §2).
import type { Mutual } from "@riprap/hanse";
import { AddressChip, Button, Card, SectionBand, shortenAddress, TextLink, usd } from "@riprap/ui";
import type { Address } from "@solana/kit";
import { CheckIcon, CopyIcon } from "lucide-react";
import { type ChangeEvent, type ReactNode, useRef, useState } from "react";
import { domainRefHex, hansePreimage, sha256Hex, toHex } from "../domainRef";
import { type PoolTier, poolTiers, TIER_NAMES } from "../mutual";
import { useMutual } from "../useMutual";
import { evidenceBaseUrl, usePolicyDoc } from "../usePolicyDoc";

// Kit data law: unknown values render as mono {{PARAM}} placeholders.
const PARAM = "{{PARAM}}";

/** one policy category: § number, title, and its items */
interface PolicySection {
  n: string;
  title: string;
  body: ReactNode;
}

/** A fineprint table row: name always (copy); prices only once the chain answers. */
type FineTier = { name: string; fee?: number; cap?: number };

function fineRows(tiers: PoolTier[] | null): FineTier[] {
  if (tiers === null) return TIER_NAMES.map((name) => ({ name }));
  return tiers;
}

// Sources: meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md §1–§13.
function buildSections(tiers: PoolTier[] | null, subaccord: Address | null): PolicySection[] {
  return [
    {
      n: "01",
      title: "Product",
      body: (
        <p>
          Micro Mutual is a one-time mutual pool protecting members against a narrowly defined knife
          assault during a specific conference. Members contribute a fixed entry fee to a common
          pool. A member who experiences a qualifying knife assault during the covered event may
          request a discretionary payment, subject to adjudication, their coverage tier, and the
          remaining funds — no member has an enforceable right to a payment. After the payout
          request period closes, all remaining funds are distributed proportionally among members
          and the mutual is dissolved.
        </p>
      ),
    },
    {
      n: "02",
      title: "Coverage period",
      body: (
        <div className="flex flex-col gap-3">
          <p>
            Coverage begins at the start of the conference and ends at the end of the conference.
            Only incidents during this period and within the covered area qualify.
          </p>
          <p data-num className="font-mono text-xs text-stone">
            BREAKPOINT 2026 · 15-17 NOVEMBER 2026 · OPENS/CLOSES WITH THE CONFERENCE (DAILY HOURS
            PER THE PUBLISHED SCHEDULE) · OLYMPIA CONVENTION CENTRE AND DESIGNATED EVENT AREA,
            LONDON
          </p>
        </div>
      ),
    },
    {
      n: "03",
      title: "Covered event",
      body: (
        <div className="flex flex-col gap-3">
          <p>
            A knife assault means: a member suffers bodily injury caused by another person
            intentionally using a knife or other sharp-edged or bladed instrument against them.
          </p>
          <p>
            The incident must occur during the coverage period, within the covered geographic area,
            and while the requester is an active member.
          </p>
        </div>
      ),
    },
    {
      n: "04",
      title: "Exclusions",
      body: (
        <ul data-slot="policy-exclusions" className="flex flex-col gap-2">
          {[
            "Injuries caused by the member themselves.",
            "Accidental injuries involving a knife or blade.",
            "Injuries caused by ordinary handling or use of a knife.",
            "Injuries resulting from consensual activities.",
            "Injuries occurring outside the coverage period.",
            "Injuries occurring outside the covered area.",
            "Requests based on emotional distress without qualifying bodily injury.",
            "Requests exceeding the member's coverage-tier maximum.",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-2 inline-block size-1 shrink-0 bg-hairline-strong"
              />
              {item}
            </li>
          ))}
        </ul>
      ),
    },
    {
      n: "05",
      title: "Coverage tiers",
      body: (
        <div className="flex flex-col gap-3">
          <p>
            Members choose their coverage when joining. The maximum payout is the total amount a
            member can receive for qualifying payout requests; a member cannot receive more than
            their tier's maximum.
          </p>
          {/* policy §5 — prices from mutual.tiers, {{PARAM}} until the chain answers */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th
                  scope="col"
                  className="py-2 pr-4 font-normal text-muted-soft [font:var(--riprap-mono-label)]"
                >
                  TIER
                </th>
                <th
                  scope="col"
                  className="py-2 pr-4 font-normal text-muted-soft [font:var(--riprap-mono-label)]"
                >
                  ENTRY FEE
                </th>
                <th
                  scope="col"
                  className="py-2 font-normal text-muted-soft [font:var(--riprap-mono-label)]"
                >
                  MAX PAYOUT
                </th>
              </tr>
            </thead>
            <tbody>
              {fineRows(tiers).map((t) => (
                <tr key={t.name} className="border-b border-hairline last:border-b-0">
                  <td className="py-2 pr-4 [font:var(--riprap-body-sm)]">{t.name}</td>
                  <td data-num className="py-2 pr-4 font-mono text-sm text-ink">
                    {t.fee === undefined ? PARAM : usd(t.fee)}
                  </td>
                  <td data-num className="py-2 font-mono text-sm text-ink">
                    up to {t.cap === undefined ? PARAM : usd(t.cap)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      n: "06",
      title: "Pool",
      body: (
        <div className="flex flex-col gap-3">
          <p>
            All member contributions enter a single mutual pool, used exclusively for qualifying
            discretionary payments and refunds to members after the payout request period. There is
            no permanent reserve. No profit is retained by the mutual.
          </p>
          {/* §6 worked example: 1,000 × $20 = $20,000 — policy-doc number, not a chain read */}
          <p data-num className="font-mono text-xs text-stone">
            EXAMPLE: 1,000 MEMBERS × $20 STANDARD = $20,000 TOTAL POOL
          </p>
        </div>
      ),
    },
    {
      n: "07",
      title: "Payout requests",
      body: (
        <div className="flex flex-col gap-3">
          <p>
            A member may submit a payout request for a qualifying knife assault occurring during the
            coverage period. All payments are discretionary: requests are adjudicated by a randomly
            drawn jury of staked members; no member has a contractual or enforceable right to any
            payment; the jury's determination is final. The maximum payment is set by the member's
            coverage tier. If approved requests are less than the pool, the remaining funds are
            returned to members. If approved requests exceed the pool, payments are reduced
            proportionally so the mutual never pays more than it holds.
          </p>
          {/* §7 example: $20,000 pool, $12,000 approved requests, $8,000 returned — policy-doc numbers */}
          <p data-num className="font-mono text-xs text-stone">
            EXAMPLE: $20,000 POOL · $12,000 APPROVED REQUESTS · $8,000 RETURNED
          </p>
          {/* copy doc § on-chain states: {{subaccord}} ← mutual.subaccord, useaccord app link */}
          <p data-num className="font-mono text-xs text-stone">
            ADJUDICATION · SUBACCORD{" "}
            {subaccord === null ? (
              PARAM
            ) : (
              <TextLink
                href={`https://app.useaccord.xyz/#/subaccords/${subaccord}`}
                title={subaccord}
                external
                className="font-mono text-xs"
              >
                {shortenAddress(subaccord)}
              </TextLink>
            )}
          </p>
        </div>
      ),
    },
    {
      n: "08",
      title: "Pool dissolution",
      body: (
        <p>
          The mutual has a finite lifetime. After the conference ends, the payout request period
          closes, and all approved requests are settled, the remaining balance is distributed to
          eligible members. The mutual is then dissolved permanently — no funds remain.
        </p>
      ),
    },
    {
      n: "09",
      title: "Economic principle",
      body: (
        <p>
          Members pool money to protect one another against a narrowly defined event. If the event
          costs less than expected, members recover the unused money. The entry fee is the member's
          maximum contribution; the coverage tier sets the maximum potential payout.
        </p>
      ),
    },
    {
      n: "10",
      title: "Worked example — Standard tier",
      body: (
        <div className="flex flex-col gap-3">
          <p>
            1,000 members each contribute $20 into a $20,000 pool with a $2,000 maximum individual
            payout. Four qualifying payout requests are approved at $2,000 each: payments $8,000,
            remaining pool $12,000. After the payout request period closes, the remaining $12,000 is
            distributed to eligible members and the mutual dissolves — a $20 member receives their
            share of the unused pool back.
          </p>
        </div>
      ),
    },
    {
      n: "11",
      title: "Product promise",
      body: (
        <p>
          Join a temporary community mutual. Pay a fixed amount. Receive defined protection against
          knife assault during the event. If payments don't consume the pool, the remaining money
          comes back to the members. When the event is over, the mutual ends.
        </p>
      ),
    },
    {
      n: "12",
      title: "Legal status",
      body: (
        <div className="flex flex-col gap-3">
          <p>
            The mutual is an unincorporated association under English law — not insurance, and not
            authorised or regulated under the Financial Services and Markets Act. Every payment is
            discretionary, no member has a contractual right to a payout, and the decision-maker's
            determination is final. No profit is earned or distributed, surplus returns to members
            pro-rata, and no risk capital is invested for yield.
          </p>
          <p>
            An unincorporated association has no separate legal personality and no limited
            liability: if the pool is exhausted and a liability arises, the operators may be
            personally exposed. The pool runs on a smart contract on Solana; English law treats
            cryptoassets as personal property, but on-chain association governance is legally
            untested and no UK legislation expressly validates it. The pool is closed, small-value,
            and not operated by way of business; the operators take advice on the money-laundering
            regulations.
          </p>
          {/* policy §12 — authorities as cited in counsel's opinion */}
          <p data-num className="font-mono text-xs text-stone">
            NOT INSURANCE · FSMA 2000 · PERG 6.6.1 · BURRELL [1982] · CCBSA 2014 · MLR 2017
          </p>
        </div>
      ),
    },
    {
      n: "13",
      title: "Counsel's recommendations",
      body: (
        <div className="flex flex-col gap-3">
          {/* policy §13 — each recommendation with the policy's response */}
          <ul data-slot="policy-recommendations" className="flex flex-col gap-2">
            <li>
              1. Reconsider the legal form — a registered society (CCBSA 2014) would provide
              separate legal personality and limited liability, at the cost of annual FCA filings;
              the unincorporated association leaves the operators personally exposed (§12).
            </li>
            <li>2. Document the discretion exhaustively — adopted: §1 and §7.</li>
            <li>
              3. Avoid insurance terminology — adopted throughout: contribution, discretionary
              payment.
            </li>
            <li>
              4. Take specific advice on the smart contract — the interaction between Solana-based
              execution and English association law needs a dedicated opinion.
            </li>
            <li>
              5. Consider FCA pre-application engagement — the Mutual Societies Development Unit can
              confirm whether the model falls within the regulatory perimeter before the structure
              is committed.
            </li>
          </ul>
          <p>
            Counsel's conclusion: the discretionary mutual model is legally viable in principle, but
            the combination of unincorporated status and smart-contract implementation introduces
            material legal uncertainty and personal liability risk. Proceed with caution and
            specific legal advice.
          </p>
        </div>
      ),
    },
  ];
}

/** PUT failure → one deadpan line (copy doc). */
function putFailureLine(status: number): string {
  if (status === 404) return "The evidence server can't see the mutual yet. Try again in a moment.";
  if (status === 400) {
    return "The evidence server rejected the proof — these bytes don't match the on-chain anchor.";
  }
  if (status === 409) return "Different bytes are already stored at this anchor.";
  return "The upload didn't go through. Try again.";
}

/** Proof-mode PUT per HANSE_DOMAIN_SPEC_UPLOAD §2 — hash checked BEFORE any PUT. */
async function uploadTerms(
  base: string,
  mutual: Mutual,
  file: File,
): Promise<{ ok: true } | { ok: false; line: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if ((await sha256Hex(bytes)) !== toHex(mutual.policyHash)) {
    return {
      ok: false,
      line: "This file's hash doesn't match the mutual's policy hash. Nothing was uploaded.",
    };
  }
  const ref = await domainRefHex(mutual.seed, mutual.policyHash);
  const preimage = toHex(hansePreimage(mutual.seed, mutual.policyHash));
  const query = `?subaccord=${encodeURIComponent(mutual.subaccord)}&preimage=${preimage}&offset=23`;
  const response = await fetch(`${base}/domains/${ref}${query}`, {
    method: "PUT",
    headers: { "Content-Type": "text/markdown" },
    body: bytes,
  });
  if (response.status === 201 || response.status === 200) return { ok: true };
  return { ok: false, line: putFailureLine(response.status) };
}

/** `copy` ⇄ `copied` — the AddressChip settle-safe word swap, applied to the whole document. */
function useCopyText(): { copied: boolean; copy: (text: string) => void } {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: (text: string) => {
      navigator.clipboard
        ?.writeText(text)
        .then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        })
        .catch((error: unknown) => console.error("terms copy failed", error));
    },
  };
}

/** One anchor: mono label + a copy-chip carrying the full value. */
function AnchorChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      data-num
      className="inline-flex items-center gap-2 text-muted-soft [font:var(--riprap-mono-label)]"
    >
      {label}
      <AddressChip address={value} aria-label={`copy ${label.toLowerCase()}`} />
    </span>
  );
}

const TABS = [
  { id: "explained", label: "Explained" },
  { id: "raw", label: "Raw policy" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function PolicyDetails() {
  const mutualQuery = useMutual();
  const mutual = mutualQuery.state === "ready" ? mutualQuery.mutual : null;
  const tiers = mutual === null ? null : poolTiers(mutual);
  const subaccord = mutual === null ? null : mutual.subaccord;
  const doc = usePolicyDoc(mutual);
  const { copied, copy } = useCopyText();
  const [tab, setTab] = useState<Tab>("explained");

  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // same file re-picked must re-fire onChange
    if (file === undefined || mutual === null) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadTerms(evidenceBaseUrl(), mutual, file);
      if (result.ok) {
        await doc.refetch();
      } else {
        setUploadError(result.line);
      }
    } catch {
      setUploadError("The upload didn't go through. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SectionBand id="policy" label="the policy" tone="ground">
      <div className="flex flex-col gap-(--riprap-space-lg)">
        <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-sm)]">
          The policy, in full.
        </h2>
        <p data-num className="text-muted-soft [font:var(--riprap-mono-label)]">
          THE COMEDY STOPS HERE. THE POLICY IS REAL.
        </p>

        {/* collapsed on load — native disclosure */}
        <details data-slot="policy-details" className="group border-y border-hairline">
          <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
            <h3 className="tracking-tight text-ink [font:var(--riprap-display-sm)]">
              Open the policy — explained, or verbatim
            </h3>
            <span aria-hidden className="font-mono text-base text-accent">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">–</span>
            </span>
          </summary>

          <div className="flex flex-col gap-6 pb-6">
            <div
              role="tablist"
              aria-label="policy views"
              className="flex gap-8 border-b border-hairline"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`policy-tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`policy-panel-${t.id}`}
                  className={[
                    "-mb-px border-b-2 pb-3 tracking-(--riprap-tracking-stamp) uppercase [font:var(--riprap-mono-label)]",
                    tab === t.id ? "border-accent text-ink" : "border-transparent text-muted-soft",
                  ].join(" ")}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id="policy-panel-explained"
              aria-labelledby="policy-tab-explained"
              hidden={tab !== "explained"}
            >
              <div className="grid gap-4 md:grid-cols-2" data-slot="policy-sections">
                {buildSections(tiers, subaccord).map((s) => (
                  <Card key={s.n} data-slot="policy-section" className="gap-3 p-6">
                    <p className="flex items-baseline gap-3 text-muted-soft [font:var(--riprap-mono-label)]">
                      <span data-num>§ {s.n}</span>
                      <span className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground">
                        {s.title}
                      </span>
                    </p>
                    <div className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
                      {s.body}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div
              role="tabpanel"
              id="policy-panel-raw"
              aria-labelledby="policy-tab-raw"
              hidden={tab !== "raw"}
            >
              <div
                className="flex max-w-[42rem] flex-col gap-(--riprap-space-lg)"
                data-slot="terms"
              >
                <h3 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-sm)]">
                  The immutable terms of this mutual.
                </h3>
                <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                  Fixed when the pool was created: the on-chain policy hash pins these exact bytes,
                  so they can never change — different terms would be a different hash. Served by
                  the Accord evidence server.
                </p>
                <Card data-slot="terms-card" className="gap-3 p-6">
                  {doc.state === "idle" && (
                    <p data-num className="font-mono text-sm text-ink">
                      terms: {PARAM}
                    </p>
                  )}
                  {doc.state === "loading" && (
                    <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                      Reading the terms from the evidence server.
                    </p>
                  )}
                  {doc.state === "error" && (
                    <div className="flex flex-col gap-3">
                      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                        Couldn't reach the evidence server.
                      </p>
                      <Button variant="outline" onClick={doc.retry}>
                        Try again
                      </Button>
                    </div>
                  )}
                  {doc.state === "missing" && mutual !== null && (
                    <div className="flex flex-col gap-3">
                      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                        Not published yet.
                      </p>
                      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                        The cover terms aren't on the evidence server. Upload the file whose hash
                        the mutual pins.
                      </p>
                      <input
                        ref={fileInput}
                        type="file"
                        accept=".md,.markdown,text/markdown"
                        className="hidden"
                        onChange={(e) => void onPick(e)}
                        aria-label="cover terms file"
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          disabled={uploading}
                          onClick={() => fileInput.current?.click()}
                        >
                          {uploading ? "Uploading…" : "Upload the cover terms"}
                        </Button>
                        {uploadError !== null && (
                          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                            {uploadError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {doc.state === "ready" && mutual !== null && (
                    <div className="flex flex-col gap-4" data-slot="terms-ready">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <AnchorChip label="POLICY HASH" value={toHex(mutual.policyHash)} />
                        <AnchorChip label="DOMAIN REF" value={doc.ref} />
                      </div>
                      <div
                        data-slot="terms-document"
                        className="overflow-hidden rounded-sm border border-hairline"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-hairline px-3 py-2">
                          <p data-num className="text-muted-soft [font:var(--riprap-mono-label)]">
                            COVER TERMS · {new TextEncoder().encode(doc.text).length} BYTES ·
                            VERBATIM
                          </p>
                          <Button
                            variant="ghost"
                            className="size-7 p-0"
                            aria-label="copy the cover terms"
                            title={copied ? "copied" : "copy"}
                            onClick={() => copy(doc.text)}
                          >
                            {copied ? (
                              <CheckIcon aria-hidden="true" className="size-3.5" />
                            ) : (
                              <CopyIcon aria-hidden="true" className="size-3.5" />
                            )}
                          </Button>
                        </div>
                        <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap p-3 font-mono text-xs leading-relaxed text-ink">
                          {doc.text}
                        </pre>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </details>
      </div>
    </SectionBand>
  );
}
