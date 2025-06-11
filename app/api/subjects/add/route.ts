import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { 
      classId, 
      subjectName, 
      subjectCode, 
      teacherId, 
      schedule, 
      roomId, 
      isAvailableForEnrollment, 
      isVisibleToStudents, 
      status 
    } = await req.json();

    if (!classId || !subjectName || !subjectCode) {
      return NextResponse.json(
        { error: "Class ID, subject name, and subject code are required" },
        { status: 400 }
      );
    }

    // Get teacher name if teacherId is provided
    let teacherName = "";
    if (teacherId) {
      const teacherRef = doc(db, "users", teacherId);
      const teacherDoc = await getDoc(teacherRef);
      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        teacherName = teacherData?.name || "";
      }
    }

    // Create the subject document data
    const subjectData = {
      classId,
      subjectName,
      subjectCode,
      teacherId,
      teacher: teacherName,
      schedule: schedule || "",
      room: roomId || "",
      isAvailableForEnrollment: isAvailableForEnrollment !== false,
      isVisibleToStudents: isVisibleToStudents !== false,
      status: status || "active",
      students: 0,
      createdAt: serverTimestamp(),
    };

    // Add the new subject to Firestore
    const docRef = await addDoc(collection(db, "subjects"), subjectData);

    // Update the class document to increment the subjects count
    const classRef = doc(db, "classes", classId);
    await updateDoc(classRef, {
      subjects: increment(1)
    });

    // Revalidate the cache for the classes page
    revalidatePath("/dashboard/admin/classes");

    return NextResponse.json(
      { message: "Subject added successfully", id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding subject:", error);
    return NextResponse.json(
      { error: "Failed to add subject", details: (error as Error).message },
      { status: 500 }
    );
  }
} 