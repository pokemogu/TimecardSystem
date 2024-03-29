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
      table.boolean('recordByLogin').notNullable().defaultTo(false);
      table.boolean('applyRecord').notNullable().defaultTo(false);
      table.boolean('applyVacation').notNullable().defaultTo(false);
      table.boolean('applyHalfDayVacation').notNullable().defaultTo(false);
      table.boolean('applyMakeupVacation').notNullable().defaultTo(false);
      table.boolean('applyMourningLeave').notNullable().defaultTo(false);
      table.boolean('applyMeasureLeave').notNullable().defaultTo(false);
      table.boolean('applyOvertime').notNullable().defaultTo(false);
      table.boolean('applyLate').notNullable().defaultTo(false);
      table.integer('maxApplyLateNum').unsigned();
      table.integer('maxApplyLateHours').unsigned();
      table.boolean('applyEarly').notNullable().defaultTo(false);
      table.integer('maxApplyEarlyNum').unsigned();
      table.integer('maxApplyEarlyHours').unsigned();
      table.boolean('approve').notNullable().defaultTo(false);
      table.boolean('viewDuty').notNullable().defaultTo(false);
      table.boolean('configureDutySystem').notNullable().defaultTo(false);
      table.boolean('configurePrivilege').notNullable().defaultTo(false);
      table.boolean('configureDutyStructure').notNullable().defaultTo(false);
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
      /*
      table.time('overtimeStart');
      table.time('overtimeEnd');
      table.integer('overTimeWage')
      table.time('extraOvertimeStart');
      table.time('extraOvertimeEnd');
      table.time('midnightWorkStart');
      table.time('midnightWorkEnd');
      table.time('extraMidnightWorkStart');
      table.time('extraMidnightWorkEnd');
      table.time('maxAllowedLateHoursPerMonth');
      table.time('maxAllowedLateNumberPerMonth');
      */
    });

    await knex.schema.createTable('wagePattern', function (table) {
      table.increments('id');
      table.integer('workPattern').unsigned().notNullable();
      table.string('name').notNullable().unique();
      table.time('timeStart').notNullable();
      table.time('timeEnd').notNullable();
      table.integer('normalWagePercentage').unsigned().notNullable();
      table.integer('holidayWagePercentage').unsigned();
      table.integer('mandatoryHolidayWagePercentage').unsigned();
      table.integer('nonMandatoryHolidayWagePercentage').unsigned();

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
      table.string('phonetic').notNullable().index();
      table.integer('section').unsigned().index();
      table.integer('privilege').unsigned().notNullable();
      table.integer('hourlyWage');
      table.integer('commuteAllowance');
      table.boolean('printOutWageDetail');
      table.integer('defaultWorkPattern').unsigned().notNullable();
      table.integer('optional1WorkPattern').unsigned();
      table.integer('optional2WorkPattern').unsigned();

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
      table.integer('workPattern').unsigned().notNullable();
      table.date('date').notNullable();

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

    await knex.schema.createTable('device', function (table) {
      table.increments('id');
      table.string('name').notNullable().unique();
      table.string('token').unique();
      table.datetime('tokenExpiration');
    });

    await knex.schema.createTable('record', function (table) {
      table.increments('id');
      table.integer('user').unsigned().notNullable();
      table.integer('type').unsigned().notNullable();
      table.integer('device').unsigned();
      table.datetime('timestamp').notNullable().index().comment('打刻が行なわれた日時');

      table.foreign('user').references('id').inTable('user');
      table.foreign('type').references('id').inTable('recordType');
      table.foreign('device').references('id').inTable('device');
    });

    await knex.schema.createTable('applyType', function (table) {
      table.increments('id');
      table.string('name', 15).notNullable().unique();
      table.boolean('isSystemType').notNullable().defaultTo(false);
      table.string('description').notNullable();
    });

    await knex.schema.raw('ALTER TABLE applyType MODIFY name VARCHAR(15) CHARACTER SET ascii;');

    await knex('applyType').insert([
      { name: 'record', isSystemType: true, description: '打刻' },
      { name: 'leave', isSystemType: true, description: '休暇' },
      { name: 'overtime', isSystemType: true, description: '早出・残業' },
      { name: 'lateness', isSystemType: true, description: '遅刻' },
      { name: 'leave-early', isSystemType: true, description: '早退' },
      { name: 'break', isSystemType: true, description: '外出' },
      { name: 'holiday-work', isSystemType: true, description: '休日出勤' },
      { name: 'makeup-leave', isSystemType: true, description: '代休' },
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
      { optionType: optionTypeRecordSituation[0].id, name: 'withdrawal', isSystemType: true, description: '外出' },
      { optionType: optionTypeRecordType[0].id, name: 'clockin', isSystemType: true, description: '出勤' },
      { optionType: optionTypeRecordType[0].id, name: 'clockout', isSystemType: true, description: '退勤' },
      { optionType: optionTypeRecordType[0].id, name: 'break', isSystemType: true, description: '外出' },
      { optionType: optionTypeRecordType[0].id, name: 'reenter', isSystemType: true, description: '再入' },
      { optionType: optionTypeLeaveType[0].id, name: 'paid', isSystemType: true, description: '有給' },
      { optionType: optionTypeLeaveType[0].id, name: 'half', isSystemType: true, description: '半休' },
      { optionType: optionTypeLeaveType[0].id, name: 'compensation', isSystemType: true, description: '代休' },
      { optionType: optionTypeLeaveType[0].id, name: 'mourning', isSystemType: true, description: '慶弔休' },
      { optionType: optionTypeLeaveType[0].id, name: 'measure', isSystemType: true, description: '措置休暇' },
    ]);

    await knex.schema.createTable('apply', function (table) {
      table.increments('id');
      table.integer('type').unsigned().notNullable().index().comment('申請種別');
      table.integer('user').unsigned().notNullable().index().comment('申請対象ユーザー');
      table.integer('appliedUser').unsigned().comment('申請を実施したユーザー()');
      table.datetime('timestamp').notNullable().index().comment('申請が行なわれた日時');
      table.datetime('dateFrom').notNullable().comment('申請内容の開始日時');
      table.datetime('dateTo').comment('申請内容の終了日時');
      table.datetime('dateRelated').comment('申請内容に関連する日時(例: 代休申請での休日出勤日)');
      table.string('reason').comment('申請理由');
      table.string('contact').comment('申請における連絡先(休暇取得時の連絡先)');
      table.boolean('isApproved').index().comment('TRUEの場合は承認済、FALSEの場合は否認済、NULLの場合は未承認');
      table.integer('route').unsigned().notNullable().index().comment('申請承認ルート');

      table.foreign('user').references('id').inTable('user');
      table.foreign('appliedUser').references('id').inTable('user');
      table.foreign('type').references('id').inTable('applyType');
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

    await knex.schema.createTable('approvalRoute', function (table) {
      table.increments('id');
      table.string('name').notNullable();
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

    await knex.schema.createTable('config', function (table) {
      table.string('key').notNullable().unique().primary().comment('設定データID');
      table.string('value').comment('設定データ値');
      table.string('description').comment('設定データ名称');
    });

    await knex('config').insert([
      { key: 'smtpHost', value: '', description: 'メール送信(SMTP)サーバーホスト名/IPアドレス' },
      { key: 'smtpPort', value: '', description: 'メール送信(SMTP)サーバーポート番号' },
      { key: 'smtpUsername', value: '', description: 'メール送信(SMTP)サーバーログインユーザー名' },
      { key: 'smtpPassword', value: '', description: 'メール送信(SMTP)サーバーログインパスワード' },
    ]);

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
  }
  catch (error) {
    await down(knex);
    throw error;
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropViewIfExists('approvalRouteMemberInfo');

  await knex.schema.dropTableIfExists('mailQueue');
  await knex.schema.dropTableIfExists('config');
  await knex.schema.dropTableIfExists('approvalRouteMember');
  await knex.schema.dropTableIfExists('approvalRoute');
  await knex.schema.dropTableIfExists('approval');
  await knex.schema.dropTableIfExists('roleLevel');
  await knex.schema.dropTableIfExists('role');
  await knex.schema.dropTableIfExists('applyOption');
  await knex.schema.dropTableIfExists('apply');
  await knex.schema.dropTableIfExists('applyOptionValue');
  await knex.schema.dropTableIfExists('applyOptionType');
  await knex.schema.dropTableIfExists('applyType');
  await knex.schema.dropTableIfExists('record');
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
