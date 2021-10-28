import {
  applyVersionsIntoFile,
  configureScripts,
  listFiles
} from '../src/scripts'
import path from 'path'
import fs from 'fs'
import {removeDirectory} from '../src/gitUtils'

jest.setTimeout(70000)
const workspace = './__tests__/testData'
const directoryPath = 'scripts'
const scriptsPath = path.resolve(workspace, directoryPath)

beforeEach(async () => {})

test('list files of directory recursive', async () => {
  const templatesPath = path.resolve(scriptsPath, 'templates')
  expect(listFiles(templatesPath)).toEqual([
    path.resolve(templatesPath, 'secondLevel', 'XX_anotherScript.sql'),
    path.resolve(templatesPath, 'XX_scriptTemplate.sql')
  ])
})

test('apply versions into file', async () => {
  const templatePath = path.resolve(
    scriptsPath,
    'templates',
    'XX_scriptTemplate.sql'
  )
  const rawData = fs.readFileSync(templatePath, 'utf8')
  const filePath = path.resolve(scriptsPath, 'script.sql')
  fs.writeFileSync(filePath, rawData)
  applyVersionsIntoFile(filePath, 'v.0.010', 'v.0.011')
  const newData = fs.readFileSync(filePath, 'utf8')
  expect(newData).toMatchSnapshot()
})

test('configure scripts', async () => {
  await configureScripts('v.0.010', 'v.0.011', workspace, directoryPath)
  const files = listFiles(path.resolve(scriptsPath, 'v.0.011'))
  expect(files).toHaveLength(2)
  for (const file of files) {
    const newData = fs.readFileSync(file, 'utf8')
    expect(newData).toMatchSnapshot()
    const filename = file
      .substring(file.lastIndexOf('\\') + 1)
      .substring(file.lastIndexOf('/') + 1)
    expect(filename.startsWith('XX')).toEqual(false)
    expect(filename.startsWith('v011')).toEqual(true)
  }
  await removeDirectory(path.resolve(scriptsPath, 'v.0.011'))
})
