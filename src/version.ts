export const getVersionFromBranch = (
  branchName: string,
  branchType: string
): string => {
  if (branchName.includes(branchType)) {
    const sourceBranchSuffixArray = branchName.split('/')
    if (sourceBranchSuffixArray.length > 1)
      return sourceBranchSuffixArray[sourceBranchSuffixArray.length - 1]
  }
  return branchName
}
