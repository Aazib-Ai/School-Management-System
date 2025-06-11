import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  runTransaction,
  Timestamp,
  updateDoc,
  increment
} from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const { subjectId, teacherId, classId, date, records } = await request.json();
    
    // Check for required fields
    if (!subjectId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Missing required fields: subjectId, date, and records" },
        { status: 400 }
      );
    }
    
    if (!teacherId) {
      return NextResponse.json(
        { error: "Missing teacherId, which is required for attendance tracking" },
        { status: 400 }
      );
    }
    
    // Get subject information
    const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
    if (!subjectDoc.exists()) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }
    
    // Parse date
    const dateObj = new Date(date);
    const timestamp = Timestamp.fromDate(dateObj);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // JavaScript months are 0-indexed
    const day = dateObj.getDate();
    const monthYear = `${year}_${month.toString().padStart(2, '0')}`;
    
    // Create a batch ID to group attendance records
    const batchId = `${subjectId}_${date}`;
    
    // Initialize counters
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    
    // Process each record
    const attendancePromises = records.map(async (record) => {
      const { studentId, status } = record;
      
      // Count attendance status
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'excused') excusedCount++;
      
      // Add record to attendance collection
      return addDoc(collection(db, "attendance"), {
        studentId,
        subjectId,
        teacherId,
        classId: classId || subjectDoc.data().classId,  // Use provided classId or get from subject
        date,
        timestamp,
        batchId,
        year,
        month,
        day,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    // Wait for all attendance records to be added
    await Promise.all(attendancePromises);
    
    // Update student attendance summaries
    for (const record of records) {
      const { studentId, status } = record;
      
      // Update student attendance summary using transaction
      await runTransaction(db, async (transaction) => {
        const studentSummaryRef = doc(db, "attendanceSummary", `student_${studentId}`);
        const studentSummaryDoc = await transaction.get(studentSummaryRef);
        
        // Initialize data structure if summary doesn't exist
        if (!studentSummaryDoc.exists()) {
          await setDoc(studentSummaryRef, {
            totalDays: 1,
            presentDays: status === 'present' ? 1 : 0,
            absentDays: status === 'absent' ? 1 : 0,
            excusedDays: status === 'excused' ? 1 : 0,
            subjects: {
              [subjectId]: {
                totalDays: 1,
                presentDays: status === 'present' ? 1 : 0,
                absentDays: status === 'absent' ? 1 : 0,
                excusedDays: status === 'excused' ? 1 : 0
              }
            },
            byMonth: {
              [monthYear]: {
                totalDays: 1,
                presentDays: status === 'present' ? 1 : 0,
                absentDays: status === 'absent' ? 1 : 0,
                excusedDays: status === 'excused' ? 1 : 0
              }
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          return;
        }
        
        // Update existing summary
        const summary = studentSummaryDoc.data();
        
        // Update totals
        const totalDays = (summary.totalDays || 0) + 1;
        const presentDays = (summary.presentDays || 0) + (status === 'present' ? 1 : 0);
        const absentDays = (summary.absentDays || 0) + (status === 'absent' ? 1 : 0);
        const excusedDays = (summary.excusedDays || 0) + (status === 'excused' ? 1 : 0);
        
        // Update subject-specific data
        const subjects = summary.subjects || {};
        const subjectData = subjects[subjectId] || { totalDays: 0, presentDays: 0, absentDays: 0, excusedDays: 0 };
        
        subjectData.totalDays = (subjectData.totalDays || 0) + 1;
        if (status === 'present') subjectData.presentDays = (subjectData.presentDays || 0) + 1;
        if (status === 'absent') subjectData.absentDays = (subjectData.absentDays || 0) + 1;
        if (status === 'excused') subjectData.excusedDays = (subjectData.excusedDays || 0) + 1;
        
        subjects[subjectId] = subjectData;
        
        // Update monthly data
        const byMonth = summary.byMonth || {};
        const monthData = byMonth[monthYear] || { totalDays: 0, presentDays: 0, absentDays: 0, excusedDays: 0 };
        
        monthData.totalDays = (monthData.totalDays || 0) + 1;
        if (status === 'present') monthData.presentDays = (monthData.presentDays || 0) + 1;
        if (status === 'absent') monthData.absentDays = (monthData.absentDays || 0) + 1;
        if (status === 'excused') monthData.excusedDays = (monthData.excusedDays || 0) + 1;
        
        byMonth[monthYear] = monthData;
        
        // Update the document
        transaction.update(studentSummaryRef, {
          totalDays,
          presentDays,
          absentDays,
          excusedDays,
          subjects,
          byMonth,
          updatedAt: serverTimestamp()
        });
      });
    }
    
    // Update subject attendance summary
    await runTransaction(db, async (transaction) => {
      const subjectSummaryRef = doc(db, "attendanceSummary", `subject_${subjectId}`);
      const subjectSummaryDoc = await transaction.get(subjectSummaryRef);
      
      // Get the number of students for this subject
      const subject = subjectDoc.data();
      const totalStudents = records.length;
      
      // Initialize data structure if summary doesn't exist
      if (!subjectSummaryDoc.exists()) {
        await setDoc(subjectSummaryRef, {
          totalSessions: 1,
          totalStudents,
          presentCount,
          absentCount,
          excusedCount,
          byMonth: {
            [monthYear]: {
              sessions: 1,
              presentCount,
              absentCount,
              excusedCount
            }
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return;
      }
      
      // Update existing summary
      const summary = subjectSummaryDoc.data();
      
      // Update totals
      const totalSessions = (summary.totalSessions || 0) + 1;
      const totalPresentCount = (summary.presentCount || 0) + presentCount;
      const totalAbsentCount = (summary.absentCount || 0) + absentCount;
      const totalExcusedCount = (summary.excusedCount || 0) + excusedCount;
      
      // Update monthly data
      const byMonth = summary.byMonth || {};
      const monthData = byMonth[monthYear] || { sessions: 0, presentCount: 0, absentCount: 0, excusedCount: 0 };
      
      monthData.sessions = (monthData.sessions || 0) + 1;
      monthData.presentCount = (monthData.presentCount || 0) + presentCount;
      monthData.absentCount = (monthData.absentCount || 0) + absentCount;
      monthData.excusedCount = (monthData.excusedCount || 0) + excusedCount;
      
      byMonth[monthYear] = monthData;
      
      // Update the document
      transaction.update(subjectSummaryRef, {
        totalSessions,
        totalStudents,
        presentCount: totalPresentCount,
        absentCount: totalAbsentCount,
        excusedCount: totalExcusedCount,
        byMonth,
        updatedAt: serverTimestamp()
      });
    });
    
    // Update class attendance summary if classId is available
    if (classId) {
      await runTransaction(db, async (transaction) => {
        const classSummaryRef = doc(db, "attendanceSummary", `class_${classId}`);
        const classSummaryDoc = await transaction.get(classSummaryRef);
        
        // Get the number of students for this class
        const totalStudents = records.length;
        
        // Initialize data structure if summary doesn't exist
        if (!classSummaryDoc.exists()) {
          await setDoc(classSummaryRef, {
            totalSessions: 1,
            totalStudents,
            subjects: {
              [subjectId]: {
                sessions: 1,
                presentCount,
                absentCount,
                excusedCount
              }
            },
            byMonth: {
              [monthYear]: {
                sessions: 1,
                presentCount,
                absentCount,
                excusedCount
              }
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          return;
        }
        
        // Update existing summary
        const summary = classSummaryDoc.data();
        
        // Update totals
        const totalSessions = (summary.totalSessions || 0) + 1;
        
        // Update subject-specific data
        const subjects = summary.subjects || {};
        const subjectData = subjects[subjectId] || { sessions: 0, presentCount: 0, absentCount: 0, excusedCount: 0 };
        
        subjectData.sessions = (subjectData.sessions || 0) + 1;
        subjectData.presentCount = (subjectData.presentCount || 0) + presentCount;
        subjectData.absentCount = (subjectData.absentCount || 0) + absentCount;
        subjectData.excusedCount = (subjectData.excusedCount || 0) + excusedCount;
        
        subjects[subjectId] = subjectData;
        
        // Update monthly data
        const byMonth = summary.byMonth || {};
        const monthData = byMonth[monthYear] || { sessions: 0, presentCount: 0, absentCount: 0, excusedCount: 0 };
        
        monthData.sessions = (monthData.sessions || 0) + 1;
        monthData.presentCount = (monthData.presentCount || 0) + presentCount;
        monthData.absentCount = (monthData.absentCount || 0) + absentCount;
        monthData.excusedCount = (monthData.excusedCount || 0) + excusedCount;
        
        byMonth[monthYear] = monthData;
        
        // Update the document
        transaction.update(classSummaryRef, {
          totalSessions,
          totalStudents,
          subjects,
          byMonth,
          updatedAt: serverTimestamp()
        });
      });
    }
    
    // Return success response with counts
    return NextResponse.json({
      success: true,
      message: "Attendance records added successfully",
      recordCount: records.length,
      presentCount,
      absentCount,
      excusedCount
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error adding attendance records:", error);
    return NextResponse.json(
      { error: "Failed to add attendance records", details: (error as Error).message },
      { status: 500 }
    );
  }
} 