import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { Room } from "@/types"

// Get all rooms
export async function GET() {
  try {
    const roomsRef = collection(db, "rooms")
    const querySnapshot = await getDocs(roomsRef)
    
    const rooms: Room[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Room, "id">),
    }))

    return NextResponse.json(rooms)
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    )
  }
}

// Create a new room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, capacity, type } = body

    if (!name || !capacity || !type) {
      return NextResponse.json(
        { error: "Name, capacity, and type are required" },
        { status: 400 }
      )
    }

    const roomsRef = collection(db, "rooms")
    const docRef = await addDoc(roomsRef, {
      name,
      capacity,
      type
    })

    return NextResponse.json({
      id: docRef.id,
      name,
      capacity,
      type
    })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    )
  }
} 