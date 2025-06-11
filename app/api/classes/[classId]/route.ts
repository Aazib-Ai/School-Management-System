import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, updateDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const classId = params.classId;
    
    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Get the class to find the current teacher
    const classRef = doc(db, "classes", classId);
    const classDoc = await getDoc(classRef);
    
    if (classDoc.exists()) {
      const classData = classDoc.data();
      const currentTeacherId = classData.teacherId;
      
      // Update the current teacher's status if they exist
      if (currentTeacherId) {
        const teacherRef = doc(db, "users", currentTeacherId);
        await updateDoc(teacherRef, {
          isClassTeacher: false
        });
      }
    }

    await deleteDoc(classRef);
    
    // Revalidate the cache for the classes page
    revalidatePath("/dashboard/admin/classes");

    return NextResponse.json(
      { message: "Class deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const classId = params.classId;
    
    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    const data = await req.json();
    const { className, teacherId, grade, room, capacity, academicYear, status } = data;

    if (!className) {
      return NextResponse.json(
        { error: "Class name is required" },
        { status: 400 }
      );
    }

    // Get the current class data to check if teacher is changing
    const classRef = doc(db, "classes", classId);
    const classDoc = await getDoc(classRef);
    
    if (!classDoc.exists()) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }
    
    const currentClassData = classDoc.data();
    const currentTeacherId = currentClassData.teacherId;
    
    // If the teacher is changing
    if (teacherId !== currentTeacherId) {
      // If a new teacher is being assigned, check if they're already a class teacher
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
          
          // Update the new teacher's status
          await updateDoc(teacherRef, {
            isClassTeacher: true
          });
        } catch (error) {
          console.error("Error checking teacher status:", error);
          return NextResponse.json(
            { error: "Failed to check teacher status" },
            { status: 500 }
          );
        }
      }
      
      // Update the previous teacher's status if they exist
      if (currentTeacherId) {
        const previousTeacherRef = doc(db, "users", currentTeacherId);
        await updateDoc(previousTeacherRef, {
          isClassTeacher: false
        });
      }
    }

    await updateDoc(classRef, {
      className,
      teacherId,
      grade,
      room,
      capacity: parseInt(capacity),
      academicYear,
      status,
      updatedAt: new Date()
    });
    
    // Revalidate the cache for the classes page
    revalidatePath("/dashboard/admin/classes");

    return NextResponse.json(
      { message: "Class updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Failed to update class", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const classId = params.classId;
    
    // Get the class document
    const classRef = doc(db, "classes", classId);
    const classDoc = await getDoc(classRef);
    
    if (!classDoc.exists()) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }
    
    const classData = classDoc.data();
    
    // Query all students in this class grade
    const studentsQuery = query(
      collection(db, "users"),
      where("grade", "==", classData.grade),
      where("role", "==", "student")
    );
    
    const studentsSnapshot = await getDocs(studentsQuery);
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get subjects for this class
    const subjectsQuery = query(
      collection(db, "subjects"),
      where("classId", "==", classId)
    );
    const subjectsSnapshot = await getDocs(subjectsQuery);
    const subjects = subjectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Return the class data along with its students and subjects
    return NextResponse.json({
      class: {
        id: classDoc.id,
        ...classData
      },
      students: students,
      subjects: subjects
    });
    
  } catch (error) {
    console.error("Error fetching class and students:", error);
    return NextResponse.json(
      { error: "Failed to fetch class data" },
      { status: 500 }
    );
  }
} 