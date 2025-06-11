"use client"

import { useState } from "react"
import { BarChart, Download, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/ui/date-picker"

export default function ReportsPage() {
  const [reportType, setReportType] = useState("attendance")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2023, 3, 1), // April 1, 2023
    to: new Date(2023, 3, 30), // April 30, 2023
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and view system-wide reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select report type and parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="performance">Performance Report</SelectItem>
                  <SelectItem value="fees">Fee Collection Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="grid gap-2">
                <DatePicker 
                  date={dateRange} 
                  setDate={(date) => date && setDateRange({ from: date.from, to: date.to || date.from })} 
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button className="w-full">Generate Report</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportType === "attendance" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Attendance Report</CardTitle>
              <CardDescription>April 1, 2023 - April 30, 2023</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="class">Class-wise</TabsTrigger>
                <TabsTrigger value="teacher">Teacher-wise</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4 mt-4">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">1,245</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Average Attendance</p>
                    <p className="text-2xl font-bold text-green-600">88%</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Lowest Attendance</p>
                    <p className="text-2xl font-bold text-red-600">Grade 11B: 82%</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Highest Attendance</p>
                    <p className="text-2xl font-bold text-green-600">Grade 9A: 94%</p>
                  </div>
                </div>

                <div className="rounded-lg border p-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4">Attendance Trend</h3>
                  <div className="h-64 flex items-center justify-center bg-muted rounded-md p-4">
                    <BarChart className="h-8 w-8 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Attendance chart visualization would appear here</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="class" className="space-y-4 mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Total Students</TableHead>
                      <TableHead>Average Attendance</TableHead>
                      <TableHead>Lowest Day</TableHead>
                      <TableHead>Highest Day</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        class: "Grade 9A",
                        students: 25,
                        average: "94%",
                        lowest: "90% (Apr 15)",
                        highest: "100% (Apr 5)",
                      },
                      {
                        class: "Grade 9B",
                        students: 28,
                        average: "91%",
                        lowest: "85% (Apr 22)",
                        highest: "96% (Apr 8)",
                      },
                      {
                        class: "Grade 10A",
                        students: 24,
                        average: "88%",
                        lowest: "80% (Apr 18)",
                        highest: "95% (Apr 12)",
                      },
                      {
                        class: "Grade 10B",
                        students: 26,
                        average: "85%",
                        lowest: "78% (Apr 25)",
                        highest: "92% (Apr 4)",
                      },
                      {
                        class: "Grade 11A",
                        students: 22,
                        average: "86%",
                        lowest: "79% (Apr 19)",
                        highest: "94% (Apr 7)",
                      },
                      {
                        class: "Grade 11B",
                        students: 23,
                        average: "82%",
                        lowest: "75% (Apr 26)",
                        highest: "90% (Apr 11)",
                      },
                    ].map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.class}</TableCell>
                        <TableCell>{row.students}</TableCell>
                        <TableCell>{row.average}</TableCell>
                        <TableCell>{row.lowest}</TableCell>
                        <TableCell>{row.highest}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="teacher" className="space-y-4 mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Average Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { teacher: "Prof. Sarah Williams", subject: "Mathematics", classes: "5", average: "92%" },
                      { teacher: "Dr. Robert Chen", subject: "Physics", classes: "3", average: "88%" },
                      { teacher: "Dr. Emily Parker", subject: "English", classes: "4", average: "90%" },
                      { teacher: "Prof. James Wilson", subject: "Computer Science", classes: "2", average: "94%" },
                      { teacher: "Dr. Michael Brown", subject: "History", classes: "3", average: "85%" },
                      { teacher: "Ms. Jennifer Lee", subject: "Art", classes: "4", average: "89%" },
                    ].map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.teacher}</TableCell>
                        <TableCell>{row.subject}</TableCell>
                        <TableCell>{row.classes}</TableCell>
                        <TableCell>{row.average}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {reportType === "performance" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Performance Report</CardTitle>
              <CardDescription>April 1, 2023 - April 30, 2023</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Average GPA</p>
                <p className="text-2xl font-bold">3.4</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Students with A Grade</p>
                <p className="text-2xl font-bold text-green-600">28%</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Students with F Grade</p>
                <p className="text-2xl font-bold text-red-600">5%</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Highest Performing Class</p>
                <p className="text-2xl font-bold text-green-600">Grade 10A</p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
              <div className="h-64 flex items-center justify-center bg-muted rounded-md p-4">
                <PieChart className="h-8 w-8 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Grade distribution chart would appear here</span>
              </div>
            </div>

            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Average Score</TableHead>
                  <TableHead>Highest Score</TableHead>
                  <TableHead>Lowest Score</TableHead>
                  <TableHead>Pass Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { subject: "Mathematics", average: "82%", highest: "98%", lowest: "45%", passRate: "92%" },
                  { subject: "Physics", average: "78%", highest: "95%", lowest: "40%", passRate: "88%" },
                  { subject: "English", average: "85%", highest: "98%", lowest: "55%", passRate: "95%" },
                  { subject: "Computer Science", average: "88%", highest: "100%", lowest: "60%", passRate: "98%" },
                  { subject: "History", average: "76%", highest: "94%", lowest: "42%", passRate: "85%" },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.subject}</TableCell>
                    <TableCell>{row.average}</TableCell>
                    <TableCell>{row.highest}</TableCell>
                    <TableCell>{row.lowest}</TableCell>
                    <TableCell>{row.passRate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === "fees" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fee Collection Report</CardTitle>
              <CardDescription>April 1, 2023 - April 30, 2023</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold">$245,350</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">$58,750</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold text-green-600">81%</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Students with Pending Fees</p>
                <p className="text-2xl font-bold text-red-600">142</p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Fee Collection Trend</h3>
              <div className="h-64 flex items-center justify-center bg-muted rounded-md p-4">
                <BarChart className="h-8 w-8 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Fee collection trend chart would appear here</span>
              </div>
            </div>

            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Collection Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { type: "Tuition Fee", total: "$200,000", collected: "$175,000", pending: "$25,000", rate: "87.5%" },
                  { type: "Library Fee", total: "$25,000", collected: "$22,500", pending: "$2,500", rate: "90%" },
                  { type: "Lab Fee", total: "$35,000", collected: "$28,000", pending: "$7,000", rate: "80%" },
                  { type: "Registration Fee", total: "$50,000", collected: "$45,000", pending: "$5,000", rate: "90%" },
                  { type: "Exam Fee", total: "$40,000", collected: "$32,000", pending: "$8,000", rate: "80%" },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell>{row.collected}</TableCell>
                    <TableCell>{row.pending}</TableCell>
                    <TableCell>{row.rate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

