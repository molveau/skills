# Privacy

Molveau skills is a set of agent skills, scripts and a local MCP server published by Molveau Studio, Montréal (https://www.molveau.ca). This page covers what they do with your data.

## What the skills, scripts and MCP server collect

Nothing. They run on your machine, inside your agent. They send no data to Molveau Studio or to anyone else, make no network requests, keep no logs and set no identifiers. The MCP server reads only the skills' own files and, when you ask it to scan files, files inside the folder your client starts it in.

## Third parties you may use alongside them

- **The skills CLI** (`npx skills add`) is a separate tool by Vercel. It sends anonymous install counts to skills.sh; see https://skills.sh/privacy. You can turn that off as its documentation explains.
- **npm** counts downloads of the `@molveau/skills` package; see https://docs.npmjs.com/policies/privacy.
- **GitHub** hosts the repository and keeps its own traffic statistics; see https://docs.github.com/site-policy/privacy-policies.
- **Your agent and model provider** (for example Claude Code and Anthropic) process your conversation and files under their own terms.

## The molveau.ca website

The website has its own policy: https://www.molveau.ca/privacy.

## Contact

hello@molveau.ca
