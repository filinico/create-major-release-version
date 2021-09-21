import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  commit,
  createBranch,
  doesBranchExist,
  fetch,
  gotoDirectory,
  push
} from './gitUtils'
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
}

export const onReleaseCreated = async (
  actionContext: GitHubContext
): Promise<void> => {
  const {context, workspace, settingsPath, versionPrefix, tagPrefix} =
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
  if (!tag_name.endsWith('.0.0')) {
    core.error(
      `Release branch ${releaseBranch} is not a major version ending with .0.0`
    )
    return
  }
  await gotoDirectory(workspace)
  if (!(await doesBranchExist(releaseBranch))) {
    await fetch()
    await createBranch(releaseBranch, target_commitish)
    core.info(`Release branch checkout`)
    await configureSettings(
      releaseVersion,
      workspace,
      settingsPath,
      versionPrefix
    )
    await commit(`setup new version ${releaseVersion}`)
    core.info(`changes committed`)
    await push()
    core.info(`changes pushed`)
  } else {
    core.error(`Release branch ${releaseBranch} already exists`)
  }
}
