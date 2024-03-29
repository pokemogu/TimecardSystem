import { Knex } from 'knex';
import { hashPassword } from '../src/auth';
import { fakeNames } from '../../fakeNames';
import * as models from '../../shared/models';
import * as apiif from '../../shared/APIInterfaces';

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

export async function seed(knex: Knex): Promise<void> {

  await knex('record').del();
  await knex('applyOption').del();
  await knex('apply').del();
  await knex('roleLevel').del();
  await knex('approvalRouteMember').del();
  await knex('role').del();
  await knex('approvalRoute').del();
  await knex('device').del();
  await knex("user").del();
  await knex('wagePattern').del();
  await knex('workPattern').del();
  await knex("privilege").del();
  await knex('section').del();
  await knex('department').del();
  await knex('role').del();

  // 部署情報
  await knex('department').insert([
    { name: '名古屋事業所' },
    { name: '浜松工場' },
    { name: '東名工場' },
    { name: '[所属なし]' }
  ]);

  const departmentNagoya = (await knex.first<{ id: number }>('id').from('department').where('name', '名古屋事業所')).id;
  const departmentHamamatsu = (await knex.first<{ id: number }>('id').from('department').where('name', '浜松工場')).id;
  const departmentTomei = (await knex.first<{ id: number }>('id').from('department').where('name', '東名工場')).id;
  const departmentNone = (await knex.first<{ id: number }>('id').from('department').where('name', '[所属なし]')).id;
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

  // 端末情報
  await knex('device').insert([
    { name: "打刻端末1" },
    { name: "打刻端末2" },
    { name: "打刻端末3" },
    { name: "打刻端末4" },
    { name: "打刻端末5" },
    { name: "打刻端末6" },
    { name: "打刻端末7" },
    { name: "打刻端末8" },
  ]);

  // 権限情報
  await knex('privilege').insert([
    {
      name: '部署管理者',
      recordByLogin: true, applyRecord: true, applyVacation: true, applyHalfDayVacation: true, applyMakeupVacation: true,
      applyMourningLeave: true, applyMeasureLeave: true, applyOvertime: true, applyLate: true, approve: true, viewDuty: true,
      viewSectionUserInfo: true
    },
    {
      name: '部門管理者',
      recordByLogin: true, applyRecord: true, applyVacation: true, applyHalfDayVacation: true, applyMakeupVacation: true,
      applyMourningLeave: true, applyMeasureLeave: true, applyOvertime: true, applyLate: true, approve: true, viewDuty: true,
      viewSectionUserInfo: true, viewDepartmentUserInfo: true
    },
    {
      name: '製造社員',
      recordByLogin: true, applyRecord: true, applyVacation: true, applyHalfDayVacation: true, applyMakeupVacation: true,
      applyMourningLeave: true, applyMeasureLeave: true, applyOvertime: true, applyLate: true
    },
    {
      name: '事務社員',
      recordByLogin: true, applyRecord: true, applyVacation: true, applyHalfDayVacation: true, applyMakeupVacation: true,
      applyMourningLeave: true, applyMeasureLeave: true, applyOvertime: true, applyLate: true
    },
    {
      name: '製造パート'
    },
    {
      name: '事務派遣',
      recordByLogin: true, applyRecord: true, applyVacation: true, applyHalfDayVacation: true, applyMakeupVacation: true,
      applyMourningLeave: true, applyMeasureLeave: true, applyOvertime: true, applyLate: true
    },
    {
      name: 'システム管理者',
      recordByLogin: true, configureDutySystem: true, configurePrivilege: true, configureDutyStructure: true, issueQr: true,
      registerUser: true, registerDevice: true,
      viewAllUserInfo: true
    },
    {
      name: '役員',
      recordByLogin: true, configureDutySystem: true, configurePrivilege: true, configureDutyStructure: true, issueQr: true,
      registerUser: true, registerDevice: true,
      viewAllUserInfo: true
    },
  ]);

  // 承認権限情報
  await knex('role').insert([
    { name: '承認者1(主)', level: 1 },
    { name: '承認者1(副)', level: 1 },
    { name: '承認者2(主)', level: 2 },
    { name: '承認者2(副)', level: 2 },
    { name: '承認者3(主)', level: 3 },
    { name: '承認者3(副)', level: 3 },
    { name: '決済者', level: 10 },
  ]);

  // 承認権限レベル名称
  await knex('roleLevel').insert([
    { name: '承認1', level: 1 },
    { name: '承認2', level: 2 },
    { name: '承認3', level: 3 },
    { name: '決済', level: 10 },
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

  const workHamamatsuDayId = (await knex.first<{ id: number }>('id').from('workPattern').where('name', '浜松工場社員(日勤)')).id;
  const workHamamatsuDawnId = (await knex.first<{ id: number }>('id').from('workPattern').where('name', '浜松工場社員(準夜勤)')).id;
  const workHamamatsuNightId = (await knex.first<{ id: number }>('id').from('workPattern').where('name', '浜松工場社員(夜勤)')).id;
  const workTomeiDayId = (await knex.first<{ id: number }>('id').from('workPattern').where('name', '東名工場社員(日勤)')).id;
  const workTomeiDawnId = (await knex.first<{ id: number }>('id').from('workPattern').where('name', '東名工場社員(準夜勤)')).id;
  const workTomeiNightId = (await knex.first<{ id: number }>('id').from('workPattern').where('name', '東名工場社員(夜勤)')).id;
  const workNagoyaId = (await knex.first<{ id: number }>('id').from('workPattern').where('name', '名古屋事業所社員')).id;

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
  const sections = await knex
    .select<{ department: number, section: number, departmentName: string, sectionName: string }[]>
    ({ department: 'department.id' }, { section: 'section.id' }, { departmentName: 'department.name' }, { sectionName: 'section.name' })
    .from('section')
    .join('department', { 'department.id': 'section.department' });

  const privileges = await knex
    .select<{ id: number, name: string }[]>()
    .from('privilege');

  const fakeUsers: models.User[] = [];
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
  const routes: apiif.ApprovalRouteRequestData[] = [
    {
      name: '総務社員',
      roles: [
        { level: 1, users: [{ role: '承認者1(主)', account: 'USR00276' }, { role: '承認者1(副)', account: 'USR00277' }] },
        { level: 2, users: [{ role: '承認者2(主)', account: 'USR00290' }, { role: '承認者2(副)', account: 'USR00282' }] },
        { level: 3, users: [{ role: '承認者3(主)', account: 'USR00291' }, { role: '承認者3(副)', account: 'USR00294' }] },
        { level: 10, users: [{ role: '決済者', account: 'USR00300' }] },
      ]
    },
    {
      name: '開発部社員',
      roles: [
        { level: 1, users: [{ role: '承認者1(主)', account: 'USR00273' }, { role: '承認者1(副)', account: 'USR00274' }] },
        { level: 2, users: [{ role: '承認者2(主)', account: 'USR00289' }] },
        { level: 3, users: [{ role: '承認者3(主)', account: 'USR00291' }, { role: '承認者3(副)', account: 'USR00292' }] },
        { level: 10, users: [{ role: '決済者', account: 'USR00300' }] },
      ]
    },
    {
      name: '開発部課長',
      roles: [
        { level: 1, users: [{ role: '承認者1(主)', account: 'USR00289' }] },
        { level: 2, users: [{ role: '承認者2(主)', account: 'USR00291' }, { role: '承認者2(副)', account: 'USR00292' }] },
        { level: 10, users: [{ role: '決済者', account: 'USR00300' }] },
      ]
    },
    {
      name: '開発部長',
      roles: [
        { level: 1, users: [{ role: '承認者1(主)', account: 'USR00291' }, { role: '承認者1(副)', account: 'USR00292' }] },
        { level: 10, users: [{ role: '決済者', account: 'USR00300' }] },
      ]
    },
    {
      name: '浜松製造部社員',
      roles: [
        { level: 1, users: [{ role: '承認者1(主)', account: 'USR00226' }, { role: '承認者1(副)', account: 'USR00227' }] },
        { level: 2, users: [{ role: '承認者2(主)', account: 'USR00229' }, { role: '承認者2(副)', account: 'USR00228' }] },
        { level: 3, users: [{ role: '承認者3(主)', account: 'USR00291' }, { role: '承認者3(副)', account: 'USR00292' }] },
        { level: 10, users: [{ role: '決済者', account: 'USR00300' }] },
      ]
    },
    {
      name: '製造部課長',
      roles: [
        { level: 1, users: [{ role: '承認者1(主)', account: 'USR00229' }, { role: '承認者1(副)', account: 'USR00228' }] },
        { level: 2, users: [{ role: '承認者2(主)', account: 'USR00291' }, { role: '承認者2(副)', account: 'USR00292' }] },
        { level: 10, users: [{ role: '決済者', account: 'USR00300' }] },
      ]
    },
    {
      name: '製造部長',
      roles: [
        { level: 1, users: [{ role: '承認者1(主)', account: 'USR00291' }, { role: '承認者1(副)', account: 'USR00292' }] },
        { level: 10, users: [{ role: '決済者', account: 'USR00300' }] },
      ]
    },
  ]

  for (const route of routes) {
    await knex('approvalRoute').insert({ name: route.name });
    const routeRow = await knex
      .select<{ id: number }>({ id: 'id' })
      .first()
      .from('approvalRoute')
      .where('name', route.name);
    const routeId = routeRow.id;

    for (const role of route.roles) {
      for (const user of role.users) {

        const userRow = await knex
          .select<{ id: number }>({ id: 'id' })
          .first()
          .from('user')
          .where('account', user.account);

        const roleRow = await knex
          .select<{ id: number }>({ id: 'id' })
          .first()
          .from('role')
          .where('name', user.role);

        //        const sql = await knex('approvalMember').insert<{ route: number, user: number, role: string }>
        await knex('approvalRouteMember').insert({ route: routeId, user: userRow.id, role: roleRow.id });
      }
    }
  }


  const roleMembers = await knex
    .select<{ routeName: string, roleName: string, level: number, userAccount: string, userName: string }[]>(
      { routeName: 'approvalRoute.name', roleName: 'role.name', level: 'role.level', userAccount: 'user.account', userName: 'user.name' }
    )
    .from('approvalRouteMember')
    .join('approvalRoute', { 'approvalRoute.id': 'approvalRouteMember.route' })
    .join('user', { 'user.id': 'approvalRouteMember.user' })
    .join('role', { 'role.id': 'approvalRouteMember.role' })

  // その他情報
  await knex('config').update({ value: 'smtp.mailtrap.io' }).where('key', 'smtpHost');
  await knex('config').update({ value: '2525' }).where('key', 'smtpPort');
  await knex('config').update({ value: 'f4d144bc16e53b' }).where('key', 'smtpUsername');
  await knex('config').update({ value: '6ae992dd9335f9' }).where('key', 'smtpPassword');
};
