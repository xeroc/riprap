// The blurb & brand kit page (unlisted route #/blurb): fixed words, a
// forwardable email, the team, the brand files, the contact. Every
// copyable block is a CopyBlock — the mono label names what lands on the
// clipboard. Copy source: ./content.ts (provenance comments there).
import {
  ChatMessage,
  Container,
  CopyBlock,
  EmailCard,
  HexBackdrop,
  numeralSegments,
  SectionBand,
  Wordmark,
} from "@riprap/ui";
import { useState } from "react";

import { Settle } from "../components/Settle";
import {
  BRAND_ASSETS,
  BRAND_COLORS,
  BRAND_STORY,
  BRAND_TYPE,
  BRAND_USAGE,
  type BrandColor,
  CONTACT_EMAIL,
  EMAIL_BODY,
  EMAIL_FULL,
  EMAIL_SUBJECT,
  EMAIL_TO,
  INTRO,
  KUDOS,
  ONE_LINE,
  PERSONAS,
  RING_ANATOMY,
  SHORT_BLURB,
  STANDARD_BLURB,
  STATUS,
  X_FABIAN_URL,
  X_RIPRAP_URL,
} from "./content";

/** body text with every numeral run in mono (DESIGN.md § Typography — the
 * kit's numeralSegments does the splitting; used by rows, kudos, notes). */
function Prose({ text }: { text: string }) {
  return (
    <>
      {numeralSegments(text).map((segment, i) =>
        segment.numeral ? (
          <span key={i} data-num className="font-mono">
            {segment.text}
          </span>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  );
}

/** shared mono file-button chrome (AddressChip button look) */
const FILE_BTN =
  "inline-flex min-h-9 items-center gap-1.5 rounded-none border border-hairline-strong bg-transparent " +
  "px-3 text-body [font:var(--riprap-mono-label)] tracking-(--riprap-tracking-stamp) " +
  "transition-[border-color,color] duration-[160ms] ease-out outline-none " +
  "hover:border-stone hover:text-ink focus-visible:ring-3 focus-visible:ring-ring";

/** copies a fixed string with the file-button chrome */
function CopyValueButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = () => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch((error: unknown) => console.error("copy failed", error));
  };
  return (
    <button type="button" className={FILE_BTN} onClick={onClick} data-num>
      {copied ? `${label} copied` : `copy ${label}`}
    </button>
  );
}

/** fetches the served SVG and copies its source verbatim */
function CopySvgButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = () => {
    fetch(url)
      .then((response) => response.text())
      .then((source) => navigator.clipboard?.writeText(source))
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch((error: unknown) => console.error("svg copy failed", error));
  };
  return (
    <button type="button" className={FILE_BTN} onClick={onClick} data-num>
      {copied ? "svg copied" : "copy svg"}
    </button>
  );
}

function Header() {
  return (
    <div className="relative">
      {/* engineering paper: the hex lattice behind the hero, as the
          platform and pool heroes carry it */}
      <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
      <section className="relative z-10 bg-transparent py-(--riprap-space-section)">
        <Container className="flex flex-col gap-(--riprap-space-xl)">
          <div className="flex items-baseline justify-between gap-4">
            <a
              href="#/"
              aria-label="Riprap home"
              className="outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <Wordmark size={28} />
            </a>
            <span className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
              the blurb page
            </span>
          </div>
          <Settle>
            <h1 className="max-w-[24ch] text-ink [font:var(--riprap-display-xl)] [letter-spacing:var(--riprap-tracking-display)]">
              About Riprap, ready to copy.
            </h1>
          </Settle>
          <Settle delay={40}>
            <p className="max-w-[60ch] text-body [font:var(--riprap-body-md)] text-muted-foreground">
              {INTRO}
            </p>
          </Settle>
          <Settle delay={80}>
            <p className="text-stone [font:var(--riprap-mono-label)]" data-num>
              {STATUS}
            </p>
          </Settle>
        </Container>
      </section>
    </div>
  );
}

function WordsBand() {
  return (
    <SectionBand label="the words">
      {/* the two chat-length blurbs side by side; the standard blurb
          always sits below, spanning the full content width */}
      <div className="grid items-start gap-(--riprap-space-lg) lg:grid-cols-2">
        <CopyBlock label="one line — for chats" value={ONE_LINE} hint="paste into a chat">
          <ChatMessage
            author="Fabian Schuh"
            avatar="/people/fabian.webp"
            text={ONE_LINE}
            meta="forwarded message"
          />
        </CopyBlock>
        <CopyBlock
          label="short blurb — 60 words"
          value={SHORT_BLURB}
          hint="for a caption, a slide, a DM"
        >
          <ChatMessage
            author="Fabian Schuh"
            avatar="/people/fabian.webp"
            text={SHORT_BLURB}
            meta="forwarded message"
          />
        </CopyBlock>
      </div>
      <CopyBlock
        label="standard blurb — 150 words"
        value={STANDARD_BLURB}
        hint="for a one-pager or a press paragraph"
      >
        <p className="m-0 max-w-[70ch] text-left whitespace-pre-line text-body [font:var(--riprap-body-sm)]">
          {STANDARD_BLURB}
        </p>
      </CopyBlock>
    </SectionBand>
  );
}

function EmailBand() {
  return (
    <SectionBand label="the email" tone="soft">
      <div className="w-full">
        <CopyBlock
          label="forwardable email — your voice"
          value={EMAIL_FULL}
          hint="adapt freely; keep the facts"
        >
          <EmailCard to={EMAIL_TO} subject={EMAIL_SUBJECT}>
            {EMAIL_BODY}
          </EmailCard>
        </CopyBlock>
      </div>
    </SectionBand>
  );
}

function PersonaFigure({
  img,
  alt,
  caption,
  rows,
}: {
  img: string;
  alt: string;
  caption: string;
  rows: string[];
}) {
  return (
    <figure className="flex flex-col gap-4">
      <img src={img} alt={alt} className="h-64 w-auto border border-hairline object-cover" />
      <figcaption className="text-muted-foreground [font:var(--riprap-mono-label)]">
        {caption}
      </figcaption>
      <div className="flex flex-col gap-2.5 pt-1">
        {rows.map((row) => (
          <div key={row} className="text-body [font:var(--riprap-body-sm)]">
            <span className="text-accent">▶</span> <Prose text={row} />
          </div>
        ))}
      </div>
    </figure>
  );
}

function TeamBand() {
  return (
    <SectionBand label="the team">
      <div className="flex flex-wrap items-start gap-16">
        {PERSONAS.map((persona) => (
          <PersonaFigure key={persona.img} {...persona} />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
          track record
        </h3>
        <Settle>
          <ul data-slot="kudos" className="flex max-w-[64rem] flex-wrap gap-2">
            {KUDOS.map((kudo) => (
              <li
                key={kudo}
                className="border border-hairline px-3 py-1 text-body [font:var(--riprap-body-sm)] text-muted-foreground"
              >
                <Prose text={kudo} />
              </li>
            ))}
          </ul>
        </Settle>
      </div>
    </SectionBand>
  );
}

function ColorRow({ color }: { color: BrandColor }) {
  return (
    <li
      data-slot="brand-color"
      className="flex flex-wrap items-center gap-3 border-b border-hairline py-2 last:border-b-0"
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 shrink-0 border border-hairline-strong"
        style={{ backgroundColor: color.hex }}
      />
      <span className="flex min-w-[14ch] flex-1 flex-col">
        <span className="text-ink [font:var(--riprap-body-sm)]">{color.name}</span>
        {color.note ? (
          <span className="text-muted-soft [font:var(--riprap-mono-label)]">
            <Prose text={color.note} />
          </span>
        ) : null}
      </span>
      <span className="font-mono text-sm text-ink" data-num>
        {color.hex}
      </span>
      <CopyValueButton value={color.hex} label="hex" />
    </li>
  );
}

function BrandBand() {
  return (
    <SectionBand label="the brand" tone="soft">
      <div className="flex max-w-[70ch] flex-col gap-3">
        <p className="m-0 text-body [font:var(--riprap-body-sm)] text-muted-foreground">
          <Prose text={BRAND_STORY} />
        </p>
        <p className="m-0 text-body [font:var(--riprap-body-sm)] text-muted-foreground">
          <Prose text={RING_ANATOMY} />
        </p>
        <p className="m-0 text-body [font:var(--riprap-body-sm)] text-muted-soft">
          <Prose text={BRAND_USAGE} />
        </p>
      </div>
      <div className="grid items-stretch gap-(--riprap-space-lg) sm:grid-cols-2 lg:grid-cols-4">
        {BRAND_ASSETS.map((asset) => (
          <figure
            key={asset.id}
            data-slot="brand-asset"
            className="flex flex-col gap-4 border border-hairline bg-card p-4"
          >
            <div className="flex h-28 items-center justify-center">
              <img src={asset.svg} alt={`Riprap ${asset.label}`} className="max-h-24 w-auto" />
            </div>
            <figcaption className="flex flex-1 flex-col gap-1">
              <span className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
                {asset.label}
              </span>
              <span className="text-muted-soft [font:var(--riprap-body-sm)]">
                <Prose text={asset.note} />
              </span>
            </figcaption>
            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
              <a href={asset.svg} download className={FILE_BTN} data-num>
                svg
              </a>
              {asset.png ? (
                <a href={asset.png} download className={FILE_BTN} data-num>
                  png
                </a>
              ) : null}
              <CopySvgButton url={asset.svg} />
            </div>
          </figure>
        ))}
      </div>
      <div className="flex flex-col gap-(--riprap-space-lg)">
        <h3 className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
          the colors
        </h3>
        <div className="grid items-start gap-(--riprap-space-lg) lg:grid-cols-2">
          {BRAND_COLORS.map((group) => (
            <div key={group.group} data-slot="brand-color-group" className="flex flex-col gap-2">
              <h4 className="m-0 text-ink [font:var(--riprap-title-sm)]">{group.group}</h4>
              <ul className="m-0 flex list-none flex-col p-0">
                {group.colors.map((color) => (
                  <ColorRow key={`${group.group}-${color.name}`} color={color} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="m-0 uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
          the type
        </h3>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {BRAND_TYPE.map((face) => (
            <li key={face.name} className="flex flex-wrap items-baseline gap-3">
              <span className="min-w-[16ch] text-ink [font:var(--riprap-title-sm)]">
                {face.name}
              </span>
              <span className="text-muted-foreground [font:var(--riprap-body-sm)]">
                {face.role}
              </span>
              <span className="text-muted-soft [font:var(--riprap-mono-label)]">SIL OFL</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionBand>
  );
}

function ContactBand() {
  return (
    <SectionBand label="the contact">
      <div className="flex flex-col gap-(--riprap-space-lg)">
        <div className="grid max-w-[64rem] gap-(--riprap-space-lg) lg:grid-cols-3">
          <CopyBlock label="email" value={CONTACT_EMAIL} hint="">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-left font-mono text-sm text-ink underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
              data-num
            >
              {CONTACT_EMAIL}
            </a>
          </CopyBlock>
          <CopyBlock label="x — the build log" value="@riprapxyz" hint="">
            <a
              href={X_RIPRAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-left font-mono text-sm text-accent underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
              data-num
            >
              @riprapxyz
            </a>
          </CopyBlock>
          <CopyBlock label="x — the founder" value="@xeroc" hint="">
            <a
              href={X_FABIAN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-left font-mono text-sm text-accent underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
              data-num
            >
              @xeroc
            </a>
          </CopyBlock>
        </div>
      </div>
    </SectionBand>
  );
}

function BlurbFooter() {
  return (
    <footer className="border-t border-hairline bg-ground py-12">
      <Container>
        <p className="m-0 font-mono text-sm text-muted-soft" data-num>
          © 2026 Riprap · riprap.xyz
        </p>
      </Container>
    </footer>
  );
}

export function BlurbPage() {
  return (
    <>
      <main>
        <Header />
        <WordsBand />
        <EmailBand />
        <TeamBand />
        <BrandBand />
        <ContactBand />
      </main>
      <BlurbFooter />
    </>
  );
}
