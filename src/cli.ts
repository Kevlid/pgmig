#!/usr/bin/env node
import { parseArgs } from "util";
import { loadConfig } from "./config";
import { Migrator } from "./migrator";
import { createMigration } from "./utils";

const help = `
pgmig - PostgreSQL migrations

Commands:
  up          Run pending migrations
  down [n]    Rollback n migrations (default: 1)
  status      Show migration status
  create <name>   Create new migration

Options:
  -m  Migrations folder (default: ./migrations)
  -e  .env file path (default: ./.env)
  
  Database (overrides .env):
  --uri       Connection string
  -h  Host
  -p  Port
  -d  Database
  -u  User
  -w  Password

Examples:
  pgmig up
  pgmig create add_users
  pgmig down 2
`;

async function main() {
    const [cmd, ...args] = process.argv.slice(2);

    if (!cmd || cmd === "--help") {
        console.log(help);
        return;
    }

    try {
        const { values } = parseArgs({
            args,
            options: {
                "migrations-path": { type: "string", short: "m" },
                "env-path": { type: "string", short: "e" },
                uri: { type: "string" },
                host: { type: "string", short: "h" },
                port: { type: "string", short: "p" },
                database: { type: "string", short: "d" },
                user: { type: "string", short: "u" },
                password: { type: "string", short: "w" },
            },
            allowPositionals: true,
        });

        const opts = {
            migrationsPath: values["migrations-path"] as string | undefined,
            envPath: values["env-path"] as string | undefined,
            uri: values.uri as string | undefined,
            host: values.host as string | undefined,
            port: values.port ? parseInt(values.port as string) : undefined,
            database: values.database as string | undefined,
            user: values.user as string | undefined,
            password: values.password as string | undefined,
        };

        if (cmd === "create") {
            const name = args.find((a) => !a.startsWith("-"));
            if (!name) {
                console.error("Missing name\nUsage: pgmig create <name>");
                process.exit(1);
            }

            const config = loadConfig(opts);
            const path = createMigration(config.migrationsDir, name);
            console.log(`✓ Created: ${path}`);
            return;
        }

        const config = loadConfig(opts);
        const { database, user, password } = config.db;

        if (!database || !user || !password) {
            console.error("Missing DB credentials");
            console.log("Set via .env or flags");
            process.exit(1);
        }

        const db = new Migrator(config.db);
        await db.connect();

        try {
            if (cmd === "up") {
                await db.up(config.migrationsDir);
            } else if (cmd === "down") {
                const n = args.find((a) => !a.startsWith("-"));
                const steps = n ? parseInt(n) : 1;
                if (isNaN(steps) || steps < 1) throw new Error("Invalid step count");
                await db.down(config.migrationsDir, steps);
            } else if (cmd === "status") {
                await db.status(config.migrationsDir);
            } else {
                console.error(`Unknown: ${cmd}`);
                console.log(help);
                process.exit(1);
            }
        } finally {
            await db.disconnect();
        }
    } catch (err) {
        console.error("\n" + (err instanceof Error ? err.message : String(err)));
        process.exit(1);
    }
}

main();
