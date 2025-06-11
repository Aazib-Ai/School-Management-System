import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, increment } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const { subjectId } = params;
    const docRef = doc(db, "subjects", subjectId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    } else {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
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

    const data = await req.json();
    
    // Get the subject document
    const subjectRef = doc(db, "subjects", subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (!subjectDoc.exists()) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Update teacher name if teacherId is provided and changed
    let updateData = { ...data };
    if (data.teacherId && data.teacherId !== subjectDoc.data().teacherId) {
      const teacherRef = doc(db, "users", data.teacherId);
      const teacherDoc = await getDoc(teacherRef);
      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        updateData.teacher = teacherData?.name || "";
      }
    }

    // Update the subject document
    await updateDoc(subjectRef, updateData);
    
    // Revalidate the cache for the classes page
    revalidatePath("/dashboard/admin/classes");

    return NextResponse.json(
      { message: "Subject updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Failed to update subject", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
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

    // Get the subject document to get the classId
    const subjectRef = doc(db, "subjects", subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (!subjectDoc.exists()) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    const classId = subjectDoc.data().classId;

    // Delete the subject document
    await deleteDoc(subjectRef);

    // Update the class document to decrement the subjects count
    if (classId) {
      const classRef = doc(db, "classes", classId);
      await updateDoc(classRef, {
        subjects: increment(-1)
      });
    }
    
    // Revalidate the cache for the classes page
    revalidatePath("/dashboard/admin/classes");

    return NextResponse.json(
      { message: "Subject deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Failed to delete subject", details: (error as Error).message },
      { status: 500 }
    );
  }
} 