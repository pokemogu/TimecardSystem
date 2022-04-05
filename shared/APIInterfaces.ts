export interface MessageOnlyResponseBody {
  message: string
}

export interface IssueTokenRequestBody {
  account: string,
  password: string
}

export interface IssueTokenResponseData {
  refreshToken: string,
  name: string,
  department: string,
  section: string
}

export interface IssueTokenResponseBody {
  message: string,
  token?: IssueTokenResponseData
}

export interface ChangePasswordRequestBody {
  account?: string,
  oldPassword: string,
  newPassword: string
}

export type UserRequestPathParams = Record<'userId', string>;

export interface AccessTokenRequestBody {
  refreshToken: string
}

export interface AccessTokenResponseData {
  account: string,
  accessToken: string,
}

export interface AccessTokenResponseBody {
  message: string,
  token?: AccessTokenResponseData
}

export interface RevokeTokenRequestBody {
  account: string,
  refreshToken: string
}

export interface UserInfoRequestQuery {
  id?: number,
  account?: string,
  name?: string,
  phonetic?: string,
  department?: string,
  section?: string,
  registeredFrom?: string,
  registeredTo?: string,
  isQrCodeIssued?: boolean,
  limit?: number,
  offset?: number
}

export interface UserInfosResponseBody {
  message: string,
  infos?: UserInfoResponseData[]
}

export interface UserInfoResponseData {
  id: number,
  available?: boolean,
  registeredAt?: string,
  account: string,
  name: string,
  phonetic?: string,
  email?: string,
  section?: string,
  department?: string,
  qrCodeIssueNum?: number,
  defaultWorkPatternName?: string,
  optional1WorkPatternName?: string,
  optional2WorkPatternName?: string
}

export interface UserInfoResponseBody {
  message: string,
  info?: UserInfoResponseData
}

export interface UserAccountCandidatesResponseBody {
  message: string,
  candidates?: string[]
}

export interface RecordRequestBody {
  account?: string,
  timestamp: string,
  device?: string,
  deviceToken?: string
}

export type RecordRequestPathParams = Record<'recordType', string>;

export interface DevicesRequestBody {
  name: string
}

export interface DevicesResponseData {
  name: string
}

export interface DevicesResponseBody {
  message: string,
  devices?: DevicesResponseData[]
}

export interface ApplyTypeResponseData {
  id?: number,
  name: string,
  description: string,
  isSystemType: boolean
}

export type ApplyTypeRequestData = ApplyTypeResponseData;

export interface ApplyTypeResponseBody {
  message: string,
  applyTypes?: ApplyTypeResponseData[]
}

export interface ApplyOptionsResponseData {
  name: string,
  description: string,
  options: {
    name: string,
    description: string
  }[]
}

export interface ApplyOptionsResponseBody {
  message: string,
  optionTypes?: ApplyOptionsResponseData[]
}

export interface ApplyRequestBody {
  targetUserAccount?: string,
  timestamp: string,
  date?: string,
  dateTimeFrom: string,
  dateTimeTo?: string,
  dateRelated?: string,
  options?: {
    name: string,
    value: string
  }[],
  reason?: string,
  contact?: string,
  route: string
}

export interface DepartmentResponseData {
  name: string
  sections?: {
    name: string
  }[]
}

export interface DepartmentResponseBody {
  message: string,
  departments?: DepartmentResponseData[]
}

export interface ApplyRequestQuery {
  id?: number,
  timestampFrom?: string,
  timestampTo?: string,
  type?: string,

  targetedUserAccount?: string,
  appliedUserAccount?: string,
  approvalUserAccount?: string,

  dateTimeFrom?: string,
  dateTimeTo?: string,

  limit?: number,
  offset?: number
}

export interface ApplyResponseData {
  id: number,
  timestamp: string,
  type: ApplyTypeResponseData,

  targetedUser: UserInfoResponseData,
  appliedUser?: UserInfoResponseData,

  approvedLevel1User?: UserInfoResponseData,
  approvedLevel1Timestamp?: string,
  approvedLevel2User?: UserInfoResponseData,
  approvedLevel2Timestamp?: string,
  approvedLevel3User?: UserInfoResponseData,
  approvedLevel3Timestamp?: string,
  approvedDecisionUser?: UserInfoResponseData,
  approvedDecisionTimestamp?: string,

  date: string,
  dateTimeFrom: string,
  dateTimeTo?: string,
  dateRelated?: string,
  options?: {
    name: string,
    value: string
  }[],
  reason?: string,
  contact?: string,
  isApproved?: boolean
}

export interface ApplyResponseBody {
  message: string,
  applies?: ApplyResponseData[]
}

export interface ApprovalRouteRoleData {
  level: number,
  names: string[]
}

export interface ApprovalRouteRoleBody {
  message: string,
  roles?: ApprovalRouteRoleData[]
}

export interface ApprovalRouteResposeData {
  id?: number,
  name: string,
  roles?: {
    level: number,
    users: {
      role: string,
      account: string,
      name?: string
    }[]
  }[],
  approvalLevel1MainUserId?: number, approvalLevel1MainUserAccount?: string, approvalLevel1MainUserName?: string,
  approvalLevel1SubUserId?: number, approvalLevel1SubUserAccount?: string, approvalLevel1SubUserName?: string,
  approvalLevel2MainUserId?: number, approvalLevel2MainUserAccount?: string, approvalLevel2MainUserName?: string,
  approvalLevel2SubUserId?: number, approvalLevel2SubUserAccount?: string, approvalLevel2SubUserName?: string,
  approvalLevel3MainUserId?: number, approvalLevel3MainUserAccount?: string, approvalLevel3MainUserName?: string,
  approvalLevel3SubUserId?: number, approvalLevel3SubUserAccount?: string, approvalLevel3SubUserName?: string,
  approvalDecisionUserId?: number, approvalDecisionUserAccount?: string, approvalDecisionUserName?: string,
}

export type ApprovalRouteRequestData = ApprovalRouteResposeData;

export interface ApprovalRouteRequestBody {
  message: string,
  route: ApprovalRouteResposeData
}

export interface ApprovalRouteResponseBody {
  message: string,
  routes?: ApprovalRouteResposeData[]
}

export interface WorkPatternResponseData {
  id?: number,
  name: string,
  onTimeStart: string,
  onTimeEnd: string,
  wagePatterns: {
    id?: number,
    name: string,
    timeStart: string,
    timeEnd: string,
    normalWagePercentage: number,
    holidayWagePercentage: number
  }[]
}

export type WorkPatternRequestData = WorkPatternResponseData;

export interface WorkPatternResponseBody {
  message: string,
  workPattern?: WorkPatternResponseData
}

export interface WorkPatternsResponseData {
  id: number,
  name: string,
  onTimeStart: string,
  onTimeEnd: string
}

export interface WorkPatternsResponseBody {
  message: string,
  workPatterns?: WorkPatternsResponseData[]
}

export interface PrivilegeResponseData {
  id?: number,
  name: string,
  recordByLogin?: boolean,
  applyPrivileges?: ApplyPrivilegeResponseData[],

  maxApplyLateNum?: number | null,
  maxApplyLateHours?: number | null,
  maxApplyEarlyNum?: number | null,
  maxApplyEarlyHours?: number | null,

  approve?: boolean,
  viewRecord?: boolean,
  viewRecordPerDevice?: boolean,
  configurePrivilege?: boolean,
  configureWorkPattern?: boolean,
  issueQr?: boolean,
  registerUser?: boolean,
  registerDevice?: boolean,
  viewAllUserInfo?: boolean,
  viewDepartmentUserInfo?: boolean,
  viewSectionUserInfo?: boolean
}

export type PrivilageRequestData = PrivilegeResponseData;

export interface PrivilegeResponseBody {
  message: string,
  privileges?: PrivilegeResponseData[]
}

export interface ApplyPrivilegeResponseData {
  applyTypeId?: number,
  applyTypeName: string,
  applyTypeDescription?: string,
  isSystemType?: boolean,
  permitted: boolean
}

export interface ApplyPrivilegeResponseBody {
  message: string,
  applyPrivileges?: ApplyPrivilegeResponseData[]
}

export interface HolidayRequestQuery {
  from?: string,
  to?: string,
  limit?: number,
  offset?: number
}

export interface HolidayResponseData {
  date: string,
  name: string
}

export type HolidayRequestData = HolidayResponseData;

export interface HolidaysResponseBody {
  message: string,
  holidays?: HolidayResponseData[]
}

export interface UserWorkPatternCalendarRequestQuery {
  from?: string,
  to?: string,
  account?: string,
  limit?: number,
  offset?: number
}

export interface UserWorkPatternCalendarResponseData {
  id?: number,
  date: string,
  user: UserInfoResponseData,
  workPattern: WorkPatternsResponseData | null
}

export interface UserWorkPatternCalendarRequestData {
  date: string,
  name: string | null,
  account?: string
}

export interface UserWorkPatternCalendarResponseBody {
  message: string,
  userWorkPatternCalendars?: UserWorkPatternCalendarResponseData[]
}