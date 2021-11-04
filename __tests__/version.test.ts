import {
  applyNextVersion,
  checkPreReleaseMajorVersion,
  getNextVersion,
  getPreviousVersion,
  getVersionFromTag,
  verifyPreReleaseNumbering
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

test('comply to pre release version numbering', async () => {
  expect(verifyPreReleaseNumbering('v32.0.0-alpha', 'v')).toBe(true)
  expect(verifyPreReleaseNumbering('v1.0.10-rc', 'v')).toBe(true)
  expect(verifyPreReleaseNumbering('v35.56.100-beta', 'v')).toBe(true)
  expect(verifyPreReleaseNumbering('v32.0.1-x', 'v')).toBe(true)
  expect(verifyPreReleaseNumbering('v33.0.10-x', 'v')).toBe(true)
  expect(verifyPreReleaseNumbering('v66.6.6666-x', 'v')).toBe(true)
})

test('is a pre release major version', async () => {
  expect(verifyPreReleaseNumbering('v10.0.0-alpha', 'v')).toBe(true)
  expect(checkPreReleaseMajorVersion('v10.0.0')).toBe(true)
})

test("don't comply to version numbering", async () => {
  expect(verifyPreReleaseNumbering('v1.0.10', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('v35.56.100', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('v32.0.1', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('v33.0.10', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('v33.0.10alpha', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('v33.0.10-1', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('v33.0.10-', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('v66.6.6666', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('pr1.0.10', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('v359.56.100', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('v33.100.10', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('v66.6.66669', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('5.66.6.66669', 'v')).toBe(false)
  expect(verifyPreReleaseNumbering('566.6.66669', 'v')).toBe(false)
})
