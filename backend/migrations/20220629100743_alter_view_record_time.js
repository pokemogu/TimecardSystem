/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  try {
    await knex.schema.dropViewIfExists('recordTimeWithOnTime');
    await knex.schema.createView('recordTimeWithOnTime', function (view) {
      view.as(
        knex.select({
          userId: 'record.user', //userAccount: 'user.account', userName: 'user.name',
          //departmentName: 'department.name', sectionName: 'section.name',
          date: 'record.date',
          clockin: 'record.clockin', break: 'record.break', reenter: 'record.reenter', clockout: 'record.clockout',
          //clockin: knex.raw('SEC_TO_TIME(TIME_TO_SEC(record.clockin) - SECOND(record.clockin))'),
          //break: knex.raw('SEC_TO_TIME(TIME_TO_SEC(record.break) - SECOND(record.break))'),
          //reenter: knex.raw('SEC_TO_TIME(TIME_TO_SEC(record.reenter) - SECOND(record.reenter))'),
          //clockout: knex.raw('SEC_TO_TIME(TIME_TO_SEC(record.clockout) - SECOND(record.clockout))'),
          clockinApply: 'record.clockinApply', breakApply: 'record.breakApply', reenterApply: 'record.reenterApply', clockoutApply: 'record.clockoutApply',
          clockinDeviceAccount: 'clockinDevice.account', clockinDeviceName: 'clockinDevice.name',
          breakDeviceAccount: 'breakDevice.account', breakDeviceName: 'breakDevice.name',
          reenterDeviceAccount: 'reenterDevice.account', reenterDeviceName: 'reenterDevice.name',
          clockoutDeviceAccount: 'clockoutDevice.account', clockoutDeviceName: 'clockoutDevice.name',
          workPatternId: 'workPattern.id', workPatternName: 'workPattern.name',
          //workTime: knex.raw('TIMEDIFF(clockout, clockin)'),
          // 勤務時間は(退出時刻 - 出勤時刻)で算出する。その際は退出時刻と出勤時刻の秒は切り捨てる
          workTime: knex.raw('TIMEDIFF(FROM_UNIXTIME(UNIX_TIMESTAMP(record.clockout) - SECOND(record.clockout)), FROM_UNIXTIME(UNIX_TIMESTAMP(record.clockin) - SECOND(record.clockin)))'),
          onTimeStart: knex.raw('ADDTIME(record.date, workPattern.onTimeStart)'), onTimeEnd: knex.raw('ADDTIME(record.date, workPattern.onTimeEnd)'),
          //earlyOverTime: knex.raw('TIMEDIFF(ADDTIME(record.date, workPattern.onTimeStart), clockin)'),
          earlyOverTime: knex.raw('TIMEDIFF(ADDTIME(record.date, workPattern.onTimeStart), FROM_UNIXTIME(UNIX_TIMESTAMP(clockin) - SECOND(clockin)))'),
          //lateOverTime: knex.raw('TIMEDIFF(clockout, ADDTIME(record.date, workPattern.onTimeEnd))')
          lateOverTime: knex.raw('TIMEDIFF(FROM_UNIXTIME(UNIX_TIMESTAMP(clockout) - SECOND(clockout)), ADDTIME(record.date, workPattern.onTimeEnd))')
        })
          .from('record')
          .join('user', { 'user.id': 'record.user' })
          //.leftJoin('section', { 'section.id': 'user.section' })
          //.leftJoin('department', { 'department.id': 'section.department' })
          .leftJoin('user as clockinDevice', { 'clockinDevice.id': 'record.clockinDevice' })
          .leftJoin('user as breakDevice', { 'breakDevice.id': 'record.breakDevice' })
          .leftJoin('user as reenterDevice', { 'reenterDevice.id': 'record.reenterDevice' })
          .leftJoin('user as clockoutDevice', { 'clockoutDevice.id': 'record.clockoutDevice' })
          .leftJoin('userWorkPatternCalendar', function () {
            this.on('userWorkPatternCalendar.user', 'record.user');
            this.andOn('userWorkPatternCalendar.date', 'record.date');
          })
          .joinRaw('join `workPattern` on if(isnull(`userWorkPatternCalendar`.`workPattern`), `user`.`defaultWorkPattern`, `userWorkPatternCalendar`.`workPattern`) = `workPattern`.`id`')
          .orderBy('record.date')
          .orderBy('record.user')
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

  SET @sql_text = concat('drop temporary table if exists ', @table_name);
  PREPARE stmt FROM @sql_text;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

  SET @sql_text = concat('create temporary table ', @table_name, '(date date, userId int)');
  PREPARE stmt FROM @sql_text;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  
  SET @sql_text = concat('insert into ', @table_name, ' select a.date, user.id as userId
  from (
      select ''', DATE_FORMAT(@to_date, '%Y-%m-%d'), ''' - INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY as date
      from (
        select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9
      ) as a
      cross join (
        select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9
      ) as b
      cross join (
        select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9
      ) as c
  ) a 
  cross join user
  where a.date between ''', DATE_FORMAT(@from_date, '%Y-%m-%d'), ''' and last_day(''', DATE_FORMAT(@to_date, '%Y-%m-%d'), ''') and IFNULL(user.isDevice, 0) = 0
  order by a.date
  ');
  PREPARE stmt FROM @sql_text;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  
  END
  `);
  }
  catch (error) {
    await down(knex);
    throw error;
  }

};
exports.up = up;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function down(knex) {
  await knex.schema.raw('DROP PROCEDURE IF EXISTS generateAllDaysForUsers');
  await knex.schema.dropViewIfExists('workTimeInfo');
  await knex.schema.dropViewIfExists('recordTimeWithOnTime');
  await knex.schema.createView('recordTimeWithOnTime', function (view) {
    view.as(
      knex.select({
        userId: 'user.id', userAccount: 'user.account', userName: 'user.name', date: 'record.date',
        clockin: 'record.clockin', break: 'record.break', reenter: 'record.reenter', clockout: 'record.clockout',
        clockinDeviceAccount: 'clockinDevice.account', clockinDeviceName: 'clockinDevice.name',
        breakDeviceAccount: 'breakDevice.account', breakDeviceName: 'breakDevice.name',
        reenterDeviceAccount: 'reenterDevice.account', reenterDeviceName: 'reenterDevice.name',
        clockoutDeviceAccount: 'clockoutDevice.account', clockoutDeviceName: 'clockoutDevice.name',
        workPatternId: 'workPattern.id', workPatternName: 'workPattern.name',
        workTime: knex.raw('TIMEDIFF(clockout, clockin)'),
        onTimeStart: knex.raw('ADDTIME(record.date, workPattern.onTimeStart)'), onTimeEnd: knex.raw('ADDTIME(record.date, workPattern.onTimeEnd)'),
        earlyOverTime: knex.raw('TIMEDIFF(ADDTIME(record.date, workPattern.onTimeStart), clockin)'), lateOverTime: knex.raw('TIMEDIFF(clockout, ADDTIME(record.date, workPattern.onTimeEnd))')
      })
        .from('record')
        .join('user', { 'user.id': 'record.user' })
        .leftJoin('user as clockinDevice', { 'clockinDevice.id': 'record.clockinDevice' })
        .leftJoin('user as breakDevice', { 'breakDevice.id': 'record.breakDevice' })
        .leftJoin('user as reenterDevice', { 'reenterDevice.id': 'record.reenterDevice' })
        .leftJoin('user as clockoutDevice', { 'clockoutDevice.id': 'record.clockoutDevice' })
        .leftJoin('userWorkPatternCalendar', function () {
          this.on('userWorkPatternCalendar.user', 'record.user');
          this.andOn('userWorkPatternCalendar.date', 'record.date');
        })
        .joinRaw('join `workPattern` on if(isnull(`userWorkPatternCalendar`.`workPattern`), `user`.`defaultWorkPattern`, `userWorkPatternCalendar`.`workPattern`) = `workPattern`.`id`')
        .orderBy('record.date')
        .orderBy('record.user')
    );
  });
};
exports.down = down;