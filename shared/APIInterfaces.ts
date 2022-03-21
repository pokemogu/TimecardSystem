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
  userId: string,
  refreshToken: string
}

export interface UserInfoResponseData {
  id: string,
  name: string,
  phonetic: string,
  email: string,
  section: string,
  department: string
}

export interface UserInfoResponseBody {
  message: string,
  info?: UserInfoResponseData
}

export interface RecordRequestBody {
  timestamp: string
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

export type optionsApplyRequestPathParams = Record<'type', string>;

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

export type ApplyRequestPathParams = Record<'applyType', string>;

export interface applyRequestBody {
  targetUserId?: string,
  timestamp: string,
  dateFrom: string,
  dateTo?: string,
  dateRelated?: string,
  options?: {
    name: string,
    value: string
  }[],
  reason: string,
  contact: string
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

interface ApplyResponseData {
  id: number,
  timestamp: string,
  type: {
    name: string,
    description: string
  }
  user: {
    id: string,
    name: string
  },
  userApplied?: {
    id: string,
    name: string
  },
  userApproves: {
    id: string,
    name: string,
    role: {
      name: string,
      level: number
    }
    timestamp: string,
    isApproved?: boolean
  }[]
  dateFrom: string,
  dateTo?: string
}

export interface ApplyResponseBody {
  message: string,
  applies?: ApplyResponseData[]
}
