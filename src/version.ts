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
