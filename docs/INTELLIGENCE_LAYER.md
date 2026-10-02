# Intelligence Layer

## Messy Inputs (later)
Director may paste free-text refurbishment descriptions or market notes. AI extracts structured refurbishment cost estimates.

## Auto-Structure Schema (later)
```json
{
  "property_name": "Marina Tower",
  "refurbishment_scope": "lobby renovation, HVAC replacement",
  "estimated_refurbishment_cost": 450000,
  "market_value_trend": "up 3.2%",
  "suggested_insured_value": 12500000,
  "confidence": 0.78,
  "source": "market-benchmark + refurbishment-scope",
  "review_status": "unreviewed"
}
```

## Events to Track
- Property created / edited / deleted.
- Renewal processed (old→new value, date).
- AI suggestion generated.
- AI suggestion accepted or rejected by Director.

## Scoring Rules (rule-based, v1)
- **Renewal urgency score** = days until reminder_date, inverted:
  - reminder_date < today → score 100 (lapsed, highest)
  - reminder_date ≤ today+7 → score 80
  - reminder_date ≤ today+30 → score 50
  - reminder_date > today+30 → score 20
- Properties sorted by urgency score descending.

## What Gets Ranked
Property list on the dashboard — ranked by renewal urgency score.

## v1 vs Later
- **v1:** Rule-based urgency scoring + status calculation. No AI.
- **Later:** AI-suggested insured values, refurbishment cost extraction from free text, market benchmark integration.
