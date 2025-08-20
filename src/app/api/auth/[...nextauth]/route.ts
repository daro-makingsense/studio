import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabase } from '@/lib/supabase'


const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }: { user: any }) {
      // console.log('signIn', user)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error || !data) {
        return false
      }
      
      user.role = data.role
      return true
    },
    async jwt({ token, user }: { token: any, user?: any }) {
      if (user?.role) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: any, token: any }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    },
  },
  // debug: process.env.NODE_ENV !== 'production',
})

export { handler as GET, handler as POST }
