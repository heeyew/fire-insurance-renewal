import type {Team} from '@/lib/data/teams';
export function TeamSummary({team}:{team?:Team}) {
 if(!team) return null;
 return <p className="team-summary" aria-label="Current workspace"><span>Workspace: <strong>{team.name}</strong> · {team.role}</span> <a href="/teams">Switch team</a></p>;
}
