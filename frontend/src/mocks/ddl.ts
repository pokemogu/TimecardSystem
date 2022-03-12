export interface User {
  // @PrimaryGeneratedColumn()
  id: number,
  // @Column()
  available: boolean,
  account: string,
  password: string,
  email: string,
  name: string,
  phonetic: string,
  section: number,
  department: number,
  privilege: number,
  hourlyWage?: number,
  commuteAllowance?: number,
  //qrTokenIssued?: boolean,
  printOutWageDetail?: boolean
}

export interface UserWorkPattern {
  id: number,
  user: number,
  workPatter: number
}

export interface Department {
  id: number,
  name: string
}

export interface Section {
  id: number,
  name: string
}

export interface Token {
  id: number,
  user: number,
  refreshToken: string,
  refreshTokenExpiration: number,
  accessToken?: string,
  accessTokenExpiration?: number,
  isQrToken: boolean
}

export interface RecordType {
  id: number,
  name: string,
  description: string
}

export interface Record {
  id: number,
  user: number,
  type: number,
  timestamp: Date
}

export interface ApplyType {
  id: number,
  name: string,
  description: string
}

export interface ApplyOptionType {
  id: number,
  type: number,
  name: string,
  description: string
}

export interface ApplyOptionTypeValue {
  id: number,
  optionType: number,
  name: string,
  description: string
}

export interface Apply {
  id: number,
  type: number,
  user: number,
  timestamp: Date,
  dateFrom: Date,
  dateTo?: Date,
  dateRelated?: Date,
  reason?: string,
  contact?: string
}

export interface Approval {
  id: number,
  apply: number,
  timestamp: Date,
  user: number,
  role: number
}

export interface Role {
  id: number,
  name: string,
  level: number
}

export interface ApprovalRoute {
  id: number,
  name: string
}

export interface ApprovalRouteMember {
  id: number,
  route: number,
  user: number,
  role: number
}

export interface ApplyOption {
  id: number,
  apply: number,
  optionType: number,
  optionValue: number
}

export interface Privilege {
  id: number,
  name: string,
  recordByLogin: boolean,
  applyRecord: boolean,
  applyVacation: boolean,
  applyHalfDayVacation: boolean,
  applyMakeupVacation: boolean,
  applyMourningLeave: boolean,
  applyMeasureLeave: boolean,
  applyOvertime: boolean,
  applyLate: boolean,
  maxApplyLateNum?: number,
  maxApplyLateHours?: number,
  applyEarly: boolean,
  maxApplyEarlyNum?: number,
  maxApplyEarlyHours?: number,
  approve: boolean,
  viewDuty?: boolean,
  configureDutySystem: boolean,
  configurePrivilege: boolean,
  configureDutyStructure: boolean,
  issueQr: boolean,
  registerUser: boolean,
  registerDevice: boolean,
  viewAllUserInfo?: boolean,
  viewDepartmentUserInfo?: boolean,
  viewSectionUserInfo?: boolean
}

export interface WorkPattern {
  id: number,
  name: string,
  fixedMinutesOfDayFrom: number,
  fixedMinutesOfDayTo: number,
  overtimeMinutes: number,
  holidayWorkWageRate: number,
  extraOvertimeMinutesOfDayFrom: number,
  extraOvertimeMinutesOfDayTo: number,
  nightMinutesOfDayFrom: number,
  nightMinutesOfDayTo: number,
  nightWorkWageRate: number,
  extraNightMinutesOfDayFrom: number,
  extraNightMinutesOfDayTo: number,
  maxAllowedLateHoursPerMonth: number,
  maxAllowedLateNumPerMonth: number,
  wageCalculationMinutes: number,
  measureLeaveWageRate: number
}

export interface Device {
  id: number,
  name: string
}