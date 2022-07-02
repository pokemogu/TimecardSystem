/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  if (await knex.schema.hasTable('schedule')) {
    if (!await knex.schema.hasColumn('schedule', 'dayAmount')) {
      await knex.schema.alterTable('schedule', function (table) {
        table.decimal('dayAmount', 4, 1).notNullable().defaultTo(1.0).comment('終日予定の場合は1.0、半日予定の場合は0.5');
      });
    }
  }

  if (await knex.schema.hasTable('annualLeave')) {
    if (!await knex.schema.hasColumn('annualLeave', 'dayAmount')) {
      await knex.schema.alterTable('annualLeave', function (table) {
        table.decimal('dayAmount', 4, 1).notNullable().comment('通常有給付与数');
        table.integer('hourAmount').notNullable().comment('時間有給付与数');
      });
    }

    if (await knex.schema.hasColumn('annualLeave', 'grantedAt')) {
      await knex.schema.alterTable('annualLeave', function (table) {
        table.date('grantedAt').notNullable().index().alter();
      });
    }

    if (await knex.schema.hasColumn('annualLeave', 'expireAt')) {
      await knex.schema.alterTable('annualLeave', function (table) {
        table.date('expireAt').notNullable().index().alter();
      });
    }
  }
}
exports.up = up;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function down(knex) {
  if (await knex.schema.hasTable('schedule')) {
    if (await knex.schema.hasColumn('schedule', 'dayAmount')) {
      await knex.schema.alterTable('schedule', function (table) {
        table.dropColumn('dayAmount');
      });
    }
  }

  if (await knex.schema.hasTable('annualLeave')) {

    if (await knex.schema.hasColumn('annualLeave', 'dayAmount')) {
      await knex.schema.alterTable('annualLeave', function (table) {
        table.dropColumn('dayAmount');
      });
    }

    if (await knex.schema.hasColumn('annualLeave', 'hourAmount')) {
      await knex.schema.alterTable('annualLeave', function (table) {
        table.dropColumn('hourAmount');
      });
    }

    if (await knex.schema.hasColumn('annualLeave', 'grantedAt')) {
      await knex.schema.alterTable('annualLeave', function (table) {
        table.dropIndex('grantedAt');
      });
    }

    if (await knex.schema.hasColumn('annualLeave', 'expireAt')) {
      await knex.schema.alterTable('annualLeave', function (table) {
        table.dropIndex('expireAt');
      });
    }
  }
}
exports.down = down;