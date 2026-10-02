import test from 'node:test';
import assert from 'node:assert/strict';
import { amount,updatedValue,nextYear,reminderDate,statusFor,isDate,urgency,sortByReminder } from '../lib/domain';
import type { Property } from '../lib/domain';
import {propertiesCsv} from '../lib/csv';
test('money is required, decimal-safe, and nonnegative',()=>{
  assert.equal(updatedValue(amount('8000000'),amount('300000')),8300000);
  assert.equal(updatedValue(.1,.2),.3);
  assert.equal(amount('0'),0);
  for(const x of ['', '-1','NaN','Infinity','1.234','1e4','9999999999999']) assert.throws(()=>amount(x));
});
test('real calendar dates and 30-day reminder across year boundaries',()=>{
  assert.equal(isDate('2025-02-29'),false);
  assert.equal(isDate('2024-02-29'),true);
  assert.equal(isDate('2026-13-01'),false);
  assert.equal(reminderDate('2025-12-01'),'2025-11-01');
  assert.equal(reminderDate('2027-01-10'),'2026-12-11');
});
test('renewal advances exactly one year, clamping leap day',()=>{
  assert.equal(nextYear('2024-02-29'),'2025-02-28');
  assert.equal(nextYear('2026-10-20'),'2027-10-20');
  assert.equal(nextYear(nextYear('2026-10-20')),'2028-10-20');
});
test('statuses change at reminder and expiry boundaries, even after renewal',()=>{
  const p={status:'renewed' as const,renewal_date:'2026-11-01',reminder_date:'2026-10-02'};
  assert.equal(statusFor(p,'2026-10-01'),'renewed');
  assert.equal(statusFor(p,'2026-10-02'),'due');
  assert.equal(statusFor(p,'2026-11-01'),'due');
  assert.equal(statusFor(p,'2026-11-02'),'lapsed');
  assert.equal(statusFor({...p,status:'upcoming'},'2026-10-01'),'upcoming');
});
test('urgency ranking is stable and reminder order breaks ties',()=>{
  assert.equal(urgency({reminder_date:'2026-10-01'},'2026-10-02'),100);
  assert.equal(urgency({reminder_date:'2026-10-09'},'2026-10-02'),80);
  assert.equal(urgency({reminder_date:'2026-11-01'},'2026-10-02'),50);
  assert.equal(urgency({reminder_date:'2026-11-02'},'2026-10-02'),20);
  const items=[{name:'A',reminder_date:'2027-01-01',renewal_date:'2027-01-31'},{name:'B',reminder_date:'2026-12-01',renewal_date:'2026-12-31'}] as Property[];
  assert.equal(sortByReminder(items)[0].name,'B');
  assert.equal(items[0].name,'A');
});
test('CSV handles commas, quotes, non-ASCII names and formula injection',()=>{
  const p={name:'=SUM(1,2)',address:'Street, "A"',insurer:'中文',policy_number:' +formula',insured_value:8000000,refurbishment_cost:300000,updated_value:8300000,renewal_date:'2026-12-01',reminder_date:'2026-11-01',status:'upcoming'} as Property;
  const csv=propertiesCsv([p]);
  assert.ok(csv.startsWith('\uFEFF"Property name"'));
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('"Street, ""A"""'));
  assert.ok(csv.includes('"中文"'));
  assert.ok(csv.includes('"\' +formula"'));
  assert.ok(csv.includes('"8300000.00"'));
  assert.equal(propertiesCsv([]).split('\r\n').length,2);
});
