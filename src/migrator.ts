import { Client } from "pg";
import { DbConfig } from "./types";
import { getMigrations, parseMigration } from "./utils";

export class Migrator {
    private db: Client;

    constructor(config: DbConfig) {
        this.db = new Client(config);
    }

    async connect() {
        await this.db.connect();
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT PRIMARY KEY,
                filename TEXT,
                ran_at TIMESTAMP DEFAULT NOW()
            )
        `);
    }

    async disconnect() {
        await this.db.end();
    }

    async up(dir: string) {
        const all = getMigrations(dir);
        const result = await this.db.query("SELECT id FROM migrations ORDER BY id");
        const done = result.rows.map((r) => r.id);
        const pending = all.filter((m) => !done.includes(m.id));

        if (pending.length === 0) {
            console.log("✓ Nothing to run");
            return;
        }

        console.log(`\nRunning ${pending.length} migration(s)...`);

        for (const mig of pending) {
            const { up } = parseMigration(mig.sql);
            if (!up) throw new Error(`No UP in ${mig.filename}`);

            try {
                await this.db.query("BEGIN");
                console.log(`  ${mig.filename}`);
                await this.db.query(up);
                await this.db.query("INSERT INTO migrations (id, filename) VALUES ($1, $2)", [mig.id, mig.filename]);
                await this.db.query("COMMIT");
                console.log(`  ✓`);
            } catch (err) {
                await this.db.query("ROLLBACK");
                throw new Error(`Failed: ${mig.filename}\n${err}`);
            }
        }

        console.log("\n✓ Done\n");
    }

    async down(dir: string, steps = 1) {
        const all = getMigrations(dir);
        const result = await this.db.query("SELECT id FROM migrations ORDER BY id");
        const done = result.rows.map((r) => r.id);

        if (done.length === 0) {
            console.log("✓ Nothing to rollback");
            return;
        }

        const toUndo = done.slice(-steps).reverse();
        console.log(`\nRolling back ${toUndo.length} migration(s)...`);

        for (const id of toUndo) {
            const mig = all.find((m) => m.id === id);
            if (!mig) throw new Error(`File not found for id ${id}`);

            const { down } = parseMigration(mig.sql);
            if (!down) throw new Error(`No DOWN in ${mig.filename}`);

            try {
                await this.db.query("BEGIN");
                console.log(`  ${mig.filename}`);
                await this.db.query(down);
                await this.db.query("DELETE FROM migrations WHERE id = $1", [id]);
                await this.db.query("COMMIT");
                console.log(`  ✓`);
            } catch (err) {
                await this.db.query("ROLLBACK");
                throw new Error(`Failed: ${mig.filename}\n${err}`);
            }
        }

        console.log("\n✓ Done\n");
    }

    async status(dir: string) {
        const all = getMigrations(dir);
        const result = await this.db.query("SELECT id FROM migrations");
        const done = result.rows.map((r) => r.id);

        console.log("\nMigrations\n");

        if (all.length === 0) {
            console.log("No migrations found\n");
            return;
        }

        for (const mig of all) {
            const mark = done.includes(mig.id) ? "✓" : "○";
            console.log(`${mark} ${mig.filename}`);
        }

        const pending = all.filter((m) => !done.includes(m.id));
        console.log(`\nRan: ${done.length}`);
        console.log(`Pending: ${pending.length}\n`);
    }
}
