import * as core from '@actions/core'
import {GitHubContext} from './eventHandler'

export const openPullRequest = async (
  actionContext: GitHubContext,
  title: string,
  body: string,
  sourceBranch: string,
  targetBranch: string
): Promise<number> => {
  const {octokit, context} = actionContext
  const {
    repo: {repo, owner}
  } = context
  try {
    const {data: pullRequest} = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      body,
      head: sourceBranch,
      base: targetBranch,
      draft: false
    })
    return pullRequest.number
  } catch (err: unknown) {
    core.error(
      `There was an error during the opening of pull request ${sourceBranch} to ${targetBranch}`
    )
    const error = err as string
    core.error(error)
    return 0
  }
}

export const mergePullRequest = async (
  actionContext: GitHubContext,
  pullRequestId: number,
  mergeCommitMessage: string,
  mergeCommitDescription: string
): Promise<boolean> => {
  const {octokit, context} = actionContext
  const {
    repo: {repo, owner}
  } = context
  try {
    const {
      data: {merged}
    } = await octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number: pullRequestId,
      commit_message: mergeCommitDescription,
      commit_title: mergeCommitMessage,
      merge_method: 'merge'
    })
    return merged
  } catch (err: unknown) {
    core.error(
      `There was an error during the merge of pull request ${pullRequestId}`
    )
    const error = err as string
    core.error(error)
    return false
  }
}

export const createProject = async (
  actionContext: GitHubContext,
  name: string,
  description: string
): Promise<number> => {
  const {octokit, context} = actionContext
  const {
    repo: {repo, owner}
  } = context
  const {
    data: {id}
  } = await octokit.rest.projects.createForRepo({
    owner,
    repo,
    name,
    body: description
  })
  return id
}

export const createProjectColumn = async (
  actionContext: GitHubContext,
  projectId: number,
  name: string
): Promise<number> => {
  const {octokit, context} = actionContext
  const {
    repo: {repo, owner}
  } = context
  const {
    data: {id}
  } = await octokit.rest.projects.createColumn({
    owner,
    repo,
    project_id: projectId,
    name
  })
  return id
}
