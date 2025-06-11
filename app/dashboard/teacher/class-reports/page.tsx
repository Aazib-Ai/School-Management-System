"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ClassReportsPage() {
  const [class_, setClass] = useState("mathematics-101-grade-9")
  const [reportType, setReportType] = useState("attendance")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Class Reports</h1>
        <p className="text-muted-foreground">View and generate reports for your classes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select class and report type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Class</label>
              <Select value={class_} onValueChange={setClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematics-101-grade-9">Mathematics 101 - Grade 9</SelectItem>
                  <SelectItem value="mathematics-101-grade-10">Mathematics 101 - Grade 10</SelectItem>
                  <SelectItem value="advanced-calculus-grade-12">Advanced Calculus - Grade 12</SelectItem>
                  <SelectItem value="statistics-grade-11">Statistics - Grade 11</SelectItem>
                  <SelectItem value="algebra-grade-10">Algebra - Grade 10</SelectItem>
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
                  <SelectItem value="attendance">Total Attendance Percentage</SelectItem>
                  <SelectItem value="performance">Class Performance Summary</SelectItem>
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
            <CardTitle>Total Attendance Percentage Report</CardTitle>
            <CardDescription>Mathematics 101 - Grade 9</CardDescription>
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
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">25</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Class Days</p>
                <p className="text-2xl font-bold">42</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Average Attendance</p>
                <p className="text-2xl font-bold text-green-600">88%</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Students Below 75%</p>
                <p className="text-2xl font-bold text-red-600">3</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Present Days</TableHead>
                  <TableHead>Absent Days</TableHead>
                  <TableHead>Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "Alex Johnson", rollNumber: "S2023-001", present: 38, absent: 4, percentage: 90 },
                  { name: "Emma Davis", rollNumber: "S2023-002", present: 40, absent: 2, percentage: 95 },
                  { name: "Michael Brown", rollNumber: "S2023-003", present: 35, absent: 7, percentage: 83 },
                  { name: "Sophia Wilson", rollNumber: "S2023-004", present: 42, absent: 0, percentage: 100 },
                  { name: "James Taylor", rollNumber: "S2023-005", present: 30, absent: 12, percentage: 71 },
                  { name: "Olivia Martinez", rollNumber: "S2023-006", present: 37, absent: 5, percentage: 88 },
                  { name: "William Anderson", rollNumber: "S2023-007", present: 39, absent: 3, percentage: 93 },
                  { name: "Ava Thomas", rollNumber: "S2023-008", present: 36, absent: 6, percentage: 86 },
                  { name: "Benjamin Jackson", rollNumber: "S2023-009", present: 29, absent: 13, percentage: 69 },
                  { name: "Mia White", rollNumber: "S2023-010", present: 41, absent: 1, percentage: 98 },
                ].map((student, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>{student.present}</TableCell>
                    <TableCell>{student.absent}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-24 rounded-full bg-muted">
                          <div
                            className={`h-2.5 rounded-full ${
                              student.percentage >= 90
                                ? "bg-green-500"
                                : student.percentage >= 75
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${student.percentage}%` }}
                          ></div>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            student.percentage >= 90
                              ? "text-green-600"
                              : student.percentage >= 75
                                ? "text-blue-600"
                                : "text-red-600"
                          }`}
                        >
                          {student.percentage}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

