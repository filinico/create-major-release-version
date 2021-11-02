import * as core from '@actions/core'
import * as github from '@actions/github'
import {onReleaseCreated} from './eventHandler'

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('GITHUB_TOKEN', {required: true})
    const settingsPath = core.getInput('SETTINGS_FILE', {required: true})
    const versionPrefix = core.getInput('VERSION_PREFIX', {required: true})
    const tagPrefix = core.getInput('TAG_PREFIX', {required: true})
    const gitEmail = core.getInput('GIT_USER_EMAIL', {required: true})
    const gitUser = core.getInput('GIT_USER_NAME', {required: true})
    const workflowPath = core.getInput('WORKFLOW_FILE', {required: true})
    const versionPath = core.getInput('VERSION_FILE', {required: true})
    const scriptsPath = core.getInput('SCRIPTS_PATH', {required: true})

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
      tagPrefix,
      gitUser,
      gitEmail,
      workflowPath,
      versionPath,
      scriptsPath
    }

    const jiraContext = {
      subDomain: core.getInput('JIRA_SUBDOMAIN', {required: true}),
      email: core.getInput('JIRA_USER', {required: true}),
      token: core.getInput('JIRA_TOKEN', {required: true}),
      projectsIds: core
        .getInput('JIRA_PROJECTS_IDS', {required: true})
        .split(','),
      projectsKeys: core
        .getInput('JIRA_PROJECTS_KEYS', {required: true})
        .split(','),
      masterProjectId: core.getInput('JIRA_MASTER_PROJECT_ID', {
        required: true
      }),
      masterProjectKey: core.getInput('JIRA_MASTER_PROJECT_KEY', {
        required: true
      })
    }

    core.info(`GITHUB_EVENT_NAME=${process.env.GITHUB_EVENT_NAME}`)
    core.info(`GITHUB context action=${gitHubContext.context.payload.action}`)
    if (
      process.env.GITHUB_EVENT_NAME === 'release' &&
      github.context.payload.action === 'created'
    ) {
      core.info(`start onReleaseCreated`)
      const releaseInfo = await onReleaseCreated(gitHubContext, jiraContext)
      core.setOutput('RELEASE_INFO', releaseInfo)
      core.info(`onReleaseCreated finished`)
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    core.setFailed(error.message)
  }
}

run()
