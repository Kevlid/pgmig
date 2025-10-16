import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { Config, CLIArgs, DbConfig } from "./types";

export function loadConfig(args: CLIArgs): Config {
    const env = readEnv(args.envPath);

    return {
        migrationsDir: getMigrationsDir(args.migrationsPath),
        db: getDb(args, env),
    };
}

function getMigrationsDir(path?: string) {
    if (path) {
        const dir = resolve(path);
        if (!existsSync(dir)) throw new Error(`Not found: ${dir}`);
        return dir;
    }

    for (const p of ["migrations", "db/migrations", "database/migrations"]) {
        const dir = resolve(p);
        if (existsSync(dir)) return dir;
    }

    return resolve("migrations");
}

function getDb(args: CLIArgs, env: Record<string, string>): DbConfig {
    const uri = args.uri || env.DATABASE_URL || env.DB_URI || env.POSTGRES_URI;
    if (uri) {
        const u = new URL(uri);
        return {
            host: u.hostname,
            port: parseInt(u.port) || 5432,
            database: u.pathname.slice(1),
            user: u.username,
            password: u.password,
        };
    }

    return {
        host: args.host || env.DB_HOST || env.POSTGRES_HOST || "localhost",
        port: args.port || parseInt(env.DB_PORT || env.POSTGRES_PORT || "5432"),
        database: args.database || env.DB_NAME || env.POSTGRES_DB || "",
        user: args.user || env.DB_USER || env.POSTGRES_USER || "",
        password: args.password || env.DB_PASSWORD || env.POSTGRES_PASSWORD || "",
    };
}

function readEnv(path?: string) {
    const file = path || resolve(".env");
    if (!existsSync(file)) return {};

    const env: Record<string, string> = {};

    for (const line of readFileSync(file, "utf-8").split("\n")) {
        const text = line.trim();
        if (!text || text.startsWith("#")) continue;

        const [key, ...rest] = text.split("=");
        if (!key || rest.length === 0) continue;

        let value = rest.join("=").trim();
        if (
            (value[0] === '"' && value[value.length - 1] === '"') ||
            (value[0] === "'" && value[value.length - 1] === "'")
        ) {
            value = value.slice(1, -1);
        }

        env[key.trim()] = value;
    }

    return env;
}
