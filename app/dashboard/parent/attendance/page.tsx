"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ChildAttendancePage() {
  const [child, setChild] = useState("emma")
  const [month, setMonth] = useState("april")
  const [year, setYear] = useState("2023")

  // Mock calendar data - in a real app, this would come from an API
  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1
    let status = "present"

    // Add some variation for demonstration
    if (day === 6 || day === 20) status = "absent"
    if (day === 11 || day === 25) status = "late"
    if (day % 7 === 0) status = "holiday" // Sundays are holidays

    return { day, status }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance for {child === "emma" ? "Emma Johnson" : "Michael Johnson"}
        </h1>
        <p className="text-muted-foreground">View your child's attendance records</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Details</CardTitle>
          <CardDescription>Select child and time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Child</label>
              <Select value={child} onValueChange={setChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emma">Emma Johnson</SelectItem>
                  <SelectItem value="michael">Michael Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="january">January</SelectItem>
                  <SelectItem value="february">February</SelectItem>
                  <SelectItem value="march">March</SelectItem>
                  <SelectItem value="april">April</SelectItem>
                  <SelectItem value="may">May</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
          <CardDescription>
            {child === "emma" ? "Emma Johnson" : "Michael Johnson"} - {month.charAt(0).toUpperCase() + month.slice(1)}{" "}
            {year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Days</p>
              <p className="text-2xl font-bold">20</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm font-medium text-muted-foreground">Present</p>
              <p className="text-2xl font-bold text-green-600">18</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm font-medium text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold text-red-600">1</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm font-medium text-muted-foreground">Late</p>
              <p className="text-2xl font-bold text-yellow-600">1</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Calendar</CardTitle>
          <CardDescription>Monthly attendance view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="font-medium p-2">
                {day}
              </div>
            ))}

            {/* This is a simplified calendar view. In a real app, you'd need to calculate the correct starting day */}
            {calendarDays.map(({ day, status }) => (
              <div
                key={day}
                className={`rounded-md p-2 ${
                  status === "present"
                    ? "bg-green-100 text-green-800"
                    : status === "absent"
                      ? "bg-red-100 text-red-800"
                      : status === "late"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-500"
                }`}
              >
                <div className="font-medium">{day}</div>
                <div className="text-xs capitalize">{status}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Details</CardTitle>
          <CardDescription>Daily attendance record</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subject</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { date: "April 3, 2023", day: "Monday", status: "Present", subject: "Mathematics 101" },
                { date: "April 4, 2023", day: "Tuesday", status: "Present", subject: "Physics 201" },
                { date: "April 5, 2023", day: "Wednesday", status: "Present", subject: "English Literature" },
                { date: "April 6, 2023", day: "Thursday", status: "Absent", subject: "Computer Science" },
                { date: "April 7, 2023", day: "Friday", status: "Present", subject: "Mathematics 101" },
                { date: "April 10, 2023", day: "Monday", status: "Present", subject: "Mathematics 101" },
                { date: "April 11, 2023", day: "Tuesday", status: "Late", subject: "Physics 201" },
                { date: "April 12, 2023", day: "Wednesday", status: "Present", subject: "English Literature" },
              ].map((record, i) => (
                <TableRow key={i}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.day}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        record.status === "Present"
                          ? "bg-green-100 text-green-800"
                          : record.status === "Absent"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {record.status}
                    </span>
                  </TableCell>
                  <TableCell>{record.subject}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Comments</CardTitle>
          <CardDescription>Comments from teachers regarding attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Prof. Sarah Williams (Mathematics)</p>
            <p className="mt-2 text-sm">
              {child === "emma" ? "Emma" : "Michael"} has been consistent with attendance except for one absence due to
              illness. The late arrival was communicated in advance.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">April 15, 2023</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

