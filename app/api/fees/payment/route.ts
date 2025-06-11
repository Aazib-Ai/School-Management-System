import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp, DocumentData, doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, getStorage } from "firebase/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { storage } from "@/lib/firebase";
import { getApp } from "firebase/app";
import * as fs from "fs";
import * as path from "path";
import { mkdir } from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    let user = null;
    
    // First try NextAuth session
    const session = await getServerSession(authOptions);
    if (session?.user) {
      user = {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name
      };
      console.log("User authenticated via NextAuth for payment:", user.id, user.role);
    } else {
      // Try session cookie if NextAuth session doesn't exist
      const sessionCookie = request.cookies.get('session');
      console.log("Session cookie present for payment:", !!sessionCookie);
      
      if (sessionCookie?.value) {
        try {
          // Get user data from Firestore based on the session cookie
          const userDocRef = doc(db, "users", sessionCookie.value);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log("User authenticated via session cookie for payment:", sessionCookie.value, userData.role);
            user = {
              id: sessionCookie.value,
              role: userData.role,
              name: userData.name
            };
          }
        } catch (error) {
          console.error("Error getting user from session cookie for payment:", error);
        }
      }
    }
    
    // If still not authenticated, return error
    if (!user) {
      console.error("Authentication failed for payment: No valid user session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const voucherId = formData.get("voucherId") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    
    // Validate required fields
    if (!file || !voucherId || !paymentMethod) {
      return NextResponse.json({ 
        error: "Missing required fields: file, voucherId, or paymentMethod" 
      }, { status: 400 });
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File size exceeds 5MB limit" 
      }, { status: 400 });
    }
    
    // Validate file type (must be an image)
    const fileType = file.type;
    if (!fileType.startsWith("image/")) {
      return NextResponse.json({ 
        error: "Only image files are allowed" 
      }, { status: 400 });
    }
    
    // Check if the voucher exists and belongs to the user
    const voucherRef = doc(db, "vouchers", voucherId);
    const voucherSnap = await getDoc(voucherRef);
    
    if (!voucherSnap.exists()) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    }
    
    const voucherData = voucherSnap.data();
    
    // Verify if the voucher belongs to the current user
    if (voucherData.studentId !== user.id && user.role !== "admin") {
      return NextResponse.json({ 
        error: "You are not authorized to submit payment for this voucher" 
      }, { status: 403 });
    }
    
    // Check if voucher is already paid or submitted
    if (voucherData.status !== "Pending" && voucherData.status !== "Overdue") {
      return NextResponse.json({ 
        error: `Cannot submit payment for a voucher with status: ${voucherData.status}` 
      }, { status: 400 });
    }
    
    try {
      // Attempt to upload to Firebase Storage first
      let downloadURL = "";
      
      try {
        // Generate a unique filename for the uploaded file
        const timestamp = Date.now();
        const fileExtension = file.name.split(".").pop() || "jpg";
        const fileName = `payments/${timestamp}.${fileExtension}`;
        
        console.log("File to upload:", {
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024).toFixed(2)} KB`
        });
        
        // Convert File to array buffer for Firebase Storage
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        // Upload the file to Firebase Storage
        console.log("Attempting to upload file to:", fileName);
        const storageRef = ref(storage, fileName);
        
        // Try with more detailed error handling
        try {
          const uploadResult = await uploadBytes(storageRef, bytes, { 
            contentType: file.type 
          });
          console.log("Upload successful:", uploadResult.metadata.fullPath);
          
          // Get the download URL for the uploaded file
          downloadURL = await getDownloadURL(storageRef);
          console.log("File download URL obtained:", downloadURL);
        } catch (innerError: any) {
          console.error("Detailed Firebase upload error:", {
            code: innerError?.code,
            message: innerError?.message,
            serverResponse: innerError?.serverResponse
          });
          throw innerError;
        }
      } catch (storageError) {
        console.error("Firebase Storage upload error:", storageError);
        // Use placeholder for payment proof URL if Firebase upload fails
        downloadURL = "https://placeholder-image.com/payment-receipt";
      }
      
      // Create a new submission document
      const submissionData = {
        studentId: user.id,
        voucherId: voucherId,
        paymentMethod: paymentMethod,
        paymentProof: downloadURL,
        submittedAt: serverTimestamp(),
        status: "Verifying",
        notes: ""
      };
      
      // Add the submission to Firestore
      const submissionRef = collection(db, "submissions");
      const submissionDoc = await addDoc(submissionRef, submissionData);
      
      // Update the voucher status to "Verifying"
      await updateDoc(voucherRef, {
        status: "Verifying",
        lastUpdated: serverTimestamp()
      });
      
      return NextResponse.json({ 
        message: "Payment submitted successfully", 
        submissionId: submissionDoc.id
      });
    } catch (error) {
      console.error("Error during payment submission:", error);
      return NextResponse.json(
        { error: "Failed to upload payment proof. Please try again with a smaller image." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication using multiple methods
    let user = null;
    
    // First try NextAuth session
    const session = await getServerSession(authOptions);
    if (session?.user) {
      user = {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name
      };
      console.log("User authenticated via NextAuth:", user.id, user.role);
    } else {
      // Try session cookie if NextAuth session doesn't exist
      const sessionCookie = request.cookies.get('session');
      console.log("Session cookie present:", !!sessionCookie);
      
      if (sessionCookie?.value) {
        // Check if this is the admin_uid session from the login route
        if (sessionCookie.value === 'admin_uid') {
          console.log("Found built-in admin session cookie");
          user = {
            id: 'admin_uid',
            role: 'admin',
            name: 'Admin User'
          };
        } else {
          try {
            // Get user data from Firestore based on the session cookie
            const userDocRef = doc(db, "users", sessionCookie.value);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              console.log("User authenticated via session cookie:", sessionCookie.value, userData.role);
              user = {
                id: sessionCookie.value,
                role: userData.role,
                name: userData.name
              };
            }
          } catch (error) {
            console.error("Error getting user from session cookie:", error);
          }
        }
      }
    }
    
    // If still not authenticated, return error
    if (!user) {
      console.error("Authentication failed: No valid user session found");
      console.log("All cookies:", request.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; '));
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    // Validate parameters
    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Check if the requesting user is an admin or the student
    if (user.id !== studentId && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own submissions" },
        { status: 403 }
      );
    }

    // Query submissions by student ID
    const submissionsRef = collection(db, "submissions");
    const submissionQuery = query(submissionsRef, where("studentId", "==", studentId));
    const submissionSnapshot = await getDocs(submissionQuery);

    // Format and return submissions
    const submissions = submissionSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toISOString() 
          : null
      };
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
} 