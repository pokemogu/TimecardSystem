export interface User {
  id?: number,
  available?: boolean,
  registeredAt: Date,
  account: string,
  password?: string,
  email: string,
  name: string,
  phonetic: string,
  section?: number,
  privilege?: number,
  hourlyWage?: number,
  commuteAllowance?: number,
  qrTokenIssued?: boolean,
  printOutWageDetail?: boolean,
  defaultWorkPattern: number,
  optional1WorkPattern?: number,
  optional2WorkPattern?: number
}

export interface PaidLeave {
  id: number,
  user: number,
  hours: number,
  providedYear?: number
}

export interface UserWorkPattern {
  id: number,
  user: number,
  workPatter: number,
  isDefault?: boolean
}

export interface Department {
  id: number,
  name: string
}

export interface Section {
  id: number,
  department: number,
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
  isSystemType: boolean,
  name: string,
  description: string
}

export interface ApplyOptionType {
  id: number,
  type: number,
  isSystemType: boolean,
  name: string,
  description: string
}

export interface ApplyOptionTypeValue {
  id: number,
  optionType: number,
  isSystemType: boolean,
  name?: string,
  description: string
}

export interface Apply {
  id: number,
  type: number,
  user: number,
  appliedUser?: number,
  timestamp: Date,
  dateFrom: Date,
  dateTo?: Date,
  dateRelated?: Date,
  reason?: string,
  contact?: string,
  route: number
}

export interface ApplyOption {
  id: number,
  apply: number,
  optionType: number,
  optionValue: number
}

export interface Approval {
  id: number,
  apply: number,
  timestamp: Date,
  user: number,
  role: number,
  rejected: boolean,
  comment?: string
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
  periodFrom?: Date,
  periodTo?: Date,
  fixedMinutesOfDayFrom: number,
  fixedMinutesOfDayTo: number,
  breakTimeMinutes: number,
  overtimeMinutes: number,
  holidayWorkWageRate?: number,
  extraOvertimeMinutesOfDayFrom: number,
  extraOvertimeMinutesOfDayTo: number,
  nightMinutesOfDayFrom: number,
  nightMinutesOfDayTo: number,
  nightWorkWageRate?: number,
  maxAllowedLateHoursPerMonth?: number,
  maxAllowedLateNumPerMonth?: number,
  wageCalculationMinutes?: number,
  measureLeaveWageRate?: number
}

export interface Device {
  id: number,
  name: string,
  refreshToken?: string
}

export interface Holiday {
  date: Date,
  name: string
}