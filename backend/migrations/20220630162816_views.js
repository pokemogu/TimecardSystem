/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  try {

    await knex.schema.createView('scheduleByApply', function (view) {
      view.as(
        knex.select({
          applyId: 'apply.id', userId: 'apply.user', date: 'apply.date',
          dateTimeFrom: 'apply.dateTimeFrom', dateTimeTo: 'apply.dateTimeTo',
          isWorking: knex.raw(`CASE WHEN applyType.name IN ('leave', 'am-leave', 'pm-leave', 'makeup-leave', 'mourning-leave', 'measure-leave') THEN FALSE ELSE TRUE END`),
          dayAmount: knex.raw(`CASE WHEN applyType.name IN ('am-leave', 'pm-leave') THEN 0.5 ELSE 1.0 END`),
          isPaid: knex.raw(`CASE WHEN applyType.name IN ('leave', 'am-leave', 'pm-leave') THEN TRUE ELSE FALSE END`),
          leaveType: knex.raw(`CASE WHEN applyType.name IN ('leave', 'am-leave', 'pm-leave', 'makeup-leave', 'mourning-leave', 'measure-leave') THEN applyType.name ELSE NULL END`),
          breakPeriodMinutes: 'breakPeriodMinutes'
        })
          .from('apply')
          .leftJoin('applyType', { 'applyType.id': 'apply.type' })
          .where('apply.isApproved', true)
        //.orderBy('record.date')
        //.orderBy('record.user')
      );
    });

    await knex.schema.createView('recordTimeWithOnTimePre', function (view) {
      view.as(
        knex.select({
          userId: 'record.user', date: 'record.date',
          // 秒は切り捨てる
          clockin: knex.raw('FROM_UNIXTIME(UNIX_TIMESTAMP(record.clockin) - SECOND(record.clockin))'),
          stepout: knex.raw('FROM_UNIXTIME(UNIX_TIMESTAMP(record.stepout) - SECOND(record.stepout))'),
          reenter: knex.raw('FROM_UNIXTIME(UNIX_TIMESTAMP(record.reenter) - SECOND(record.reenter))'),
          clockout: knex.raw('FROM_UNIXTIME(UNIX_TIMESTAMP(record.clockout) - SECOND(record.clockout))'),
          clockinApply: 'record.clockinApply', stepoutApply: 'record.stepoutApply', reenterApply: 'record.reenterApply', clockoutApply: 'record.clockoutApply',
          clockinDeviceAccount: 'clockinDevice.account', clockinDeviceName: 'clockinDevice.name',
          stepoutDeviceAccount: 'stepoutDevice.account', stepoutDeviceName: 'stepoutDevice.name',
          reenterDeviceAccount: 'reenterDevice.account', reenterDeviceName: 'reenterDevice.name',
          clockoutDeviceAccount: 'clockoutDevice.account', clockoutDeviceName: 'clockoutDevice.name',
          //workPatternId: 'workPattern.id', workPatternName: 'workPattern.name',
          // 休憩時間は申請でスケジュールされたものがあればそれを適用し、特に申請がなければ勤務体系の休憩時間を適用する
          breakPeriodMinutes: knex.raw(`
            CASE
              WHEN MAX(scheduleByApply.isWorking) = FALSE THEN NULL
              WHEN MAX(scheduleByApply.breakPeriodMinutes) IS NULL THEN workPattern.breakPeriodMinutes
              ELSE MAX(scheduleByApply.breakPeriodMinutes)
            END
          `),
          leaveType: knex.raw(`
            CASE
              WHEN MAX(scheduleByApply.isWorking) = FALSE THEN MAX(scheduleByApply.leaveType)
              ELSE NULL
            END
          `),
          onTimeStart: knex.raw('ADDTIME(record.date, workPattern.onTimeStart)'), onTimeEnd: knex.raw('ADDTIME(record.date, workPattern.onTimeEnd)'),
        })
          .from('record')
          .join('user', { 'user.id': 'record.user' })
          .leftJoin('user as clockinDevice', { 'clockinDevice.id': 'record.clockinDevice' })
          .leftJoin('user as stepoutDevice', { 'stepoutDevice.id': 'record.stepoutDevice' })
          .leftJoin('user as reenterDevice', { 'reenterDevice.id': 'record.reenterDevice' })
          .leftJoin('user as clockoutDevice', { 'clockoutDevice.id': 'record.clockoutDevice' })
          .leftJoin('userWorkPatternCalendar', function () {
            this.on('userWorkPatternCalendar.user', 'record.user');
            this.andOn('userWorkPatternCalendar.date', 'record.date');
          })
          .joinRaw('JOIN `workPattern` ON IF(ISNULL(`userWorkPatternCalendar`.`workPattern`), `user`.`defaultWorkPattern`, `userWorkPatternCalendar`.`workPattern`) = `workPattern`.`id`')
          .leftJoin('schedule', { 'schedule.user': 'record.user', 'schedule.date': 'record.date' })
          .leftJoin('scheduleByApply', { 'scheduleByApply.applyId': 'schedule.apply' })
          .groupBy(['record.user', 'record.date', 'workPattern.id'])
        //.leftJoin('schedule', function () {
        //  this.on('schedule.user', 'record.user');
        //  this.andOn('schedule.date', 'record.date');
        //})
        //.orderBy('record.date')
        //.orderBy('record.user')
      );
    });

    await knex.schema.createView('recordTimeWithOnTime', function (view) {
      view.as(
        knex.select({
          userId: 'userId', date: 'date',
          clockin: 'clockin', stepout: 'stepout', reenter: 'reenter', clockout: 'clockout',
          clockinApply: 'clockinApply', stepoutApply: 'stepoutApply', reenterApply: 'reenterApply', clockoutApply: 'clockoutApply',
          clockinDeviceAccount: 'clockinDeviceAccount', clockinDeviceName: 'clockinDeviceName',
          stepoutDeviceAccount: 'stepoutDeviceAccount', stepoutDeviceName: 'stepoutDeviceName',
          reenterDeviceAccount: 'reenterDeviceAccount', reenterDeviceName: 'reenterDeviceName',
          clockoutDeviceAccount: 'clockoutDeviceAccount', clockoutDeviceName: 'clockoutDeviceName',
          //workPatternId: 'workPatternId', workPatternName: 'workPatternName',
          breakPeriodMinutes: 'breakPeriodMinutes',
          onTimeStart: 'onTimeStart', onTimeEnd: 'onTimeEnd',
          // 勤務時間は(退出時刻 - 出勤時刻 - 休憩時間)で算出する。
          workTime: knex.raw('TIMESTAMPADD(MINUTE, 0 - breakPeriodMinutes, TIMEDIFF(clockout, clockin))'),
          earlyOverTime: knex.raw('TIMEDIFF(onTimeStart, clockin)'),
          lateOverTime: knex.raw('TIMEDIFF(clockout, onTimeEnd)')
        })
          .from('recordTimeWithOnTimePre')
          .orderBy('date')
          .orderBy('userId')
      );
    });

    await knex.schema.createView('workTimeInfo', function (view) {
      view.as(
        knex.select({
          userId: 'recordTimeWithOnTime.userId', userAccount: 'user.account', userName: 'user.name',
          departmentName: 'department.name', sectionName: 'section.name',
          totalLateCount: knex.raw('SUM(IF(earlyOverTime < 0, 1, 0))'),
          totalEarlyLeaveCount: knex.raw('SUM(IF(lateOverTime < 0, 1, 0))'),
          totalWorkTime: knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(workTime)))'),
          totalEarlyOverTime: knex.raw('SEC_TO_TIME(SUM(IF(earlyOverTime > 0, TIME_TO_SEC(earlyOverTime), 0)))'),
          totalLateOverTime: knex.raw('SEC_TO_TIME(SUM(IF(lateOverTime > 0, TIME_TO_SEC(lateOverTime), 0)))')
        })
          .from('recordTimeWithOnTime')
          .join('user', { 'user.id': 'recordTimeWithOnTime.userId' })
          .leftJoin('section', { 'section.id': 'user.section' })
          .leftJoin('department', { 'department.id': 'section.department' })
          .groupBy('recordTimeWithOnTime.userId')
          .orderBy('recordTimeWithOnTime.userId')
      );
    });

    await knex.schema.raw(`
      CREATE PROCEDURE generateAllDaysForUsers( IN tempTableName VARCHAR(32), IN fromDate DATE, IN toDate DATE )
      BEGIN

        SET @table_name = tempTableName;
        SET @from_date = fromDate;
        SET @to_date = toDate;

        SET @sql_text = CONCAT('DROP TEMPORARY TABLE if exists ', @table_name);
        PREPARE stmt FROM @sql_text;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        SET @sql_text = CONCAT('CREATE TEMPORARY TABLE ', @table_name, '(date DATE, userId INT)');
        PREPARE stmt FROM @sql_text;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
  
        SET @sql_text = CONCAT('INSERT INTO ', @table_name, ' SELECT a.date, user.id AS userId
        FROM (
            SELECT ''', DATE_FORMAT(@to_date, '%Y-%m-%d'), ''' - INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY AS date
            FROM (
              SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
            ) AS a
            CROSS JOIN (
              SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
            ) AS b
            CROSS JOIN (
              SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
            ) AS c
        ) a 
        CROSS JOIN user
        WHERE a.date BETWEEN ''', DATE_FORMAT(@from_date, '%Y-%m-%d'), ''' AND LAST_DAY(''', DATE_FORMAT(@to_date, '%Y-%m-%d'), ''') AND IFNULL(user.isDevice, 0) = 0
        ORDER BY a.date
        ');
        PREPARE stmt FROM @sql_text;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END
  `);



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

  await knex.schema.raw('DROP PROCEDURE IF EXISTS generateAllDaysForUsers');
  await knex.schema.dropViewIfExists('workTimeInfo');
  await knex.schema.dropViewIfExists('recordTimeWithOnTime');
  await knex.schema.dropViewIfExists('recordTimeWithOnTimePre');
  await knex.schema.dropViewIfExists('scheduleByApply');
};
exports.down = down;