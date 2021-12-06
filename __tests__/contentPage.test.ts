import {adaptContentForMajorVersion} from '../src/contentPage'

const releaseVersion = '11.0'
const workspace = './__tests__/testData'
const templateFile = 'contentPage.xml'

test('create content page from template', async () => {
  const contentPage = adaptContentForMajorVersion(
    workspace,
    templateFile,
    releaseVersion
  )
  expect(contentPage).toMatchSnapshot()
})
