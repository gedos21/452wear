import { cn } from "@/lib/utils";

/** Numaralı ana bölüm. */
export function Section({
  no,
  title,
  children,
}: {
  no: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] sm:text-xl">
        <span className="text-foreground/35">{no}.</span> {title}
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/** Alt başlık. */
export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="pt-2 micro text-foreground/45">{children}</h3>
  );
}

export function P({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-[15px] leading-relaxed text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="relative pl-5 text-[15px] leading-relaxed text-muted-foreground before:absolute before:left-0 before:top-[0.7em] before:size-1 before:rounded-full before:bg-foreground/25"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Placeholder alanları görsel olarak ayırır. */
export function Slot({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[4px] bg-brand/10 px-1.5 py-0.5 text-[13px] text-brand">
      {children}
    </span>
  );
}

/** Dar ekranda yatay kaydırılabilen tablo. */
export function Table({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[34rem] text-left text-[13px]">
        <thead>
          <tr className="micro text-foreground/45">
            {head.map((cell) => (
              <th key={cell} className="pb-3 pr-6 font-normal last:pr-0">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border/70 align-top">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="py-3.5 pr-6 leading-relaxed text-muted-foreground last:pr-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
