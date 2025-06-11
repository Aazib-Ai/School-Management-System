"use client"

import { useState, useEffect } from "react"
import {
  BookOpen,
  Edit,
  Plus,
  Search,
  Trash,
  Users,
  School,
  GraduationCap,
  UserPlus,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { User } from "@/types"

interface LocalClass {
  id: string
  className: string
  teacherId: string
  status: string
  grade: string
  students: number
  subjects: LocalSubject[] | any[]
  teacher: string
  room: string
  capacity: number
  academicYear: string
}

interface LocalSubject {
  id: string
  subjectName: string
  subjectCode: string
  teacherId: string
  classId: string
  isAvailableForEnrollment: boolean
  isVisibleToStudents: boolean
  teacher: string
  students: number
  schedule: string
  room: string
  status: string
}

interface StudentUser extends User {
  grade?: string
  attendance?: number
  enrolled?: boolean
}

// Extend the User interface to include isClassTeacher property
interface TeacherUser extends User {
  isClassTeacher?: boolean
}

export default function ClassManagementPage() {
  // State for active tab
  const [activeTab, setActiveTab] = useState("classes")

  // State for data
  const [classes, setClasses] = useState<LocalClass[]>([])
  const [subjects, setSubjects] = useState<LocalSubject[]>([])
  const [students, setStudents] = useState<StudentUser[]>([])
  const [teachers, setTeachers] = useState<TeacherUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for classes tab
  const [gradeFilter, setGradeFilter] = useState<string>("")
  const [classSearchQuery, setClassSearchQuery] = useState("")
  const [showClassDialog, setShowClassDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<LocalClass | null>(null)

  // State for subjects tab
  const [selectedClassForSubjects, setSelectedClassForSubjects] = useState<string>("")
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("")
  const [showSubjectDialog, setShowSubjectDialog] = useState(false)

  // State for enrollments tab
  const [selectedClassForEnrollments, setSelectedClassForEnrollments] = useState("")
  const [selectedSubjectForEnrollments, setSelectedSubjectForEnrollments] = useState<string>("")
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState("")
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false)

  // State for new class
  const [newClassName, setNewClassName] = useState("")
  const [selectedTeacherId, setSelectedTeacherId] = useState("")
  const [newSubjectName, setNewSubjectName] = useState("")

  // Add these state variables at the top with other states
  const [newGrade, setNewGrade] = useState("")
  const [newRoom, setNewRoom] = useState("")
  const [newCapacity, setNewCapacity] = useState("")
  const [newAcademicYear, setNewAcademicYear] = useState("")

  // Add these state variables for subject form
  const [newSubjectCode, setNewSubjectCode] = useState("")
  const [newSubjectTeacherId, setNewSubjectTeacherId] = useState("")
  const [newSubjectSchedule, setNewSubjectSchedule] = useState("")
  const [newSubjectRoomId, setNewSubjectRoomId] = useState("")
  const [isSubjectVisible, setIsSubjectVisible] = useState(true)
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(true)

  // Add this state for selected subject for editing
  const [selectedSubject, setSelectedSubject] = useState<LocalSubject | null>(null)

  // Add this before the useEffect
  const fetchClasses = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/classes")
      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.statusText}`)
      }
      const data = await response.json()
      setClasses(data)
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Update the useEffect to use fetchClasses
  useEffect(() => {
    fetchClasses()
  }, [])

  // Fetch subjects when a class is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClassForSubjects) return

      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/subjects?classId=${selectedClassForSubjects}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch subjects: ${response.statusText}`)
        }
        const data = await response.json()
        setSubjects(data)
      } catch (error: any) {
        setError(error.message)
        toast({
          title: "Error",
          description: error.message,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [selectedClassForSubjects])

  // Fetch students for a subject
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedSubjectForEnrollments) return

      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/enrollments?subjectId=${selectedSubjectForEnrollments}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.statusText}`)
        }
        const data = await response.json()
        setStudents(data)
      } catch (error: any) {
        setError(error.message)
        toast({
          title: "Error",
          description: error.message,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [selectedSubjectForEnrollments])

  // Fetch teachers for class creation
  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/users?role=teacher")
        if (!response.ok) {
          throw new Error(`Failed to fetch teachers: ${response.statusText}`)
        }
        const data = await response.json()
        console.log("Fetched teachers:", data) // Add this for debugging
        setTeachers(data)
      } catch (error: any) {
        setError(error.message)
        toast({
          title: "Error",
          description: error.message,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [])

  // Handle adding a class
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/classes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: newClassName,
          teacherId: selectedTeacherId,
          grade: newGrade,
          room: newRoom,
          capacity: parseInt(newCapacity),
          academicYear: newAcademicYear,
          status: "active"
        }),
      })

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(`Failed to add class: ${response.statusText} - ${responseData.error || "Unknown error"}`)
      }

      // Reset form
      setNewClassName("")
      setSelectedTeacherId("")
      setNewGrade("")
      setNewRoom("")
      setNewCapacity("")
      setNewAcademicYear("")
      setShowClassDialog(false)
      
      // Refresh classes
      fetchClasses()
      
      // Refresh teachers to update their status
      const refreshTeachers = async () => {
        const response = await fetch("/api/users?role=teacher")
        if (response.ok) {
          const data = await response.json()
          setTeachers(data)
        }
      }
      refreshTeachers()

    toast({
        title: "Success",
        description: "Class added successfully",
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle adding a subject
  const handleAddSubject = async () => {
    if (!selectedClassForSubjects || !newSubjectName || !newSubjectCode || !newSubjectTeacherId || !newSubjectSchedule || !newSubjectRoomId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to add a subject."
      })
      return
    }

    try {
      // Add subject using the unified endpoint
      const response = await fetch('/api/teachers/subjects/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teacherId: newSubjectTeacherId,
          classId: selectedClassForSubjects,
          subjectName: newSubjectName,
          subjectCode: newSubjectCode,
          schedule: newSubjectSchedule,
          roomId: newSubjectRoomId,
          isAvailableForEnrollment: isEnrollmentOpen,
          isVisibleToStudents: isSubjectVisible,
          status: "active"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add subject');
      }

      const result = await response.json();

      // Update the local state
      setClasses(classes.map(cls => 
        cls.id === selectedClassForSubjects 
          ? { 
              ...cls, 
              subjects: [...(cls.subjects || []), result.subject]
            } 
          : cls
      ));

      // Update subjects state
      setSubjects([...subjects, result.subject]);

      toast({
        title: "Subject Added",
        description: "The subject has been added successfully.",
      });

      // Reset form
      setNewSubjectName("");
      setNewSubjectCode("");
      setNewSubjectTeacherId("");
      setNewSubjectSchedule("");
      setNewSubjectRoomId("");
      setIsSubjectVisible(true);
      setIsEnrollmentOpen(true);
      setShowSubjectDialog(false);
    } catch (error) {
      console.error("Error adding subject:", error);
      toast({
        title: "Addition Failed",
        description: "There was an error adding the subject. Please try again."
      });
    }
  };

  // Handle deleting a class
  const handleDeleteClass = async (classId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to delete class: ${errorData.error || "Unknown error"}`)
      }

      // Refresh the classes list
      await fetchClasses()
      
      // Refresh teachers to update their status
      const refreshTeachers = async () => {
        const response = await fetch("/api/users?role=teacher")
        if (response.ok) {
          const data = await response.json()
          setTeachers(data)
        }
      }
      refreshTeachers()

    toast({
        title: "Success",
        description: "Class deleted successfully",
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle deleting a subject
  const handleDeleteSubject = async (subjectId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove subject');
      }

      // Update the local state with null check for subjects array
      setClasses(classes.map(cls => 
        cls.id === selectedClassForSubjects 
          ? { 
              ...cls, 
              subjects: Array.isArray(cls.subjects) ? cls.subjects.filter(subject => subject.id !== subjectId) : []
            } 
          : cls
      ));

      // Update subjects state
      setSubjects(subjects.filter(subject => subject.id !== subjectId));

      toast({
        title: "Subject Removed",
        description: "The subject has been removed successfully.",
      });
    } catch (error) {
      console.error("Error removing subject:", error);
      toast({
        title: "Removal Failed",
        description: "There was an error removing the subject. Please try again."
      });
    } finally {
      setLoading(false)
    }
  };

  // Handle toggling subject visibility
  const handleToggleVisibility = async (subjectId: string, isVisible: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisibleToStudents: !isVisible }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update subject visibility: ${response.statusText}`)
      }

      // Refresh subjects
      const fetchSubjects = async () => {
        const response = await fetch(`/api/subjects?classId=${selectedClassForSubjects}`)
        if (response.ok) {
          const data = await response.json()
          setSubjects(data)
        }
      }
      fetchSubjects()

      toast({
        title: "Success",
        description: "Subject visibility updated successfully",
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle enrolling a student
  const handleEnrollStudent = async (subjectId: string, studentId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/enrollments/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, studentId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to enroll student: ${response.statusText}`)
      }

    toast({
        title: "Success",
        description: "Student enrolled successfully",
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle unenrolling a student
  const handleUnenrollStudent = async (subjectId: string, studentId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/enrollments/${studentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to unenroll student: ${response.statusText}`)
      }

    toast({
        title: "Success",
        description: "Student unenrolled successfully",
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter classes based on grade filter and search query
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch = cls.className?.toLowerCase().includes(classSearchQuery?.toLowerCase() || "") ?? false
    const matchesGrade = !gradeFilter || cls.grade === gradeFilter
    return matchesSearch && matchesGrade
  })

  // Filter subjects based on search query
  const filteredSubjects = subjects.filter((subject) =>
    subject.subjectName.toLowerCase().includes(subjectSearchQuery.toLowerCase())
  )

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(enrollmentSearchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(enrollmentSearchQuery.toLowerCase())
  )

  // Update the button click handler
  const handleClassDialogSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (newClassName && selectedTeacherId) {
      handleAddClass(e)
    }
  }

  // Update the enrollment button handler
  const handleEnrollmentButtonClick = (e: React.MouseEvent<HTMLButtonElement>, subjectId: string, studentId: string) => {
    e.preventDefault()
    handleEnrollStudent(subjectId, studentId)
  }

  // Add this handler before the return statement
  const handleSaveEnrollments = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (selectedSubjectForEnrollments) {
      // Handle bulk enrollments here
    }
  }

  // Add this before the handleAddClass function
  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/classes/${selectedClass?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: newClassName,
          teacherId: selectedTeacherId,
          grade: newGrade,
          room: newRoom,
          capacity: parseInt(newCapacity),
          academicYear: newAcademicYear,
          status: "active"
        }),
      })

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(`Failed to update class: ${response.statusText} - ${responseData.error || "Unknown error"}`)
      }

      // Reset form
      setNewClassName("")
      setSelectedTeacherId("")
      setNewGrade("")
      setNewRoom("")
      setNewCapacity("")
      setNewAcademicYear("")
      setSelectedClass(null)
      setShowClassDialog(false)
      
      // Refresh classes
      fetchClasses()
      
      // Refresh teachers to update their status
      const refreshTeachers = async () => {
        const response = await fetch("/api/users?role=teacher")
        if (response.ok) {
          const data = await response.json()
          setTeachers(data)
        }
      }
      refreshTeachers()

      toast({
        title: "Success",
        description: "Class updated successfully",
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Add this function to handle edit button click
  const handleEditButtonClick = (cls: LocalClass) => {
    setSelectedClass(cls)
    setNewClassName(cls.className)
    setSelectedTeacherId(cls.teacherId)
    setNewGrade(cls.grade)
    setNewRoom(cls.room)
    setNewCapacity(cls.capacity.toString())
    setNewAcademicYear(cls.academicYear)
    setShowClassDialog(true)
  }

  // Add this function to handle edit subject button click
  const handleEditSubjectButtonClick = (subject: LocalSubject) => {
    setSelectedSubject(subject)
    setNewSubjectName(subject.subjectName)
    setNewSubjectCode(subject.subjectCode)
    setNewSubjectTeacherId(subject.teacherId)
    setNewSubjectSchedule(subject.schedule || "")
    setNewSubjectRoomId(subject.room)
    setIsSubjectVisible(subject.isAvailableForEnrollment)
    setIsEnrollmentOpen(subject.isAvailableForEnrollment)
    setShowSubjectDialog(true)
  }

  // Add this function to handle edit subject submission
  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSubject) {
      toast({
        title: "Error",
        description: "No subject selected for editing",
      })
      return
    }

    if (!newSubjectName || !newSubjectCode) {
      toast({
        title: "Error",
        description: "Subject name and code are required",
      })
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/subjects/${selectedSubject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectName: newSubjectName,
          subjectCode: newSubjectCode,
          teacherId: newSubjectTeacherId,
          schedule: newSubjectSchedule,
          roomId: newSubjectRoomId,
          isAvailableForEnrollment: isEnrollmentOpen,
          isVisibleToStudents: isSubjectVisible,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to update subject: ${response.statusText} - ${errorData.error || "Unknown error"}`)
      }

      // Reset form
      setNewSubjectName("")
      setNewSubjectCode("")
      setNewSubjectTeacherId("")
      setNewSubjectSchedule("")
      setNewSubjectRoomId("")
      setIsSubjectVisible(true)
      setIsEnrollmentOpen(true)
      setSelectedSubject(null)
      setShowSubjectDialog(false)
      
      // Refresh subjects
      const fetchSubjects = async () => {
        const response = await fetch(`/api/subjects?classId=${selectedClassForSubjects}`)
        if (response.ok) {
          const data = await response.json()
          setSubjects(data)
        }
      }
      fetchSubjects()

      toast({
        title: "Success",
        description: "Subject updated successfully",
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Add this function to handle toggling enrollment
  const handleToggleEnrollment = async (subjectId: string, isEnrollmentOpen: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailableForEnrollment: !isEnrollmentOpen }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update enrollment status: ${response.statusText}`)
      }

      // Refresh subjects
      const fetchSubjects = async () => {
        const response = await fetch(`/api/subjects?classId=${selectedClassForSubjects}`)
        if (response.ok) {
          const data = await response.json()
          setSubjects(data)
        }
      }
      fetchSubjects()

      toast({
        title: "Success",
        description: "Enrollment status updated successfully",
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
        <p className="text-muted-foreground">Manage classes, subjects, and student enrollments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            <span>Classes</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Subjects</span>
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Enrollments</span>
          </TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
              <CardDescription>View and manage all classes in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search classes..."
                      className="pl-8"
                      value={classSearchQuery}
                      onChange={(e) => setClassSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      <SelectItem value="Grade 1">Grade 1</SelectItem>
                      <SelectItem value="Grade 2">Grade 2</SelectItem>
                      <SelectItem value="Grade 3">Grade 3</SelectItem>
                      <SelectItem value="Grade 4">Grade 4</SelectItem>
                      <SelectItem value="Grade 5">Grade 5</SelectItem>
                      <SelectItem value="Grade 6">Grade 6</SelectItem>
                      <SelectItem value="Grade 7">Grade 7</SelectItem>
                      <SelectItem value="Grade 8">Grade 8</SelectItem>
                      <SelectItem value="Grade 9">Grade 9</SelectItem>
                      <SelectItem value="Grade 10">Grade 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{selectedClass ? "Edit Class" : "Add New Class"}</DialogTitle>
                      <DialogDescription>
                        {selectedClass 
                          ? "Update the class details. Click save when you're done."
                          : "Enter the details for the new class. Click save when you're done."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={selectedClass ? handleEditClass : handleAddClass}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="class-name" className="text-right">
                          Class Name
                        </Label>
                          <Input
                            id="class-name"
                            placeholder="e.g. Grade 9C"
                            className="col-span-3"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            required
                          />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="grade" className="text-right">
                          Grade
                        </Label>
                          <Select value={newGrade} onValueChange={setNewGrade} required>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Grade 1">Grade 1</SelectItem>
                              <SelectItem value="Grade 2">Grade 2</SelectItem>
                              <SelectItem value="Grade 3">Grade 3</SelectItem>
                              <SelectItem value="Grade 4">Grade 4</SelectItem>
                              <SelectItem value="Grade 5">Grade 5</SelectItem>
                              <SelectItem value="Grade 6">Grade 6</SelectItem>
                              <SelectItem value="Grade 7">Grade 7</SelectItem>
                              <SelectItem value="Grade 8">Grade 8</SelectItem>
                              <SelectItem value="Grade 9">Grade 9</SelectItem>
                              <SelectItem value="Grade 10">Grade 10</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="room" className="text-right">
                          Room
                        </Label>
                          <Input
                            id="room"
                            placeholder="e.g. Room 103"
                            className="col-span-3"
                            value={newRoom}
                            onChange={(e) => setNewRoom(e.target.value)}
                            required
                          />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="capacity" className="text-right">
                          Capacity
                        </Label>
                          <Input
                            id="capacity"
                            type="number"
                            placeholder="e.g. 30"
                            className="col-span-3"
                            value={newCapacity}
                            onChange={(e) => setNewCapacity(e.target.value)}
                            required
                          />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="teacher" className="text-right">
                          Class Teacher
                        </Label>
                          <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} required>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                              {teachers
                                .filter(teacher => 
                                  // Include teachers who are not class teachers
                                  !teacher.isClassTeacher || 
                                  // Or include the current teacher if editing
                                  (selectedClass && teacher.id === selectedClass.teacherId)
                                )
                                .map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.name}
                                </SelectItem>
                              ))}
                              {teachers.filter(teacher => 
                                !teacher.isClassTeacher || 
                                (selectedClass && teacher.id === selectedClass.teacherId)
                              ).length === 0 && (
                                <div className="p-2 text-center text-muted-foreground">
                                  No available teachers. All teachers are already assigned as class teachers.
                                </div>
                              )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="academic-year" className="text-right">
                          Academic Year
                        </Label>
                          <Input
                            id="academic-year"
                            placeholder="e.g. 2023-2024"
                            className="col-span-3"
                            value={newAcademicYear}
                            onChange={(e) => setNewAcademicYear(e.target.value)}
                            required
                          />
                      </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => {
                          setShowClassDialog(false)
                          setSelectedClass(null)
                          setNewClassName("")
                          setSelectedTeacherId("")
                          setNewGrade("")
                          setNewRoom("")
                          setNewCapacity("")
                          setNewAcademicYear("")
                        }}>
                        Cancel
                      </Button>
                        <Button type="submit">
                          {selectedClass ? "Update" : "Save"}
                        </Button>
                    </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Subjects</TableHead>
                      <TableHead>Class Teacher</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((cls) => (
                      <TableRow key={cls.id} className={cls.status === "inactive" ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="font-medium">{cls.className}</div>
                        </TableCell>
                        <TableCell>{cls.grade}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{cls.students}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{Array.isArray(cls.subjects) ? cls.subjects.length : 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>{cls.teacher}</TableCell>
                        <TableCell>{cls.room}</TableCell>
                        <TableCell>
                          <Badge
                            variant={cls.status === "active" ? "default" : "secondary"}
                            className={cls.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {(cls.status || "Unknown").charAt(0).toUpperCase() + (cls.status || "Unknown").slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedClassForSubjects(cls.id)
                                setActiveTab("subjects")
                              }}
                            >
                              <BookOpen className="h-4 w-4" />
                              <span className="sr-only">View Subjects</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditButtonClick(cls)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteClass(cls.id)}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredClasses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No classes found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
              <CardDescription>Manage subjects for a specific class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="class-select" className="mb-2 block">
                    Select Class
                  </Label>
                  <Select value={selectedClassForSubjects} onValueChange={setSelectedClassForSubjects}>
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
                  <Label className="mb-2 block">Search Subjects</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search subjects..."
                      className="pl-8"
                      value={subjectSearchQuery}
                      onChange={(e) => setSubjectSearchQuery(e.target.value)}
                      disabled={!selectedClassForSubjects}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
                    <DialogTrigger asChild>
                      <Button disabled={!selectedClassForSubjects}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Subject
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>{selectedSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
                        <DialogDescription>
                          {selectedSubject 
                            ? "Update the subject details. Click save when you're done."
                            : "Enter the details for the new subject. Click save when you're done."}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={selectedSubject ? handleEditSubject : handleAddSubject}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="subject-name" className="text-right">
                            Subject Name
                          </Label>
                            <Input 
                              id="subject-name" 
                              placeholder="e.g. Mathematics 101" 
                              className="col-span-3"
                              value={newSubjectName}
                              onChange={(e) => setNewSubjectName(e.target.value)}
                              required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="subject-code" className="text-right">
                            Subject Code
                          </Label>
                            <Input 
                              id="subject-code" 
                              placeholder="e.g. MATH101" 
                              className="col-span-3"
                              value={newSubjectCode}
                              onChange={(e) => setNewSubjectCode(e.target.value)}
                              required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="subject-teacher" className="text-right">
                            Teacher
                          </Label>
                            <Select value={newSubjectTeacherId} onValueChange={setNewSubjectTeacherId}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="schedule" className="text-right">
                            Schedule
                          </Label>
                            <Input 
                              id="schedule" 
                              placeholder="e.g. Mon, Wed 9:00-10:30 AM" 
                              className="col-span-3"
                              value={newSubjectSchedule}
                              onChange={(e) => setNewSubjectSchedule(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="room" className="text-right">
                            Room
                          </Label>
                            <Input 
                              id="room" 
                              placeholder="e.g. R101" 
                              className="col-span-3"
                              value={newSubjectRoomId}
                              onChange={(e) => setNewSubjectRoomId(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <div className="text-right">
                            <Label>Options</Label>
                          </div>
                          <div className="col-span-3 space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="visible" 
                                  checked={isSubjectVisible}
                                  onCheckedChange={(checked) => setIsSubjectVisible(checked === true)}
                                />
                              <Label htmlFor="visible">Visible to students</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="enrollment" 
                                  checked={isEnrollmentOpen}
                                  onCheckedChange={(checked) => setIsEnrollmentOpen(checked === true)}
                                />
                              <Label htmlFor="enrollment">Open for enrollment</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => {
                            setShowSubjectDialog(false)
                            setSelectedSubject(null)
                            setNewSubjectName("")
                            setNewSubjectCode("")
                            setNewSubjectTeacherId("")
                            setNewSubjectSchedule("")
                            setNewSubjectRoomId("")
                            setIsSubjectVisible(true)
                            setIsEnrollmentOpen(true)
                          }}>
                          Cancel
                        </Button>
                          <Button type="submit">
                            {selectedSubject ? "Update" : "Save"}
                          </Button>
                      </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {selectedClassForSubjects ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Enrollment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubjects.length > 0 ? (
                        filteredSubjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell>
                              <div className="font-medium">{subject.subjectName}</div>
                            </TableCell>
                            <TableCell>{subject.subjectCode}</TableCell>
                            <TableCell>{subject.teacher}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{subject.students}</span>
                              </div>
                            </TableCell>
                            <TableCell>{subject.schedule || "Not scheduled"}</TableCell>
                            <TableCell>{subject.room || "Not assigned"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={subject.status === "active" ? "default" : "secondary"}
                                className={subject.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                              >
                                {subject.status.charAt(0).toUpperCase() + subject.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={subject.isVisibleToStudents ? "text-green-500" : "text-muted-foreground"}
                                onClick={() => handleToggleVisibility(subject.id, subject.isVisibleToStudents)}
                              >
                                {subject.isVisibleToStudents ? (
                                  <Eye className="h-4 w-4 mr-1" />
                                ) : (
                                  <EyeOff className="h-4 w-4 mr-1" />
                                )}
                                {subject.isVisibleToStudents ? "Visible" : "Hidden"}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={subject.isAvailableForEnrollment ? "text-green-500" : "text-muted-foreground"}
                                onClick={() => handleToggleEnrollment(subject.id, subject.isAvailableForEnrollment)}
                              >
                                {subject.isAvailableForEnrollment ? (
                                  <Check className="h-4 w-4 mr-1" />
                                ) : (
                                  <X className="h-4 w-4 mr-1" />
                                )}
                                {subject.isAvailableForEnrollment ? "Open" : "Closed"}
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedClassForEnrollments(selectedClassForSubjects)
                                    setSelectedSubjectForEnrollments(subject.id)
                                    setActiveTab("enrollments")
                                  }}
                                >
                                  <Users className="h-4 w-4" />
                                  <span className="sr-only">Manage Enrollments</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditSubjectButtonClick(subject)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteSubject(subject.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={10} className="h-24 text-center">
                            {subjects.length === 0
                              ? "No subjects have been added to this class yet."
                              : "No subjects found matching your search criteria."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium">Select a class to view subjects</h3>
                  <p className="max-w-md mt-2">
                    Choose a class from the dropdown above to view and manage subjects for that class.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrollments Tab */}
        <TabsContent value="enrollments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Enrollments</CardTitle>
              <CardDescription>Manage student enrollments for a specific subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div>
                  <Label htmlFor="enrollment-class-select" className="mb-2 block">
                    Select Class
                  </Label>
                  <Select value={selectedClassForEnrollments} onValueChange={setSelectedClassForEnrollments}>
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
                <div>
                  <Label htmlFor="enrollment-subject-select" className="mb-2 block">
                    Select Subject
                  </Label>
                  <Select
                    value={selectedSubjectForEnrollments}
                    onValueChange={setSelectedSubjectForEnrollments}
                    disabled={!selectedClassForEnrollments}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClassForEnrollments &&
                        subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.subjectName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search students..."
                      className="pl-8"
                      value={enrollmentSearchQuery}
                      onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                      disabled={!selectedClassForEnrollments || !selectedSubjectForEnrollments}
                    />
                  </div>
                </div>
                <Dialog open={showEnrollmentDialog} onOpenChange={setShowEnrollmentDialog}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedClassForEnrollments || !selectedSubjectForEnrollments}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Manage Enrollments
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Manage Student Enrollments</DialogTitle>
                      <DialogDescription>Select or deselect students to enroll them in this subject.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Search students..."
                            className="pl-8"
                            value={enrollmentSearchQuery}
                            onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <ScrollArea className="h-[300px] rounded-md border">
                        <div className="p-4">
                          {filteredStudents.map((student) => (
                            <div key={student.id} className="flex items-center space-x-2 py-2 border-b last:border-0">
                              <Checkbox id={`student-${student.id}`} checked={student.enrolled} />
                              <Label htmlFor={`student-${student.id}`} className="flex-1 flex justify-between">
                                <span>{student.name}</span>
                                <span className="text-muted-foreground">{student.rollNumber}</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowEnrollmentDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEnrollments}>Save Enrollments</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {selectedClassForEnrollments && selectedSubjectForEnrollments ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="font-medium">{student.name}</div>
                            </TableCell>
                            <TableCell>{student.rollNumber}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{student.grade}</Badge>
                            </TableCell>
                            <TableCell>{student.attendance}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={(e) => handleEnrollmentButtonClick(e, selectedSubjectForEnrollments, student.id)}
                                disabled={loading}
                              >
                                {student.enrolled ? "Unenroll" : "Enroll"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            {students.length === 0
                              ? "No students are enrolled in this subject yet."
                              : "No students found matching your search criteria."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium">Select a class and subject to view enrollments</h3>
                  <p className="max-w-md mt-2">
                    Choose a class and subject from the dropdowns above to view and manage student enrollments.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

