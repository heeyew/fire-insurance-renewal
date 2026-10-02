-- Run in the hosted SQL editor after 0003. Disposable fixtures are rolled back.
-- This verifies PostgreSQL permissions, not email delivery or browser sessions.
begin;
set local role authenticated;
do $$
declare
 a uuid; a2 uuid; b uuid; property public.properties;
 editor_token uuid; viewer_token uuid;
 owner_id uuid := '90000000-0000-4000-8000-000000000001';
 other_id uuid := '90000000-0000-4000-8000-000000000002';
 editor_id uuid := '90000000-0000-4000-8000-000000000003';
 viewer_id uuid := '90000000-0000-4000-8000-000000000004';
begin
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',owner_id,'email','owner@example.com')::text,true);
 a := public.create_team('Disposable tenant QA A');
 a2 := public.create_team('Disposable tenant QA A2');
 perform public.add_team_samples(a);
 select * into property from public.properties where team_id=a order by name limit 1;
 if property.id is null then raise exception 'Owner samples missing'; end if;
 begin
  update public.properties set team_id=a2 where id=property.id;
  raise exception 'Property move unexpectedly allowed';
 exception when others then
  if sqlerrm not like '%cannot move%' then raise; end if;
 end;
 editor_token := public.invite_team_member(a,'editor@example.com','editor');
 viewer_token := public.invite_team_member(a,'viewer@example.com','viewer');
 perform set_config('request.jwt.claim.sub',other_id::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',other_id,'email','other@example.com')::text,true);
 b := public.create_team('Disposable tenant QA B');
 if exists(select 1 from public.properties where team_id=a) then raise exception 'Cross-tenant read'; end if;
 begin
  perform public.accept_team_invitation(editor_token);
  raise exception 'Wrong-email invitation unexpectedly accepted';
 exception when others then
  if sqlerrm not like '%invited email%' then raise; end if;
 end;
 perform set_config('request.jwt.claim.sub',viewer_id::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',viewer_id,'email','viewer@example.com')::text,true);
 perform public.accept_team_invitation(viewer_token);
 if not exists(select 1 from public.properties where id=property.id) then raise exception 'Viewer cannot read'; end if;
 update public.properties set name='Forbidden viewer update' where id=property.id;
 if found then raise exception 'Viewer write unexpectedly allowed'; end if;
 begin
  perform public.process_property_renewal(property.id,9000000,200000,property.revision,'Forbidden viewer renewal');
  raise exception 'Viewer renewal unexpectedly allowed';
 exception when others then
  if sqlerrm not like '%row-level security%' and sqlerrm not like '%no longer exists%' then raise; end if;
 end;
 perform set_config('request.jwt.claim.sub',editor_id::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',editor_id,'email','editor@example.com')::text,true);
 perform public.accept_team_invitation(editor_token);
 perform public.process_property_renewal(property.id,9000000,200000,property.revision,'Disposable editor renewal');
 if not exists(select 1 from public.renewal_records where property_id=property.id and team_id=a and user_id=editor_id and updated_value=9200000) then raise exception 'Atomic history missing'; end if;
 begin
  perform public.manage_team_member(a,owner_id,'viewer');
  raise exception 'Editor membership administration unexpectedly allowed';
 exception when others then
  if sqlerrm not like '%Only team owners%' then raise; end if;
 end;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',owner_id,'email','owner@example.com')::text,true);
 perform public.manage_team_member(a,editor_id,'remove');
 delete from public.properties where id=property.id;
 if exists(select 1 from public.renewal_records where property_id=property.id) then raise exception 'Cascade failed'; end if;
 perform set_config('request.jwt.claim.sub',editor_id::text,true);
 perform set_config('request.jwt.claims',json_build_object('sub',editor_id,'email','editor@example.com')::text,true);
 if exists(select 1 from public.properties where team_id=a) then raise exception 'Removed editor retained access'; end if;
end $$;
set local role anon;
do $$ begin
 if has_table_privilege(current_user,'public.properties','select') then raise exception 'Anonymous table access'; end if;
 if has_function_privilege(current_user,'public.process_property_renewal(uuid,numeric,numeric,integer,text)','execute') then raise exception 'Anonymous renewal access'; end if;
end $$;
rollback;
select 'PASS: live team isolation, viewer/editor restrictions, invitation email binding, renewal history, removal and cascade; all fixtures rolled back.' as result;
