import * as core from '@actions/core'
import * as github from '@actions/github'
import {onReleaseCreated} from './eventHandler'

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('GITHUB_TOKEN', {required: true})
    const settingsPath = core.getInput('SETTINGS_FILE', {required: true})
    const versionPrefix = core.getInput('VERSION_PREFIX', {required: true})
    const tagPrefix = core.getInput('TAG_PREFIX', {required: true})

    core.info(`GITHUB workspace=${process.env.GITHUB_WORKSPACE}`)

    if (process.env.GITHUB_WORKSPACE === undefined) {
      throw new Error('GITHUB_WORKSPACE not defined.')
    }

    const octokit = github.getOctokit(githubToken)
    const gitHubContext = {
      octokit,
      context: github.context,
      workspace: process.env.GITHUB_WORKSPACE,
      settingsPath,
      versionPrefix,
      tagPrefix
    }

    core.info(`GITHUB_EVENT_NAME=${process.env.GITHUB_EVENT_NAME}`)
    core.info(`GITHUB context action=${gitHubContext.context.payload.action}`)
    if (
      process.env.GITHUB_EVENT_NAME === 'release' &&
      github.context.payload.action === 'created'
    ) {
      core.info(`start onReleasePublished`)
      await onReleaseCreated(gitHubContext)
      core.info(`releasePublished finished`)
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    core.setFailed(error.message)
  }
}

run()
