import { Knex } from "knex";
import dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({
  path: process.env.NODE_ENV
    ? (fs.existsSync("./.env." + process.env.NODE_ENV) ? ("./.env." + process.env.NODE_ENV) : "./.env")
    : "./.env"
});

// Update with your config settings.

const config: { [key: string]: Knex.Config } = {
  /*
    development: {
      client: "sqlite3",
      connection: {
        filename: "./timecard.sqlite"
      }
    },
  */
  development: {
    client: process.env.DB_TYPE || "sqlite3",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      database: process.env.DB_NAME || "my_db",
      user: process.env.DB_APP_USER || "my_user",
      password: process.env.DB_APP_PASSWORD || "password$001",
      multipleStatements: true
      //filename: process.env.DB_TYPE === "sqlite3" ? process.env.DB_NAME + ".sqlite" : undefined
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },

  production: {
    client: process.env.DB_TYPE || "mysql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      database: process.env.DB_NAME || "my_db",
      user: process.env.DB_APP_USER || "my_user",
      password: process.env.DB_APP_PASSWORD || "password$001"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }

};

module.exports = config;
