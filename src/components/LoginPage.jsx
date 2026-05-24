import { useEffect } from 'react'

export default function LoginPage() {
  useEffect(() => { window.location.replace('/') }, [])
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif', color:'#582E73', fontSize:14 }}>
      Redirigiendo al portal…
    </div>
  )
}
