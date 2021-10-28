import * as core from '@actions/core'
import * as os from 'os'
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

export const fetch = async (branchName: string): Promise<void> => {
  const {stderr} = await exec(`git fetch --no-tags origin ${branchName}`)
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
  const {stderr} = await exec(`git push -u origin HEAD`)
  if (stderr) {
    core.error(stderr.toString())
  }
}

export const diff = async (
  releaseBranch: string,
  main: string,
  settingPath: string
): Promise<string | Buffer | null | undefined> => {
  const {stdout, stderr} = await exec(
    `git diff --name-only origin/${main}...origin/${releaseBranch} -- . ':(exclude).github/*' ':(exclude)${settingPath}'`
  )
  if (stderr) {
    core.error(stderr.toString())
  }
  return stdout
}

export const mergeIntoCurrent = async (
  mergeFrom: string,
  currentBranch: string
): Promise<void> => {
  const {stderr} = await exec(
    `git merge ${mergeFrom} --commit -m "Merge branch ${mergeFrom} into ${currentBranch} get configuration from ${mergeFrom}`
  )
  if (stderr) {
    core.error(stderr.toString())
  }
}

export const copyDirectory = async (
  copyFrom: string,
  copyTo: string
): Promise<void> => {
  let command = `cp -r ${copyFrom}/ ${copyTo}/`
  if (os.platform() === 'win32') {
    command = `xcopy ${copyFrom} ${copyTo} /E /H /C /I`
  }
  const {stderr} = await exec(command)
  if (stderr) {
    core.error(stderr.toString())
  }
}

export const removeDirectory = async (directory: string): Promise<void> => {
  let command = `rm -rf ${directory}`
  if (os.platform() === 'win32') {
    command = `rmdir /s /q ${directory}`
  }
  const {stderr} = await exec(command)
  if (stderr) {
    core.error(stderr.toString())
  }
}

export const renameFile = async (
  oldFile: string,
  newFile: string
): Promise<void> => {
  let command = `mv ${oldFile} ${newFile}`
  if (os.platform() === 'win32') {
    const filename = newFile.substring(newFile.lastIndexOf('\\') + 1)
    command = `rename ${oldFile} ${filename}`
  }
  const {stderr} = await exec(command)
  if (stderr) {
    core.error(stderr.toString())
  }
}
