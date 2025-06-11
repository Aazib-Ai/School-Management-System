"use client"

import { useState, useEffect } from "react"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, increment } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Subject {
  id: string
  subjectName: string
  subjectCode: string
  teacher: string
  teacherId: string
  classId: string
  schedule?: string
  credits?: number
  isAvailableForEnrollment: boolean
  isVisibleToStudents: boolean
  status: string
  students: number
}

interface StudentData {
  id: string
  name: string
  rollNumber: string
  grade: string
  enrolledSubjects?: string[]
}

export default function SubjectsPage() {
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const router = useRouter()

  // Fetch student data and subjects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch the authenticated user data
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Important for sending cookies
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch user data')
        }

        const userData = await response.json()
        
        if (userData.role !== 'student') {
          router.push('/login')
          return
        }

        // Use the data directly from the API
        const student = {
          id: userData.id,
          name: userData.name,
          rollNumber: userData.rollNumber || "",
          grade: userData.grade || "",
          enrolledSubjects: userData.enrolledSubjects || []
        } as StudentData
        
        setStudentData(student)
        
        // 2. Fetch subjects for the student's grade
        if (student.grade) {
          // First, find classes with matching grade
          const classesRef = collection(db, "classes")
          const classQuery = query(classesRef, where("grade", "==", student.grade))
          const classSnapshot = await getDocs(classQuery)
          
          if (!classSnapshot.empty) {
            // Get all class IDs for this grade
            const classIds = classSnapshot.docs.map(doc => doc.id)
            
            // Fetch all subjects for these classes
            const subjectsRef = collection(db, "subjects")
            const subjectsSnapshot = await getDocs(subjectsRef)
            
            const allSubjects: Subject[] = []
            
            subjectsSnapshot.forEach(doc => {
              const subjectData = doc.data() as Subject
              if (classIds.includes(subjectData.classId) && subjectData.isVisibleToStudents) {
                allSubjects.push({
                  ...subjectData,
                  id: doc.id
                })
              }
            })
            
            // Separate enrolled and available subjects
            const enrolled: Subject[] = []
            const available: Subject[] = []
            
            allSubjects.forEach(subject => {
              if (student.enrolledSubjects?.includes(subject.id)) {
                enrolled.push(subject)
              } else {
                available.push(subject)
              }
            })
            
            setEnrolledSubjects(enrolled)
            setAvailableSubjects(available)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load subjects. Please try again later."
        })
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [router])
  
  // Handle enrollment
  const handleEnroll = async (subject: Subject) => {
    if (!studentData) return
    
    try {
      setEnrolling(true)
      
      // Check if enrollment is open
      if (!subject.isAvailableForEnrollment) {
        toast({
          title: "Enrollment Closed",
          description: `Enrollment for ${subject.subjectName} is currently closed. Please contact ${subject.teacher} for more information.`
        })
        return
      }
      
      // 1. Create enrollment record
      const enrollmentData = {
        studentId: studentData.id,
        studentName: studentData.name,
        studentRollNumber: studentData.rollNumber,
        subjectId: subject.id,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        classId: subject.classId,
        enrolledAt: new Date(),
        status: "active"
      }
      
      await addDoc(collection(db, "enrollments"), enrollmentData)
      
      // 2. Update student's enrolledSubjects array
      const studentRef = doc(db, "users", studentData.id)
      const updatedEnrolledSubjects = [...(studentData.enrolledSubjects || []), subject.id]
      await updateDoc(studentRef, {
        enrolledSubjects: updatedEnrolledSubjects
      })
      
      // 3. Update subject's student count
      const subjectRef = doc(db, "subjects", subject.id)
      await updateDoc(subjectRef, {
        students: increment(1)
      })
      
      // 4. Update local state
      setStudentData({
        ...studentData,
        enrolledSubjects: updatedEnrolledSubjects
      })
      
      setAvailableSubjects(prev => prev.filter(s => s.id !== subject.id))
      setEnrolledSubjects(prev => [...prev, subject])
      
      toast({
        title: "Enrolled Successfully",
        description: `You have been enrolled in ${subject.subjectName}.`
      })
    } catch (error) {
      console.error("Error enrolling:", error)
      toast({
        title: "Enrollment Failed",
        description: "There was an error enrolling in this subject. Please try again."
      })
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading subjects...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Subjects</h1>
        <p className="text-muted-foreground">
          View your enrolled subjects and available courses for {studentData?.grade || "your grade"}
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Enrolled Subjects</h2>
        {enrolledSubjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enrolledSubjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{subject.subjectName}</CardTitle>
                    <Badge variant="outline">{subject.subjectCode}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {subject.teacher}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {subject.schedule ? `Schedule: ${subject.schedule}` : "Schedule to be announced"}
                  </p>
                  {subject.credits && (
                    <p className="text-sm text-muted-foreground mt-1">Credits: {subject.credits}</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-lg bg-muted/50">
            <p>You haven't enrolled in any subjects yet.</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Available Subjects</h2>
        {availableSubjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableSubjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{subject.subjectName}</CardTitle>
                    <Badge variant="outline">{subject.subjectCode}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {subject.teacher}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {subject.schedule ? `Schedule: ${subject.schedule}` : "Schedule to be announced"}
                  </p>
                  {subject.credits && (
                    <p className="text-sm text-muted-foreground mt-1">Credits: {subject.credits}</p>
                  )}
                  <div className="mt-2">
                    <Badge variant={subject.isAvailableForEnrollment ? "default" : "secondary"}>
                      {subject.isAvailableForEnrollment ? "Open for Enrollment" : "Enrollment Closed"}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleEnroll(subject)}
                    disabled={enrolling || !subject.isAvailableForEnrollment}
                  >
                    {enrolling ? "Enrolling..." : "Enroll"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-lg bg-muted/50">
            <p>No available subjects for your grade at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}


