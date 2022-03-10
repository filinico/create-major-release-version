# Create Major Release Version GitHub Action

**Name:** `coupa/treasury_create-major-release-version`

This GitHub action creates a new major version from the current development state with all required configuration changes. :rocket:

- creates release branch
- configure settings for the new release branch
- configure Workflows on previous, current and next version
- configure next version on default branch
- creates Release tracker as GitHub project board
- create RM ticket in Jira for major version
- creates Jira releases for major version on configured Jira projects. (comma separated list)
- creates confluence page for the visibility of the release content of the major version
- Provide major version number as an output to notify the community through Slack channel

The trigger to launch the action is to publish a **release candidate**: create a new GitHub release as `prerelease` from the default branch,
provide the major version number with the tag name like `v33.0.0-alpha` and publish it. 
Note that we add a suffix as this is a release candidate and not yet the major version to be delivered to production.
The prefix of the tag is configurable as described below.

If you are interested in using this kind of action to automate your release process, we could easily adapt the configuration and see if it could fit your needs. 

## Usage instructions

This action can only be used by repositories from the Coupa organization.

Create a workflow file (e.g. `.github/workflows/create-major-release.yml`) that contains a step that `uses: coupa/treasury_create-major-release-version@v1.0`
and is triggered on `prereleased` event of GitHub release.

Here's an example workflow file:

```yaml
name: Create major release version
on:
  release:
    types: [prereleased]

jobs:
  create-major-release:
    runs-on: ubuntu-latest
    name: Create major release version
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          fetch-depth: 0
          token: ${{ secrets.TREASURY_TOKEN }}
      - name: Set up Node
        uses: actions/setup-node@v1
        with:
          node-version: 12
      - name: Create major release version
        uses: coupa/treasury_create-major-release-version@v1.0
        id: create-major-release
        with:
          GITHUB_TOKEN: ${{ secrets.TREASURY_TOKEN }}
          SETTINGS_FILE: "CI/deployment/Tm5VersionsSettings.json"
          VERSION_PREFIX: "5."
          TAG_PREFIX: "v"
          GIT_USER_EMAIL: "service.account@coupa.com"
          GIT_USER_NAME: "service.account"
          WORKFLOW_FILE: ".github/workflows/sync-releases.yml"
          VERSION_FILE: "major-version.txt"
          SCRIPTS_PATH: "DatabaseChanges/UpgradeScript/"
          ASSIGN_PROJECT_FILE: ".github/workflows/assign-project.yml"
          ARCHIVE_CONFIG_FILE: ".github/archive-project-cards-config.yml"
          JIRA_SUBDOMAIN: "coupadev"
          JIRA_USER: "service.account@coupa.com"
          JIRA_TOKEN: ${{secrets.JIRA_TOKEN}}
          JIRA_PROJECTS_IDS: "12345,123456"
          JIRA_PROJECTS_KEYS: "TM,JZ"
          JIRA_MASTER_PROJECT_ID: "987654"
          JIRA_MASTER_PROJECT_KEY: "RM"
          JIRA_MASTER_ISSUE_TYPE: "13802"
          CONFLUENCE_ANCESTOR: "123456789"
          CONFLUENCE_SPACE: "XX"
          CONFLUENCE_CONTENT_FILE: ".github/major_version_page.xml"
      - name: Notify
        id: slack
        uses: slackapi/slack-github-action@v1.14.0
        with:
          payload: ${{steps.create-major-release.outputs.RELEASE_INFO}}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.RELEASE_INFO_SLACK_WEBHOOK_URL }}
```

**Important:** 
- A service account is required for the automation. It needs to have write access to your GitHub repository, Jira projects and PMO Confluence space.
It must be configured with `GIT_USER_EMAIL`, `GIT_USER_NAME` and `JIRA_USER`. 
It requires one token for GitHub and one token for Jira/Confluence. These tokens `GITHUB_TOKEN` and `JIRA_TOKEN` must be added as secrets on your repository.
- The `CONFLUENCE_ANCESTOR` is the ID of the page where to create the new page as a child. The `CONFLUENCE_SPACE` is the space key where the page is located.
- you can use the output `RELEASE_INFO` to notify the community through Slack channel. It will require to setup the webhook url as secret on your repository.

You can retrieve the required `JIRA_PROJECTS_IDS` and `JIRA_MASTER_PROJECT_ID` using the Jira REST API.
Here's an example:

Get Jira project ID using the project key ($projectKey).
```bash
curl --request GET \
  --url 'https://coupadev.atlassian.net/rest/api/3/project/$projectKey?expand=issueTypes&properties=key,id,name' \
  --user '$user:$token' \
  --header 'Accept: application/json'
```

You can retrieve the required `CONFLUENCE_ANCESTOR` using the Confluence REST API.
Here's an example:

Get confluence page ID using the title of the page ($title) and the space key which is part of the URL ($spaceKey)
```bash
curl --request GET \
  --url 'https://coupadev.atlassian.net/wiki/rest/api/content?title=$title&spaceKey=$spaceKey' \
  --user '$user:$token' \
  --header 'Accept: application/json'
```
