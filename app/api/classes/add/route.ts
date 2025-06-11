import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { className, teacherId, grade, room, capacity, academicYear, status } = await req.json();

    if (!className) {
      return NextResponse.json(
        { error: "Class name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate class names
    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("className", "==", className));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return NextResponse.json(
        { error: "A class with this name already exists" },
        { status: 409 }
      );
    }

    // If teacherId is provided, check if the teacher is already a class teacher
    if (teacherId) {
      try {
        // Get the teacher document to check if they're already a class teacher
        const teacherRef = doc(db, "users", teacherId);
        const teacherDoc = await getDoc(teacherRef);
        
        if (teacherDoc.exists()) {
          const teacherData = teacherDoc.data();
          
          // If the teacher is already marked as a class teacher, return an error
          if (teacherData.isClassTeacher === true) {
            return NextResponse.json(
              { error: "This teacher is already assigned as a class teacher to another class" },
              { status: 409 }
            );
          }
        }
      } catch (error) {
        console.error("Error checking teacher status:", error);
        // Continue with class creation even if there's an error checking the teacher
      }
    }

    // Create the class document data
    const classData = {
      className,
      teacherId,
      grade,
      room,
      capacity: parseInt(capacity),
      academicYear,
      status: status || "active",
      students: 0,
      subjects: 0,
      createdAt: serverTimestamp(),
    };

    // Add the new class to Firestore
    const docRef = await addDoc(collection(db, "classes"), classData);

    // Update the teacher's status to indicate they are a class teacher
    if (teacherId) {
      const teacherRef = doc(db, "users", teacherId);
      await updateDoc(teacherRef, {
        isClassTeacher: true
      });
    }

    // Revalidate the cache for the classes page
    revalidatePath("/dashboard/admin/classes");

    return NextResponse.json(
      { message: "Class added successfully", id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding class:", error);
    return NextResponse.json(
      { error: "Failed to add class", details: (error as Error).message },
      { status: 500 }
    );
  }
} 