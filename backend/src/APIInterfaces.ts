export interface MessageOnlyResponseBody {
  message: string
}

export interface IssueTokenRequestBody {
  account: string,
  password: string,
  timestamp?: Date
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
  oldPassword?: string,
  newPassword: string
}

export type UserRequestPathParams = Record<'userId', string>;

export interface AccessTokenRequestBody {
  refreshToken: string
}

export interface AccessTokenResponseData {
  accessToken: string
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
  accounts?: string[],
  name?: string,
  phonetic?: string,
  department?: string,
  section?: string,
  registeredFrom?: Date,
  registeredTo?: Date,
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
  registeredAt?: Date,
  account: string,
  name: string,
  phonetic?: string,
  email?: string,
  section?: string,
  department?: string,
  privilegeName?: string,
  qrCodeIssueNum?: number,
  defaultWorkPatternName?: string,
  optional1WorkPatternName?: string,
  optional2WorkPatternName?: string
}

/*
export interface UserInfoRequestData {
  account: string,
  name?: string,
  phonetic?: string,
  email?: string,
  section?: string,
  department?: string,
  privilegeName?: string,
  defaultWorkPatternName?: string,
  optional1WorkPatternName?: string,
  optional2WorkPatternName?: string,
  //  password?: string
}
*/

export type UserInfoRequestData = Omit<UserInfoResponseData, 'id' | 'registeredAt' | 'qrCodeIssueNum'>;
export interface UserInfoRequestDataWithPassword extends UserInfoRequestData { password: string };

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
  timestamp: Date,
  deviceAccount?: string,
  deviceToken?: string,
  applyId?: number
}

export type RecordRequestPathParams = Record<'recordType', string>;

export interface RecordRequestQuery {
  byUserAccount?: string,
  byUserName?: string,
  bySection?: string,
  byDepartment?: string,
  byDevice?: string,
  sortBy?: 'byUserAccount' | 'byUserName' | 'bySection' | 'byDepartment',
  sortDesc?: boolean, // true:昇順、false:降順、undefined:ソートなし
  from?: string,
  to?: string,
  sortDateDesc?: boolean, // true:昇順、false:降順、undefined:ソートなし
  clockin?: boolean,
  break?: boolean,
  reenter?: boolean,
  clockout?: boolean,
  limit?: number,
  offset?: number
}

interface RecordInfo {
  timestamp: Date,
  deviceAccount?: string,
  deviceName?: string,
  applyId?: number
}

export interface RecordResponseData {
  userAccount: string,
  userName: string,
  userDepartment: string,
  userSection: string,
  date: string,
  clockin?: RecordInfo,
  break?: RecordInfo,
  reenter?: RecordInfo,
  clockout?: RecordInfo
}

export interface RecordResponseBody {
  message: string,
  records?: RecordResponseData[]
}

export interface DevicesRequestBody {
  name: string
}

export interface DeviceResponseData {
  id?: number,
  account: string,
  name: string
}

export type DeviceRequestData = DeviceResponseData;

export interface DevicesResponseBody {
  message: string,
  devices?: DeviceResponseData[]
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
  timestamp: Date,
  date?: Date,
  dateTimeFrom: Date,
  dateTimeTo?: Date,
  dateRelated?: Date,
  options?: {
    name: string,
    value: string
  }[],
  reason?: string,
  contact?: string,
  routeName: string
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
  timestampFrom?: Date,
  timestampTo?: Date,
  type?: string,

  targetedUserAccount?: string, // 申請対象のユーザー
  appliedUserAccount?: string,
  approvingUserAccount?: string, // 回付中の申請を承認する番が回ってきているユーザー
  approvedUserAccount?: string, // 回付中あるいは回付済の申請を承認済のユーザー

  dateTimeFrom?: Date,
  dateTimeTo?: Date,

  isApproved?: boolean | null | (boolean | null)[], // trueの場合は承認済の申請、falseの場合は否認済の申請、nullの場合は回付中の申請

  limit?: number,
  offset?: number
}

export interface ApplyResponseData {
  id: number,
  timestamp: Date,
  type: Omit<ApplyTypeResponseData, 'isSystemType'>,

  targetUser: Omit<UserInfoResponseData, 'privilegeName' | 'defaultWorkPatternName'>,
  appliedUser?: Omit<UserInfoResponseData, 'privilegeName' | 'defaultWorkPatternName'>,

  approvedLevel1User?: Omit<UserInfoResponseData, 'privilegeName' | 'defaultWorkPatternName'>,
  approvedLevel1Timestamp?: Date,
  approvedLevel2User?: Omit<UserInfoResponseData, 'privilegeName' | 'defaultWorkPatternName'>,
  approvedLevel2Timestamp?: Date,
  approvedLevel3User?: Omit<UserInfoResponseData, 'privilegeName' | 'defaultWorkPatternName'>,
  approvedLevel3Timestamp?: Date,
  approvedDecisionUser?: Omit<UserInfoResponseData, 'privilegeName' | 'defaultWorkPatternName'>,
  approvedDecisionTimestamp?: Date,

  date: Date,
  dateTimeFrom: Date,
  dateTimeTo?: Date,
  dateRelated?: Date,
  options?: {
    name: string,
    value: string
  }[],
  reason?: string,
  contact?: string,
  routeName: string,
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

export interface ApprovalRouteResponseData {
  id?: number,
  name: string,
  approvalLevel1MainUserId?: number, approvalLevel1MainUserAccount?: string, approvalLevel1MainUserName?: string,
  approvalLevel1SubUserId?: number, approvalLevel1SubUserAccount?: string, approvalLevel1SubUserName?: string,
  approvalLevel2MainUserId?: number, approvalLevel2MainUserAccount?: string, approvalLevel2MainUserName?: string,
  approvalLevel2SubUserId?: number, approvalLevel2SubUserAccount?: string, approvalLevel2SubUserName?: string,
  approvalLevel3MainUserId?: number, approvalLevel3MainUserAccount?: string, approvalLevel3MainUserName?: string,
  approvalLevel3SubUserId?: number, approvalLevel3SubUserAccount?: string, approvalLevel3SubUserName?: string,
  approvalDecisionUserId?: number, approvalDecisionUserAccount?: string, approvalDecisionUserName?: string,
}

export type ApprovalRouteRequestData = ApprovalRouteResponseData;

export interface ApprovalRouteRequestBody {
  message: string,
  route: ApprovalRouteResponseData
}

export interface ApprovalRouteResponseBody {
  message: string,
  routes?: ApprovalRouteResponseData[]
}

export interface WorkPatternRequestData {
  id?: number,
  name: string,
  onTimeStart: string,
  onTimeEnd: string,
  wagePatterns?: {
    id?: number,
    name: string,
    timeStart: string,
    timeEnd: string,
    normalWagePercentage: number,
    holidayWagePercentage: number
  }[]
}

//export type WorkPatternRequestData = WorkPatternResponseData;
export type WorkPatternResponseData = Required<WorkPatternRequestData>;

export interface WorkPatternResponseBody {
  message: string,
  workPattern?: WorkPatternResponseData
}
/*
export interface WorkPatternsResponseData {
  id: number,
  name: string,
  onTimeStart: string,
  onTimeEnd: string
}
*/
export interface WorkPatternsResponseBody {
  message: string,
  workPatterns?: WorkPatternResponseData[]
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

//export type PrivilageRequestData = Omit<PrivilegeResponseData, 'id'>;
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
  from: string,
  to: string,
  accounts?: string[],
  limit?: number,
  offset?: number
}

export interface UserWorkPatternCalendarResponseData1 {
  id?: number,
  date: string,
  user: UserInfoResponseData,
  workPattern: WorkPatternResponseData | null
}

export interface UserWorkPatternCalendarResponseData {
  id?: number,
  date: string,
  user: UserInfoResponseData,
  workPattern: {
    name: string,
    onDateTimeStart: string,
    onDateTimeEnd: string
  } | null
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

export interface SystemConfigQuery {
  key?: string,
  limit?: number,
  offset?: number
}

export interface SystemConfigResponseData {
  key: string,
  value: string,
  title?: string,
  description?: string,
  isMultiLine?: boolean,
  isPassword?: boolean
}

export type SystemConfigRequestData = SystemConfigResponseData;

export interface SystemConfigResponseBody {
  message: string,
  config?: SystemConfigResponseData[]
}