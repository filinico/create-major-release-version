import {
  applyNextVersion,
  getNextVersion,
  getPreviousVersion,
  getVersionFromTag
} from '../src/version'
import fs from 'fs'
import path from 'path'

test('extract release version from tag', async () => {
  const releaseVersion1 = getVersionFromTag('test', 'test1.0.0')
  expect(releaseVersion1).toEqual('1.0')
  const releaseVersion2 = getVersionFromTag('v', 'v1.1.2')
  expect(releaseVersion2).toEqual('1.1')
})

test('get previous release version', async () => {
  const previousVersion = getPreviousVersion('11.0')
  expect(previousVersion).toEqual('10.0')
})

test('get next release version', async () => {
  const previousVersion = getNextVersion('11.0')
  expect(previousVersion).toEqual('12.0')
})

const workspace = './__tests__/testData'
const versionFile = 'version.txt'
const versionPath = path.resolve(`${workspace}/${versionFile}`)

test('apply next version', async () => {
  fs.writeFileSync(versionPath, 'v.0.010')
  applyNextVersion('v.0.011', workspace, versionFile)
  const nextVersion = fs.readFileSync(versionPath, 'utf8')
  expect(nextVersion).toEqual('v.0.011')
})
