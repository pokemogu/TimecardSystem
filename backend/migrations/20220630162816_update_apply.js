/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  try {

    await knex.schema.createView('applyPivot', function (view) {
      view.as(
        knex
          .select({
            userId: 'apply.user', date: 'apply.date',
            approvingLeaveApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name IN ('leave', 'am-leave', 'pm-leave', 'makeup-leave', 'mourning-leave', 'measure-leave') AND
                    apply.isApproved IS NULL
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvedLeaveApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name IN ('leave', 'am-leave', 'pm-leave', 'makeup-leave', 'mourning-leave', 'measure-leave') AND
                    apply.isApproved = TRUE
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvingOvertimeApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name = 'overtime' AND
                    apply.isApproved IS NULL
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvedOvertimeApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name = 'overtime' AND
                    apply.isApproved = TRUE
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvingLatenessApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name = 'lateness' AND
                    apply.isApproved IS NULL
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvedLatenessApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name = 'lateness' AND
                    apply.isApproved = TRUE
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvingHolidayWorkApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name = 'holiday-work' AND
                    apply.isApproved IS NULL
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvedHolidayWorkApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name = 'holiday-work' AND
                    apply.isApproved = TRUE
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvingEarlyLeaveApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name = 'leave-early' AND
                    apply.isApproved IS NULL
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvedEarlyLeaveApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name = 'leave-early' AND
                    apply.isApproved = TRUE
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvingBreakApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name = 'break' AND
                    apply.isApproved IS NULL
                  THEN apply.id
                  ELSE NULL
                END
              )
            `),
            approvedBreakApply: knex.raw(`
              MAX(
                CASE
                  WHEN
                    applyType.name = 'break' AND
                    apply.isApproved = TRUE
                  THEN apply.id
                  ELSE NULL
                END
              )
            `)
          })
          .from('apply')
          .leftJoin('applyType', { 'applyType.id': 'apply.type' })
          .groupBy(['apply.user', 'apply.date'])
      );
    });

    await knex.schema.createView('approvingLeaveApply', function (view) {
      view.as(
        knex
          .select('apply.*', 'applyType.name')
          .from('apply')
          .leftJoin('applyType', { 'applyType.id': 'apply.type' })
          .whereIn('applyType.name', ['leave', 'am-leave', 'pm-leave', 'makeup-leave', 'mourning-leave', 'measure-leave'])
          .andWhere('apply.isApproved', null)
      );
    });

    await knex.schema.createView('latestApprovingLeaveApply', function (view) {
      view.as(
        knex
          .select('approvingLeaveApply.*')
          .from('approvingLeaveApply')
          .leftJoin('approvingLeaveApply as b', function (builder) {
            builder.on('b.user', 'approvingLeaveApply.user');
            builder.andOn('b.date', 'approvingLeaveApply.date');
            builder.andOn('b.timestamp', '>', 'approvingLeaveApply.timestamp');
          })
          .andWhere('b.id', null)
      );
    });

    await knex.schema.createView('approvedLeaveApply', function (view) {
      view.as(
        knex
          .select('apply.*', 'applyType.name')
          .from('apply')
          .leftJoin('applyType', { 'applyType.id': 'apply.type' })
          .whereIn('applyType.name', ['leave', 'am-leave', 'pm-leave', 'makeup-leave', 'mourning-leave', 'measure-leave'])
          .andWhere('apply.isApproved', true)
      );
    });

    await knex.schema.createView('latestApprovedLeaveApply', function (view) {
      view.as(
        knex
          .select('approvedLeaveApply.*')
          .select({
            dayAmount: knex.raw(`
            CASE
              WHEN approvedLeaveApply.name = 'am-leave' THEN 0.5
              WHEN approvedLeaveApply.name = 'pm-leave' THEN 0.5
              ELSE 1.0
            END
          `)
          })
          .select({
            isPaid: knex.raw(`
            CASE
              WHEN approvedLeaveApply.name = 'leave' THEN TRUE
              WHEN approvedLeaveApply.name = 'am-leave' THEN TRUE
              WHEN approvedLeaveApply.name = 'pm-leave' THEN TRUE
              ELSE FALSE
            END
          `)
          })
          .from('approvedLeaveApply')
          .leftJoin('approvedLeaveApply as b', function (builder) {
            builder.on('b.user', 'approvedLeaveApply.user');
            builder.andOn('b.date', 'approvedLeaveApply.date');
            builder.andOn('b.timestamp', '>', 'approvedLeaveApply.timestamp');
          })
          .andWhere('b.id', null)
      );
    });

    await knex.schema.createView('approvingOvertimeApply', function (view) {
      view.as(
        knex
          .select('apply.*', 'applyType.name')
          .from('apply')
          .leftJoin('applyType', { 'applyType.id': 'apply.type' })
          .where('applyType.name', 'overtime')
          .andWhere('apply.isApproved', null)
      );
    });

    await knex.schema.createView('latestApprovingOvertimeApply', function (view) {
      view.as(
        knex
          .select('approvingOvertimeApply.*')
          .from('approvingOvertimeApply')
          .leftJoin('approvingOvertimeApply as b', function (builder) {
            builder.on('b.user', 'approvingOvertimeApply.user');
            builder.andOn('b.date', 'approvingOvertimeApply.date');
            builder.andOn('b.timestamp', '>', 'approvingOvertimeApply.timestamp');
          })
          .andWhere('b.id', null)
      );
    });

    await knex.schema.createView('approvedOvertimeApply', function (view) {
      view.as(
        knex
          .select('apply.*', 'applyType.name')
          .from('apply')
          .leftJoin('applyType', { 'applyType.id': 'apply.type' })
          .where('applyType.name', 'overtime')
          .andWhere('apply.isApproved', true)
      );
    });

    await knex.schema.createView('latestApprovedOvertimeApply', function (view) {
      view.as(
        knex
          .select('approvedOvertimeApply.*')
          .from('approvedOvertimeApply')
          .leftJoin('approvedOvertimeApply as b', function (builder) {
            builder.on('b.user', 'approvedOvertimeApply.user');
            builder.andOn('b.date', 'approvedOvertimeApply.date');
            builder.andOn('b.timestamp', '>', 'approvedOvertimeApply.timestamp');
          })
          .andWhere('b.id', null)
      );
    });

  }
  catch (err) {
    await down(knex);
    throw err;
  }

};
exports.up = up;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function down(knex) {

  await knex.schema.dropViewIfExists('latestApprovedOvertimeApply');
  await knex.schema.dropViewIfExists('approvedOvertimeApply');
  await knex.schema.dropViewIfExists('latestApprovingOvertimeApply');
  await knex.schema.dropViewIfExists('approvingOvertimeApply');

  await knex.schema.dropViewIfExists('latestApprovedLeaveApply');
  await knex.schema.dropViewIfExists('approvedLeaveApply');
  await knex.schema.dropViewIfExists('latestApprovingLeaveApply');
  await knex.schema.dropViewIfExists('approvingLeaveApply');

  await knex.schema.dropViewIfExists('applyPivot');

};
exports.down = down;