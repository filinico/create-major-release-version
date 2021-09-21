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

export const createBranch = async (releaseVersion: string): Promise<void> => {
  const {stderr} = await exec(
    `git checkout -b release/${releaseVersion} develop`
  )
  if (stderr) {
    core.error(stderr.toString())
  }
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
