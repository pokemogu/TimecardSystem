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

    await knex('applyType').insert([
      { name: 'record', isSystemType: true, description: '打刻' },
      { name: 'leave', isSystemType: true, description: '有休', isLeaveOrWorkSchedule: true },
      { name: 'am-leave', isSystemType: true, description: '午前半休', isLeaveOrWorkSchedule: true },
      { name: 'pm-leave', isSystemType: true, description: '午後半休', isLeaveOrWorkSchedule: true },
      { name: 'makeup-leave', isSystemType: true, description: '代休', isLeaveOrWorkSchedule: true },
      { name: 'mourning-leave', isSystemType: true, description: '慶弔休', isLeaveOrWorkSchedule: true },
      { name: 'measure-leave', isSystemType: true, description: '措置休', isLeaveOrWorkSchedule: true },
      { name: 'overtime', isSystemType: true, description: '残業', isLeaveOrWorkSchedule: false },
      { name: 'lateness', isSystemType: true, description: '遅刻', isLeaveOrWorkSchedule: true },
      { name: 'leave-early', isSystemType: true, description: '早退', isLeaveOrWorkSchedule: true },
      { name: 'stepout', isSystemType: true, description: '外出', isLeaveOrWorkSchedule: true },
      { name: 'holiday-work', isSystemType: true, description: '休日出勤', isLeaveOrWorkSchedule: false },
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

    /** @type {{ id: number }} */
    const typeRecord = await knex.select('id').as('type').from('applyType').where('name', 'record').first();
    /** @type {{ id: number }} */
    const typeLeave = await knex.select('id').as('type').from('applyType').where('name', 'leave').first();
    await knex('applyOptionType').insert([
      { name: 'situation', isSystemType: true, type: typeRecord.id, description: '種類' },
      { name: 'recordType', isSystemType: true, type: typeRecord.id, description: '時刻' },
      { name: 'leaveType', isSystemType: true, type: typeLeave.id, description: '種類' },
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

    /** @type {{ id: number }} */
    const optionTypeRecordSituation = await knex.select('id').as('optionType').from('applyOptionType')
      .where('type', typeRecord.id)
      .andWhere('name', 'situation')
      .first();
    /** @type {{ id: number }} */
    const optionTypeRecordType = await knex.select('id').as('optionType').from('applyOptionType')
      .where('type', typeRecord.id)
      .andWhere('name', 'recordType')
      .first();
    /** @type {{ id: number }} */
    const optionTypeLeaveType = await knex.select('id').as('optionType').from('applyOptionType')
      .where('type', typeLeave.id)
      .andWhere('name', 'leaveType')
      .first();
    await knex('applyOptionValue').insert([
      { optionType: optionTypeRecordSituation.id, name: 'notyet', isSystemType: true, description: '未打刻' },
      { optionType: optionTypeRecordSituation.id, name: 'athome', isSystemType: true, description: '在宅' },
      { optionType: optionTypeRecordSituation.id, name: 'trip', isSystemType: true, description: '出張' },
      { optionType: optionTypeRecordSituation.id, name: 'stepout', isSystemType: true, description: '外出' },
      { optionType: optionTypeRecordType.id, name: 'clockin', isSystemType: true, description: '出勤' },
      { optionType: optionTypeRecordType.id, name: 'clockout', isSystemType: true, description: '退勤' },
      { optionType: optionTypeRecordType.id, name: 'stepout', isSystemType: true, description: '外出' },
      { optionType: optionTypeRecordType.id, name: 'reenter', isSystemType: true, description: '再入' },
      { optionType: optionTypeLeaveType.id, name: 'normal', isSystemType: true, description: '有給' },
      { optionType: optionTypeLeaveType.id, name: 'am-halfday', isSystemType: true, description: '午前半休' },
      { optionType: optionTypeLeaveType.id, name: 'pm-halfday', isSystemType: true, description: '午後半休' },
      //{ optionType: optionTypeLeaveType.id, name: 'makeup', isSystemType: true, description: '代休' },
      { optionType: optionTypeLeaveType.id, name: 'mourning', isSystemType: true, description: '慶弔休' },
      { optionType: optionTypeLeaveType.id, name: 'measure', isSystemType: true, description: '措置休暇' },
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

    await knex('systemConfig').insert([
      { key: 'smtpHost', value: '', title: 'SMTPホスト名', description: 'メール送信に使用する(SMTP)サーバーのホスト名かIPアドレス' },
      { key: 'smtpPort', value: '', title: 'SMTPポート番号', description: 'メール送信に使用する(SMTP)サーバーのポート番号', isNumeric: true },
      { key: 'smtpUsername', value: '', title: 'SMTPログインID', description: 'メール送信(SMTP)サーバーログインユーザー名' },
      { key: 'smtpPassword', value: '', title: 'SMTPパスワード', description: 'メール送信(SMTP)サーバーログインパスワード', isPassword: true },
      { key: 'fromEmailAddress', value: '', title: 'SMTP送信元メールアドレス', description: 'メール送信(SMTP)時の送信元メールアドレス設定' },
      { key: 'mailSubjectApply', value: '', title: '申請メール件名', description: '申請時に承認者に送信されるメール件名' },
      { key: 'mailTemplateApply', value: '', title: '申請メール文', description: '申請時に承認者に送信されるメール文', isMultiLine: true },
      { key: 'mailSubjectReject', value: '', title: '否認メール件名', description: '申請否認時に起票者に送信されるメール件名' },
      { key: 'mailTemplateReject', value: '', title: '否認メール文', description: '申請否認時に起票者に送信されるメール文', isMultiLine: true },
      { key: 'mailSubjectApproved', value: '', title: '承認メール件名', description: '申請承認時に起票者に送信されるメール件名' },
      { key: 'mailTemplateApproved', value: '', title: '承認メール文', description: '申請承認時に起票者に送信されるメール文', isMultiLine: true },
      { key: 'mailSubjectRecord', value: '', title: '未打刻メール件名', description: '未打刻者に一斉送信されるメール件名' },
      { key: 'mailTemplateRecord', value: '', title: '未打刻メール文', description: '未打刻者に一斉送信されるメール文', isMultiLine: true },
      { key: 'mailSubjectLeave', value: '', title: '有給未取得メール件名', description: '有給未取得者に一斉送信されるメール件名' },
      { key: 'mailTemplateLeave', value: '', title: '有給未取得メール文', description: '有給未取得者に一斉送信されるメール文', isMultiLine: true },
    ]);

    await knex('systemConfig').insert([
      { key: 'privateKey', value: '', title: '認証秘密鍵', description: 'QRコード認証に必要となる秘密鍵(失われると全ての発行済QRコードが使用できなくなるので絶対に修正したり削除しないこと!!!)', isMultiLine: true },
      { key: 'publicKey', value: '', title: '認証公開鍵', description: 'QRコード認証に必要となる公開鍵(失われると全ての発行済QRコードが使用できなくなるので絶対に修正したり削除しないこと!!!)', isMultiLine: true }
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