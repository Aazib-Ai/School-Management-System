import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore"
import { Teacher } from "@/types"

// Get all teachers
export async function GET(req: NextRequest) {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("role", "==", "teacher"))
    const querySnapshot = await getDocs(q)
    
    // Get all classes to check which teachers are class teachers
    const classesRef = collection(db, "classes")
    const classesSnapshot = await getDocs(classesRef)
    const classTeacherIds = classesSnapshot.docs.map(doc => doc.data().teacherId).filter(Boolean)
    
    const teachers: Teacher[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as Omit<Teacher, "id">
      return {
        id: doc.id,
        ...data,
        // Ensure these fields exist with default values if not present
        specializedIn: data.specializedIn || [],
        availability: data.availability || [],
        assignedClasses: data.assignedClasses || [],
        // Check if this teacher is a class teacher
        isClassTeacher: classTeacherIds.includes(doc.id)
      }
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    )
  }
}

// Update a teacher's assignments
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { teacherId, assignment } = body

    if (!teacherId || !assignment) {
      return NextResponse.json(
        { error: "Teacher ID and assignment data are required" },
        { status: 400 }
      )
    }

    const teacherRef = doc(db, "users", teacherId)
    const teacherDoc = await getDoc(teacherRef)

    if (!teacherDoc.exists()) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      )
    }

    const teacherData = teacherDoc.data() as Teacher
    const assignedClasses = teacherData.assignedClasses || []

    // Add the new assignment
    const updatedAssignments = [...assignedClasses, assignment]

    await updateDoc(teacherRef, {
      assignedClasses: updatedAssignments
    })

    return NextResponse.json({ success: true, assignedClasses: updatedAssignments })
  } catch (error) {
    console.error("Error updating teacher assignments:", error)
    return NextResponse.json(
      { error: "Failed to update teacher assignments" },
      { status: 500 }
    )
  }
}

// Delete a teacher's assignment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")
    const assignmentId = searchParams.get("assignmentId")

    if (!teacherId || !assignmentId) {
      return NextResponse.json(
        { error: "Teacher ID and assignment ID are required" },
        { status: 400 }
      )
    }

    const teacherRef = doc(db, "users", teacherId)
    const teacherDoc = await getDoc(teacherRef)

    if (!teacherDoc.exists()) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      )
    }

    const teacherData = teacherDoc.data() as Teacher
    const assignedClasses = teacherData.assignedClasses || []

    // Remove the assignment
    const updatedAssignments = assignedClasses.filter(
      (assignment) => assignment.id !== assignmentId
    )

    await updateDoc(teacherRef, {
      assignedClasses: updatedAssignments
    })

    return NextResponse.json({ success: true, assignedClasses: updatedAssignments })
  } catch (error) {
    console.error("Error deleting teacher assignment:", error)
    return NextResponse.json(
      { error: "Failed to delete teacher assignment" },
      { status: 500 }
    )
  }
} 