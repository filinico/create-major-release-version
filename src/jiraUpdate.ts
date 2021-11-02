import * as core from '@actions/core'
import {
  JiraContext,
  JiraVersion,
  createVersion,
  listProjectVersions
} from './jiraApi'

export const configureJira = async (
  jiraContext: JiraContext,
  releaseVersion: string,
  tagPrefix: string
): Promise<void> => {
  const majorVersion = `${tagPrefix}${releaseVersion}.0`
  await createVersionsOfProjects(jiraContext, majorVersion)
}

const createVersionsOfProjects = async (
  jiraContext: JiraContext,
  majorVersion: string
): Promise<void> => {
  const {projectsIds, projectsKeys, masterProjectId, masterProjectKey} =
    jiraContext
  for (let i = 0; i < projectsKeys.length; i++) {
    const projectId = projectsIds[i]
    const projectKey = projectsKeys[i]
    await createIfNotExistsJiraVersion(
      jiraContext,
      majorVersion,
      parseInt(projectId),
      projectKey
    )
  }
  await createIfNotExistsJiraVersion(
    jiraContext,
    majorVersion,
    parseInt(masterProjectId),
    masterProjectKey
  )
}

export const createIfNotExistsJiraVersion = async (
  context: JiraContext,
  fixVersion: string,
  projectId: number,
  projectKey: string
): Promise<JiraVersion> => {
  const versions = await listProjectVersions(context, projectKey)
  const result = versions.filter(i => i.name === fixVersion)
  let version: JiraVersion
  if (!result || result.length === 0) {
    const requestedVersion: JiraVersion = {
      name: fixVersion,
      archived: false,
      released: false,
      projectId
    }
    core.info(`version not found. start create version:[${requestedVersion}]`)
    version = await createVersion(context, requestedVersion)
    core.info(`version created:[${version.id}]`)
  } else {
    version = result[0]
    core.info(`version found:[${version.id}]`)
  }
  return version
}
