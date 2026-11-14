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
