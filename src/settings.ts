import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import {copyDirectory} from './gitUtils'

export const configureSettings = (
  releaseVersion: string,
  workspace: string,
  settingsPath: string,
  versionPrefix: string,
  mainBranch: string
): void => {
  core.info(`settingsPath:${settingsPath}`)
  const filePath = path.resolve(workspace, settingsPath)
  const rawData = fs.readFileSync(filePath, 'utf8')
  const settings = JSON.parse(rawData)
  core.info(`current settings:${rawData}`)
  const versions = releaseVersion.split('.')
  const majorVersion = versions[0]
  const currentReleaseSettings = {
    artifact: {
      ...settings[mainBranch].artifact,
      source: settings[mainBranch].artifact.source.replace(
        mainBranch,
        `release_${majorVersion}.0`
      )
    },
    database: {
      ...settings[mainBranch].database
    }
  }
  settings.release.push(currentReleaseSettings)
  const newMainSettings = settings[mainBranch]
  const nextMajorVersion = parseInt(majorVersion) + 1
  const nextArtifactVersion = `${versionPrefix}${nextMajorVersion}0`
  const nextDbVersion = `${versionPrefix}0.0${nextMajorVersion}`
  core.info(`nextArtifactVersion:${nextArtifactVersion}`)
  core.info(`nextDbVersion:${nextDbVersion}`)
  newMainSettings.artifact.version = nextArtifactVersion
  newMainSettings.database.version = nextDbVersion
  const strSettings = JSON.stringify(settings, null, '\t')
  core.info(`new settings:${strSettings}`)
  fs.writeFileSync(filePath, strSettings)
  core.info('settings changed')
}

interface VersionsSettings {
  currentDbVersion: string
  nextDbVersion: string
  nextArtifactVersion: string
  currentArtifactVersion: string
  previousArtifactVersion: string
}

export const getVersionsFromSettings = (
  workspace: string,
  settingsPath: string,
  mainBranch: string
): VersionsSettings => {
  core.info(`settingsPath:${settingsPath}`)
  const filePath = path.resolve(workspace, settingsPath)
  const rawData = fs.readFileSync(filePath, 'utf8')
  const settings = JSON.parse(rawData)
  core.info(`current settings:${rawData}`)
  return {
    nextDbVersion: settings[mainBranch].database.version,
    currentDbVersion:
      settings.release[settings.release.length - 1].database.version,
    nextArtifactVersion: settings[mainBranch].artifact.version,
    currentArtifactVersion:
      settings.release[settings.release.length - 1].artifact.version,
    previousArtifactVersion:
      settings.release[settings.release.length - 2].artifact.version
  }
}

export const loadCodeOwners = (workspace: string): string => {
  return fs.readFileSync(
    path.resolve(workspace, '.github', 'CODEOWNERS'),
    'utf8'
  )
}

export const writeCodeOwners = (
  workspace: string,
  codeOwners: string
): void => {
  return fs.writeFileSync(
    path.resolve(workspace, '.github', 'CODEOWNERS'),
    codeOwners
  )
}

export const configureAppSettings = async (
  previousArtifactVersion: string,
  currentArtifactVersion: string,
  workspace: string,
  appSettingsPath: string
): Promise<void> => {
  const copyFrom = path.resolve(
    workspace,
    appSettingsPath,
    `${previousArtifactVersion}`
  )
  const copyTo = path.resolve(
    workspace,
    appSettingsPath,
    `${currentArtifactVersion}`
  )
  await copyDirectory(copyFrom, copyTo)
}
