'use client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function SellerNav() {
  const router = useRouter()
  const pathname = usePathname()

  function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('drop_seller_token')
    }
    router.push('/seller/login')
  }

  const navLink = (href: string, label: string) => {
    const active = pathname.startsWith(href)
    return (
      <Link
        href={href}
        style={{
          color: active ? '#DB2877' : '#9a8f87',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: active ? 600 : 400,
          transition: 'color 0.15s',
        }}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav
      style={{
        height: '56px',
        background: '#fff',
        borderBottom: '1px solid #e8e0d8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontFamily: 'var(--font-playfair), serif',
          fontSize: '18px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #EA580C, #DB2877)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.3px',
        }}
      >
        Reelto Drop
      </span>

      {/* Center links */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {navLink('/seller/dashboard', 'Dashboard')}
        {navLink('/seller/drops', 'Drops')}
        {navLink('/seller/products', 'Products')}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        style={{
          background: 'transparent',
          border: '1px solid #e8e0d8',
          color: '#9a8f87',
          fontSize: '13px',
          borderRadius: '8px',
          padding: '6px 14px',
          cursor: 'pointer',
          transition: 'border-color 0.15s, color 0.15s',
        }}
      >
        Logout
      </button>
    </nav>
  )
}
