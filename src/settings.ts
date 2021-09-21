import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'

export const configureSettings = async (
  releaseVersion: string,
  workspace: string,
  settingsPath: string,
  versionPrefix: string
): Promise<void> => {
  const filePath = path.resolve(workspace, settingsPath)
  const rawData = fs.readFileSync(filePath, 'utf8')
  const settings = JSON.parse(rawData)
  const currentReleaseSettings = settings.develop
  settings.release.push(currentReleaseSettings)
  const newDevelopSettings = settings.develop
  const versions = releaseVersion.split('.')
  const majorVersion = versions[0]
  const nextArtifactVersion = `${versionPrefix}${majorVersion}`
  const nextDbVersion = `${versionPrefix}0.0${majorVersion}`
  newDevelopSettings.artifact.version = nextArtifactVersion
  newDevelopSettings.database.version = nextDbVersion
  const strSettings = JSON.stringify(settings)
  core.info(`new settings:${strSettings}`)
  fs.writeFileSync(filePath, strSettings)
}
