import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export function getMigrations(dir: string) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        return [];
    }

    const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));

    // Sort by number: 1-create.sql, 2-update.sql
    files.sort((a, b) => {
        const numA = parseInt(a.split("-")[0]);
        const numB = parseInt(b.split("-")[0]);
        return numA - numB;
    });

    return files.map((filename) => {
        const id = parseInt(filename.split("-")[0]);
        const sql = readFileSync(join(dir, filename), "utf-8");
        return { id, filename, sql };
    });
}

export function createMigration(dir: string, name: string) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    const existing = getMigrations(dir);
    const nextNum = existing.length > 0 ? Math.max(...existing.map((m) => m.id)) + 1 : 1;

    const safeName = name.replace(/\s+/g, "_").toLowerCase();
    const filename = `${nextNum}-${safeName}.sql`;
    const path = join(dir, filename);

    writeFileSync(path, "-- UP\n\n\n-- DOWN\n");
    return path;
}

export function parseMigration(sql: string) {
    const upMatch = sql.match(/--\s*UP\s+([\s\S]*?)(?:--\s*DOWN|$)/i);
    const downMatch = sql.match(/--\s*DOWN\s+([\s\S]*?)$/i);

    return {
        up: upMatch?.[1]?.trim() || "",
        down: downMatch?.[1]?.trim() || "",
    };
}
