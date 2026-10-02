# Fire Insurance Renewal Tracker

## Problem
The Finance and Investment Properties departments track fire insurance renewals for every property in an Excel sheet. Values must be updated yearly to include refurbishment costs. Renewal dates are missed or tracked inconsistently. There is no single source of truth or reminder system.

## Target User
The Director of Finance — one person who owns the yearly renewal cycle for all investment properties.

## Core Objects
- **Property** — a single insurable building with its insured value, refurbishment cost, renewal date, and status.
- **Renewal Record** — a historical log of each yearly renewal: old value, new value, date, notes.

## MVP (v1) — Must-Haves
- [ ] Property list with name, address, insurer, policy number, current insured value, refurbishment cost, updated value (insured + refurbishment), renewal date, reminder date (renewal date minus 30 days), status (upcoming / due / renewed / lapsed).
- [ ] Add / edit / delete a property — all persisted to the database.
- [ ] Auto-calculate updated value = insured value + refurbishment cost.
- [ ] Auto-calculate reminder date = renewal date − 30 days.
- [ ] Dashboard showing properties sorted by reminder date; counts of upcoming / due / lapsed.
- [ ] Renewal list export (printable / CSV) — the "updated list of values" that replaces the Excel sheet.
- [ ] Renew a property: set new insured value, log a renewal record, advance renewal date by one year.
- [ ] Seed demo data so the app renders immediately for anonymous visitors.

## Non-Goals (v1)
- Multi-user collaboration or role-based access.
- Email notification sending.
- Integration with insurer APIs.
- Document upload / policy PDF storage.

## Success Criteria
The Director of Finance opens the app, sees all properties sorted by next renewal date, clicks "Renew" on a due property, enters the new insured value, and the system logs the old→new value change, advances the renewal date by one year, and the property moves from "due" to "renewed" in the list — replacing the Excel workflow end-to-end.
