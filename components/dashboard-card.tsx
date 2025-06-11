"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function ChatMonitoringPage() {
  const [activeConversation, setActiveConversation] = useState("conv1")
  const [filterType, setFilterType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for conversations
  const conversations = [
    {
      id: "conv1",
      type: "student-teacher",
      participants: ["Alex Johnson (Student)", "Prof. Sarah Williams (Teacher)"],
      lastMessage: "Thank you for the explanation, Professor.",
      time: "10:42 AM",
      unread: true,
    },
    {
      id: "conv2",
      type: "parent-teacher",
      participants: ["Mr. Robert Johnson (Parent)", "Dr. Robert Chen (Teacher)"],
      lastMessage: "When would be a good time to discuss Emma's progress?",
      time: "Yesterday",
      unread: false,
    },
    {
      id: "conv3",
      type: "group",
      participants: ["Mathematics 101 - Grade 9 (Class Group)"],
      lastMessage: "Prof. Williams: Don't forget about the quiz tomorrow!",
      time: "Yesterday",
      unread: true,
    },
    {
      id: "conv4",
      type: "student-teacher",
      participants: ["Emma Davis (Student)", "Dr. Emily Parker (Teacher)"],
      lastMessage: "I'll submit the essay by Friday.",
      time: "2 days ago",
      unread: false,
    },
    {
      id: "conv5",
      type: "group",
      participants: ["Grade 10 Parents (Group)"],
      lastMessage: "Mrs. Smith: Is the field trip still scheduled for next week?",
      time: "3 days ago",
      unread: false,
    },
  ]

  const filteredConversations = conversations.filter(
    (conv) =>
      (filterType === "all" || conv.type === filterType) &&
      (searchQuery === "" ||
        conv.participants.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Mock messages for the selected conversation
  const messages = {
    conv1: [
      {
        sender: "Prof. Sarah Williams",
        content: "Hello Alex, how are you doing with the homework assignment?",
        time: "10:30 AM",
        isSelf: false,
      },
      {
        sender: "Alex Johnson",
        content: "Hi Professor, I'm working on it. I have a question about problem #3.",
        time: "10:32 AM",
        isSelf: false,
      },
      { sender: "Prof. Sarah Williams", content: "Sure, what's your question?", time: "10:33 AM", isSelf: false },
      {
        sender: "Alex Johnson",
        content: "I'm not sure how to approach the integration part. Could you provide a hint?",
        time: "10:35 AM",
        isSelf: false,
      },
      {
        sender: "Prof. Sarah Williams",
        content: "Try using substitution. Let u = x² + 1 and see where that takes you.",
        time: "10:38 AM",
        isSelf: false,
      },
      {
        sender: "Alex Johnson",
        content: "That makes sense! I'll try that approach. Thank you!",
        time: "10:40 AM",
        isSelf: false,
      },
      {
        sender: "Prof. Sarah Williams",
        content: "You're welcome! Let me know if you need further help.",
        time: "10:41 AM",
        isSelf: false,
      },
      {
        sender: "Prof. Sarah Williams",
        content: "Also, don't forget we have a quiz next week.",
        time: "10:42 AM",
        isSelf: false,
      },
    ],
    conv2: [
      {
        sender: "Mr. Robert Johnson",
        content: "Hello Dr. Chen, I hope you're doing well.",
        time: "Yesterday, 2:15 PM",
        isSelf: false,
      },
      {
        sender: "Dr. Robert Chen",
        content: "Hello Mr. Johnson, I'm doing well. How can I help you?",
        time: "Yesterday, 2:20 PM",
        isSelf: false,
      },
      {
        sender: "Mr. Robert Johnson",
        content: "I wanted to discuss Emma's progress in Physics. She mentioned she's having some difficulties.",
        time: "Yesterday, 2:22 PM",
        isSelf: false,
      },
      {
        sender: "Dr. Robert Chen",
        content:
          "Yes, I've noticed she's struggling with some of the concepts in mechanics. I'd be happy to discuss this further.",
        time: "Yesterday, 2:25 PM",
        isSelf: false,
      },
      {
        sender: "Mr. Robert Johnson",
        content: "When would be a good time to discuss Emma's progress?",
        time: "Yesterday, 2:30 PM",
        isSelf: false,
      },
    ],
    conv3: [
      {
        sender: "Prof. Sarah Williams",
        content:
          "Good afternoon everyone! I've posted the study materials for next week's lesson in the resources section.",
        time: "Yesterday, 1:00 PM",
        isSelf: false,
      },
      {
        sender: "Alex Johnson",
        content: "Thank you, Professor! Will we need to prepare anything specific for the next class?",
        time: "Yesterday, 1:05 PM",
        isSelf: false,
      },
      {
        sender: "Prof. Sarah Williams",
        content: "Yes, please review chapters 5 and 6. We'll be discussing those topics in detail.",
        time: "Yesterday, 1:10 PM",
        isSelf: false,
      },
      {
        sender: "Emma Davis",
        content: "Professor, will the quiz cover all the material from chapters 5 and 6?",
        time: "Yesterday, 1:15 PM",
        isSelf: false,
      },
      {
        sender: "Prof. Sarah Williams",
        content:
          "The quiz will focus on the key concepts from those chapters. I'll provide more details in class tomorrow.",
        time: "Yesterday, 1:20 PM",
        isSelf: false,
      },
      {
        sender: "Prof. Sarah Williams",
        content: "Don't forget about the quiz tomorrow!",
        time: "Yesterday, 3:45 PM",
        isSelf: false,
      },
    ],
    conv4: [],
    conv5: [],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat Monitoring</h1>
        <p className="text-muted-foreground">Monitor and review chat conversations within the system</p>
      </div>

      <div className="h-[calc(100vh-12rem)] grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Conversations</CardTitle>
            <div className="mt-2 space-y-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conversations</SelectItem>
                  <SelectItem value="student-teacher">Student-Teacher</SelectItem>
                  <SelectItem value="parent-teacher">Parent-Teacher</SelectItem>
                  <SelectItem value="group">Group Chats</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search conversations..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-1 p-2">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    className={`flex items-center gap-3 w-full rounded-lg p-2 text-left ${
                      activeConversation === conv.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    onClick={() => setActiveConversation(conv.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={conv.participants[0]} />
                      <AvatarFallback>
                        {conv.participants[0].split(" ")[0][0] + (conv.participants[0].split(" ")[1]?.[0] || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-medium">
                          {conv.participants[0].split(" (")[0]}
                          {conv.participants.length > 1 && " + " + (conv.participants.length - 1)}
                        </p>
                        {conv.unread && (
                          <Badge variant="default" className="ml-2">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{conv.lastMessage}</p>
                      <p className="text-xs text-muted-foreground">{conv.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
          <CardHeader className="border-b px-4 py-3">
            <div>
              <CardTitle className="text-base">
                {activeConversation &&
                  filteredConversations.find((c) => c.id === activeConversation)?.participants.join(", ")}
              </CardTitle>
              <CardDescription>
                {activeConversation &&
                filteredConversations.find((c) => c.id === activeConversation)?.type === "student-teacher"
                  ? "Student-Teacher Conversation"
                  : activeConversation &&
                      filteredConversations.find((c) => c.id === activeConversation)?.type === "parent-teacher"
                    ? "Parent-Teacher Conversation"
                    : "Group Chat"}
              </CardDescription>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages[activeConversation as keyof typeof messages]?.length > 0 ? (
                messages[activeConversation as keyof typeof messages].map((message, i) => (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                      <p className="mb-1 text-xs font-medium">{message.sender}</p>
                      <p>{message.content}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{message.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a conversation to view messages
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-4">
            <div className="flex justify-between">
              <Button variant="outline" size="sm">
                Flag Conversation
              </Button>
              <Button variant="outline" size="sm">
                Export Chat Log
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

