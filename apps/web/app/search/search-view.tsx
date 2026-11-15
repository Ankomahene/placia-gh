'use client';

import type { SearchResponse, SearchResult } from '@placia/core/search';
import { Button } from '@placia/ui/button';
import { cn } from '@placia/ui/cn';
import { List, LocateFixed, Map as MapIcon, MapPin, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackLink } from '../_components/back-link';
import { PlaceMap } from '../_components/map';
import { SearchBox } from '../_components/search-box';
import { formatDistance, placeWhere } from '../_lib/format';
import { useUserLocation } from '../_lib/location';

const PAGE = 20;
const TIMEOUT_MS = 20_000;

type State = 'loading' | 'ready' | 'error';

export function SearchView() {
  const params = useSearchParams();
  const q = params.get('q')?.trim() ?? '';
  const { location, status: locStatus, checked, ask } = useUserLocation();

  const [data, setData] = useState<SearchResponse | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [state, setState] = useState<State>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const desktop = useIsDesktop();

  const fetchPage = useCallback(
    async (offset: number, signal: AbortSignal) => {
      const sp = new URLSearchParams({ q, limit: String(PAGE), offset: String(offset) });
      if (location) {
        sp.set('lat', String(location.lat));
        sp.set('lon', String(location.lon));
      }
      const timeout = AbortSignal.timeout(TIMEOUT_MS);
      const res = await fetch(`/api/search?${sp}`, { signal: AbortSignal.any([signal, timeout]) });
      if (!res.ok) throw new Error(`search ${res.status}`);
      return (await res.json()) as SearchResponse;
    },
    [q, location],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` re-runs the search on retry.
  useEffect(() => {
    if (!q || !checked) return;
    const ctl = new AbortController();
    setState('loading');
    setSelected(null);
    fetchPage(0, ctl.signal)
      .then((r) => {
        setData(r);
        setResults(r.results);
        setState('ready');
        listRef.current?.scrollTo({ top: 0 });
      })
      .catch((e) => {
        if (!ctl.signal.aborted) {
          console.warn(e);
          setState('error');
        }
      });
    return () => ctl.abort();
  }, [fetchPage, q, checked, attempt]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const r = await fetchPage(results.length, new AbortController().signal);
      setResults((prev) => [...prev, ...r.results.filter((x) => !prev.some((p) => p.id === x.id))]);
      setData((d) => (d ? { ...d, results: [...d.results, ...r.results] } : r));
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const points = useMemo(
    () => results.map((r) => ({ id: r.id, name: r.name, lat: r.lat, lon: r.lon })),
    [results],
  );
  const selectedResult = results.find((r) => r.id === selected) ?? null;
  const hasMore = data != null && data.results.length >= PAGE && results.length < 100;

  const selectFromMap = (id: string) => {
    setSelected(id);
    document.getElementById(`r-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  if (!q) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pt-4 md:pt-10">
        <SearchBox />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col md:grid md:grid-cols-[minmax(22rem,28rem)_1fr] md:overflow-hidden">
      {/* Results column */}
      <section
        aria-label="Results"
        className={cn('flex min-h-0 flex-col md:border-r', showMap && 'hidden md:flex')}
      >
        <div className="sticky top-0 z-30 space-y-3 bg-background/90 px-4 pt-3 pb-3 backdrop-blur-md md:static md:bg-transparent md:px-5 md:pt-5 md:backdrop-blur-none">
          <div className="flex items-center gap-2">
            <BackLink className="hover:bg-surface-2 md:hidden" />
            <SearchBox defaultValue={q} size="md" className="flex-1" />
          </div>
          {state === 'ready' && data ? (
            <Understood data={data} locStatus={locStatus} onLocate={ask} />
          ) : null}
        </div>

        <div className="flex-1 md:overflow-y-auto">
          {state === 'loading' ? <ResultsSkeleton /> : null}
          {state === 'error' ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <p className="font-medium">Couldn't load results</p>
              <Button variant="outline" onClick={() => setAttempt((a) => a + 1)}>
                <RotateCw />
                Try again
              </Button>
            </div>
          ) : null}
          {state === 'ready' && !results.length ? (
            <p className="px-4 py-16 text-center font-medium text-muted-foreground">
              No places found
            </p>
          ) : null}
          {state === 'ready' && results.length ? (
            <>
              <ol ref={listRef} className="divide-y pb-36 md:pb-6">
                {results.map((r, i) => (
                  <ResultRow
                    key={r.id}
                    r={r}
                    n={i + 1}
                    selected={r.id === selected}
                    onHover={() => setSelected(r.id)}
                  />
                ))}
              </ol>
              {hasMore ? (
                <div className="-mt-32 flex justify-center pb-36 md:mt-0 md:pb-8">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Loading…' : 'More results'}
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      {/* Map: beside the list on wide screens, a toggle on phones */}
      <section
        aria-label="Map"
        className={cn(
          'relative md:block md:h-[calc(100dvh-4rem)]',
          showMap
            ? 'fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30'
            : 'hidden',
        )}
      >
        {showMap || desktop ? (
          <PlaceMap
            points={points}
            user={location}
            selectedId={selected}
            onSelect={selectFromMap}
            className="size-full"
          />
        ) : null}
        {showMap && selectedResult ? (
          <div className="absolute inset-x-3 bottom-20 md:hidden">
            <ul className="overflow-hidden rounded-xl border bg-surface shadow-float">
              <ResultRow
                r={selectedResult}
                n={results.indexOf(selectedResult) + 1}
                selected={false}
              />
            </ul>
          </div>
        ) : null}
      </section>

      {state === 'ready' && results.length ? (
        <Button
          onClick={() => setShowMap((v) => !v)}
          className="-translate-x-1/2 fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-40 h-11 rounded-full px-5 shadow-float md:hidden"
        >
          {showMap ? <List /> : <MapIcon />}
          {showMap ? 'List' : 'Map'}
        </Button>
      ) : null}
    </div>
  );
}

/** Desktop shows the map from the start; phones load it only when asked. */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setDesktop(mq.matches);
    const on = () => setDesktop(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return desktop;
}

/** How the query was read: where it searched, other towns of that name, initials written out. */
function Understood({
  data,
  locStatus,
  onLocate,
}: {
  data: SearchResponse;
  locStatus: string;
  onLocate: () => void;
}) {
  const { meta, intent } = data;
  const chips: { key: string; label: string; href?: string }[] = [];
  if (meta.anchor?.place) chips.push({ key: 'anchor', label: `Near ${meta.anchor.place}` });
  else if (intent.area && meta.area)
    chips.push({ key: 'area', label: placeWhere(intent.area.name, meta.area.where) });
  for (const a of meta.aliases) chips.push({ key: `alias-${a.token}`, label: a.expansion });
  const others = meta.area?.others ?? [];

  return (
    <div className="space-y-2">
      {chips.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <li
              key={c.key}
              className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full bg-primary-soft px-2.5 font-medium text-primary-soft-foreground text-xs"
            >
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{c.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {others.length ? (
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <span className="shrink-0 text-muted-foreground">Did you mean</span>
          {others.map((o) => (
            <Link
              key={o.query}
              href={`/search?q=${encodeURIComponent(o.query)}`}
              className="inline-flex h-7 shrink-0 items-center rounded-full border bg-surface px-2.5 font-medium hover:border-primary hover:text-primary"
            >
              {placeWhere(o.name, o.where)}
            </Link>
          ))}
        </div>
      ) : null}
      {meta.needsLocation ? (
        <Button variant="soft" size="sm" onClick={onLocate} disabled={locStatus === 'asking'}>
          <LocateFixed />
          {locStatus === 'denied' ? 'Location blocked' : 'Use my location'}
        </Button>
      ) : null}
    </div>
  );
}

function ResultRow({
  r,
  n,
  selected,
  onHover,
}: {
  r: SearchResult;
  n: number;
  selected: boolean;
  onHover?: () => void;
}) {
  const distance = formatDistance(r.distanceM);
  return (
    <li id={`r-${r.id}`}>
      <Link
        href={`/place/${r.slug}`}
        onMouseEnter={onHover}
        onFocus={onHover}
        className={cn(
          'flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 md:px-5',
          selected && 'bg-surface-2',
        )}
      >
        <span
          className={cn(
            'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full font-semibold text-[11px]',
            selected
              ? 'bg-accent text-accent-foreground'
              : 'bg-primary-soft text-primary-soft-foreground',
          )}
        >
          {n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{r.name}</span>
          <span className="block truncate text-muted-foreground text-sm">
            {[r.categoryName, placeWhere(r.locality, r.district)].filter(Boolean).join(' · ')}
          </span>
        </span>
        {distance ? (
          <span className="shrink-0 pt-0.5 text-muted-foreground text-sm tabular-nums">
            {distance}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function ResultsSkeleton() {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 6 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders.
        <li key={i} className="flex gap-3 px-4 py-4 md:px-5">
          <span className="size-6 shrink-0 animate-pulse rounded-full bg-surface-2" />
          <span className="flex-1 space-y-2">
            <span className="block h-4 w-2/3 animate-pulse rounded bg-surface-2" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </span>
        </li>
      ))}
    </ul>
  );
}
