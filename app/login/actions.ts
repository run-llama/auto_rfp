'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/utils/supabase/server'
import { env } from '@/lib/env'

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient()

  // Get email from form data
  const email = formData.get('email') as string
  
  // Validate email
  if (!email || !email.includes('@')) {
    // In a real app, you'd want to return an error message
    redirect('/error')
  }

  // Get the origin for creating the full redirect URL
  // Use Vercel URL for preview deployments, otherwise use NEXT_PUBLIC_APP_URL
  const getOrigin = () => {
    // Check if we're on Vercel (preview or production)
    if (process.env.VERCEL_URL) {
      // For Vercel deployments, use the deployment URL
      const protocol = process.env.VERCEL_ENV === 'development' ? 'http' : 'https'
      return `${protocol}://${process.env.VERCEL_URL}`
    }
    // For local development or custom deployments
    return env.get('NEXT_PUBLIC_APP_URL')!
  }

  const origin = getOrigin()
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`, // Redirect to our auth callback handler
    },
  })

  if (error) {
    redirect('/error')
  }

  // Redirect to a confirmation page
  redirect('/login/confirmation')
}

// Keep this for backward compatibility if needed, but it won't be used in the new flow
export async function login(formData: FormData) {
  redirect('/login/confirmation')
}

// Keep this for backward compatibility if needed, but it won't be used in the new flow
export async function signup(formData: FormData) {
  redirect('/login/confirmation')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}