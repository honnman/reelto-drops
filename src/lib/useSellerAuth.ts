'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DropSellerProfile } from '@/lib/types'

export function useSellerAuth() {
  const router = useRouter()
  const [seller, setSeller] = useState<DropSellerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      const token = localStorage.getItem('drop_seller_token')
      if (!token) { router.replace('/seller/login'); return }

      const { data, error } = await supabase.rpc('get_seller_by_token', { p_token: token })

      if (error || !data || data.length === 0) {
        router.replace('/seller/login')
        return
      }

      setSeller(data[0] as DropSellerProfile)
      setLoading(false)
    }
    check()
  }, [router])

  return { seller, loading }
}
