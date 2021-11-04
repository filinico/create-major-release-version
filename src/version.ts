import * as core from '@actions/core'
import fs from 'fs'
import path from 'path'

export const getVersionFromTag = (
  tagPrefix: string,
  tagName: string
): string => {
  const versionNumber = tagName.replace(tagPrefix, '')
  const versions = versionNumber.split('.')
  return versions.slice(0, 2).join('.')
}

export const getPreviousVersion = (releaseVersion: string): string => {
  const currentVersionNumber = parseInt(releaseVersion)
  const previousVersionNumber = currentVersionNumber - 1
  return `${previousVersionNumber}.0`
}

export const getNextVersion = (releaseVersion: string): string => {
  const currentVersionNumber = parseInt(releaseVersion)
  const previousVersionNumber = currentVersionNumber + 1
  return `${previousVersionNumber}.0`
}

export const applyNextVersion = (
  nextVersion: string,
  workspace: string,
  versionPath: string
): void => {
  const filePath = path.resolve(workspace, versionPath)
  fs.writeFileSync(filePath, nextVersion)
  core.info('version changed')
}

export const verifyPreReleaseNumbering = (
  tagName: string,
  tagPrefix: string
): boolean => {
  const regex = `^${tagPrefix}[0-9]{1,2}.[0-9]{1,2}.[0-9]{1,4}-[a-z]+$`
  return !!tagName.match(new RegExp(regex, 'g'))
}

export const checkPreReleaseMajorVersion = (tagName: string): boolean =>
  tagName.includes('.0.0')
