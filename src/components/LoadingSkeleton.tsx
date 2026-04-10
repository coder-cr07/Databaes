export function LoadingSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="glass-panel animate-pulse overflow-hidden rounded-2xl border border-white/10"
        >
          <div className="h-48 w-full bg-white/10" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-3/4 rounded bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-white/10" />
            <div className="h-10 w-full rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
