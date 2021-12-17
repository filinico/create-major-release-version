import path from 'path'
import fs from 'fs'
import {
  configureAppSettings,
  configureSettings,
  getVersionsFromSettings
} from '../src/settings'
import {removeDirectory, removeFile} from '../src/gitUtils'

const workspace = './__tests__/testData/settings'
const settingFile = 'config.json'
const settingTemplatePath = path.resolve(workspace, 'configTemplate.json')
const settingPath = path.resolve(workspace, settingFile)
const appSettingsPath = 'appSettings'
const previousDbVersion = 'v.0.010'
const currentDbVersion = 'v.0.011'
const nextDbVersion = 'v.0.012'
const previousArtifactVersion = 'v.100'
const currentArtifactVersion = 'v.110'
const nextArtifactVersion = 'v.120'

test('setup settings for next version', async () => {
  const templateData = fs.readFileSync(settingTemplatePath, 'utf8')
  fs.writeFileSync(settingPath, templateData)

  const previousVersions = getVersionsFromSettings(
    workspace,
    settingFile,
    'main'
  )
  expect(previousVersions.currentDbVersion).toEqual(previousDbVersion)
  expect(previousVersions.nextDbVersion).toEqual(currentDbVersion)
  expect(previousVersions.nextArtifactVersion).toEqual(currentArtifactVersion)
  expect(previousVersions.currentArtifactVersion).toEqual(
    previousArtifactVersion
  )
  configureSettings('11.0', workspace, settingFile, 'v.', 'main')
  const configPath = path.resolve(settingPath)
  const rawData = fs.readFileSync(configPath, 'utf8')
  const settings = JSON.parse(rawData)
  const releaseSettings = settings.release[settings.release.length - 1]
  expect(releaseSettings.artifact.version).toEqual(currentArtifactVersion)
  expect(releaseSettings.artifact.source).toEqual(
    'myArtifact/release_11.0/artifact.zip'
  )
  expect(releaseSettings.database.version).toEqual(currentDbVersion)
  const mainSettings = settings.main
  expect(mainSettings.artifact.version).toEqual(nextArtifactVersion)
  expect(mainSettings.database.version).toEqual(nextDbVersion)
  const nextVersions = getVersionsFromSettings(workspace, settingFile, 'main')
  expect(nextVersions.currentDbVersion).toEqual(currentDbVersion)
  expect(nextVersions.nextDbVersion).toEqual(nextDbVersion)
  expect(nextVersions.nextArtifactVersion).toEqual(nextArtifactVersion)
  expect(nextVersions.currentArtifactVersion).toEqual(currentArtifactVersion)
  expect(nextVersions.previousArtifactVersion).toEqual(previousArtifactVersion)
  await removeFile(settingPath)
})

test('setup app settings for new version', async () => {
  const templateData = fs.readFileSync(settingTemplatePath, 'utf8')
  const appSettingsFile = path.resolve(
    workspace,
    appSettingsPath,
    'v.090',
    settingFile
  )
  fs.writeFileSync(appSettingsFile, templateData)
  const versions = getVersionsFromSettings(
    workspace,
    settingTemplatePath,
    'main'
  )
  await configureAppSettings(
    versions.previousArtifactVersion,
    versions.currentArtifactVersion,
    workspace,
    appSettingsPath
  )
  const newVersionFolder = path.resolve(
    workspace,
    appSettingsPath,
    versions.currentArtifactVersion
  )
  fs.readFileSync(path.resolve(newVersionFolder, settingFile), 'utf8')
  await removeFile(appSettingsFile)
  await removeDirectory(newVersionFolder)
})
