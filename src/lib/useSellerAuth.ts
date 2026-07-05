'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { DropSellerProfile } from '@/lib/types'

export function useSellerAuth() {
  const router = useRouter()
  const [seller, setSeller] = useState<DropSellerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      const token = localStorage.getItem('drop_seller_token')
      if (!token) { router.replace('/seller/login'); return }

      const { data: session } = await supabaseAdmin
        .from('drop_seller_sessions')
        .select('drop_seller_id, token_expires_at')
        .eq('token', token)
        .gt('token_expires_at', new Date().toISOString())
        .maybeSingle()

      if (!session) { router.replace('/seller/login'); return }

      const { data: profile } = await supabaseAdmin
        .from('drop_seller_profiles')
        .select('*')
        .eq('id', session.drop_seller_id)
        .single()

      if (!profile) { router.replace('/seller/login'); return }

      setSeller(profile as DropSellerProfile)
      setLoading(false)
    }
    check()
  }, [router])

  return { seller, loading }
}
