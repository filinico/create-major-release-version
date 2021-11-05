import * as core from '@actions/core'
import * as yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

export interface Workflow {
  name: string
  on: {
    push: {
      branches: string[]
    }
    pull_request: {
      branches: string[]
    }
  }
  jobs: {
    'sync-branches': {
      steps: {
        with: {
          SOURCE_BRANCH: string
          TARGET_BRANCH: string
        }
      }[]
    }
    'assign-project': {
      steps: {
        with: {
          PROJECT_COLUMN_ID: string
        }
      }[]
    }
  }
}

export const configureSyncWorkflow = (
  releaseVersion: string,
  workspace: string,
  workflowPath: string,
  mainBranch: string
): void => {
  const workflow = loadWorkflow(workspace, workflowPath)
  const releaseBranch = `release/${releaseVersion}`
  workflow.name = `Sync ${releaseVersion} upwards`
  workflow.on.push.branches[0] = releaseBranch
  workflow.jobs['sync-branches'].steps[2].with.SOURCE_BRANCH = releaseBranch
  workflow.jobs['sync-branches'].steps[2].with.TARGET_BRANCH = mainBranch
  writeWorkflow(workflow, workspace, workflowPath)
}

export const configureSyncWorkflowPreviousRelease = (
  releaseVersion: string,
  workspace: string,
  workflowPath: string
): void => {
  const workflow = loadWorkflow(workspace, workflowPath)
  workflow.jobs[
    'sync-branches'
  ].steps[2].with.TARGET_BRANCH = `release/${releaseVersion}`
  writeWorkflow(workflow, workspace, workflowPath)
}

export const configureAssignProjectWorkflow = (
  workspace: string,
  workflowPath: string,
  releaseVersion: string,
  projectColumnId: string
): void => {
  const workflow = loadWorkflow(workspace, workflowPath)
  const releaseBranch = `release/${releaseVersion}`
  workflow.name = `Assign ${releaseVersion} project`
  workflow.on.pull_request.branches[0] = releaseBranch
  workflow.jobs['assign-project'].steps[0].with.PROJECT_COLUMN_ID =
    projectColumnId
  writeWorkflow(workflow, workspace, workflowPath)
}

const loadWorkflow = (workspace: string, workflowPath: string): Workflow => {
  core.info(`workflowPath:${workflowPath}`)
  const filePath = path.resolve(workspace, workflowPath)
  const rawData = fs.readFileSync(filePath, 'utf8')
  const object = yaml.load(rawData, {filename: workflowPath})
  return object as Workflow
}

const writeWorkflow = (
  workflow: Workflow,
  workspace: string,
  workflowPath: string
): void => {
  const ymlWorkflow = yaml.dump(workflow)
  core.info(`new workflow:${ymlWorkflow}`)
  const filePath = path.resolve(workspace, workflowPath)
  fs.writeFileSync(filePath, ymlWorkflow)
  core.info('workflow changed')
}
