import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  try {
    await knex.schema.createTable('holiday', function (table) {
      table.datetime('date').unique().index();
      table.string('name');
    });

    await knex('holiday').insert([
      { date: new Date('2022-04-29T00:00:00'), name: '昭和の日' },
      { date: new Date('2022-05-03T00:00:00'), name: '憲法記念日' },
      { date: new Date('2022-05-04T00:00:00'), name: 'みどりの日' },
      { date: new Date('2022-05-05T00:00:00'), name: 'こどもの日' },
      { date: new Date('2022-07-18T00:00:00'), name: '海の日' },
      { date: new Date('2022-08-11T00:00:00'), name: '山の日' },
      { date: new Date('2022-09-19T00:00:00'), name: '敬老の日' },
      { date: new Date('2022-09-23T00:00:00'), name: '秋分の日' },
      { date: new Date('2022-10-10T00:00:00'), name: 'スポーツの日' },
      { date: new Date('2022-11-03T00:00:00'), name: '文化の日' },
      { date: new Date('2022-11-23T00:00:00'), name: '勤労感謝の日' },
      { date: new Date('2023-01-01T00:00:00'), name: '元日' },
      { date: new Date('2023-01-02T00:00:00'), name: '休日' },
      { date: new Date('2023-01-09T00:00:00'), name: '成人の日' },
      { date: new Date('2023-02-11T00:00:00'), name: '建国記念の日' },
      { date: new Date('2023-02-23T00:00:00'), name: '天皇誕生日' },
      { date: new Date('2023-03-21T00:00:00'), name: '春分の日' },
      { date: new Date('2023-04-29T00:00:00'), name: '昭和の日' },
      { date: new Date('2023-05-03T00:00:00'), name: '憲法記念日' },
      { date: new Date('2023-05-04T00:00:00'), name: 'みどりの日' },
      { date: new Date('2023-05-05T00:00:00'), name: 'こどもの日' },
      { date: new Date('2023-07-17T00:00:00'), name: '海の日' },
      { date: new Date('2023-08-11T00:00:00'), name: '山の日' },
      { date: new Date('2023-09-18T00:00:00'), name: '敬老の日' },
      { date: new Date('2023-09-23T00:00:00'), name: '秋分の日' },
      { date: new Date('2023-10-09T00:00:00'), name: 'スポーツの日' },
      { date: new Date('2023-11-03T00:00:00'), name: '文化の日' },
      { date: new Date('2023-11-23T00:00:00'), name: '勤労感謝の日' },
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

    await knex('department').insert([
      { name: '名古屋事業所' },
      { name: '浜松工場' },
      { name: '東名工場' }
    ]);

    const departmentNagoya = (await knex.first<{ id: number }>('id').from('department').where('name', '名古屋事業所')).id;
    const departmentHamamatsu = (await knex.first<{ id: number }>('id').from('department').where('name', '浜松工場')).id;
    const departmentTomei = (await knex.first<{ id: number }>('id').from('department').where('name', '東名工場')).id;
    await knex('section').insert([
      { department: departmentNagoya, name: '第一営業部' },
      { department: departmentNagoya, name: '第ニ営業部' },
      { department: departmentNagoya, name: '第三営業部' },
      { department: departmentNagoya, name: '経理・総務部' },
      { department: departmentHamamatsu, name: '営業部' },
      { department: departmentHamamatsu, name: '製造部' },
      { department: departmentHamamatsu, name: '品質保証部' },
      { department: departmentHamamatsu, name: '技術部' },
      { department: departmentHamamatsu, name: '総務部' },
      { department: departmentTomei, name: '製造部' },
      { department: departmentTomei, name: '品質保証部' },
    ]);

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
      table.integer('fixedMinutesOfDayFrom').unsigned();
      table.integer('fixedMinutesOfDayTo').unsigned();
      table.integer('overtimeMinutes').unsigned();
      table.integer('holidayWorkWageRate').unsigned();
      table.integer('extraOvertimeMinutesOfDayFrom').unsigned();
      table.integer('extraOvertimeMinutesOfDayTo').unsigned();
      table.integer('nightMinutesOfDayFrom').unsigned();
      table.integer('nightMinutesOfDayTo').unsigned();
      table.integer('nightWorkWageRate').unsigned();
      table.integer('extraNightMinutesOfDayFrom').unsigned();
      table.integer('extraNightMinutesOfDayTo').unsigned();
      table.integer('maxAllowedLateHoursPerMonth').unsigned();
      table.integer('maxAllowedLateNumPerMonth').unsigned();
      table.integer('wageCalculationMinutes').unsigned();
      table.integer('measureLeaveWageRate').unsigned();
    });

    await knex.schema.createTable('user', function (table) {
      table.increments('id');
      table.boolean('available').notNullable().defaultTo(false);
      table.string('account').notNullable().unique().index();
      table.string('password');
      table.string('name').notNullable().index();
      table.string('email');
      table.string('phonetic').notNullable().index();
      table.integer('section').unsigned().index();
      table.integer('privilege').unsigned().notNullable();
      table.integer('hourlyWage');
      table.integer('commuteAllowance');
      table.boolean('qrTokenIssued').index();
      table.boolean('printOutWageDetail');

      table.foreign('section').references('id').inTable('section');
      table.foreign('privilege').references('id').inTable('privilege');
    });

    await knex.schema.createTable('userWorkPattern', function (table) {
      table.increments('id');
      table.integer('user').unsigned().notNullable().index();
      table.integer('workPattern').unsigned().notNullable();

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

    await knex.schema.createTable('recordType', function (table) {
      table.increments('id');
      table.string('name').notNullable().unique();
      table.string('description').notNullable();
    });

    await knex('recordType').insert([
      { name: 'clockin', description: '出勤' },
      { name: 'clockout', description: '退勤' },
      { name: 'break', description: '外出' },
      { name: 'reenter', description: '再入' },
    ]);

    await knex.schema.createTable('record', function (table) {
      table.increments('id');
      table.integer('user').unsigned().notNullable();
      table.integer('type').unsigned().notNullable();
      table.datetime('timestamp').notNullable().index();

      table.foreign('user').references('id').inTable('user');
      table.foreign('type').references('id').inTable('recordType');
    });

    await knex.schema.createTable('applyType', function (table) {
      table.increments('id');
      table.string('name').notNullable().unique();
      table.boolean('isSystemType').notNullable().defaultTo(false);
      table.string('description').notNullable();
    });

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
      table.string('name').index();
      table.boolean('isSystemType').notNullable().defaultTo(false);
      table.string('description').notNullable();

      table.foreign('type').references('id').inTable('applyType');
    });

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
      table.string('name').notNullable().index();
      table.boolean('isSystemType').notNullable().defaultTo(false);
      table.string('description').notNullable();

      table.foreign('optionType').references('id').inTable('applyOptionType');
    });

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
      table.datetime('timestamp').notNullable().index().comment('申請日時');
      table.datetime('dateFrom').notNullable().comment('申請内容の開始日時');
      table.datetime('dateTo').comment('申請内容の終了日時');
      table.datetime('dateRelated').comment('申請内容に関連する日時(例: 代休申請での休日出勤日)');
      table.string('reason').comment('申請理由');
      table.string('contact').comment('申請における連絡先(休暇取得時の連絡先)');
      table.boolean('isApproved').index().comment('TRUEの場合は承認済、FALSEの場合は否認済、NULLの場合は未承認');

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

    await knex.schema.createTable('device', function (table) {
      table.increments('id');
      table.string('name').notNullable().unique();
      table.string('token').unique();
      table.datetime('tokenExpiration');
    });

    await knex.schema.createTable('config', function (table) {
      table.string('key').notNullable().unique().primary();
      table.string('value');
    });

    await knex.schema.createTable('mailQueue', function (table) {
      table.increments('id');
      table.string('to').notNullable();
      table.string('from');
      table.string('cc');
      table.string('subject');
      table.string('body');
      table.datetime('timestamp');
    });
  }
  catch (error) {
    await down(knex);
    throw error;
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('config');
  await knex.schema.dropTableIfExists('device');
  await knex.schema.dropTableIfExists('approvalRouteMember');
  await knex.schema.dropTableIfExists('approvalRoute');
  await knex.schema.dropTableIfExists('approval');
  await knex.schema.dropTableIfExists('role');
  await knex.schema.dropTableIfExists('applyOption');
  await knex.schema.dropTableIfExists('apply');
  await knex.schema.dropTableIfExists('applyOptionValue');
  await knex.schema.dropTableIfExists('applyOptionType');
  await knex.schema.dropTableIfExists('applyType');
  await knex.schema.dropTableIfExists('record');
  await knex.schema.dropTableIfExists('recordType');
  await knex.schema.dropTableIfExists('token');
  await knex.schema.dropTableIfExists('userWorkPattern');
  await knex.schema.dropTableIfExists('user');
  await knex.schema.dropTableIfExists('workPattern');
  await knex.schema.dropTableIfExists('privilege');
  await knex.schema.dropTableIfExists('section');
  await knex.schema.dropTableIfExists('department');
  await knex.schema.dropTableIfExists('holiday');
}
