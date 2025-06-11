import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get the session token from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the student ID from the session
    const studentId = sessionCookie; // You might need to decode the session cookie to get the actual student ID

    // Query results collection for this student
    const resultsRef = collection(db, "results");
    const q = query(
      resultsRef,
      orderBy("submittedAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        // Find the student's marks in the marks array
        const studentMarks = data.marks?.find((m: any) => m.studentId === studentId);
        
        // Only include results where this student has marks
        if (!studentMarks) return null;

        return {
          id: doc.id,
          subjectName: data.subjectName,
          subjectCode: data.subjectCode,
          className: data.className,
          examType: data.examType,
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          marks: studentMarks.marks,
          letterGrade: studentMarks.letterGrade,
          teacherId: data.teacherId
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null);

    // Calculate average grade
    const averageGrade = results.length > 0
      ? results.reduce((acc, curr) => {
          const gradeValue = curr.letterGrade === "A" ? 4
            : curr.letterGrade === "B" ? 3
            : curr.letterGrade === "C" ? 2
            : curr.letterGrade === "D" ? 1
            : 0;
          return acc + gradeValue;
        }, 0) / results.length
      : 0;

    // Convert average grade to letter grade
    const letterGrade = averageGrade >= 3.7 ? "A"
      : averageGrade >= 3.3 ? "A-"
      : averageGrade >= 3.0 ? "B+"
      : averageGrade >= 2.7 ? "B"
      : averageGrade >= 2.3 ? "B-"
      : averageGrade >= 2.0 ? "C+"
      : averageGrade >= 1.7 ? "C"
      : averageGrade >= 1.3 ? "C-"
      : averageGrade >= 1.0 ? "D+"
      : averageGrade >= 0.7 ? "D"
      : "F";

    return NextResponse.json({
      results,
      summary: {
        averageGrade: letterGrade,
        totalSubjects: results.length,
        status: letterGrade.startsWith("A") ? "Excellent"
          : letterGrade.startsWith("B") ? "Good Standing"
          : letterGrade.startsWith("C") ? "Satisfactory"
          : "Needs Improvement"
      }
    });
  } catch (error) {
    console.error("Error fetching student results:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 