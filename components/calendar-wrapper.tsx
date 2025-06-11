"use client"

import { Calendar } from "@/components/ui/calendar"

interface CalendarWrapperProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function CalendarWrapper({ date, setDate }: CalendarWrapperProps) {
  return <Calendar mode="single" selected={date} onSelect={setDate} />
} 