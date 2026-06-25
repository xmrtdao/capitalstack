import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
}

interface TrustScoreRequest {
  agent_did: string
  event_type: string
  delta: number
  note?: string
}

// Trust score bounds
const MIN_SCORE = 0
const MAX_SCORE = 100
const STARTING_SCORE = 65

// Event type multipliers
const EVENT_MULTIPLIERS: Record<string, number> = {
  'governance_vote': 1.0,
  'code_contribution': 1.2,
  'security_audit': 1.5,
  'proposal_sponsor': 1.1,
  'task_completion': 1.0,
  'rule_violation': 2.0, // Higher impact for violations
  'cac_violation': 3.0, // Severe
  'successful_chat': 0.5,
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

    const body: TrustScoreRequest = await req.json()
    const { agent_did, event_type, delta, note } = body

    if (!agent_did || !event_type || delta === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agent_did, event_type, delta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get agent
    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select('id, trust_score, status')
      .eq('did', agent_did)
      .single()

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Apply multiplier
    const multiplier = EVENT_MULTIPLIERS[event_type] || 1.0
    const adjustedDelta = Math.round(delta * multiplier)

    // Calculate new score with bounds
    const newScore = Math.max(
      MIN_SCORE,
      Math.min(MAX_SCORE, agent.trust_score + adjustedDelta)
    )

    // Update agent trust score
    const { error: updateError } = await supabaseClient
      .from('agents')
      .update({ trust_score: newScore })
      .eq('id', agent.id)

    if (updateError) {
      throw updateError
    }

    // Record trust event
    const { data: eventRecord } = await supabaseClient
      .from('trust_events')
      .insert({
        agent_id: agent.id,
        event_type,
        delta: adjustedDelta,
        score_after: newScore,
        note: note || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Determine status changes based on score
    let statusChange = null
    if (newScore < 25 && agent.status === 'active') {
      statusChange = 'suspended'
      await supabaseClient
        .from('agents')
        .update({ status: 'suspended' })
        .eq('id', agent.id)
    } else if (newScore >= 50 && agent.status === 'suspended') {
      statusChange = 'active'
      await supabaseClient
        .from('agents')
        .update({ status: 'active' })
        .eq('id', agent.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        agent_did,
        previous_score: agent.trust_score,
        new_score: newScore,
        delta: adjustedDelta,
        multiplier,
        event_id: eventRecord?.id,
        status_change: statusChange,
        timestamp: new Date().toISOString(),
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
