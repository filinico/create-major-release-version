import * as core from '@actions/core'
import * as github from '@actions/github'
import {commit, createBranch, gotoDirectory, push} from './gitUtils'
import {Context} from '@actions/github/lib/context'
import {configureSettings} from './settings'
import {getVersionFromBranch} from './version'
type GitHub = ReturnType<typeof github.getOctokit>

export interface GitHubContext {
  octokit: GitHub
  context: Context
  workspace: string
  settingsPath: string
  versionPrefix: string
}

export const onReleaseCreated = async (
  actionContext: GitHubContext
): Promise<void> => {
  const {context, workspace, settingsPath, versionPrefix} = actionContext
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
  const releaseVersion = getVersionFromBranch(target_commitish, 'release')
  core.info(`Release version:${releaseVersion}`)

  await gotoDirectory(workspace)
  await createBranch(releaseVersion)
  await configureSettings(
    releaseVersion,
    workspace,
    settingsPath,
    versionPrefix
  )
  await commit(`setup new version ${releaseVersion}`)
  await push()
}
