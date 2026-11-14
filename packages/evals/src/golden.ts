/**
 * Golden query set v1 (2026-11-14).
 *
 * Queries are written the way people in Ghana type them: local terms, missing punctuation,
 * misspellings, a place name doing the work of a whole address. Relevance is judged by
 * predicates, not place ids, so judgments survive re-ingests and stay honest when a better
 * duplicate wins:
 *
 * - `known`:  one specific place. Relevant = name matches `name` (and lies within `km` of `at`).
 *             Metrics: reciprocal rank, Hit@1, Hit@10.
 * - `browse`: any place of a kind in an area. Relevant = category in `categories` (groups expand to
 *             their leaves) or name matches `name`, and within `km` of `at`.
 *             Metrics: P@10, nDCG@10, Success@10.
 *
 * `parse` is what a correct parser should extract; it scores the parsers separately from ranking.
 * Labels were written before tuning the search, and a case is never edited to make it pass.
 * The only edits allowed are LABEL_FIXES: a name pattern that wrongly rejected the same real
 * place under another spelling. Each one is listed here and in docs/EVALS.md.
 */

export const LABEL_FIXES = [
  {
    id: 'k-ug',
    was: '^university of ghana$',
    why: '"University of Ghana, Legon" is the same campus',
  },
  { id: 'k-ug-typo', was: '^university of ghana$', why: 'same as k-ug' },
  { id: 'k-labadi-beach', was: '^labadi beach$', why: '"Labadi Beach,Accra" is the same beach' },
  {
    id: 'k-west-hills',
    was: 'west hills mall',
    why: '"West Hill Mall" is the same mall, misspelt in the data',
  },
  {
    id: 'k-achimota-mall',
    was: '^achimota mall$',
    why: 'the mall was renamed Achimota Retail Centre',
  },
  {
    id: 'x-k-tamale-mosque',
    was: 'tamale central mosque',
    why: 'the data names it "Central Mosque", in Tamale',
  },
  {
    id: 'x-k-palace-mall',
    was: 'palace mall',
    why: '"Palace Shopping Mall" is the same mall',
  },
] as const;

export type LatLon = readonly [number, number];

export interface ParseLabel {
  /** Acceptable leaf/group slugs: the parse is right if it found some and all are acceptable. */
  categories?: string[];
  /** Area or landmark name the query is about; null = none. Omitted = not scored. */
  area?: string | null;
  nearMe?: boolean;
  openNow?: boolean;
  cheap?: boolean;
}

export type Expect =
  | { kind: 'known'; name: string; at?: LatLon; km?: number }
  | { kind: 'browse'; categories: string[]; name?: string; at: LatLon; km: number };

export interface GoldenCase {
  id: string;
  q: string;
  tags: string[];
  /** Simulated user position, for "near me" queries. */
  user?: LatLon;
  expect: Expect;
  parse?: ParseLabel;
}

/** Reference points, rounded; radii in the cases reflect how big each area is. */
const AT = {
  accra: [5.56, -0.2],
  osu: [5.556, -0.182],
  labone: [5.565, -0.17],
  cantonments: [5.58, -0.17],
  airportResidential: [5.6, -0.18],
  eastLegon: [5.635, -0.155],
  legon: [5.65, -0.187],
  madina: [5.68, -0.166],
  adenta: [5.71, -0.16],
  achimota: [5.62, -0.225],
  kaneshie: [5.565, -0.235],
  circle: [5.57, -0.215],
  dansoman: [5.545, -0.27],
  spintex: [5.635, -0.12],
  teshie: [5.585, -0.1],
  tema: [5.67, -0.017],
  kasoa: [5.53, -0.42],
  abosseyOkai: [5.56, -0.228],
  lapaz: [5.61, -0.25],
  kumasi: [6.69, -1.62],
  adum: [6.69, -1.625],
  knust: [6.675, -1.57],
  bantama: [6.7, -1.64],
  tamale: [9.4, -0.84],
  capeCoast: [5.105, -1.25],
  takoradi: [4.9, -1.76],
  ho: [6.6, 0.47],
  koforidua: [6.09, -0.26],
  sunyani: [7.34, -2.33],
  bolgatanga: [10.79, -0.85],
  wa: [10.06, -2.5],
  techiman: [7.59, -1.94],
  winneba: [5.35, -0.62],
  hohoe: [7.15, 0.47],
  // Region centres, used with wide radii.
  ashantiRegion: [6.75, -1.5],
  voltaRegion: [6.6, 0.45],
  centralRegion: [5.5, -1.2],
  northernRegion: [9.5, -0.9],
} as const satisfies Record<string, LatLon>;

const known = (
  id: string,
  q: string,
  name: string,
  tags: string[],
  opts: { at?: LatLon; km?: number; parse?: ParseLabel; user?: LatLon } = {},
): GoldenCase => ({
  id,
  q,
  tags: ['known-item', ...tags],
  user: opts.user,
  expect: { kind: 'known', name, at: opts.at, km: opts.km },
  parse: opts.parse,
});

const browse = (
  id: string,
  q: string,
  categories: string[],
  at: LatLon,
  km: number,
  tags: string[],
  opts: { name?: string; parse?: ParseLabel; user?: LatLon } = {},
): GoldenCase => ({
  id,
  q,
  tags: ['browse', ...tags],
  user: opts.user,
  expect: { kind: 'browse', categories, name: opts.name, at, km },
  parse: opts.parse,
});

export const GOLDEN: GoldenCase[] = [
  // ---- Known items: landmarks people search by name -------------------------------------------
  known('k-korlebu-full', 'korle bu teaching hospital', 'korle.?bu teaching hospital', ['health']),
  known('k-korlebu-typo', 'korlebu', 'korle.?bu teaching hospital', ['health', 'typo']),
  known('k-korlebu-hosp', 'korlebu hospital', 'korle.?bu teaching hospital', ['health', 'typo']),
  known('k-kath', 'komfo anokye hospital', 'komfo anokye teaching hospital', ['health']),
  known('k-kath-abbr', 'KATH kumasi', 'komfo anokye teaching hospital|\\(kath\\)', [
    'health',
    'abbreviation',
  ]),
  known('k-37', '37 military hospital', '37 military hospital', ['health']),
  known('k-ridge', 'ridge hospital', '^ridge hospital', ['health'], { at: AT.accra, km: 10 }),
  known('k-tamale-th', 'tamale teaching hospital', 'tamale teaching hospital', ['health']),
  known('k-ho-th', 'ho teaching hospital', 'ho teaching hospital', ['health']),
  known('k-effia', 'effia nkwanta hospital', 'effia nkwanta regional hospital', ['health']),
  known('k-accra-mall', 'accra mall', '^accra mall$', ['shopping'], { at: AT.eastLegon, km: 5 }),
  known('k-accra-mall-typo', 'acra mall', '^accra mall$', ['shopping', 'typo'], {
    at: AT.eastLegon,
    km: 5,
  }),
  known('k-achimota-mall', 'achimota mal', '^achimota (mall|retail centre)$', ['shopping', 'typo']),
  known('k-west-hills', 'west hills mall', 'west hills? mall', ['shopping']),
  known('k-kcm', 'kumasi city mall', 'kumasi city mall', ['shopping']),
  known('k-marina', 'marina mall', '^marina mall', ['shopping']),
  known('k-junction', 'junction mall nungua', 'junction mall', ['shopping']),
  known('k-takoradi-mall', 'takoradi mall', 'takoradi mall', ['shopping']),
  known('k-makola', 'makola market', '^makola market', ['shopping']),
  known('k-makola-typo', 'makola markert', '^makola market', ['shopping', 'typo']),
  known('k-kejetia', 'kejetia market', '^kejetia( market)?$', ['shopping']),
  known('k-kantamanto', 'kantamanto', '^kantamanto( market)?$', ['shopping'], {
    at: AT.accra,
    km: 8,
  }),
  known('k-kaneshie-mkt', 'kaneshie market', 'kaneshie market', ['shopping']),
  known('k-kotoka', 'kotoka airport', 'kotoka', ['transport'], {
    at: AT.airportResidential,
    km: 6,
  }),
  known('k-kotoka-typo', 'kotoka airpot', 'kotoka', ['transport', 'typo'], {
    at: AT.airportResidential,
    km: 6,
  }),
  known('k-ug', 'university of ghana', '^university of ghana(, legon)?$', ['education']),
  known('k-ug-typo', 'univesity of ghana legon', '^university of ghana(, legon)?$', [
    'education',
    'typo',
  ]),
  known('k-knust', 'knust', 'kwame nkrumah university of science', ['education', 'abbreviation']),
  known('k-ucc', 'university of cape coast', '^university of cape coast( \\(ucc\\))?$', [
    'education',
  ]),
  known('k-ashesi', 'ashesi university', 'ashesi university', ['education']),
  known('k-gimpa', 'gimpa', 'gimpa', ['education', 'abbreviation'], { at: AT.accra, km: 20 }),
  known('k-labadi-beach', 'labadi beach', '^labadi beach(, ?accra)?$', ['leisure']),
  known('k-labadi-hotel', 'labadi beach hotel', '^labadi beach hotel$', ['stay']),
  known('k-kempinski', 'kempinski hotel', 'kempinski hotel', ['stay']),
  known('k-movenpick', 'movenpick accra', 'movenpick ambassador hotel', ['stay']),
  known('k-mausoleum', 'kwame nkrumah mausoleum', 'nkrumah (mausoleum|memorial park)', ['leisure']),
  known('k-memorial-park', 'nkrumah memorial park', 'nkrumah (mausoleum|memorial park)', [
    'leisure',
  ]),
  known('k-blackstar', 'black star square', 'black star square', ['leisure']),
  known('k-national-theatre', 'national theatre', '^national theatre', ['leisure'], {
    at: AT.accra,
    km: 8,
  }),
  known('k-national-museum', 'national museum accra', '^national museum', ['leisure']),
  known('k-osu-castle', 'osu castle', '^osu castle', ['leisure']),
  known('k-cc-castle', 'cape coast castle', '^cape coast castle$', ['leisure']),
  known('k-kakum', 'kakum national park', 'kakum national', ['leisure']),
  known('k-kakum-short', 'kakum', 'kakum national', ['leisure']),
  known('k-aburi', 'aburi gardens', 'aburi botanic', ['leisure']),
  known('k-mole', 'mole national park', 'mole national park', ['leisure']),
  known('k-boti', 'boti falls', 'boti ?(water)?falls', ['leisure']),
  known('k-shai', 'shai hills', 'shai hills( resource reserve)?$', ['leisure']),
  known('k-manhyia', 'manhyia palace', 'manhyia palace', ['leisure']),
  known('k-zoo', 'kumasi zoo', 'kumasi zoo', ['leisure']),
  known('k-stadium-accra', 'accra sports stadium', 'accra sports stadium', ['leisure']),
  known('k-baba-yara', 'baba yara stadium', 'baba yara', ['leisure']),
  known('k-national-mosque', 'national mosque kanda', 'national mosque', ['faith'], {
    at: AT.accra,
    km: 10,
  }),
  known('k-central-mosque', 'accra central mosque', 'accra central mosque', ['faith']),
  known('k-neoplan', 'neoplan station', '^neoplan( station)?$', ['transport'], {
    at: AT.circle,
    km: 4,
  }),
  known('k-circle-vip', 'circle vip station', 'circle vip', ['transport']),

  // ---- Browse: a kind of place in an area -----------------------------------------------------
  browse('b-pharm-madina', 'pharmacy in madina', ['pharmacy'], AT.madina, 4, ['health'], {
    parse: { categories: ['pharmacy'], area: 'Madina' },
  }),
  browse('b-pharm-osu', 'pharmacy near osu', ['pharmacy'], AT.osu, 3, ['health'], {
    parse: { categories: ['pharmacy'], area: 'Osu' },
  }),
  browse('b-chem-kasoa', 'chemical shop kasoa', ['pharmacy'], AT.kasoa, 6, ['health', 'slang'], {
    parse: { categories: ['pharmacy'], area: 'Kasoa' },
  }),
  browse('b-hosp-kumasi', 'hospital in kumasi', ['hospital', 'clinic'], AT.kumasi, 15, ['health'], {
    parse: { categories: ['hospital'], area: 'Kumasi' },
  }),
  browse('b-clinic-tema', 'clinic tema', ['clinic', 'hospital'], AT.tema, 8, ['health'], {
    parse: { categories: ['clinic'], area: 'Tema' },
  }),
  browse('b-lab-osu', 'lab test osu', ['lab'], AT.osu, 4, ['health'], {
    parse: { categories: ['lab'], area: 'Osu' },
  }),
  browse('b-dentist-accra', 'dentist accra', ['dentist'], AT.accra, 15, ['health'], {
    parse: { categories: ['dentist'], area: 'Accra' },
  }),
  browse(
    'b-chopbar-tamale',
    'chop bar in tamale',
    ['local-food'],
    AT.tamale,
    10,
    ['food', 'slang'],
    {
      name: 'chop ?bar',
      parse: { categories: ['local-food'], area: 'Tamale' },
    },
  ),
  browse('b-chopbar-adum', 'chop bar near adum', ['local-food'], AT.adum, 4, ['food', 'slang'], {
    name: 'chop ?bar',
    parse: { categories: ['local-food'], area: 'Adum' },
  }),
  browse(
    'b-rest-osu',
    'restaurants in osu',
    ['restaurant', 'local-food', 'fast-food', 'cafe'],
    AT.osu,
    3,
    ['food'],
    {
      parse: { categories: ['restaurant'], area: 'Osu' },
    },
  ),
  browse('b-waakye-osu', 'waakye osu', ['local-food'], AT.osu, 4, ['food', 'slang'], {
    name: 'waakye',
    parse: { categories: ['local-food'], area: 'Osu' },
  }),
  browse(
    'b-jollof-el',
    'jollof east legon',
    ['local-food', 'restaurant', 'fast-food'],
    AT.eastLegon,
    4,
    ['food', 'slang'],
    {
      name: 'jollof',
      parse: { categories: ['local-food', 'restaurant', 'fast-food'], area: 'East Legon' },
    },
  ),
  browse(
    'b-fufu-kumasi',
    'fufu joint kumasi',
    ['local-food', 'restaurant'],
    AT.kumasi,
    15,
    ['food', 'slang'],
    {
      name: 'fufu',
      parse: { categories: ['local-food'], area: 'Kumasi' },
    },
  ),
  browse(
    'b-pizza-el',
    'pizza in east legon',
    ['fast-food', 'restaurant'],
    AT.eastLegon,
    4,
    ['food'],
    {
      name: 'pizza',
      parse: { categories: ['fast-food'], area: 'East Legon' },
    },
  ),
  browse('b-kfc-circle', 'kfc near circle', ['fast-food'], AT.circle, 4, ['food', 'brand'], {
    name: 'kfc',
    parse: { categories: ['fast-food'], area: 'Circle' },
  }),
  browse(
    'b-cafe-airport',
    'cafe in airport residential',
    ['cafe'],
    AT.airportResidential,
    3,
    ['food'],
    {
      parse: { categories: ['cafe'], area: 'Airport Residential Area' },
    },
  ),
  browse('b-bakery-dansoman', 'bakery dansoman', ['bakery'], AT.dansoman, 4, ['food'], {
    parse: { categories: ['bakery'], area: 'Dansoman' },
  }),
  browse(
    'b-spot-el',
    'drinking spot east legon',
    ['bar', 'nightclub'],
    AT.eastLegon,
    4,
    ['food', 'slang'],
    {
      parse: { categories: ['bar'], area: 'East Legon' },
    },
  ),
  browse('b-club-osu', 'nightclub osu', ['nightclub', 'bar'], AT.osu, 3, ['leisure'], {
    parse: { categories: ['nightclub'], area: 'Osu' },
  }),
  browse('b-pub-kumasi', 'pub in kumasi', ['bar', 'nightclub'], AT.kumasi, 15, ['food'], {
    parse: { categories: ['bar'], area: 'Kumasi' },
  }),
  browse('b-hostel-legon', 'hostel close to legon', ['hostel'], AT.legon, 5, ['stay'], {
    parse: { categories: ['hostel'], area: 'Legon' },
  }),
  browse(
    'b-hostel-knust',
    'hostels near knust',
    ['hostel'],
    AT.knust,
    5,
    ['stay', 'abbreviation'],
    {
      parse: { categories: ['hostel'], area: 'KNUST' },
    },
  ),
  browse(
    'b-hotel-cc',
    'hotel in cape coast',
    ['hotel', 'guest-house'],
    AT.capeCoast,
    10,
    ['stay'],
    {
      parse: { categories: ['hotel'], area: 'Cape Coast' },
    },
  ),
  browse(
    'b-hotel-kaneshie',
    'cheap hotel around kaneshi',
    ['hotel', 'guest-house'],
    AT.kaneshie,
    5,
    ['stay', 'typo'],
    {
      parse: { categories: ['hotel'], area: 'Kaneshie', cheap: true },
    },
  ),
  browse('b-gh-ho', 'guest house ho', ['guest-house', 'hotel'], AT.ho, 8, ['stay'], {
    parse: { categories: ['guest-house'], area: 'Ho' },
  }),
  browse(
    'b-hotel-volta',
    'hotels in volta region',
    ['hotel', 'guest-house'],
    AT.voltaRegion,
    150,
    ['stay', 'region'],
    {
      parse: { categories: ['hotel'], area: 'Volta' },
    },
  ),
  browse(
    'b-atm-accramall',
    'atm near accra mall',
    ['atm', 'bank'],
    AT.eastLegon,
    4,
    ['money', 'landmark'],
    {
      parse: { categories: ['atm'], area: 'Accra Mall' },
    },
  ),
  browse('b-bank-takoradi', 'bank in takoradi', ['bank'], AT.takoradi, 10, ['money'], {
    parse: { categories: ['bank'], area: 'Takoradi' },
  }),
  browse('b-momo-madina', 'momo agent madina', ['mobile-money'], AT.madina, 4, ['money', 'slang'], {
    parse: { categories: ['mobile-money'], area: 'Madina' },
  }),
  browse('b-forex-osu', 'forex bureau osu', ['forex'], AT.osu, 4, ['money'], {
    parse: { categories: ['forex'], area: 'Osu' },
  }),
  browse('b-ecobank-kumasi', 'ecobank kumasi', ['bank', 'atm'], AT.kumasi, 15, ['money', 'brand'], {
    name: 'ecobank',
    parse: { categories: ['bank'], area: 'Kumasi' },
  }),
  browse('b-fuel-tema', 'fuel station tema', ['fuel'], AT.tema, 8, ['transport'], {
    parse: { categories: ['fuel'], area: 'Tema' },
  }),
  browse(
    'b-filling-kof',
    'filling station in koforidua',
    ['fuel'],
    AT.koforidua,
    8,
    ['transport'],
    {
      parse: { categories: ['fuel'], area: 'Koforidua' },
    },
  ),
  browse(
    'b-goil-accra',
    'goil filling station accra',
    ['fuel'],
    AT.accra,
    15,
    ['transport', 'brand'],
    {
      name: 'goil',
      parse: { categories: ['fuel'], area: 'Accra' },
    },
  ),
  browse(
    'b-trotro-circle',
    'trotro station circle',
    ['bus-station'],
    AT.circle,
    3,
    ['transport', 'slang'],
    {
      parse: { categories: ['bus-station'], area: 'Circle' },
    },
  ),
  browse(
    'b-lorry-kumasi',
    'lorry station kumasi',
    ['bus-station'],
    AT.kumasi,
    15,
    ['transport', 'slang'],
    {
      parse: { categories: ['bus-station'], area: 'Kumasi' },
    },
  ),
  browse('b-stc-tamale', 'stc tamale', ['bus-station'], AT.tamale, 10, ['transport', 'brand'], {
    name: 'stc|intercity',
    parse: { categories: ['bus-station'], area: 'Tamale' },
  }),
  browse(
    'b-mechanic-ao',
    'mechanic abossey okai',
    ['car-repair', 'auto-parts'],
    AT.abosseyOkai,
    3,
    ['transport', 'slang'],
    {
      parse: { categories: ['car-repair'], area: 'Abossey Okai' },
    },
  ),
  browse(
    'b-parts-ao',
    'spare parts at abossey okai',
    ['auto-parts', 'car-repair'],
    AT.abosseyOkai,
    3,
    ['shopping'],
    {
      parse: { categories: ['auto-parts'], area: 'Abossey Okai' },
    },
  ),
  browse(
    'b-washing-spintex',
    'washing bay spintex',
    ['car-repair'],
    AT.spintex,
    4,
    ['transport', 'slang'],
    {
      parse: { categories: ['car-repair'], area: 'Spintex' },
    },
  ),
  browse(
    'b-supermarket-el',
    'supermarket east legon',
    ['supermarket', 'mall', 'provisions'],
    AT.eastLegon,
    4,
    ['shopping'],
    {
      parse: { categories: ['supermarket'], area: 'East Legon' },
    },
  ),
  browse(
    'b-provisions-dansoman',
    'provision shop dansoman',
    ['provisions', 'supermarket', 'shop'],
    AT.dansoman,
    4,
    ['shopping', 'slang'],
    {
      parse: { categories: ['provisions'], area: 'Dansoman' },
    },
  ),
  browse('b-market-tamale', 'market in tamale', ['market'], AT.tamale, 10, ['shopping'], {
    parse: { categories: ['market'], area: 'Tamale' },
  }),
  browse('b-mall-kumasi', 'mall in kumasi', ['mall'], AT.kumasi, 15, ['shopping'], {
    parse: { categories: ['mall'], area: 'Kumasi' },
  }),
  browse(
    'b-phones-circle',
    'phone shop circle',
    ['phones-electronics', 'shop'],
    AT.circle,
    3,
    ['shopping'],
    {
      parse: { categories: ['phones-electronics'], area: 'Circle' },
    },
  ),
  browse(
    'b-melcom-accra',
    'melcom accra',
    ['supermarket', 'shop', 'mall', 'furniture', 'phones-electronics'],
    AT.accra,
    15,
    ['shopping', 'brand'],
    {
      name: 'melcom',
      parse: { categories: ['supermarket'], area: 'Accra' },
    },
  ),
  browse('b-hardware-kasoa', 'hardware shop kasoa', ['hardware'], AT.kasoa, 6, ['shopping'], {
    parse: { categories: ['hardware'], area: 'Kasoa' },
  }),
  browse('b-boutique-osu', 'boutique osu', ['fashion'], AT.osu, 3, ['shopping'], {
    parse: { categories: ['fashion'], area: 'Osu' },
  }),
  browse('b-tailor-tamale', 'tailor tamale', ['tailor', 'fashion'], AT.tamale, 10, ['services'], {
    parse: { categories: ['tailor'], area: 'Tamale' },
  }),
  browse('b-salon-el', 'salon in east legon', ['salon'], AT.eastLegon, 4, ['services'], {
    parse: { categories: ['salon'], area: 'East Legon' },
  }),
  browse('b-barber-osu', 'barbering shop osu', ['salon'], AT.osu, 3, ['services', 'slang'], {
    name: 'barb',
    parse: { categories: ['salon'], area: 'Osu' },
  }),
  browse('b-laundry-spintex', 'laundry spintex', ['laundry'], AT.spintex, 4, ['services'], {
    parse: { categories: ['laundry'], area: 'Spintex' },
  }),
  browse('b-printing-kumasi', 'printing press kumasi', ['printing'], AT.kumasi, 15, ['services'], {
    parse: { categories: ['printing'], area: 'Kumasi' },
  }),
  browse('b-church-tema', 'church in tema', ['church', 'worship'], AT.tema, 8, ['faith'], {
    parse: { categories: ['church'], area: 'Tema' },
  }),
  browse('b-mosque-tamale', 'mosque tamale', ['mosque'], AT.tamale, 10, ['faith'], {
    parse: { categories: ['mosque'], area: 'Tamale' },
  }),
  browse('b-police-madina', 'police station madina', ['police'], AT.madina, 5, ['public'], {
    parse: { categories: ['police'], area: 'Madina' },
  }),
  browse('b-post-kof', 'post office koforidua', ['post-office'], AT.koforidua, 8, ['public'], {
    parse: { categories: ['post-office'], area: 'Koforidua' },
  }),
  browse(
    'b-shs-cc',
    'shs in cape coast',
    ['shs'],
    AT.capeCoast,
    10,
    ['education', 'abbreviation'],
    {
      parse: { categories: ['shs'], area: 'Cape Coast' },
    },
  ),
  browse('b-school-ho', 'schools in ho', ['school', 'shs', 'creche'], AT.ho, 8, ['education'], {
    parse: { categories: ['school'], area: 'Ho' },
  }),
  browse('b-uni-kumasi', 'university in kumasi', ['university'], AT.kumasi, 20, ['education'], {
    parse: { categories: ['university'], area: 'Kumasi' },
  }),
  browse(
    'b-uni-central',
    'universities in central region',
    ['university'],
    AT.centralRegion,
    120,
    ['education', 'region'],
    {
      parse: { categories: ['university'], area: 'Central' },
    },
  ),
  browse('b-library-accra', 'library accra', ['library'], AT.accra, 15, ['education'], {
    parse: { categories: ['library'], area: 'Accra' },
  }),
  browse('b-creche-adenta', 'creche adenta', ['creche', 'school'], AT.adenta, 5, ['education'], {
    parse: { categories: ['creche'], area: 'Adenta' },
  }),
  browse('b-gym-el', 'gym east legon', ['sports'], AT.eastLegon, 4, ['leisure'], {
    parse: { categories: ['sports'], area: 'East Legon' },
  }),
  browse('b-cinema-accra', 'cinema in accra', ['entertainment'], AT.accra, 15, ['leisure'], {
    parse: { categories: ['entertainment'], area: 'Accra' },
  }),
  browse('b-beach-cc', 'beach near cape coast', ['beach'], AT.capeCoast, 20, ['leisure'], {
    parse: { categories: ['beach'], area: 'Cape Coast' },
  }),
  browse('b-beach-accra', 'beach in accra', ['beach'], AT.accra, 25, ['leisure'], {
    parse: { categories: ['beach'], area: 'Accra' },
  }),
  browse('b-park-kumasi', 'park kumasi', ['park'], AT.kumasi, 15, ['leisure'], {
    parse: { categories: ['park'], area: 'Kumasi' },
  }),
  browse(
    'b-sites-volta',
    'tourist sites in volta region',
    ['attraction', 'park', 'beach'],
    AT.voltaRegion,
    150,
    ['leisure', 'region'],
    {
      parse: { categories: ['attraction'], area: 'Volta' },
    },
  ),
  browse(
    'b-hosp-ashanti',
    'hospital in ashanti region',
    ['hospital'],
    AT.ashantiRegion,
    120,
    ['health', 'region'],
    {
      parse: { categories: ['hospital'], area: 'Ashanti' },
    },
  ),
  browse('b-hotel-sunyani', 'hotel sunyani', ['hotel', 'guest-house'], AT.sunyani, 10, ['stay'], {
    parse: { categories: ['hotel'], area: 'Sunyani' },
  }),
  browse(
    'b-rest-bolga',
    'restaurant bolgatanga',
    ['restaurant', 'local-food', 'fast-food'],
    AT.bolgatanga,
    10,
    ['food'],
    {
      parse: { categories: ['restaurant'], area: 'Bolgatanga' },
    },
  ),
  browse('b-pharm-wa', 'pharmacy wa', ['pharmacy'], AT.wa, 10, ['health'], {
    parse: { categories: ['pharmacy'], area: 'Wa' },
  }),
  browse('b-market-techiman', 'techiman market', ['market'], AT.techiman, 8, ['shopping'], {
    parse: { categories: ['market'], area: 'Techiman' },
  }),
  browse('b-hotel-winneba', 'hotel in winneba', ['hotel', 'guest-house'], AT.winneba, 8, ['stay'], {
    parse: { categories: ['hotel'], area: 'Winneba' },
  }),
  browse('b-hosp-hohoe', 'hospital hohoe', ['hospital', 'clinic'], AT.hohoe, 8, ['health'], {
    parse: { categories: ['hospital'], area: 'Hohoe' },
  }),

  // ---- Near me: the user's position is the area ----------------------------------------------
  browse('n-pharm-osu', 'nearest pharmacy', ['pharmacy'], AT.osu, 3, ['near-me', 'health'], {
    user: AT.osu,
    parse: { categories: ['pharmacy'], area: null, nearMe: true },
  }),
  browse('n-atm-adum', 'atm near me', ['atm', 'bank'], AT.adum, 3, ['near-me', 'money'], {
    user: AT.adum,
    parse: { categories: ['atm'], area: null, nearMe: true },
  }),
  browse(
    'n-fuel-tamale',
    'fuel station near me',
    ['fuel'],
    AT.tamale,
    5,
    ['near-me', 'transport'],
    {
      user: AT.tamale,
      parse: { categories: ['fuel'], area: null, nearMe: true },
    },
  ),
  browse('n-food-el', 'food near me', ['food-drink'], AT.eastLegon, 3, ['near-me', 'food'], {
    user: AT.eastLegon,
    parse: { categories: ['food-drink'], area: null, nearMe: true },
  }),
  browse(
    'n-hosp-cc',
    'hospital nearby',
    ['hospital', 'clinic'],
    AT.capeCoast,
    6,
    ['near-me', 'health'],
    {
      user: AT.capeCoast,
      parse: { categories: ['hospital'], area: null, nearMe: true },
    },
  ),
  browse(
    'n-chopbar-madina',
    'chop bar close by',
    ['local-food'],
    AT.madina,
    3,
    ['near-me', 'food', 'slang'],
    {
      user: AT.madina,
      parse: { categories: ['local-food'], area: null, nearMe: true },
    },
  ),
  browse(
    'n-pharm-open',
    'pharmacy open now near me',
    ['pharmacy'],
    AT.labone,
    3,
    ['near-me', 'health', 'open-now'],
    {
      user: AT.labone,
      parse: { categories: ['pharmacy'], area: null, nearMe: true, openNow: true },
    },
  ),
  browse(
    'n-bar-open',
    'bar near me open late',
    ['bar', 'nightclub'],
    AT.osu,
    3,
    ['near-me', 'food', 'open-now'],
    {
      user: AT.osu,
      parse: { categories: ['bar'], area: null, nearMe: true, openNow: true },
    },
  ),
  browse(
    'n-momo-kumasi',
    'momo vendor around me',
    ['mobile-money'],
    AT.bantama,
    3,
    ['near-me', 'money', 'slang'],
    {
      user: AT.bantama,
      parse: { categories: ['mobile-money'], area: null, nearMe: true },
    },
  ),
  browse(
    'n-church-tema',
    'church nearby',
    ['church', 'worship'],
    AT.tema,
    3,
    ['near-me', 'faith'],
    {
      user: AT.tema,
      parse: { categories: ['church'], area: null, nearMe: true },
    },
  ),
  browse('n-plain-user', 'pharmacy', ['pharmacy'], AT.kumasi, 6, ['implicit-near', 'health'], {
    user: AT.kumasi,
    parse: { categories: ['pharmacy'], area: null },
  }),
  browse('n-hostel-user', 'hostel', ['hostel'], AT.knust, 5, ['implicit-near', 'stay'], {
    user: AT.knust,
    parse: { categories: ['hostel'], area: null },
  }),

  // ---- Descriptive: needs understanding, not keywords (expected weak without AI/embeddings) ---
  browse(
    'd-work-wifi',
    'somewhere quiet to work with wifi in osu',
    ['cafe', 'internet', 'library', 'hotel'],
    AT.osu,
    4,
    ['descriptive'],
    {
      parse: { categories: ['cafe', 'internet', 'library'], area: 'Osu' },
    },
  ),
  browse(
    'd-football',
    'where can i watch football in kumasi',
    ['bar', 'sports', 'entertainment', 'nightclub'],
    AT.kumasi,
    15,
    ['descriptive'],
    {
      parse: { categories: ['bar', 'sports', 'entertainment'], area: 'Kumasi' },
    },
  ),
  browse('d-cement', 'where to buy cement in kasoa', ['hardware'], AT.kasoa, 6, ['descriptive'], {
    parse: { categories: ['hardware'], area: 'Kasoa' },
  }),
  browse(
    'd-fix-phone',
    'where to fix my phone at circle',
    ['repairs', 'phones-electronics'],
    AT.circle,
    3,
    ['descriptive'],
    {
      parse: { categories: ['repairs', 'phones-electronics'], area: 'Circle' },
    },
  ),
  browse(
    'd-send-money',
    'where can i send money in madina',
    ['mobile-money', 'bank', 'finance'],
    AT.madina,
    4,
    ['descriptive', 'money'],
    {
      parse: { categories: ['mobile-money', 'bank'], area: 'Madina' },
    },
  ),
  browse(
    'd-doctor-tema',
    'i need to see a doctor in tema',
    ['hospital', 'clinic'],
    AT.tema,
    8,
    ['descriptive', 'health'],
    {
      parse: { categories: ['hospital', 'clinic'], area: 'Tema' },
    },
  ),
  browse(
    'd-hair',
    'where to get my hair done in east legon',
    ['salon'],
    AT.eastLegon,
    4,
    ['descriptive'],
    {
      parse: { categories: ['salon'], area: 'East Legon' },
    },
  ),
  browse(
    'd-swim',
    'somewhere to swim in accra',
    ['sports', 'beach', 'hotel'],
    AT.accra,
    20,
    ['descriptive', 'leisure'],
    {
      parse: { categories: ['sports', 'beach'], area: 'Accra' },
    },
  ),
  browse(
    'd-kids',
    'where can i take my kids on weekend in accra',
    ['park', 'attraction', 'entertainment', 'beach'],
    AT.accra,
    20,
    ['descriptive', 'leisure'],
    {
      parse: { categories: ['park', 'attraction', 'entertainment'], area: 'Accra' },
    },
  ),
  browse(
    'd-sleep-tamale',
    'place to sleep in tamale',
    ['hotel', 'guest-house', 'hostel'],
    AT.tamale,
    10,
    ['descriptive', 'stay'],
    {
      parse: { categories: ['hotel', 'guest-house', 'hostel'], area: 'Tamale' },
    },
  ),
  browse(
    'd-fabric',
    'where to buy kente in kumasi',
    ['fashion', 'market'],
    AT.kumasi,
    30,
    ['descriptive', 'shopping'],
    {
      parse: { categories: ['fashion', 'market'], area: 'Kumasi' },
    },
  ),
  browse('d-drive', 'learn to drive in accra', ['driving-school'], AT.accra, 20, ['descriptive'], {
    parse: { categories: ['driving-school'], area: 'Accra' },
  }),
  browse(
    'd-ghana-card',
    'where to register ghana card in ho',
    ['government'],
    AT.ho,
    10,
    ['descriptive', 'public'],
    {
      parse: { categories: ['government'], area: 'Ho' },
    },
  ),
  browse(
    'd-eat-cheap',
    'cheap place to eat around legon',
    ['food-drink'],
    AT.legon,
    4,
    ['descriptive', 'food'],
    {
      parse: { categories: ['food-drink'], area: 'Legon', cheap: true },
    },
  ),
];

/**
 * Held-out set, written 2026-11-14 after tuning on GOLDEN was finished. It is run, never tuned
 * against: its score is the honest estimate of how search does on queries it has not seen.
 * Different towns and phrasings on purpose. Landmark existence was checked before labelling.
 */
export const HOLDOUT: GoldenCase[] = [
  known('h-lapalm', 'la palm beach hotel', 'la.?palm (royal )?beach', ['stay']),
  known('h-uew', 'university of education winneba', 'university of education,? ?winneba$', [
    'education',
  ]),
  known('h-cctu', 'cape coast technical university', '^cape coast technical university$', [
    'education',
  ]),
  known('h-tradefair', 'trade fair centre', 'trade fair cent', ['leisure'], {
    at: AT.accra,
    km: 15,
  }),
  known('h-wtc', 'world trade centre accra', 'world trade cent(er|re)', ['leisure']),
  known('h-volta-hosp', 'volta regional hospital', 'volta regional hospital', ['health']),
  known('h-tamale-airport', 'tamale airport', '^tamale airport', ['transport']),
  known('h-kumasi-airport', 'kumasi airport', '^kumasi airport$', ['transport']),
  known('h-akosombo', 'akosombo dam', 'akosombo dam', ['leisure']),
  known('h-jubilee', 'jubilee house', '^jubilee house$', ['public']),
  known('h-aicc', 'accra international conference centre', 'accra international conference', [
    'leisure',
  ]),
  known('h-achimota-sch', 'achimota school', '^achimota school$', ['education']),
  known('h-wesley', 'wesley girls cape coast', '^wesley girls', ['education'], {
    at: AT.capeCoast,
    km: 10,
  }),
  known('h-prempeh', 'prempeh college', '^prempeh college$', ['education']),
  known('h-mfantsipim', 'mfantsipim', '^mfantsipim school$', ['education']),
  known('h-kotoka-sheraton', 'four points sheraton airport', 'four points', ['stay']),
  browse('h-pharm-tamale', 'pharmacy in tamale', ['pharmacy'], AT.tamale, 10, ['health'], {
    parse: { categories: ['pharmacy'], area: 'Tamale' },
  }),
  browse('h-atm-ho', 'atm in ho', ['atm', 'bank'], AT.ho, 8, ['money'], {
    parse: { categories: ['atm'], area: 'Ho' },
  }),
  browse(
    'h-rest-takoradi',
    'restaurant takoradi',
    ['restaurant', 'local-food', 'fast-food'],
    AT.takoradi,
    10,
    ['food'],
    {
      parse: { categories: ['restaurant'], area: 'Takoradi' },
    },
  ),
  browse(
    'h-hotel-airport',
    'hotel near kotoka airport',
    ['hotel', 'guest-house'],
    AT.airportResidential,
    4,
    ['stay', 'landmark'],
    {
      parse: { categories: ['hotel'], area: 'Kotoka' },
    },
  ),
  browse('h-bank-kof', 'bank koforidua', ['bank'], AT.koforidua, 8, ['money'], {
    parse: { categories: ['bank'], area: 'Koforidua' },
  }),
  browse('h-fuel-kasoa', 'filling station kasoa', ['fuel'], AT.kasoa, 6, ['transport'], {
    parse: { categories: ['fuel'], area: 'Kasoa' },
  }),
  browse('h-market-kumasi', 'market in kumasi', ['market'], AT.kumasi, 15, ['shopping'], {
    parse: { categories: ['market'], area: 'Kumasi' },
  }),
  browse('h-hosp-tema', 'hospital in tema', ['hospital', 'clinic'], AT.tema, 8, ['health'], {
    parse: { categories: ['hospital'], area: 'Tema' },
  }),
  browse('h-gh-kumasi', 'guest house kumasi', ['guest-house', 'hotel'], AT.kumasi, 15, ['stay'], {
    parse: { categories: ['guest-house'], area: 'Kumasi' },
  }),
  browse(
    'h-super-spintex',
    'supermarket spintex',
    ['supermarket', 'mall', 'provisions'],
    AT.spintex,
    5,
    ['shopping'],
    {
      parse: { categories: ['supermarket'], area: 'Spintex' },
    },
  ),
  browse('h-church-kumasi', 'churches in kumasi', ['church', 'worship'], AT.kumasi, 15, ['faith'], {
    parse: { categories: ['church'], area: 'Kumasi' },
  }),
  browse('h-mosque-accra', 'mosque accra', ['mosque'], AT.accra, 15, ['faith'], {
    parse: { categories: ['mosque'], area: 'Accra' },
  }),
  browse(
    'h-bar-tamale',
    'drinking bar tamale',
    ['bar', 'nightclub'],
    AT.tamale,
    10,
    ['food', 'slang'],
    {
      parse: { categories: ['bar'], area: 'Tamale' },
    },
  ),
  browse('h-salon-madina', 'hair salon madina', ['salon'], AT.madina, 4, ['services'], {
    parse: { categories: ['salon'], area: 'Madina' },
  }),
  browse(
    'h-school-kasoa',
    'school in kasoa',
    ['school', 'shs', 'creche'],
    AT.kasoa,
    6,
    ['education'],
    {
      parse: { categories: ['school'], area: 'Kasoa' },
    },
  ),
  browse('h-ff-kumasi', 'fast food kumasi', ['fast-food', 'restaurant'], AT.kumasi, 15, ['food'], {
    parse: { categories: ['fast-food'], area: 'Kumasi' },
  }),
  browse(
    'h-clinic-me',
    'clinic near me',
    ['clinic', 'hospital'],
    AT.tamale,
    5,
    ['near-me', 'health'],
    {
      user: AT.tamale,
      parse: { categories: ['clinic'], area: null, nearMe: true },
    },
  ),
  browse('h-atm-me', 'nearest atm', ['atm', 'bank'], AT.capeCoast, 4, ['near-me', 'money'], {
    user: AT.capeCoast,
    parse: { categories: ['atm'], area: null, nearMe: true },
  }),
  browse(
    'h-hostel-ucc',
    'hostel near ucc',
    ['hostel'],
    [5.115, -1.29],
    4,
    ['stay', 'abbreviation', 'landmark'],
    {
      parse: { categories: ['hostel'], area: 'UCC' },
    },
  ),
  browse('h-pharm-achimota', 'pharmacy around achimota', ['pharmacy'], AT.achimota, 4, ['health'], {
    parse: { categories: ['pharmacy'], area: 'Achimota' },
  }),
  browse('h-bakery-tema', 'bakery tema', ['bakery'], AT.tema, 8, ['food'], {
    parse: { categories: ['bakery'], area: 'Tema' },
  }),
  browse('h-carwash-el', 'car wash east legon', ['car-repair'], AT.eastLegon, 4, ['transport'], {
    parse: { categories: ['car-repair'], area: 'East Legon' },
  }),
  browse('h-police-kumasi', 'police station in kumasi', ['police'], AT.kumasi, 15, ['public'], {
    parse: { categories: ['police'], area: 'Kumasi' },
  }),
  browse('h-post-ho', 'post office ho', ['post-office'], AT.ho, 8, ['public'], {
    parse: { categories: ['post-office'], area: 'Ho' },
  }),
];

/**
 * Held-out set v2 (2026-11-14), written before the pure-browse weights were chosen and never
 * looked at while choosing them. It judges that change and the meaning (embedding) arm.
 * Towns not used in the dev set; weighted toward pure category queries, descriptive requests
 * and known items, the three kinds the change can move.
 */
const V2 = {
  ashaiman: [5.69, -0.03],
  elmina: [5.085, -1.35],
  nungua: [5.6, -0.08],
  obuasi: [6.2, -1.67],
  nkawkaw: [6.55, -0.77],
  dodowa: [5.88, -0.1],
  keta: [5.92, 0.99],
  dome: [5.65, -0.23],
  ejisu: [6.72, -1.47],
  tarkwa: [5.3, -1.99],
  weija: [5.56, -0.33],
  haatso: [5.68, -0.2],
  yendi: [9.44, -0.01],
  aflao: [6.12, 1.19],
  dzorwulu: [5.61, -0.2],
  suame: [6.72, -1.63],
  asokwa: [6.67, -1.61],
} as const satisfies Record<string, LatLon>;

const pb = (
  id: string,
  q: string,
  categories: string[],
  at: LatLon,
  km: number,
  area: string,
  tags: string[] = [],
) =>
  browse(id, q, categories, at, km, ['pure-browse', ...tags], {
    parse: { categories: [categories[0] as string], area },
  });

export const HOLDOUT_V2: GoldenCase[] = [
  // Pure category queries.
  pb('v-pharm-ashaiman', 'pharmacy ashaiman', ['pharmacy'], V2.ashaiman, 4, 'Ashaiman', ['health']),
  pb('v-hotel-elmina', 'hotels in elmina', ['hotel', 'guest-house'], V2.elmina, 5, 'Elmina', [
    'stay',
  ]),
  pb('v-chopbar-nungua', 'chop bar nungua', ['local-food', 'restaurant'], V2.nungua, 4, 'Nungua', [
    'food',
    'slang',
  ]),
  pb('v-bank-obuasi', 'bank in obuasi', ['bank'], V2.obuasi, 6, 'Obuasi', ['money']),
  pb('v-fuel-nkawkaw', 'fuel station nkawkaw', ['fuel'], V2.nkawkaw, 6, 'Nkawkaw', ['transport']),
  pb('v-school-dodowa', 'school dodowa', ['school', 'shs', 'creche'], V2.dodowa, 5, 'Dodowa', [
    'education',
  ]),
  pb('v-church-ashaiman', 'church ashaiman', ['church', 'worship'], V2.ashaiman, 4, 'Ashaiman', [
    'faith',
  ]),
  pb('v-market-keta', 'market keta', ['market'], V2.keta, 6, 'Keta', ['shopping']),
  pb('v-clinic-dome', 'clinic in dome', ['clinic', 'hospital'], V2.dome, 3, 'Dome', ['health']),
  pb(
    'v-rest-labone',
    'restaurant labone',
    ['restaurant', 'local-food', 'fast-food', 'cafe'],
    AT.labone,
    2.5,
    'Labone',
    ['food'],
  ),
  pb('v-gym-tema', 'gym in tema', ['sports'], AT.tema, 8, 'Tema', ['leisure']),
  pb('v-salon-ejisu', 'salon ejisu', ['salon'], V2.ejisu, 5, 'Ejisu', ['services']),
  pb('v-police-tarkwa', 'police tarkwa', ['police'], V2.tarkwa, 6, 'Tarkwa', ['public']),
  pb('v-atm-weija', 'atm weija', ['atm', 'bank'], V2.weija, 4, 'Weija', ['money']),
  pb(
    'v-prov-haatso',
    'provision shop haatso',
    ['provisions', 'supermarket', 'shop'],
    V2.haatso,
    3,
    'Haatso',
    ['shopping', 'slang'],
  ),
  pb('v-hosp-yendi', 'hospital yendi', ['hospital', 'clinic'], V2.yendi, 6, 'Yendi', ['health']),
  pb('v-gh-aflao', 'guest house aflao', ['guest-house', 'hotel'], V2.aflao, 5, 'Aflao', ['stay']),
  pb('v-bar-dzorwulu', 'drinking spot dzorwulu', ['bar', 'nightclub'], V2.dzorwulu, 3, 'Dzorwulu', [
    'food',
    'slang',
  ]),
  pb('v-print-suame', 'printing shop suame', ['printing'], V2.suame, 4, 'Suame', ['services']),
  pb('v-fitter-suame', 'fitting shop suame', ['car-repair', 'auto-parts'], V2.suame, 4, 'Suame', [
    'transport',
    'slang',
  ]),
  browse(
    'v-fuel-me',
    'filling station near me',
    ['fuel'],
    V2.ejisu,
    5,
    ['near-me', 'pure-browse'],
    {
      user: V2.ejisu,
      parse: { categories: ['fuel'], area: null, nearMe: true },
    },
  ),
  browse(
    'v-chem-me',
    'chemist close to me',
    ['pharmacy'],
    V2.asokwa,
    4,
    ['near-me', 'pure-browse'],
    {
      user: V2.asokwa,
      parse: { categories: ['pharmacy'], area: null, nearMe: true },
    },
  ),

  // Known items.
  known(
    'v-k-uhas',
    'university of health and allied sciences',
    'university of health and allied sciences',
    ['education'],
  ),
  known('v-k-elmina-castle', 'elmina castle', 'elmina castle|st\\.? george', ['leisure']),
  known('v-k-elmina-typo', 'elmina castel', 'elmina castle|st\\.? george', ['leisure', 'typo']),
  known('v-k-legon-hosp', 'legon hospital', 'legon hospital|university hospital', ['health']),
  known('v-k-lekma', 'lekma hospital', 'lekma', ['health']),
  known('v-k-tema-gh', 'tema general hospital', 'tema general hospital', ['health']),
  known('v-k-tema-gh-typo', 'tema genral hospital', 'tema general hospital', ['health', 'typo']),
  known('v-k-atu', 'accra technical university', '^accra technical university', ['education']),
  known('v-k-aliu', 'aliu mahama stadium', 'aliu mahama', ['leisure']),
  known('v-k-wli', 'wli waterfalls', '\\bwli\\b', ['leisure']),
  known('v-k-paga', 'paga crocodile pond', 'paga crocodile', ['leisure']),
  known('v-k-cc-hosp', 'cape coast teaching hospital', 'cape coast teaching hospital', ['health']),
  known('v-k-peduase', 'peduase lodge', 'peduase', ['stay']),
  known('v-k-tulip-kumasi', 'golden tulip kumasi', 'golden tulip', ['stay'], {
    at: AT.kumasi,
    km: 15,
  }),

  // Descriptive requests.
  browse(
    'v-d-photocopy',
    'where can i photocopy documents in madina',
    ['printing'],
    AT.madina,
    4,
    ['descriptive', 'services'],
    {
      parse: { categories: ['printing'], area: 'Madina' },
    },
  ),
  browse(
    'v-d-fix-car',
    'someone to fix my car in suame',
    ['car-repair', 'auto-parts'],
    V2.suame,
    4,
    ['descriptive', 'transport'],
    {
      parse: { categories: ['car-repair'], area: 'Suame' },
    },
  ),
  browse(
    'v-d-cash',
    'where can i withdraw money in tarkwa',
    ['atm', 'bank', 'mobile-money'],
    V2.tarkwa,
    6,
    ['descriptive', 'money'],
    {
      parse: { categories: ['atm', 'bank', 'mobile-money'], area: 'Tarkwa' },
    },
  ),
  browse(
    'v-d-sew',
    'where to sew a dress in ho',
    ['tailor', 'fashion'],
    AT.ho,
    8,
    ['descriptive', 'services'],
    {
      parse: { categories: ['tailor'], area: 'Ho' },
    },
  ),
  browse(
    'v-d-pray',
    'place to pray in tamale',
    ['church', 'mosque', 'worship'],
    AT.tamale,
    10,
    ['descriptive', 'faith'],
    {
      parse: { categories: ['church', 'mosque', 'worship'], area: 'Tamale' },
    },
  ),
  browse(
    'v-d-sea',
    'where to relax by the sea in elmina',
    ['beach', 'hotel'],
    V2.elmina,
    6,
    ['descriptive', 'leisure'],
    {
      parse: { categories: ['beach', 'hotel'], area: 'Elmina' },
    },
  ),
  browse(
    'v-d-veg',
    'buy fresh vegetables in ashaiman',
    ['market', 'provisions', 'supermarket'],
    V2.ashaiman,
    4,
    ['descriptive', 'shopping'],
    {
      parse: { categories: ['market', 'provisions', 'supermarket'], area: 'Ashaiman' },
    },
  ),
  browse(
    'v-d-sick',
    'my child is sick need a doctor in dome',
    ['clinic', 'hospital', 'healthcare'],
    V2.dome,
    4,
    ['descriptive', 'health'],
    {
      parse: { categories: ['clinic', 'hospital', 'healthcare'], area: 'Dome' },
    },
  ),
];

/**
 * Held-out set v3 (2026-11-14), written before the selective-AI rule was designed and never
 * looked at while designing it. It judges when to call the AI parse. The mix is closer to real
 * traffic than v2: plain category queries, named places, local terms and plain-English requests.
 */
const V3 = {
  berekum: [7.45, -2.58],
  akimOda: [5.93, -0.98],
  swedru: [5.53, -0.7],
  somanya: [6.1, -0.01],
  saltpond: [5.21, -1.06],
  kwadaso: [6.69, -1.66],
  amasaman: [5.7, -0.3],
  navrongo: [10.89, -1.09],
  tesano: [5.6, -0.23],
  bawku: [11.06, -0.24],
  konongo: [6.62, -1.21],
  abelemkpe: [5.6, -0.21],
  adabraka: [5.56, -0.21],
  kintampo: [8.05, -1.73],
  ahodwo: [6.66, -1.63],
  kwabenya: [5.7, -0.24],
  mankessim: [5.27, -1.02],
  akropong: [5.97, -0.09],
  pokuase: [5.7, -0.28],
  prampram: [5.71, 0.11],
  kpando: [6.99, 0.29],
  tarkwa: [5.3, -1.99],
  sunyani: [7.34, -2.33],
} as const satisfies Record<string, LatLon>;

const b3 = (
  id: string,
  q: string,
  categories: string[],
  at: LatLon,
  km: number,
  area: string | null,
  tags: string[],
  extra: { user?: LatLon; nearMe?: boolean } = {},
) =>
  browse(id, q, categories, at, km, tags, {
    user: extra.user,
    parse: { categories, area, ...(extra.nearMe ? { nearMe: true } : {}) },
  });

export const HOLDOUT_V3: GoldenCase[] = [
  // Plain category queries.
  b3('w-hosp-berekum', 'hospital in berekum', ['hospital', 'clinic'], V3.berekum, 6, 'Berekum', [
    'pure-browse',
    'health',
  ]),
  b3('w-hotel-oda', 'hotel akim oda', ['hotel', 'guest-house'], V3.akimOda, 6, 'Akim Oda', [
    'pure-browse',
    'stay',
  ]),
  b3('w-bank-swedru', 'bank swedru', ['bank'], V3.swedru, 6, 'Swedru', ['pure-browse', 'money']),
  b3('w-pharm-somanya', 'pharmacy in somanya', ['pharmacy'], V3.somanya, 5, 'Somanya', [
    'pure-browse',
    'health',
  ]),
  b3('w-fuel-saltpond', 'fuel station saltpond', ['fuel'], V3.saltpond, 6, 'Saltpond', [
    'pure-browse',
    'transport',
  ]),
  b3('w-church-kwadaso', 'church kwadaso', ['church', 'worship'], V3.kwadaso, 3, 'Kwadaso', [
    'pure-browse',
    'faith',
  ]),
  b3(
    'w-school-amasaman',
    'school in amasaman',
    ['school', 'shs', 'creche'],
    V3.amasaman,
    4,
    'Amasaman',
    ['pure-browse', 'education'],
  ),
  b3('w-atm-navrongo', 'atm in navrongo', ['atm', 'bank'], V3.navrongo, 6, 'Navrongo', [
    'pure-browse',
    'money',
  ]),
  b3(
    'w-rest-tesano',
    'restaurant tesano',
    ['restaurant', 'local-food', 'fast-food', 'cafe'],
    V3.tesano,
    3,
    'Tesano',
    ['pure-browse', 'food'],
  ),
  b3('w-police-bawku', 'police station bawku', ['police'], V3.bawku, 6, 'Bawku', [
    'pure-browse',
    'public',
  ]),
  b3('w-market-konongo', 'market konongo', ['market'], V3.konongo, 6, 'Konongo', [
    'pure-browse',
    'shopping',
  ]),
  b3(
    'w-super-abelemkpe',
    'supermarket abelemkpe',
    ['supermarket', 'provisions', 'mall'],
    V3.abelemkpe,
    3,
    'Abelemkpe',
    ['pure-browse', 'shopping'],
  ),

  // Local terms.
  b3(
    'w-kenkey-prampram',
    'kenkey seller in prampram',
    ['local-food', 'restaurant'],
    V3.prampram,
    5,
    'Prampram',
    ['slang', 'food'],
  ),
  b3('w-trotro-kpando', 'trotro station kpando', ['bus-station'], V3.kpando, 5, 'Kpando', [
    'slang',
    'transport',
  ]),
  b3('w-momo-berekum', 'mobile money vendor berekum', ['mobile-money'], V3.berekum, 6, 'Berekum', [
    'slang',
    'money',
  ]),
  b3('w-chem-konongo', 'chemist shop konongo', ['pharmacy'], V3.konongo, 6, 'Konongo', [
    'slang',
    'health',
  ]),
  b3(
    'w-prov-bawku',
    'provisions store bawku',
    ['provisions', 'supermarket', 'shop'],
    V3.bawku,
    6,
    'Bawku',
    ['slang', 'shopping'],
  ),

  // Plain-English requests.
  b3(
    'w-d-charger',
    'where can i buy a phone charger in adabraka',
    ['phones-electronics', 'shop'],
    V3.adabraka,
    3,
    'Adabraka',
    ['descriptive', 'shopping'],
  ),
  b3(
    'w-d-send-money',
    'i want to send money home from navrongo',
    ['mobile-money', 'bank'],
    V3.navrongo,
    6,
    'Navrongo',
    ['descriptive', 'money'],
  ),
  b3('w-d-medicine', 'where to buy medicine in tesano', ['pharmacy'], V3.tesano, 3, 'Tesano', [
    'descriptive',
    'health',
  ]),
  b3(
    'w-d-room',
    'need a room for tonight in kintampo',
    ['hotel', 'guest-house', 'hostel'],
    V3.kintampo,
    6,
    'Kintampo',
    ['descriptive', 'stay'],
  ),
  b3(
    'w-d-jollof',
    'good spot for jollof in ahodwo',
    ['restaurant', 'local-food', 'fast-food'],
    V3.ahodwo,
    3,
    'Ahodwo',
    ['descriptive', 'food'],
  ),
  b3(
    'w-d-party',
    'where do people go to party in kumasi',
    ['nightclub', 'bar'],
    AT.kumasi,
    15,
    'Kumasi',
    ['descriptive', 'food'],
  ),
  b3(
    'w-d-laptop',
    'place to fix my laptop in kwabenya',
    ['repairs', 'phones-electronics'],
    V3.kwabenya,
    4,
    'Kwabenya',
    ['descriptive', 'services'],
  ),
  b3(
    'w-d-breakdown',
    'my car broke down near mankessim',
    ['car-repair', 'auto-parts'],
    V3.mankessim,
    5,
    'Mankessim',
    ['descriptive', 'transport'],
  ),
  b3(
    'w-d-print-cv',
    'somewhere to print my cv in akropong',
    ['printing', 'internet'],
    V3.akropong,
    5,
    'Akropong',
    ['descriptive', 'services'],
  ),
  b3(
    'w-d-kids-tema',
    'where can kids play in tema',
    ['park', 'entertainment', 'sports', 'attraction'],
    AT.tema,
    8,
    'Tema',
    ['descriptive', 'leisure'],
  ),
  b3(
    'w-d-building',
    'where to buy building materials in pokuase',
    ['hardware'],
    V3.pokuase,
    4,
    'Pokuase',
    ['descriptive', 'shopping'],
  ),

  // Near me.
  b3(
    'w-food-me',
    'food joint around me',
    ['local-food', 'restaurant', 'fast-food'],
    V3.ahodwo,
    3,
    null,
    ['near-me', 'food'],
    { user: V3.ahodwo, nearMe: true },
  ),
  b3(
    'w-hosp-me',
    'where is the closest hospital',
    ['hospital', 'clinic'],
    V3.kwabenya,
    5,
    null,
    ['near-me', 'health'],
    { user: V3.kwabenya, nearMe: true },
  ),

  // Named places.
  known('w-k-umat', 'university of mines and technology', 'university of mines', ['education'], {
    at: V3.tarkwa,
    km: 10,
  }),
  known('w-k-umat-abbr', 'UMaT tarkwa', 'university of mines', ['education', 'abbreviation'], {
    at: V3.tarkwa,
    km: 10,
  }),
  known('w-k-uenr', 'university of energy and natural resources', 'university of energy', [
    'education',
  ]),
  known('w-k-kintampo-falls', 'kintampo waterfalls', 'kintampo.*(falls|waterfall)', ['leisure']),
  known('w-k-bunso', 'bunso arboretum', 'bunso', ['leisure']),
  known('w-k-htu', 'ho technical university', '^ho technical university', ['education']),
  known('w-k-ktu', 'koforidua technical university', 'koforidua technical university', [
    'education',
  ]),
  known('w-k-manhyia-hosp', 'manhyia hospital', 'manhyia.*hospital', ['health']),
  known('w-k-lister', 'lister hospital', 'lister', ['health']),
  known('w-k-lister-typo', 'lister hosptal', 'lister', ['health', 'typo']),
  known('w-k-nyaho', 'nyaho clinic', 'nyaho', ['health']),
  known('w-k-holiday-inn', 'holiday inn accra', 'holiday inn', ['stay'], { at: AT.accra, km: 15 }),
  known('w-k-silverbird', 'silverbird cinema', 'silverbird', ['leisure']),
  known('w-k-gij', 'ghana institute of journalism', 'ghana institute of journalism', ['education']),
];

/**
 * Held-out set v4 (2026-11-14), written before the second round of rule fixes (misspelt areas,
 * unrecognised words) and the routed-query AI budget, and never looked at while making them.
 * Leans on what those changes target: misspelt town names and requests phrased as sentences.
 */
const V4 = {
  nima: [5.585, -0.2],
  kotobabi: [5.59, -0.21],
  abeka: [5.6, -0.24],
  lashibi: [5.64, -0.06],
  sakumono: [5.62, -0.06],
  kpone: [5.69, 0.04],
  oyarifa: [5.76, -0.18],
  ofankor: [5.66, -0.27],
  mallam: [5.57, -0.29],
  tafo: [6.73, -1.61],
  ayeduase: [6.67, -1.56],
  atonsu: [6.65, -1.6],
  akatsi: [6.13, 0.8],
  sogakope: [5.99, 0.6],
  asamankese: [5.86, -0.66],
  bibiani: [6.46, -2.32],
  wenchi: [7.74, -2.1],
  damongo: [9.08, -1.82],
  savelugu: [9.62, -0.83],
  walewale: [10.35, -0.8],
  lawra: [10.65, -2.9],
  axim: [4.87, -2.24],
} as const satisfies Record<string, LatLon>;

const b4 = (
  id: string,
  q: string,
  categories: string[],
  at: LatLon,
  km: number,
  area: string | null,
  tags: string[],
  extra: { user?: LatLon; nearMe?: boolean; openNow?: boolean } = {},
) =>
  browse(id, q, categories, at, km, tags, {
    user: extra.user,
    parse: {
      categories,
      area,
      ...(extra.nearMe ? { nearMe: true } : {}),
      ...(extra.openNow ? { openNow: true } : {}),
    },
  });

export const HOLDOUT_V4: GoldenCase[] = [
  // Misspelt town names.
  b4('x-pharm-lashibi', 'pharmacy lashibe', ['pharmacy'], V4.lashibi, 3, 'Lashibi', [
    'typo-area',
    'health',
  ]),
  b4('x-gh-sogakope', 'guest house sogakpe', ['guest-house', 'hotel'], V4.sogakope, 5, 'Sogakope', [
    'typo-area',
    'stay',
  ]),
  b4('x-bank-asamankese', 'bank asamankesse', ['bank'], V4.asamankese, 5, 'Asamankese', [
    'typo-area',
    'money',
  ]),
  b4(
    'x-school-oyarifa',
    'school in oyarefa',
    ['school', 'shs', 'creche'],
    V4.oyarifa,
    3,
    'Oyarifa',
    ['typo-area', 'education'],
  ),
  b4('x-market-savelugu', 'market in savelegu', ['market'], V4.savelugu, 5, 'Savelugu', [
    'typo-area',
    'shopping',
  ]),
  b4(
    'x-rest-ayeduase',
    'restaurant ayeduasi',
    ['restaurant', 'local-food', 'fast-food', 'cafe'],
    V4.ayeduase,
    3,
    'Ayeduase',
    ['typo-area', 'food'],
  ),

  // Plain category queries.
  b4('x-hosp-wenchi', 'hospital wenchi', ['hospital', 'clinic'], V4.wenchi, 6, 'Wenchi', [
    'pure-browse',
    'health',
  ]),
  b4('x-fuel-damongo', 'fuel station damongo', ['fuel'], V4.damongo, 6, 'Damongo', [
    'pure-browse',
    'transport',
  ]),
  b4('x-church-tafo', 'churches tafo', ['church', 'worship'], V4.tafo, 3, 'Tafo', [
    'pure-browse',
    'faith',
  ]),
  b4('x-atm-nima', 'atm nima', ['atm', 'bank'], V4.nima, 2.5, 'Nima', ['pure-browse', 'money']),
  b4('x-hotel-axim', 'hotel axim', ['hotel', 'guest-house'], V4.axim, 6, 'Axim', [
    'pure-browse',
    'stay',
  ]),
  b4('x-police-walewale', 'police walewale', ['police'], V4.walewale, 6, 'Walewale', [
    'pure-browse',
    'public',
  ]),
  b4('x-pharm-bibiani', 'pharmacy bibiani', ['pharmacy'], V4.bibiani, 6, 'Bibiani', [
    'pure-browse',
    'health',
  ]),
  b4(
    'x-super-sakumono',
    'supermarket sakumono',
    ['supermarket', 'provisions', 'mall'],
    V4.sakumono,
    3,
    'Sakumono',
    ['pure-browse', 'shopping'],
  ),
  b4('x-school-lawra', 'school lawra', ['school', 'shs', 'creche'], V4.lawra, 6, 'Lawra', [
    'pure-browse',
    'education',
  ]),
  b4('x-mosque-nima', 'mosque nima', ['mosque', 'worship'], V4.nima, 2.5, 'Nima', [
    'pure-browse',
    'faith',
  ]),

  // Local terms.
  b4('x-chopbar-kpone', 'chop bar kpone', ['local-food', 'restaurant'], V4.kpone, 5, 'Kpone', [
    'slang',
    'food',
  ]),
  b4('x-trotro-mallam', 'trotro station mallam', ['bus-station'], V4.mallam, 3, 'Mallam', [
    'slang',
    'transport',
  ]),
  b4('x-drug-atonsu', 'drug store atonsu', ['pharmacy'], V4.atonsu, 3, 'Atonsu', [
    'slang',
    'health',
  ]),
  b4('x-momo-akatsi', 'momo point akatsi', ['mobile-money'], V4.akatsi, 5, 'Akatsi', [
    'slang',
    'money',
  ]),

  // Requests phrased as sentences.
  b4(
    'x-d-fabric',
    'where can i buy fabric in kotobabi',
    ['fashion', 'market'],
    V4.kotobabi,
    3,
    'Kotobabi',
    ['descriptive', 'shopping'],
  ),
  b4('x-d-mechanic', 'i need a mechanic in abeka', ['car-repair'], V4.abeka, 3, 'Abeka', [
    'descriptive',
    'transport',
  ]),
  b4(
    'x-d-waakye',
    'somewhere to eat waakye in nima',
    ['local-food', 'restaurant'],
    V4.nima,
    2.5,
    'Nima',
    ['descriptive', 'food'],
  ),
  b4('x-d-photos', 'where can i print photos in ofankor', ['printing'], V4.ofankor, 3, 'Ofankor', [
    'descriptive',
    'services',
  ]),
  b4(
    'x-d-screen',
    'my phone screen is broken where can i fix it in tafo',
    ['repairs', 'phones-electronics'],
    V4.tafo,
    3,
    'Tafo',
    ['descriptive', 'services'],
  ),
  b4(
    'x-d-fridge',
    'where to buy a fridge in kpone',
    ['phones-electronics', 'shop', 'furniture'],
    V4.kpone,
    5,
    'Kpone',
    ['descriptive', 'shopping'],
  ),
  b4(
    'x-d-overnight',
    'place to stay overnight in damongo',
    ['hotel', 'guest-house', 'hostel'],
    V4.damongo,
    6,
    'Damongo',
    ['descriptive', 'stay'],
  ),
  b4(
    'x-d-braids',
    'where do i get my hair braided in ayeduase',
    ['salon'],
    V4.ayeduase,
    3,
    'Ayeduase',
    ['descriptive', 'services'],
  ),
  b4(
    'x-d-open-pharm',
    'need a pharmacy that is open in sakumono',
    ['pharmacy'],
    V4.sakumono,
    3,
    'Sakumono',
    ['descriptive', 'health'],
    { openNow: true },
  ),
  b4(
    'x-d-movie',
    'where can i watch a movie in kumasi',
    ['entertainment'],
    AT.kumasi,
    15,
    'Kumasi',
    ['descriptive', 'leisure'],
  ),

  // Near me.
  b4('x-fuel-me', 'nearest fuel station', ['fuel'], V4.lashibi, 4, null, ['near-me', 'transport'], {
    user: V4.lashibi,
    nearMe: true,
  }),
  b4(
    'x-clinic-me',
    'any clinic near me',
    ['clinic', 'hospital'],
    V4.tafo,
    4,
    null,
    ['near-me', 'health'],
    { user: V4.tafo, nearMe: true },
  ),

  // Named places.
  known('x-k-mole-motel', 'mole motel', 'mole motel', ['stay']),
  known('x-k-larabanga', 'larabanga mosque', 'larabanga', ['faith']),
  known('x-k-nzulezo', 'nzulezo', 'nzulezo', ['leisure']),
  known('x-k-st-jago', 'fort st jago', 'st\\.? ?jago|fort jago', ['leisure']),
  known('x-k-kcc', 'kumasi cultural centre', 'cultural cent', ['leisure'], {
    at: AT.kumasi,
    km: 15,
  }),
  known('x-k-tamale-mosque', 'tamale central mosque', 'central mosque', ['faith'], {
    at: AT.tamale,
    km: 5,
  }),
  known('x-k-palace-mall', 'palace mall', 'palace (shopping )?mall', ['shopping']),
  known('x-k-ac-mall', 'a&c mall', 'a ?& ?c mall', ['shopping']),
  known('x-k-botanical', 'legon botanical garden', 'legon botanical', ['leisure']),
  known('x-k-central-uni', 'central university', '^central university', ['education']),
  known('x-k-vvu', 'valley view university', 'valley view', ['education']),
  known('x-k-vvu-typo', 'valley veiw university', 'valley view', ['education', 'typo']),
  known('x-k-upsa', 'UPSA', 'university of professional studies', ['education', 'abbreviation']),
];

/**
 * Held-out set v5 (2026-11-14), written before the same-name town work and never looked at
 * while making it. Many Ghanaian towns share a name (Atonsu, Anloga, Mampong, Akropong, Agogo).
 * Each label is the town people mean, taken from where the places that name it actually are:
 * - bare: one candidate clearly dominates, so it should win with no other hint;
 * - qualified: a second name picks the town ("anloga volta", "konongo odumasi");
 * - located: a bare name with the user's position; the nearer town should win;
 * - control: an unambiguous town, which must not get worse.
 */
const V5 = {
  atonsuKsi: [6.652, -1.59],
  anlogaKsi: [6.687, -1.595],
  anlogaVolta: [5.794, 0.895],
  mampongAsh: [7.057, -1.401],
  mampongAkw: [5.913, -0.14],
  agogoTown: [6.801, -1.085],
  agogoKsi: [6.651, -1.593],
  tafoKsi: [6.734, -1.609],
  tafoKintampo: [8.03, -1.733],
  akropongAkw: [5.971, -0.089],
  akropongAsh: [6.742, -1.731],
  aboaboKsi: [6.699, -1.598],
  matahekoAccra: [5.564, -0.253],
  matahekoAfienya: [5.762, 0.003],
  odumasiKonongo: [6.623, -1.215],
  tanosoKsi: [6.697, -1.691],
  nsutaTarkwa: [5.273, -1.982],
  koforidua: [6.1, -0.261],
  sunyani: [7.338, -2.331],
  adum: [6.694, -1.623],
  // User positions.
  kumasi: [6.69, -1.62],
  keta: [5.92, 0.99],
  accra: [5.6, -0.19],
  madina: [5.68, -0.17],
  tema: [5.7, 0.0],
  atonsuHome: [6.66, -1.6],
  kintampo: [8.05, -1.73],
  tarkwa: [5.3, -1.99],
} as const satisfies Record<string, LatLon>;

const b5 = (
  id: string,
  q: string,
  categories: string[],
  at: LatLon,
  km: number,
  tags: string[],
  user?: LatLon,
) => browse(id, q, categories, at, km, tags, { user });

const PHARMACY = ['pharmacy'];
const HEALTH = ['hospital', 'clinic'];
const STAY = ['hotel', 'guest-house'];
const SCHOOL = ['school', 'shs'];

export const HOLDOUT_V5: GoldenCase[] = [
  // Bare names: the bigger, better-known town should win.
  b5('y-pharm-atonsu', 'pharmacy atonsu', PHARMACY, V5.atonsuKsi, 3, ['bare', 'health']),
  b5('y-school-agogo', 'school agogo', SCHOOL, V5.agogoTown, 5, ['bare', 'education']),
  b5('y-hosp-mampong', 'hospital mampong', HEALTH, V5.mampongAsh, 5, ['bare', 'health']),
  b5('y-market-aboabo', 'market aboabo', ['market'], V5.aboaboKsi, 3, ['bare', 'shopping']),

  // Qualified: a second name picks the town.
  b5('y-drug-atonsu-ksi', 'drug store atonsu kumasi', PHARMACY, V5.atonsuKsi, 3, [
    'qualified',
    'health',
  ]),
  b5('y-church-anloga-ksi', 'church in anloga kumasi', ['church'], V5.anlogaKsi, 3, [
    'qualified',
    'faith',
  ]),
  b5('y-hotel-anloga-volta', 'hotel anloga volta', STAY, V5.anlogaVolta, 6, ['qualified', 'stay']),
  b5('y-hosp-mampong-akw', 'hospital mampong akwapem', HEALTH, V5.mampongAkw, 4, [
    'qualified',
    'health',
  ]),
  b5('y-school-akropong-akw', 'school akropong akuapem', SCHOOL, V5.akropongAkw, 4, [
    'qualified',
    'education',
  ]),
  b5('y-bank-mampong-ash', 'bank mampong ashanti', ['bank'], V5.mampongAsh, 5, [
    'qualified',
    'money',
  ]),
  b5('y-school-tafo-ksi', 'school in tafo kumasi', SCHOOL, V5.tafoKsi, 3, [
    'qualified',
    'education',
  ]),
  b5('y-hotel-nsuta-tarkwa', 'hotel nsuta tarkwa', STAY, V5.nsutaTarkwa, 5, ['qualified', 'stay']),
  b5('y-church-konongo-odumasi', 'church konongo odumasi', ['church'], V5.odumasiKonongo, 4, [
    'qualified',
    'faith',
  ]),
  b5(
    'y-rest-mataheko-accra',
    'restaurant mataheko accra',
    ['restaurant', 'local-food', 'fast-food'],
    V5.matahekoAccra,
    3,
    ['qualified', 'food'],
  ),
  b5('y-pharm-aboabo-ksi', 'pharmacy aboabo, kumasi', PHARMACY, V5.aboaboKsi, 3, [
    'qualified',
    'health',
  ]),
  b5('y-fuel-tanoso-ksi', 'fuel station in tanoso kumasi', ['fuel'], V5.tanosoKsi, 3, [
    'qualified',
    'transport',
  ]),
  b5('y-hotel-agogo-ash', 'hotel agogo ashanti', STAY, V5.agogoTown, 6, ['qualified', 'stay']),

  // Located: a bare name and the user's position; the nearer town should win.
  b5(
    'y-pharm-anloga-ksi',
    'pharmacy anloga',
    PHARMACY,
    V5.anlogaKsi,
    3,
    ['located', 'health'],
    V5.kumasi,
  ),
  b5(
    'y-school-anloga-keta',
    'schools anloga',
    SCHOOL,
    V5.anlogaVolta,
    6,
    ['located', 'education'],
    V5.keta,
  ),
  b5(
    'y-hotel-akropong-accra',
    'hotel akropong',
    STAY,
    V5.akropongAkw,
    5,
    ['located', 'stay'],
    V5.accra,
  ),
  b5(
    'y-gh-akropong-ksi',
    'guest house akropong',
    STAY,
    V5.akropongAsh,
    5,
    ['located', 'stay'],
    V5.kumasi,
  ),
  b5(
    'y-clinic-mampong-madina',
    'clinic mampong',
    HEALTH,
    V5.mampongAkw,
    5,
    ['located', 'health'],
    V5.madina,
  ),
  b5(
    'y-church-mataheko-tema',
    'church mataheko',
    ['church'],
    V5.matahekoAfienya,
    4,
    ['located', 'faith'],
    V5.tema,
  ),
  b5(
    'y-school-agogo-ksi',
    'basic school agogo',
    SCHOOL,
    V5.agogoKsi,
    2.5,
    ['located', 'education'],
    V5.atonsuHome,
  ),
  b5(
    'y-church-tafo-kintampo',
    'chapel tafo',
    ['church'],
    V5.tafoKintampo,
    4,
    ['located', 'faith'],
    V5.kintampo,
  ),
  b5(
    'y-pharm-nsuta-tarkwa',
    'pharmacy nsuta',
    PHARMACY,
    V5.nsutaTarkwa,
    5,
    ['located', 'health'],
    V5.tarkwa,
  ),

  // Controls: one obvious town.
  b5('y-hotel-koforidua', 'hotel koforidua', STAY, V5.koforidua, 6, ['control', 'stay']),
  b5('y-bank-sunyani', 'bank sunyani', ['bank'], V5.sunyani, 6, ['control', 'money']),
  b5('y-super-adum', 'supermarket adum', ['supermarket'], V5.adum, 2, ['control', 'shopping']),
  b5('y-pharm-ayigya', 'pharmacy ayigya', PHARMACY, [6.692, -1.578], 2.5, ['control', 'health']),
];
