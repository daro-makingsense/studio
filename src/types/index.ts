export type WorkDay = {
  active: boolean;
  virtual: boolean;
  start?: string;
  end?: string;
};

export type Position = {
  fullName: string;
  shortName: string;
};

export type User = {
  id: string;
  name: string;
  positions: Position[];
  role: 'owner' | 'admin' | 'user';
  workHours: { [key: string]: WorkDay };
  frequentTasks: string[];
  color: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  userId: string;
  days?: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  startDate?: string;
  endDate?: string;
  startTime?: string; // "HH:mm"
  duration?: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'done' | 'archived';
  notes?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'info' | 'blocker';
  description: string;
  allDay?: boolean;
};

export type Novelty = {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  updatedAt?: string;
};
