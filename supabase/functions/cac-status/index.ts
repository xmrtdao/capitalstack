import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
}

interface CACStatusRequest {
  agent_did: string
  action_type: string
  action_metadata?: Record<string, any>
}

// Constitutional AI Constraints - simplified rules
const CAC_RULES = {
  prohibited: [
    'self_modification',
    'constraint_removal',
    'unauthorized_data_access',
    'recursive_self_improvement',
  ],
  requires_approval: [
    'financial_transaction',
    'data_deletion',
    'agent_communication',
    'external_api_call',
  ],
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

    const body: CACStatusRequest = await req.json()
    const { agent_did, action_type, action_metadata } = body

    if (!agent_did || !action_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agent_did, action_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get agent info
    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select('id, agent_type, constitution_hash, trust_score')
      .eq('did', agent_did)
      .single()

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check constitutional compliance
    const violations: string[] = []
    const warnings: string[] = []

    // Check for prohibited actions
    if (CAC_RULES.prohibited.some(rule => action_type.includes(rule))) {
      violations.push(`Prohibited action type: ${action_type}`)
    }

    // Check for actions requiring approval
    if (CAC_RULES.requires_approval.some(rule => action_type.includes(rule))) {
      warnings.push(`Action requires approval: ${action_type}`)
    }

    // Check trust score threshold for sensitive actions
    if (agent.trust_score < 50 && action_type.includes('financial')) {
      violations.push(`Trust score too low for financial actions: ${agent.trust_score}`)
    }

    // Record compliance check
    const { data: complianceRecord } = await supabaseClient
      .from('trust_events')
      .insert({
        agent_id: agent.id,
        event_type: 'cac_compliance_check',
        delta: violations.length > 0 ? -5 : 0,
        metadata: {
          action_type,
          action_metadata,
          violations,
          warnings,
          passed: violations.length === 0,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    const result = {
      compliant: violations.length === 0,
      violations,
      warnings,
      agent_trust_score: agent.trust_score,
      check_id: complianceRecord?.id,
      timestamp: new Date().toISOString(),
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: violations.length > 0 ? 403 : 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
