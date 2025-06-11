export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "teacher" | "student";
  createdAt: string;
  updatedAt: string;
}

// Add these interfaces for the new collections
export interface Class {
  id: string;
  className: string;
  gradeLevel: string;
  createdAt: string;
  updatedAt: string;
  enrolledStudents?: string[]; // Array of student IDs
}

export interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  isAvailableForEnrollment: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for student data fetched from "users" collection
export interface Student {
  id: string;
  name: string;
  createdAt: string;
  // Add any other student fields you need to display
} 