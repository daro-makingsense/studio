-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  positions JSONB DEFAULT '[]',
  role TEXT CHECK (role IN ('owner', 'admin', 'user')) NOT NULL,
  work_hours JSONB DEFAULT '{}',
  frequent_tasks TEXT[] DEFAULT '{}',
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  days TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  start_time TEXT,
  duration INTEGER,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) NOT NULL,
  status TEXT CHECK (status IN ('todo', 'in-progress', 'done', 'archived')) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start TEXT NOT NULL,
  "end" TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'blocker')) NOT NULL,
  description TEXT NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create novelties table
CREATE TABLE IF NOT EXISTS novelties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start TEXT NOT NULL,
  "end" TEXT NOT NULL,
  updated_at TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start);
CREATE INDEX IF NOT EXISTS idx_novelties_start ON novelties(start);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE novelties ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now, you can restrict later)
CREATE POLICY "Enable all operations for users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for calendar_events" ON calendar_events
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for novelties" ON novelties
  FOR ALL USING (true) WITH CHECK (true);