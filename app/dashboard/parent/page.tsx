import Link from "next/link"
import { Calendar, CreditCard, FileText, MessageSquare, User } from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card-wrapper"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ParentDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Mr. Robert Johnson! Here's an overview of your children's school activities.
        </p>
      </div>

      <h2 className="text-xl font-semibold">Your Children</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { name: "Emma Johnson", grade: "Grade 10", avatar: "EJ" },
          { name: "Michael Johnson", grade: "Grade 7", avatar: "MJ" },
        ].map((child, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" alt={child.name} />
                <AvatarFallback>{child.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{child.name}</CardTitle>
                <CardDescription>{child.grade}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/dashboard/parent/attendance?child=${i}`}
                  className="rounded-md bg-secondary px-3 py-2 text-center text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  View Attendance
                </Link>
                <Link
                  href={`/dashboard/parent/results?child=${i}`}
                  className="rounded-md bg-secondary px-3 py-2 text-center text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Results
                </Link>
                <Link
                  href={`/dashboard/parent/fees?child=${i}`}
                  className="rounded-md bg-secondary px-3 py-2 text-center text-sm font-medium flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  View Fees
                </Link>
                <Link
                  href={`/dashboard/parent/chat?child=${i}`}
                  className="rounded-md bg-secondary px-3 py-2 text-center text-sm font-medium flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat with Teachers
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-semibold">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/parent/attendance">
          <DashboardCard
            title="Attendance"
            description="View attendance records"
            icon={Calendar}
          />
        </Link>
        <Link href="/dashboard/parent/fees">
          <DashboardCard
            title="Fees"
            description="View and pay fees"
            icon={CreditCard}
          />
        </Link>
        <Link href="/dashboard/parent/assignments">
          <DashboardCard
            title="Assignments"
            description="View and submit assignments"
            icon={FileText}
          />
        </Link>
        <Link href="/dashboard/parent/chat">
          <DashboardCard
            title="Messages"
            description="Communicate with teachers"
            icon={MessageSquare}
          />
        </Link>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-semibold">Upcoming Fee Payments</h2>
        <div className="space-y-4">
          {[
            { child: "Emma Johnson", amount: "$350", due: "May 15, 2023", type: "Tuition Fee" },
            { child: "Michael Johnson", amount: "$250", due: "May 20, 2023", type: "Tuition Fee" },
            { child: "Emma Johnson", amount: "$120", due: "June 5, 2023", type: "Lab Fee" },
          ].map((fee, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{fee.child}</p>
                <p className="text-sm text-muted-foreground">{fee.type}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{fee.amount}</p>
                <p className="text-sm text-muted-foreground">Due: {fee.due}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

