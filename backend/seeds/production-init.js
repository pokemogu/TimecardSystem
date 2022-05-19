const Knex = require('knex').Knex;
const crypto = require('crypto');

/** @param {string} password */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

/** @param { Knex } knex  */
async function seed(knex) {

  //await knex("user").del();
  //await knex("privilege").del();
  //await knex('section').del();
  //await knex('department').del();
  //await knex('systemConfig').update({ value: '' });

  // 部署情報
  await knex('department').insert([
    { name: '名古屋事業所' },
    { name: '浜松工場' },
    { name: '東名工場' },
    { name: '[所属なし]' }
  ]).onConflict('name').merge();

  /** @type {number} */
  const departmentNagoya = (await knex.first('id').from('department').where('name', '名古屋事業所')).id;
  /** @type {number} */
  const departmentHamamatsu = (await knex.first('id').from('department').where('name', '浜松工場')).id;
  /** @type {number} */
  const departmentTomei = (await knex.first('id').from('department').where('name', '東名工場')).id;
  /** @type {number} */
  const departmentNone = (await knex.first('id').from('department').where('name', '[所属なし]')).id;
  await knex('section').insert([
    { department: departmentNagoya, name: '第一営業部' },
    { department: departmentNagoya, name: '第二営業部' },
    { department: departmentNagoya, name: '第三営業部' },
    { department: departmentNagoya, name: '経理・総務部' },
    { department: departmentHamamatsu, name: '営業部' },
    { department: departmentHamamatsu, name: '製造部' },
    { department: departmentHamamatsu, name: '品質保証部' },
    { department: departmentHamamatsu, name: '技術部' },
    { department: departmentHamamatsu, name: '総務部' },
    { department: departmentTomei, name: '製造部' },
    { department: departmentTomei, name: '品質保証部' },
    { department: departmentNagoya, name: '[部署なし]' },
    { department: departmentHamamatsu, name: '[部署なし]' },
    { department: departmentTomei, name: '[部署なし]' },
    { department: departmentNone, name: '[部署なし]' },
  ]).onConflict('name').merge();

  // 権限情報
  await knex('privilege').insert([
    {
      name: '__SYSTEM_DEVICE_PRIVILEGE__', isSystemPrivilege: true,
      viewRecord: true, viewAllUserInfo: true
    },
    {
      name: '部署管理者',
      recordByLogin: true, approve: true, viewRecord: true,
      viewSectionUserInfo: true
    },
    {
      name: '部門管理者',
      recordByLogin: true, approve: true, viewRecord: true,
      viewSectionUserInfo: true, viewDepartmentUserInfo: true
    },
    {
      name: '製造社員',
      recordByLogin: true, approve: true
    },
    {
      name: '事務社員',
      recordByLogin: true, approve: true
    },
    {
      name: '製造パート'
    },
    {
      name: '事務派遣',
      recordByLogin: true
    },
    {
      name: 'システム管理者',
      recordByLogin: true, configureWorkPattern: true, configurePrivilege: true, viewRecordPerDevice: true, issueQr: true,
      registerUser: true, registerDevice: true,
      viewAllUserInfo: true
    },
    {
      name: '役員',
      recordByLogin: true, approve: true, configureWorkPattern: true, configurePrivilege: true, viewRecordPerDevice: true, issueQr: true,
      registerUser: true, registerDevice: true,
      viewAllUserInfo: true
    },
  ]).onConflict('name').merge();

  /** @type {{id: number, name: string}[]} */
  const privileges = await knex.select({ id: 'id', name: 'name' }).from('privilege');

  // 申請権限
  /** @type {{id: number, name: string, isSystemType: boolean, description: string}[]} */
  const applyTypes = await knex.select({
    id: 'id', name: 'name', isSystemType: 'isSystemType', description: 'description'
  }).from('applyType');

  const typeRecord = applyTypes.find(applyType => applyType.name === 'record').id;
  const typeLeave = applyTypes.find(applyType => applyType.name === 'leave').id;
  const typeAMHalfdayLeave = applyTypes.find(applyType => applyType.name === 'am-leave').id;
  const typePMHalfdayLeave = applyTypes.find(applyType => applyType.name === 'pm-leave').id;
  const typeMourningLeave = applyTypes.find(applyType => applyType.name === 'mourning-leave').id;
  const typeMeasureLeave = applyTypes.find(applyType => applyType.name === 'measure-leave').id;
  const typeOvertime = applyTypes.find(applyType => applyType.name === 'overtime').id;

  const privilegeIdProductionProper = privileges.find(privilege => privilege.name === '製造社員').id
  const privilegeIdOfficeProper = privileges.find(privilege => privilege.name === '事務社員').id
  const privilegeIdSectionManager = privileges.find(privilege => privilege.name === '部署管理者').id
  const privilegeIdDepartmentManager = privileges.find(privilege => privilege.name === '部門管理者').id
  const privilegeIdSystemAdmin = privileges.find(privilege => privilege.name === 'システム管理者').id
  const privilegeIdBoardMember = privileges.find(privilege => privilege.name === '役員').id

  await knex('applyPrivilege').insert([
    { type: typeRecord, privilege: privilegeIdProductionProper, permitted: true },
    { type: typeLeave, privilege: privilegeIdProductionProper, permitted: true },
    { type: typeAMHalfdayLeave, privilege: privilegeIdProductionProper, permitted: true },
    { type: typePMHalfdayLeave, privilege: privilegeIdProductionProper, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdProductionProper, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdProductionProper, permitted: true },
    { type: typeOvertime, privilege: privilegeIdProductionProper, permitted: true },

    { type: typeRecord, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typeLeave, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typeAMHalfdayLeave, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typePMHalfdayLeave, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typeOvertime, privilege: privilegeIdOfficeProper, permitted: true },

    { type: typeRecord, privilege: privilegeIdSectionManager, permitted: true },
    { type: typeLeave, privilege: privilegeIdSectionManager, permitted: true },
    { type: typeAMHalfdayLeave, privilege: privilegeIdSectionManager, permitted: true },
    { type: typePMHalfdayLeave, privilege: privilegeIdSectionManager, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdSectionManager, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdSectionManager, permitted: true },
    { type: typeOvertime, privilege: privilegeIdSectionManager, permitted: true },

    { type: typeRecord, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typeLeave, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typeAMHalfdayLeave, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typePMHalfdayLeave, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typeOvertime, privilege: privilegeIdDepartmentManager, permitted: true },

    { type: typeRecord, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typeLeave, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typeAMHalfdayLeave, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typePMHalfdayLeave, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typeOvertime, privilege: privilegeIdSystemAdmin, permitted: true },

    { type: typeRecord, privilege: privilegeIdBoardMember, permitted: true },
    { type: typeLeave, privilege: privilegeIdBoardMember, permitted: true },
    { type: typeAMHalfdayLeave, privilege: privilegeIdBoardMember, permitted: true },
    { type: typePMHalfdayLeave, privilege: privilegeIdBoardMember, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdBoardMember, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdBoardMember, permitted: true },
    { type: typeOvertime, privilege: privilegeIdBoardMember, permitted: true },
  ]);

  /** @type {{department: number, section: number, departmentName: string, sectionName: string}[]} */
  const sections = await knex
    .select({ department: 'department.id', section: 'section.id', departmentName: 'department.name', sectionName: 'section.name' })
    .from('section')
    .join('department', { 'department.id': 'section.department' });

  const sectionNone = sections.find(section => section.departmentName === '[所属なし]' && section.sectionName === '[部署なし]')?.section;

  // 勤務形態関連
  await knex('workPattern').insert([
    { name: '浜松工場社員(日勤)', onTimeStart: '8:30', onTimeEnd: '17:30' },
    { name: '浜松工場社員(準夜勤)', onTimeStart: '16:30', onTimeEnd: '25:30' },
    { name: '浜松工場社員(夜勤)', onTimeStart: '0:30', onTimeEnd: '9:30' },
    { name: '東名工場社員(日勤)', onTimeStart: '8:45', onTimeEnd: '17:45' },
    { name: '東名工場社員(準夜勤)', onTimeStart: '16:45', onTimeEnd: '25:45' },
    { name: '東名工場社員(夜勤)', onTimeStart: '0:45', onTimeEnd: '9:45' },
    { name: '名古屋事業所社員', onTimeStart: '9:00', onTimeEnd: '18:00' }
  ]).onConflict('name').merge();

  /** @type {number} */
  const workNagoyaId = (await knex.first('id').from('workPattern').where('name', '名古屋事業所社員')).id;

  // ユーザー情報
  const privilegeIdAdmin = privileges.find(privilege => privilege.name === 'システム管理者')?.id
  if (privilegeIdAdmin) {
    await knex('user').insert({
      available: true,
      account: 'ADM99999',
      registeredAt: new Date(),
      name: '初期特権ユーザー',
      password: hashPassword('P@ssw0rd'),
      phonetic: 'しょきとっけんゆーざー',
      privilege: privilegeIdAdmin,
      section: sectionNone,
      defaultWorkPattern: workNagoyaId
    }).onConflict('account').merge();
  }

  // 端末情報
  const privilegeIdDevice = privileges.find(privilege => privilege.name === '__SYSTEM_DEVICE_PRIVILEGE__')?.id
  if (privilegeIdDevice) {
    await knex('user').insert([
      { available: true, registeredAt: new Date(), account: 'DKK00001', name: "打刻端末1", privilege: privilegeIdDevice, isDevice: true },
      { available: true, registeredAt: new Date(), account: 'DKK00002', name: "打刻端末2", privilege: privilegeIdDevice, isDevice: true },
      { available: true, registeredAt: new Date(), account: 'DKK00003', name: "打刻端末3", privilege: privilegeIdDevice, isDevice: true },
      { available: true, registeredAt: new Date(), account: 'DKK00004', name: "打刻端末4", privilege: privilegeIdDevice, isDevice: true },
      { available: true, registeredAt: new Date(), account: 'DKK00005', name: "打刻端末5", privilege: privilegeIdDevice, isDevice: true },
      { available: true, registeredAt: new Date(), account: 'DKK00006', name: "打刻端末6", privilege: privilegeIdDevice, isDevice: true },
      { available: true, registeredAt: new Date(), account: 'DKK00007', name: "打刻端末7", privilege: privilegeIdDevice, isDevice: true },
      { available: true, registeredAt: new Date(), account: 'DKK00008', name: "打刻端末8", privilege: privilegeIdDevice, isDevice: true },
    ]).onConflict('account').merge();
  }

  // その他情報
  await knex('systemConfig').update({ value: '申請の承認依頼メール' }).where('key', 'mailSubjectApply');
  await knex('systemConfig').update({ value: '以下の申請について承認お願い致します。' }).where('key', 'mailTemplateApply');
  await knex('systemConfig').update({ value: '申請の否認通知メール' }).where('key', 'mailSubjectReject');
  await knex('systemConfig').update({ value: '以下の申請について否認されましたのでご確認お願い致します。' }).where('key', 'mailTemplateReject');
  await knex('systemConfig').update({ value: '申請の承認通知メール' }).where('key', 'mailSubjectApproved');
  await knex('systemConfig').update({ value: '以下の申請について承認されましたのでご確認お願い致します。' }).where('key', 'mailTemplateApproved');
  await knex('systemConfig').update({ value: '未打刻通知メール' }).where('key', 'mailSubjectRecord');
  await knex('systemConfig').update({ value: '本日の打刻が完了していませんので至急打刻をお願い致します。' }).where('key', 'mailTemplateRecord');
  await knex('systemConfig').update({ value: '有給未取得メール' }).where('key', 'mailSubjectLeave');
  await knex('systemConfig').update({ value: '未取得の有給がありますので取得をお願い致します。' }).where('key', 'mailTemplateLeave');
};
exports.seed = seed;