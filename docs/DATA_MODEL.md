# Data Model

## properties
| Field | Type | Notes |
|------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | nullable (owner-scoping at lock-down) |
| name | text | not null — property name |
| address | text | |
| insurer | text | insurance company name |
| policy_number | text | |
| insured_value | numeric | current fire-insured amount |
| refurbishment_cost | numeric | refurbishment spend this cycle |
| updated_value | numeric | generated: insured_value + refurbishment_cost |
| renewal_date | date | next renewal date |
| reminder_date | date | generated: renewal_date − 30 days |
| status | text | computed: upcoming / due / renewed / lapsed |
| suggested_insured_value | numeric | AI field (later) |
| suggested_value_source | text | AI field (later) |
| suggested_value_confidence | numeric | AI field (later) |
| suggested_value_review_status | text | AI field (later), default 'unreviewed' |
| created_at | timestamptz | default now() |

**Relationships:** 1 property → many renewal_records.

## renewal_records
| Field | Type | Notes |
|------|------|-------|
| id | uuid | PK |
| user_id | uuid | nullable |
| property_id | uuid | FK → properties.id |
| previous_insured_value | numeric | value before renewal |
| new_insured_value | numeric | value after renewal |
| refurbishment_cost | numeric | refurbishment at renewal time |
| updated_value | numeric | new_insured_value + refurbishment_cost |
| renewal_date | date | date the renewal was processed |
| notes | text | optional |
| created_at | timestamptz | default now() |

**Relationships:** many renewal_records → 1 property.

## RLS / Permissions (v1 — demo-first)
- Both tables: RLS enabled, permissive read + write policies (no login required).
- Lock-down sprint: replace with `auth.uid() = user_id` owner-scoped policies.

## Generated Fields
- `updated_value` = `insured_value + refurbishment_cost` — stored on write, not a view calculation, so it survives refresh.
- `reminder_date` = `renewal_date − 30 days` — stored on write.
- `status` — computed on read from `reminder_date` vs today: `upcoming` (reminder > today), `due` (reminder ≤ today and renewal_date ≥ today), `lapsed` (renewal_date < today), `renewed` (manually set after renewal action, resets when next cycle becomes due).

## AI Fields (later)
`suggested_insured_value` + `suggested_value_source` + `suggested_value_confidence` + `suggested_value_review_status` — populated by an AI module that considers refurbishment scope and market benchmarks. Default `review_status = 'unreviewed'`.
