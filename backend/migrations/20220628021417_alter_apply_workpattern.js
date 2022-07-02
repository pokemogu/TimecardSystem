/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  if (await knex.schema.hasTable('apply')) {
    if (!await knex.schema.hasColumn('apply', 'workPattern')) {
      await knex.schema.alterTable('apply', function (table) {
        table.integer('workPattern').unsigned();
        table.foreign('workPattern').references('id').inTable('workPattern');
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
  if (await knex.schema.hasTable('apply')) {
    if (await knex.schema.hasColumn('apply', 'workPattern')) {
      await knex.schema.alterTable('apply', function (table) {
        table.dropForeign('workPattern');
        table.dropColumn('workPattern');
      });
    }
  }
};
exports.down = down;