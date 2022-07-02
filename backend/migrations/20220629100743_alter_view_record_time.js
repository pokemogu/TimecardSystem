/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  await knex.schema.dropViewIfExists('recordTimeWithOnTime');
  await knex.schema.createView('recordTimeWithOnTime', function (view) {
    view.as(
      knex.select({
        userId: 'user.id', userAccount: 'user.account', userName: 'user.name',
        departmentName: 'department.name', sectionName: 'section.name',
        date: 'record.date',
        clockin: 'record.clockin', break: 'record.break', reenter: 'record.reenter', clockout: 'record.clockout',
        clockinApply: 'record.clockinApply', breakApply: 'record.breakApply', reenterApply: 'record.reenterApply', clockoutApply: 'record.clockoutApply',
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
        .leftJoin('section', { 'section.id': 'user.section' })
        .leftJoin('department', { 'department.id': 'section.department' })
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
        userId: 'recordTimeWithOnTime.userId', userAccount: 'recordTimeWithOnTime.userAccount', userName: 'recordTimeWithOnTime.userName',
        departmentName: 'recordTimeWithOnTime.departmentName', sectionName: 'recordTimeWithOnTime.sectionName',
        totalLateCount: knex.raw('SUM(IF(earlyOverTime < 0, 1, 0))'),
        totalEarlyLeaveCount: knex.raw('SUM(IF(lateOverTime < 0, 1, 0))'),
        totalWorkTime: knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(workTime)))'),
        totalEarlyOverTime: knex.raw('SEC_TO_TIME(SUM(IF(earlyOverTime > 0, TIME_TO_SEC(earlyOverTime), 0)))'),
        totalLateOverTime: knex.raw('SEC_TO_TIME(SUM(IF(lateOverTime > 0, TIME_TO_SEC(lateOverTime), 0)))')
      })
        .from('recordTimeWithOnTime')
        .groupBy('recordTimeWithOnTime.userId')
        .orderBy('recordTimeWithOnTime.userId')
    );
  });
};
exports.up = up;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function down(knex) {
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