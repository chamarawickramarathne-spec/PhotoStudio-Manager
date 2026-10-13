export interface OrderableSchedule {
  schedule_type: string;
  due_date: string | null;
  created_at: string;
}

const TYPE_RANK: Record<string, number> = {
  deposit: 0,
  milestone: 1,
  custom: 1,
  final: 2,
};

function rank(schedule: OrderableSchedule): number {
  return TYPE_RANK[schedule.schedule_type] ?? 1;
}

function orderDate(schedule: OrderableSchedule): string {
  return schedule.due_date ?? schedule.created_at;
}

export function compareSchedules(a: OrderableSchedule, b: OrderableSchedule): number {
  const rankDiff = rank(a) - rank(b);
  if (rankDiff !== 0) return rankDiff;
  const aDate = orderDate(a);
  const bDate = orderDate(b);
  if (aDate !== bDate) return aDate < bDate ? -1 : 1;
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
  return 0;
}

export function orderSchedules<T extends OrderableSchedule>(schedules: T[]): T[] {
  return [...schedules].sort(compareSchedules);
}
