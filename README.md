# pgmig

Simple PostgreSQL migrations CLI

## Install

```bash
npm install pgmig
```

## Quick Start

1. Create your first migration:

```bash
npx pgmig create add_users
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
npx pgmig up
```

## Commands

### `pgmig create <name>`

Creates a new migration file with the next number.

```bash
pgmig create add_posts
# Creates: 2-add_posts.sql
```

### `pgmig up`

Runs all pending migrations.

```bash
pgmig up
```

### `pgmig down [n]`

Rolls back the last `n` migrations (default: 1).

```bash
pgmig down     # Rollback 1
pgmig down 3   # Rollback 3
```

### `pgmig status`

Shows which migrations have run and which are pending.

```bash
pgmig status
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
pgmig up --uri postgres://user:pass@localhost:5432/mydb

# Individual values
pgmig up -h localhost -p 5432 -d mydb -u postgres -w secret

# Custom migrations folder
pgmig up -m ./db/migrations

# Custom .env file
pgmig up -e .env.production
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
2. When you run `pgmig up`, it checks which migrations haven't been executed yet
3. Each migration runs in a transaction - if it fails, it rolls back automatically
4. The migration ID is stored in the database so it won't run again

## Examples

### Development Workflow

```bash
# Create a migration
pgmig create add_comments_table

# Edit the SQL file
# migrations/3-add_comments_table.sql

# Check status
pgmig status

# Run it
pgmig up

# Made a mistake? Roll it back
pgmig down

# Fix it and run again
pgmig up
```

### Production Deployment

```bash
# Using connection string from environment
DATABASE_URL=$PROD_DB_URL pgmig up

# Or using individual credentials
pgmig up -h prod-db.example.com -d production_db -u admin -w $PROD_PW
```

### CI/CD Example

```yaml
# .github/workflows/deploy.yml
- name: Run migrations
  env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npx pgmig up
```

## Migrations Folder

By default, pgmig looks for migrations in:

1. `./migrations`
2. `./db/migrations`
3. `./database/migrations`

You can specify a custom path with `-m`:

```bash
pgmig up -m ./sql/migrations
```

## Options Reference

```
-m, --migrations-path   Migrations folder (default: ./migrations)
-e, --env-path          .env file path (default: ./.env)

Database (overrides .env):
--uri                   Connection string
-h, --host              Database host
-p, --port              Database port
-d, --database          Database name
-u, --user              Database user
-w, --password          Database password
```

## Tips

-   Migrations run in order by number (1, 2, 3...)
-   Always write the DOWN section so you can rollback if needed
-   Test migrations locally before running in production
-   Keep migrations small and focused on one change
-   Never edit a migration after it's been run in production
-   Use transactions - each migration runs in its own transaction

## License

MIT
