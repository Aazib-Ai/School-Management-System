import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const teacherId = searchParams.get("teacherId");
    const date = searchParams.get("date");
    const month = searchParams.get("month"); // Format: YYYY_MM
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    
    // Extract pagination parameters (default: 50 records)
    const limitParam = searchParams.get("limit");
    const recordLimit = limitParam ? parseInt(limitParam, 10) : 50;
    
    // Query the attendance collection
    const attendanceRef = collection(db, "attendance");
    let attendanceQuery = query(attendanceRef);
    
    // Apply filters
    if (studentId) {
      attendanceQuery = query(attendanceQuery, where("studentId", "==", studentId));
    }
    
    if (subjectId) {
      attendanceQuery = query(attendanceQuery, where("subjectId", "==", subjectId));
    }
    
    if (classId) {
      attendanceQuery = query(attendanceQuery, where("classId", "==", classId));
    }
    
    if (teacherId) {
      attendanceQuery = query(attendanceQuery, where("teacherId", "==", teacherId));
    }
    
    if (date) {
      attendanceQuery = query(attendanceQuery, where("date", "==", date));
    }
    
    if (month && month.includes("_")) {
      // Parse the month value (YYYY_MM)
      const [yearValue, monthValue] = month.split("_");
      if (yearValue && monthValue) {
        attendanceQuery = query(
          attendanceQuery, 
          where("year", "==", parseInt(yearValue, 10)),
          where("month", "==", parseInt(monthValue, 10))
        );
      }
    }
    
    if (year) {
      attendanceQuery = query(attendanceQuery, where("year", "==", parseInt(year, 10)));
    }
    
    if (status && ["present", "absent", "excused"].includes(status)) {
      attendanceQuery = query(attendanceQuery, where("status", "==", status));
    }
    
    // Order by date (most recent first) and apply limit
    attendanceQuery = query(
      attendanceQuery, 
      orderBy("timestamp", "desc"),
      limit(recordLimit)
    );
    
    // Execute the query
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    // Format the results
    const records = attendanceSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || null // Convert Firestore timestamp to JS Date
    }));
    
    // Return the attendance records with metadata
    return NextResponse.json({
      records,
      count: records.length,
      hasMore: records.length === recordLimit
    });
    
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records", details: (error as Error).message },
      { status: 500 }
    );
  }
} 