import Image from "next/image"
import Link from "next/link"
import { LoginForm } from "@/components/login-form"


export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex items-center space-x-2">
            <Image
              src="/placeholder.svg?height=40&width=40"
              alt="School Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <h1 className="text-2xl font-bold tracking-tight text-primary">School Management System</h1>
          </div>
          <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
        </div>
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <LoginForm />
        </div>
        <div className="mt-4 text-center text-sm">
          <p className="text-muted-foreground">
            Need help?{" "}
            <Link href="#" className="font-medium text-primary underline underline-offset-4">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
