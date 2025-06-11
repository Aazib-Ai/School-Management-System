import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { subjectId, studentId } = await req.json();

    if (!subjectId || !studentId) {
      return NextResponse.json(
        { error: "Subject ID and student ID are required" },
        { status: 400 }
      );
    }

    // Check if the subject exists and is available for enrollment
    const subjectDocRef = doc(db, "subjects", subjectId);
    const subjectDocSnap = await getDoc(subjectDocRef);
    if (!subjectDocSnap.exists() || !subjectDocSnap.data().isAvailableForEnrollment) {
      return NextResponse.json(
        { error: "Subject is not available for enrollment" },
        { status: 400 }
      );
    }

    // Check if student exists and is a student
    const studentDocRef = doc(db, "users", studentId);
    const studentDocSnap = await getDoc(studentDocRef);
    if (!studentDocSnap.exists() || studentDocSnap.data().role !== 'student') {
      return NextResponse.json(
        { error: "Student not found or invalid role" },
        { status: 404 }
      );
    }

    // Check for existing enrollment
    const enrollmentsRef = collection(db, "enrollments");
    const q = query(
      enrollmentsRef,
      where("subjectId", "==", subjectId),
      where("studentId", "==", studentId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return NextResponse.json(
        { error: "Student is already enrolled in this subject" },
        { status: 409 }
      );
    }

    const docRef = await addDoc(enrollmentsRef, {
      subjectId,
      studentId,
    });
    revalidatePath("/dashboard/admin/classes");
    return NextResponse.json(
      { message: "Enrollment added successfully", id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding enrollment:", error);
    return NextResponse.json(
      { error: "Failed to add enrollment" },
      { status: 500 }
    );
  }
} 