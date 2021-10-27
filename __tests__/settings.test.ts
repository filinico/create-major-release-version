import path from 'path'
import fs from 'fs'
import {configureSettings, getNextDbVersion} from '../src/settings'

const workspace = './__tests__/testData'
const settingFile = 'config.json'
const settingTemplatePath = path.resolve(`${workspace}/configTemplate.json`)
const settingPath = path.resolve(`${workspace}/${settingFile}`)
const previousDbVersion = 'v.0.010'
const currentDbVersion = 'v.0.011'
const nextDbVersion = 'v.0.012'

beforeEach(() => {
  const configTemplatePath = path.resolve(settingTemplatePath)
  const rawData = fs.readFileSync(configTemplatePath, 'utf8')
  const configPath = path.resolve(settingPath)
  fs.writeFileSync(configPath, rawData)
})

test('setup settings for next version', async () => {
  const previousDbVersions = getNextDbVersion(workspace, settingFile, 'main')
  expect(previousDbVersions.currentDbVersion).toEqual(previousDbVersion)
  expect(previousDbVersions.nextDbVersion).toEqual(currentDbVersion)
  configureSettings('11.0', workspace, settingFile, 'v.', 'main')
  const configPath = path.resolve(settingPath)
  const rawData = fs.readFileSync(configPath, 'utf8')
  const settings = JSON.parse(rawData)
  const releaseSettings = settings.release[settings.release.length - 1]
  expect(releaseSettings.artifact.version).toEqual('v.110')
  expect(releaseSettings.artifact.source).toEqual(
    'myArtifact/release_11.0/artifact.zip'
  )
  expect(releaseSettings.database.version).toEqual(currentDbVersion)
  const mainSettings = settings.main
  expect(mainSettings.artifact.version).toEqual('v.120')
  expect(mainSettings.database.version).toEqual(nextDbVersion)
  const nextVersions = getNextDbVersion(workspace, settingFile, 'main')
  expect(nextVersions.currentDbVersion).toEqual(currentDbVersion)
  expect(nextVersions.nextDbVersion).toEqual(nextDbVersion)
})
