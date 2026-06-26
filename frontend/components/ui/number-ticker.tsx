"use client"

import { useEffect, useRef } from "react"
import { useMotionValue, useSpring, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

export default function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
}: {
  value: number
  direction?: "up" | "down"
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : 0)
  const springValue = useSpring(motionValue, { stiffness: 60, damping: 20 })
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value)
      }, delay * 1000)
      return () => clearTimeout(timer)
    }
  }, [isInView, delay, direction, value, motionValue])

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-US").format(Math.round(latest))
      }
    })
    return unsubscribe
  }, [springValue])

  return <span ref={ref} className={cn("inline-block tabular-nums", className)} />
}
