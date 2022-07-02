/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  if (await knex.schema.hasTable('applyType')) {
    await knex('applyType').insert({
      name: 'overtime', isSystemType: true, description: '残業', isLeaveOrWorkSchedule: false
    }).onConflict(['name']).merge(['description']); // ON DUPLICATE KEY UPDATE
  }
};
exports.up = up;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function down(knex) {
  if (await knex.schema.hasTable('applyType')) {
    await knex('applyType').insert({
      name: 'overtime', isSystemType: true, description: '早出・残業', isLeaveOrWorkSchedule: false
    }).onConflict(['name']).merge(['description']); // ON DUPLICATE KEY UPDATE
  }
};
exports.down = down;