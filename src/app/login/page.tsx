'use client'

import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Bienvenido a TaskCanvas ♥️</h1>
        <p>Por favor, inicia sesión con tu cuenta de Google</p>
        <></>
        <button
          onClick={() => signIn("google", { callbackUrl: "/canvas" })}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            background: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  )
}
