# Database Setup

This directory contains the database schema for the Time Tracker application.

## Using Supabase (Recommended)

1. **Create a Supabase Project:**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project (free tier available)
   - Wait for the project to be provisioned

2. **Run the Schema:**
   - In Supabase dashboard, go to SQL Editor
   - Copy the contents of `schema.sql`
   - Paste and run the SQL

3. **Get Connection String:**
   - Go to Project Settings > Database
   - Copy the "Connection string" (URI format)
   - Update your backend `.env` file with this connection string

Example connection string:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## Using Local PostgreSQL

If you prefer to run PostgreSQL locally:

```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb timetracker

# Run schema
psql timetracker < database/schema.sql
```

## Tables

### users
- Stores user authentication information
- UUID primary key
- Email and hashed password

### projects
- Stores project information
- Linked to users via user_id
- Tracks timer state (is_running, start_time)
- Stores billing information (hourly_rate, budget)

### time_entries
- Stores individual time tracking entries
- Linked to both projects and users
- Tracks whether entry is manual or timer-based
- Stores start/end timestamps in Unix milliseconds
