type Props = { items: string[]; reverse?: boolean };

export function Marquee({ items, reverse }: Props) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-border py-6">
      <div
        className="marquee gap-12 text-3xl md:text-5xl"
        style={{ animationDirection: reverse ? "reverse" : "normal" }}
      >
        {row.map((t, i) => (
          <span
            key={i}
            className="font-display flex items-center gap-12 text-foreground/80"
          >
            {t}
            <span aria-hidden className="size-2 rounded-full bg-primary/80" />
          </span>
        ))}
      </div>
    </div>
  );
}
