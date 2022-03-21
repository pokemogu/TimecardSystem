import { Knex } from "knex";
import { hashPassword } from '../src/auth';

export async function seed(knex: Knex): Promise<void> {

  await knex('device').del();
  await knex("user").del();
  await knex("privilege").del();

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

  await knex('user').insert([
    {
      available: true,
      account: 'USR99999',
      password: hashPassword('P@ssw0rd001'),
      email: 'usr99999@sample.com',
      name: 'システム管理者',
      phonetic: 'システム管理者',
      privilege: privileges.find(privilege => privilege.name === 'システム管理者').id
    },
    {
      available: true,
      account: 'USR00001',
      password: hashPassword('P@ssw0rd001'),
      email: 'usr00001@sample.com',
      name: '山田 太郎',
      phonetic: 'ヤマダ タロウ',
      section: sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '製造部').section,
      privilege: privileges.find(privilege => privilege.name === '製造社員').id
    },
    {
      available: true,
      account: 'USR00002',
      password: hashPassword('P@ssw0rd002'),
      email: 'usr00002@sample.com',
      name: '田中 次郎',
      phonetic: 'タナカ ジロウ',
      section: sections.find(section => section.departmentName === '東名工場' && section.sectionName === '製造部').section,
      privilege: privileges.find(privilege => privilege.name === '製造社員').id
    },
    {
      available: true,
      account: 'USR00003',
      password: hashPassword('P@ssw0rd003'),
      email: 'usr00001@sample.com',
      name: '山本 三郎',
      phonetic: 'ヤマモト サブロウ',
      section: sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第一営業部').section,
      privilege: privileges.find(privilege => privilege.name === '製造社員').id
    },
    {
      available: true,
      account: 'USR00004',
      password: hashPassword('P@ssw0rd004'),
      email: 'usr00001@sample.com',
      name: '山田 太郎',
      phonetic: 'ヤマダ タロウ',
      section: sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '製造部').section,
      privilege: privileges.find(privilege => privilege.name === '事務社員').id
    },
    {
      available: true,
      account: 'USR00005',
      password: hashPassword('P@ssw0rd005'),
      email: 'usr00001@sample.com',
      name: '山田 太郎',
      phonetic: 'ヤマダ タロウ',
      section: sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '製造部').section,
      privilege: privileges.find(privilege => privilege.name === '製造社員').id
    },
  ]);

  // その他情報
  await knex('config').insert([
    { key: 'smtpHost', value: 'smtp.mailtrap.io' },
    { key: 'smtpPort', value: '2525' },
    { key: 'smtpUsername', value: 'f4d144bc16e53b' },
    { key: 'smtpPassword', value: '6ae992dd9335f9' },
  ]);
};
