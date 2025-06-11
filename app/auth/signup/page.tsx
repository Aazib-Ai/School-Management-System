import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center justify-center space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Create an Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign up to get started
          </p>
        </div>
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  );
} 