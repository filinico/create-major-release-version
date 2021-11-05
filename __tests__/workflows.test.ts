import path from 'path'
import fs from 'fs'
import {
  configureAssignProjectWorkflow,
  configureSyncWorkflow,
  configureSyncWorkflowPreviousRelease,
  Workflow
} from '../src/workflows'
import * as yaml from 'js-yaml'
import {removeFile} from '../src/gitUtils'

const releaseVersion = '11.0'
const releaseBranch = 'release/11.0'
const previousReleaseBranch = 'release/10.0'
const workspace = './__tests__/testData/workflows'
const syncWorkflowFile = 'sync.yml'
const syncWorkflowTemplatePath = path.resolve(`${workspace}/syncTemplate.yml`)
const syncWorkflowPath = path.resolve(`${workspace}/${syncWorkflowFile}`)
const assignProjectWorkflowFile = 'assignProject.yml'
const assignProjectWorkflowTemplatePath = path.resolve(
  `${workspace}/assignProjectTemplate.yml`
)
const assignProjectWorkflowPath = path.resolve(
  `${workspace}/${assignProjectWorkflowFile}`
)

test('setup sync workflow for next version', async () => {
  const syncRawData = fs.readFileSync(syncWorkflowTemplatePath, 'utf8')
  fs.writeFileSync(syncWorkflowPath, syncRawData)
  configureSyncWorkflow(releaseVersion, workspace, syncWorkflowFile, 'main')
  const newData = fs.readFileSync(syncWorkflowPath, 'utf8')
  const object = yaml.load(newData, {filename: syncWorkflowPath})
  const workflow = object as Workflow
  expect(workflow.name).toEqual('Sync 11.0 upwards')
  expect(workflow.on.push.branches[0]).toEqual(releaseBranch)
  expect(workflow.jobs['sync-branches'].steps[2].with.SOURCE_BRANCH).toEqual(
    releaseBranch
  )
  expect(workflow.jobs['sync-branches'].steps[2].with.TARGET_BRANCH).toEqual(
    'main'
  )
  await removeFile(syncWorkflowPath)
})

test('setup sync workflow for previous version', async () => {
  const syncRawData = fs.readFileSync(syncWorkflowTemplatePath, 'utf8')
  fs.writeFileSync(syncWorkflowPath, syncRawData)
  configureSyncWorkflowPreviousRelease(
    releaseVersion,
    workspace,
    syncWorkflowFile
  )
  const newData = fs.readFileSync(syncWorkflowPath, 'utf8')
  const object = yaml.load(newData, {filename: syncWorkflowPath})
  const workflow = object as Workflow
  expect(workflow.jobs['sync-branches'].steps[2].with.TARGET_BRANCH).toEqual(
    releaseBranch
  )
  expect(workflow.name).toEqual('Sync 10.0 upwards')
  expect(workflow.on.push.branches[0]).toEqual(previousReleaseBranch)
  expect(workflow.jobs['sync-branches'].steps[2].with.SOURCE_BRANCH).toEqual(
    previousReleaseBranch
  )
  await removeFile(syncWorkflowPath)
})

test('setup assignProject workflow for next version', async () => {
  const assignProjectRawData = fs.readFileSync(
    assignProjectWorkflowTemplatePath,
    'utf8'
  )
  fs.writeFileSync(assignProjectWorkflowPath, assignProjectRawData)
  configureAssignProjectWorkflow(
    workspace,
    assignProjectWorkflowFile,
    releaseVersion,
    '1234'
  )
  const newData = fs.readFileSync(assignProjectWorkflowPath, 'utf8')
  const object = yaml.load(newData, {filename: assignProjectWorkflowPath})
  const workflow = object as Workflow
  expect(workflow.name).toEqual('Assign 11.0 project')
  expect(workflow.on.pull_request.branches[0]).toEqual(releaseBranch)
  expect(
    workflow.jobs['assign-project'].steps[0].with.PROJECT_COLUMN_ID
  ).toEqual('1234')
  await removeFile(assignProjectWorkflowPath)
})
