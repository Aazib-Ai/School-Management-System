import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Define interfaces for type safety
interface MonthData {
  totalDays?: number;
  presentDays?: number;
  absentDays?: number;
  excusedDays?: number;
  sessions?: number;
  presentCount?: number;
  absentCount?: number;
  excusedCount?: number;
  [key: string]: any;
}

interface SubjectData {
  totalDays?: number;
  presentDays?: number;
  absentDays?: number;
  excusedDays?: number;
  sessions?: number;
  presentCount?: number;
  absentCount?: number;
  excusedCount?: number;
  [key: string]: any;
}

interface AttendanceSummary {
  totalDays?: number;
  presentDays?: number;
  absentDays?: number;
  excusedDays?: number;
  totalSessions?: number;
  totalStudents?: number;
  presentCount?: number;
  absentCount?: number;
  excusedCount?: number;
  subjects?: Record<string, SubjectData>;
  byMonth?: Record<string, MonthData>;
  [key: string]: any;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // student, subject, class
    const id = searchParams.get("id"); // ID of the entity
    
    if (!type || !id) {
      return NextResponse.json(
        { error: "Missing required parameters: type and id" },
        { status: 400 }
      );
    }
    
    // Validate type parameter
    if (!["student", "subject", "class"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type parameter. Must be one of: student, subject, class" },
        { status: 400 }
      );
    }
    
    // Construct the document ID based on the type
    const docId = `${type}_${id}`;
    
    // Get the summary document
    const summaryRef = doc(db, "attendanceSummary", docId);
    const summaryDoc = await getDoc(summaryRef);
    
    if (!summaryDoc.exists()) {
      return NextResponse.json(
        { error: `No attendance records found for this ${type}` },
        { status: 404 }
      );
    }
    
    const summaryData = summaryDoc.data() as AttendanceSummary;
    
    // Calculate additional metrics based on the type
    if (type === "student") {
      const totalDays = summaryData.totalDays || 0;
      const presentDays = summaryData.presentDays || 0;
      const absentDays = summaryData.absentDays || 0;
      const excusedDays = summaryData.excusedDays || 0;
      
      // Calculate attendance percentage (count excused as half-present for percentage)
      const attendancePercentage = totalDays > 0 
        ? Math.round(((presentDays + (excusedDays * 0.5)) / totalDays) * 100) 
        : 0;
      
      // Calculate monthly attendance percentages
      const monthlyAttendance: Record<string, any> = {};
      if (summaryData.byMonth) {
        for (const [month, data] of Object.entries(summaryData.byMonth)) {
          const monthData = data;
          const monthlyTotal = monthData.totalDays || 0;
          const monthlyPresent = monthData.presentDays || 0;
          const monthlyExcused = monthData.excusedDays || 0;
          
          monthlyAttendance[month] = {
            ...monthData,
            attendancePercentage: monthlyTotal > 0 
              ? Math.round(((monthlyPresent + (monthlyExcused * 0.5)) / monthlyTotal) * 100) 
              : 0
          };
        }
      }
      
      // Calculate subject-specific attendance percentages
      const subjectAttendance: Record<string, any> = {};
      if (summaryData.subjects) {
        for (const [subjectId, data] of Object.entries(summaryData.subjects)) {
          const subjectData = data;
          const subjectTotal = subjectData.totalDays || 0;
          const subjectPresent = subjectData.presentDays || 0;
          const subjectExcused = subjectData.excusedDays || 0;
          
          subjectAttendance[subjectId] = {
            ...subjectData,
            attendancePercentage: subjectTotal > 0 
              ? Math.round(((subjectPresent + (subjectExcused * 0.5)) / subjectTotal) * 100) 
              : 0
          };
        }
      }
      
      return NextResponse.json({
        ...summaryData,
        attendancePercentage,
        monthlyAttendance,
        subjectAttendance
      });
    } 
    else if (type === "subject") {
      // For subjects, calculate overall attendance percentage
      const totalSessions = summaryData.totalSessions || 0;
      const totalStudents = summaryData.totalStudents || 0;
      const presentCount = summaryData.presentCount || 0;
      const excusedCount = summaryData.excusedCount || 0;
      
      // Total opportunities for attendance (sessions × students)
      const totalOpportunities = totalSessions * totalStudents;
      
      // Calculate attendance percentage
      const attendancePercentage = totalOpportunities > 0 
        ? Math.round(((presentCount + (excusedCount * 0.5)) / totalOpportunities) * 100) 
        : 0;
      
      // Calculate monthly attendance percentages
      const monthlyAttendance: Record<string, any> = {};
      if (summaryData.byMonth) {
        for (const [month, data] of Object.entries(summaryData.byMonth)) {
          const monthData = data;
          const monthlyTotal = (monthData.sessions || 0) * totalStudents;
          const monthlyPresent = monthData.presentCount || 0;
          const monthlyExcused = monthData.excusedCount || 0;
          
          monthlyAttendance[month] = {
            ...monthData,
            attendancePercentage: monthlyTotal > 0 
              ? Math.round(((monthlyPresent + (monthlyExcused * 0.5)) / monthlyTotal) * 100) 
              : 0
          };
        }
      }
      
      return NextResponse.json({
        ...summaryData,
        attendancePercentage,
        monthlyAttendance
      });
    }
    else if (type === "class") {
      // For classes, calculate overall attendance percentage
      const totalSessions = summaryData.totalSessions || 0;
      const totalOpportunities = totalSessions * (summaryData.totalStudents || 0);
      
      // Sum up total present/absent across all subjects
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalExcused = 0;
      
      if (summaryData.subjects) {
        for (const subjectData of Object.values(summaryData.subjects)) {
          totalPresent += subjectData.presentCount || 0;
          totalAbsent += subjectData.absentCount || 0;
          totalExcused += subjectData.excusedCount || 0;
        }
      }
      
      // Calculate attendance percentage
      const attendancePercentage = totalOpportunities > 0 
        ? Math.round(((totalPresent + (totalExcused * 0.5)) / totalOpportunities) * 100) 
        : 0;
      
      // Calculate monthly attendance
      const monthlyAttendance: Record<string, any> = {};
      if (summaryData.byMonth) {
        for (const [month, data] of Object.entries(summaryData.byMonth)) {
          const monthData = data;
          const monthlyTotal = (monthData.sessions || 0) * (summaryData.totalStudents || 0);
          const monthlyPresent = monthData.presentCount || 0;
          const monthlyExcused = monthData.excusedCount || 0;
          
          monthlyAttendance[month] = {
            ...monthData,
            attendancePercentage: monthlyTotal > 0 
              ? Math.round(((monthlyPresent + (monthlyExcused * 0.5)) / monthlyTotal) * 100) 
              : 0
          };
        }
      }
      
      // Calculate subject-specific attendance
      const subjectAttendance: Record<string, any> = {};
      if (summaryData.subjects) {
        for (const [subjectId, data] of Object.entries(summaryData.subjects)) {
          const subjectData = data;
          const sessions = subjectData.sessions || 0;
          const present = subjectData.presentCount || 0;
          const excused = subjectData.excusedCount || 0;
          const total = sessions * (summaryData.totalStudents || 0);
          
          subjectAttendance[subjectId] = {
            ...subjectData,
            attendancePercentage: total > 0 
              ? Math.round(((present + (excused * 0.5)) / total) * 100) 
              : 0
          };
        }
      }
      
      return NextResponse.json({
        ...summaryData,
        totalPresent,
        totalAbsent,
        totalExcused,
        attendancePercentage,
        monthlyAttendance,
        subjectAttendance
      });
    }
    
    // Default response
    return NextResponse.json(summaryData);
    
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance summary", details: (error as Error).message },
      { status: 500 }
    );
  }
} 