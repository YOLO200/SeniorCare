"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { signUp, signUpWithGoogle } from "@/lib/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-violet-500 hover:bg-violet-600 text-white py-4 text-base sm:py-3 sm:text-sm font-medium rounded-lg h-12 sm:h-10 transition-colors"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing up...
        </>
      ) : (
        "Sign Up"
      )}
    </Button>
  );
}

function GoogleSignUpButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      onClick={signUpWithGoogle}
      disabled={pending}
      className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 py-4 text-base sm:py-3 sm:text-sm font-medium rounded-lg h-12 sm:h-10 flex items-center justify-center transition-colors"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing up...
        </>
      ) : (
        <>
          <svg
            className="mr-2 sm:mr-2 h-4 w-4 sm:h-4 sm:w-4"
            viewBox="0 0 24 24"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="hidden sm:inline">Continue with Google</span>
          <span className="sm:hidden">Google</span>
        </>
      )}
    </Button>
  );
}

export default function SignUpForm() {
  const [state, formAction] = useActionState(signUp, null);

  return (
    <div
      className="w-screen h-screen flex items-center justify-center"
      style={{
        background:
          "linear-gradient(to bottom right, #DBEAFE, #F1F5F9 50%, #E9D5FF)",
      }}
    >
      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 px-4 sm:px-6 md:px-12 py-10">
        {/* Branding */}
        <div className="hidden lg:block text-center">
          <h2 className="text-5xl font-bold text-violet-700 mb-4">CareAI</h2>
          <p className="text-slate-600 text-lg max-w-xs">
            Empowering families with smart elder care.
          </p>
        </div>

        {/* Form */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur-sm px-10 py-12 rounded-2xl shadow-lg space-y-10">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">C</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-800">Join CareAI</h1>
            <p className="text-lg text-slate-700">
              Create your account to get started
            </p>
          </div>

          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-base sm:text-sm">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="bg-violet-50 border border-violet-200 text-violet-700 px-4 py-3 rounded-lg text-base sm:text-sm">
              {state.success}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="firstName"
                    className="block text-base text-slate-700"
                  >
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                    className="h-12 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="lastName"
                    className="block text-base text-slate-700"
                  >
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    className="h-12 sm:h-10 text-base sm:text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-base text-slate-700"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="h-12 sm:h-10 text-base sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-base text-slate-700"
                >
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-12 sm:h-10 text-base sm:text-sm"
                />
              </div>
            </div>
            <SubmitButton />
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase text-slate-600">
              <span className="bg-white px-3">Or</span>
            </div>
          </div>

          <GoogleSignUpButton />

          <div className="text-center text-base sm:text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-violet-600 hover:text-violet-700 hover:underline font-medium"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
