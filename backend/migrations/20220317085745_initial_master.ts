import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  try {
    await knex.schema.createTable('holiday', function (table) {
      table.date('date').unique().index();
      table.string('name');
    });

    await knex('holiday').insert([
      { date: new Date('2022-04-29'), name: '昭和の日' },
      { date: new Date('2022-05-03'), name: '憲法記念日' },
      { date: new Date('2022-05-04'), name: 'みどりの日' },
      { date: new Date('2022-05-05'), name: 'こどもの日' },
      { date: new Date('2022-07-18'), name: '海の日' },
      { date: new Date('2022-08-11'), name: '山の日' },
      { date: new Date('2022-09-19'), name: '敬老の日' },
      { date: new Date('2022-09-23'), name: '秋分の日' },
      { date: new Date('2022-10-10'), name: 'スポーツの日' },
      { date: new Date('2022-11-03'), name: '文化の日' },
      { date: new Date('2022-11-23'), name: '勤労感謝の日' },
      { date: new Date('2023-01-01'), name: '元日' },
      { date: new Date('2023-01-02'), name: '休日' },
      { date: new Date('2023-01-09'), name: '成人の日' },
      { date: new Date('2023-02-11'), name: '建国記念の日' },
      { date: new Date('2023-02-23'), name: '天皇誕生日' },
      { date: new Date('2023-03-21'), name: '春分の日' },
      { date: new Date('2023-04-29'), name: '昭和の日' },
      { date: new Date('2023-05-03'), name: '憲法記念日' },
      { date: new Date('2023-05-04'), name: 'みどりの日' },
      { date: new Date('2023-05-05'), name: 'こどもの日' },
      { date: new Date('2023-07-17'), name: '海の日' },
      { date: new Date('2023-08-11'), name: '山の日' },
      { date: new Date('2023-09-18'), name: '敬老の日' },
      { date: new Date('2023-09-23'), name: '秋分の日' },
      { date: new Date('2023-10-09'), name: 'スポーツの日' },
      { date: new Date('2023-11-03'), name: '文化の日' },
      { date: new Date('2023-11-23'), name: '勤労感謝の日' },
    ]);

    await knex.schema.createTable('department', function (table) {
      table.increments('id');
      table.string('name').notNullable().unique().index();
    });

    await knex.schema.createTable('section', function (table) {
      table.increments('id');
      table.integer('department').unsigned().index();
      table.string('name').notNullable().index();

      table.foreign('department').references('id').inTable('department');
      table.unique(['department', 'name']);
    });

    await knex.schema.createTable('privilege', function (table) {
      table.increments('id');
      table.string('name').notNullable().unique();
      table.boolean('isSystemPrivilege').defaultTo(false).comment('システム内部の権限設定かどうか(システム内部権限は打刻機アカウントに使用される)');
      table.boolean('recordByLogin').notNullable().defaultTo(false);
      //table.boolean('applyRecord').notNullable().defaultTo(false);
      //table.boolean('applyLeave').notNullable().defaultTo(false);
      //table.boolean('applyHalfDayLeave').notNullable().defaultTo(false);
      //table.boolean('applyMakeupLeave').notNullable().defaultTo(false);
      //table.boolean('applyMourningLeave').notNullable().defaultTo(false);
      //table.boolean('applyMeasureLeave').notNullable().defaultTo(false);
      //table.boolean('applyOvertime').notNullable().defaultTo(false);
      //table.boolean('applyLate').notNullable().defaultTo(false);
      table.integer('maxApplyLateNum').unsigned();
      table.integer('maxApplyLateHours').unsigned();
      //table.boolean('applyEarly').notNullable().defaultTo(false);
      table.integer('maxApplyEarlyNum').unsigned();
      table.integer('maxApplyEarlyHours').unsigned();
      table.boolean('approve').notNullable().defaultTo(false);
      table.boolean('viewRecord').notNullable().defaultTo(false);
      table.boolean('viewRecordPerDevice').notNullable().defaultTo(false);
      table.boolean('configurePrivilege').notNullable().defaultTo(false);
      table.boolean('configureWorkPattern').notNullable().defaultTo(false);
      table.boolean('issueQr').notNullable().defaultTo(false);
      table.boolean('registerUser').notNullable().defaultTo(false);
      table.boolean('registerDevice').notNullable().defaultTo(false);
      table.boolean('viewAllUserInfo').notNullable().defaultTo(false);
      table.boolean('viewDepartmentUserInfo').notNullable().defaultTo(false);
      table.boolean('viewSectionUserInfo').notNullable().defaultTo(false);
    });

    await knex.schema.createTable('workPattern', function (table) {
      table.increments('id');
      table.string('name').notNullable().unique();
      table.time('onTimeStart').notNullable();
      table.time('onTimeEnd').notNullable();
    });

    await knex.schema.createTable('wagePattern', function (table) {
      table.increments('id');
      table.integer('workPattern').unsigned().notNullable();
      table.string('name').notNullable();
      table.time('timeStart').notNullable();
      table.time('timeEnd').notNullable();
      table.integer('normalWagePercentage').unsigned().notNullable();
      table.integer('holidayWagePercentage').unsigned();
      table.integer('mandatoryHolidayWagePercentage').unsigned();
      table.integer('nonMandatoryHolidayWagePercentage').unsigned();

      table.unique(['workPattern', 'name']);
      table.foreign('workPattern').references('id').inTable('workPattern');
    });

    await knex.schema.createTable('user', function (table) {
      table.increments('id');
      table.boolean('available').notNullable().defaultTo(false);
      table.datetime('registeredAt').notNullable();
      table.string('account').notNullable().unique().index();
      table.string('password');
      table.string('name').notNullable().index();
      table.string('email');
      table.string('phonetic').index();
      table.integer('section').unsigned().index();
      table.integer('privilege').unsigned().notNullable();
      table.integer('hourlyWage');
      table.integer('commuteAllowance');
      table.boolean('printOutWageDetail');
      table.integer('defaultWorkPattern').unsigned();
      table.integer('optional1WorkPattern').unsigned();
      table.integer('optional2WorkPattern').unsigned();
      table.boolean('isDevice').defaultTo(false).comment('打刻機アカウントの場合TRUE、従業員アカウントの場合FALSE');

      table.foreign('section').references('id').inTable('section');
      table.foreign('privilege').references('id').inTable('privilege');
      table.foreign('defaultWorkPattern').references('id').inTable('workPattern');
      table.foreign('optional1WorkPattern').references('id').inTable('workPattern');
      table.foreign('optional2WorkPattern').references('id').inTable('workPattern');
    });

    await knex.schema.raw('ALTER TABLE user MODIFY account VARCHAR(255) CHARACTER SET ascii;');
    await knex.schema.raw('ALTER TABLE user MODIFY password VARCHAR(255) CHARACTER SET ascii;');

    /*
    await knex.schema.createTable('userWorkPattern', function (table) {
      table.increments('id');
      table.integer('user').unsigned().notNullable().index();
      table.integer('workPattern').unsigned().notNullable();
      table.boolean('isDefault').defaultTo(false);

      table.foreign('user').references('id').inTable('user');
      table.foreign('workPattern').references('id').inTable('workPattern');
    });
    */

    await knex.schema.createTable('userWorkPatternCalendar', function (table) {
      table.increments('id');
      table.integer('user').unsigned().notNullable().index();
      table.integer('workPattern').unsigned().comment('その日の勤務体系を指定する。NULLの場合はいずれの勤務体系でも無いことを明示する。');
      table.date('date').notNullable();

      table.unique(['user', 'date']);
      table.foreign('user').references('id').inTable('user');
      table.foreign('workPattern').references('id').inTable('workPattern');
    });

    await knex.schema.createTable('token', function (table) {
      table.increments('id');
      table.integer('user').unsigned().notNullable().index();
      table.string('refreshToken').notNullable().unique().index();
      //table.datetime('refreshTokenExpiration').notNullable().index();
      table.string('accessToken');
      //table.datetime('accessTokenExpiration');
      table.boolean('isQrToken').notNullable().defaultTo(false);

      table.foreign('user').references('id').inTable('user');
    });

    await knex.schema.raw('ALTER TABLE token MODIFY refreshToken VARCHAR(255) CHARACTER SET ascii;');
    await knex.schema.raw('ALTER TABLE token MODIFY accessToken VARCHAR(255) CHARACTER SET ascii;');

    await knex.schema.createTable('device', function (table) {
      table.increments('id');
      table.string('name').notNullable().unique();
      table.string('token').unique();
      table.datetime('tokenExpiration');
    });

    ///////////////////////////////////////////////////////////////////////
    // 申請関連
    ///////////////////////////////////////////////////////////////////////

    await knex.schema.createTable('applyType', function (table) {
      table.increments('id');
      table.string('name', 15).notNullable().unique();
      table.boolean('isSystemType').notNullable().defaultTo(false);
      table.string('description').notNullable();
    });

    await knex.schema.raw('ALTER TABLE applyType MODIFY name VARCHAR(15) CHARACTER SET ascii;');

    await knex('applyType').insert([
      { name: 'record', isSystemType: true, description: '打刻' },
      { name: 'leave', isSystemType: true, description: '有休' },
      { name: 'halfday-leave', isSystemType: true, description: '半休' },
      { name: 'makeup-leave', isSystemType: true, description: '代休' },
      { name: 'mourning-leave', isSystemType: true, description: '慶弔休' },
      { name: 'measure-leave', isSystemType: true, description: '措置休' },
      { name: 'overtime', isSystemType: true, description: '早出・残業' },
      { name: 'lateness', isSystemType: true, description: '遅刻' },
      { name: 'leave-early', isSystemType: true, description: '早退' },
      { name: 'break', isSystemType: true, description: '外出' },
      { name: 'holiday-work', isSystemType: true, description: '休日出勤' },
    ]);

    await knex.schema.createTable('applyOptionType', function (table) {
      table.increments('id');
      table.integer('type').unsigned().notNullable().index();
      table.string('name', 15).index();
      table.boolean('isSystemType').notNullable().defaultTo(false);
      table.string('description').notNullable();

      table.foreign('type').references('id').inTable('applyType');
    });

    await knex.schema.raw('ALTER TABLE applyOptionType MODIFY name VARCHAR(15) CHARACTER SET ascii;');

    const typeRecord = await knex.select<{ id: number }[]>('id').as('type').from('applyType').where('name', 'record');
    const typeLeave = await knex.select<{ id: number }[]>('id').as('type').from('applyType').where('name', 'leave');
    await knex('applyOptionType').insert([
      { name: 'situation', isSystemType: true, type: typeRecord[0].id, description: '種類' },
      { name: 'recordType', isSystemType: true, type: typeRecord[0].id, description: '時刻' },
      { name: 'leaveType', isSystemType: true, type: typeLeave[0].id, description: '種類' },
    ]);

    await knex.schema.createTable('applyOptionValue', function (table) {
      table.increments('id');
      table.integer('optionType').unsigned().notNullable().index();
      table.string('name', 15).notNullable().index();
      table.boolean('isSystemType').notNullable().defaultTo(false);
      table.string('description').notNullable();

      table.foreign('optionType').references('id').inTable('applyOptionType');
    });

    await knex.schema.raw('ALTER TABLE applyOptionValue MODIFY name VARCHAR(15) CHARACTER SET ascii;');

    const optionTypeRecordSituation = await knex.select<{ id: number }[]>('id').as('optionType').from('applyOptionType')
      .where('type', typeRecord[0].id)
      .andWhere('name', 'situation');
    const optionTypeRecordType = await knex.select<{ id: number }[]>('id').as('optionType').from('applyOptionType')
      .where('type', typeRecord[0].id)
      .andWhere('name', 'recordType');
    const optionTypeLeaveType = await knex.select<{ id: number }[]>('id').as('optionType').from('applyOptionType')
      .where('type', typeLeave[0].id)
      .andWhere('name', 'leaveType');
    await knex('applyOptionValue').insert([
      { optionType: optionTypeRecordSituation[0].id, name: 'notyet', isSystemType: true, description: '未打刻' },
      { optionType: optionTypeRecordSituation[0].id, name: 'athome', isSystemType: true, description: '在宅' },
      { optionType: optionTypeRecordSituation[0].id, name: 'trip', isSystemType: true, description: '出張' },
      { optionType: optionTypeRecordSituation[0].id, name: 'break', isSystemType: true, description: '外出' },
      { optionType: optionTypeRecordType[0].id, name: 'clockin', isSystemType: true, description: '出勤' },
      { optionType: optionTypeRecordType[0].id, name: 'clockout', isSystemType: true, description: '退勤' },
      { optionType: optionTypeRecordType[0].id, name: 'break', isSystemType: true, description: '外出' },
      { optionType: optionTypeRecordType[0].id, name: 'reenter', isSystemType: true, description: '再入' },
      { optionType: optionTypeLeaveType[0].id, name: 'normal', isSystemType: true, description: '有給' },
      { optionType: optionTypeLeaveType[0].id, name: 'halfday', isSystemType: true, description: '半休' },
      //{ optionType: optionTypeLeaveType[0].id, name: 'makeup', isSystemType: true, description: '代休' },
      { optionType: optionTypeLeaveType[0].id, name: 'mourning', isSystemType: true, description: '慶弔休' },
      { optionType: optionTypeLeaveType[0].id, name: 'measure', isSystemType: true, description: '措置休暇' },
    ]);

    await knex.schema.createTable('approvalRoute', function (table) {
      table.increments('id');
      table.string('name').notNullable();

      table.integer('approvalLevel1MainUser').unsigned();
      table.integer('approvalLevel1SubUser').unsigned();
      table.integer('approvalLevel2MainUser').unsigned();
      table.integer('approvalLevel2SubUser').unsigned();
      table.integer('approvalLevel3MainUser').unsigned();
      table.integer('approvalLevel3SubUser').unsigned();
      table.integer('approvalDecisionUser').unsigned();

      table.foreign('approvalLevel1MainUser').references('id').inTable('user');
      table.foreign('approvalLevel1SubUser').references('id').inTable('user');
      table.foreign('approvalLevel2MainUser').references('id').inTable('user');
      table.foreign('approvalLevel2SubUser').references('id').inTable('user');
      table.foreign('approvalLevel3MainUser').references('id').inTable('user');
      table.foreign('approvalLevel3SubUser').references('id').inTable('user');
      table.foreign('approvalDecisionUser').references('id').inTable('user');
    });

    await knex.schema.createTable('apply', function (table) {
      table.increments('id');
      table.integer('type').unsigned().notNullable().index().comment('申請種別');
      table.integer('user').unsigned().notNullable().index().comment('申請対象ユーザー');
      table.integer('appliedUser').unsigned().comment('申請を実施したユーザー()');
      table.datetime('timestamp').notNullable().index().comment('申請が行なわれた日時');
      table.date('date').notNullable().comment('申請内容の基準日');
      table.datetime('dateTimeFrom').notNullable().comment('申請内容の開始日時');
      table.datetime('dateTimeTo').comment('申請内容の終了日時');
      table.datetime('dateRelated').comment('申請内容に関連する日時(例: 代休申請での休日出勤日)');
      table.string('reason').comment('申請理由');
      table.string('contact').comment('申請における連絡先(休暇取得時の連絡先)');
      table.integer('route').unsigned().notNullable().index().comment('申請承認ルート');
      table.integer('currentApprovingMainUser').unsigned();
      table.integer('currentApprovingSubUser').unsigned();
      table.integer('approvedLevel1User').unsigned();
      table.datetime('approvedLevel1UserTimestamp');
      table.integer('approvedLevel2User').unsigned();
      table.datetime('approvedLevel2UserTimestamp');
      table.integer('approvedLevel3User').unsigned();
      table.datetime('approvedLevel3UserTimestamp');
      table.integer('approvedDecisionUser').unsigned();
      table.datetime('approvedDecisionUserTimestamp');
      table.boolean('isApproved').index().comment('TRUEの場合は承認済、FALSEの場合は否認済、NULLの場合は未承認');

      table.foreign('user').references('id').inTable('user');
      table.foreign('appliedUser').references('id').inTable('user');
      table.foreign('type').references('id').inTable('applyType');
      table.foreign('route').references('id').inTable('approvalRoute');
      table.foreign('currentApprovingMainUser').references('id').inTable('user');
      table.foreign('currentApprovingSubUser').references('id').inTable('user');
      table.foreign('approvedLevel1User').references('id').inTable('user');
      table.foreign('approvedLevel2User').references('id').inTable('user');
      table.foreign('approvedLevel3User').references('id').inTable('user');
      table.foreign('approvedDecisionUser').references('id').inTable('user');
    });

    await knex.schema.createTable('applyOption', function (table) {
      table.increments('id');
      table.integer('apply').unsigned().notNullable();
      table.integer('optionType').unsigned().notNullable().index();
      table.integer('optionValue').unsigned().notNullable().index();

      table.unique(['apply', 'optionType']);
      table.foreign('apply').references('id').inTable('apply');
      table.foreign('optionType').references('id').inTable('applyOptionType');
      table.foreign('optionValue').references('id').inTable('applyOptionValue');
    });

    await knex.schema.createTable('applyPrivilege', function (table) {
      table.integer('type').unsigned().notNullable();
      table.integer('privilege').unsigned().notNullable();
      table.boolean('permitted').notNullable().defaultTo(false);

      table.unique(['type', 'privilege']);
      table.foreign('type').references('id').inTable('applyType');
      table.foreign('privilege').references('id').inTable('privilege');
    });

    await knex.schema.createTable('schedule', function (table) {
      table.increments('id');
      table.date('date').notNullable().comment('申請対象の基準日(労働日)');
      table.integer('apply').unsigned().notNullable().comment('スケジュールの元となる申請');
      table.boolean('isWorking').notNullable().defaultTo(false).comment('この予定が勤務時間扱いかそうでないか');

      table.foreign('apply').references('id').inTable('apply');
    });

    /*
    await knex.schema.createView('applyPrivilegeExistingList', function (view) {
      view.as(
        knex.select({
          userId: 'user.id', userAccount: 'user.account', userName: 'user.name', applyTypeId: 'applyType.id',
          isSystemType: 'applyType.isSystemType', permitted: 'applyPrivilege.permitted'
        })
          .from('applyType')
          .join('applyPrivilege', { 'applyPrivilege.type': 'applyType.id' })
          .join('user', { 'user.privilege': 'applyPrivilege.privilege' })
      );
    });

    await knex.schema.createView('applyPrivilegeAllList', function (view) {
      view.as(
        knex
          .select({
            applyTypeId: 'applyType.id', applyTypeName: 'applyType.name', applyTypeDescription: 'applyType.description',
            userId: 'userId', userAccount: 'userAccount', userName: 'userName',
            isSystemType: 'applyPrivilegeExistingList.isSystemType', permitted: 'applyPrivilegeExistingList.permitted'
          })
          .from('applyType')
          .leftJoin('applyPrivilegeExistingList', { 'applyType.id': 'applyPrivilegeExistingList.applyTypeId' })
      );
    });
    */

    ///////////////////////////////////////////////////////////////////////
    // 打刻関連
    ///////////////////////////////////////////////////////////////////////

    await knex.schema.createTable('recordType', function (table) {
      table.increments('id');
      table.string('name', 15).notNullable().unique();
      table.string('description').notNullable();
    });

    await knex.schema.raw('ALTER TABLE recordType MODIFY name VARCHAR(15) CHARACTER SET ascii;');

    await knex('recordType').insert([
      { name: 'clockin', description: '出勤' },
      { name: 'clockout', description: '退勤' },
      { name: 'break', description: '外出' },
      { name: 'reenter', description: '再入' },
    ]);

    /*
    await knex.schema.createTable('recordLog', function (table) {
      table.increments('id');
      table.integer('user').unsigned().notNullable();
      table.integer('type').unsigned().notNullable();
      table.integer('device').unsigned();
      table.datetime('timestamp').notNullable().comment('打刻が行なわれた日時');
      table.integer('apply').unsigned().comment('申請によって打刻が行なわれた場合の申請番号');

      table.foreign('user').references('id').inTable('user');
      table.foreign('type').references('id').inTable('recordType');
      table.foreign('device').references('id').inTable('device');
      table.foreign('apply').references('id').inTable('apply');
    });
    */

    /*
    await knex.raw(`create table recordLogTemp(
      id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
      user INT UNSIGNED NOT NULL,
      type INT UNSIGNED NOT NULL,
      device INT,
      timestamp DATETIME NOT NULL,
      apply INT UNSIGNED
    ) ENGINE=MEMORY`);
    */

    await knex.schema.createTable('record', function (table) {
      table.increments('id');
      table.integer('user').unsigned().index().notNullable();
      table.date('date').notNullable().index().comment('打刻基準日(労働日)');
      //table.integer('clockin').unsigned().comment('使用する出勤打刻ログ');
      //table.integer('clockout').unsigned().comment('使用する退勤打刻ログ');
      //table.integer('break').unsigned().comment('使用する外出打刻ログ');
      //table.integer('reenter').unsigned().comment('使用する再入打刻ログ');

      table.datetime('clockin').comment('出勤打刻時刻');
      table.integer('clockinDevice').unsigned().comment('出勤打刻機器');
      table.integer('clockinApply').unsigned().comment('出勤打刻申請');

      table.datetime('break').comment('外出打刻時刻');
      table.integer('breakDevice').unsigned().comment('外出打刻機器');
      table.integer('breakApply').unsigned().comment('外出打刻申請');

      table.datetime('reenter').comment('再入打刻時刻');
      table.integer('reenterDevice').unsigned().comment('再入打刻機器');
      table.integer('reenterApply').unsigned().comment('再入打刻申請');

      table.datetime('clockout').comment('退勤打刻時刻');
      table.integer('clockoutDevice').unsigned().comment('退勤打刻機器');
      table.integer('clockoutApply').unsigned().comment('退勤打刻申請');

      table.unique(['user', 'date']);
      table.foreign('user').references('id').inTable('user');
      //table.foreign('clockin').references('id').inTable('recordLog');
      //table.foreign('clockout').references('id').inTable('recordLog');
      //table.foreign('break').references('id').inTable('recordLog');
      //table.foreign('reenter').references('id').inTable('recordLog');
    });

    /*
    await knex.schema.createView('recordTime', function (view) {
      view.as(
        knex.select({
          userId: 'user.id', userAccount: 'user.account', userName: 'user.name', date: 'record.date',
          clockin: 't1.timestamp', break: 't2.timestamp', reenter: 't3.timestamp', clockout: 't4.timestamp'
        })
          .from('record')
          .leftJoin('recordLog as t1', { 't1.id': 'record.clockin' })
          .leftJoin('recordLog as t2', { 't2.id': 'record.break' })
          .leftJoin('recordLog as t3', { 't3.id': 'record.reenter' })
          .leftJoin('recordLog as t4', { 't4.id': 'record.clockout' })
          .join('user', { 'user.id': 'record.user' })
          .orderBy('record.date')
          .orderBy('record.user')
      );
    });
    */

    await knex.schema.createView('recordTimeWithOnTime', function (view) {
      view.as(
        knex.select({
          userId: 'user.id', userAccount: 'user.account', userName: 'user.name', date: 'record.date',
          clockin: 'record.clockin', break: 'record.break', reenter: 'record.reenter', clockout: 'record.clockout',
          workPatternId: 'workPattern.id', workPatternName: 'workPattern.name',
          workTime: knex.raw('TIMEDIFF(clockout, clockin)'),
          onTimeStart: knex.raw('ADDTIME(record.date, workPattern.onTimeStart)'), onTimeEnd: knex.raw('ADDTIME(record.date, workPattern.onTimeEnd)'),
          earlyOverTime: knex.raw('TIMEDIFF(ADDTIME(record.date, workPattern.onTimeStart), clockin)'), lateOverTime: knex.raw('TIMEDIFF(clockout, ADDTIME(record.date, workPattern.onTimeEnd))')
        })
          .from('record')
          .join('user', { 'user.id': 'record.user' })
          .leftJoin('userWorkPatternCalendar', function () {
            this.on('userWorkPatternCalendar.user', 'record.user');
            this.andOn('userWorkPatternCalendar.date', 'record.date');
          })
          .joinRaw('join `workPattern` on if(isnull(`userWorkPatternCalendar`.`workPattern`), `user`.`defaultWorkPattern`, `userWorkPatternCalendar`.`workPattern`) = `workPattern`.`id`')
          .orderBy('record.date')
          .orderBy('record.user')
      );
    });

    /*

select recordTimeWithOnTime.*,
TIMEDIFF(clockout, clockin) as workTime,
TIMEDIFF(onTimeStart, clockin) as earlyOverTime,
TIMEDIFF(clockout, onTimeEnd) as lateOverTime,
IF(DAYOFWEEK(recordTimeWithOnTime.date) = 7 OR DAYOFWEEK(recordTimeWithOnTime.date) = 1 OR (holiday.date IS NOT NULL), 1, 0) as isHoliday

from recordTimeWithOnTime
left join holiday on holiday.date = recordTimeWithOnTime.date
    */

    ///////////////////////////////////////////////////////////////////////
    // 承認関連
    ///////////////////////////////////////////////////////////////////////

    await knex.schema.createTable('role', function (table) {
      table.increments('id');
      table.string('name').notNullable();
      table.integer('level').unsigned().notNullable();
    });

    await knex.schema.createTable('roleLevel', function (table) {
      table.integer('level').unsigned().primary();
      table.string('name').notNullable();
    });

    await knex.schema.createTable('approval', function (table) {
      table.increments('id');
      table.integer('apply').unsigned().notNullable();
      table.integer('user').unsigned().notNullable();
      table.integer('role').unsigned().notNullable().comment('実際に承認された際の権限の実値を記録する。従業員に紐付いた権限は昇格等で変更される可能性がある為。');
      table.datetime('timestamp').notNullable();
      table.boolean('rejected').notNullable().index().comment('TRUEの場合は否認、FALSEの場合は承認');
      table.string('comment');

      table.foreign('apply').references('id').inTable('apply');
      table.foreign('user').references('id').inTable('user');
      table.foreign('role').references('id').inTable('role');
    });

    await knex.schema.createTable('approvalRouteMember', function (table) {
      table.increments('id');
      table.integer('route').unsigned().notNullable();
      table.integer('user').unsigned().notNullable();
      table.integer('role').unsigned().notNullable();

      table.foreign('route').references('id').inTable('approvalRoute');
      table.foreign('user').references('id').inTable('user');
      table.foreign('role').references('id').inTable('role');
    });

    await knex.schema.createView('approvalRouteMemberInfo', function (view) {
      view.as(
        knex.select({
          routeId: 'approvalRoute.id', routeName: 'approvalRoute.name', roleLevel: 'role.level',
          roleLevelName: 'roleLevel.name', roleName: 'role.name', userId: 'user.id',
          userAccount: 'user.account', userName: 'user.name'
        })
          .from('approvalRouteMember')
          .join('approvalRoute', { 'approvalRoute.id': 'approvalRouteMember.route' })
          .join('role', { 'role.id': 'approvalRouteMember.role' })
          .join('roleLevel', { 'roleLevel.level': 'role.level' })
          .join('user', { 'user.id': 'approvalRouteMember.user' })
          .orderBy('approvalRoute.id')
          .orderBy('role.level')
      );
    });

    ///////////////////////////////////////////////////////////////////////
    // その他
    ///////////////////////////////////////////////////////////////////////

    // システム全体の共通設定項目
    await knex.schema.createTable('systemConfig', function (table) {
      table.string('key').notNullable().unique().primary().comment('設定データID');
      table.string('value').comment('設定データ値');
      table.string('description').comment('設定データ名称');
    });

    // ユーザー別設定項目
    await knex.schema.createTable('userConfig', function (table) {
      table.string('key').notNullable().unique().primary().comment('設定データID');
      table.string('value').comment('設定データ値');
      table.string('description').comment('設定データ名称');
    });

    await knex('systemConfig').insert([
      { key: 'smtpHost', value: '', description: 'メール送信(SMTP)サーバーホスト名/IPアドレス' },
      { key: 'smtpPort', value: '', description: 'メール送信(SMTP)サーバーポート番号' },
      { key: 'smtpUsername', value: '', description: 'メール送信(SMTP)サーバーログインユーザー名' },
      { key: 'smtpPassword', value: '', description: 'メール送信(SMTP)サーバーログインパスワード' },
    ]);

    await knex('systemConfig').insert([
      { key: 'privateKey', value: '', description: 'QRコード認証に必要となる秘密鍵(失われると全ての発行済QRコードが使用できなくなるので絶対に修正したり削除しないこと!!!)' },
      { key: 'publicKey', value: '', description: 'QRコード認証に必要となる公開鍵(失われると全ての発行済QRコードが使用できなくなるので絶対に修正したり削除しないこと!!!)' }
    ])

    await knex.schema.createTable('mailQueue', function (table) {
      table.increments('id');
      table.string('to').notNullable();
      table.string('from', 63);
      table.string('cc');
      table.string('bcc');
      table.string('subject', 63);
      table.string('body', 1023);
      table.datetime('timestamp');
    });

    // 指定された月の全ての日を生成するストアドプロシージャgenerateAllDays
    // 生成結果は一時テーブルalldaysに書き込まれる
    //
    // 例)
    // CALL generateAllDays('2022-01-01', '2022-03-01'); SELECT date FROM alldays;
    //
    await knex.schema.raw(`
    CREATE PROCEDURE generateAllDays( IN fromDate DATE, IN toDate DATE )
    BEGIN
    
    create temporary table alldays(date date);
    
    insert into alldays select a.date 
    from (
        select last_day(toDate) - INTERVAL (a.a + (10 * b.a) + (100 * c.a)) DAY as date
        from (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as a
        cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as b
        cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as c
    ) a 
    where a.date between fromDate and last_day(toDate) order by a.date;
    
    END
    `);
  }
  catch (error) {
    await down(knex);
    throw error;
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('drop procedure if exists generateAllDays');

  //await knex.schema.dropViewIfExists('applyPrivilegeAllList');
  //await knex.schema.dropViewIfExists('applyPrivilegeExistingList');
  await knex.schema.dropViewIfExists('approvalRouteMemberInfo');
  await knex.schema.dropViewIfExists('recordTimeWithOnTime');
  await knex.schema.dropViewIfExists('recordTime');

  await knex.schema.dropTableIfExists('mailQueue');
  await knex.schema.dropTableIfExists('userConfig');
  await knex.schema.dropTableIfExists('systemConfig');
  await knex.schema.dropTableIfExists('config');
  await knex.schema.dropTableIfExists('approvalRouteMember');
  await knex.schema.dropTableIfExists('approval');
  await knex.schema.dropTableIfExists('roleLevel');
  await knex.schema.dropTableIfExists('role');
  await knex.schema.dropTableIfExists('record');
  //await knex.schema.dropTableIfExists('recordLogTemp');
  //await knex.schema.dropTableIfExists('recordLog');
  await knex.schema.dropTableIfExists('schedule');
  await knex.schema.dropTableIfExists('applyPrivilege');
  await knex.schema.dropTableIfExists('applyOption');
  await knex.schema.dropTableIfExists('apply');
  await knex.schema.dropTableIfExists('approvalRoute');
  await knex.schema.dropTableIfExists('applyOptionValue');
  await knex.schema.dropTableIfExists('applyOptionType');
  await knex.schema.dropTableIfExists('applyType');
  await knex.schema.dropTableIfExists('device');
  await knex.schema.dropTableIfExists('recordType');
  await knex.schema.dropTableIfExists('token');
  await knex.schema.dropTableIfExists('userWorkPattern');
  await knex.schema.dropTableIfExists('userWorkPatternCalendar');
  await knex.schema.dropTableIfExists('user');
  await knex.schema.dropTableIfExists('wagePattern');
  await knex.schema.dropTableIfExists('workPattern');
  await knex.schema.dropTableIfExists('privilege');
  await knex.schema.dropTableIfExists('section');
  await knex.schema.dropTableIfExists('department');
  await knex.schema.dropTableIfExists('holiday');
}
