
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function up(knex) {
  try {

    // 休日
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

    /** @type {{ id: number }} */
    const typeRecord = await knex.select('id').as('type').from('applyType').where('name', 'record').first();
    /** @type {{ id: number }} */
    const typeLeave = await knex.select('id').as('type').from('applyType').where('name', 'leave').first();
    await knex('applyOptionType').insert([
      { name: 'situation', isSystemType: true, type: typeRecord.id, description: '種類' },
      { name: 'recordType', isSystemType: true, type: typeRecord.id, description: '時刻' },
      { name: 'leaveType', isSystemType: true, type: typeLeave.id, description: '種類' },
    ]);

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

    // システム全体の共通設定項目
    await knex('systemConfig').insert([
      { key: 'privateKey', value: '', title: '認証秘密鍵', description: 'QRコード認証に必要となる秘密鍵(失われると全ての発行済QRコードが使用できなくなるので絶対に修正したり削除しないこと!!!)', isMultiLine: true },
      { key: 'publicKey', value: '', title: '認証公開鍵', description: 'QRコード認証に必要となる公開鍵(失われると全ての発行済QRコードが使用できなくなるので絶対に修正したり削除しないこと!!!)', isMultiLine: true },

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

      { key: 'defaultRoundMinutes', value: '15', title: 'デフォルトの打刻時刻の丸め値(分)', description: '打刻集計時に丸め指定をする際のデフォルトの丸め値(分)', isNumeric: true },
    ]);

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
  //await knex('systemConfig').del();
  //await knex('applyType').del();
  //await knex('applyOptionType').del();
  //await knex('applyOptionValue').del();
  //await knex('holiday').del();
};
exports.down = down;