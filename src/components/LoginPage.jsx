import { useEffect } from 'react'

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'http://localhost:3000'

export default function LoginPage() {
  useEffect(() => { window.location.replace(PORTAL_URL) }, [])
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif', color:'#582E73', fontSize:14 }}>
      Redirigiendo al portal…
    </div>
  )
}
