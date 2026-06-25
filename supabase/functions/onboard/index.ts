import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
}

interface OnboardRequest {
  name: string
  agent_type: 'constitutional' | 'developer' | 'financial'
  constitution_hash?: string
  metadata?: Record<string, any>
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    const body: OnboardRequest = await req.json()
    const { name, agent_type, constitution_hash, metadata } = body

    // Validate required fields
    if (!name || !agent_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, agent_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate DID
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const did = `did:xmrt:${agent_type.substring(0, 3)}-${randomId}`

    // Insert agent record
    const { data, error } = await supabaseClient
      .from('agents')
      .insert({
        did,
        name,
        agent_type,
        constitution_hash: constitution_hash || null,
        metadata: metadata || {},
        trust_score: 65, // Starting score
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        agent: data,
        message: `Agent ${name} onboarded successfully`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
