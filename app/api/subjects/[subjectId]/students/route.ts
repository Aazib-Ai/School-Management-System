import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";

export async function GET(
  request: Request,
  { params }: { params: { subjectId: string } }
) {
  try {
    const { subjectId } = params;

    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // Check if subject exists
    const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
    if (!subjectDoc.exists()) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Get enrollments for this subject
    const enrollmentsRef = collection(db, "enrollments");
    const q = query(enrollmentsRef, where("subjectId", "==", subjectId));
    const enrollmentsSnapshot = await getDocs(q);

    if (enrollmentsSnapshot.empty) {
      return NextResponse.json([]);
    }

    // Get student details for each enrollment
    const students = await Promise.all(
      enrollmentsSnapshot.docs.map(async (enrollmentDoc) => {
        const enrollment = enrollmentDoc.data();
        const studentId = enrollment.studentId;

        // Get student details
        const studentDoc = await getDoc(doc(db, "users", studentId));
        if (!studentDoc.exists()) {
          return null;
        }

        const student = studentDoc.data();
        return {
          id: studentId,
          name: student.name,
          rollNumber: student.rollNumber || "",
          enrollmentId: enrollmentDoc.id,
        };
      })
    );

    // Filter out null values (from students that couldn't be found)
    const filteredStudents = students.filter(Boolean);

    return NextResponse.json(filteredStudents);
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrolled students" },
      { status: 500 }
    );
  }
} 