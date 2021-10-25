import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'

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

export const getNextDbVersion = (
  workspace: string,
  settingsPath: string,
  mainBranch: string
): string => {
  core.info(`settingsPath:${settingsPath}`)
  const filePath = path.resolve(workspace, settingsPath)
  const rawData = fs.readFileSync(filePath, 'utf8')
  const settings = JSON.parse(rawData)
  core.info(`current settings:${rawData}`)
  return settings[mainBranch].database.version
}
