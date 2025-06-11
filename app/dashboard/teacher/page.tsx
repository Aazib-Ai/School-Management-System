"use client"

import Link from "next/link"
import { BookOpen, Calendar, FileText, MessageSquare, PieChart, Users } from "lucide-react"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { StatsCard } from "@/components/stats-card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TeacherDashboard() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Important for sending cookies
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch user data')
        }

        const userData = await response.json()
        
        if (userData.role !== 'teacher') {
          router.push('/login')
          return
        }

        setUser(userData)
      } catch (error) {
        console.error("Error fetching user data:", error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name}! Here's an overview of your classes and student progress.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Classes" value="5" description="Classes Assigned" icon={BookOpen} />
        <StatsCard title="Total Students" value="127" description="Students in your Classes" icon={Users} />
        <StatsCard
          title="Average Attendance"
          value="88%"
          description="Across all your Classes"
          icon={Calendar}
          trend={{ value: "-2%", isPositive: false }}
        />
        <StatsCard title="Pending Assessments" value="3" description="To be Evaluated/Graded" icon={FileText} />
      </div>

      <h2 className="text-xl font-semibold">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/teacher/attendance">
          <DashboardCard title="Mark Attendance" description="Record attendance for your classes" iconName="Calendar" />
        </Link>
        <Link href="/dashboard/teacher/results">
          <DashboardCard
            title="Enter Results"
            description="Input grades and marks for student assessments"
            iconName="FileText"
          />
        </Link>
        <Link href="/dashboard/teacher/class-reports">
          <DashboardCard
            title="View Class Attendance"
            description="Analyze attendance trends for your classes"
            iconName="PieChart"
          />
        </Link>
        <Link href="/dashboard/teacher/chat">
          <DashboardCard title="Start Chat" description="Communicate with students and parents" iconName="MessageSquare" />
        </Link>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-semibold">Your Classes</h2>
        <div className="space-y-4">
          {[
            { name: "Mathematics 101 - Grade 9", students: "25 Students" },
            { name: "Mathematics 101 - Grade 10", students: "28 Students" },
            { name: "Advanced Calculus - Grade 12", students: "22 Students" },
            { name: "Statistics - Grade 11", students: "26 Students" },
            { name: "Algebra - Grade 10", students: "26 Students" },
          ].map((classItem, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 gap-3"
            >
              <div>
                <p className="font-medium">{classItem.name}</p>
                <p className="text-sm text-muted-foreground">{classItem.students}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/teacher/attendance?class=${i}`}>
                  <Button size="sm" variant="outline">
                    Mark Attendance
                  </Button>
                </Link>
                <Link href={`/dashboard/teacher/results?class=${i}`}>
                  <Button size="sm" variant="outline">
                    Enter Results
                  </Button>
                </Link>
                <Link href={`/dashboard/teacher/class-reports?class=${i}`}>
                  <Button size="sm" variant="outline">
                    View Class Report
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

