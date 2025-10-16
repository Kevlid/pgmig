export interface DbConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}

export interface Config {
    migrationsDir: string;
    db: DbConfig;
}

export interface CLIArgs {
    migrationsPath?: string;
    envPath?: string;
    uri?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
}
