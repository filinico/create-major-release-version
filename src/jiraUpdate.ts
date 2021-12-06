import * as core from '@actions/core'
import {
  CreateConfluencePage,
  JiraContext,
  JiraVersion,
  createConfluencePage,
  createIssue,
  createVersion,
  listProjectVersions,
  searchIssues
} from './jiraApi'

export const configureJira = async (
  jiraContext: JiraContext,
  releaseVersion: string,
  tagPrefix: string
): Promise<void> => {
  const majorVersion = `${tagPrefix}${releaseVersion}.0`
  await createVersionsOfProjects(jiraContext, majorVersion)
  const {masterProjectId, masterProjectKey, masterIssueType} = jiraContext
  const masterTicketVersion = await createIfNotExistsJiraVersion(
    jiraContext,
    majorVersion,
    parseInt(masterProjectId),
    masterProjectKey
  )

  if (masterTicketVersion && masterTicketVersion.id) {
    core.info(
      `request creation of master ticket version ${majorVersion} with id  ${masterTicketVersion.id}`
    )
    await createMasterTicket(
      majorVersion,
      masterIssueType,
      masterProjectId,
      masterTicketVersion.id,
      jiraContext
    )
  }
}

const createVersionsOfProjects = async (
  jiraContext: JiraContext,
  majorVersion: string
): Promise<void> => {
  const {projectsIds, projectsKeys} = jiraContext
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

export const createMasterTicket = async (
  version: string,
  masterIssueType: string,
  masterProjectId: string,
  masterTicketVersionId: string,
  jiraContext: JiraContext
): Promise<void> => {
  const masterTicket = await getMasterTicketKey(jiraContext, version)
  if (!masterTicket) {
    await createIssue(jiraContext, {
      update: {},
      fields: {
        summary: `${version} Master Ticket`,
        issuetype: {
          id: masterIssueType
        },
        project: {
          id: masterProjectId
        },
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  text: 'Not released yet.',
                  type: 'text'
                }
              ]
            }
          ]
        },
        fixVersions: [
          {
            id: masterTicketVersionId
          }
        ],
        customfield_23944: {
          value: 'Major'
        },
        customfield_23710: {
          value: 'Power App',
          child: {
            value: 'Treasury Management (CTM)'
          }
        },
        customfield_21603: {
          value: 'Treasury Management (CTM)'
        },
        customfield_12803: {
          id: masterTicketVersionId
        }
      }
    })
  }
}

export const getMasterTicketKey = async (
  context: JiraContext,
  fixVersion: string
): Promise<string | null> => {
  const {masterProjectKey} = context
  const masterTicketQuery = `project = ${masterProjectKey} AND fixVersion in (${fixVersion})`
  core.info(`masterTicketQuery:[${masterTicketQuery}]`)
  const issues = await searchIssues(context, masterTicketQuery, ['summary'])
  let masterTicketIssueKey: string | null = null
  if (issues && issues.length === 1) {
    masterTicketIssueKey = issues[0].key
  }
  core.info(`masterTicketIssueKey:${masterTicketIssueKey}`)
  return masterTicketIssueKey
}

export const createReleaseContentPage = async (
  context: JiraContext,
  releaseVersion: string,
  contentPage: string
): Promise<void> => {
  const {subDomain, confluenceSpaceKey, ancestorPage} = context
  const confluencePage: CreateConfluencePage = {
    title: `Release content of major version ${releaseVersion}`,
    type: 'page',
    space: {
      key: confluenceSpaceKey
    },
    ancestors: [
      {
        id: parseInt(ancestorPage)
      }
    ],
    body: {
      storage: {
        representation: 'storage',
        value: contentPage
      }
    }
  }

  const createdPage = await createConfluencePage(context, confluencePage)
  core.info(
    `created confluence page: https://${subDomain}.atlassian.net/wiki${createdPage._links.webui}`
  )
}
