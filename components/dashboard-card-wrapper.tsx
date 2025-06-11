"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardCardProps {
  title: string
  description?: string
  icon: LucideIcon
  className?: string
  onClick?: () => void
}

export function DashboardCard({ title, description, icon: Icon, className, onClick }: DashboardCardProps) {
  return (
    <Card
      className={cn("overflow-hidden transition-all hover:shadow-md", onClick ? "cursor-pointer" : "", className)}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      {description && (
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      )}
    </Card>
  )
}

