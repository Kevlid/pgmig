# sqlmig

Simple PostgreSQL migrations CLI

## Install

```bash
npm install sqlmig
```

## Quick Start

1. Create your first migration:

```bash
npx sqlmig create add_users
```

This creates `1-add_users.sql` in your migrations folder.

2. Write your SQL:

```sql
-- UP
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

-- DOWN
DROP TABLE users;
```

3. Set up database connection in `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=secret
```

4. Run migrations:

```bash
npx sqlmig up
```

## Commands

### `sqlmig create <name>`

Creates a new migration file with the next number.

```bash
sqlmig create add_posts
# Creates: 2-add_posts.sql
```

### `sqlmig up`

Runs all pending migrations.

```bash
sqlmig up
```

### `sqlmig down [n]`

Rolls back the last `n` migrations (default: 1).

```bash
sqlmig down     # Rollback 1
sqlmig down 3   # Rollback 3
```

### `sqlmig status`

Shows which migrations have run and which are pending.

```bash
sqlmig status
```

## Configuration

### Environment Variables

The CLI supports multiple naming conventions:

**Connection String:**

-   `DATABASE_URL`
-   `DB_URI`
-   `POSTGRES_URI`

**Individual Values:**

-   Host: `DB_HOST`, `POSTGRES_HOST`
-   Port: `DB_PORT`, `POSTGRES_PORT`
-   Database: `DB_NAME`, `POSTGRES_DB`
-   User: `DB_USER`, `POSTGRES_USER`
-   Password: `DB_PASSWORD`, `POSTGRES_PASSWORD`

### Command Line Options

Override environment variables with flags:

```bash
# Connection string
sqlmig up --uri postgres://user:pass@localhost:5432/mydb

# Individual values
sqlmig up -h localhost -p 5432 -d mydb -u postgres -w secret

# Custom migrations folder
sqlmig up -m ./db/migrations

# Custom .env file
sqlmig up -e .env.production
```

## Migration Files

Migrations are numbered SQL files: `1-name.sql`, `2-name.sql`, etc.

Each file has two sections:

```sql
-- UP
-- SQL to apply the migration


-- DOWN
-- SQL to rollback the migration
```

### Example Migration

```sql
-- UP
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_user ON posts(user_id);

-- DOWN
DROP TABLE posts;
```

## How It Works

1. The CLI creates a `migrations` table in your database to track what's been run
2. When you run `sqlmig up`, it checks which migrations haven't been executed yet
3. Each migration runs in a transaction - if it fails, it rolls back automatically
4. The migration ID is stored in the database so it won't run again

## Examples

### Development Workflow

```bash
# Create a migration
sqlmig create add_comments_table

# Edit the SQL file
# migrations/3-add_comments_table.sql

# Check status
sqlmig status

# Run it
sqlmig up

# Made a mistake? Roll it back
sqlmig down

# Fix it and run again
sqlmig up
```

### CI/CD Example

```yaml
# .github/workflows/deploy.yml
- name: Run migrations
  env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npx sqlmig up
```

## Migrations Folder

By default, sqlmig looks for migrations in:

1. `./migrations`
2. `./db/migrations`
3. `./database/migrations`

You can specify a custom path with `-m`:

```bash
sqlmig up -m ./sql/migrations
```

## Options Reference

```
-m, --migrations        Migrations folder (default: ./migrations)
-e, --env               .env file path (default: ./.env)

Database (overrides .env):
--uri                   Connection string
-h, --host              Database host
-p, --port              Database port
-d, --database          Database name
-u, --user              Database user
-w, --password          Database password
```
