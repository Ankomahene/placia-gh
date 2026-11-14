import type { AreaKind } from './context';

/** A resolved place to search in or around. */
export interface AreaRef {
  kind: AreaKind;
  id: number;
  name: string;
  lat: number;
  lon: number;
  /**
   * 'in': the user named it as the place to search ("in Osu"): results are limited to it.
   * 'near': nearby is fine ("close to Legon"): limited to a wider radius.
   * 'soft': the name just appears in the query ("pharmacy kumasi"): used for ranking only, so a
   *   place whose own name contains a town ("Kumasi City Mall") is never filtered out.
   */
  relation: 'in' | 'near' | 'soft';
}

/** What the user is looking for, independent of which parser produced it. */
export interface Intent {
  /** Keywords to match against names, categories and addresses (normalised). May be empty. */
  text: string;
  /** Leaf category slugs. */
  categories: string[];
  area: AreaRef | null;
  /**
   * A location phrase the gazetteer did not fully explain, e.g. "accra mall" in
   * "pharmacy near accra mall". The engine tries to resolve it to a place and search around it.
   */
  anchor: string | null;
  nearMe: boolean;
  openNow: boolean;
  cheap: boolean;
}

export type ParsePath = 'ai' | 'rules';

export interface ParseResult {
  intent: Intent;
  path: ParsePath;
  latencyMs: number;
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  /** Why the AI parse was not used, when it was attempted. */
  fallback?: string;
  cached?: boolean;
}
