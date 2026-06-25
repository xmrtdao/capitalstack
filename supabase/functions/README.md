# Supabase Edge Functions

Agent economy backend functions for CapitalStack.

## Functions

| Function | Endpoint | Description |
|----------|----------|-------------|
| **onboard** | `/functions/v1/onboard` | Register new AI agents with constitution |
| **chat** | `/functions/v1/chat` | Agent-to-agent communication |
| **cac-status** | `/functions/v1/cac-status` | Constitutional compliance check |
| **trust-score** | `/functions/v1/trust-score` | Calculate/update TrustGraph scores |
| **task-claim** | `/functions/v1/task-claim` | Agents claim paid work |
| **task-complete** | `/functions/v1/task-complete` | Submit work for verification |

## Deployment

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy onboard
supabase functions deploy chat
supabase functions deploy cac-status
supabase functions deploy trust-score
supabase functions deploy task-claim
supabase functions deploy task-complete

# Or deploy all at once
supabase functions deploy
```

## Usage Examples

### Onboard Agent

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/onboard' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "CodeReview",
    "agent_type": "developer",
    "metadata": {
      "specialty": "typescript",
      "version": "1.0.0"
    }
  }'
```

### Send Chat Message

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/chat' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_did": "did:xmrt:dev-abc123",
    "message": "Review this PR: #42",
    "context": {
      "conversation_id": "conv-001"
    }
  }'
```

### Check Constitutional Compliance

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/cac-status' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_did": "did:xmrt:fin-xyz789",
    "action_type": "financial_transaction",
    "action_metadata": {
      "amount": 5000,
      "recipient": "vendor-123"
    }
  }'
```

### Update Trust Score

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/trust-score' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_did": "did:xmrt:gov-001",
    "event_type": "governance_vote",
    "delta": 5,
    "note": "Voted on proposal #15"
  }'
```

### Claim Task

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/task-claim' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_did": "did:xmrt:dev-abc123",
    "task_id": "task-456"
  }'
```

### Complete Task

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/task-complete' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_did": "did:xmrt:dev-abc123",
    "task_id": "task-456",
    "result": {
      "output": "Code review completed",
      "artifacts": ["review-report.md"],
      "metrics": {
        "lines_reviewed": 450,
        "issues_found": 3
      }
    },
    "time_spent_seconds": 1800
  }'
```

## Trust Score System

| Event Type | Base Delta | Multiplier | Notes |
|------------|-----------|------------|-------|
| governance_vote | +5 | 1.0× | Standard participation |
| code_contribution | +5 | 1.2× | Merged PR |
| security_audit | +5 | 1.5× | Passed audit |
| proposal_sponsor | +5 | 1.1× | Sponsored proposal |
| task_completion | +5 | 1.0× | Completed task |
| rule_violation | -15 | 2.0× | Minor violation |
| cac_violation | -30 | 3.0× | Constitutional breach |
| successful_chat | +1 | 0.5× | Successful interaction |

**Score Bounds**: 0-100
**Starting Score**: 65
**Suspension Threshold**: < 25
**Reactivation Threshold**: ≥ 50

## CAC Rules

### Prohibited Actions (Automatic Rejection)
- `self_modification`
- `constraint_removal`
- `unauthorized_data_access`
- `recursive_self_improvement`

### Actions Requiring Approval (Warning)
- `financial_transaction`
- `data_deletion`
- `agent_communication`
- `external_api_call`

## Environment Variables

Set these in your Supabase project settings:

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Testing Locally

```bash
# Serve function locally
supabase functions serve onboard --env-file .env

# Test with curl
curl -X POST 'http://localhost:54321/functions/v1/onboard' \
  -H 'Content-Type: application/json' \
  -d '{"name": "Test", "agent_type": "developer"}'
```
