"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  PieChart,
  Settings,
  User,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [role, setRole] = useState<string>("")

  useEffect(() => {
    // Extract role from URL path
    const pathParts = pathname.split("/")
    if (pathParts.length > 2) {
      setRole(pathParts[2])
    }
  }, [pathname])

  const roleBasedNavItems = {
    student: [
      { name: "Dashboard", href: "/dashboard/student", icon: Home },
      { name: "Attendance", href: "/dashboard/student/attendance", icon: Calendar },
      { name: "Subjects", href: "/dashboard/student/subjects", icon: BookOpen },
      { name: "Fees", href: "/dashboard/student/fees", icon: CreditCard },
      { name: "Results", href: "/dashboard/student/results", icon: FileText },
      { name: "Chat", href: "/dashboard/student/chat", icon: MessageSquare },
      { name: "Reports", href: "/dashboard/student/reports", icon: PieChart },
    ],
    teacher: [
      { name: "Dashboard", href: "/dashboard/teacher", icon: Home },
      { name: "Mark Attendance", href: "/dashboard/teacher/attendance", icon: Calendar },
      { name: "Enter Results", href: "/dashboard/teacher/results", icon: FileText },
      { name: "Chat", href: "/dashboard/teacher/chat", icon: MessageSquare },
      { name: "Student Reports", href: "/dashboard/teacher/student-reports", icon: PieChart },
      { name: "Class Reports", href: "/dashboard/teacher/class-reports", icon: PieChart },
    ],
    parent: [
      { name: "Dashboard", href: "/dashboard/parent", icon: Home },
      { name: "Child Attendance", href: "/dashboard/parent/attendance", icon: Calendar },
      { name: "Child Results", href: "/dashboard/parent/results", icon: FileText },
      { name: "Fees", href: "/dashboard/parent/fees", icon: CreditCard },
      { name: "Chat with Teachers", href: "/dashboard/parent/chat", icon: MessageSquare },
      { name: "Reports", href: "/dashboard/parent/reports", icon: PieChart },
    ],
    admin: [
      { name: "Dashboard", href: "/dashboard/admin", icon: Home },
      { name: "User Management", href: "/dashboard/admin/users", icon: Users },
      { name: "Class Management", href: "/dashboard/admin/classes", icon: BookOpen },
      { name: "Teacher Assignment", href: "/dashboard/admin/teacher-assignment", icon: User },
      { name: "Fee Management", href: "/dashboard/admin/fees", icon: CreditCard },
      { name: "Result Management", href: "/dashboard/admin/results", icon: FileText },
      { name: "Reports", href: "/dashboard/admin/reports", icon: PieChart },
      { name: "Chat", href: "/dashboard/admin/chat", icon: MessageSquare },
      { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    ],
  }

  const navItems = role ? roleBasedNavItems[role as keyof typeof roleBasedNavItems] || [] : []

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed left-4 top-4 z-40 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <MobileSidebar navItems={navItems} pathname={pathname} />
        </SheetContent>
      </Sheet>
      <div className={cn("hidden border-r bg-background md:block", className)}>
        <DesktopSidebar navItems={navItems} pathname={pathname} />
      </div>
    </>
  )
}

interface SidebarNavProps {
  navItems: { name: string; href: string; icon: React.ElementType }[]
  pathname: string
}

function MobileSidebar({ navItems, pathname }: SidebarNavProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="h-6 w-6 rounded-full bg-primary" />
          <span>School Management</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <Button variant="outline" className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </Button>
      </div>
    </div>
  )
}

function DesktopSidebar({ navItems, pathname }: SidebarNavProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="h-6 w-6 rounded-full bg-primary" />
          <span>School Management</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <Button variant="outline" className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </Button>
      </div>
    </div>
  )
}

