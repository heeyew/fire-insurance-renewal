# Test Plan

## v1 Success Scenario
1. Open app (no login) → see 5 seeded properties in list sorted by reminder date.
2. Click "Add Property" → enter name "Test Tower", address, insurer "AIG", policy "POL-999", insured value 8,000,000, refurbishment cost 300,000, renewal date 2025-12-01.
3. Save → property appears in list with updated value 8,300,000 and reminder date 2025-11-01.
4. Find a property with status "due" → click "Renew".
5. Enter new insured value 9,000,000, refurbishment cost 200,000 → updated value shows 9,200,000.
6. Confirm → status changes to "renewed", renewal date advances to +1 year, reminder date recalculated.
7. Refresh page → all changes persist.
8. Open Dashboard → counts reflect the renewal (one fewer "due", one more "renewed").
9. Open Renewal List → click "Export CSV" → file downloads with all properties, values, dates.
10. Click "Delete" on a property → confirm → property removed from list.

## Empty State
- Delete all properties (or fresh DB) → list shows "No properties yet — add your first property." with an "Add Property" button.
- Dashboard shows 0 for all counts.

## Error State
- Temporarily break Supabase connection → list shows "Could not load properties. Please retry." with a Retry button.
- Submit renewal form with empty insured value → validation error, no DB write.

## Edge Cases
- Property with refurbishment_cost = 0 → updated_value = insured_value (no NaN).
- Property with renewal_date in the past → status "lapsed".
- Renew a property twice → two renewal records, renewal date advances twice.
- CSV export with 0 properties → downloads file with headers only.
