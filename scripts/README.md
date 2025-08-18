# Database Scripts

This directory contains scripts for managing the Supabase database.

## Prerequisites

1. Make sure you have set up your Supabase project
2. Update the `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Setting up the Database

1. First, create the tables in your Supabase project by running the SQL script in `/workspace/supabase/schema.sql` in the Supabase SQL editor.

2. Then, you can insert the dummy data by running:
   ```bash
   npm run db:insert-dummy-data
   ```

## Available Scripts

### Insert Dummy Data
```bash
npm run db:insert-dummy-data
```
This script will:
- Insert all users from the dummy data
- Insert all tasks
- Insert all calendar events
- Insert all novelties

The script uses `upsert` operations, so it's safe to run multiple times without creating duplicates.

### Clear All Data
```bash
npm run db:clear-all-data
```
**⚠️ WARNING**: This script will delete ALL data from the database. It includes a 5-second delay to allow you to cancel if run accidentally.

## Data Structure

The scripts work with the following tables:
- `users`: User profiles with work hours and positions
- `tasks`: Task assignments for users
- `calendar_events`: Company-wide calendar events
- `novelties`: Company announcements/news

## Troubleshooting

If you encounter errors:
1. Ensure your Supabase credentials are correct in `.env.local`
2. Make sure the tables have been created in Supabase
3. Check that Row Level Security (RLS) policies allow the operations
4. Verify that your Supabase project is accessible