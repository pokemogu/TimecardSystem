const { table } = require("console");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  if (await knex.schema.hasTable('schedule')) {
    if (!await knex.schema.hasColumn('schedule', 'isPaid')) {
      await knex.schema.alterTable('schedule', function (table) {
        table.boolean('isPaid').defaultTo(false).notNullable().comment('有給かどうか');
      });
    }
    if (await knex.schema.hasColumn('schedule', 'apply')) {
      await knex.schema.alterTable('schedule', function (table) {
        //table.integer('apply').unsigned().nullable().comment('スケジュールの元となる申請');
        table.dropForeign('apply');
        table.integer('apply').unsigned().nullable().alter({ alterNullable: true, alterType: false }).comment('スケジュールの元となる申請');
        table.foreign('apply').references('id').inTable('apply');
      });
    }
    if (!await knex.schema.hasColumn('schedule', 'user')) {
      await knex.schema.alterTable('schedule', function (table) {
        table.integer('user').unsigned().notNullable();
        table.foreign('user').references('id').inTable('user');
      });
    }
  }
};
exports.up = up;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function down(knex) {
  if (await knex.schema.hasTable('schedule')) {
    if (await knex.schema.hasColumn('schedule', 'isPaid')) {
      await knex.schema.alterTable('schedule', function (table) {
        table.dropColumn('isPaid');
      });
    }
    if (await knex.schema.hasColumn('schedule', 'apply')) {
      await knex.schema.alterTable('schedule', function (table) {
        //table.integer('apply').unsigned().notNullable().comment('スケジュールの元となる申請');
        table.dropForeign('apply');
        table.integer('apply').unsigned().notNullable().alter({ alterNullable: true, alterType: false }).comment('スケジュールの元となる申請');
        table.foreign('apply').references('id').inTable('apply');
      });
    }
    if (await knex.schema.hasColumn('schedule', 'user')) {
      await knex.schema.alterTable('schedule', function (table) {
        table.dropForeign('user');
        table.dropColumn('user');
      });
    }
  }
};
exports.down = down;