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
  checkPreReleaseMajorVersion,
  getNextVersion,
  getPreviousVersion,
  getVersionFromTag,
  verifyPreReleaseNumbering
} from './version'
import {
  configureAppSettings,
  configureSettings,
  getVersionsFromSettings,
  loadCodeOwners,
  writeCodeOwners
} from './settings'
import {configureJira, createReleaseContentPage} from './jiraUpdate'
import {
  configureSyncWorkflow,
  configureSyncWorkflowPreviousRelease
} from './workflows'
import {mergePullRequest, openPullRequest} from './gitHubApi'
import {Context} from '@actions/github/lib/context'
import {JiraContext} from './jiraApi'
import {adaptContentForMajorVersion} from './contentPage'
import {configureProjects} from './projects'
import {configureScripts} from './scripts'

type GitHub = ReturnType<typeof github.getOctokit>

export interface GitHubContext {
  octokit: GitHub
  context: Context
  workspace: string
  settingsPath: string
  appSettingsPath: string
  versionPrefix: string
  tagPrefix: string
  gitEmail: string
  gitUser: string
  workflowPath: string
  versionPath: string
  scriptsPath: string
  assignProjectPath: string
  archiveConfigPath: string
}

interface ReleaseInfo {
  currentRelease: string
  nextRelease: string
}

export const onReleaseCreated = async (
  actionContext: GitHubContext,
  jiraContext: JiraContext
): Promise<ReleaseInfo> => {
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
  if (!verifyPreReleaseNumbering(tag_name, tagPrefix)) {
    throw new Error(
      `Tag ${tag_name} do not comply to correct versioning using prefix ${tagPrefix}. Workflow will not be executed.`
    )
  }
  if (!checkPreReleaseMajorVersion(tag_name)) {
    throw new Error(
      `Tag ${tag_name} is not a major version (x.0.0). Workflow will not be executed.`
    )
  }
  if (!prerelease) {
    throw new Error(
      `Release ${tag_name} is not a pre-release. Workflow will not be executed.`
    )
  }
  if ((target_commitish as string).includes('release')) {
    throw new Error(
      `The workflow is triggered on release branch ${target_commitish} instead of the default branch. Workflow will not be executed.`
    )
  }
  const releaseVersion = getVersionFromTag(tagPrefix, tag_name)
  core.info(`Release version:${releaseVersion}`)
  const releaseBranch = `release/${releaseVersion}`
  core.info(`Release branch:${releaseBranch}`)
  const previousVersion = getPreviousVersion(releaseVersion)
  core.info(`Previous version:${previousVersion}`)
  const previousReleaseBranch = `release/${previousVersion}`
  core.info(`Previous release branch:${previousReleaseBranch}`)
  await gotoDirectory(workspace)
  await fetch(target_commitish)
  await fetch(previousReleaseBranch)
  const releaseBranchExists = await doesBranchExist(releaseBranch)
  const conflictsExists = await diff(
    previousReleaseBranch,
    target_commitish,
    settingsPath
  )
  if (releaseBranchExists || conflictsExists) {
    if (releaseBranchExists) {
      core.error(`Release branch ${releaseBranch} already exists`)
    }
    if (conflictsExists) {
      core.error(
        `There are conflicts between the release branch ${releaseBranch} and ${target_commitish}. Please resolve the conflicts and create a new GitHub release.`
      )
    }
    throw new Error(
      `Cannot proceed with the creation of the release branch ${releaseBranch}.`
    )
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
    releaseBranch
  )
  await configureJira(jiraContext, releaseVersion, tagPrefix)
  await setupConfluence(actionContext, jiraContext, releaseVersion)
  const currentRelease = releaseVersion.replace('.0', '')
  const nextRelease = getNextVersion(releaseVersion).replace('.0', '')
  return {
    currentRelease,
    nextRelease
  }
}

const createNewMajorVersion = async (
  actionContext: GitHubContext,
  releaseVersion: string,
  releaseBranch: string,
  previousVersion: string,
  previousReleaseBranch: string
): Promise<void> => {
  const {
    context,
    workspace,
    settingsPath,
    versionPrefix,
    workflowPath,
    appSettingsPath
  } = actionContext
  const {
    payload: {
      release: {target_commitish}
    }
  } = context
  core.info(`Start creation of new major version`)
  await fetch(previousReleaseBranch)
  await fetch(target_commitish)
  core.info(`fetch successful`)
  const codeOwners = loadCodeOwners(workspace)
  await createBranch(releaseBranch, target_commitish)
  core.info(`Release branch created`)
  await mergeIntoCurrent(previousReleaseBranch, releaseBranch)
  core.info(`Previous release branch merged`)
  writeCodeOwners(workspace, codeOwners)
  configureSettings(
    releaseVersion,
    workspace,
    settingsPath,
    versionPrefix,
    target_commitish
  )
  const {previousArtifactVersion, currentArtifactVersion} =
    getVersionsFromSettings(workspace, settingsPath, target_commitish)
  await configureAppSettings(
    previousArtifactVersion,
    currentArtifactVersion,
    workspace,
    appSettingsPath
  )
  configureSyncWorkflow(
    releaseVersion,
    workspace,
    workflowPath,
    target_commitish
  )
  await configureProjects(actionContext, releaseVersion)
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
  await fetch(previousReleaseBranch)
  core.info(`fetch successful`)
  const configurationBranch = `automation/configure-previous-version-${previousVersion}`
  await createBranch(configurationBranch, previousReleaseBranch)
  configureSyncWorkflowPreviousRelease(releaseVersion, workspace, workflowPath)
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
  releaseBranch: string
): Promise<void> => {
  const {context, workspace, settingsPath, versionPath, scriptsPath} =
    actionContext
  const {
    payload: {
      release: {target_commitish}
    }
  } = context
  core.info(`Start configuration of next version`)
  await fetch(releaseBranch)
  await fetch(target_commitish)
  core.info(`fetch successful`)
  const nextVersion = getNextVersion(releaseVersion)
  const configurationBranch = `automation/configure-next-version-${nextVersion}`
  await createBranch(configurationBranch, target_commitish)
  const codeOwners = loadCodeOwners(workspace)
  await mergeIntoCurrent(releaseBranch, configurationBranch)
  core.info(`Release branch merged into ${target_commitish}`)
  writeCodeOwners(workspace, codeOwners)
  const {nextDbVersion, currentDbVersion, nextArtifactVersion} =
    getVersionsFromSettings(workspace, settingsPath, target_commitish)
  applyNextVersion(nextArtifactVersion, workspace, versionPath)
  core.info(`Next version modified to ${nextDbVersion}`)
  await configureScripts(
    currentDbVersion,
    nextDbVersion,
    nextArtifactVersion,
    workspace,
    scriptsPath
  )
  core.info(`Scripts added for next version ${nextDbVersion}`)
  await commit(`configure next version ${nextVersion} on ${target_commitish}`)
  core.info(`Next version changes committed`)
  await push()
  core.info(`Next version changes pushed`)
  const title = `Configure next version ${nextVersion} on ${target_commitish}`
  const pullRequestId = await openPullRequest(
    actionContext,
    title,
    title,
    configurationBranch,
    target_commitish
  )
  const mergeCommitMessage = `Merge pull request #${pullRequestId} from ${configurationBranch}`
  const isMerged = await mergePullRequest(
    actionContext,
    pullRequestId,
    mergeCommitMessage,
    mergeCommitMessage
  )
  if (isMerged) {
    core.info(`PR merged on ${target_commitish}`)
  } else {
    core.error(`PR not merged on ${target_commitish}`)
  }
  core.info(`Next version configured on ${target_commitish}`)
}

export const setupConfluence = async (
  actionContext: GitHubContext,
  jiraContext: JiraContext,
  releaseVersion: string
): Promise<void> => {
  const {workspace} = actionContext
  const {confluenceContentPath} = jiraContext
  const contentPage = adaptContentForMajorVersion(
    workspace,
    confluenceContentPath,
    releaseVersion
  )
  await createReleaseContentPage(jiraContext, releaseVersion, contentPage)
}
