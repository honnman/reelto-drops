'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DropSellerProfile } from '@/lib/types'

export function useSellerAuth() {
  const router = useRouter()
  const [seller, setSeller] = useState<DropSellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      const token = localStorage.getItem('drop_seller_token')
      if (!token) { router.replace('/seller/login'); return }

      const { data, error } = await supabase.rpc('get_seller_by_token', { p_token: token })

      if (error) {
        setAuthError(`RPC error: ${error.message} (code: ${error.code})`)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setAuthError('Token valid but no seller found — redirecting...')
        setTimeout(() => router.replace('/seller/login'), 2000)
        return
      }

      setSeller(data[0] as DropSellerProfile)
      setLoading(false)
    }
    check()
  }, [router])

  return { seller, loading, authError }
}
