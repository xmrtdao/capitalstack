'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Shield, Activity } from 'lucide-react'

interface Agent {
  id: string
  did: string
  name: string
  agent_type: 'constitutional' | 'developer' | 'financial'
  trust_score: number
  status: 'pending' | 'active' | 'suspended' | 'decommissioned'
  metadata: Record<string, unknown>
}

interface TrustEvent {
  agent_did: string
  event_type: string
  delta: number
  score_after: number
  note: string
  created_at: string
}

interface TGNode {
  id: string
  label: string
  score: number
  targetScore: number
  type: 'constitutional' | 'developer' | 'financial'
  color: string
  x: number
  y: number
  vx: number
  vy: number
  r: number
  pulsePhase: number
  lastEvent: string
  eventAlpha: number
}

interface TGEdge {
  a: TGNode
  b: TGNode
  strength: number
  flowPhase: number
}

const NODE_COLOR: Record<string, string> = {
  constitutional: '#00ffcc',
  developer: '#ffaa00',
  financial: '#aa88ff',
}

function scoreColor(s: number): string {
  if (s >= 80) return '#44ffaa'
  if (s >= 60) return '#ffbb33'
  if (s >= 35) return '#ff8800'
  return '#ff3399'
}

function scoreLabel(s: number): string {
  if (s >= 85) return 'Trusted'
  if (s >= 70) return 'Established'
  if (s >= 50) return 'Neutral'
  if (s >= 25) return 'Flagged'
  return 'Restricted'
}

function initTrustGraph(
  canvas: HTMLCanvasElement,
  agents: Agent[],
  onNodeClick: (nodeId: string | null, xFrac: number, yFrac: number) => void,
): {
  destroy: () => void
  applyEvent: (nodeId: string, delta: number, label: string) => void
  setSelected: (nodeId: string | null) => void
} {
  const ctx = canvas.getContext('2d')!
  let W = 0, H = 0
  let tick = 0
  let rafId = 0
  let nodes: TGNode[] = []
  let edges: TGEdge[] = []
  let selectedId: string | null = null
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  function resize() {
    W = canvas.offsetWidth
    H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function initNodes() {
    const cx = W / 2, cy = H / 2
    nodes = agents.map((a, i) => {
      const angle = (i / agents.length) * Math.PI * 2
      const r = Math.min(W, H) * 0.28
      return {
        id: a.did,
        label: a.name || a.did.slice(0, 12),
        score: a.trust_score ?? 65,
        targetScore: a.trust_score ?? 65,
        type: a.agent_type,
        color: NODE_COLOR[a.agent_type] || '#ffbb33',
        x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 40,
        vx: 0, vy: 0,
        r: 18 + (a.trust_score ?? 65) * 0.12,
        pulsePhase: Math.random() * Math.PI * 2,
        lastEvent: '',
        eventAlpha: 0,
      }
    })

    // Add some unknown agents
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = Math.min(W, H) * (0.12 + Math.random() * 0.38)
      nodes.push({
        id: `unknown-${i}`,
        label: `AGT-${Math.floor(Math.random() * 9000 + 1000)}`,
        score: 20 + Math.floor(Math.random() * 70),
        targetScore: 20 + Math.floor(Math.random() * 70),
        type: 'constitutional',
        color: '#ffbb33',
        x: W / 2 + Math.cos(angle) * r,
        y: H / 2 + Math.sin(angle) * r,
        vx: 0, vy: 0,
        r: 6 + Math.random() * 8,
        pulsePhase: Math.random() * Math.PI * 2,
        lastEvent: '', eventAlpha: 0,
      })
    }

    // Create edges
    edges = []
    const named = nodes.slice(0, agents.length)
    named.forEach((a, i) => {
      named.forEach((b, j) => {
        if (j > i && Math.random() > 0.3) {
          edges.push({ a, b, strength: 0.3 + Math.random() * 0.7, flowPhase: Math.random() * Math.PI * 2 })
        }
      })
      nodes.slice(agents.length).filter(() => Math.random() > 0.65).forEach(u => {
        edges.push({ a, b: u, strength: 0.15 + Math.random() * 0.3, flowPhase: Math.random() * Math.PI * 2 })
      })
    })
  }

  function physics() {
    const cx = W / 2, cy = H / 2
    nodes.forEach(n => {
      n.score += (n.targetScore - n.score) * 0.04
      n.r = (n.type === 'constitutional' ? 6 : 14) + n.score * (n.type === 'constitutional' ? 0.04 : 0.1)
      n.vx += (Math.random() - 0.5) * 0.15
      n.vy += (Math.random() - 0.5) * 0.15
      n.vx += (cx - n.x) * 0.0008
      n.vy += (cy - n.y) * 0.0008
      nodes.forEach(m => {
        if (m === n) return
        const dx = n.x - m.x, dy = n.y - m.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
        const minDist = n.r + m.r + 20
        if (dist < minDist) {
          const force = (minDist - dist) / minDist * 0.6
          n.vx += (dx / dist) * force
          n.vy += (dy / dist) * force
        }
      })
      n.vx *= 0.88; n.vy *= 0.88
      n.x += n.vx; n.y += n.vy
      const pad = n.r + 20
      if (n.x < pad) n.vx += 0.5
      if (n.x > W - pad) n.vx -= 0.5
      if (n.y < pad) n.vy += 0.5
      if (n.y > H - pad) n.vy -= 0.5
      if (n.eventAlpha > 0) n.eventAlpha -= 0.008
    })
    edges.forEach(e => { e.flowPhase += 0.018 })
  }

  function draw() {
    tick++
    ctx.clearRect(0, 0, W, H)

    // Background grid dots
    ctx.fillStyle = 'rgba(255,140,0,0.04)'
    for (let gx = 0; gx < W; gx += 40)
      for (let gy = 0; gy < H; gy += 40)
        ctx.fillRect(gx, gy, 1, 1)

    // Edges
    edges.forEach(e => {
      const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const alpha = e.strength * 0.18 * Math.min(1, 200 / dist)
      ctx.strokeStyle = `rgba(255,140,0,${alpha})`
      ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke()
      const t = ((e.flowPhase % (Math.PI * 2)) / (Math.PI * 2))
      const px = e.a.x + dx * t, py = e.a.y + dy * t
      ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = scoreColor(e.a.score)
      ctx.globalAlpha = e.strength * 0.5; ctx.fill(); ctx.globalAlpha = 1
    })

    // Nodes
    const orderedNodes = [...nodes].sort((a, b) => (a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0))

    orderedNodes.forEach(n => {
      const sc = scoreColor(n.score)
      const pulse = Math.sin(tick * 0.04 + n.pulsePhase) * 0.15 + 0.85
      const named = n.type !== 'constitutional'
      const isSelected = n.id === selectedId

      // Draw selected rings behind
      if (isSelected && named) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse + 3, 0, Math.PI * 2)
        ctx.strokeStyle = `${sc}99`; ctx.lineWidth = 1.5; ctx.stroke()
      }

      // Outer glow
      if (named) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 2.8, 0, Math.PI * 2)
        ctx.fillStyle = `${sc}22`; ctx.fill()
      }

      // Main ring
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2)
      ctx.strokeStyle = named ? `${sc}cc` : `${sc}55`
      ctx.lineWidth = named ? 1.5 : 0.5; ctx.stroke()

      // Fill
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse * 0.85, 0, Math.PI * 2)
      ctx.fillStyle = named ? `${sc}18` : `${sc}08`; ctx.fill()

      // Score arc
      if (named && !isSelected) {
        const arcEnd = -Math.PI / 2 + (Math.PI * 2) * (n.score / 100)
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse + 4, -Math.PI / 2, arcEnd)
        ctx.strokeStyle = `${sc}99`; ctx.lineWidth = 2; ctx.stroke()
      }

      // Label
      if (named) {
        const labelR = isSelected ? n.r * pulse + 52 : n.r * pulse + 18
        ctx.font = `9px monospace`
        ctx.textAlign = 'center'
        ctx.fillStyle = isSelected ? `${sc}ff` : `${sc}cc`
        ctx.fillText(n.label, n.x, n.y + labelR)
        ctx.fillStyle = `rgba(255,160,0,0.5)`
        ctx.font = `8px monospace`
        ctx.fillText(`${Math.round(n.score)}`, n.x, n.y + labelR + 10)
      }

      // Event label
      if (n.eventAlpha > 0 && n.lastEvent) {
        const delta = n.targetScore - n.score
        ctx.font = `8px monospace`
        ctx.textAlign = 'center'
        ctx.fillStyle = delta >= 0 ? `rgba(68,255,170,${n.eventAlpha})` : `rgba(255,51,153,${n.eventAlpha})`
        ctx.fillText(n.lastEvent, n.x, n.y - n.r * pulse - 14)
      }
    })

    physics()
    rafId = requestAnimationFrame(draw)
  }

  function start() {
    resize()
    initNodes()
    rafId = requestAnimationFrame(draw)
  }

  canvas.addEventListener('click', (evt) => {
    const rect = canvas.getBoundingClientRect()
    const mx = (evt.clientX - rect.left) * (W / rect.width)
    const my = (evt.clientY - rect.top) * (H / rect.height)
    let bestDist = Infinity
    const hit = nodes.filter(n => n.type !== 'constitutional').reduce<TGNode | null>((best, n) => {
      const d = Math.hypot(mx - n.x, my - n.y)
      if (d <= n.r + 35 && d < bestDist) { bestDist = d; return n }
      return best
    }, null)
    if (hit) {
      const newId = hit.id === selectedId ? null : hit.id
      selectedId = newId
      onNodeClick(newId, hit.x / W, hit.y / H)
    } else {
      selectedId = null
      onNodeClick(null, 0, 0)
    }
  })

  canvas.addEventListener('mousemove', (evt) => {
    const rect = canvas.getBoundingClientRect()
    const mx = (evt.clientX - rect.left) * (W / rect.width)
    const my = (evt.clientY - rect.top) * (H / rect.height)
    const hit = nodes.filter(n => n.type !== 'constitutional').some(n => Math.hypot(mx - n.x, my - n.y) <= n.r + 35)
    canvas.style.cursor = hit ? 'pointer' : 'default'
  })

  const resizeObserver = new ResizeObserver(() => { resize(); initNodes() })
  resizeObserver.observe(canvas)
  start()

  function applyEvent(nodeId: string, delta: number, label: string) {
    const n = nodes.find(n => n.id === nodeId)
    if (!n) return
    n.targetScore = Math.max(0, Math.min(100, n.targetScore + delta))
    n.lastEvent = `${delta > 0 ? '+' : ''}${delta} ${label}`
    n.eventAlpha = 1
  }

  return {
    destroy: () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
    },
    applyEvent,
    setSelected: (id: string | null) => { selectedId = id },
  }
}

export default function TrustGraphSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<ReturnType<typeof initTrustGraph> | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [events, setEvents] = useState<TrustEvent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('status', 'active')
        .limit(20)

      if (error) throw error
      if (data) {
        setAgents(data as Agent[])
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNodeClick = useCallback((nodeId: string | null, xFrac: number, yFrac: number) => {
    setSelectedAgent(nodeId)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || agents.length === 0) return
    engineRef.current = initTrustGraph(canvasRef.current, agents, handleNodeClick)
    return () => engineRef.current?.destroy()
  }, [agents, handleNodeClick])

  // Auto-fire random events
  useEffect(() => {
    const interval = setInterval(() => {
      if (agents.length === 0) return
      const agent = agents[Math.floor(Math.random() * agents.length)]
      const eventTypes = [
        { label: 'Governance vote cast', delta: +5 },
        { label: 'Code contribution merged', delta: +3 },
        { label: 'Security audit passed', delta: +8 },
        { label: 'Proposal sponsored', delta: +4 },
        { label: 'Rule violation detected', delta: -15 },
      ]
      const event = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      engineRef.current?.applyEvent(agent.did, event.delta, event.label)
      setEvents(prev => [{
        agent_did: agent.did,
        event_type: event.label,
        delta: event.delta,
        score_after: Math.max(0, Math.min(100, (agent.trust_score ?? 65) + event.delta)),
        note: '',
        created_at: new Date().toISOString(),
      }, ...prev.slice(0, 7)])
    }, 3000)
    return () => clearInterval(interval)
  }, [agents])

  const selected = agents.find(a => a.did === selectedAgent)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading TrustGraph...</p>
        </div>
      </div>
    )
  }

  return (
    <section id="trustgraph" className="container mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">TrustGraph</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Real-time agent reputation tracking. Every action is scored and recorded on-chain.
          Trust flows through the network via attested interactions.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="relative h-[500px]">
              <canvas ref={canvasRef} className="w-full h-full" />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Agent Types</div>
                {Object.entries(NODE_COLOR).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-muted-foreground capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Feed */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5" />
              <h3 className="font-semibold">Live Events</h3>
            </div>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No events yet. Events will appear here as agents act.
                </p>
              ) : (
                events.map((evt, i) => (
                  <div
                    key={i}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {evt.delta >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{evt.event_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {evt.agent_did.slice(0, 12)}...
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={evt.delta >= 0 ? 'text-green-500 border-green-500' : 'text-red-500 border-red-500'}
                    >
                      {evt.delta >= 0 ? '+' : ''}{evt.delta}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Agent Details */}
      {selected && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selected.name || selected.did}</h3>
                <p className="text-muted-foreground">{selected.agent_type} Agent</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold" style={{ color: scoreColor(selected.trust_score) }}>
                  {selected.trust_score}
                </div>
                <div className="text-sm text-muted-foreground">{scoreLabel(selected.trust_score)}</div>
              </div>
            </div>
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">DID</div>
                <div className="font-mono text-sm break-all">{selected.did}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant="outline" className="mt-1 capitalize">{selected.status}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium capitalize">{selected.agent_type}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
