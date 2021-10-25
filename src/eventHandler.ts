import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  addAuthor,
  commit,
  createBranch,
  doesBranchExist,
  fetch,
  gotoDirectory,
  push
} from './gitUtils'
import {configureWorkflow, configureWorkflowPreviousRelease} from './workflows'
import {mergePullRequest, openPullRequest} from './gitHubApi'
import {Context} from '@actions/github/lib/context'
import {configureSettings} from './settings'
import {getVersionFromTag} from './version'
type GitHub = ReturnType<typeof github.getOctokit>

export interface GitHubContext {
  octokit: GitHub
  context: Context
  workspace: string
  settingsPath: string
  versionPrefix: string
  tagPrefix: string
  gitEmail: string
  gitUser: string
  workflowPath: string
}

export const onReleaseCreated = async (
  actionContext: GitHubContext
): Promise<void> => {
  const {context, workspace, tagPrefix, gitEmail, gitUser} = actionContext
  const {
    payload: {
      release: {tag_name, target_commitish, prerelease, id}
    },
    sha
  } = context
  core.info(`tag_name:${tag_name}`)
  core.info(`target_commitish:${target_commitish}`)
  core.info(`prerelease:${prerelease}`)
  core.info(`id:${id}`)
  core.info(`revision:${sha}`)
  const releaseVersion = getVersionFromTag(tagPrefix, tag_name)
  core.info(`Release version:${releaseVersion}`)
  const releaseBranch = `release/${releaseVersion}`
  core.info(`Release branch:${releaseBranch}`)
  if (!tag_name.endsWith('.0.0')) {
    core.error(
      `Release branch ${releaseBranch} is not a major version ending with .0.0`
    )
    return
  }
  await gotoDirectory(workspace)
  if (!(await doesBranchExist(releaseBranch))) {
    await addAuthor(gitEmail, gitUser)
    core.info(`Author identity added`)
    await fetch()
    core.info(`fetch successful`)
    await createNewMajorVersion(actionContext, releaseVersion, releaseBranch)
    await configurePreviousVersion(actionContext, releaseVersion)
  } else {
    core.error(`Release branch ${releaseBranch} already exists`)
  }
}

const createNewMajorVersion = async (
  actionContext: GitHubContext,
  releaseVersion: string,
  releaseBranch: string
): Promise<void> => {
  const {context, workspace, settingsPath, versionPrefix, workflowPath} =
    actionContext
  const {
    payload: {
      release: {target_commitish}
    }
  } = context
  core.info(`Start creation of new major version`)
  await createBranch(releaseBranch, target_commitish)
  core.info(`Release branch created`)
  configureSettings(releaseVersion, workspace, settingsPath, versionPrefix)
  configureWorkflow(releaseVersion, workspace, workflowPath)
  await commit(`setup new version ${releaseVersion}`)
  core.info(`changes committed`)
  await push()
  core.info(`changes pushed`)
  core.info(`New major version created`)
}

const configurePreviousVersion = async (
  actionContext: GitHubContext,
  releaseVersion: string
): Promise<void> => {
  const {workspace, workflowPath} = actionContext
  core.info(`Start configuration of previous version`)
  const currentVersionNumber = parseInt(releaseVersion)
  const previousVersionNumber = currentVersionNumber - 1
  const previousVersion = `${previousVersionNumber}.0`
  const previousReleaseBranch = `release/${previousVersion}`
  const configurationBranch = `automation/configure-${previousVersion}`
  await createBranch(configurationBranch, previousReleaseBranch)
  configureWorkflowPreviousRelease(releaseVersion, workspace, workflowPath)
  await commit(`configure new version ${releaseVersion} on ${previousVersion}`)
  core.info(`changes committed`)
  await push()
  core.info(`changes pushed`)
  const title = `Configure new version ${releaseVersion} on ${previousVersion}`
  const pullRequestId = await openPullRequest(
    actionContext,
    title,
    title,
    configurationBranch,
    previousReleaseBranch
  )
  const mergeCommitMessage = `Merge pull request #${pullRequestId} from ${configurationBranch}`
  const isMerged = await mergePullRequest(
    actionContext,
    pullRequestId,
    mergeCommitMessage,
    mergeCommitMessage
  )
  if (isMerged) {
    core.info(`PR merged on previous version`)
  } else {
    core.error(`PR not merged on previous version`)
  }
  core.info(`Previous version configured`)
}
