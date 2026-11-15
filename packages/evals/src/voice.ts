/**
 * Voice eval: word error rate of speech-to-text on spoken place searches.
 *
 *   pnpm --filter @placia/evals voice --generate     # make the synthetic clip set (TTS)
 *   pnpm --filter @placia/evals voice                # WER for each STT model, with/without hints
 *   pnpm --filter @placia/evals voice --save
 *
 * Clip sets live in voice/<set>/ with a manifest.json of { file, text }. "synthetic" is made by
 * a TTS model asked for a Ghanaian English accent: a repeatable baseline, NOT a substitute for
 * real speakers. Real recordings go in voice/real/ the same way and are reported separately.
 */
import fs from 'node:fs';
import path from 'node:path';
import { GHANA_VOCABULARY } from '@placia/core/voice';
import OpenAI from 'openai';
import { mean, percentile, wordErrorRate } from './metrics';

const ROOT = path.join(import.meta.dirname, '..', 'voice');

export const SENTENCES = [
  'pharmacy near Osu',
  'hostel close to KNUST',
  'chop bar in Madina',
  'where can I get waakye in Dansoman',
  'filling station at Achimota',
  'Korle Bu Teaching Hospital',
  'ATM near Kaneshie market',
  'hotel in Cape Coast',
  'church in Adenta',
  'trotro station at Lapaz',
  'supermarket in East Legon',
  'kenkey seller near Labadi',
  'Kejetia market Kumasi',
  'pharmacy at Ayeduase',
  'restaurant in Takoradi',
  'mosque in Tamale',
  'drinking spot at Spintex',
  'chemical shop in Kasoa',
  'bank in Adum',
  'provisions shop near Nungua',
];

const argv = process.argv.slice(2);
const key = process.env.OPENAI_API_KEY;
if (!key) throw new Error('OPENAI_API_KEY is required');
const client = new OpenAI({ apiKey: key, maxRetries: 2 });

async function generate() {
  const dir = path.join(ROOT, 'synthetic');
  fs.mkdirSync(dir, { recursive: true });
  const voices = ['verse', 'ash', 'coral', 'sage'] as const;
  const manifest: { file: string; text: string; voice: string }[] = [];
  for (const [i, text] of SENTENCES.entries()) {
    const voice = voices[i % voices.length] as string;
    const file = `${String(i + 1).padStart(2, '0')}.mp3`;
    const res = await client.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice,
      input: text,
      instructions:
        'Speak like a Ghanaian adult asking a phone app for directions: natural Ghanaian English accent and rhythm, Ghanaian pronunciation of local place and food names, casual pace.',
      response_format: 'mp3',
    });
    fs.writeFileSync(path.join(dir, file), Buffer.from(await res.arrayBuffer()));
    manifest.push({ file, text, voice });
    process.stdout.write('.');
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\n${manifest.length} clips in ${path.relative(process.cwd(), dir)}`);
}

const CONFIGS = [
  { model: 'gpt-4o-mini-transcribe', hints: true },
  { model: 'gpt-4o-mini-transcribe', hints: false },
  { model: 'gpt-transcribe', hints: true },
  { model: 'gpt-transcribe', hints: false },
  { model: 'whisper-1', hints: true },
  { model: 'whisper-1', hints: false },
];

async function run() {
  const sets = fs
    .readdirSync(ROOT)
    .filter((d) => fs.existsSync(path.join(ROOT, d, 'manifest.json')));
  const lines = [`# Voice eval, ${new Date().toISOString().slice(0, 10)}`, ''];
  for (const set of sets) {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, set, 'manifest.json'), 'utf8')) as {
      file: string;
      text: string;
    }[];
    lines.push(
      `## ${set} (${manifest.length} clips)`,
      '',
      '| Model | Place-name hints | WER | Exact | p50 latency |',
      '| --- | --- | --- | --- | --- |',
    );
    const misses: string[] = [];
    for (const cfg of CONFIGS) {
      const wers: number[] = [];
      const ms: number[] = [];
      for (const clip of manifest) {
        const buf = fs.readFileSync(path.join(ROOT, set, clip.file));
        const t = performance.now();
        const res = await client.audio.transcriptions.create({
          file: new File([buf], clip.file),
          model: cfg.model,
          language: 'en',
          ...(cfg.hints ? { prompt: GHANA_VOCABULARY } : {}),
        });
        ms.push(performance.now() - t);
        const wer = wordErrorRate(clip.text, res.text);
        wers.push(wer);
        if (wer > 0 && cfg.hints && cfg.model === CONFIGS[0]?.model) {
          misses.push(`- "${clip.text}" → "${res.text.trim()}"`);
        }
      }
      const exact = wers.filter((w) => w === 0).length;
      const row = `| ${cfg.model} | ${cfg.hints ? 'yes' : 'no'} | ${(100 * mean(wers)).toFixed(1)}% | ${exact}/${wers.length} | ${Math.round(percentile(ms, 50))} ms |`;
      lines.push(row);
      console.log(set, row);
    }
    lines.push('', `Misses (${CONFIGS[0]?.model}, with hints):`, ...misses, '');
  }
  console.log(lines.join('\n'));
  if (argv.includes('--save')) {
    const file = path.join(
      ROOT,
      '..',
      'reports',
      `voice-${new Date().toISOString().slice(0, 10)}.md`,
    );
    fs.writeFileSync(file, `${lines.join('\n')}\n`);
    console.log(`saved ${path.relative(process.cwd(), file)}`);
  }
}

if (argv.includes('--generate')) await generate();
else await run();
