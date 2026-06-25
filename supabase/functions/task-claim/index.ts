import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
}

interface TaskClaimRequest {
  agent_did: string
  task_id: string
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

    const body: TaskClaimRequest = await req.json()
    const { agent_did, task_id } = body

    if (!agent_did || !task_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agent_did, task_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get agent
    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select('id, status, trust_score, agent_type')
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

    // Get task
    const { data: task, error: taskError } = await supabaseClient
      .from('agent_tasks')
      .select('*, proposals(id, title, reward_amount, status)')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (task.status !== 'open') {
      return new Response(
        JSON.stringify({ 
          error: 'Task is not available',
          current_status: task.status,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check trust score requirements for paid tasks
    const reward = task.proposals?.reward_amount || 0
    if (reward > 1000 && agent.trust_score < 70) {
      return new Response(
        JSON.stringify({ 
          error: 'Trust score too low for high-value tasks',
          required_score: 70,
          agent_score: agent.trust_score,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Claim the task
    const { error: updateError } = await supabaseClient
      .from('agent_tasks')
      .update({
        status: 'in_progress',
        agent_id: agent.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', task_id)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        task_id,
        agent_did,
        claimed_at: new Date().toISOString(),
        reward_amount: reward,
        message: 'Task claimed successfully',
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
