import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"

// This endpoint is for development purposes only
// It will seed the database with test data
export async function GET() {
  try {
    // Create a test teacher
    const teacherRef = collection(db, "users")
    const teacherData = {
      name: "Test Teacher",
      email: "teacher@test.com",
      password: "password123",
      role: "teacher",
      createdAt: new Date(),
    }
    
    const teacherDoc = await addDoc(teacherRef, teacherData)
    const teacherId = teacherDoc.id
    
    console.log("Created test teacher with ID:", teacherId)
    
    // Create a test class
    const classRef = collection(db, "classes")
    const classData = {
      name: "Test Class",
      gradeLevel: "10",
      section: "A",
      capacity: 30,
      status: "active",
      createdAt: new Date(),
    }
    
    const classDoc = await addDoc(classRef, classData)
    const classId = classDoc.id
    
    console.log("Created test class with ID:", classId)
    
    // Create two test subjects
    const subjectsRef = collection(db, "subjects")
    
    const subject1Data = {
      subjectName: "Mathematics",
      subjectCode: "MATH101",
      classId: classId,
      teacherId: teacherId,
      schedule: "Mon, Wed 10:00-11:30",
      room: "Room 101",
      status: "active",
      isVisibleToStudents: true,
      isAvailableForEnrollment: true,
      createdAt: new Date(),
    }
    
    const subject2Data = {
      subjectName: "Science",
      subjectCode: "SCI101",
      classId: classId,
      teacherId: teacherId,
      schedule: "Tue, Thu 10:00-11:30",
      room: "Room 102",
      status: "active",
      isVisibleToStudents: true,
      isAvailableForEnrollment: true,
      createdAt: new Date(),
    }
    
    const subject1Doc = await addDoc(subjectsRef, subject1Data)
    const subject2Doc = await addDoc(subjectsRef, subject2Data)
    
    console.log("Created test subjects with IDs:", subject1Doc.id, subject2Doc.id)
    
    // Create test students
    const studentsRef = collection(db, "users")
    
    const student1Data = {
      name: "Student One",
      email: "student1@test.com",
      password: "password123",
      role: "student",
      rollNumber: "S001",
      createdAt: new Date(),
    }
    
    const student2Data = {
      name: "Student Two",
      email: "student2@test.com",
      password: "password123",
      role: "student",
      rollNumber: "S002",
      createdAt: new Date(),
    }
    
    const student1Doc = await addDoc(studentsRef, student1Data)
    const student2Doc = await addDoc(studentsRef, student2Data)
    
    // Create enrollments
    const enrollmentsRef = collection(db, "enrollments")
    
    const enrollment1Data = {
      studentId: student1Doc.id,
      subjectId: subject1Doc.id,
      status: "enrolled",
      createdAt: new Date(),
    }
    
    const enrollment2Data = {
      studentId: student2Doc.id,
      subjectId: subject1Doc.id,
      status: "enrolled",
      createdAt: new Date(),
    }
    
    const enrollment3Data = {
      studentId: student1Doc.id,
      subjectId: subject2Doc.id,
      status: "enrolled",
      createdAt: new Date(),
    }
    
    await addDoc(enrollmentsRef, enrollment1Data)
    await addDoc(enrollmentsRef, enrollment2Data)
    await addDoc(enrollmentsRef, enrollment3Data)
    
    return NextResponse.json({
      success: true,
      message: "Test data created successfully",
      teacherId: teacherId,
      classId: classId,
      subject1Id: subject1Doc.id,
      subject2Id: subject2Doc.id,
      student1Id: student1Doc.id,
      student2Id: student2Doc.id,
    })
  } catch (error) {
    console.error("Error creating test data:", error)
    return NextResponse.json(
      { error: "Failed to create test data" },
      { status: 500 }
    )
  }
} 