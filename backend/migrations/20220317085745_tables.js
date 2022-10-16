/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  try {
    await knex.schema.createTable('holiday', function (table) {
      table.date('date').unique().index();
      table.string('name');
    });

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
      table.integer('maxApplyLateNum').unsigned();
      table.integer('maxApplyLateHours').unsigned();
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
      table.integer('breakPeriodMinutes').notNullable().defaultTo(60);
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

    await knex.schema.createTable('userWorkPatternCalendar', function (table) {
      table.increments('id');
      table.integer('user').unsigned().notNullable().index();
      table.integer('workPattern').unsigned().comment('その日の勤務体系を指定する。NULLの場合は終日休暇を意味する。');
      table.date('date').notNullable();
      //table.decimal('leaveRate', 5, 4).comment('勤務体系の時間帯内で休暇等で不在となる時間の割合。正の数の場合は勤務開始時から不在で途中から勤務開始する場合。負の数の場合は勤務開始は予定通りで勤務途中から不在となる場合。');

      table.unique(['user', 'date']);
      table.foreign('user').references('id').inTable('user');
      table.foreign('workPattern').references('id').inTable('workPattern');
    });

    await knex.schema.createTable('token', function (table) {
      table.increments('id');
      table.integer('user').unsigned().notNullable().index();
      table.string('refreshToken').notNullable().unique().index();
      table.datetime('refreshTokenExpiration').notNullable().index();
      table.string('accessToken');
      //table.datetime('accessTokenExpiration');
      table.boolean('isQrToken').notNullable().defaultTo(false);

      table.foreign('user').references('id').inTable('user');
    });

    await knex.schema.raw('ALTER TABLE token MODIFY refreshToken VARCHAR(255) CHARACTER SET ascii;');
    await knex.schema.raw('ALTER TABLE token MODIFY accessToken VARCHAR(255) CHARACTER SET ascii;');

    await knex.schema.createTable('annualLeave', function (table) {
      table.increments('id');
      table.integer('user').unsigned().notNullable().index();
      table.date('grantedAt').notNullable().index().comment('有給付与日時');
      table.date('expireAt').notNullable().index().comment('有給期限切れ日時');
      table.decimal('dayAmount', 4, 1).notNullable().comment('通常有給付与数');
      table.integer('hourAmount').notNullable().comment('時間有給付与数');

      table.unique(['user', 'grantedAt', 'expireAt']);
      table.foreign('user').references('id').inTable('user');
    });

    ///////////////////////////////////////////////////////////////////////
    // 申請関連
    ///////////////////////////////////////////////////////////////////////

    await knex.schema.createTable('applyType', function (table) {
      table.increments('id');
      table.string('name', 15).notNullable().unique().comment('申請種類の識別名称');
      table.boolean('isSystemType').notNullable().defaultTo(false).comment('申請種類がシステム標準かユーザーカスタムか');
      table.string('description').notNullable().comment('申請種類の説明名称');
      table.boolean('isLeaveOrWorkSchedule').comment('TRUEの場合は休暇や遅刻等の不在申請、FALSEの場合は残業や休日出勤等の出勤申請、NULLの場合は勤務状況に関係のない申請');
    });

    await knex.schema.raw('ALTER TABLE applyType MODIFY name VARCHAR(15) CHARACTER SET ascii;');

    await knex.schema.createTable('applyOptionType', function (table) {
      table.increments('id');
      table.integer('type').unsigned().notNullable().index();
      table.string('name', 15).index();
      table.boolean('isSystemType').notNullable().defaultTo(false);
      table.string('description').notNullable();

      table.foreign('type').references('id').inTable('applyType');
    });

    await knex.schema.raw('ALTER TABLE applyOptionType MODIFY name VARCHAR(15) CHARACTER SET ascii;');

    await knex.schema.createTable('applyOptionValue', function (table) {
      table.increments('id');
      table.integer('optionType').unsigned().notNullable().index();
      table.string('name', 15).notNullable().index();
      table.boolean('isSystemType').notNullable().defaultTo(false);
      table.string('description').notNullable();

      table.foreign('optionType').references('id').inTable('applyOptionType');
    });

    await knex.schema.raw('ALTER TABLE applyOptionValue MODIFY name VARCHAR(15) CHARACTER SET ascii;');

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
      table.integer('breakPeriodMinutes').nullable().unsigned().comment('残業時か休日出勤時の休憩時間');
      table.integer('workPattern').unsigned().comment('休日出勤時の勤務体系');
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
      table.foreign('workPattern').references('id').inTable('workPattern');
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
      table.integer('user').unsigned().notNullable();
      table.date('date').notNullable().comment('申請対象の基準日(労働日)');
      table.integer('apply').unsigned().nullable().comment('スケジュールの元となる申請');
      //table.boolean('isWorking').notNullable().defaultTo(false).comment('この予定が勤務時間扱いかそうでないか');
      //table.decimal('dayAmount', 4, 1).notNullable().defaultTo(1.0).comment('終日予定の場合は1.0、半日予定の場合は0.5');
      //table.boolean('isPaid').defaultTo(false).notNullable().comment('有給かどうか');
      //table.integer('breakPeriodMinutes').nullable().comment('休憩時間');

      table.foreign('user').references('id').inTable('user');
      table.foreign('apply').references('id').inTable('apply');
    });

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
      { name: 'stepout', description: '外出' },
      { name: 'reenter', description: '再入' },
    ]);

    await knex.schema.createTable('record', function (table) {
      table.increments('id');
      table.integer('user').unsigned().index().notNullable();
      table.date('date').notNullable().index().comment('打刻基準日(労働日)');

      table.datetime('clockin').comment('出勤打刻時刻');
      table.integer('clockinDevice').unsigned().comment('出勤打刻機器');
      table.integer('clockinApply').unsigned().comment('出勤打刻申請');

      table.datetime('stepout').comment('外出打刻時刻');
      table.integer('stepoutDevice').unsigned().comment('外出打刻機器');
      table.integer('stepoutApply').unsigned().comment('外出打刻申請');

      table.datetime('reenter').comment('再入打刻時刻');
      table.integer('reenterDevice').unsigned().comment('再入打刻機器');
      table.integer('reenterApply').unsigned().comment('再入打刻申請');

      table.datetime('clockout').comment('退勤打刻時刻');
      table.integer('clockoutDevice').unsigned().comment('退勤打刻機器');
      table.integer('clockoutApply').unsigned().comment('退勤打刻申請');

      table.unique(['user', 'date']);
      table.foreign('user').references('id').inTable('user');
    });

    ///////////////////////////////////////////////////////////////////////
    // その他
    ///////////////////////////////////////////////////////////////////////

    // システム全体の共通設定項目
    await knex.schema.createTable('systemConfig', function (table) {
      table.string('key').notNullable().unique().primary().comment('設定データID');
      table.string('value').comment('設定データ値');
      table.string('title').comment('設定データ名称');
      table.string('description').comment('設定データ説明');
      table.boolean('isMultiLine').notNullable().defaultTo(false).comment('設定データ値が複数行になる可能性が有るか');
      table.boolean('isPassword').notNullable().defaultTo(false).comment('設定データ値はパスワードか');
      table.boolean('isNumeric').notNullable().defaultTo(false).comment('設定データ値は数値か');
    });

    // ユーザー別設定項目
    await knex.schema.createTable('userConfig', function (table) {
      table.string('key').notNullable().unique().primary().comment('設定データID');
      table.integer('user').unsigned().index().notNullable();
      table.string('value').comment('設定データ値');
      table.string('title').comment('設定データ名称');
      table.string('description').comment('設定データ説明');

      table.foreign('user').references('id').inTable('user').onUpdate('CASCADE').onDelete('CASCADE');
    });

    await knex.schema.createTable('mailQueue', function (table) {
      table.increments('id');
      table.string('to').notNullable();
      table.string('from', 63);
      table.string('cc');
      table.string('bcc');
      table.string('subject', 63);
      table.string('body', 1023);
      table.datetime('timestamp');
      table.string('replyTo');
    });

    await knex.schema.createTable('auditLog', function (table) {
      table.increments('id');
      table.datetime('timestamp').notNullable();
      table.string('account');
      table.string('method').notNullable();
      table.string('path');
      table.string('params');
      table.string('query');
      table.string('body', 1023);
    });
  }
  catch (error) {
    await down(knex);
    throw error;
  }
}
exports.up = up;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function down(knex) {
  await knex.schema.dropTableIfExists('auditLog');
  await knex.schema.dropTableIfExists('mailQueue');
  await knex.schema.dropTableIfExists('userConfig');
  await knex.schema.dropTableIfExists('systemConfig');
  await knex.schema.dropTableIfExists('config');
  await knex.schema.dropTableIfExists('record');
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
  await knex.schema.dropTableIfExists('annualLeave');
  await knex.schema.dropTableIfExists('user');
  await knex.schema.dropTableIfExists('wagePattern');
  await knex.schema.dropTableIfExists('workPattern');
  await knex.schema.dropTableIfExists('privilege');
  await knex.schema.dropTableIfExists('section');
  await knex.schema.dropTableIfExists('department');
  await knex.schema.dropTableIfExists('holiday');
}
exports.down = down;