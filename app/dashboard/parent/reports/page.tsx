"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function ReportsPage() {
  const [reportType, setReportType] = useState("monthly-attendance")
  const [month, setMonth] = useState("april")
  const [year, setYear] = useState("2023")
  const [selectedChildren, setSelectedChildren] = useState<string[]>(["emma", "michael"])

  const handleChildToggle = (childId: string) => {
    setSelectedChildren((prev) => (prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and view reports for your children</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select report type and parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly-attendance">Monthly Attendance</SelectItem>
                  <SelectItem value="semester-performance">Semester Performance</SelectItem>
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

            <div className="flex items-end">
              <Button className="w-full">Generate Report</Button>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">Select Children</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emma"
                  checked={selectedChildren.includes("emma")}
                  onCheckedChange={() => handleChildToggle("emma")}
                />
                <Label htmlFor="emma">Emma Johnson</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="michael"
                  checked={selectedChildren.includes("michael")}
                  onCheckedChange={() => handleChildToggle("michael")}
                />
                <Label htmlFor="michael">Michael Johnson</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedChildren.map((childId) => (
        <Card key={childId}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Monthly Attendance Report</CardTitle>
              <CardDescription>{childId === "emma" ? "Emma Johnson" : "Michael Johnson"} - April 2023</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 mb-4">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Total Days</p>
                <p className="text-2xl font-bold">20</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">{childId === "emma" ? "18" : "17"}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{childId === "emma" ? "1" : "2"}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{childId === "emma" ? "1" : "1"}</p>
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
                  {
                    date: "April 6, 2023",
                    day: "Thursday",
                    status: childId === "emma" ? "Absent" : "Present",
                    subject: "Computer Science",
                  },
                  { date: "April 7, 2023", day: "Friday", status: "Present", subject: "Mathematics 101" },
                  { date: "April 10, 2023", day: "Monday", status: "Present", subject: "Mathematics 101" },
                  { date: "April 11, 2023", day: "Tuesday", status: "Late", subject: "Physics 201" },
                  {
                    date: "April 12, 2023",
                    day: "Wednesday",
                    status: childId === "emma" ? "Present" : "Absent",
                    subject: "English Literature",
                  },
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
      ))}
    </div>
  )
}

