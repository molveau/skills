# Privacy

Molveau skills is a set of agent skills, scripts, a local MCP server and a hosted MCP endpoint published by Molveau Studio, Montréal (https://www.molveau.ca). This page covers what they do with your data.

## What the skills, scripts and local MCP server collect

Nothing. They run on your machine, inside your agent. They send no data to Molveau Studio or to anyone else, make no network requests, keep no logs and set no identifiers. The MCP server reads only the skills' own files and, when you ask it to scan files, files inside the folder your client starts it in.

## Hosted MCP endpoint

The same six tools are also served at https://www.molveau.ca/api/mcp, for MCP clients that connect over the web.

- **What it receives:** the text a client sends in each request, such as a code snippet, two colours, a piece of French text or a question about a skill.
- **What it does with it:** it processes that text in memory to answer the request, and stores none of it. It reads none of your files (it scans only the code sent to it) and passes nothing on to anyone.
- **No account, no cookie, no identifier:** the endpoint needs no account, sets no cookie and assigns no identifier.
- **Rate limit:** to stop runaway clients, the endpoint counts requests per IP address in memory for one minute at a time. The count is never written down and is gone when the window ends.
- **Hosting:** the hosting provider, Cloudflare, keeps standard request logs (time, IP address, path and status code) for a limited period under its own policy: https://www.cloudflare.com/privacypolicy/.
- **Audience:** the endpoint is for general audiences.

## Third parties you may use alongside them

- **The skills CLI** (`npx skills add`) is a separate tool by Vercel. It sends anonymous install counts to skills.sh; see https://skills.sh/privacy. You can turn that off as its documentation explains.
- **npm** counts downloads of the `@molveau/skills` package; see https://docs.npmjs.com/policies/privacy.
- **GitHub** hosts the repository and keeps its own traffic statistics; see https://docs.github.com/site-policy/privacy-policies.
- **Your agent and model provider** (for example Claude Code and Anthropic) process your conversation and files under their own terms.

## The molveau.ca website

The website has its own policy: https://www.molveau.ca/privacy.

## Contact

hello@molveau.ca
