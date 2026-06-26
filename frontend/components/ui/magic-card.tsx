"use client"

import { motion, useMotionValue, useMotionTemplate } from "framer-motion"
import { cn } from "@/lib/utils"

export function MagicCard({
  children,
  className,
  gradientColor = "rgba(59, 130, 246, 0.15)",
}: {
  children: React.ReactNode
  className?: string
  gradientColor?: string
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      className={cn("group relative overflow-hidden rounded-xl border border-border bg-card", className)}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300"
        style={{
          background: useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
