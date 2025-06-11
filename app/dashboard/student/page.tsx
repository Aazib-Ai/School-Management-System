"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Calendar, CreditCard, FileText, MessageSquare } from "lucide-react"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { StatsCard } from "@/components/stats-card"
import { useRouter } from "next/navigation"

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState({
    name: "Student",
    rollNumber: ""
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetch the authenticated user data
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
        
        if (userData.role !== 'student') {
          router.push('/login')
          return
        }

        // Use the data directly from the API
        setStudentData({
          name: userData.name || "Student",
          rollNumber: userData.rollNumber || ""
        })
      } catch (error) {
        console.error("Error fetching student data:", error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">
          {loading ? (
            "Loading your information..."
          ) : (
            `Welcome back, ${studentData.name}${studentData.rollNumber ? ` your roll no is ${studentData.rollNumber}` : ""}! Here's an overview of your academic progress.`
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Attendance Rate"
          value="92%"
          description="Current semester"
          icon={Calendar}
          trend={{ value: "+2%", isPositive: true }}
        />
        <StatsCard
          title="GPA"
          value="3.8"
          description="Current semester"
          icon={FileText}
          trend={{ value: "+0.2", isPositive: true }}
        />
        <StatsCard title="Completed Courses" value="12/15" description="Current program" icon={BookOpen} />
        <StatsCard title="Pending Fees" value="$250" description="Due in 15 days" icon={CreditCard} />
      </div>

      <h2 className="text-xl font-semibold">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/student/attendance">
          <DashboardCard title="View Attendance" description="Check your attendance records" iconName="Calendar" />
        </Link>
        <Link href="/dashboard/student/subjects">
          <DashboardCard
            title="Enroll in Subjects"
            description="Browse and enroll in available subjects"
            iconName="BookOpen"
          />
        </Link>
        <Link href="/dashboard/student/fees">
          <DashboardCard title="View Fees" description="Check fee status and make payments" iconName="CreditCard" />
        </Link>
        <Link href="/dashboard/student/chat">
          <DashboardCard title="Chat with Teachers" description="Send messages to your teachers" iconName="MessageSquare" />
        </Link>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-semibold">Upcoming Schedule</h2>
        <div className="space-y-4">
          {[
            { subject: "Mathematics 101", room: "Room 203, Building A", day: "Monday", time: "9:00 AM - 10:30 AM" },
            { subject: "English Literature", room: "Room 105, Building B", day: "Monday", time: "11:00 AM - 12:30 PM" },
            { subject: "Physics", room: "Lab 302, Science Building", day: "Tuesday", time: "9:00 AM - 11:00 AM" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{item.subject}</p>
                <p className="text-sm text-muted-foreground">{item.room}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.day}</p>
                <p className="text-sm text-muted-foreground">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

