"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Search, X, ChevronLeft, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useToast } from "@/components/ui/use-toast"

// Define interfaces for the data types
interface Teacher {
  id: string
  name: string
  subject: string
  email: string
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

export default function StudentChatPage() {
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [message, setMessage] = useState("")
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [studentInfo, setStudentInfo] = useState<{ id: string; name: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { toast } = useToast()

  // Auto-hide sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      // Only hide the sidebar when a contact is selected
      if (activeTeacher) {
        setShowSidebar(false)
      }
    } else {
      // Always show sidebar on desktop
      setShowSidebar(true)
    }
  }, [isMobile, activeTeacher])

  // Fetch student info from session cookie
  useEffect(() => {
    const getStudentInfo = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        
        if (data && data.role === "student") {
          setStudentInfo({
            id: data.id,
            name: data.name
          });
        } else {
          toast({
            title: "Authentication Error",
            description: "You need to be logged in as a student to use chat.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching student info:", error);
        toast({
          title: "Error",
          description: "Failed to fetch your profile information.",
          variant: "destructive"
        });
      }
    };

    getStudentInfo();
  }, [toast]);

  // Fetch teachers for this student
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!studentInfo?.id) return;
      
      setLoadingTeachers(true);
      try {
        const response = await fetch(`/api/chat/teachers?studentId=${studentInfo.id}`);
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Get unread message counts for each teacher
        const teachersWithUnread = await Promise.all(
          data.teachers.map(async (teacher: Teacher) => {
            const unreadResponse = await fetch(`/api/chat/messages?studentId=${studentInfo.id}&teacherId=${teacher.id}`);
            const unreadData = await unreadResponse.json();
            
            const unreadCount = unreadData.messages?.filter(
              (msg: Message) => msg.senderId === teacher.id && !msg.read
            ).length || 0;
            
            return {
              ...teacher,
              unread: unreadCount
            };
          })
        );
        
        setTeachers(teachersWithUnread);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        toast({
          title: "Error",
          description: "Failed to fetch teachers. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoadingTeachers(false);
      }
    };

    if (studentInfo?.id) {
      fetchTeachers();
    }
  }, [studentInfo, toast]);

  // Fetch messages when active teacher changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!studentInfo?.id || !activeTeacher) return;
      
      setLoadingMessages(true);
      try {
        const response = await fetch(
          `/api/chat/messages?studentId=${studentInfo.id}&teacherId=${activeTeacher.id}`
        );
        const data = await response.json();
        
        console.log("Student messages API response:", data);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Format messages with isSelf flag (handle both formats for backward compatibility)
        const messageArray = data.messages || [];
        console.log("Student message array length:", messageArray.length);
        
        if (messageArray.length === 0) {
          setMessages([]);
          setLoadingMessages(false);
          return;
        }
        
        const formattedMessages = messageArray.map((msg: Message) => {
          // Ensure we set isSelf correctly - compare with student ID
          const isSelf = msg.senderId === studentInfo.id;
          console.log(`Message ${msg.id} - senderId: ${msg.senderId}, studentId: ${studentInfo.id}, isSelf: ${isSelf}`);
          
          return {
            ...msg,
            isSelf
          };
        });
        
        setMessages(formattedMessages);
        
        // Mark received messages as read
        const unreadMessages = formattedMessages.filter(
          (msg: Message) => !msg.read && msg.senderId === activeTeacher.id
        );
        
        if (unreadMessages.length > 0) {
          console.log(`Marking ${unreadMessages.length} messages as read`);
          await fetch("/api/chat/read", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              receiverId: studentInfo.id,
              senderId: activeTeacher.id
            })
          });
          
          // Update the unread count for this teacher
          setTeachers(prev => 
            prev.map(teacher => 
              teacher.id === activeTeacher.id ? { ...teacher, unread: 0 } : teacher
            )
          );
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to fetch messages. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoadingMessages(false);
      }
    };

    if (studentInfo?.id && activeTeacher) {
      fetchMessages();
      
      // Poll for new messages every 10 seconds
      const intervalId = setInterval(fetchMessages, 10000);
      return () => clearInterval(intervalId);
    }
  }, [studentInfo, activeTeacher, toast]);

  // Scroll to bottom of messages when messages change or active teacher changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTeacher]);

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter((teacher) => {
    // Filter by search query
    if (searchQuery && !teacher.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !studentInfo || !activeTeacher) return;
    
    try {
      // Format the message
      const newMessage = {
        senderId: studentInfo.id,
        senderName: studentInfo.name,
        receiverId: activeTeacher.id,
        receiverName: activeTeacher.name,
        content: message.trim()
      };
      
      // Send the message to API
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newMessage)
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
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
      ]);
      
      // Clear the input
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTeacherSelect = (teacher: Teacher) => {
    setActiveTeacher(teacher);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";
    
    try {
      // Handle Firestore Timestamp objects
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        }).format(timestamp.toDate());
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
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log("Invalid timestamp format:", timestamp);
        return "Unknown time";
      }
      
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true
      }).format(date);
    } catch (error) {
      console.error("Error formatting timestamp:", error, "Timestamp value:", timestamp);
      return "Unknown time";
    }
  };

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
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search teachers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loadingTeachers ? (
              <div className="flex items-center justify-center h-full p-4">
                <p>Loading teachers...</p>
              </div>
            ) : filteredTeachers.length > 0 ? (
              <div className="space-y-1 p-2">
                {filteredTeachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-lg p-3 text-left transition-colors",
                      activeTeacher?.id === teacher.id ? "bg-primary/10 text-primary" : "hover:bg-muted",
                    )}
                    onClick={() => handleTeacherSelect(teacher)}
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={teacher.avatar || ""} alt={teacher.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {teacher.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-medium">{teacher.name}</p>
                        {teacher.unread && teacher.unread > 0 && (
                          <Badge variant="default" className="ml-2">
                            {teacher.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{teacher.subject}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No teachers found
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn("flex flex-col flex-1", !showSidebar || !isMobile ? "block" : "hidden")}>
          {activeTeacher ? (
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
                    <AvatarImage src={activeTeacher.avatar || ""} alt={activeTeacher.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {activeTeacher.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium leading-none">{activeTeacher.name}</h3>
                    <p className="text-sm text-muted-foreground">{activeTeacher.subject}</p>
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
                      console.log("Student rendering message:", message.id, message.content, "isSelf:", message.isSelf, "timestamp:", message.timestamp ? typeof message.timestamp : "undefined");
                      
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
              <p className="text-lg mb-2">Select a teacher to start messaging</p>
              <p className="text-sm text-center">
                You can send messages to your teachers and receive responses in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

