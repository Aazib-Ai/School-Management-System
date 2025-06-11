"use client"

import { useEffect, useState } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface Result {
  id: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  examType: string;
  submittedAt: Date;
  marks: number;
  letterGrade: string;
  teacherId: string;
}

interface Summary {
  averageGrade: string;
  totalSubjects: number;
  status: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setError(null);
        const response = await fetch('/api/results/student');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to fetch results');
        }
        const data = await response.json();
        setResults(data.results);
        setSummary(data.summary);
      } catch (error) {
        console.error('Error fetching results:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch results');
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to fetch your results',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Results</h1>
          <p className="text-muted-foreground">Loading your marks and grades...</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Results</h1>
          <p className="text-muted-foreground">View your marks and grades</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Results</h1>
        <p className="text-muted-foreground">View your marks and grades</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Term Summary</CardTitle>
          <CardDescription>Current term performance</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Average Grade</p>
              <p className="text-3xl font-bold">{summary?.averageGrade || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Term</p>
              <p className="text-xl font-semibold">Current Term</p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge className={
                summary?.status === "Excellent" ? "bg-green-500 hover:bg-green-600"
                : summary?.status === "Good Standing" ? "bg-blue-500 hover:bg-blue-600"
                : summary?.status === "Satisfactory" ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-red-500 hover:bg-red-600"
              }>
                {summary?.status || "N/A"}
              </Badge>
            </div>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Download Report Card
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject Marks</CardTitle>
          <CardDescription>Your marks for each subject</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Exam Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No results available yet
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.subjectName}</TableCell>
                    <TableCell>{result.marks}/100</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          result.letterGrade.startsWith("A")
                            ? "bg-green-500 hover:bg-green-600"
                            : result.letterGrade.startsWith("B")
                              ? "bg-blue-500 hover:bg-blue-600"
                              : result.letterGrade.startsWith("C")
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : "bg-red-500 hover:bg-red-600"
                        }
                      >
                        {result.letterGrade}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.examType.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Previous Terms</CardTitle>
          <CardDescription>Your past academic performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>Average Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Report Card</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Previous term data will be available soon
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

