import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { User, Teacher } from "@/types"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")

    if (!role) {
      return NextResponse.json(
        { error: "Role parameter is required" },
        { status: 400 }
      )
    }

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("role", "==", role))
    const querySnapshot = await getDocs(q)
    
    let users: User[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<User, "id">),
    }))

    // If fetching teachers, check which ones are class teachers
    if (role === "teacher") {
      // Get all classes to check which teachers are class teachers
      const classesRef = collection(db, "classes")
      const classesSnapshot = await getDocs(classesRef)
      const classTeacherIds = classesSnapshot.docs
        .map(doc => doc.data().teacherId)
        .filter(Boolean)
      
      // Add isClassTeacher property to each teacher
      users = users.map(user => ({
        ...user,
        isClassTeacher: classTeacherIds.includes(user.id)
      }))
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
} 