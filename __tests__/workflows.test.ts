import path from 'path'
import fs from 'fs'
import {
  configureWorkflow,
  configureWorkflowPreviousRelease,
  Workflow
} from '../src/workflows'
import * as yaml from 'js-yaml'

const releaseVersion = '11.0'
const releaseBranch = 'release/11.0'
const previousReleaseBranch = 'release/10.0'
const workspace = './__tests__/testData'
const workflowFile = 'workflow.yml'
const workflowTemplatePath = path.resolve(`${workspace}/workflowTemplate.yml`)
const workflowPath = path.resolve(`${workspace}/${workflowFile}`)

beforeEach(() => {
  const rawData = fs.readFileSync(workflowTemplatePath, 'utf8')
  fs.writeFileSync(workflowPath, rawData)
})

test('setup workflow for next version', async () => {
  configureWorkflow(releaseVersion, workspace, workflowFile, 'main')
  const newData = fs.readFileSync(workflowPath, 'utf8')
  const object = yaml.load(newData, {filename: workflowPath})
  const workflow = object as Workflow
  expect(workflow.name).toEqual('Sync 11.0 upwards')
  expect(workflow.on.push.branches[0]).toEqual(releaseBranch)
  expect(workflow.jobs['sync-branches'].steps[2].with.SOURCE_BRANCH).toEqual(
    releaseBranch
  )
  expect(workflow.jobs['sync-branches'].steps[2].with.TARGET_BRANCH).toEqual(
    'main'
  )
})

test('setup workflow for previous version', async () => {
  configureWorkflowPreviousRelease(releaseVersion, workspace, workflowFile)
  const newData = fs.readFileSync(workflowPath, 'utf8')
  const object = yaml.load(newData, {filename: workflowPath})
  const workflow = object as Workflow
  expect(workflow.jobs['sync-branches'].steps[2].with.TARGET_BRANCH).toEqual(
    releaseBranch
  )
  expect(workflow.name).toEqual('Sync 10.0 upwards')
  expect(workflow.on.push.branches[0]).toEqual(previousReleaseBranch)
  expect(workflow.jobs['sync-branches'].steps[2].with.SOURCE_BRANCH).toEqual(
    previousReleaseBranch
  )
})
