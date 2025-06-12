"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Search, X, Phone, Video, MoreVertical, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

// Define interfaces for the data types
interface Student {
  id: string
  name: string
  class: string
  rollNumber: string
  avatar: string | null
  unread?: number
}

interface Message {
  id: string
  senderId: string
  senderName: string
  receiverId: string
  receiverName: string
  content: string
  timestamp: any
  read: boolean
  isSelf?: boolean
}

export default function TeacherChatPage() {
  const [activeStudent, setActiveStudent] = useState<Student | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [message, setMessage] = useState("")
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [teacherInfo, setTeacherInfo] = useState<{ id: string; name: string } | null>(null)
  const [subjects, setSubjects] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()

  // Auto-hide sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      // Only hide the sidebar when a contact is selected
      if (activeStudent) {
        setShowSidebar(false)
      }
    } else {
      // Always show sidebar on desktop
      setShowSidebar(true)
    }
  }, [isMobile, activeStudent])

  // Fetch teacher info from session cookie
  useEffect(() => {
    const getTeacherInfo = async () => {
      try {
        const response = await fetch("/api/auth/me")
        const data = await response.json()
        
        if (data && data.role === "teacher") {
          setTeacherInfo({
            id: data.id,
            name: data.name
          })
        } else {
          toast({
            title: "Authentication Error",
            description: "You need to be logged in as a teacher to use chat.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching teacher info:", error)
        toast({
          title: "Error",
          description: "Failed to fetch your profile information.",
          variant: "destructive"
        })
      }
    }

    getTeacherInfo()
  }, [toast])

  // Fetch teacher's subjects - This might be redundant if /api/chat/students also returns subjects
  // For now, keeping it as per existing structure, but noting redundancy if data.subjects from fetchStudents is used.
  useEffect(() => {
    const fetchTeacherSubjects = async () => {
      if (!teacherInfo?.id) return;
      
      // This check is to see if fetchStudents will provide the subjects.
      // If fetchStudents is the primary source, this effect might only run if data.subjects wasn't available.
      // However, the new requirement is that fetchStudents *will* provide it.
      // So, this useEffect might be removable if setSubjects in fetchStudents is reliable.
      // For now, let it run if `subjects` state is empty.
      if (subjects.length > 0 && selectedSubject !== 'all') { // Avoid re-fetching if subjects are already there, unless filter is 'all'
         // If filter is 'all', we might want to ensure we have the *complete* list of subjects from the teacher.
         // But /api/chat/students should give the full list if selectedSubject is 'all'.
         // This logic is a bit convoluted due to potentially two sources of subjects.
         // Prioritizing subjects from /api/chat/students as per new instructions.
      }

      // If subjects are not populated by fetchStudents, this can be a fallback or primary source.
      // Given the subtask, fetchStudents will now call setSubjects.
      // This useEffect is now more of a backup or initial fetch if teacherInfo arrives before selectedSubject triggers fetchStudents.
      // To simplify, this useEffect will be commented out or removed if fetchStudents reliably provides subjects.
      // For this subtask, we assume fetchStudents is the primary source for subjects.
      // console.log("Running legacy fetchTeacherSubjects. Current subjects state:", subjects);
      // This effect will be reviewed later for redundancy. For now, let it exist but be mindful.
      // No API call here for now, as fetchStudents is expected to handle it.
    };

    // fetchTeacherSubjects(); // Temporarily disable direct call if fetchStudents handles it
  }, [teacherInfo, toast, subjects.length, selectedSubject])


  // New useEffect to reset active student and messages when selectedSubject changes
  useEffect(() => {
    console.log(`Selected subject changed to: ${selectedSubject}. Resetting active student and messages.`);
    setActiveStudent(null);
    setMessages([]);
  }, [selectedSubject]);


  // Fetch students for this teacher
  useEffect(() => {
    const fetchStudents = async () => {
      if (!teacherInfo?.id) return
      
      setLoadingStudents(true)
      try {
        // Fetch students for this teacher based on selected subject
        const queryParam = selectedSubject !== 'all' ? `&subject=${encodeURIComponent(selectedSubject)}` : '';
        const response = await fetch(`/api/chat/students?teacherId=${teacherInfo.id}${queryParam}`)
        const data = await response.json()
        
        console.log("API response from /api/chat/students:", data);
        
        if (data.error) {
          throw new Error(data.error)
        }

        // Set subjects for the dropdown from this API response (1b)
        if (data.subjects && Array.isArray(data.subjects)) {
          if (data.subjects.length > 0) {
            setSubjects(data.subjects);
            console.log("Updated subjects dropdown from /api/chat/students:", data.subjects);
          } else {
            console.warn("No subjects list returned from /api/chat/students, using fallback.");
            setSubjects(["Mathematics", "Science", "English", "History"]); // Fallback
          }
        } else {
          console.warn("/api/chat/students did not return a 'subjects' array. Using fallback for dropdown.");
          setSubjects(["Mathematics", "Science", "English", "History"]); // Fallback
        }
        
        // No client-side fallback to fetch all students if data.students is empty (1a)
        const currentStudentListData = data.students || [];
        console.log("Students from API (no fallback):", currentStudentListData);

        // Get unread message counts for each student
        const studentsWithUnread = await Promise.all(
          currentStudentListData.map(async (student: Student) => {
            const unreadResponse = await fetch(`/api/chat/messages?studentId=${student.id}&teacherId=${teacherInfo.id}`)
            const unreadData = await unreadResponse.json()
            
            const messageArray = unreadData.messages || [];
            const unreadCount = messageArray.filter(
              (msg: Message) => msg.senderId === student.id && !msg.read
            ).length || 0
            
            return {
              ...student,
              unread: unreadCount
            }
          })
        )
        
        console.log("Students with unread:", studentsWithUnread);
        setStudents(studentsWithUnread);

        // Consistency check for activeStudent (1c)
        if (activeStudent && !studentsWithUnread.find(s => s.id === activeStudent.id)) {
            console.log("Active student no longer in the new student list. Resetting active student and messages.");
            setActiveStudent(null);
            setMessages([]);
        } else if (studentsWithUnread.length === 0 && activeStudent) {
            console.log("New student list is empty. Resetting active student and messages.");
            setActiveStudent(null);
            setMessages([]);
        }

      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: "Failed to fetch students. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setLoadingStudents(false)
      }
    }

    if (teacherInfo?.id) {
      fetchStudents()
    }
  }, [teacherInfo, selectedSubject, toast])

  // Fetch messages when active student changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!teacherInfo?.id || !activeStudent) return
      
      setLoadingMessages(true)
      try {
        const response = await fetch(
          `/api/chat/messages?studentId=${activeStudent.id}&teacherId=${teacherInfo.id}`
        )
        const data = await response.json()
        
        console.log("Messages API response:", data);
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        // Format messages with isSelf flag (handle both formats for backward compatibility)
        const messageArray = data.messages || [];
        console.log("Message array length:", messageArray.length);
        
        if (messageArray.length === 0) {
          setMessages([]);
          setLoadingMessages(false);
          return;
        }
        
        const formattedMessages = messageArray.map((msg: Message) => {
          // Ensure we set isSelf correctly - compare with teacher ID
          const isSelf = msg.senderId === teacherInfo.id;
          console.log(`Message ${msg.id} - senderId: ${msg.senderId}, teacherId: ${teacherInfo.id}, isSelf: ${isSelf}`);
          
          return {
            ...msg,
            isSelf
          };
        });
        
        setMessages(formattedMessages)
        
        // Mark received messages as read
        const unreadMessages = formattedMessages.filter(
          (msg: Message) => !msg.read && msg.senderId === activeStudent.id
        );
        
        if (unreadMessages.length > 0) {
          console.log(`Marking ${unreadMessages.length} messages as read`);
          await fetch("/api/chat/read", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              receiverId: teacherInfo.id,
              senderId: activeStudent.id
            })
          })
          
          // Update the unread count for this student
          setStudents(prev => 
            prev.map(student => 
              student.id === activeStudent.id ? { ...student, unread: 0 } : student
            )
          )
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
        toast({
          title: "Error",
          description: "Failed to fetch messages. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setLoadingMessages(false)
      }
    }

    if (teacherInfo?.id && activeStudent) {
      fetchMessages()
      
      // Poll for new messages every 10 seconds
      const intervalId = setInterval(fetchMessages, 10000)
      return () => clearInterval(intervalId)
    }
  }, [teacherInfo, activeStudent, toast])

  // Scroll to bottom of messages when messages change or active student changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activeStudent])

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    // Filter by search query
    if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !teacherInfo || !activeStudent) return
    
    try {
      // Format the message
      const newMessage = {
        senderId: teacherInfo.id,
        senderName: teacherInfo.name,
        receiverId: activeStudent.id,
        receiverName: activeStudent.name,
        content: message.trim()
      }
      
      // Send the message to API
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newMessage)
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Add the message to the current messages with a properly formatted timestamp
      const now = new Date();
      setMessages(prev => [
        ...prev,
        {
          id: data.messageId,
          ...newMessage,
          timestamp: now,
          read: false,
          isSelf: true
        }
      ])
      
      // Clear the input
      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleStudentSelect = (student: Student) => {
    setActiveStudent(student)
    if (isMobile) {
      setShowSidebar(false)
    }
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return ""
    
    try {
      // Handle Firestore Timestamp objects
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        }).format(timestamp.toDate())
      }
      
      // Handle server timestamp object format
      if (typeof timestamp === 'object' && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        return new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        }).format(date);
      }
      
      // Handle ISO string or other date formats
      const date = new Date(timestamp)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log("Invalid timestamp format:", timestamp);
        return "Unknown time"
      }
      
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true
      }).format(date)
    } catch (error) {
      console.error("Error formatting timestamp:", error, "Timestamp value:", timestamp)
      return "Unknown time"
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex h-full overflow-hidden rounded-lg border bg-background shadow">
        {/* Sidebar */}
        <div
          className={cn(
            "flex flex-col w-full md:w-80 border-r transition-all duration-300 ease-in-out",
            showSidebar ? "block" : "hidden",
            isMobile && showSidebar ? "absolute inset-0 z-50 bg-background" : "",
          )}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Messages</h2>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="p-3 border-b space-y-3">
            {/* Subject Filter Dropdown */}
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject, index) => (
                  <SelectItem key={`${subject}-${index}`} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loadingStudents ? (
              <div className="flex items-center justify-center h-full p-4">
                <p>Loading students...</p>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="space-y-1 p-2">
                {filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-lg p-3 text-left transition-colors",
                      activeStudent?.id === student.id ? "bg-primary/10 text-primary" : "hover:bg-muted",
                    )}
                    onClick={() => handleStudentSelect(student)}
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={student.avatar || ""} alt={student.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {student.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-medium">{student.name}</p>
                        {student.unread && student.unread > 0 && (
                          <Badge variant="default" className="ml-2">
                            {student.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {student.class} - Roll #{student.rollNumber}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No students found
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn("flex flex-col flex-1", !showSidebar || !isMobile ? "block" : "hidden")}>
          {activeStudent ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)}>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={activeStudent.avatar || ""} alt={activeStudent.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {activeStudent.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium leading-none">{activeStudent.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeStudent.class} - Roll #{activeStudent.rollNumber}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      console.log("Rendering message:", message.id, message.content, "isSelf:", message.isSelf, "timestamp:", message.timestamp ? typeof message.timestamp : "undefined");
                      
                      // Make sure we have valid message content
                      if (!message.content) {
                        console.log("Skipping message with no content:", message.id);
                        return null;
                      }
                      
                      return (
                        <div key={message.id} className={`flex ${message.isSelf ? "justify-end" : "justify-start"}`}>
                          {!message.isSelf && (
                            <Avatar className="h-8 w-8 mr-2 mt-1 hidden sm:block">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {message.senderName?.split(" ").map(n => n[0]).join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2",
                              message.isSelf
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-muted rounded-tl-none",
                            )}
                          >
                            <p className="text-sm sm:text-base">{message.content}</p>
                            <p
                              className={cn(
                                "mt-1 text-xs",
                                message.isSelf ? "text-primary-foreground/70" : "text-muted-foreground",
                              )}
                            >
                              {formatTimestamp(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>No messages yet</p>
                    <p className="text-sm">Send a message to start a conversation</p>
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <form className="flex gap-2" onSubmit={handleSendMessage}>
                  <Input
                    className="flex-1"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="rounded-full"
                    disabled={!message.trim()}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
              <p className="text-lg mb-2">Select a student to start messaging</p>
              <p className="text-sm text-center">
                You can send messages to your students and receive responses in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

