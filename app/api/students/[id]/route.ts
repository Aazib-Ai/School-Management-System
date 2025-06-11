import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }
    
    // Get student document
    const studentRef = doc(db, "students", id);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }
    
    const studentData = studentDoc.data();
    
    // Get class document to determine grade
    const classRef = doc(db, "classes", studentData.classId || "");
    const classDoc = await getDoc(classRef);
    
    let studentInfo = {
      id: studentDoc.id,
      ...studentData,
      grade: ""
    };
    
    if (classDoc.exists()) {
      const classData = classDoc.data();
      
      // Extract grade from className (e.g., "9a" -> "Grade 9")
      const className = classData.name || "";
      const gradeMatch = className.match(/^(\d+)[a-zA-Z]?$/);
      
      if (gradeMatch && gradeMatch[1]) {
        studentInfo.grade = `Grade ${gradeMatch[1]}`;
      }
    }
    
    return NextResponse.json(studentInfo);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
} 