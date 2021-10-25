import {getPreviousVersion, getVersionFromTag} from '../src/version'

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
