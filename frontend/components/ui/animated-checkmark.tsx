"use client"

import { useEffect, useState } from "react"

export function AnimatedCheckmark({ className }: { className?: string }) {
  const [draw, setDraw] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDraw(true), 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <svg className={className} viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-green-500"
        strokeDasharray="150"
        strokeDashoffset={draw ? "0" : "150"}
        style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
      />
      <path
        d="M14 27l7 7 16-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green-500"
        strokeDasharray="50"
        strokeDashoffset={draw ? "0" : "50"}
        style={{ transition: "stroke-dashoffset 0.4s ease-out 0.3s" }}
      />
    </svg>
  )
}
