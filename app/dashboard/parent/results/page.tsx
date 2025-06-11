"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ChildResultsPage() {
  const [child, setChild] = useState("emma")
  const [semester, setSemester] = useState("current")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Results for {child === "emma" ? "Emma Johnson" : "Michael Johnson"}
        </h1>
        <p className="text-muted-foreground">View your child's academic performance and grades</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Results Details</CardTitle>
          <CardDescription>Select child and semester</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
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
              <label className="text-sm font-medium">Semester</label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Semester (Fall 2023)</SelectItem>
                  <SelectItem value="previous">Previous Semester (Spring 2023)</SelectItem>
                  <SelectItem value="fall2022">Fall 2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Results Summary</CardTitle>
            <CardDescription>
              {child === "emma" ? "Emma Johnson" : "Michael Johnson"} -{" "}
              {semester === "current" ? "Fall 2023" : semester === "previous" ? "Spring 2023" : "Fall 2022"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm font-medium text-muted-foreground">GPA</p>
              <p className="text-2xl font-bold text-primary">{child === "emma" ? "3.8" : "3.6"}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm font-medium text-muted-foreground">Class Rank</p>
              <p className="text-2xl font-bold">{child === "emma" ? "3 / 28" : "7 / 30"}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm font-medium text-muted-foreground">Attendance</p>
              <p className="text-2xl font-bold text-green-600">{child === "emma" ? "95%" : "92%"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="subjects">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subjects">Subject Results</TabsTrigger>
          <TabsTrigger value="assessments">Assessment Breakdown</TabsTrigger>
          <TabsTrigger value="progress">Progress Report</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Results</CardTitle>
              <CardDescription>Detailed breakdown by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Teacher</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(child === "emma"
                    ? [
                        {
                          subject: "Mathematics",
                          code: "MATH101",
                          marks: "92/100",
                          grade: "A",
                          teacher: "Prof. Sarah Williams",
                        },
                        {
                          subject: "Physics",
                          code: "PHYS201",
                          marks: "88/100",
                          grade: "B+",
                          teacher: "Dr. Robert Chen",
                        },
                        {
                          subject: "English Literature",
                          code: "ENG102",
                          marks: "95/100",
                          grade: "A",
                          teacher: "Dr. Emily Parker",
                        },
                        {
                          subject: "Computer Science",
                          code: "CS101",
                          marks: "90/100",
                          grade: "A-",
                          teacher: "Prof. James Wilson",
                        },
                        {
                          subject: "History",
                          code: "HIST101",
                          marks: "85/100",
                          grade: "B+",
                          teacher: "Dr. Michael Brown",
                        },
                      ]
                    : [
                        {
                          subject: "Mathematics",
                          code: "MATH101",
                          marks: "85/100",
                          grade: "B+",
                          teacher: "Prof. Sarah Williams",
                        },
                        {
                          subject: "Science",
                          code: "SCI101",
                          marks: "90/100",
                          grade: "A-",
                          teacher: "Dr. Robert Chen",
                        },
                        {
                          subject: "English",
                          code: "ENG101",
                          marks: "88/100",
                          grade: "B+",
                          teacher: "Dr. Emily Parker",
                        },
                        {
                          subject: "Social Studies",
                          code: "SOC101",
                          marks: "92/100",
                          grade: "A",
                          teacher: "Prof. James Wilson",
                        },
                        { subject: "Art", code: "ART101", marks: "95/100", grade: "A", teacher: "Ms. Jennifer Lee" },
                      ]
                  ).map((result, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{result.subject}</TableCell>
                      <TableCell>{result.code}</TableCell>
                      <TableCell>{result.marks}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            result.grade.startsWith("A")
                              ? "bg-green-500 hover:bg-green-600"
                              : result.grade.startsWith("B")
                                ? "bg-blue-500 hover:bg-blue-600"
                                : result.grade.startsWith("C")
                                  ? "bg-yellow-500 hover:bg-yellow-600"
                                  : "bg-red-500 hover:bg-red-600"
                          }
                        >
                          {result.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>{result.teacher}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Breakdown</CardTitle>
              <CardDescription>Performance in different assessment types</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Midterm</TableHead>
                    <TableHead>Final</TableHead>
                    <TableHead>Assignments</TableHead>
                    <TableHead>Projects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(child === "emma"
                    ? [
                        {
                          subject: "Mathematics",
                          midterm: "90/100",
                          final: "94/100",
                          assignments: "92/100",
                          projects: "90/100",
                        },
                        {
                          subject: "Physics",
                          midterm: "85/100",
                          final: "90/100",
                          assignments: "88/100",
                          projects: "92/100",
                        },
                        {
                          subject: "English Literature",
                          midterm: "95/100",
                          final: "96/100",
                          assignments: "94/100",
                          projects: "95/100",
                        },
                        {
                          subject: "Computer Science",
                          midterm: "88/100",
                          final: "92/100",
                          assignments: "90/100",
                          projects: "94/100",
                        },
                        {
                          subject: "History",
                          midterm: "82/100",
                          final: "88/100",
                          assignments: "85/100",
                          projects: "90/100",
                        },
                      ]
                    : [
                        {
                          subject: "Mathematics",
                          midterm: "82/100",
                          final: "88/100",
                          assignments: "85/100",
                          projects: "88/100",
                        },
                        {
                          subject: "Science",
                          midterm: "88/100",
                          final: "92/100",
                          assignments: "90/100",
                          projects: "92/100",
                        },
                        {
                          subject: "English",
                          midterm: "85/100",
                          final: "90/100",
                          assignments: "88/100",
                          projects: "90/100",
                        },
                        {
                          subject: "Social Studies",
                          midterm: "90/100",
                          final: "94/100",
                          assignments: "92/100",
                          projects: "90/100",
                        },
                        {
                          subject: "Art",
                          midterm: "94/100",
                          final: "96/100",
                          assignments: "95/100",
                          projects: "98/100",
                        },
                      ]
                  ).map((result, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{result.subject}</TableCell>
                      <TableCell>{result.midterm}</TableCell>
                      <TableCell>{result.final}</TableCell>
                      <TableCell>{result.assignments}</TableCell>
                      <TableCell>{result.projects}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress Report</CardTitle>
              <CardDescription>Teacher comments and progress notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(child === "emma"
                ? [
                    {
                      teacher: "Prof. Sarah Williams",
                      subject: "Mathematics",
                      comment:
                        "Emma demonstrates excellent problem-solving skills and consistently performs at the top of her class. She shows a natural aptitude for advanced mathematical concepts and is always willing to help her peers.",
                    },
                    {
                      teacher: "Dr. Robert Chen",
                      subject: "Physics",
                      comment:
                        "Emma has shown good progress in understanding physics concepts. She performs well in practical experiments and is developing strong analytical skills. I would encourage her to focus more on theoretical aspects to improve her overall performance.",
                    },
                    {
                      teacher: "Dr. Emily Parker",
                      subject: "English Literature",
                      comment:
                        "Emma's writing skills are exceptional. She demonstrates a deep understanding of literary works and contributes thoughtfully to class discussions. Her analytical essays are well-structured and insightful.",
                    },
                  ]
                : [
                    {
                      teacher: "Prof. Sarah Williams",
                      subject: "Mathematics",
                      comment:
                        "Michael has shown steady improvement throughout the semester. He is diligent in completing his assignments and participates actively in class. With continued effort, he can further enhance his mathematical skills.",
                    },
                    {
                      teacher: "Dr. Robert Chen",
                      subject: "Science",
                      comment:
                        "Michael shows great enthusiasm for scientific experiments and practical work. He is curious and asks thoughtful questions. I would encourage him to focus more on connecting theoretical concepts with practical applications.",
                    },
                    {
                      teacher: "Dr. Emily Parker",
                      subject: "English",
                      comment:
                        "Michael has a creative approach to writing assignments. His vocabulary is expanding, and he is becoming more confident in expressing his ideas. He should continue to work on grammar and sentence structure.",
                    },
                  ]
              ).map((report, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{report.teacher}</p>
                      <p className="text-sm text-muted-foreground">{report.subject}</p>
                    </div>
                    <Badge variant="outline">Progress Report</Badge>
                  </div>
                  <p className="mt-2 text-sm">{report.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

