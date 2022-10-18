const Knex = require('knex').Knex;
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({
  path: process.env.NODE_ENV
    ? (fs.existsSync('.env.' + process.env.NODE_ENV) ? ('.env.' + process.env.NODE_ENV) : '.env')
    : '.env'
});

// Update with your config settings.

/** @type {{ [key: string]: Knex.Config }} */
const config = {
  /*
  development: {
    client: "sqlite3",
    connection: {
      filename: "./timecard.sqlite"
    }
  },
*/
  development: {
    client: process.env.DB_TYPE || 'sqlite3',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      database: process.env.DB_NAME || 'my_db',
      user: process.env.DB_USER || 'my_user',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
      //filename: process.env.DB_TYPE === "sqlite3" ? process.env.DB_NAME + ".sqlite" : undefined
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: process.env.DB_TYPE || 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      database: process.env.DB_NAME || 'my_db',
      user: process.env.DB_USER || 'my_user',
      password: process.env.DB_PASSWORD || ''
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};

module.exports = config;
