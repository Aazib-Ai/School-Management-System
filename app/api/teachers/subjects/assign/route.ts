import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc, addDoc, serverTimestamp, query, where, getDocs, increment } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const {
      teacherId,
      classId,
      subjectName,
      subjectCode,
      schedule,
      roomId,
      isAvailableForEnrollment,
      isVisibleToStudents,
      status
    } = await req.json();

    if (!teacherId || !classId || !subjectName || !subjectCode) {
      return NextResponse.json(
        { error: "Teacher ID, class ID, subject name, and subject code are required" },
        { status: 400 }
      );
    }

    // Get teacher name
    const teacherRef = doc(db, "users", teacherId);
    const teacherDoc = await getDoc(teacherRef);
    if (!teacherDoc.exists()) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }
    const teacherData = teacherDoc.data();
    const teacherName = teacherData?.name || "";

    // Check if subject already exists for this class
    const subjectsRef = collection(db, "subjects");
    const existingSubjectQuery = query(
      subjectsRef,
      where("classId", "==", classId),
      where("subjectName", "==", subjectName)
    );
    const existingSubjects = await getDocs(existingSubjectQuery);

    let subjectId;
    if (!existingSubjects.empty) {
      // Update existing subject
      const subjectDoc = existingSubjects.docs[0];
      subjectId = subjectDoc.id;
      await updateDoc(doc(db, "subjects", subjectId), {
        teacherId,
        teacher: teacherName,
        schedule: schedule || "",
        room: roomId || "",
        isAvailableForEnrollment: isAvailableForEnrollment !== false,
        isVisibleToStudents: isVisibleToStudents !== false,
        status: status || "active",
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new subject
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
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(subjectsRef, subjectData);
      subjectId = docRef.id;

      // Update class subjects count
      const classRef = doc(db, "classes", classId);
      await updateDoc(classRef, {
        subjects: increment(1)
      });
    }

    // Update teacher's assignments
    const teacherAssignments = teacherData.assignedClasses || [];
    const newAssignment = {
      id: subjectId,
      class: classId,
      subject: subjectName,
      schedule: schedule || "",
      room: roomId || "",
      createdAt: serverTimestamp(),
    };

    // Check if assignment already exists
    const existingAssignmentIndex = teacherAssignments.findIndex(
      (assignment: any) => assignment.id === subjectId
    );

    if (existingAssignmentIndex === -1) {
      teacherAssignments.push(newAssignment);
    } else {
      teacherAssignments[existingAssignmentIndex] = {
        ...teacherAssignments[existingAssignmentIndex],
        ...newAssignment,
      };
    }

    await updateDoc(teacherRef, {
      assignedClasses: teacherAssignments,
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard/admin/classes");
    revalidatePath("/dashboard/admin/teacher-assignment");
    revalidatePath("/dashboard/teacher/attendance");

    return NextResponse.json({
      message: "Teacher assigned to subject successfully",
      subjectId,
      assignment: newAssignment,
    });
  } catch (error) {
    console.error("Error assigning teacher to subject:", error);
    return NextResponse.json(
      { error: "Failed to assign teacher to subject", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const subjectId = searchParams.get("subjectId");

    if (!teacherId || !subjectId) {
      return NextResponse.json(
        { error: "Teacher ID and subject ID are required" },
        { status: 400 }
      );
    }

    // Get teacher document
    const teacherRef = doc(db, "users", teacherId);
    const teacherDoc = await getDoc(teacherRef);
    if (!teacherDoc.exists()) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Get subject document
    const subjectRef = doc(db, "subjects", subjectId);
    const subjectDoc = await getDoc(subjectRef);
    if (!subjectDoc.exists()) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    const subjectData = subjectDoc.data();
    const classId = subjectData.classId;

    // Remove teacher from subject
    await updateDoc(subjectRef, {
      teacherId: null,
      teacher: "",
      updatedAt: serverTimestamp(),
    });

    // Update teacher's assignments
    const teacherData = teacherDoc.data();
    const teacherAssignments = teacherData.assignedClasses || [];
    const updatedAssignments = teacherAssignments.filter(
      (assignment: any) => assignment.id !== subjectId
    );

    await updateDoc(teacherRef, {
      assignedClasses: updatedAssignments,
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard/admin/classes");
    revalidatePath("/dashboard/admin/teacher-assignment");
    revalidatePath("/dashboard/teacher/attendance");

    return NextResponse.json({
      message: "Teacher removed from subject successfully",
    });
  } catch (error) {
    console.error("Error removing teacher from subject:", error);
    return NextResponse.json(
      { error: "Failed to remove teacher from subject", details: (error as Error).message },
      { status: 500 }
    );
  }
} 