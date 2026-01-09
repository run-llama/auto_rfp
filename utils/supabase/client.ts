import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

export function createClient() {
  return createBrowserClient(
    env.get('NEXT_PUBLIC_SUPABASE_URL')!,
    env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')!
  )
}