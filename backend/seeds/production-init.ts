import { Knex } from "knex";

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
};
