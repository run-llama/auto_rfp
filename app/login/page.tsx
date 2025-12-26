'use client';

import { signInWithMagicLink } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Github, Lock, Mail } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Column: Login Form */}
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">Sign in to your account or create a new one.</p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
  

  

              <form action={signInWithMagicLink} method="POST" className="space-y-6">
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </Button>
                </div>
              </form>
              
              <p className="mt-4 text-center text-xs text-gray-500">
                We&apos;ll email you a magic link for a password-free sign in.
              </p>

            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Quote */}
      <div className="relative hidden lg:flex flex-1 items-center justify-center px-6 bg-slate-800">
        {/* <div className="w-full max-w-md text-center">
          <div className="relative">
            <span className="absolute -top-8 -left-8 text-8xl font-bold text-slate-700 opacity-75">"</span>
            <p className="text-2xl font-medium text-white leading-relaxed">
              Now things are starting to get interesting! Firebase has long been the obvious choice for many #flutter devs for the ease of use. But their databases are NoSQL, which has its downsides... Seems like @supabase is working on something interesting here!
            </p>
            <span className="absolute -bottom-8 -right-8 text-8xl font-bold text-slate-700 opacity-75">"</span>
          </div>
          <div className="mt-8 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-gray-600 mr-3">
              RB 
            </div>
            <p className="text-base font-medium text-slate-300">@RobertBrunhage</p>
          </div>
        </div> */}
      </div>
    </div>
  )
}