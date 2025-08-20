import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { User } from '@/types'

// const supabase = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// )

// export async function POST(req: NextRequest) {
//   const body = await req.json()
//   const user: User = body

//   if (!user.email || !user.invited_by) {
//     return NextResponse.json({ error: 'Missing data' }, { status: 400 })
//   }

//   const { data, error } = await supabase
//     .from('users')
//     .insert([
//       { email, invited_by },
//     ])
//     .select()

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }

//   return NextResponse.json({ success: true })
// }
