import { cn } from './cn';

/** Placia mark: a map pin holding a small star (a nod to the Black Star). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M16 6.5c-4.4 0-8 3.4-8 7.7 0 5.6 6.6 11.1 7.3 11.7.4.3 1 .3 1.4 0 .7-.6 7.3-6.1 7.3-11.7 0-4.3-3.6-7.7-8-7.7Z"
        className="fill-primary-foreground"
      />
      <path
        d="m16 10.2 1.15 2.45 2.65.33-1.95 1.83.5 2.63L16 16.15l-2.35 1.29.5-2.63-1.95-1.83 2.65-.33L16 10.2Z"
        className="fill-accent"
      />
    </svg>
  );
}

export function Logo({ className, suffix }: { className?: string; suffix?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="font-semibold text-[1.05rem] tracking-tight">
        Placia
        {suffix ? <span className="ml-1.5 font-normal text-muted-foreground">{suffix}</span> : null}
      </span>
    </span>
  );
}
