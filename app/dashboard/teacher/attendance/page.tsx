"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/hooks/use-auth"

// Remove next-auth import
// import { useSession } from "next-auth/react"

// Remove session type augmentation
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id?: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//     }
//   }
// }

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
}

interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "excused";
  date: string;
}

export default function MarkAttendancePage() {
  const { user, loading: userLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "excused">>({});
  const [loading, setLoading] = useState(false);

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
        setStudents(data);
        // Reset attendance state when students change
        setAttendance({});
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
  }, [selectedSubject]);

  // Handle attendance change
  const handleAttendanceChange = (studentId: string, status: "present" | "absent" | "excused") => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Handle submit attendance
  const handleSubmitAttendance = async () => {
    if (!selectedSubject || !date) {
      toast({
        title: "Error",
        description: "Please select a subject and date",
      });
      return;
    }

    setLoading(true);
    try {
      const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
      
      const attendanceRecords: AttendanceRecord[] = students.map(student => ({
        studentId: student.id,
        status: attendance[student.id] || "absent",
        date: date.toISOString().split('T')[0]
      }));

      const response = await fetch('/api/attendance/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId: selectedSubject,
          teacherId: user?.id,
          classId: selectedSubjectData?.classId,
          date: date.toISOString().split('T')[0],
          records: attendanceRecords
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit attendance');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Attendance marked successfully (Present: ${result.presentCount || 0}, Absent: ${result.absentCount || 0}, Excused: ${result.excusedCount || 0})`,
      });

      // Reset attendance state
      setAttendance({});
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit attendance",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground">Record attendance for your classes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Details</CardTitle>
          <CardDescription>Select subject and date to mark attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Subject</label>
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
              <label className="text-sm font-medium">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
          <CardDescription>
            {selectedSubjectData && date ? (
              `Mark attendance for ${selectedSubjectData.subjectName} "${selectedSubjectData.subjectCode}" ${selectedSubjectData.className} on ${format(date, "MMMM d, yyyy")}`
            ) : (
              "Select a subject and date to mark attendance"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Attendance Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>
                      <Select
                        value={attendance[student.id]}
                        onValueChange={(value) => handleAttendanceChange(student.id, value as "present" | "absent" | "excused")}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="excused">Excused</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {selectedSubject ? "No students enrolled in this subject" : "Select a subject to view students"}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Present: {Object.values(attendance).filter((status) => status === "present").length} | Absent:{" "}
            {Object.values(attendance).filter((status) => status === "absent").length} | Excused:{" "}
            {Object.values(attendance).filter((status) => status === "excused").length}
          </div>
          <Button onClick={handleSubmitAttendance} disabled={loading || students.length === 0}>
            {loading ? "Submitting..." : "Save Attendance"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

