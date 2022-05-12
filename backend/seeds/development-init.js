const Knex = require('knex').Knex;
const crypto = require('crypto');
const uuidAPIKey = require('uuid-apikey');
const fakeNames = require('../fakeNames').fakeNames;

/** @param {string} password */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateRandom(min = 0, max = 100) {

  // find diff
  let difference = max - min;

  // generate random number 
  let rand = Math.random();

  // multiply with difference 
  rand = Math.floor(rand * difference);

  // add with min value 
  rand = rand + min;

  return rand;
}

/** @type {number[]} */
const lookupTable = [];
for (let i = 1e6; i--;) {
  lookupTable.push(Math.random() * 101 | 0);
}

let randomTableIndex = 0;
function randomTableLookup() {
  return ++randomTableIndex >= lookupTable.length ? lookupTable[randomTableIndex = 0] : lookupTable[randomTableIndex];
}

/** @param { Date } date  */
function dateToLocalString(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`;
}

/** @param { Knex } knex  */
async function seed(knex) {

  /**
   * @param { string } account
   * @returns { Promise<number> }
   */
  const getUserIdFromAccount = async (account) => {
    return (await knex.select({ id: 'id' }).from('user').where('account', account).first()).id;
  };

  await knex('record').truncate();
  await knex("applyPrivilege").del();
  await knex('applyType').del().where('isSystemType', false);
  await knex('applyOption').del();
  await knex('apply').del();
  await knex("token").del();
  await knex("user").del();
  await knex('wagePattern').del();
  await knex('workPattern').del();
  await knex("privilege").del();
  await knex('section').del();
  await knex('department').del();
  await knex('systemConfig').update({ value: '' });

  // 部署情報
  await knex('department').insert([
    { name: '名古屋事業所' },
    { name: '浜松工場' },
    { name: '東名工場' },
    { name: '[所属なし]' }
  ]);

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
  ]);

  // 申請
  await knex('applyType').insert([ // その他カスタム申請
    { name: 'special-leave', isSystemType: false, description: '特別休暇' },
    { name: 'temporary-leave', isSystemType: false, description: '一時帰休' },
    { name: 'other-leave', isSystemType: false, description: 'その他休暇' }
  ]);

  /** @type {{id: number, name: string, isSystemType: boolean, description: string}[]} */
  const applyTypes = await knex.select({
    id: 'id', name: 'name', isSystemType: 'isSystemType', description: 'description'
  }).from('applyType');

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
  ]);

  /** @type {{id: number, name: string}[]} */
  const privileges = await knex.select({ id: 'id', name: 'name' }).from('privilege');

  // 端末情報
  const devicesData = [
    { account: 'DKK00001', name: '打刻端末1' },
    { account: 'DKK00002', name: '打刻端末2' },
    { account: 'DKK00003', name: '打刻端末3' },
    { account: 'DKK00004', name: '打刻端末4' },
    { account: 'DKK00005', name: '打刻端末5' },
    { account: 'DKK00006', name: '打刻端末6' },
    { account: 'DKK00007', name: '打刻端末7' },
    { account: 'DKK00008', name: '打刻端末8' }
  ];

  const privilegeIdDevice = privileges.find(privilege => privilege.name === '__SYSTEM_DEVICE_PRIVILEGE__').id
  const dateNow = new Date();

  await knex('user').insert(devicesData.map(deviceData => {
    return {
      available: true, registeredAt: dateNow,
      account: deviceData.account, name: deviceData.name,
      privilege: privilegeIdDevice, isDevice: true
    }
  }));

  const secondsPerDay = 60 * 60 * 24;
  const dateExpiration = new Date(dateNow);
  dateExpiration.setSeconds(dateExpiration.getSeconds() + (secondsPerDay * 3650));

  await knex('token').insert(
    await Promise.all(
      devicesData.map(async (deviceData) => {
        return {
          user: await getUserIdFromAccount(deviceData.account),
          refreshToken: uuidAPIKey.create({ noDashes: true }).apiKey,
          isQrToken: true,
          refreshTokenExpiration: dateExpiration
        }
      })
    )
  );

  // 申請権限
  const typeRecord = applyTypes.find(applyType => applyType.name === 'record').id;
  const typeLeave = applyTypes.find(applyType => applyType.name === 'leave').id;
  const typeHalfdayLeave = applyTypes.find(applyType => applyType.name === 'halfday-leave').id;
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
    { type: typeHalfdayLeave, privilege: privilegeIdProductionProper, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdProductionProper, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdProductionProper, permitted: true },
    { type: typeOvertime, privilege: privilegeIdProductionProper, permitted: true },

    { type: typeRecord, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typeLeave, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typeHalfdayLeave, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdOfficeProper, permitted: true },
    { type: typeOvertime, privilege: privilegeIdOfficeProper, permitted: true },

    { type: typeRecord, privilege: privilegeIdSectionManager, permitted: true },
    { type: typeLeave, privilege: privilegeIdSectionManager, permitted: true },
    { type: typeHalfdayLeave, privilege: privilegeIdSectionManager, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdSectionManager, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdSectionManager, permitted: true },
    { type: typeOvertime, privilege: privilegeIdSectionManager, permitted: true },

    { type: typeRecord, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typeLeave, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typeHalfdayLeave, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdDepartmentManager, permitted: true },
    { type: typeOvertime, privilege: privilegeIdDepartmentManager, permitted: true },

    { type: typeRecord, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typeLeave, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typeHalfdayLeave, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdSystemAdmin, permitted: true },
    { type: typeOvertime, privilege: privilegeIdSystemAdmin, permitted: true },

    { type: typeRecord, privilege: privilegeIdBoardMember, permitted: true },
    { type: typeLeave, privilege: privilegeIdBoardMember, permitted: true },
    { type: typeHalfdayLeave, privilege: privilegeIdBoardMember, permitted: true },
    { type: typeMourningLeave, privilege: privilegeIdBoardMember, permitted: true },
    { type: typeMeasureLeave, privilege: privilegeIdBoardMember, permitted: true },
    { type: typeOvertime, privilege: privilegeIdBoardMember, permitted: true },
  ]);

  // 勤務形態関連
  await knex('workPattern').insert([
    { name: '浜松工場社員(日勤)', onTimeStart: '8:30', onTimeEnd: '17:30' },
    { name: '浜松工場社員(準夜勤)', onTimeStart: '16:30', onTimeEnd: '25:30' },
    { name: '浜松工場社員(夜勤)', onTimeStart: '0:30', onTimeEnd: '9:30' },
    { name: '東名工場社員(日勤)', onTimeStart: '8:45', onTimeEnd: '17:45' },
    { name: '東名工場社員(準夜勤)', onTimeStart: '16:45', onTimeEnd: '25:45' },
    { name: '東名工場社員(夜勤)', onTimeStart: '0:45', onTimeEnd: '9:45' },
    { name: '名古屋事業所社員', onTimeStart: '9:00', onTimeEnd: '18:00' }
  ]);

  /** @type {number} */
  const workHamamatsuDayId = (await knex.first('id').from('workPattern').where('name', '浜松工場社員(日勤)')).id;
  /** @type {number} */
  const workHamamatsuDawnId = (await knex.first('id').from('workPattern').where('name', '浜松工場社員(準夜勤)')).id;
  /** @type {number} */
  const workHamamatsuNightId = (await knex.first('id').from('workPattern').where('name', '浜松工場社員(夜勤)')).id;
  /** @type {number} */
  const workTomeiDayId = (await knex.first('id').from('workPattern').where('name', '東名工場社員(日勤)')).id;
  /** @type {number} */
  const workTomeiDawnId = (await knex.first('id').from('workPattern').where('name', '東名工場社員(準夜勤)')).id;
  /** @type {number} */
  const workTomeiNightId = (await knex.first('id').from('workPattern').where('name', '東名工場社員(夜勤)')).id;
  /** @type {number} */
  const workNagoyaId = (await knex.first('id').from('workPattern').where('name', '名古屋事業所社員')).id;

  await knex('wagePattern').insert([
    { workPattern: workHamamatsuDayId, name: '通常勤務', timeStart: '8:30', timeEnd: '17:30', normalWagePercentage: 100, holidayWagePercentage: 115 },
    { workPattern: workHamamatsuDayId, name: '割増残業', timeStart: '17:30', timeEnd: '22:00', normalWagePercentage: 125, holidayWagePercentage: 125 },
    { workPattern: workHamamatsuDayId, name: '深夜残業', timeStart: '22:00', timeEnd: '27:00', normalWagePercentage: 150, holidayWagePercentage: 150 },

    { workPattern: workHamamatsuDawnId, name: '通常勤務', timeStart: '16:30', timeEnd: '22:00', normalWagePercentage: 100, holidayWagePercentage: 115 },
    { workPattern: workHamamatsuDawnId, name: '深夜割増', timeStart: '22:00', timeEnd: '25:30', normalWagePercentage: 125, holidayWagePercentage: 125 },
    { workPattern: workHamamatsuDawnId, name: '深夜残業', timeStart: '25:30', timeEnd: '27:00', normalWagePercentage: 150, holidayWagePercentage: 150 },

    { workPattern: workHamamatsuNightId, name: '深夜割増', timeStart: '24:30', timeEnd: '27:00', normalWagePercentage: 125, holidayWagePercentage: 125 },
    { workPattern: workHamamatsuNightId, name: '通常勤務', timeStart: '27:00', timeEnd: '33:30', normalWagePercentage: 100, holidayWagePercentage: 115 },
    { workPattern: workHamamatsuNightId, name: '割増残業', timeStart: '33:30', timeEnd: '38:00', normalWagePercentage: 125, holidayWagePercentage: 125 },

    { workPattern: workTomeiDayId, name: '通常勤務', timeStart: '8:45', timeEnd: '17:45', normalWagePercentage: 100, holidayWagePercentage: 115 },
    { workPattern: workTomeiDayId, name: '割増残業', timeStart: '17:45', timeEnd: '22:00', normalWagePercentage: 125, holidayWagePercentage: 125 },
    { workPattern: workTomeiDayId, name: '深夜残業', timeStart: '22:00', timeEnd: '27:00', normalWagePercentage: 150, holidayWagePercentage: 150 },

    { workPattern: workTomeiDawnId, name: '通常勤務', timeStart: '16:45', timeEnd: '22:00', normalWagePercentage: 100, holidayWagePercentage: 115 },
    { workPattern: workTomeiDawnId, name: '深夜割増', timeStart: '22:00', timeEnd: '25:45', normalWagePercentage: 125, holidayWagePercentage: 125 },
    { workPattern: workTomeiDawnId, name: '深夜残業', timeStart: '25:45', timeEnd: '27:00', normalWagePercentage: 150, holidayWagePercentage: 150 },

    { workPattern: workTomeiNightId, name: '深夜割増', timeStart: '24:45', timeEnd: '27:00', normalWagePercentage: 125, holidayWagePercentage: 125 },
    { workPattern: workTomeiNightId, name: '通常勤務', timeStart: '27:00', timeEnd: '33:45', normalWagePercentage: 100, holidayWagePercentage: 115 },
    { workPattern: workTomeiNightId, name: '割増残業', timeStart: '33:45', timeEnd: '38:15', normalWagePercentage: 125, holidayWagePercentage: 125 },

    { workPattern: workNagoyaId, name: '通常勤務', timeStart: '9:00', timeEnd: '18:00', normalWagePercentage: 100, holidayWagePercentage: 115 },
    { workPattern: workNagoyaId, name: '割増残業', timeStart: '18:00', timeEnd: '22:00', normalWagePercentage: 125, holidayWagePercentage: 125 },
    { workPattern: workNagoyaId, name: '深夜残業', timeStart: '22:00', timeEnd: '27:00', normalWagePercentage: 150, holidayWagePercentage: 150 },
  ]);

  // ユーザー情報

  /** @type {{department: number, section: number, departmentName: string, sectionName: string}[]} */
  const sections = await knex
    .select({ department: 'department.id', section: 'section.id', departmentName: 'department.name', sectionName: 'section.name' })
    .from('section')
    .join('department', { 'department.id': 'section.department' });

  const fakeUsers /*: models.User[] */ = [];
  for (let i = 0; i < fakeNames.length + 1; i++) {

    let section = 0;
    let privilege = 0;
    let defaultWorkPattern = -1;
    let optional1WorkPattern = -1;
    let optional2WorkPattern = -1;
    let name = i < fakeNames.length ? fakeNames[i].name : '';
    let phonetic = i < fakeNames.length ? fakeNames[i].phonetic : '';
    if (i < 30) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '製造パート').id
      defaultWorkPattern = workHamamatsuDayId;
      optional1WorkPattern = workHamamatsuDawnId;
      optional2WorkPattern = workHamamatsuNightId;
    }
    else if (i < 50) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '製造パート').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 60) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '経理・総務部').section
      privilege = privileges.find(privilege => privilege.name === '事務派遣').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 65) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第一営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務派遣').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 70) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第二営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務派遣').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 75) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第三営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務派遣').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 80) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務派遣').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 170) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '製造社員').id
      defaultWorkPattern = workHamamatsuDayId;
      optional1WorkPattern = workHamamatsuDawnId;
      optional2WorkPattern = workHamamatsuNightId;
    }
    else if (i < 230) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '製造社員').id
      defaultWorkPattern = workTomeiDayId;
      optional1WorkPattern = workTomeiDawnId;
      optional2WorkPattern = workTomeiNightId;
    }
    else if (i < 240) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第一営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 245) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第二営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 250) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第三営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 255) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '品質保証部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 260) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '品質保証部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
      defaultWorkPattern = workTomeiDayId;
    }
    else if (i < 265) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 275) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '技術部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 277) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '総務部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 280) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '経理・総務部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 281) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 282) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workTomeiDayId;
    }
    else if (i < 283) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '経理・総務部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 284) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第一営業部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 285) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第二営業部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 286) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第三営業部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 287) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '営業部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 288) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '品質保証部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 289) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '品質保証部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workTomeiDayId;
    }
    else if (i < 290) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '技術部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 291) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '総務部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 292) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '[部署なし]').section
      privilege = privileges.find(privilege => privilege.name === '部門管理者').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 293) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '[部署なし]').section
      privilege = privileges.find(privilege => privilege.name === '部門管理者').id
      defaultWorkPattern = workTomeiDayId;
    }
    else if (i < 295) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '[部署なし]').section
      privilege = privileges.find(privilege => privilege.name === '部門管理者').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 298) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '経理・総務部').section
      privilege = privileges.find(privilege => privilege.name === 'システム管理者').id
      defaultWorkPattern = workNagoyaId;
    }
    else if (i < 300) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '総務部').section
      privilege = privileges.find(privilege => privilege.name === 'システム管理者').id
      defaultWorkPattern = workHamamatsuDayId;
    }
    else if (i < 301) {
      section = sections.find(section => section.departmentName === '[所属なし]' && section.sectionName === '[部署なし]').section
      privilege = privileges.find(privilege => privilege.name === '役員').id
      defaultWorkPattern = workHamamatsuDayId;
      name = '後藤 秀幸';
      phonetic = 'ゴトウ ヒデユキ';
    }

    const randMillisec = generateRandom(0, 1000 * 60 * 60 * 24 * 365);
    const registeredDate = new Date();
    registeredDate.setTime(registeredDate.getTime() - randMillisec);

    const usrnum = i.toString().padStart(5, '0');
    fakeUsers.push({
      available: true,
      account: 'USR' + usrnum,
      registeredAt: registeredDate,
      name: name,
      password: hashPassword('P@ss' + usrnum),
      email: 'usr' + usrnum + '@sample.co.jp',
      phonetic: phonetic,
      privilege: privilege,
      section: section,
      defaultWorkPattern: defaultWorkPattern,
      optional1WorkPattern: optional1WorkPattern >= 0 ? optional1WorkPattern : undefined,
      optional2WorkPattern: optional2WorkPattern >= 0 ? optional2WorkPattern : undefined,
    });
  }

  await knex('user').insert(fakeUsers);

  // 申請ルート情報
  const routes /*: apiif.ApprovalRouteRequestData[] */ = [
    {
      name: '総務社員',
      approvalLevel1MainUserId: await getUserIdFromAccount('USR00276'),
      approvalLevel1SubUserId: await getUserIdFromAccount('USR00277'),
      approvalLevel2MainUserId: await getUserIdFromAccount('USR00290'),
      approvalLevel2SubUserId: await getUserIdFromAccount('USR00282'),
      approvalLevel3MainUserId: await getUserIdFromAccount('USR00291'),
      approvalLevel3SubUserId: await getUserIdFromAccount('USR00294'),
      approvalDecisionUserId: await getUserIdFromAccount('USR00300')
    },
    {
      name: '開発部社員',
      approvalLevel1MainUserId: await getUserIdFromAccount('USR00273'),
      approvalLevel1SubUserId: await getUserIdFromAccount('USR00274'),
      approvalLevel2MainUserId: await getUserIdFromAccount('USR00289'),
      // approvalLevel2SubUserId: await getUserIdFromAccount('????????'),
      approvalLevel3MainUserId: await getUserIdFromAccount('USR00291'),
      approvalLevel3SubUserId: await getUserIdFromAccount('USR00292'),
      approvalDecisionUserId: await getUserIdFromAccount('USR00300')
    },
    {
      name: '開発部課長',
      approvalLevel1MainUserId: await getUserIdFromAccount('USR00289'),
      //approvalLevel1SubUserId: await getUserIdFromAccount('????????'),
      approvalLevel2MainUserId: await getUserIdFromAccount('USR00291'),
      approvalLevel2SubUserId: await getUserIdFromAccount('USR00292'),
      //approvalLevel3MainUserId: await getUserIdFromAccount('????????'),
      //approvalLevel3SubUserId: await getUserIdFromAccount('????????'),
      approvalDecisionUserId: await getUserIdFromAccount('USR00300')
    },
    {
      name: '開発部長',
      approvalLevel1MainUserId: await getUserIdFromAccount('USR00291'),
      approvalLevel1SubUserId: await getUserIdFromAccount('USR00292'),
      //approvalLevel2MainUserId: await getUserIdFromAccount('????????'),
      //approvalLevel2SubUserId: await getUserIdFromAccount('????????'),
      //approvalLevel3MainUserId: await getUserIdFromAccount('????????'),
      //approvalLevel3SubUserId: await getUserIdFromAccount('????????'),
      approvalDecisionUserId: await getUserIdFromAccount('USR00300')
    },
    {
      name: '浜松製造部社員',
      approvalLevel1MainUserId: await getUserIdFromAccount('USR00226'),
      approvalLevel1SubUserId: await getUserIdFromAccount('USR00227'),
      approvalLevel2MainUserId: await getUserIdFromAccount('USR00229'),
      approvalLevel2SubUserId: await getUserIdFromAccount('USR00228'),
      approvalLevel3MainUserId: await getUserIdFromAccount('USR00291'),
      approvalLevel3SubUserId: await getUserIdFromAccount('USR00292'),
      approvalDecisionUserId: await getUserIdFromAccount('USR00300')
    },
    {
      name: '製造部課長',
      approvalLevel1MainUserId: await getUserIdFromAccount('USR00229'),
      approvalLevel1SubUserId: await getUserIdFromAccount('USR00228'),
      approvalLevel2MainUserId: await getUserIdFromAccount('USR00291'),
      approvalLevel2SubUserId: await getUserIdFromAccount('USR00292'),
      //approvalLevel3MainUserId: await getUserIdFromAccount('????????'),
      //approvalLevel3SubUserId: await getUserIdFromAccount('????????'),
      approvalDecisionUserId: await getUserIdFromAccount('USR00300')
    },
    {
      name: '製造部長',
      approvalLevel1MainUserId: await getUserIdFromAccount('USR00291'),
      approvalLevel1SubUserId: await getUserIdFromAccount('USR00292'),
      //approvalLevel2MainUserId: await getUserIdFromAccount('????????'),
      //approvalLevel2SubUserId: await getUserIdFromAccount('????????'),
      //approvalLevel3MainUserId: await getUserIdFromAccount('????????'),
      //approvalLevel3SubUserId: await getUserIdFromAccount('????????'),
      approvalDecisionUserId: await getUserIdFromAccount('USR00300')
    },
  ];

  for (const route of routes) {
    await knex('approvalRoute').insert({
      name: route.name,
      approvalLevel1MainUser: route.approvalLevel1MainUserId,
      approvalLevel1SubUser: route.approvalLevel1SubUserId,
      approvalLevel2MainUser: route.approvalLevel2MainUserId,
      approvalLevel2SubUser: route.approvalLevel2SubUserId,
      approvalLevel3MainUser: route.approvalLevel3MainUserId,
      approvalLevel3SubUser: route.approvalLevel3SubUserId,
      approvalDecisionUser: route.approvalDecisionUserId,
    });
  }

  // テスト打刻
  /** @type {Record<string, number>} */
  const recordTypeCache = {};
  /** @type {{id: number, name: string, description: string}[]} */
  const recordTypes = await knex
    .select({ id: 'id', name: 'name', description: 'description' })
    .from('recordType');

  for (const recordType of recordTypes) {
    recordTypeCache[recordType.name] = recordType.id;
  }

  // 3ヶ月前からの打刻データを生成開始
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 3);
  baseDate.setDate(1);

  // 浜松工場日勤
  /** @type {{id: number}[]} */
  const hamamatsuUsers = await knex
    .select({ id: 'id' }).from('user').where('defaultWorkPattern', workHamamatsuDayId)

  let tempDate = new Date(baseDate);

  /** @type {{user: number, date: string, clockin: Date, break: Date, reenter: Date, clockout: Date}[]} */
  const records = [];
  for (let i = 0; i < 90; i++) { // 90日間(3ヶ月)のデータを生成する
    const dayOfWeek = tempDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      for (const hamamatsuUser of hamamatsuUsers) {
        tempDate.setHours(8);
        tempDate.setMinutes(randomTableLookup() % 32);
        tempDate.setSeconds(randomTableLookup() % 59);
        const clockinDate = new Date(tempDate);

        tempDate.setHours(12);
        tempDate.setMinutes(randomTableLookup() % 15);
        tempDate.setSeconds(randomTableLookup() % 59);
        const breakDate = new Date(tempDate);

        tempDate.setHours(12);
        tempDate.setMinutes(44 + (randomTableLookup() % 15));
        tempDate.setSeconds(randomTableLookup() % 59);
        const reenterDate = new Date(tempDate);

        tempDate.setHours(17);
        tempDate.setMinutes(30 + (randomTableLookup() % 10));
        tempDate.setSeconds(randomTableLookup() % 59);
        const clockoutDate = new Date(tempDate);

        records.push({
          user: hamamatsuUser.id, date: dateToLocalString(tempDate),
          clockin: clockinDate, break: breakDate, reenter: reenterDate, clockout: clockoutDate
        });
      }
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  await knex('record').insert(records);


  // 承認テストデータ生成
  /**
   * @param {string} name
   * @returns {Promise<number|undefined>}
   * */
  const getRouteIdFromName = async (name) => {
    return (await knex.select({ id: 'id' }).from('approvalRoute').where('name', name).first())?.id;
  };

  const hamamatsuSeizouRouteId = await getRouteIdFromName('浜松製造部社員');

  // 打刻申請オプション
  /** @type {number} */
  const optionTypeRecord1 = (await knex.select({ id: 'id' }).from('applyOptionType').where('name', 'situation').first()).id;
  /** @type {number} */
  const optionTypeRecord2 = (await knex.select({ id: 'id' }).from('applyOptionType').where('name', 'recordType').first()).id;
  /** @type {number} */
  const optionType1ValueNotyet = (await knex.select({ id: 'id' }).from('applyOptionValue')
    .where('optionType', optionTypeRecord1).andWhere('name', 'notyet').first()).id;
  /** @type {number} */
  const optionType2ValueClockin = (await knex.select({ id: 'id' }).from('applyOptionValue')
    .where('optionType', optionTypeRecord2).andWhere('name', 'clockin').first()).id;

  // 休暇申請オプション
  /** @type {number} */
  const optionTypeLeave = (await knex.select({ id: 'id' }).from('applyOptionType').where('name', 'leaveType').first()).id;
  /** @type {number} */
  const optionTypeLeaveValueNormal = (await knex.select({ id: 'id' }).from('applyOptionValue')
    .where('optionType', optionTypeLeave).andWhere('name', 'normal').first()).id;
  /** @type {number} */
  const optionTypeLeaveValueHalfday = (await knex.select({ id: 'id' }).from('applyOptionValue')
    .where('optionType', optionTypeLeave).andWhere('name', 'halfday').first()).id;

  for (let i = 80; i < 90; i++) {
    const userAccount = 'USR' + i.toString().padStart(5, '0');
    const dateNow = new Date();
    const dateFrom = new Date(dateNow)
    do {
      dateFrom.setDate(dateFrom.getDate() + generateRandom(3, 14));
    } while (dateFrom.getDay() === 0 || dateFrom.getDay() === 6);

    await knex('apply').insert({
      type: typeLeave,
      user: await getUserIdFromAccount(userAccount),
      timestamp: dateNow,
      date: dateToLocalString(dateNow),
      dateTimeFrom: dateToLocalString(dateFrom),
      reason: '休暇取得のため',
      contact: '090-9999-0000',
      route: hamamatsuSeizouRouteId,
      currentApprovingMainUser: await getUserIdFromAccount('USR00226'),
      currentApprovingSubUser: await getUserIdFromAccount('USR00227')
    });

    /** @type {{[name: string]: number}} */
    let lastApplyResult = await knex.select(knex.raw('LAST_INSERT_ID()')).first();
    let lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeLeave,
      optionValue: optionTypeLeaveValueNormal
    });
  }

  for (let i = 90; i < 100; i++) {
    const userAccount = 'USR' + i.toString().padStart(5, '0');
    const dateNow = new Date();
    const dateFrom = new Date(dateNow)
    do {
      dateFrom.setDate(dateFrom.getDate() + generateRandom(3, 14));
    } while (dateFrom.getDay() === 0 || dateFrom.getDay() === 6);

    await knex('apply').insert({
      type: typeLeave,
      user: await getUserIdFromAccount(userAccount),
      timestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 1, 1000 * 60 * 60 * 2)),
      date: dateToLocalString(dateNow),
      dateTimeFrom: dateToLocalString(dateFrom),
      reason: '休暇取得のため',
      contact: '090-9999-0000',
      route: hamamatsuSeizouRouteId,
      approvedLevel1User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00226') : await getUserIdFromAccount('USR00227'),
      approvedLevel1UserTimestamp: new Date(dateNow.getTime() - generateRandom(0, 1000 * 60 * 60 * 1)),
      currentApprovingMainUser: await getUserIdFromAccount('USR00229'),
      currentApprovingSubUser: await getUserIdFromAccount('USR00228')
    });

    /** @type {{[name: string]: number}} */
    let lastApplyResult = await knex.select(knex.raw('LAST_INSERT_ID()')).first();
    let lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeLeave,
      optionValue: optionTypeLeaveValueNormal
    });
  }

  for (let i = 100; i < 110; i++) {
    const userAccount = 'USR' + i.toString().padStart(5, '0');
    const dateNow = new Date();
    const dateFrom = new Date(dateNow)
    do {
      dateFrom.setDate(dateFrom.getDate() + generateRandom(3, 14));
    } while (dateFrom.getDay() === 0 || dateFrom.getDay() === 6);

    await knex('apply').insert({
      type: typeLeave,
      user: await getUserIdFromAccount(userAccount),
      timestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 2, 1000 * 60 * 60 * 3)),
      date: dateToLocalString(dateNow),
      dateTimeFrom: dateToLocalString(dateFrom),
      reason: '休暇取得のため',
      contact: '090-9999-0000',
      route: hamamatsuSeizouRouteId,
      approvedLevel1User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00226') : await getUserIdFromAccount('USR00227'),
      approvedLevel1UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 1, 1000 * 60 * 60 * 2)),
      approvedLevel2User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00229') : await getUserIdFromAccount('USR00228'),
      approvedLevel2UserTimestamp: new Date(dateNow.getTime() - generateRandom(0, 1000 * 60 * 60 * 1)),
      currentApprovingMainUser: await getUserIdFromAccount('USR00291'),
      currentApprovingSubUser: await getUserIdFromAccount('USR00292')
    });

    /** @type {{[name: string]: number}} */
    let lastApplyResult = await knex.select(knex.raw('LAST_INSERT_ID()')).first();
    let lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeLeave,
      optionValue: optionTypeLeaveValueNormal
    });
  }

  for (let i = 100; i < 110; i++) {
    const userAccount = 'USR' + i.toString().padStart(5, '0');
    const dateNow = new Date();
    const dateFrom = new Date(dateNow)
    do {
      dateFrom.setDate(dateFrom.getDate() + generateRandom(3, 14));
    } while (dateFrom.getDay() === 0 || dateFrom.getDay() === 6);

    await knex('apply').insert({
      type: typeLeave,
      user: await getUserIdFromAccount(userAccount),
      timestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 3, 1000 * 60 * 60 * 4)),
      date: dateToLocalString(dateNow),
      dateTimeFrom: dateToLocalString(dateFrom),
      reason: '休暇取得のため',
      contact: '090-9999-0000',
      route: hamamatsuSeizouRouteId,
      approvedLevel1User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00226') : await getUserIdFromAccount('USR00227'),
      approvedLevel1UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 2, 1000 * 60 * 60 * 3)),
      approvedLevel2User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00229') : await getUserIdFromAccount('USR00228'),
      approvedLevel2UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 1, 1000 * 60 * 60 * 2)),
      approvedLevel3User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00291') : await getUserIdFromAccount('USR00292'),
      approvedLevel3UserTimestamp: new Date(dateNow.getTime() - generateRandom(0, 1000 * 60 * 60 * 1)),
      currentApprovingMainUser: await getUserIdFromAccount('USR00300'),
      currentApprovingSubUser: null
    });

    /** @type {{[name: string]: number}} */
    let lastApplyResult = await knex.select(knex.raw('LAST_INSERT_ID()')).first();
    let lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeLeave,
      optionValue: optionTypeLeaveValueNormal
    });
  }

  for (let i = 110; i < 120; i++) {
    const userAccount = 'USR' + i.toString().padStart(5, '0');
    const dateNow = new Date();
    const dateFrom = new Date(dateNow)
    do {
      dateFrom.setDate(dateFrom.getDate() + generateRandom(3, 14));
    } while (dateFrom.getDay() === 0 || dateFrom.getDay() === 6);

    await knex('apply').insert({
      type: typeLeave,
      user: await getUserIdFromAccount(userAccount),
      timestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 4, 1000 * 60 * 60 * 5)),
      date: dateToLocalString(dateNow),
      dateTimeFrom: dateToLocalString(dateFrom),
      reason: '休暇取得のため',
      contact: '090-9999-0000',
      route: hamamatsuSeizouRouteId,
      approvedLevel1User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00226') : await getUserIdFromAccount('USR00227'),
      approvedLevel1UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 3, 1000 * 60 * 60 * 4)),
      approvedLevel2User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00229') : await getUserIdFromAccount('USR00228'),
      approvedLevel2UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 2, 1000 * 60 * 60 * 3)),
      approvedLevel3User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00291') : await getUserIdFromAccount('USR00292'),
      approvedLevel3UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 1, 1000 * 60 * 60 * 2)),
      approvedDecisionUser: await getUserIdFromAccount('USR00300'),
      approvedDecisionUserTimestamp: new Date(dateNow.getTime() - generateRandom(0, 1000 * 60 * 60 * 1)),
      currentApprovingMainUser: null,
      currentApprovingSubUser: null,
      isApproved: true
    });

    /** @type {{[name: string]: number}} */
    let lastApplyResult = await knex.select(knex.raw('LAST_INSERT_ID()')).first();
    let lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeLeave,
      optionValue: optionTypeLeaveValueNormal
    });
  }

  for (let i = 0; i < 5; i++) {
    const userAccount = 'USR00120';
    const dateNow = new Date();
    const dateFrom = new Date(dateNow)
    do {
      dateFrom.setDate(dateFrom.getDate() + generateRandom(3, 14));
    } while (dateFrom.getDay() === 0 || dateFrom.getDay() === 6);

    await knex('apply').insert({
      type: typeLeave,
      user: await getUserIdFromAccount(userAccount),
      timestamp: new Date(dateNow.getTime() - generateRandom(0, 1000 * 60 * 60 * 1)),
      date: dateToLocalString(dateNow),
      dateTimeFrom: dateToLocalString(dateFrom),
      reason: '休暇取得のため',
      contact: '090-9999-0000',
      route: hamamatsuSeizouRouteId,
      currentApprovingMainUser: await getUserIdFromAccount('USR00226'),
      currentApprovingSubUser: await getUserIdFromAccount('USR00227'),
    });

    /** @type {{[name: string]: number}} */
    let lastApplyResult = await knex.select(knex.raw('LAST_INSERT_ID()')).first();
    let lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeLeave,
      optionValue: optionTypeLeaveValueNormal
    });

    await knex('apply').insert({
      type: typeLeave,
      user: await getUserIdFromAccount(userAccount),
      timestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 1, 1000 * 60 * 60 * 2)),
      date: dateToLocalString(dateNow),
      dateTimeFrom: dateToLocalString(dateFrom),
      reason: '子供のお迎えのため',
      contact: '090-9999-0000',
      route: hamamatsuSeizouRouteId,
      approvedLevel1User: await getUserIdFromAccount('USR00226'),
      approvedLevel1UserTimestamp: new Date(dateNow.getTime() - generateRandom(0, 1000 * 60 * 60 * 1)),
      isApproved: false
    });

    /** @type {{[name: string]: number}} */
    lastApplyResult = await knex.select(knex.raw('LAST_INSERT_ID()')).first();
    lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeLeave,
      optionValue: optionTypeLeaveValueHalfday
    });

    await knex('apply').insert({
      type: typeLeave,
      user: await getUserIdFromAccount(userAccount),
      timestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 5, 1000 * 60 * 60 * 6)),
      date: dateToLocalString(dateNow),
      dateTimeFrom: dateToLocalString(dateFrom),
      reason: '休暇取得のため',
      contact: '090-9999-0000',
      route: hamamatsuSeizouRouteId,
      approvedLevel1User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00226') : await getUserIdFromAccount('USR00227'),
      approvedLevel1UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 4, 1000 * 60 * 60 * 5)),
      approvedLevel2User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00229') : await getUserIdFromAccount('USR00228'),
      approvedLevel2UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 3, 1000 * 60 * 60 * 4)),
      approvedLevel3User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00291') : await getUserIdFromAccount('USR00292'),
      approvedLevel3UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 2, 1000 * 60 * 60 * 3)),
      approvedDecisionUser: await getUserIdFromAccount('USR00300'),
      approvedDecisionUserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 1, 1000 * 60 * 60 * 2)),
      currentApprovingMainUser: null,
      currentApprovingSubUser: null,
      isApproved: true
    });

    /** @type {{[name: string]: number}} */
    lastApplyResult = await knex.select(knex.raw('LAST_INSERT_ID()')).first();
    lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeLeave,
      optionValue: optionTypeLeaveValueNormal
    });

    const dateRecord = new Date(dateNow);
    dateRecord.setHours(8);
    dateRecord.setMinutes(30);
    dateRecord.setSeconds(0);

    await knex('apply').insert({
      type: typeRecord,
      user: await getUserIdFromAccount(userAccount),
      timestamp: new Date(dateNow.getTime() - generateRandom(0, 1000 * 60 * 60 * 1)),
      date: dateToLocalString(dateRecord),
      dateTimeFrom: dateRecord,
      reason: '打刻忘れのため',
      route: hamamatsuSeizouRouteId,
      currentApprovingMainUser: await getUserIdFromAccount('USR00226'),
      currentApprovingSubUser: await getUserIdFromAccount('USR00227'),
    });

    /** @type {{[name: string]: number}} */
    lastApplyResult = await knex.select(knex.raw('LAST_INSERT_ID()')).first();
    lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeRecord1,
      optionValue: optionType1ValueNotyet
    });

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeRecord2,
      optionValue: optionType2ValueClockin
    });

    await knex('apply').insert({
      type: typeRecord,
      user: await getUserIdFromAccount(userAccount),
      timestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 5, 1000 * 60 * 60 * 6)),
      date: dateToLocalString(dateRecord),
      dateTimeFrom: dateRecord,
      reason: '打刻忘れのため',
      route: hamamatsuSeizouRouteId,
      approvedLevel1User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00226') : await getUserIdFromAccount('USR00227'),
      approvedLevel1UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 4, 1000 * 60 * 60 * 5)),
      approvedLevel2User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00229') : await getUserIdFromAccount('USR00228'),
      approvedLevel2UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 3, 1000 * 60 * 60 * 4)),
      approvedLevel3User: (generateRandom() > 10) ? await getUserIdFromAccount('USR00291') : await getUserIdFromAccount('USR00292'),
      approvedLevel3UserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 2, 1000 * 60 * 60 * 3)),
      approvedDecisionUser: await getUserIdFromAccount('USR00300'),
      approvedDecisionUserTimestamp: new Date(dateNow.getTime() - generateRandom(1000 * 60 * 60 * 1, 1000 * 60 * 60 * 2)),
      currentApprovingMainUser: null,
      currentApprovingSubUser: null,
      isApproved: true
    });

    /** @type {{[name: string]: number}} */
    lastApplyResult = await knex.select(knex.raw('LAST_INSERT_ID()')).first();
    lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeRecord1,
      optionValue: optionType1ValueNotyet
    });

    await knex('applyOption').insert({
      apply: lastApplyId,
      optionType: optionTypeRecord2,
      optionValue: optionType2ValueClockin
    });
  }

  // その他情報
  await knex('systemConfig').update({ value: 'smtp.mailtrap.io' }).where('key', 'smtpHost');
  await knex('systemConfig').update({ value: '2525' }).where('key', 'smtpPort');
  await knex('systemConfig').update({ value: 'f4d144bc16e53b' }).where('key', 'smtpUsername');
  await knex('systemConfig').update({ value: '6ae992dd9335f9' }).where('key', 'smtpPassword');

  await knex('systemConfig').update({ value: 'from@example.com' }).where('key', 'fromEmailAddress');
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