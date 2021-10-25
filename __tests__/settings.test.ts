import path from 'path'
import fs from 'fs'
import {configureSettings} from '../src/settings'

beforeEach(() => {
  const configTemplatePath = path.resolve(
    './__tests__/testData/configTemplate.json'
  )
  const rawData = fs.readFileSync(configTemplatePath, 'utf8')
  const configPath = path.resolve('./__tests__/testData/config.json')
  fs.writeFileSync(configPath, rawData)
})

test('setup settings for next version', async () => {
  configureSettings('11.0', './__tests__/testData', 'config.json', 'v.')
  const configTemplatePath = path.resolve('./__tests__/testData/config.json')
  const rawData = fs.readFileSync(configTemplatePath, 'utf8')
  const settings = JSON.parse(rawData)
  const releaseSettings = settings.release[settings.release.length - 1]
  expect(releaseSettings.artifact.version).toEqual('v.110')
  expect(releaseSettings.artifact.source).toEqual(
    'myArtifact/release_11.0/artifact.zip'
  )
  expect(releaseSettings.database.version).toEqual('v.0.011')
  const developSettings = settings.develop
  expect(developSettings.artifact.version).toEqual('v.120')
  expect(developSettings.database.version).toEqual('v.0.012')
})
