import confetti from "canvas-confetti"

export function fireConfetti() {
  const duration = 2000
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#3b82f6", "#22c55e", "#a855f7", "#eab308"],
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#3b82f6", "#22c55e", "#a855f7", "#eab308"],
    })

    if (Date.now() < end) requestAnimationFrame(frame)
  }

  frame()
}
