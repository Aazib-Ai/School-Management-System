"use client"

import { useEffect, useState } from "react"
import { Download, FileText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"

interface ClassData {
  id: string
  name: string
  subjects: SubjectData[]
}

interface SubjectData {
  id: string
  name: string
}

interface StudentResult {
  id: string
  name: string
  rollNumber: string
  subjects: Record<string, { marks: number, letterGrade: string }>
  average: number
}

export default function ResultManagementPage() {
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for API data
  const [classes, setClasses] = useState<ClassData[]>([])
  const [students, setStudents] = useState<StudentResult[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])

  // Fetch classes when component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/results/classes')
        
        if (!response.ok) {
          throw new Error('Failed to fetch classes')
        }
        
        const data = await response.json()
        setClasses(data.classes)
      } catch (error) {
        console.error('Error fetching classes:', error)
        setError('Failed to load classes. Please try again.')
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to load classes',
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchClasses()
  }, [])

  // Fetch class data when selected class changes
  useEffect(() => {
    const fetchClassData = async () => {
      if (!selectedClass) return
      
      try {
        setLoading(true)
        setError(null)
        
        const classObj = classes.find(c => c.id === selectedClass)
        if (!classObj) throw new Error('Class not found')
        
        const response = await fetch(`/api/results/class?className=${encodeURIComponent(classObj.name)}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch class data')
        }
        
        const data = await response.json()
        setStudents(data.students)
        setSubjects(data.subjects)
      } catch (error) {
        console.error('Error fetching class data:', error)
        setError('Failed to load class data. Please try again.')
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to load class data',
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchClassData()
  }, [selectedClass, classes])

  const getGradeFromMarks = (marks: number) => {
    if (marks >= 90) return "A"
    if (marks >= 80) return "B"
    if (marks >= 70) return "C"
    if (marks >= 60) return "D"
    return "F"
  }

  const getFilteredStudents = () => {
    if (!selectedClass || !students.length) return []

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const getSubjects = () => {
    if (!selectedClass) return []
    return subjects
  }

  const getSubjectColumns = () => {
    if (!selectedClass) return []

    const subjectsData = getSubjects()

    if (selectedSubject && selectedSubject !== "all") {
      return subjectsData.filter((subject) => subject.id === selectedSubject)
    }

    return subjectsData
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Result Management</h1>
        <p className="text-muted-foreground">View and manage student results</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Results Overview</CardTitle>
          <CardDescription>Select class and subject to view results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Class</label>
              <Select
                value={selectedClass}
                onValueChange={(value) => {
                  setSelectedClass(value)
                  setSelectedSubject("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Subject (Optional)</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {getSubjects().map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search Students</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or ID..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!selectedClass}
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                disabled={!selectedClass || getFilteredStudents().length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Results
              </Button>
            </div>
          </div>

          {loading && selectedClass ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-muted-foreground">Loading results...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : selectedClass ? (
            <div className="rounded-lg border">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-[200px]">Student Name</TableHead>
                      <TableHead className="w-[120px]">Roll Number</TableHead>
                      {getSubjectColumns().map((subject) => (
                        <TableHead key={subject.id} className="min-w-[120px]">
                          {subject.name}
                        </TableHead>
                      ))}
                      {(!selectedSubject || selectedSubject === "all") && (
                        <TableHead className="min-w-[120px]">Average</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredStudents().length > 0 ? (
                      getFilteredStudents().map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.rollNumber}</TableCell>
                          
                          {getSubjectColumns().map((subject) => (
                            <TableCell key={subject.id}>
                              {student.subjects[subject.id] ? (
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={
                                      student.subjects[subject.id].marks >= 90
                                        ? "bg-green-500 hover:bg-green-600"
                                        : student.subjects[subject.id].marks >= 80
                                          ? "bg-blue-500 hover:bg-blue-600"
                                          : student.subjects[subject.id].marks >= 70
                                            ? "bg-yellow-500 hover:bg-yellow-600"
                                            : "bg-red-500 hover:bg-red-600"
                                    }
                                  >
                                    {student.subjects[subject.id].marks}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    ({student.subjects[subject.id].letterGrade})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                          ))}
                          
                          {(!selectedSubject || selectedSubject === "all") && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={
                                    student.average >= 90
                                      ? "bg-green-500 hover:bg-green-600"
                                      : student.average >= 80
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : student.average >= 70
                                          ? "bg-yellow-500 hover:bg-yellow-600"
                                          : "bg-red-500 hover:bg-red-600"
                                  }
                                >
                                  {student.average}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  ({getGradeFromMarks(student.average)})
                                </span>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={getSubjectColumns().length + (selectedSubject ? 2 : 3)}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {selectedClass && !students.length
                            ? "No results available for this class yet."
                            : "No results found. Please adjust your search criteria."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium">Select a class to view results</h3>
              <p className="max-w-md mt-2">
                Choose a class from the dropdown above to view student results. You can further filter by subject or
                search for specific students.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClass && getFilteredStudents().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Class Performance Summary</CardTitle>
            <CardDescription>
              {classes.find((cls) => cls.id === selectedClass)?.name} -
              {selectedSubject && selectedSubject !== "all"
                ? ` ${subjects.find((sub) => sub.id === selectedSubject)?.name}`
                : " All Subjects"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{getFilteredStudents().length}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Class Average</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    getFilteredStudents().reduce((sum, student) => sum + student.average, 0) /
                      getFilteredStudents().length,
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.max(...getFilteredStudents().map((student) => student.average))}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-sm font-medium text-muted-foreground">Lowest Score</p>
                <p className="text-2xl font-bold text-red-600">
                  {Math.min(...getFilteredStudents().map((student) => student.average))}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
                <div className="space-y-2">
                  {["A", "B", "C", "D", "F"].map((grade) => {
                    const count = getFilteredStudents().filter((student) => {
                      const avgGrade = getGradeFromMarks(student.average)
                      return avgGrade === grade
                    }).length

                    const percentage = Math.round((count / getFilteredStudents().length) * 100)

                    return (
                      <div key={grade} className="flex items-center gap-2">
                        <div className="w-8 text-center font-medium">{grade}</div>
                        <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              grade === "A"
                                ? "bg-green-500"
                                : grade === "B"
                                  ? "bg-blue-500"
                                  : grade === "C"
                                    ? "bg-yellow-500"
                                    : grade === "D"
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm">{percentage}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
                <div className="space-y-2">
                  {getSubjects().map((subject) => {
                    let total = 0
                    let count = 0
                    
                    getFilteredStudents().forEach((student) => {
                      if (student.subjects[subject.id]) {
                        total += student.subjects[subject.id].marks
                        count++
                      }
                    })
                    
                    const average = count ? Math.round(total / count) : 0
                    
                    return (
                      <div key={subject.id} className="flex items-center gap-2">
                        <div className="w-24 truncate font-medium">{subject.name}</div>
                        <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              average >= 90
                                ? "bg-green-500"
                                : average >= 80
                                  ? "bg-blue-500"
                                  : average >= 70
                                    ? "bg-yellow-500"
                                    : average >= 60
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                            }`}
                            style={{ width: `${average}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-sm">{average}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

