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
