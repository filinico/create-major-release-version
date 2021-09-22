import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'

export const configureSettings = async (
  releaseVersion: string,
  workspace: string,
  settingsPath: string,
  versionPrefix: string
): Promise<void> => {
  core.info(`settingsPath:${settingsPath}`)
  const filePath = path.resolve(workspace, settingsPath)
  const rawData = fs.readFileSync(filePath, 'utf8')
  const settings = JSON.parse(rawData)
  core.info(`current settings:${rawData}`)
  const currentReleaseSettings = {
    ...settings.develop
  }
  settings.release.push(currentReleaseSettings)
  const newDevelopSettings = settings.develop
  const versions = releaseVersion.split('.')
  const majorVersion = parseInt(versions[0]) + 1
  const nextArtifactVersion = `${versionPrefix}${majorVersion}`
  const nextDbVersion = `${versionPrefix}0.0${majorVersion}`
  core.info(`nextArtifactVersion:${nextArtifactVersion}`)
  core.info(`nextDbVersion:${nextDbVersion}`)
  newDevelopSettings.artifact.version = nextArtifactVersion
  newDevelopSettings.database.version = nextDbVersion
  const strSettings = JSON.stringify(settings)
  core.info(`new settings:${strSettings}`)
  fs.writeFileSync(filePath, strSettings)
  core.info('settings changed')
}
