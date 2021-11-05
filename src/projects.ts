import {createProject, createProjectColumn} from './gitHubApi'
import {GitHubContext} from './eventHandler'
import {configureAssignProjectWorkflow} from './workflows'

export interface ProjectBoard {
  inProgressColumnId: number
  doneColumnId: number
}

export const configureProjects = async (
  actionContext: GitHubContext,
  releaseVersion: string
): Promise<void> => {
  const {inProgressColumnId} = await createProjectBoard(
    actionContext,
    releaseVersion
  )
  const {workspace, assignProjectPath} = actionContext
  configureAssignProjectWorkflow(
    workspace,
    assignProjectPath,
    releaseVersion,
    inProgressColumnId.toString()
  )
  // TODO: configure workflow archive project cards
}

const createProjectBoard = async (
  actionContext: GitHubContext,
  releaseVersion: string
): Promise<ProjectBoard> => {
  const projectName = `${releaseVersion} Release Tracker`
  const projectDescription = `Progress overview of pull requests targeting the release branch ${releaseVersion}`
  const projectId = await createProject(
    actionContext,
    projectName,
    projectDescription
  )
  const inProgressColumnId = await createProjectColumn(
    actionContext,
    projectId,
    'In progress'
  )
  await createProjectColumn(actionContext, projectId, 'Review in progress')
  await createProjectColumn(actionContext, projectId, 'Reviewer approved')
  const doneColumnId = await createProjectColumn(
    actionContext,
    projectId,
    'Done'
  )
  return {
    inProgressColumnId,
    doneColumnId
  }
}
