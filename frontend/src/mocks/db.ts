import type * as ddl from './ddl';

export const users: ddl.User[] = [
  {
    id: 1,
    available: true,
    account: 'yamadatarou',
    password: 'P@ssw0rd',
    email: 'pokemogu@gmail.com',
    name: '山田 太郎',
    phonetic: 'ヤマダ タロウ',
    section: 1,
    department: 1,
    privilege: 2
  },
  {
    id: 2,
    available: true,
    account: 'tanakajirou',
    password: 'P@ssw0rd',
    email: 'pokemogu@me.com',
    name: '田中 次郎',
    phonetic: 'タナカ ジロウ',
    section: 2,
    department: 1,
    privilege: 2
  },
  {
    id: 3,
    available: true,
    account: 'yamamotosaburou',
    password: 'P@ssw0rd',
    email: 'pokemogu@me.com',
    name: '山本 三郎',
    phonetic: 'ヤマモト サブロウ',
    section: 1,
    department: 1,
    privilege: 1
  },
  {
    id: 4,
    available: true,
    account: 'suzukishirou',
    password: 'P@ssw0rd',
    email: 'pokemogu@me.com',
    name: '鈴木 四郎',
    phonetic: 'スズキ シロウ',
    section: 2,
    department: 1,
    privilege: 1
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
    department: 2,
    privilege: 0
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
    department: 2,
    privilege: 0
  }
];

export const userWorkPatterns: ddl.UserWorkPattern[] = [
  {
    id: 0,
    user: 1,
    workPatter: 1
  },
  {
    id: 1,
    user: 1,
    workPatter: 2
  },
  {
    id: 2,
    user: 1,
    workPatter: 3
  },
  {
    id: 3,
    user: 2,
    workPatter: 1
  },
  {
    id: 4,
    user: 2,
    workPatter: 2
  },
  {
    id: 5,
    user: 2,
    workPatter: 3
  },
];

export const departments: ddl.Department[] = [
  {
    id: 1,
    name: '東名工場'
  },
  {
    id: 2,
    name: '名古屋事務所'
  }
]

export const sections: ddl.Section[] = [
  {
    id: 1,
    name: '製造一課'
  },
  {
    id: 2,
    name: '製造二課'
  },
  {
    id: 3,
    name: '製造三課'
  },
  {
    id: 4,
    name: '生産管理課'
  },
  {
    id: 5,
    name: '総務課'
  },
  {
    id: 6,
    name: '開発設計課'
  },
  {
    id: 7,
    name: '営業課'
  },
  {
    id: 8,
    name: '東名工場'
  }
];

export const tokens: ddl.Token[] = [
  { // yamamotosaburouのQRコード
    id: 0,
    user: 3,
    refreshToken: 'SAENC3vXXT3xXVYeRJz4YlwqXCZ0VltnvORg8.kT9UuGfcOpvhaBEN0wtn72jNTZzF6dj8IZ2gSjx9ZNnOFCv3qKDAYwzPA9VIx1Ord3s6vUrpl1j.pnnmQ8qUYEWWjUwGxt7ixVUVVMDtoyaZj2vJcy9xWfry',
    refreshTokenExpiration: 1710118882684,
    isQrToken: true
  },
  { // suzukishirouのQRコード
    id: 1,
    user: 4,
    refreshToken: 'gh86OKhfAInUvfgPjxxiobFdpf4vxxZOLs8I1.LkIS6PWoThGFkqaJAqcfRzcBLmyyJjbqI7xcppvtsH8YygItWchsA4c1sfe0Wbnpv7wtf3zMYE4.rqC3PIrvF0J4jjPRrqJtQLgRObN6tIEdUHbVUzq3VOUN',
    refreshTokenExpiration: 1710118882684,
    isQrToken: true
  }
];

export const recordTypes: ddl.RecordType[] = [
  {
    id: 0,
    name: 'clockin',
    description: '出勤'
  },
  {
    id: 1,
    name: 'clockout',
    description: '退勤'
  },
  {
    id: 2,
    name: 'break',
    description: '外出'
  },
  {
    id: 3,
    name: 'reenter',
    description: '再入'
  }
];

export const records: ddl.Record[] = [
  {
    id: 0,
    user: 1,
    type: 0,
    timestamp: new Date('01 Mar 2022 08:54:11 JST')
  }
];

export const applyTypes: ddl.ApplyType[] = [
  {
    id: 0,
    name: 'record',
    description: '打刻'
  },
  {
    id: 1,
    name: 'leave',
    description: '休暇'
  },
  {
    id: 2,
    name: 'overtime',
    description: '早出・残業'
  },
  {
    id: 3,
    name: 'lateness',
    description: '遅刻'
  },
  {
    id: 4,
    name: 'leave-early',
    description: '早退'
  },
  {
    id: 5,
    name: 'break',
    description: '外出'
  },
  {
    id: 6,
    name: 'holiday-work',
    description: '休日出勤'
  },
  {
    id: 7,
    name: 'makeup-leave',
    description: '代休'
  },
];


export const applyOptionTypes: ddl.ApplyOptionType[] = [
  {
    id: 0,
    type: 0,
    name: 'situation',
    description: '種類'
  },
  {
    id: 1,
    type: 0,
    name: 'recordType',
    description: '時刻'
  },
  {
    id: 2,
    type: 1,
    name: 'leaveType',
    description: '種類'
  },
];

export const applyOptionTypeValues: ddl.ApplyOptionTypeValue[] = [
  {
    id: 0,
    optionType: 0,
    name: 'notyet',
    description: '未打刻'
  },
  {
    id: 1,
    optionType: 0,
    name: 'athome',
    description: '在宅'
  },
  {
    id: 2,
    optionType: 0,
    name: 'trip',
    description: '出張'
  },
  {
    id: 3,
    optionType: 0,
    name: 'withdrawal',
    description: '外出'
  },
  {
    id: 4,
    optionType: 1,
    name: 'clockin',
    description: '出勤'
  },
  {
    id: 5,
    optionType: 1,
    name: 'clockout',
    description: '退勤'
  },
  {
    id: 6,
    optionType: 1,
    name: 'break',
    description: '外出'
  },
  {
    id: 7,
    optionType: 1,
    name: 'reenter',
    description: '再入'
  },
  {
    id: 8,
    optionType: 2,
    name: 'paid',
    description: '有給'
  },
  {
    id: 9,
    optionType: 2,
    name: 'half',
    description: '半休'
  },
  {
    id: 10,
    optionType: 2,
    name: 'compensation',
    description: '代休'
  },
  {
    id: 11,
    optionType: 2,
    name: 'mourning',
    description: '慶弔休'
  },
  {
    id: 12,
    optionType: 2,
    name: 'measure',
    description: '措置休暇'
  },
]

export const applies: ddl.Apply[] = [
  {
    id: 0,
    type: 0,
    user: 2,
    timestamp: new Date('01 Mar 2022 08:54:11 JST'),
    dateFrom: new Date('01 Mar 2022 08:54:11 JST')
  },
];

export const approvals: ddl.Approval[] = [];

export const roles: ddl.Role[] = [];

export const approvalRoutes: ddl.ApprovalRoute[] = [];

export const approvalRouteMembers: ddl.ApprovalRouteMember[] = [];

export const applyOptions: ddl.ApplyOption[] = [];

export const privileges: ddl.Privilege[] = [
  {
    id: 0,
    name: '特権ユーザー',
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
    configureDutySystem: true,
    configurePrivilege: true,
    configureDutyStructure: true,
    issueQr: true,
    registerUser: true,
    registerDevice: true

  },
  {
    id: 1,
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
    id: 2,
    name: '工場社員',
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
    id: 3,
    name: '事務社員',
    recordByLogin: true,
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
    issueQr: true,
    registerUser: true,
    registerDevice: true

  },
  {
    id: 4,
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
    id: 5,
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

export const workPatterns: ddl.WorkPattern[] = [];

export const devices: ddl.Device[] = [
  {
    id: 0,
    name: '打刻端末1'
  },
  {
    id: 1,
    name: '打刻端末2'
  },
  {
    id: 2,
    name: '打刻端末3'
  },
  {
    id: 3,
    name: '打刻端末4'
  },
  {
    id: 4,
    name: '打刻端末5'
  }
];