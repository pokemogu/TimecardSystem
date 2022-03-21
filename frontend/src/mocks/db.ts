import type * as models from 'shared/models';

export const holidays: models.Holiday[] = [
  { date: new Date('2022-04-29T00:00:00'), name: '昭和の日' },
  { date: new Date('2022-05-03T00:00:00'), name: '憲法記念日' },
  { date: new Date('2022-05-04T00:00:00'), name: 'みどりの日' },
  { date: new Date('2022-05-05T00:00:00'), name: 'こどもの日' },
  { date: new Date('2022-07-18T00:00:00'), name: '海の日' },
  { date: new Date('2022-08-11T00:00:00'), name: '山の日' },
  { date: new Date('2022-09-19T00:00:00'), name: '敬老の日' },
  { date: new Date('2022-09-23T00:00:00'), name: '秋分の日' },
  { date: new Date('2022-10-10T00:00:00'), name: 'スポーツの日' },
  { date: new Date('2022-11-03T00:00:00'), name: '文化の日' },
  { date: new Date('2022-11-23T00:00:00'), name: '勤労感謝の日' },
  { date: new Date('2023-01-01T00:00:00'), name: '元日' },
  { date: new Date('2023-01-02T00:00:00'), name: '休日' },
  { date: new Date('2023-01-09T00:00:00'), name: '成人の日' },
  { date: new Date('2023-02-11T00:00:00'), name: '建国記念の日' },
  { date: new Date('2023-02-23T00:00:00'), name: '天皇誕生日' },
  { date: new Date('2023-03-21T00:00:00'), name: '春分の日' },
  { date: new Date('2023-04-29T00:00:00'), name: '昭和の日' },
  { date: new Date('2023-05-03T00:00:00'), name: '憲法記念日' },
  { date: new Date('2023-05-04T00:00:00'), name: 'みどりの日' },
  { date: new Date('2023-05-05T00:00:00'), name: 'こどもの日' },
  { date: new Date('2023-07-17T00:00:00'), name: '海の日' },
  { date: new Date('2023-08-11T00:00:00'), name: '山の日' },
  { date: new Date('2023-09-18T00:00:00'), name: '敬老の日' },
  { date: new Date('2023-09-23T00:00:00'), name: '秋分の日' },
  { date: new Date('2023-10-09T00:00:00'), name: 'スポーツの日' },
  { date: new Date('2023-11-03T00:00:00'), name: '文化の日' },
  { date: new Date('2023-11-23T00:00:00'), name: '勤労感謝の日' },
];

export const users: models.User[] = [
  {
    id: 1,
    available: true,
    account: 'yamadatarou',
    password: 'P@ssw0rd',
    email: 'pokemogu@gmail.com',
    name: '山田 太郎',
    phonetic: 'ヤマダ タロウ',
    section: 6, // 浜松工場 製造部
    privilege: 3 // 工場社員
  },
  {
    id: 2,
    available: true,
    account: 'tanakajirou',
    password: 'P@ssw0rd',
    email: 'pokemogu@me.com',
    name: '田中 次郎',
    phonetic: 'タナカ ジロウ',
    section: 10, // 東名工場 製造部
    privilege: 3 // 工場社員
  },
  {
    id: 3,
    available: true,
    account: 'yamamotosaburou',
    password: 'P@ssw0rd',
    email: 'pokemogu@me.com',
    name: '山本 三郎',
    phonetic: 'ヤマモト サブロウ',
    section: 1, // 名古屋事業所 第一営業部
    privilege: 4, // 事務社員
    qrTokenIssued: true
  },
  {
    id: 4,
    available: true,
    account: 'suzukishirou',
    password: 'P@ssw0rd',
    email: 'pokemogu@me.com',
    name: '鈴木 四郎',
    phonetic: 'スズキ シロウ',
    section: 6,
    privilege: 2, // パート
    qrTokenIssued: true
  },
  {
    id: 5,
    available: true,
    account: 'kanekogorou',
    password: 'P@ssw0rd',
    email: 'pokemogu@me.com',
    name: '金子 五郎',
    phonetic: 'カネコ ゴロウ',
    section: 5,
    privilege: 1
  },
  {
    id: 6,
    available: true,
    account: 'okamotorokurou',
    password: 'P@ssw0rd',
    email: 'pokemogu@me.com',
    name: '岡本 六郎',
    phonetic: 'オカモト ロクロウ',
    section: 5,
    privilege: 1
  }
];

export const userWorkPatterns: models.UserWorkPattern[] = [
  { id: 1, user: 1, workPatter: 1 },
  { id: 2, user: 1, workPatter: 2 },
  { id: 3, user: 1, workPatter: 3 },
  { id: 4, user: 2, workPatter: 1 },
  { id: 5, user: 2, workPatter: 2 },
  { id: 6, user: 2, workPatter: 3 },
];

export const departments: models.Department[] = [
  { id: 1, name: '名古屋事業所' },
  { id: 2, name: '浜松工場' },
  { id: 3, name: '東名工場' },
]

export const sections: models.Section[] = [
  { id: 1, department: 1, name: '第一営業部' },
  { id: 2, department: 1, name: '第ニ営業部' },
  { id: 3, department: 1, name: '第三営業部' },
  { id: 4, department: 1, name: '経理・総務部' },
  { id: 5, department: 2, name: '営業部' },
  { id: 6, department: 2, name: '製造部' },
  { id: 7, department: 2, name: '品質保証部' },
  { id: 8, department: 2, name: '技術部' },
  { id: 9, department: 2, name: '総務部' },
  { id: 10, department: 3, name: '製造部' },
  { id: 11, department: 3, name: '品質保証部' },
];

export const tokens: models.Token[] = [
  { // yamamotosaburouのQRコード
    id: 1,
    user: 3,
    refreshToken: 'SAENC3vXXT3xXVYeRJz4YlwqXCZ0VltnvORg8.kT9UuGfcOpvhaBEN0wtn72jNTZzF6dj8IZ2gSjx9ZNnOFCv3qKDAYwzPA9VIx1Ord3s6vUrpl1j.pnnmQ8qUYEWWjUwGxt7ixVUVVMDtoyaZj2vJcy9xWfry',
    refreshTokenExpiration: 1710118882684,
    isQrToken: true
  },
  { // suzukishirouのQRコード
    id: 2,
    user: 4,
    refreshToken: 'gh86OKhfAInUvfgPjxxiobFdpf4vxxZOLs8I1.LkIS6PWoThGFkqaJAqcfRzcBLmyyJjbqI7xcppvtsH8YygItWchsA4c1sfe0Wbnpv7wtf3zMYE4.rqC3PIrvF0J4jjPRrqJtQLgRObN6tIEdUHbVUzq3VOUN',
    refreshTokenExpiration: 1710118882684,
    isQrToken: true
  }
];

export const recordTypes: models.RecordType[] = [
  { id: 0, name: 'clockin', description: '出勤' },
  { id: 1, name: 'clockout', description: '退勤' },
  { id: 2, name: 'break', description: '外出' },
  { id: 3, name: 'reenter', description: '再入' }
];

export const records: models.Record[] = [];

export const applyTypes: models.ApplyType[] = [
  { id: 1, name: 'record', isSystemType: true, description: '打刻' },
  { id: 2, name: 'leave', isSystemType: true, description: '休暇' },
  { id: 3, name: 'overtime', isSystemType: true, description: '早出・残業' },
  { id: 4, name: 'lateness', isSystemType: true, description: '遅刻' },
  { id: 5, name: 'leave-early', isSystemType: true, description: '早退' },
  { id: 6, name: 'break', isSystemType: true, description: '外出' },
  { id: 7, name: 'holiday-work', isSystemType: true, description: '休日出勤' },
  { id: 8, name: 'makeup-leave', isSystemType: true, description: '代休' },
];


export const applyOptionTypes: models.ApplyOptionType[] = [
  { id: 1, type: 1, name: 'situation', isSystemType: true, description: '種類' },
  { id: 2, type: 1, name: 'recordType', isSystemType: true, description: '時刻' },
  { id: 3, type: 2, name: 'leaveType', isSystemType: true, description: '種類' },
];

export const applyOptionTypeValues: models.ApplyOptionTypeValue[] = [
  { id: 1, optionType: 1, name: 'notyet', isSystemType: true, description: '未打刻' },
  { id: 2, optionType: 1, name: 'athome', isSystemType: true, description: '在宅' },
  { id: 3, optionType: 1, name: 'trip', isSystemType: true, description: '出張' },
  { id: 4, optionType: 1, name: 'withdrawal', isSystemType: true, description: '外出' },
  { id: 5, optionType: 2, name: 'clockin', isSystemType: true, description: '出勤' },
  { id: 6, optionType: 2, name: 'clockout', isSystemType: true, description: '退勤' },
  { id: 7, optionType: 2, name: 'break', isSystemType: true, description: '外出' },
  { id: 8, optionType: 2, name: 'reenter', isSystemType: true, description: '再入' },
  { id: 9, optionType: 3, name: 'paid', isSystemType: true, description: '有給' },
  { id: 10, optionType: 3, name: 'half', isSystemType: true, description: '半休' },
  { id: 11, optionType: 3, name: 'compensation', isSystemType: true, description: '代休' },
  { id: 12, optionType: 3, name: 'mourning', isSystemType: true, description: '慶弔休' },
  { id: 13, optionType: 3, name: 'measure', isSystemType: true, description: '措置休暇' },
]
export const applies: models.Apply[] = [];

export const approvals: models.Approval[] = [];

export const roles: models.Role[] = [];

export const approvalRoutes: models.ApprovalRoute[] = [];

export const approvalRouteMembers: models.ApprovalRouteMember[] = [];

export const applyOptions: models.ApplyOption[] = [];

export const privileges: models.Privilege[] = [
  {
    id: 1,
    name: 'システム管理者',
    recordByLogin: true,
    applyRecord: true,
    applyVacation: true,
    applyHalfDayVacation: true,
    applyMakeupVacation: true,
    applyMourningLeave: true,
    applyMeasureLeave: true,
    applyOvertime: true,
    applyLate: true,
    applyEarly: true,
    approve: false,
    configureDutySystem: true,
    configurePrivilege: true,
    configureDutyStructure: true,
    issueQr: true,
    registerUser: true,
    registerDevice: true

  },
  {
    id: 2,
    name: 'パート',
    recordByLogin: false,
    applyRecord: false,
    applyVacation: false,
    applyHalfDayVacation: false,
    applyMakeupVacation: false,
    applyMourningLeave: false,
    applyMeasureLeave: false,
    applyOvertime: false,
    applyLate: false,
    applyEarly: false,
    approve: false,
    configureDutySystem: false,
    configurePrivilege: false,
    configureDutyStructure: false,
    issueQr: false,
    registerUser: false,
    registerDevice: false

  },
  {
    id: 3,
    name: '工場社員',
    recordByLogin: false,
    applyRecord: true,
    applyVacation: true,
    applyHalfDayVacation: true,
    applyMakeupVacation: true,
    applyMourningLeave: true,
    applyMeasureLeave: true,
    applyOvertime: true,
    applyLate: true,
    applyEarly: true,
    approve: false,
    configureDutySystem: false,
    configurePrivilege: false,
    configureDutyStructure: false,
    issueQr: false,
    registerUser: false,
    registerDevice: false

  },
  {
    id: 4,
    name: '事務社員',
    recordByLogin: true,
    applyRecord: true,
    applyVacation: true,
    applyHalfDayVacation: true,
    applyMakeupVacation: true,
    applyMourningLeave: true,
    applyMeasureLeave: true,
    applyOvertime: true,
    applyLate: true,
    applyEarly: true,
    approve: false,
    configureDutySystem: false,
    configurePrivilege: false,
    configureDutyStructure: false,
    issueQr: false,
    registerUser: false,
    registerDevice: false

  },
  {
    id: 5,
    name: '工場管理職',
    recordByLogin: true,
    applyRecord: true,
    applyVacation: true,
    applyHalfDayVacation: true,
    applyMakeupVacation: true,
    applyMourningLeave: true,
    applyMeasureLeave: true,
    applyOvertime: true,
    applyLate: true,
    applyEarly: true,
    approve: true,
    viewDuty: true,
    configureDutySystem: false,
    configurePrivilege: false,
    configureDutyStructure: false,
    issueQr: false,
    registerUser: false,
    registerDevice: false
  },
  {
    id: 6,
    name: '事務管理職',
    recordByLogin: true,
    applyRecord: true,
    applyVacation: true,
    applyHalfDayVacation: true,
    applyMakeupVacation: true,
    applyMourningLeave: true,
    applyMeasureLeave: true,
    applyOvertime: true,
    applyLate: true,
    applyEarly: true,
    approve: true,
    viewDuty: true,
    configureDutySystem: true,
    configurePrivilege: true,
    configureDutyStructure: true,
    issueQr: true,
    registerUser: true,
    registerDevice: true
  }
];

export const workPatterns: models.WorkPattern[] = [
  {
    id: 1,
    name: 'パート',
    fixedMinutesOfDayFrom: (9 * 60) + 0,
    fixedMinutesOfDayTo: (17 * 60) + 0,
    breakTimeMinutes: 60,
    overtimeMinutes: 60,
    extraOvertimeMinutesOfDayFrom: ((17 * 60) + 0) + 60,
    extraOvertimeMinutesOfDayTo: (22 * 60) + 0,
    nightMinutesOfDayFrom: (22 * 60) + 0,
    nightMinutesOfDayTo: (27 * 60) + 0,
    maxAllowedLateHoursPerMonth: 10,
    maxAllowedLateNumPerMonth: 10
  },
  {
    id: 2,
    name: '社員',
    fixedMinutesOfDayFrom: (8 * 60) + 45,
    fixedMinutesOfDayTo: (17 * 60) + 15,
    breakTimeMinutes: 60,
    overtimeMinutes: 30,
    extraOvertimeMinutesOfDayFrom: ((17 * 60) + 15) + 30,
    extraOvertimeMinutesOfDayTo: (22 * 60) + 0,
    nightMinutesOfDayFrom: (22 * 60) + 0,
    nightMinutesOfDayTo: (27 * 60) + 0,
    maxAllowedLateHoursPerMonth: 10,
    maxAllowedLateNumPerMonth: 5
  }
];

export const devices: models.Device[] = [
  { id: 1, name: '打刻端末1' },
  { id: 2, name: '打刻端末2' },
  { id: 3, name: '打刻端末3' },
  { id: 4, name: '打刻端末4' },
  { id: 5, name: '打刻端末5' }
];