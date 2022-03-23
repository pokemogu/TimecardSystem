import { Knex } from 'knex';
import { hashPassword } from '../src/auth';
import { fakeNames } from '../../fakeNames';
import * as models from '../../shared/models';

export async function seed(knex: Knex): Promise<void> {

  await knex('device').del();
  await knex("user").del();
  await knex("privilege").del();
  await knex('section').del();
  await knex('department').del();

  // 部署情報
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
    { department: departmentNagoya, name: '' },
    { department: departmentHamamatsu, name: '' },
    { department: departmentTomei, name: '' },
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
  for (let i = 0; i < fakeNames.length; i++) {

    let section = 0;
    let privilege = 0;
    if (i < 30) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '製造パート').id
    }
    else if (i < 50) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '製造パート').id
    }
    else if (i < 60) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '経理・総務部').section
      privilege = privileges.find(privilege => privilege.name === '事務派遣').id
    }
    else if (i < 65) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第一営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務派遣').id
    }
    else if (i < 70) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第二営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務派遣').id
    }
    else if (i < 75) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第三営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務派遣').id
    }
    else if (i < 80) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務派遣').id
    }
    else if (i < 170) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '製造社員').id
    }
    else if (i < 230) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '製造社員').id
    }
    else if (i < 240) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第一営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
    }
    else if (i < 245) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第二営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
    }
    else if (i < 250) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第三営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
    }
    else if (i < 255) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '品質保証部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
    }
    else if (i < 260) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '品質保証部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
    }
    else if (i < 265) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '営業部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
    }
    else if (i < 275) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '技術部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
    }
    else if (i < 277) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '総務部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
    }
    else if (i < 280) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '総務部').section
      privilege = privileges.find(privilege => privilege.name === '事務社員').id
    }
    else if (i < 281) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 282) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '製造部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 283) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '経理・総務部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 284) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第一営業部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 285) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第二営業部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 286) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '第三営業部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 287) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '営業部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 288) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '品質保証部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 289) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '品質保証部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 290) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '技術部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 291) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '総務部').section
      privilege = privileges.find(privilege => privilege.name === '部署管理者').id
    }
    else if (i < 292) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '').section
      privilege = privileges.find(privilege => privilege.name === '部門管理者').id
    }
    else if (i < 293) {
      section = sections.find(section => section.departmentName === '東名工場' && section.sectionName === '').section
      privilege = privileges.find(privilege => privilege.name === '部門管理者').id
    }
    else if (i < 295) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '').section
      privilege = privileges.find(privilege => privilege.name === '部門管理者').id
    }
    else if (i < 298) {
      section = sections.find(section => section.departmentName === '名古屋事業所' && section.sectionName === '経理・総務部').section
      privilege = privileges.find(privilege => privilege.name === 'システム管理者').id
    }
    else if (i < 300) {
      section = sections.find(section => section.departmentName === '浜松工場' && section.sectionName === '総務部').section
      privilege = privileges.find(privilege => privilege.name === 'システム管理者').id
    }

    const usrnum = i.toString().padStart(5, '0');
    fakeUsers.push({
      available: true,
      account: 'USR' + usrnum,
      registeredAt: new Date(),
      name: fakeNames[i].name,
      password: hashPassword('P@ss' + usrnum),
      email: 'usr' + usrnum + '@sample.co.jp',
      phonetic: fakeNames[i].phonetic,
      privilege: privilege,
      section: section,
    });
  }

  await knex('user').insert(fakeUsers);

  // その他情報
  await knex('config').update({ value: 'smtp.mailtrap.io' }).where('key', 'smtpHost');
  await knex('config').update({ value: '2525' }).where('key', 'smtpPort');
  await knex('config').update({ value: 'f4d144bc16e53b' }).where('key', 'smtpUsername');
  await knex('config').update({ value: '6ae992dd9335f9' }).where('key', 'smtpPassword');
};
