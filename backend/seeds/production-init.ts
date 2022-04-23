import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {

  await knex("user").del();
  await knex("privilege").del();
  await knex('section').del();
  await knex('department').del();

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

  // 権限情報
  await knex('privilege').insert([
    {
      name: '__SYSTEM_DEVICE_PRIVILEGE__', isSystemPrivilege: true,
      viewRecord: true, viewAllUserInfo: true
    },
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

  const privileges = await knex.select<{ id: number, name: string }[]>().from('privilege');

  // 端末情報
  const privilegeIdDevice = privileges.find(privilege => privilege.name === '__SYSTEM_DEVICE_PRIVILEGE__').id
  await knex('user').insert([
    { available: true, registeredAt: new Date(), account: 'DKK00001', name: "打刻端末1", privilege: privilegeIdDevice, isDevice: true },
    { available: true, registeredAt: new Date(), account: 'DKK00002', name: "打刻端末2", privilege: privilegeIdDevice, isDevice: true },
    { available: true, registeredAt: new Date(), account: 'DKK00003', name: "打刻端末3", privilege: privilegeIdDevice, isDevice: true },
    { available: true, registeredAt: new Date(), account: 'DKK00004', name: "打刻端末4", privilege: privilegeIdDevice, isDevice: true },
    { available: true, registeredAt: new Date(), account: 'DKK00005', name: "打刻端末5", privilege: privilegeIdDevice, isDevice: true },
    { available: true, registeredAt: new Date(), account: 'DKK00006', name: "打刻端末6", privilege: privilegeIdDevice, isDevice: true },
    { available: true, registeredAt: new Date(), account: 'DKK00007', name: "打刻端末7", privilege: privilegeIdDevice, isDevice: true },
    { available: true, registeredAt: new Date(), account: 'DKK00008', name: "打刻端末8", privilege: privilegeIdDevice, isDevice: true },
  ]);

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
