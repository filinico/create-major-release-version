import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  addAuthor,
  commit,
  createBranch,
  diff,
  doesBranchExist,
  fetch,
  gotoDirectory,
  mergeIntoCurrent,
  push
} from './gitUtils'
import {
  applyNextVersion,
  getNextVersion,
  getPreviousVersion,
  getVersionFromTag
} from './version'
import {configureSettings, getNextDbVersion} from './settings'
import {configureWorkflow, configureWorkflowPreviousRelease} from './workflows'
import {mergePullRequest, openPullRequest} from './gitHubApi'
import {Context} from '@actions/github/lib/context'
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
  versionPath: string
  scriptsPath: string
}

export const onReleaseCreated = async (
  actionContext: GitHubContext
): Promise<void> => {
  const {context, workspace, tagPrefix, gitEmail, gitUser, settingsPath} =
    actionContext
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
  const previousVersion = getPreviousVersion(releaseVersion)
  core.info(`Previous version:${previousVersion}`)
  const previousReleaseBranch = `release/${previousVersion}`
  core.info(`Previous release branch:${previousReleaseBranch}`)
  if (!tag_name.endsWith('.0.0')) {
    core.error(
      `Release branch ${releaseBranch} is not a major version ending with .0.0`
    )
    return
  }
  await gotoDirectory(workspace)
  const releaseBranchExists = await doesBranchExist(releaseBranch)
  const conflictsExists = await diff(
    previousReleaseBranch,
    target_commitish,
    settingsPath
  )
  if (releaseBranchExists || conflictsExists) {
    core.error(
      `Cannot proceed with the creation of the release branch ${releaseBranch}:`
    )
    if (releaseBranchExists) {
      core.error(`Release branch ${releaseBranch} already exists`)
    }
    if (conflictsExists) {
      core.error(
        `There are conflicts between the release branch ${releaseBranch} and ${target_commitish}. Please resolve the conflicts and create a new GitHub release.`
      )
    }
    return
  }

  await addAuthor(gitEmail, gitUser)
  core.info(`Author identity added`)
  await configurePreviousVersion(
    actionContext,
    releaseVersion,
    previousVersion,
    previousReleaseBranch
  )
  await createNewMajorVersion(
    actionContext,
    releaseVersion,
    releaseBranch,
    previousVersion,
    previousReleaseBranch
  )
  await configureNextVersion(
    actionContext,
    releaseVersion,
    previousVersion,
    previousReleaseBranch
  )
}

const createNewMajorVersion = async (
  actionContext: GitHubContext,
  releaseVersion: string,
  releaseBranch: string,
  previousVersion: string,
  previousReleaseBranch: string
): Promise<void> => {
  const {context, workspace, settingsPath, versionPrefix, workflowPath} =
    actionContext
  const {
    payload: {
      release: {target_commitish}
    }
  } = context
  core.info(`Start creation of new major version`)
  await fetch()
  core.info(`fetch successful`)
  await createBranch(releaseBranch, target_commitish)
  core.info(`Release branch created`)
  await mergeIntoCurrent(previousReleaseBranch, releaseBranch)
  core.info(`Previous release branch merged`)
  configureSettings(
    releaseVersion,
    workspace,
    settingsPath,
    versionPrefix,
    target_commitish
  )
  configureWorkflow(releaseVersion, workspace, workflowPath, target_commitish)
  await commit(`setup new version ${releaseVersion}`)
  core.info(`changes committed`)
  await push()
  core.info(`changes pushed`)
  core.info(`New major version created`)
}

const configurePreviousVersion = async (
  actionContext: GitHubContext,
  releaseVersion: string,
  previousVersion: string,
  previousReleaseBranch: string
): Promise<void> => {
  const {workspace, workflowPath} = actionContext
  core.info(`Start configuration of previous version`)
  await fetch()
  core.info(`fetch successful`)
  const configurationBranch = `automation/configure-previous-version-${previousVersion}`
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

const configureNextVersion = async (
  actionContext: GitHubContext,
  releaseVersion: string,
  previousVersion: string,
  previousReleaseBranch: string
): Promise<void> => {
  const {context, workspace, settingsPath, versionPath} = actionContext
  const {
    payload: {
      release: {target_commitish}
    }
  } = context
  core.info(`Start configuration of next version`)
  await fetch()
  core.info(`fetch successful`)
  const nextVersion = getNextVersion(releaseVersion)
  const configurationBranch = `automation/configure-next-version-${nextVersion}`
  await createBranch(configurationBranch, target_commitish)
  await mergeIntoCurrent(previousReleaseBranch, configurationBranch)
  core.info(`Release branch merged`)
  const nextDbVersion = getNextDbVersion(
    workspace,
    settingsPath,
    target_commitish
  )
  applyNextVersion(nextDbVersion, workspace, versionPath)
  core.info(`Next version modified to ${nextDbVersion}`)
}
