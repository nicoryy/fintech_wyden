/**
 * Goal reads — the app only ever displays `goals[0]` today (see
 * `services/hooks.ts`'s `useDashboard`); creating/editing goals is Phase 3
 * (see the root CLAUDE.md roadmap). The table is kept so backups round-trip
 * and the future screen has somewhere to write to.
 */
import { getDb } from './db';
import type { GoalRecord } from './records';
import { GoalStatusEnum } from '../services/types';

interface GoalRow {
  id: string;
  title: string;
  target_cents: number;
  current_cents: number;
  deadline: number | null;
  status: GoalStatusEnum;
}

function toRecord(row: GoalRow): GoalRecord {
  return {
    id: row.id,
    title: row.title,
    targetCents: row.target_cents,
    currentCents: row.current_cents,
    deadline: row.deadline,
    status: row.status,
  };
}

/** All goals, newest first — same ordering as the old `GET /goals`. */
export async function listGoals(): Promise<GoalRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<GoalRow>(
    'SELECT id, title, target_cents, current_cents, deadline, status FROM goals ORDER BY created_at DESC',
  );
  return rows.map(toRecord);
}
