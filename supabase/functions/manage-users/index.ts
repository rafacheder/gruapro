import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Check if requester is master or admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['master', 'admin'])
      .single()

    if (!roleData) throw new Error('Forbidden: Only masters and admins can manage users')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...payload } = await req.json()

    switch (action) {
      case 'create': {
        const { username, password, nome_completo } = payload
        // If it doesn't look like an email, make it one
        const email = username.includes('@') ? username : `${username}@system.local`

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { nome_completo }
        })

        if (createError) throw createError

        return new Response(JSON.stringify(newUser), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'update': {
        const { user_id, email, password, nome_completo } = payload
        if (!user_id) throw new Error('user_id is required')

        const updateData: any = {}
        if (email) updateData.email = email
        if (password) updateData.password = password
        if (nome_completo) updateData.user_metadata = { nome_completo }

        const { data, error } = await adminClient.auth.admin.updateUserById(user_id, updateData)
        if (error) throw error

        // Explicitly update profiles table as well to keep it in sync
        if (nome_completo || email) {
          const profileUpdate: any = {}
          if (nome_completo) profileUpdate.nome_completo = nome_completo
          if (email) profileUpdate.email = email
          await adminClient.from('profiles').update(profileUpdate).eq('id', user_id)
        }

        return new Response(JSON.stringify({ ok: true, user: data.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'delete': {
        const { user_id } = payload
        if (!user_id) throw new Error('user_id is required')

        const { error } = await adminClient.auth.admin.deleteUser(user_id)
        if (error) throw error

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'reset_password': {
        const { user_id, new_password } = payload
        if (!user_id || !new_password) throw new Error('user_id and new_password are required')
        const { data, error } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password })
        if (error) throw error
        return new Response(JSON.stringify({ ok: true, user: data.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      default:
        throw new Error('Invalid action')
    }
   } catch (error: any) {
     return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
