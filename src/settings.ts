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
  const versions = releaseVersion.split('.')
  const majorVersion = versions[0]
  const currentReleaseSettings = {
    artifact: {
      ...settings.develop.artifact,
      source: settings.develop.artifact.source.replace(
        'develop',
        `release_${majorVersion}.0`
      )
    },
    database: {
      ...settings.develop.database
    }
  }
  settings.release.push(currentReleaseSettings)
  const newDevelopSettings = settings.develop
  const nextMajorVersion = parseInt(majorVersion) + 1
  const nextArtifactVersion = `${versionPrefix}${nextMajorVersion}.0`
  const nextDbVersion = `${versionPrefix}0.0${nextMajorVersion}`
  core.info(`nextArtifactVersion:${nextArtifactVersion}`)
  core.info(`nextDbVersion:${nextDbVersion}`)
  newDevelopSettings.artifact.version = nextArtifactVersion
  newDevelopSettings.database.version = nextDbVersion
  const strSettings = JSON.stringify(settings, null, '\t')
  core.info(`new settings:${strSettings}`)
  fs.writeFileSync(filePath, strSettings)
  core.info('settings changed')
}
