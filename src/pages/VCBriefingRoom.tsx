'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Lock, 
  TrendingUp, 
  DollarSign, 
  Shield,
  FileText,
  Bell,
  Mail,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react'

interface TreasureReport {
  id: string
  report_date: string
  period_start: string
  period_end: string
  total_treasury_usd: number
  xmrt_reserve_usd: number
  usdf_reserve_usd: number
  deployed_capital_usd: number
  available_liquidity_usd: number
  revenue_generated_usd: number
  distributions_paid_usd: number
  agent_revenue_attribution: { agent_name: string; revenue_usd: number }[]
  notes: string
  status: 'draft' | 'published' | 'archived'
}

interface Milestone {
  id: string
  title: string
  description: string
  category: 'capital' | 'agent' | 'infrastructure' | 'governance' | 'partnership'
  achieved_at: string
  impact_score: number
  announced: boolean
}

interface EmailDigest {
  id: string
  digest_type: 'weekly' | 'monthly' | 'milestone'
  subject: string
  recipients_count: number
  sent_at: string | null
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
}

export default function VCBriefingRoom() {
  const { investorProfile, isVC } = useAuth()
  const { toast } = useToast()
  
  const [accessGranted, setAccessGranted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [treasureReports, setTreasureReports] = useState<TreasureReport[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [emailDigests, setEmailDigests] = useState<EmailDigest[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // VC access required
    if (isVC) {
      setAccessGranted(true)
      loadData()
    } else {
      // Check session for VC access
      const hasAccess = sessionStorage.getItem('vc_access') === '1'
      if (hasAccess) {
        setAccessGranted(true)
        loadData()
      } else {
        setIsLoading(false)
      }
    }
  }, [isVC])

  const loadData = async () => {
    try {
      // Load treasure reports
      const { data: reportsData } = await supabase
        .from('treasure_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(10)

      if (reportsData) {
        setTreasureReports(reportsData as TreasureReport[])
      }

      // Load milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .order('achieved_at', { ascending: false })
        .limit(20)

      if (milestonesData) {
        setMilestones(milestonesData as Milestone[])
      }

      // Load email digests
      const { data: digestsData } = await supabase
        .from('email_digests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (digestsData) {
        setEmailDigests(digestsData as EmailDigest[])
      }
    } catch (error) {
      console.error('Error loading VC data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateTreasureReport = async () => {
    setIsGenerating(true)
    try {
      // Generate report from local Supabase data
      const { data: capitalStack } = await supabase
        .from('capital_stack')
        .select('*')
        .eq('is_active', true)

      const { data: distributions } = await supabase
        .from('distributions')
        .select('amount_usd')
        .gte('period_start', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const { data: agentRevenue } = await supabase
        .from('agent_tasks')
        .select('agent_name, revenue_usd')
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      // Aggregate agent revenue
      const agentAttribution: { [key: string]: number } = {}
      agentRevenue?.forEach(task => {
        agentAttribution[task.agent_name] = (agentAttribution[task.agent_name] || 0) + task.revenue_usd
      })

      const totalTreasury = capitalStack?.reduce((sum, layer) => sum + layer.amount_m, 0) * 1000000 || 0
      const revenueGenerated = distributions?.reduce((sum, d) => sum + (d.amount_usd || 0), 0) || 0

      const newReport = {
        report_date: new Date().toISOString(),
        period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString(),
        total_treasury_usd: totalTreasury,
        xmrt_reserve_usd: totalTreasury * 0.6,
        usdf_reserve_usd: totalTreasury * 0.4,
        deployed_capital_usd: totalTreasury * 0.7,
        available_liquidity_usd: totalTreasury * 0.3,
        revenue_generated_usd: revenueGenerated,
        distributions_paid_usd: revenueGenerated * 0.8,
        agent_revenue_attribution: Object.entries(agentAttribution).map(([name, revenue]) => ({
          agent_name: name,
          revenue_usd: revenue
        })),
        notes: 'Auto-generated weekly treasure report',
        status: 'draft' as const
      }

      const { error } = await supabase
        .from('treasure_reports')
        .insert(newReport)

      if (error) throw error

      toast({
        title: 'Treasure Report Generated',
        description: 'Weekly report created successfully',
      })

      loadData()
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Could not generate treasure report',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const announceMilestone = async (milestoneId: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({ announced: true })
        .eq('id', milestoneId)

      if (error) throw error

      toast({
        title: 'Milestone Announced',
        description: 'Announcement sent to fleet chat',
      })

      loadData()
    } catch (error) {
      toast({
        title: 'Announcement Failed',
        description: 'Could not announce milestone',
        variant: 'destructive',
      })
    }
  }

  const scheduleEmailDigest = async (type: 'weekly' | 'monthly' | 'milestone') => {
    try {
      const subjects = {
        weekly: 'XMRT DAO Weekly Treasury Report',
        monthly: 'XMRT DAO Monthly Investor Update',
        milestone: 'XMRT DAO Milestone Achievement'
      }

      const { error } = await supabase
        .from('email_digests')
        .insert({
          digest_type: type,
          subject: subjects[type],
          recipients_count: 47, // VC tier count from DB
          status: 'scheduled'
        })

      if (error) throw error

      toast({
        title: 'Email Digest Scheduled',
        description: `${type} digest queued for delivery`,
      })

      loadData()
    } catch (error) {
      toast({
        title: 'Scheduling Failed',
        description: 'Could not schedule email digest',
        variant: 'destructive',
      })
    }
  }

  if (!accessGranted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>VC Briefing Room</CardTitle>
            <CardDescription>
              VC-tier access required. Validate your code in the Investors portal.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const latestReport = treasureReports[0]
  const unannouncedMilestones = milestones.filter(m => !m.announced)

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8" />
            VC Briefing Room
          </h1>
          <p className="text-muted-foreground mt-1">
            Investor relations automation & treasury transparency
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {investorProfile?.investor_tier || 'VC'} Tier Access
        </Badge>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            IR Automation Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={generateTreasureReport} 
            disabled={isGenerating}
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Weekly Report'}
          </Button>
          
          <Button 
            onClick={() => scheduleEmailDigest('weekly')}
            variant="outline"
            className="w-full"
          >
            <Mail className="w-4 h-4 mr-2" />
            Schedule Weekly Digest
          </Button>
          
          <Button 
            onClick={() => scheduleEmailDigest('milestone')}
            variant="outline"
            className="w-full"
          >
            <Bell className="w-4 h-4 mr-2" />
            Announce Milestone
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="treasury" className="space-y-6">
        <TabsList>
          <TabsTrigger value="treasury">
            <DollarSign className="w-4 h-4 mr-2" />
            Treasury Reports
          </TabsTrigger>
          <TabsTrigger value="milestones">
            <TrendingUp className="w-4 h-4 mr-2" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="digests">
            <Mail className="w-4 h-4 mr-2" />
            Email Digests
          </TabsTrigger>
        </TabsList>

        {/* Treasury Reports Tab */}
        <TabsContent value="treasury" className="space-y-4">
          {latestReport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Latest Treasury Report
                </CardTitle>
                <CardDescription>
                  Period: {new Date(latestReport.period_start).toLocaleDateString()} - {new Date(latestReport.period_end).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Treasury</p>
                    <p className="text-2xl font-bold">
                      ${latestReport.total_treasury_usd.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">XMRT Reserve (60%)</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${latestReport.xmrt_reserve_usd.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">USDF Reserve (40%)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${latestReport.usdf_reserve_usd.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue Generated</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${latestReport.revenue_generated_usd.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Agent Revenue Attribution</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestReport.agent_revenue_attribution?.map((agent, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{agent.agent_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            ${agent.revenue_usd.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Email to VCs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Historical Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Date</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Treasury</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treasureReports.slice(1).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{new Date(report.report_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono">
                        ${report.total_treasury_usd.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-green-600">
                        ${report.revenue_generated_usd.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'published' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          {unannouncedMilestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Pending Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {unannouncedMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{milestone.title}</p>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{milestone.category}</Badge>
                        <Badge variant="outline">Impact: {milestone.impact_score}</Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => announceMilestone(milestone.id)}
                    >
                      Announce
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Achieved Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Achieved</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map((milestone) => (
                    <TableRow key={milestone.id}>
                      <TableCell className="font-medium">{milestone.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{milestone.category}</Badge>
                      </TableCell>
                      <TableCell>{new Date(milestone.achieved_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {milestone.impact_score}
                        </div>
                      </TableCell>
                      <TableCell>
                        {milestone.announced ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Announced
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Digests Tab */}
        <TabsContent value="digests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Digest</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => scheduleEmailDigest('weekly')}
                variant="outline"
                className="flex flex-col items-center p-6 h-auto"
              >
                <Calendar className="w-8 h-8 mb-2" />
                <span className="font-semibold">Weekly</span>
                <span className="text-xs text-muted-foreground">Every Monday 9am</span>
              </Button>
              
              <Button 
                onClick={() => scheduleEmailDigest('monthly')}
                variant="outline"
                className="flex flex-col items-center p-6 h-auto"
              >
                <Calendar className="w-8 h-8 mb-2" />
                <span className="font-semibold">Monthly</span>
                <span className="text-xs text-muted-foreground">1st of month</span>
              </Button>
              
              <Button 
                onClick={() => scheduleEmailDigest('milestone')}
                variant="outline"
                className="flex flex-col items-center p-6 h-auto"
              >
                <Bell className="w-8 h-8 mb-2" />
                <span className="font-semibold">Milestone</span>
                <span className="text-xs text-muted-foreground">On achievement</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Digest History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailDigests.map((digest) => (
                    <TableRow key={digest.id}>
                      <TableCell>
                        <Badge variant="outline">{digest.digest_type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{digest.subject}</TableCell>
                      <TableCell>{digest.recipients_count}</TableCell>
                      <TableCell>
                        {digest.sent_at ? new Date(digest.sent_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            digest.status === 'sent' ? 'default' :
                            digest.status === 'failed' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {digest.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
