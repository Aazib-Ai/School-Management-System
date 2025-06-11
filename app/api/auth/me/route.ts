import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cookies } from 'next/headers';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    console.log("Auth check request received:", req.url);
    
    // First try to get user from NextAuth session
    const session = await getServerSession(authOptions);
    console.log("NextAuth session found:", session ? "yes" : "no");
    
    if (session?.user) {
      console.log("User authenticated via NextAuth:", session.user.id, session.user.role);
      
      // If we have a NextAuth session with user ID, return that data
      return NextResponse.json({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      });
    }
    
    // If NextAuth session doesn't exist, try with custom session cookie
    const sessionCookie = req.cookies.get('session');
    console.log("Session cookie found:", sessionCookie ? "yes" : "no");
    
    if (!sessionCookie?.value) {
      console.log("No valid session cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from session cookie
    const userId = sessionCookie.value;
    console.log("Attempting to fetch user data for:", userId);
    
    // Fetch user data from Firestore
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.log("User document not found for ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDocSnap.data();
    console.log("User data retrieved:", userData.name, userData.role);
    
    // Return user data with additional fields based on role
    const responseData = {
      id: userId,
      name: userData.name,
      email: userData.email,
      role: userData.role
    };
    
    // Add role-specific data
    if (userData.role === 'student') {
      return NextResponse.json({
        ...responseData,
        rollNumber: userData.rollNumber || '',
        grade: userData.grade || '',
        enrolledSubjects: userData.enrolledSubjects || []
      });
    } else if (userData.role === 'teacher') {
      return NextResponse.json({
        ...responseData,
        teacherId: userData.teacherId || '',
        subjects: userData.subjects || []
      });
    } else {
      return NextResponse.json(responseData);
    }
    
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 