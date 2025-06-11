import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

// POST: Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiverId, senderId } = body;
    
    console.log("Mark messages as read - receiverId:", receiverId, "senderId:", senderId);
    
    if (!receiverId || !senderId) {
      return NextResponse.json(
        { error: "Receiver ID and Sender ID are required" },
        { status: 400 }
      );
    }

    // Find all unread messages sent by the sender to the receiver
    // Using a simple query that doesn't need a composite index
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("senderId", "==", senderId),
      where("receiverId", "==", receiverId)
    );
    
    console.log(`Querying messages from ${senderId} to ${receiverId}...`);
    const messagesSnapshot = await getDocs(q);
    
    if (messagesSnapshot.empty) {
      console.log("No messages found to mark as read");
      return NextResponse.json({ success: true, count: 0 });
    }
    
    console.log(`Found ${messagesSnapshot.size} total messages`);
    
    // Filter unread messages in memory instead of in the query
    const unreadMessages = messagesSnapshot.docs.filter(doc => doc.data().read === false);
    console.log(`Found ${unreadMessages.length} unread messages to update`);
    
    // Log details of each unread message
    unreadMessages.forEach((docSnapshot, index) => {
      const data = docSnapshot.data();
      console.log(`Unread message ${index + 1}: ID: ${docSnapshot.id}, Content: ${data.content.substring(0, 30)}...`);
    });
    
    // Update all found messages as read
    const updatePromises = unreadMessages.map(docSnapshot => {
      return updateDoc(doc(db, "messages", docSnapshot.id), {
        read: true
      });
    });
    
    await Promise.all(updatePromises);
    console.log(`Successfully marked ${unreadMessages.length} messages as read`);
    
    return NextResponse.json({ 
      success: true, 
      count: unreadMessages.length
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
} 