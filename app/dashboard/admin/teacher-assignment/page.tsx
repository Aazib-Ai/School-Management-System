"use client"

import { useState, useEffect } from "react"
import { BookOpen, Search, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string;
  classId: string;
  teacher: string;
  schedule: string;
  room: string;
  isAvailableForEnrollment: boolean;
  isVisibleToStudents: boolean;
  status: string;
  students: number;
  createdAt: any;
}

export default function TeacherAssignmentPage() {
  // State for assignments
  const [selectedClassForAssignments, setSelectedClassForAssignments] = useState("")
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch classes on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch classes
        const classesResponse = await fetch('/api/classes')
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes')
        }
        const classesData = await classesResponse.json()
        setClasses(classesData)

        setError(null)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data. Please try again later.')
        setClasses([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch subjects when a class is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClassForAssignments) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/subjects?classId=${selectedClassForAssignments}`);
        if (!response.ok) {
          throw new Error('Failed to fetch subjects');
        }
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast({
          title: "Error",
          description: "Failed to fetch subjects",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClassForAssignments]);

  // Filter subjects based on search query
  const filteredSubjects = subjects.filter((subject) =>
    subject.subjectName.toLowerCase().includes(assignmentSearchQuery.toLowerCase()) ||
    subject.teacher.toLowerCase().includes(assignmentSearchQuery.toLowerCase())
  );

  // Handle removing an assignment
  const handleRemoveAssignment = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove assignment');
      }

      // Update the local state
      setSubjects(subjects.filter(subject => subject.id !== subjectId));

      toast({
        title: "Assignment Removed",
        description: "The class assignment has been removed successfully.",
      });
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast({
        title: "Removal Failed",
        description: "There was an error removing the assignment. Please try again."
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Assignments</h1>
        <p className="text-muted-foreground">View and manage teacher assignments for classes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Assignments</CardTitle>
          <CardDescription>View and manage all class assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="class-select" className="mb-2 block">
                Select Class
              </Label>
              <Select value={selectedClassForAssignments} onValueChange={setSelectedClassForAssignments}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-2 block">Search Assignments</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by subject or teacher..."
                  className="pl-8"
                  value={assignmentSearchQuery}
                  onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                  disabled={!selectedClassForAssignments}
                />
              </div>
            </div>
          </div>

          {selectedClassForAssignments ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell>
                          <div className="font-medium">
                            {classes.find(cls => cls.id === subject.classId)?.className || "Unknown Class"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{subject.subjectName}</div>
                          <div className="text-sm text-muted-foreground">{subject.subjectCode}</div>
                        </TableCell>
                        <TableCell>{subject.teacher || "Not assigned"}</TableCell>
                        <TableCell>{subject.schedule || "Not scheduled"}</TableCell>
                        <TableCell>{subject.room || "Not assigned"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleRemoveAssignment(subject.id)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {subjects.length === 0
                          ? "No subjects have been assigned to this class yet."
                          : "No assignments found matching your search criteria."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium">Select a class to view assignments</h3>
              <p className="max-w-md mt-2">
                Choose a class from the dropdown above to view and manage class assignments.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

