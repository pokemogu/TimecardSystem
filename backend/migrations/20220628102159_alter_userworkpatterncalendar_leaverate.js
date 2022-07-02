/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  if (await knex.schema.hasTable('userWorkPatternCalendar')) {
    if (!await knex.schema.hasColumn('userWorkPatternCalendar', 'leaveRate')) {
      await knex.schema.alterTable('userWorkPatternCalendar', function (table) {
        table.decimal('leaveRate', 5, 4).comment('勤務体系の時間帯内で休暇等で不在となる時間の割合。正の数の場合は勤務開始時から不在で途中から勤務開始する場合。負の数の場合は勤務開始は予定通りで勤務途中から不在となる場合。');
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
  if (await knex.schema.hasTable('userWorkPatternCalendar')) {
    if (await knex.schema.hasColumn('userWorkPatternCalendar', 'leaveRate')) {
      await knex.schema.alterTable('userWorkPatternCalendar', function (table) {
        table.dropColumn('leaveRate');
      });
    }
  }
};
exports.down = down;