import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    // Get the session token from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the class name from query parameters
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    
    if (!className) {
      return new NextResponse("Class name is required", { status: 400 });
    }

    // Fetch results for this class
    const resultsRef = collection(db, "results");
    const q = query(resultsRef, where("className", "==", className));
    const querySnapshot = await getDocs(q);
    
    // Process results to get student data
    const results = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        subjectName: data.subjectName,
        subjectCode: data.subjectCode,
        className: data.className,
        examType: data.examType,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        marks: data.marks || [],
        teacherId: data.teacherId,
        classAverage: data.classAverage
      };
    });

    // Process students from all results
    const studentsMap = new Map();
    
    results.forEach(result => {
      // Process each student's marks
      result.marks.forEach((mark: any) => {
        if (!studentsMap.has(mark.studentId)) {
          studentsMap.set(mark.studentId, {
            id: mark.studentId,
            name: mark.studentName,
            rollNumber: mark.rollNumber || mark.studentId,
            subjects: {},
            average: 0,
            totalMarks: 0,
            totalSubjects: 0
          });
        }
        
        // Add this subject's marks to the student
        const student = studentsMap.get(mark.studentId);
        student.subjects[result.subjectCode] = {
          marks: mark.marks,
          letterGrade: mark.letterGrade
        };
        
        // Update average calculation
        student.totalMarks += mark.marks;
        student.totalSubjects += 1;
        student.average = Math.round(student.totalMarks / student.totalSubjects);
      });
    });
    
    // Convert Map to array for the response
    const students = Array.from(studentsMap.values());
    
    // Extract unique subjects from results
    const subjectsMap = new Map();
    results.forEach(result => {
      if (result.subjectCode && result.subjectName) {
        subjectsMap.set(result.subjectCode, {
          id: result.subjectCode,
          name: result.subjectName
        });
      }
    });
    
    const subjects = Array.from(subjectsMap.values());

    return NextResponse.json({
      className,
      subjects,
      students,
      results
    });
  } catch (error) {
    console.error("Error fetching class results:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 