import * as core from '@actions/core'
import axios from 'axios'

export interface JiraContext {
  subDomain: string
  email: string
  token: string
  projectsIds: string[]
  projectsKeys: string[]
  masterProjectId: string
  masterProjectKey: string
  masterIssueType: string
}

export interface JiraVersion {
  self?: string
  id?: string
  name: string
  archived: boolean
  released: boolean
  startDate?: string
  releaseDate?: string
  userStartDate?: string
  userReleaseDate?: string
  projectId?: number
  description?: string
  overdue?: boolean
}

interface AuthHeaders {
  headers: {
    Authorization: string
    Accept: string
  }
}

export interface SearchedJiraIssue {
  expand?: string
  id?: string
  self?: string
  key: string
  fields: {
    summary?: string
  }
}

export interface CreatedIssue {
  id: string
  key: string
  self: string
  transition: {
    status: number
    errorCollection: {
      errorMessages: string[]
      errors: {}
      status: number
    }
  }
}

export interface JiraIssue {
  update: {}
  fields?: JiraFields
}

interface JiraIssueDescriptionContent {
  type: string
  attrs?: {
    isNumberColumnEnabled?: boolean
    layout?: string
    url?: string
  }
  content?: (JiraIssueDescriptionContent | JiraIssueDescriptionText)[]
}

interface JiraIssueDescriptionText {
  type: string
  text: string
  marks?: {
    type: string
    attrs?: {
      href: string
    }
  }[]
}

interface JiraCustomField {
  id?: string
  value?: string
  child?: {
    value: string
  }
}

interface JiraFields {
  summary?: string
  issuetype?: {
    id: string
  }
  project?: {
    id: string
  }
  description?: {
    type: string
    version: number
    content: JiraIssueDescriptionContent[]
  }
  fixVersions?: {
    id: string
  }[]
  customfield_23944?: JiraCustomField
  customfield_23710?: JiraCustomField
  customfield_21603?: JiraCustomField
  customfield_12803?: JiraCustomField
}

export const listProjectVersions = async (
  context: JiraContext,
  projectKey: string
): Promise<JiraVersion[]> => {
  const {subDomain, email, token} = context
  try {
    core.info(`request listProjectVersions ${projectKey}`)
    const response = await axios.get(
      `https://${subDomain}.atlassian.net/rest/api/3/project/${projectKey}/versions`,
      getAuthHeaders(email, token)
    )
    core.info(`listProjectVersions successful`)
    return response?.data
  } catch (error: unknown) {
    core.error('error during listProjectVersions request')
    if (axios.isAxiosError(error)) {
      core.error(error.message)
      core.error(JSON.stringify(error.toJSON))
    }
    return Promise.reject(error)
  }
}

export const createVersion = async (
  context: JiraContext,
  version: JiraVersion
): Promise<JiraVersion> => {
  const {subDomain, email, token} = context
  try {
    core.info('request createVersion')
    const response = await axios.post(
      `https://${subDomain}.atlassian.net/rest/api/3/version`,
      version,
      getAuthHeaders(email, token)
    )
    core.info(`createVersion successful`)
    return response?.data
  } catch (error: unknown) {
    core.error('error during createVersion request')
    if (axios.isAxiosError(error)) {
      core.error(error.message)
      core.error(JSON.stringify(error.toJSON))
    }
    return Promise.reject(error)
  }
}

export const searchIssues = async (
  context: JiraContext,
  jQLQuery: string,
  properties: string[]
): Promise<SearchedJiraIssue[]> => {
  const {subDomain, email, token} = context
  try {
    core.info('request searchIssues')
    const response = await axios.post(
      `https://${subDomain}.atlassian.net/rest/api/3/search`,
      {
        jql: jQLQuery,
        maxResults: 100,
        fieldsByKeys: true,
        fields: properties,
        startAt: 0
      },
      getAuthHeaders(email, token)
    )
    core.info(`searchIssues successful`)
    let issues: SearchedJiraIssue[] = []
    if (response?.data?.issues && response?.data?.issues.length > 0) {
      issues = response.data.issues
    }
    return issues
  } catch (error: unknown) {
    core.error('error during searchIssues request')
    if (axios.isAxiosError(error)) {
      core.error(error.message)
      core.error(JSON.stringify(error.toJSON))
    }
    return Promise.reject(error)
  }
}

export const createIssue = async (
  context: JiraContext,
  data: JiraIssue
): Promise<CreatedIssue> => {
  const {subDomain, email, token} = context
  try {
    core.info('request createIssue')
    core.info(`createIssue:${JSON.stringify(data)}`)
    const response = await axios.post(
      `https://${subDomain}.atlassian.net/rest/api/3/issue`,
      data,
      getAuthHeaders(email, token)
    )
    core.info(`createIssue successful`)
    return response?.data
  } catch (error: unknown) {
    core.error('error during createIssue request')
    if (axios.isAxiosError(error)) {
      core.error(error.message)
      core.error(JSON.stringify(error.toJSON))
    }
    return Promise.reject(error)
  }
}

const getAuthHeaders = (email: string, token: string): AuthHeaders => {
  return {
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString(
        'base64'
      )}`,
      Accept: 'application/json'
    }
  }
}
