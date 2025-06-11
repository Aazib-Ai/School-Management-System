"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  classId: string;
  className: string;
  schedule: string;
  room: string;
  students: number;
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  enrollmentId: string;
  grade: string;
}

interface MarksSubmission {
  id?: string;
  teacherId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  examType: string;
  classAverage: number;
  marks: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    grade: string;
    marks: number;
    letterGrade: string;
  }[];
}

export default function EnterResultsPage() {
  const { user, loading: userLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [examType, setExamType] = useState("midterm");
  const [loading, setLoading] = useState(false);

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  // Fetch teacher's subjects when user is available
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!user || user.role !== 'teacher') return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/teachers/subjects?teacherId=${user.id}`);
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
  }, [user]);

  // Fetch enrolled students when subject is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedSubject) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/subjects/${selectedSubject}/students`);
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        const data = await response.json();
        
        // Map the students data to include the grade from selectedSubjectData
        const studentsWithGrade = data.map((student: Student) => ({
          ...student,
          grade: selectedSubjectData?.className || '-' // Use the class name from the selected subject
        }));
        
        setStudents(studentsWithGrade);
        // Reset marks when students change
        setMarks(studentsWithGrade.reduce((acc: Record<string, string>, student: Student) => ({ ...acc, [student.id]: "" }), {}));
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({
          title: "Error",
          description: "Failed to fetch students",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedSubject, selectedSubjectData]); // Add selectedSubjectData to dependencies

  const [marks, setMarks] = useState<Record<string, string>>({});

  const handleMarksChange = (studentId: string, value: string) => {
    // Only allow numbers between 0 and 100
    if (value === "" || (/^\d+$/.test(value) && Number.parseInt(value) >= 0 && Number.parseInt(value) <= 100)) {
      setMarks((prev) => ({ ...prev, [studentId]: value }))
    }
  }

  const getGrade = (marks: string) => {
    if (marks === "") return "-"
    const score = Number.parseInt(marks)
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
  }

  const handleSaveMarks = async () => {
    if (!selectedSubject || !selectedSubjectData) {
      toast({
        title: "Error",
        description: "Please select a subject",
      });
      return;
    }

    if (Object.keys(marks).length === 0) {
      toast({
        title: "Error",
        description: "Please enter marks for at least one student",
      });
      return;
    }

    setLoading(true);
    try {
      const classAverage = Object.values(marks).filter((m) => m !== "").length > 0
        ? Number((
            Object.values(marks).reduce((sum, mark) => sum + (mark ? Number.parseInt(mark) : 0), 0) /
            Object.values(marks).filter((m) => m !== "").length
          ).toFixed(1))
        : 0;

      const marksData: MarksSubmission = {
        teacherId: user?.id || '',
        subjectId: selectedSubject,
        subjectName: selectedSubjectData.subjectName,
        subjectCode: selectedSubjectData.subjectCode,
        className: selectedSubjectData.className,
        examType: examType,
        classAverage: classAverage,
        marks: students
          .filter(student => marks[student.id] !== "") // Only include students with marks
          .map(student => ({
            studentId: student.id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            grade: student.grade,
            marks: Number(marks[student.id]),
            letterGrade: getGrade(marks[student.id])
          }))
      };

      const response = await fetch('/api/results/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(marksData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save marks');
      }

      toast({
        title: "Success",
        description: `Marks saved successfully for ${marksData.marks.length} students`,
      });

      // Reset form
      setMarks({});
      // Optionally reset subject selection
      setSelectedSubject("");
    } catch (error) {
      console.error('Error saving marks:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save marks",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enter Marks</h1>
        <p className="text-muted-foreground">Record student marks for exams and assessments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>Select subject and exam type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subjectName} - {subject.className}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="none">
                      {loading || userLoading ? "Loading subjects..." : "No subjects assigned to you"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Exam Type</label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midterm">Midterm Exam</SelectItem>
                  <SelectItem value="final">Final Exam</SelectItem>
                  <SelectItem value="quiz">Class Quiz</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Marks</CardTitle>
          <CardDescription>
            {selectedSubjectData ? (
              `Enter marks for ${selectedSubjectData.subjectName} "${selectedSubjectData.subjectCode}" ${selectedSubjectData.className} - ${examType.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}`
            ) : (
              "Select a subject to enter marks"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No students found for this subject.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Class/Grade</TableHead>
                  <TableHead>Marks (out of 100)</TableHead>
                  <TableHead className="w-[100px]">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={marks[student.id] || ""}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        className="w-20"
                        placeholder="0-100"
                      />
                    </TableCell>
                    <TableCell>{getGrade(marks[student.id] || "")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Class Average:{" "}
            {Object.values(marks).filter((m) => m !== "").length > 0
              ? (
                  Object.values(marks).reduce((sum, mark) => sum + (mark ? Number.parseInt(mark) : 0), 0) /
                  Object.values(marks).filter((m) => m !== "").length
                ).toFixed(1)
              : "-"}
          </div>
          <Button 
            onClick={handleSaveMarks} 
            disabled={loading || Object.keys(marks).length === 0}
          >
            {loading ? "Saving..." : "Save Marks"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}