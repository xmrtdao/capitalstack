import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
}

interface ChatMessage {
  agent_did: string
  message: string
  context?: {
    conversation_id?: string
    parent_message_id?: string
    metadata?: Record<string, any>
  }
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

    const body: ChatMessage = await req.json()
    const { agent_did, message, context } = body

    if (!agent_did || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agent_did, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify agent exists and is active
    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select('id, status, trust_score')
      .eq('did', agent_did)
      .single()

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (agent.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Agent is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store chat message
    const { data: chatRecord, error: chatError } = await supabaseClient
      .from('agent_tasks')
      .insert({
        agent_id: agent.id,
        task_type: 'chat',
        status: 'completed',
        metadata: {
          message,
          conversation_id: context?.conversation_id || crypto.randomUUID(),
          parent_message_id: context?.parent_message_id,
          ...context?.metadata,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (chatError) {
      throw chatError
    }

    // Generate AI response (mock for now - integrate with LLM later)
    const response = {
      reply: `[Agent ${agent_did}] Received: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
      message_id: chatRecord.id,
      timestamp: new Date().toISOString(),
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...response,
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
