import type { Metadata } from 'next';
import { NUMBERS, UPDATED } from './_guide/content';
import { Figures, H2, MoreFigures } from './_guide/figures';
import { Glossary, PrintButton, RrfDemo, Walkthrough } from './_guide/interactive';

export const metadata: Metadata = { title: 'How it works' };

/**
 * The system explained: flows, an example, a ranking demo and the terms. Keep it current:
 * numbers and terms live in _guide/content.ts, every diagram in _guide/figures.tsx.
 */

const CONTENTS = [
  ['example', 'Example'],
  ['big-picture', 'Big picture'],
  ['search', 'One search'],
  ['rules-ai', 'Rules or AI'],
  ['ranking', 'Ranking'],
  ['votes', 'Try ranking'],
  ['data', 'Data import'],
  ['contributions', 'Contributions'],
  ['admin', 'Admin controls'],
  ['voice-ask', 'Voice & Ask'],
  ['quality', 'Getting better'],
  ['terms', 'Terms'],
] as const;

const CSS = `
.guide {
  --g-ai: oklch(0.58 0.17 295);
  --g-data: oklch(0.58 0.13 250);
  --g-rules: oklch(0.66 0.14 70);
}
.dark .guide {
  --g-ai: oklch(0.72 0.14 295);
  --g-data: oklch(0.72 0.11 250);
  --g-rules: oklch(0.8 0.13 80);
}
@keyframes g-in { from { opacity: 0; transform: translateX(8px) } to { opacity: 1; transform: none } }
.g-in { animation: g-in .3s ease-out both }
@media (prefers-reduced-motion: reduce) { .g-in { animation: none } }
@media print {
  @page { margin: 12mm }
  .guide figure { break-inside: avoid; box-shadow: none }
  .guide section { break-before: auto }
  .guide .overflow-x-auto { overflow: visible }
  .guide .overflow-x-auto > div { min-width: 0 !important }
}
`;

export default function HowItWorksPage() {
  return (
    <div className="guide mx-auto max-w-6xl space-y-10 px-4 py-6 md:px-8 md:py-8 print:max-w-none print:p-0">
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static CSS written above */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">How PlaciaGh works</h1>
            <p className="mt-1 text-muted-foreground text-sm">Updated {UPDATED}</p>
          </div>
          <PrintButton />
        </div>

        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {NUMBERS.map((n) => (
            <div key={n.label} className="flex flex-col rounded-lg border bg-surface px-3 py-2.5">
              <dt className="order-2 text-muted-foreground text-xs">{n.label}</dt>
              <dd className="font-semibold text-lg tabular-nums tracking-tight">{n.value}</dd>
            </div>
          ))}
        </dl>

        <nav aria-label="Contents" className="flex flex-wrap gap-1.5 print:hidden">
          {CONTENTS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="h-8 rounded-full border bg-surface px-3 font-medium text-muted-foreground text-xs leading-8 hover:bg-surface-2 hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section id="example" className="scroll-mt-20 space-y-3">
        <H2>Follow one search</H2>
        <Walkthrough />
      </section>

      <Figures />

      <section id="votes" className="scroll-mt-20 space-y-3">
        <H2>Try it: how votes add up</H2>
        <RrfDemo />
      </section>

      <MoreFigures />

      <section id="terms" className="scroll-mt-20 space-y-3">
        <H2>Terms</H2>
        <Glossary />
      </section>
    </div>
  );
}
