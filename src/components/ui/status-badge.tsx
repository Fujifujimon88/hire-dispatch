import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  PENDING: "bg-status-pending/10 text-status-pending",
  CONFIRMED: "bg-status-confirmed/10 text-status-confirmed",
  DISPATCHED: "bg-status-dispatched/10 text-status-dispatched",
  COMPLETED: "bg-status-completed/10 text-status-completed",
  CANCELLED: "bg-status-cancelled/10 text-status-cancelled",
  DRAFT: "bg-orange-500/10 text-orange-500",
  ISSUED: "bg-blue-500/10 text-blue-500",
  PAID: "bg-green-500/10 text-green-500",
}

export function StatusBadge({ status, className, children }: { status: string; className?: string; children?: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap",
      statusStyles[status] || "bg-gray-100 text-gray-600",
      className
    )}>
      {children || status}
    </span>
  )
}
