"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export default function StudentReportsPage() {
  const [student, setStudent] = useState("")
  const [reportType, setReportType] = useState("attendance")
  const [month, setMonth] = useState("april")
  const [year, setYear] = useState("2023")

  const students = [
    { id: "s1", name: "Alex Johnson", rollNumber: "S2023-001" },
    { id: "s2", name: "Emma Davis", rollNumber: "S2023-002" },
    { id: "s3", name: "Michael Brown", rollNumber: "S2023-003" },
    { id: "s4", name: "Sophia Wilson", rollNumber: "S2023-004" },
    { id: "s5", name: "James Taylor", rollNumber: "S2023-005" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Reports</h1>
        <p className="text-muted-foreground">View and generate reports for individual students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select student and report type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Student</label>
              <Select value={student} onValueChange={setStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.rollNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Monthly Attendance Report</SelectItem>
                  <SelectItem value="performance">Performance Report</SelectItem>
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

            <div className="flex items-end">
              <Button className="w-full">Generate Report</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Monthly Attendance Report</CardTitle>
            <CardDescription>Alex Johnson (S2023-001) - April 2023</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Download
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Comments</CardTitle>
          <CardDescription>Add your comments for this student's attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments</label>
              <Input
                placeholder="Add your comments here..."
                defaultValue="Alex has been consistent with attendance except for one absence due to illness. The late arrival was communicated in advance."
              />
            </div>
            <Button>Save Comments</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

