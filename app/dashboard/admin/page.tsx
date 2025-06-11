import Link from "next/link"
import { BookOpen, CreditCard, FileText, MessageSquare, PieChart, Settings, User, Users } from "lucide-react"
import { DashboardCard } from "@/components/ui/dashboard-card"
import { StatsCard } from "@/components/stats-card"

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Admin! Here's an overview of the school system.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value="1,245"
          description="Enrolled this semester"
          icon={Users}
          trend={{ value: "+82", isPositive: true }}
        />
        <StatsCard title="Total Teachers" value="78" description="Active faculty members" icon={User} />
        <StatsCard title="Total Classes" value="42" description="Across all grades" icon={BookOpen} />
        <StatsCard
          title="Fee Collection"
          value="$245,350"
          description="This semester"
          icon={CreditCard}
          trend={{ value: "+12%", isPositive: true }}
        />
      </div>

      <h2 className="text-xl font-semibold">System Management</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/admin/users">
          <DashboardCard title="User Management" description="Manage students, teachers, and parents" iconName="Users" />
        </Link>
        <Link href="/dashboard/admin/classes">
          <DashboardCard title="Class Management" description="Manage classes and subjects" iconName="BookOpen" />
        </Link>
        <Link href="/dashboard/admin/teacher-assignment">
          <DashboardCard title="Teacher Assignment" description="Assign teachers to classes" iconName="User" />
        </Link>
        <Link href="/dashboard/admin/fees">
          <DashboardCard title="Fee Management" description="Configure and track fee payments" iconName="CreditCard" />
        </Link>
        <Link href="/dashboard/admin/results">
          <DashboardCard title="Result Management" description="Manage and publish results" iconName="FileText" />
        </Link>
        <Link href="/dashboard/admin/reports">
          <DashboardCard title="Reports" description="Generate and view system reports" iconName="PieChart" />
        </Link>
        <Link href="/dashboard/admin/chat-monitoring">
          <DashboardCard title="Chat Monitoring" description="Monitor system communications" iconName="MessageSquare" />
        </Link>
        <Link href="/dashboard/admin/settings">
          <DashboardCard title="System Settings" description="Configure system parameters" iconName="Settings" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-xl font-semibold">Recent Activities</h2>
          <div className="space-y-4">
            {[
              { action: "New student registered", time: "2 hours ago" },
              { action: "Fee payment received", time: "3 hours ago" },
              { action: "New class added", time: "5 hours ago" },
              { action: "Teacher assigned to class", time: "Yesterday" },
              { action: "Results published", time: "Yesterday" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-xl font-semibold">System Notifications</h2>
          <div className="space-y-4">
            {[
              { message: "System update scheduled", type: "info", time: "Tomorrow, 2:00 AM" },
              { message: "Database backup completed", type: "success", time: "Today, 3:00 AM" },
              { message: "Low disk space warning", type: "warning", time: "Immediate attention required" },
              { message: "New academic year setup pending", type: "info", time: "Action required" },
            ].map((notification, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      notification.type === "info"
                        ? "bg-blue-500"
                        : notification.type === "success"
                          ? "bg-green-500"
                          : notification.type === "warning"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                    }`}
                  />
                  <p className="font-medium">{notification.message}</p>
                </div>
                <p className="text-sm text-muted-foreground">{notification.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

