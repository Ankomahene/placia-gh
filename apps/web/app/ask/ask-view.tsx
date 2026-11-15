'use client';

import type { AskEvent, AskMeta, AskPlace } from '@placia/core/ask';
import { segments } from '@placia/core/ask/citations';
import { cn } from '@placia/ui/cn';
import { ArrowUp, MapPin, RotateCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MicButton, useVoice } from '../_components/voice';
import { formatDistance } from '../_lib/format';
import { readLocation } from '../_lib/location';

interface Turn {
  id: number;
  question: string;
  status: string | null;
  answer: string;
  places: AskPlace[];
  meta: AskMeta | null;
  failed: boolean;
}

const EXAMPLES = [
  'Pharmacy open on Sunday near Osu',
  'Cheap hostel close to KNUST',
  'Where can I watch a movie in Accra?',
  'Fuel station in East Legon',
];

let nextId = 1;

export function AskView({ initial }: { initial: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const update = useCallback(
    (id: number, fn: (t: Turn) => Turn) =>
      setTurns((ts) => ts.map((t) => (t.id === id ? fn(t) : t))),
    [],
  );

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || busy) return;
      const id = nextId++;
      const history = turns
        .filter((t) => t.meta?.path === 'agent')
        .slice(-3)
        .flatMap((t) => [
          { role: 'user' as const, text: t.question },
          { role: 'assistant' as const, text: t.meta?.answer ?? t.answer },
        ]);
      setTurns((ts) => [
        ...ts,
        { id, question: q, status: null, answer: '', places: [], meta: null, failed: false },
      ]);
      setText('');
      setBusy(true);
      const loc = readLocation();
      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, lat: loc?.lat, lon: loc?.lon, history }),
        });
        if (!res.ok || !res.body) throw new Error(String(res.status));
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buf = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += value;
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const ev = JSON.parse(line) as AskEvent;
            update(id, (t) => apply(t, ev));
          }
        }
      } catch {
        update(id, (t) => ({ ...t, failed: true, status: null }));
      } finally {
        setBusy(false);
      }
    },
    [busy, turns, update],
  );

  const voice = useVoice({ onInterim: setText, onFinal: (t) => void ask(t) });

  useEffect(() => {
    if (initial && !started.current) {
      started.current = true;
      void ask(initial);
    }
  }, [initial, ask]);

  // Keep the newest answer in view as it streams.
  const last = turns.at(-1);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every streamed change.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [last?.answer, last?.places.length, turns.length]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-40 md:px-8 md:pb-28">
      {turns.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center gap-5 py-10">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
            <Sparkles className="size-6" />
          </div>
          <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">Ask Placia</h1>
          <ul className="flex flex-col gap-2">
            {EXAMPLES.map((e) => (
              <li key={e}>
                <button
                  type="button"
                  onClick={() => void ask(e)}
                  className="w-full rounded-xl border bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-primary"
                >
                  {e}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ol className="flex flex-col gap-8 py-6">
          {turns.map((t) => (
            <li key={t.id} className="space-y-3">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">
                {t.question}
              </p>
              <Answer turn={t} onRetry={() => void ask(t.question)} />
            </li>
          ))}
        </ol>
      )}
      <div ref={end} />

      <form
        className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 px-4 md:bottom-6"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(text);
        }}
      >
        <div className="mx-auto flex max-w-2xl items-end gap-1.5 rounded-3xl border bg-surface p-1.5 pl-4 shadow-card">
          <textarea
            ref={input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void ask(text);
              }
            }}
            rows={1}
            maxLength={300}
            enterKeyHint="send"
            placeholder={voice.phase === 'listening' ? 'Listening…' : 'Ask about places'}
            aria-label="Your question"
            className="max-h-32 min-h-10 flex-1 resize-none self-center bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground"
          />
          <MicButton voice={voice} className="size-10 shrink-0" />
          <button
            type="submit"
            aria-label="Send"
            disabled={!text.trim() || busy}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="size-5" />
          </button>
        </div>
      </form>
    </main>
  );
}

function apply(t: Turn, ev: AskEvent): Turn {
  switch (ev.type) {
    case 'status':
      return { ...t, status: ev.text };
    case 'places': {
      const seen = new Set(t.places.map((p) => p.ref));
      return { ...t, places: [...t.places, ...ev.places.filter((p) => !seen.has(p.ref))] };
    }
    case 'delta':
      return { ...t, status: null, answer: t.answer + ev.text };
    case 'done':
      return {
        ...t,
        status: null,
        meta: ev.meta,
        answer: ev.meta.path === 'agent' ? ev.meta.answer : t.answer,
      };
  }
}

function Answer({ turn: t, onRetry }: { turn: Turn; onRetry: () => void }) {
  const byRef = new Map(t.places.map((p) => [p.ref, p]));
  // Cited places, numbered in the order the answer cites them; refs not issued are dropped.
  const order: string[] = [];
  for (const s of segments(t.answer)) {
    if (s.kind === 'cite' && byRef.has(s.ref) && !order.includes(s.ref)) order.push(s.ref);
  }
  const fallback = t.meta?.path === 'fallback';
  const shown = fallback ? t.places : order.map((r) => byRef.get(r) as AskPlace);

  if (t.failed) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        Couldn't get an answer
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium text-foreground"
        >
          <RotateCw className="size-3.5" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {t.answer ? (
        <p className="text-[15px] leading-relaxed">
          {segments(t.answer).map((s, i) =>
            s.kind === 'text' ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: segments never reorder.
              <span key={i}>{s.text}</span>
            ) : byRef.has(s.ref) ? (
              <CiteChip
                // biome-ignore lint/suspicious/noArrayIndexKey: one ref can be cited twice.
                key={`${s.ref}-${i}`}
                n={order.indexOf(s.ref) + 1}
                place={byRef.get(s.ref) as AskPlace}
              />
            ) : null,
          )}
          {!t.meta ? (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
          ) : null}
        </p>
      ) : !t.meta ? (
        <p className="flex items-center gap-2 text-muted-foreground text-sm">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          {t.status ?? 'Thinking'}
        </p>
      ) : null}

      {fallback && !t.places.length ? (
        <p className="text-muted-foreground text-sm">No places found</p>
      ) : null}

      {shown.length ? (
        <ul className="overflow-hidden rounded-xl border bg-surface">
          {shown.map((p, i) => (
            <li key={p.ref} className="border-b last:border-b-0">
              <Link
                href={`/place/${p.slug}`}
                className="flex items-center gap-3 px-3.5 py-3 hover:bg-surface-2"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary font-semibold text-[11px] text-primary-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block truncate text-muted-foreground text-xs">
                    {[p.categoryName, p.locality].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {p.distanceM != null ? (
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {formatDistance(p.distanceM)}
                  </span>
                ) : (
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CiteChip({ n, place }: { n: number; place: AskPlace }) {
  return (
    <Link
      href={`/place/${place.slug}`}
      aria-label={place.name}
      className={cn(
        'mx-0.5 inline-grid size-5 place-items-center rounded-full bg-primary-soft align-[1px] font-semibold text-[11px] text-primary-soft-foreground',
        'hover:bg-primary hover:text-primary-foreground',
      )}
    >
      {n}
    </Link>
  );
}
