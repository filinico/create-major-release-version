import * as core from '@actions/core'
import {exec} from 'promisify-child-process'

export const gotoDirectory = async (directoryPath: string): Promise<void> => {
  const {stderr} = await exec(`cd ${directoryPath}`)
  if (stderr) {
    core.error(stderr.toString())
  }
}

export const createDirectory = async (directoryName: string): Promise<void> => {
  const {stderr} = await exec(`mkdir ${directoryName}`)
  if (stderr) {
    core.error(stderr.toString())
  }
}

export const createBranch = async (
  branchName: string,
  target: string
): Promise<void> => {
  const {stderr} = await exec(`git checkout -b ${branchName} origin/${target}`)
  if (stderr) {
    core.error(stderr.toString())
  }
}

export const doesBranchExist = async (branchName: string): Promise<boolean> => {
  const {stderr, stdout} = await exec(`git ls-remote origin ${branchName}`)
  if (stderr) {
    core.error(stderr.toString())
  }
  if (stdout) {
    return true
  } else {
    return false
  }
}

export const fetch = async (): Promise<void> => {
  const {stderr} = await exec(`git fetch --all`)
  if (stderr) {
    core.error(stderr.toString())
  }
}

export const addAuthor = async (
  gitUserEmail: string,
  gitUsername: string
): Promise<void> => {
  await exec(`git config user.email ${gitUserEmail}`)
  await exec(`git config user.name ${gitUsername}`)
}

export const commit = async (commitMessage: string): Promise<void> => {
  await exec(`git add .`)
  const {stderr} = await exec(`git commit -m "${commitMessage}"`)
  if (stderr) {
    core.error(stderr.toString())
  }
}

export const push = async (): Promise<void> => {
  const {stderr} = await exec(`git push`)
  if (stderr) {
    core.error(stderr.toString())
  }
}
