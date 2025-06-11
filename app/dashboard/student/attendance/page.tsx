"use client"

import { useEffect, useState } from "react"
import { Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface SubjectAttendance {
  subjectName?: string;
  totalDays?: number;
  presentDays?: number;
  absentDays?: number;
  excusedDays?: number;
  attendancePercentage?: number;
}

interface MonthAttendance {
  month?: string;
  totalDays?: number;
  presentDays?: number;
  absentDays?: number;
  excusedDays?: number;
  attendancePercentage?: number;
}

interface AttendanceSummary {
  totalDays?: number;
  presentDays?: number;
  absentDays?: number;
  excusedDays?: number;
  attendancePercentage?: number;
  subjectAttendance?: Record<string, SubjectAttendance>;
  monthlyAttendance?: Record<string, MonthAttendance>;
}

export default function StudentAttendancePage() {
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [subjects, setSubjects] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch attendance summary
  useEffect(() => {
    const fetchData = async () => {
      if (!user || loading) return;
      if (user.role !== 'student') {
        setError("Only students can view this page");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch student's attendance summary
        const response = await fetch(`/api/attendance/summary?type=student&id=${user.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // No attendance records yet
            setIsLoading(false);
            return;
          }
          throw new Error("Failed to fetch attendance data");
        }
        
        const data = await response.json();
        setSummary(data);
        
        // Fetch subject details
        if (data.subjectAttendance) {
          const subjectIds = Object.keys(data.subjectAttendance);
          
          const subjectPromises = subjectIds.map(async (id) => {
            const response = await fetch(`/api/subjects/${id}`);
            if (response.ok) {
              const subjectData = await response.json();
              return { id, name: subjectData.subjectName };
            }
            return { id, name: `Subject ${id}` };
          });
          
          const subjectResults = await Promise.all(subjectPromises);
          setSubjects(subjectResults);
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
        setError("Failed to load attendance data");
        toast({
          title: "Error",
          description: "Failed to load attendance data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, loading]);

  // Format monthly attendance data
  const getMonthlyAttendance = () => {
    if (!summary?.monthlyAttendance) return [];
    
    return Object.entries(summary.monthlyAttendance)
      .map(([key, data]) => {
        // Convert YYYY_MM to month name
        const [year, month] = key.split('_');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleString('default', { month: 'long' });
        
        // Determine status based on percentage
        let status = "Poor";
        if (data.attendancePercentage && data.attendancePercentage >= 95) status = "Excellent";
        else if (data.attendancePercentage && data.attendancePercentage >= 90) status = "Very Good";
        else if (data.attendancePercentage && data.attendancePercentage >= 85) status = "Good";
        else if (data.attendancePercentage && data.attendancePercentage >= 75) status = "Average";
        
        return {
          month: `${monthName} ${year}`,
          attendance: `${data.attendancePercentage || 0}%`,
          status: status,
          percentage: data.attendancePercentage || 0
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  };

  // Get subject attendance data
  const getSubjectAttendance = () => {
    if (!summary?.subjectAttendance || subjects.length === 0) return [];
    
    return Object.entries(summary.subjectAttendance)
      .map(([subjectId, data]) => {
        const subject = subjects.find(s => s.id === subjectId);
        const presentDays = data.presentDays || 0;
        const totalDays = data.totalDays || 0;
        
        return {
          subject: subject?.name || `Subject ${subjectId}`,
          attendance: `${data.attendancePercentage || 0}%`,
          classes: `${presentDays}/${totalDays}`,
          percentage: data.attendancePercentage || 0
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Loading your attendance records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const attendancePercentage = summary?.attendancePercentage || 0;
  const presentDays = summary?.presentDays || 0;
  const totalDays = summary?.totalDays || 0;
  const absentDays = summary?.absentDays || 0;
  const excusedDays = summary?.excusedDays || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">View and track your attendance records</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Overall Attendance"
          value={`${attendancePercentage}%`}
          description="Current semester"
          icon={Calendar}
          trend={{ value: "", isPositive: true }}
        />
        <StatsCard 
          title="Present Days" 
          value={presentDays.toString()} 
          description={`Out of ${totalDays} school days`} 
          icon={Calendar} 
        />
        <StatsCard 
          title="Absent Days" 
          value={(absentDays + excusedDays).toString()} 
          description={`Including ${excusedDays} excused absence${excusedDays !== 1 ? 's' : ''}`} 
          icon={Calendar} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance by Subject</CardTitle>
          <CardDescription>Your attendance percentage for each enrolled subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getSubjectAttendance().length > 0 ? (
              getSubjectAttendance().map((subject, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{subject.subject}</p>
                    <p className="text-sm text-muted-foreground">Classes attended: {subject.classes}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-24 rounded-full bg-muted">
                      <div 
                        className="h-2.5 rounded-full bg-primary" 
                        style={{ width: `${subject.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{subject.attendance}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-muted-foreground">No subject attendance records found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Attendance</CardTitle>
          <CardDescription>Your attendance record for the current semester</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getMonthlyAttendance().length > 0 ? (
              getMonthlyAttendance().map((month, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{month.month}</p>
                    <p className="text-sm text-muted-foreground">Status: {month.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-24 rounded-full bg-muted">
                      <div 
                        className="h-2.5 rounded-full bg-primary" 
                        style={{ width: `${month.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{month.attendance}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-muted-foreground">No monthly attendance records found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

