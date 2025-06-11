"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "../../components/icons"

interface DashboardCardProps {
  title: string
  description?: string
  iconName: keyof typeof Icons
  className?: string
  onClick?: () => void
}

export function DashboardCard({ title, description, iconName, className, onClick }: DashboardCardProps) {
  const Icon = Icons[iconName]

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