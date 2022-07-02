/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  if (await knex.schema.hasTable('annualLeave')) {
    if (
      await knex.schema.hasColumn('annualLeave', 'user') &&
      await knex.schema.hasColumn('annualLeave', 'grantedAt') &&
      await knex.schema.hasColumn('annualLeave', 'expireAt')
    ) {
      await knex.schema.alterTable('annualLeave', function (table) {
        table.unique(['user', 'grantedAt', 'expireAt']);
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
  if (await knex.schema.hasTable('annualLeave')) {
    if (
      await knex.schema.hasColumn('annualLeave', 'user') &&
      await knex.schema.hasColumn('annualLeave', 'grantedAt') &&
      await knex.schema.hasColumn('annualLeave', 'expireAt')
    ) {
      await knex.schema.alterTable('annualLeave', function (table) {
        table.dropUnique(['user', 'grantedAt', 'expireAt']);
      });
    }
  }
};
exports.down = down;
