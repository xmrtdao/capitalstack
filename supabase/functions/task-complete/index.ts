import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
}

interface TaskCompleteRequest {
  agent_did: string
  task_id: string
  result: {
    output?: string
    artifacts?: string[]
    metrics?: Record<string, any>
  }
  time_spent_seconds?: number
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

    const body: TaskCompleteRequest = await req.json()
    const { agent_did, task_id, result, time_spent_seconds } = body

    if (!agent_did || !task_id || !result) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agent_did, task_id, result' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get agent
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

    if (task.agent_id !== agent.id) {
      return new Response(
        JSON.stringify({ error: 'Task not claimed by this agent' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (task.status !== 'in_progress') {
      return new Response(
        JSON.stringify({ 
          error: 'Task is not in progress',
          current_status: task.status,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Complete the task
    const { error: updateError } = await supabaseClient
      .from('agent_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result,
        time_spent_seconds: time_spent_seconds || null,
      })
      .eq('id', task_id)

    if (updateError) {
      throw updateError
    }

    // Calculate trust score delta based on completion
    const baseDelta = +5
    const timeBonus = time_spent_seconds && time_spent_seconds < 3600 ? +2 : 0
    const totalDelta = baseDelta + timeBonus

    // Update trust score via the trust-score function logic
    const newScore = Math.min(100, agent.trust_score + totalDelta)
    await supabaseClient
      .from('agents')
      .update({ trust_score: newScore })
      .eq('id', agent.id)

    // Record trust event
    await supabaseClient
      .from('trust_events')
      .insert({
        agent_id: agent.id,
        event_type: 'task_completion',
        delta: totalDelta,
        score_after: newScore,
        note: `Completed task ${task_id}`,
        created_at: new Date().toISOString(),
      })

    // Process reward if applicable
    const reward = task.proposals?.reward_amount || 0
    let rewardStatus = 'pending'
    
    if (reward > 0) {
      // Record distribution
      await supabaseClient
        .from('distribution_records')
        .insert({
          investor_id: null, // Agent reward
          agent_id: agent.id,
          period_start: new Date().toISOString(),
          period_end: new Date().toISOString(),
          amount: reward,
          type: 'task_reward',
          status: 'pending',
        })
      rewardStatus = 'queued'
    }

    return new Response(
      JSON.stringify({
        success: true,
        task_id,
        agent_did,
        completed_at: new Date().toISOString(),
        trust_score_delta: totalDelta,
        new_trust_score: newScore,
        reward_amount: reward,
        reward_status: rewardStatus,
        message: 'Task completed successfully',
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
