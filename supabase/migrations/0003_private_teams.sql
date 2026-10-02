-- Private teams replace the shared demo. Existing unassigned rows are preserved,
-- but inaccessible; nobody automatically inherits the public demo portfolio.
begin;
create table public.teams (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 100),
 created_by uuid not null, created_at timestamptz not null default now()
);
create table public.team_members (
 team_id uuid not null references public.teams(id) on delete cascade,
 user_id uuid not null, email text not null,
 role text not null check(role in ('owner','editor','viewer')),
 created_at timestamptz not null default now(), primary key(team_id,user_id)
);
create table public.team_invitations (
 id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id) on delete cascade,
 email text not null, role text not null check(role in ('editor','viewer')),
 token uuid not null default gen_random_uuid() unique, invited_by uuid not null,
 expires_at timestamptz not null default now()+interval '7 days', created_at timestamptz not null default now(),
 unique(team_id,email)
);
alter table public.properties add column team_id uuid references public.teams(id);
alter table public.renewal_records add column team_id uuid references public.teams(id);
create index properties_team_idx on public.properties(team_id,reminder_date);
create index renewal_records_team_idx on public.renewal_records(team_id,property_id);
create index team_members_user_idx on public.team_members(user_id);
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;
create function public.team_role(p_team uuid) returns text language sql stable security definer set search_path=public as $$
 select role from public.team_members where team_id=p_team and user_id=auth.uid()
$$;
revoke all on function public.team_role(uuid) from public;
grant execute on function public.team_role(uuid) to authenticated;
create policy teams_read on public.teams for select to authenticated using(public.team_role(id) is not null);
create policy members_read on public.team_members for select to authenticated using(public.team_role(team_id) is not null);
create policy invitations_read on public.team_invitations for select to authenticated using(public.team_role(team_id)='owner');
grant select on public.teams,public.team_members,public.team_invitations to authenticated;
drop policy properties_v1_read on public.properties;
drop policy properties_v1_write on public.properties;
drop policy renewal_records_v1_read on public.renewal_records;
drop policy renewal_records_v1_write on public.renewal_records;
revoke all on public.properties,public.renewal_records from anon;
create policy properties_team_read on public.properties for select to authenticated using(public.team_role(team_id) is not null);
create policy properties_team_insert on public.properties for insert to authenticated with check(public.team_role(team_id) in ('owner','editor'));
create policy properties_team_update on public.properties for update to authenticated using(public.team_role(team_id) in ('owner','editor')) with check(public.team_role(team_id) in ('owner','editor'));
create policy properties_team_delete on public.properties for delete to authenticated using(public.team_role(team_id) in ('owner','editor'));
create policy renewals_team_read on public.renewal_records for select to authenticated using(public.team_role(team_id) is not null);
create policy renewals_team_insert on public.renewal_records for insert to authenticated with check(public.team_role(team_id) in ('owner','editor'));
revoke update,delete on public.renewal_records from authenticated;
create function public.protect_property_team() returns trigger language plpgsql set search_path=public as $$
begin
 if tg_op='UPDATE' and new.team_id is distinct from old.team_id then raise exception 'A property cannot move between teams.'; end if;
 if auth.uid() is not null then new.user_id:=auth.uid(); end if;
 return new;
end $$;
create trigger property_team_guard before insert or update on public.properties for each row execute function public.protect_property_team();
create function public.set_renewal_team() returns trigger language plpgsql set search_path=public as $$
begin
 select team_id into new.team_id from public.properties where id=new.property_id;
 if new.team_id is null then raise exception 'Property is not available in a team.'; end if;
 new.user_id:=auth.uid();
 return new;
end $$;
create trigger renewal_team_guard before insert on public.renewal_records for each row execute function public.set_renewal_team();
revoke execute on function public.process_property_renewal(uuid,numeric,numeric,integer,text) from anon;
create function public.create_team(p_name text) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'email','')='' then raise exception 'Sign in to create a team.'; end if;
 if length(trim(p_name)) not between 1 and 100 then raise exception 'Team name must be 1 to 100 characters.'; end if;
 insert into public.teams(name,created_by) values(trim(p_name),auth.uid()) returning id into result;
 insert into public.team_members(team_id,user_id,email,role) values(result,auth.uid(),lower(auth.jwt()->>'email'),'owner');
 return result;
end $$;
create function public.invite_team_member(p_team uuid,p_email text,p_role text) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid;
begin
 if public.team_role(p_team) is distinct from 'owner' then raise exception 'Only team owners can invite members.'; end if;
 if p_role not in ('editor','viewer') or p_email is null or length(p_email)>254 or trim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email and role.'; end if;
 insert into public.team_invitations(team_id,email,role,invited_by) values(p_team,lower(trim(p_email)),p_role,auth.uid())
 on conflict(team_id,email) do update set role=excluded.role,token=gen_random_uuid(),expires_at=now()+interval '7 days',invited_by=auth.uid()
 returning token into result;
 return result;
end $$;
create function public.accept_team_invitation(p_token uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare invitation public.team_invitations;
begin
 if auth.uid() is null then raise exception 'Sign in before accepting an invitation.'; end if;
 select * into invitation from public.team_invitations where token=p_token for update;
 if not found or invitation.expires_at<=now() then raise exception 'This invitation expired or was revoked.'; end if;
 if lower(coalesce(auth.jwt()->>'email',''))<>invitation.email then raise exception 'Sign in using the invited email address.'; end if;
 insert into public.team_members(team_id,user_id,email,role) values(invitation.team_id,auth.uid(),invitation.email,invitation.role) on conflict(team_id,user_id) do nothing;
 delete from public.team_invitations where id=invitation.id;
 return invitation.team_id;
end $$;
create function public.manage_team_member(p_team uuid,p_user uuid,p_role text) returns void language plpgsql security definer set search_path=public as $$
begin
 if public.team_role(p_team) is distinct from 'owner' then raise exception 'Only team owners can manage members.'; end if;
 if exists(select 1 from public.team_members where team_id=p_team and user_id=p_user and role='owner') then raise exception 'The team owner cannot be removed or downgraded.'; end if;
 if p_role='remove' then delete from public.team_members where team_id=p_team and user_id=p_user;
 elsif p_role in ('editor','viewer') then update public.team_members set role=p_role where team_id=p_team and user_id=p_user;
 else raise exception 'Invalid member role.'; end if;
end $$;
create function public.revoke_team_invitation(p_team uuid,p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if public.team_role(p_team) is distinct from 'owner' then raise exception 'Only team owners can revoke invitations.'; end if;
 delete from public.team_invitations where team_id=p_team and id=p_id;
end $$;
create function public.add_team_samples(p_team uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if public.team_role(p_team) not in ('owner','editor') or public.team_role(p_team) is null then raise exception 'Your team role allows viewing only.'; end if;
 perform 1 from public.teams where id=p_team for update;
 if exists(select 1 from public.properties where team_id=p_team) then raise exception 'Sample properties can only be added to an empty portfolio.'; end if;
 insert into public.properties(team_id,user_id,name,address,insurer,policy_number,insured_value,refurbishment_cost,renewal_date,status) values
 (p_team,auth.uid(),'Sample Marina Tower','Sample address','Sample insurer','DEMO-001',12000000,500000,current_date+14,'due'),
 (p_team,auth.uid(),'Sample Riverside Plaza','Sample address','Sample insurer','DEMO-002',8500000,0,current_date+75,'upcoming'),
 (p_team,auth.uid(),'Sample Heritage Block','Sample address','Sample insurer','DEMO-003',4200000,800000,current_date-10,'lapsed');
end $$;
revoke all on function public.add_team_samples(uuid) from public;
grant execute on function public.add_team_samples(uuid) to authenticated;
revoke all on function public.create_team(text),public.invite_team_member(uuid,text,text),public.accept_team_invitation(uuid),public.manage_team_member(uuid,uuid,text),public.revoke_team_invitation(uuid,uuid) from public;
grant execute on function public.create_team(text),public.invite_team_member(uuid,text,text),public.accept_team_invitation(uuid),public.manage_team_member(uuid,uuid,text),public.revoke_team_invitation(uuid,uuid) to authenticated;
commit;
