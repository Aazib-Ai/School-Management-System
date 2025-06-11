import { Timestamp } from "firebase/firestore";

export interface Class {
  id: string;
  className: string;
  teacherId: string;
  createdAt: Timestamp;
}

export interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  classId: string;
  teacherId: string;
  isAvailableForEnrollment: boolean;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  subjectId: string;
  studentId: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: "admin" | "teacher" | "student";
  rollNumber?: string;
}

export interface Student extends User {
  rollNumber: string;
}

export interface Teacher extends User {
  phone?: string;
  specializedIn: string[];
  qualification?: string;
  experience?: string;
  isClassTeacher?: boolean;
  availability?: {
    day: string;
    slots: string[];
  }[];
  assignedClasses?: {
    id: string;
    class: string;
    subject: string;
    schedule: string;
    room: string;
  }[];
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: string;
} 