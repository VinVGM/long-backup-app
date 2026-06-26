import { cn } from "@/lib/utils"

export function RetroGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-40 [perspective:200px]",
        className
      )}
    >
      <div className="absolute inset-0 [transform:rotateX(35deg)]">
        <div
          className="animate-grid absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--border)) 1px, transparent 0), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>
    </div>
  )
}
