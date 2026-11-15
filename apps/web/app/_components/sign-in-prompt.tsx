import { buttonVariants } from '@placia/ui/button';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export function SignInPrompt({
  icon: Icon,
  title,
  next,
}: {
  icon: LucideIcon;
  title: string;
  next: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground">
        <Icon className="size-7" />
      </span>
      <p className="font-semibold text-lg">{title}</p>
      <Link
        href={`/signin?next=${encodeURIComponent(next)}` as never}
        className={buttonVariants({ size: 'lg' })}
      >
        Sign in
      </Link>
    </div>
  );
}
