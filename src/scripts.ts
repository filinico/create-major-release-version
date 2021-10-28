import * as core from '@actions/core'
import {copyDirectory, renameFile} from './gitUtils'
import fs from 'fs'
import path from 'path'

export const configureScripts = async (
  currentDbVersion: string,
  nextDbVersion: string,
  workspace: string,
  scriptsPath: string
): Promise<void> => {
  const copyFrom = path.resolve(workspace, scriptsPath, 'templates')
  const copyTo = path.resolve(workspace, scriptsPath, `${nextDbVersion}`)
  await copyDirectory(copyFrom, copyTo)
  const files = listFiles(copyTo)
  for (const file of files) {
    applyVersionsIntoFile(file, currentDbVersion, nextDbVersion)
    const shorterVersion = nextDbVersion.replace('.0.', '')
    const filename = file.replace('XX', shorterVersion)
    await renameFile(file, filename)
  }
}

export const applyVersionsIntoFile = (
  scriptPath: string,
  currentDbVersion: string,
  nextDbVersion: string
): void => {
  core.info(`script Path:${scriptPath}`)
  const filePath = path.resolve(scriptPath)
  const rawData = fs.readFileSync(filePath, 'utf8')
  let script = rawData.replace(
    /{{CURRENT_DB_VERSION}}/g,
    `'${currentDbVersion}'`
  )
  script = script.replace(/{{NEXT_DB_VERSION}}/g, `'${nextDbVersion}'`)
  fs.writeFileSync(filePath, script)
}

export const listFiles = (directoryPath: string): string[] => {
  const files = fs.readdirSync(directoryPath, 'utf8')
  return files.flatMap(file => {
    const filePath = path.resolve(directoryPath, file)
    if (fs.statSync(filePath).isDirectory()) {
      return listFiles(filePath)
    } else {
      return filePath
    }
  })
}
