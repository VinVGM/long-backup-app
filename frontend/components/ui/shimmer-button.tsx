import * as React from "react"
import { cn } from "@/lib/utils"

export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  background?: string
  className?: string
  children?: React.ReactNode
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      borderRadius = "100px",
      background = "rgba(59, 130, 246, 1)",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": "3s",
            "--cut": shimmerSize,
            "--bg": background,
          } as React.CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-border/40 px-6 py-3 text-white font-medium [border-radius:var(--radius)] hover:text-white",
          "transform-gpu transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]",
          "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:[background:var(--bg)]",
          "before:transition-all before:duration-300",
          "hover:before:scale-105 hover:before:opacity-90",
          className
        )}
        {...props}
      >
        {children}
        <div
          className="absolute inset-0 block [border-radius:inherit] overflow-hidden"
          style={{ transform: "translateZ(0)" }}
        >
          <div
            className="animate-shimmer-slide absolute inset-0 -z-10 [border-radius:inherit]"
            style={{
              background: `linear-gradient(var(--spread), transparent 5%, var(--shimmer-color) 50%, transparent 95%)`,
              filter: "blur(2px)",
              width: "200%",
              height: "100%",
              top: 0,
              left: "-100%",
            }}
          />
        </div>
      </button>
    )
  }
)
ShimmerButton.displayName = "ShimmerButton"

export { ShimmerButton }
