import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/firebase";
import { 
  collection,
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  or,
  and,
  Timestamp
} from "firebase/firestore";

// GET: Fetch messages for a conversation between two users
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const teacherId = searchParams.get("teacherId");
    
    console.log("Messages API Request - studentId:", studentId, "teacherId:", teacherId);
    
    if (!studentId || !teacherId) {
      return NextResponse.json(
        { error: "Student ID and Teacher ID are required" },
        { status: 400 }
      );
    }

    // Instead of using complex OR query with orderBy which requires composite index,
    // we'll fetch all messages between these users without sorting
    const messagesRef = collection(db, "messages");
    console.log("Querying messages collection...");
    
    // First get messages from student to teacher
    const studentToTeacherQuery = query(
      messagesRef,
      where("senderId", "==", studentId),
      where("receiverId", "==", teacherId)
    );
    
    // Then get messages from teacher to student
    const teacherToStudentQuery = query(
      messagesRef,
      where("senderId", "==", teacherId),
      where("receiverId", "==", studentId)
    );

    const [studentMsgsSnapshot, teacherMsgsSnapshot] = await Promise.all([
      getDocs(studentToTeacherQuery),
      getDocs(teacherToStudentQuery)
    ]);
    
    console.log(`Found ${studentMsgsSnapshot.size} messages from student to teacher`);
    console.log(`Found ${teacherMsgsSnapshot.size} messages from teacher to student`);
    
    // Combine both sets of messages
    const allMessages = [
      ...studentMsgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      ...teacherMsgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    ];
    
    console.log(`Total combined messages: ${allMessages.length}`);
    
    // Debug timestamp info
    if (allMessages.length > 0) {
      const sampleMessage = allMessages[0];
      console.log("Sample message timestamp type:", 
        sampleMessage.timestamp ? 
        (sampleMessage.timestamp instanceof Timestamp ? 
          "Firestore Timestamp" : 
          typeof sampleMessage.timestamp
        ) : "null/undefined"
      );
    }
    
    // Sort manually by timestamp
    const sortedMessages = allMessages.sort((a, b) => {
      // Handle null/undefined timestamps
      if (!a.timestamp) return -1;
      if (!b.timestamp) return 1;
      
      const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : 
                    (typeof a.timestamp === 'object' && a.timestamp?.seconds) ? 
                    a.timestamp.seconds * 1000 : 
                    new Date(a.timestamp).getTime();
                    
      const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : 
                    (typeof b.timestamp === 'object' && b.timestamp?.seconds) ? 
                    b.timestamp.seconds * 1000 : 
                    new Date(b.timestamp).getTime();
      
      return timeA - timeB;
    });

    console.log(`Returning ${sortedMessages.length} sorted messages`);
    return NextResponse.json({ messages: sortedMessages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST: Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, senderName, receiverId, receiverName, content } = body;
    
    console.log("Sending message from", senderName, "to", receiverName);
    
    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: "Sender ID, Receiver ID, and content are required" },
        { status: 400 }
      );
    }

    // Create a new message
    const messagesRef = collection(db, "messages");
    const newMessage = await addDoc(messagesRef, {
      senderId,
      senderName,
      receiverId,
      receiverName,
      content,
      read: false,
      timestamp: serverTimestamp()
    });
    
    console.log("Message created with ID:", newMessage.id);

    return NextResponse.json({ 
      success: true, 
      messageId: newMessage.id 
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 