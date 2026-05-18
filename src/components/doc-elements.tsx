import { ReactNode } from 'react';

export function DocLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <article className="card prose-doc max-w-none">
      <header className="mb-6 pb-6 border-b border-[var(--lavender-100)]">
        <h1 className="heading-1">{title}</h1>
        <p className="body-sm text-[var(--stone-600)] mt-2">{description}</p>
      </header>
      <div className="space-y-5">{children}</div>
    </article>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="heading-3 mt-8 mb-3">{children}</h2>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="heading-5 mt-6 mb-2">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="body-md text-[var(--charcoal-900)] leading-relaxed">{children}</p>;
}

export function Code({ children, lang }: { children: string; lang?: string }) {
  return (
    <div className="card-code my-3">
      {lang && <div className="caption mb-1 opacity-60">{lang}</div>}
      <pre className="whitespace-pre-wrap text-[13px] leading-6 font-mono">{children}</pre>
    </div>
  );
}

export function Inline({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[13px] bg-[var(--cream-50)] px-1.5 py-0.5 rounded">{children}</code>;
}

export function Callout({ kind = 'info', children }: { kind?: 'info' | 'warn' | 'tip' | 'important'; children: ReactNode }) {
  const styles: Record<string, string> = {
    info: 'border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-950/20',
    warn: 'border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20',
    tip: 'border-l-4 border-green-400 bg-green-50 dark:bg-green-950/20',
    important: 'border-l-4 border-rose-400 bg-rose-50 dark:bg-rose-950/20',
  };
  return <div className={`p-3 rounded-r-md text-[14px] ${styles[kind]}`}>{children}</div>;
}

export function Img({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="rounded-lg border border-[var(--lavender-100)] max-w-full" />
      <figcaption className="caption mt-2 text-center opacity-70">{alt}</figcaption>
    </figure>
  );
}

export function Ol({ children }: { children: ReactNode }) {
  return <ol className="list-decimal pl-6 space-y-2 body-md text-[var(--charcoal-900)]">{children}</ol>;
}

export function Ul({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2 body-md text-[var(--charcoal-900)]">{children}</ul>;
}

export function Li({ children }: { children: ReactNode }) {
  return <li className="leading-relaxed">{children}</li>;
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-[14px] border-collapse">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-[var(--cream-50)] text-left">{children}</thead>;
}

export function TR({ children }: { children: ReactNode }) {
  return <tr className="border-b border-[var(--lavender-100)]">{children}</tr>;
}

export function TH({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}

export function TD({ children }: { children: ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}

export function Divider() {
  return <hr className="my-6 border-[var(--lavender-100)]" />;
}
