import fs from 'fs'
import path from 'path'

export const adaptContentForMajorVersion = (
  workspace: string,
  contentPath: string,
  releaseVersion: string
): string => {
  const filePath = path.resolve(workspace, contentPath)
  const rawData = fs.readFileSync(filePath, 'utf8')
  return rawData.replace(/{{RELEASE_VERSION}}/g, releaseVersion)
}
