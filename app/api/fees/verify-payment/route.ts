import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
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
      console.log("User authenticated via NextAuth for verification:", user.id, user.role);
    } else {
      // Try session cookie if NextAuth session doesn't exist
      const sessionCookie = request.cookies.get('session');
      console.log("Session cookie present for verification:", !!sessionCookie);
      
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
              console.log("User authenticated via session cookie for verification:", sessionCookie.value, userData.role);
              user = {
                id: sessionCookie.value,
                role: userData.role,
                name: userData.name
              };
            }
          } catch (error) {
            console.error("Error getting user from session cookie for verification:", error);
          }
        }
      }
    }
    
    // If still not authenticated, return error
    if (!user) {
      console.error("Authentication failed for verification: No valid user session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    // Parse request body to get submission ID and verification status
    const body = await request.json();
    const { submissionId, isVerified } = body;

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    // Get the submission document
    const submissionRef = doc(db, "submissions", submissionId);
    const submissionSnap = await getDoc(submissionRef);

    if (!submissionSnap.exists()) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const submissionData = submissionSnap.data();
    
    // If submission is already in the target status, return early
    if ((isVerified && submissionData.status === "Paid") || 
        (!isVerified && submissionData.status === "Default")) {
      return NextResponse.json({ 
        message: `Payment was already ${isVerified ? "verified" : "rejected"}` 
      });
    }

    // Update the submission status
    const newStatus = isVerified ? "Paid" : "Default";
    await updateDoc(submissionRef, {
      status: newStatus,
      verifiedBy: user.id,
      verifiedAt: new Date(),
      verificationNotes: isVerified ? "Payment verified by admin" : "Payment rejected by admin"
    });

    // If the submission has a voucher ID, update the voucher status as well
    if (submissionData.voucherId) {
      try {
        const voucherRef = doc(db, "vouchers", submissionData.voucherId);
        const voucherSnap = await getDoc(voucherRef);
        
        if (voucherSnap.exists()) {
          await updateDoc(voucherRef, {
            status: newStatus,
            lastUpdated: new Date()
          });
          console.log(`Updated voucher ${submissionData.voucherId} status to ${newStatus}`);
        }
      } catch (error) {
        console.error(`Error updating voucher ${submissionData.voucherId}:`, error);
        // We don't want to fail the entire operation if voucher update fails
      }
    }

    return NextResponse.json({ 
      message: `Payment has been ${isVerified ? "verified" : "rejected"} successfully` 
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
} 