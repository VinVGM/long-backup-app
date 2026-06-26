import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("p-12 text-center text-muted-foreground space-y-4", className)}
    >
      <div className="flex justify-center opacity-30">{icon}</div>
      <p className="text-lg font-medium text-foreground/80">{title}</p>
      {description && <p className="text-sm">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </motion.div>
  )
}
