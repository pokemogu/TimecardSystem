import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex('device').del();
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

  await knex('section').del();
  await knex('section').insert([
    { name: '製造一課' },
    { name: '製造二課' },
    { name: '製造三課' },
    { name: '生産管理課' },
    { name: '総務課' },
    { name: '開発設計課' },
    { name: '営業課' },
    { name: '東名工場' },
  ]);

  await knex('department').del();
  await knex('department').insert([
    { name: '東名工場' },
    { name: '名古屋事務所' },
  ]);

  await knex("privilege").del();
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
      name: '社員',
      recordByLogin: true, applyRecord: true, applyVacation: true, applyHalfDayVacation: true, applyMakeupVacation: true,
      applyMourningLeave: true, applyMeasureLeave: true, applyOvertime: true, applyLate: true
    },
    {
      name: 'パート'
    },
    {
      name: '派遣',
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
