# Agentic Layer

## Draftable Actions (low risk — auto, later)
- Draft a suggested insured value for a property → stored as `suggested_insured_value` with source/confidence/review_status. Director reviews before accepting.

## Executable-After-Approval Actions (medium risk — later)
- Pre-fill renewal form with AI-suggested values → Director clicks "Renew" to confirm (existing renewal action, just pre-populated).

## Human-Only Actions (critical — always)
- Delete a property.
- Process a renewal (changing insured values and advancing dates) — always initiated by the Director.
- Export the renewal list (CSV/print) — Director triggers manually.

## Named Tools (later)
- `suggest_insured_value(property_id)` — reads property + refurbishment data, returns suggestion. Read-only, no side effects beyond writing the suggestion field.
- `extract_refurbishment_cost(free_text)` — parses free text, returns estimated cost.

No raw `run_any` / `send_any` tools. No message sending, no payments, no external API calls in v1.

## Audit Log Fields (later)
| Field | Type |
|------|------|
| id | uuid |
| user_id | uuid |
| action | text |
| target_type | text |
| target_id | uuid |
| details | jsonb |
| created_at | timestamptz |

## v1 vs Later
- **v1:** No agentic actions. All actions are manual Director-initiated.
- **Later:** AI suggestion tool, refurbishment extraction, audit logging of agentic actions.
