import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId is required" },
        { status: 400 }
      );
    }

    // Get enrollments for the subject
    const enrollmentsRef = collection(db, "enrollments");
    const enrollmentsQuery = query(
      enrollmentsRef,
      where("subjectId", "==", subjectId)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    // Get student data for each enrollment
    const studentPromises = enrollmentsSnapshot.docs.map(async (enrollmentDoc) => {
      const enrollmentData = enrollmentDoc.data();
      const studentDocRef = doc(db, "users", enrollmentData.studentId);
      const studentDocSnap = await getDoc(studentDocRef);

      if (!studentDocSnap.exists()) {
        console.warn(`Student not found for enrollment: ${enrollmentDoc.id}, studentId: ${enrollmentData.studentId}`);
        return null;
      }

      if (studentDocSnap.data()?.role !== "student") {
        return null;
      }

      return {
        id: studentDocSnap.id,
        name: studentDocSnap.data().name,
        rollNumber: studentDocSnap.data().rollNumber,
      };
    });

    const students = (await Promise.all(studentPromises)).filter(student => student !== null);

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
} 