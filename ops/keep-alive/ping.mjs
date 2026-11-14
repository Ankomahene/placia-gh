// Railway cron job: calls the public ping() RPC so the Supabase free-tier project
// never goes a week without activity (it pauses after 7 idle days).
// Runs every 2 days; exits non-zero on failure so Railway marks the run as failed.

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
async function main() {
  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
    return 1;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${url}/rest/v1/rpc/ping`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: '{}',
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      console.log(`ping ok: ${await res.json()}`);
      return 0;
    } catch (err) {
      console.error(`attempt ${attempt} failed: ${err instanceof Error ? err.message : err}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 10_000 * attempt));
    }
  }
  return 1;
}

// Set the exit code instead of calling process.exit() so open sockets close cleanly.
process.exitCode = await main();
