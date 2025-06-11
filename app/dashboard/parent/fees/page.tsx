"use client"

import { useState } from "react"
import { CreditCard, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FeeData {
  totalDue: string
  dueDate: string
  status: string
  breakdown: {
    type: string
    amount: string
    dueDate: string
    status: string
  }[]
  history: {
    receipt: string
    date: string
    amount: string
    method: string
  }[]
}

interface FeeDataMap {
  [key: string]: FeeData
}

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState("emma")

  const children = [
    { id: "emma", name: "Emma Johnson", grade: "Grade 10" },
    { id: "michael", name: "Michael Johnson", grade: "Grade 7" },
  ]

  const feeData: FeeDataMap = {
    emma: {
      totalDue: "$470",
      dueDate: "May 15, 2023",
      status: "Pending",
      breakdown: [
        { type: "Tuition Fee", amount: "$350", dueDate: "May 15, 2023", status: "Pending" },
        { type: "Lab Fee", amount: "$120", dueDate: "June 5, 2023", status: "Pending" },
        { type: "Library Fee", amount: "$50", dueDate: "January 10, 2023", status: "Paid" },
        { type: "Registration Fee", amount: "$100", dueDate: "September 5, 2022", status: "Paid" },
      ],
      history: [
        { receipt: "REC-2023-001", date: "January 10, 2023", amount: "$50", method: "Credit Card" },
        { receipt: "REC-2022-042", date: "September 5, 2022", amount: "$100", method: "Bank Transfer" },
        { receipt: "REC-2022-015", date: "January 15, 2022", amount: "$500", method: "Credit Card" },
      ],
    },
    michael: {
      totalDue: "$250",
      dueDate: "May 20, 2023",
      status: "Pending",
      breakdown: [
        { type: "Tuition Fee", amount: "$250", dueDate: "May 20, 2023", status: "Pending" },
        { type: "Library Fee", amount: "$40", dueDate: "January 10, 2023", status: "Paid" },
        { type: "Registration Fee", amount: "$80", dueDate: "September 5, 2022", status: "Paid" },
      ],
      history: [
        { receipt: "REC-2023-002", date: "January 10, 2023", amount: "$40", method: "Credit Card" },
        { receipt: "REC-2022-043", date: "September 5, 2022", amount: "$80", method: "Bank Transfer" },
        { receipt: "REC-2022-016", date: "January 15, 2022", amount: "$400", method: "Credit Card" },
      ],
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Information</h1>
        <p className="text-muted-foreground">View fee details and payment status for your children</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Fee Summary</CardTitle>
          <CardDescription>Total fees due for all children</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Due</p>
              <p className="text-3xl font-bold text-primary">$720</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-sm font-medium text-muted-foreground">Next Payment</p>
              <p className="text-xl font-semibold">May 15, 2023</p>
            </div>
            <div className="flex items-center justify-center">
              <Button className="w-full md:w-auto">
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emma">Emma Johnson</TabsTrigger>
          <TabsTrigger value="michael">Michael Johnson</TabsTrigger>
        </TabsList>

        {children.map((child) => (
          <TabsContent key={child.id} value={child.id} className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Fee Status</CardTitle>
                <CardDescription>
                  {child.name} - {child.grade}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Fee Due</p>
                    <p className="text-3xl font-bold">{feeData[child.id].totalDue}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-xl font-semibold">{feeData[child.id].dueDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">{feeData[child.id].status}</Badge>
                  </div>
                  <Button>Pay Now</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fee Breakdown</CardTitle>
                <CardDescription>Detailed breakdown of fees</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeData[child.id].breakdown.map((fee, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{fee.type}</TableCell>
                        <TableCell>{fee.amount}</TableCell>
                        <TableCell>{fee.dueDate}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              fee.status === "Paid"
                                ? "bg-green-500 hover:bg-green-600"
                                : fee.status === "Pending"
                                  ? "bg-yellow-500 hover:bg-yellow-600"
                                  : "bg-red-500 hover:bg-red-600"
                            }
                          >
                            {fee.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>Record of previous payments</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeData[child.id].history.map((payment, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{payment.receipt}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{payment.amount}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

