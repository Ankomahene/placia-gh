'use client';

import { Button } from '@placia/ui/button';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function Decide({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ status: string; slug?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (approve: boolean) => {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approve }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      slug?: string;
      error?: string;
    };
    setBusy(false);
    if (!res.ok || !data.status) {
      setError(data.error ?? "Couldn't save");
      return;
    }
    setResult({ status: data.status, slug: data.slug });
    router.refresh();
  };

  if (result) {
    return (
      <p className="font-medium text-sm">
        {result.status === 'approved' ? 'Approved' : 'Rejected'}
        {result.slug ? (
          <>
            {' · '}
            <Link href={`/place/${result.slug}`} className="text-primary hover:underline">
              Open place
            </Link>
          </>
        ) : null}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <div className="flex gap-2">
        <Button className="flex-1" disabled={busy} onClick={() => void decide(true)}>
          <Check />
          Approve
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={busy}
          onClick={() => void decide(false)}
        >
          <X />
          Reject
        </Button>
      </div>
    </div>
  );
}
