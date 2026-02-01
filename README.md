# Construct

A [Hack Club](https://hackclub.com) YSWS event about CAD modelling and 3D printers

Built with SvelteKit, deployed with Docker (auto-builds container image and publishes to GitHub packages!)

Stack:

- SvelteKit
- Drizzle ORM
- PostgreSQL
- Cloudflare R2 (make sure you've configured CORS to allow GET and HEAD requests)

## Slack Bot

For the Slack integration to work, set up a Slack app with these bot token scopes:

- `chat:write`: To send direct messages
- `users:read`: To fetch user profiles
- `channels:read` or `groups:read`: To check channel membership (use `groups:read` if your beta channel is private)

Add the `SLACK_BOT_TOKEN` to your `.env` file.

## Developing

The recommended and easiest way to develop is to use a devcontainer to automatically set up a dev environment.

Copy `.env.example` to `.env` and update the stuff inside, then run this to initialise the database:

```sh
npm run db:migrate
```

Start a development server:

```sh
npm run dev
```

You can also run this to get a GUI for the database:

```sh
npm run db:studio
```

### Printables license IDs

Shipping checks licenses by ID. Grab the IDs directly from the Printables GraphQL API:

```json
{
	"operationName": "Licenses",
	"query": "query Licenses {\n  licenses {\n    id\n    name\n    abbreviation\n    content\n    disallowRemixing\n    freeModels\n    storeModels\n    allowedLicensesAfterRemixing {\n      id\n      __typename\n    }\n    __typename\n  }\n}",
	"variables": {}
}
```

Use the returned `id` values in `PRINTABLES_ALLOWED_LICENSES_ID` (comma-separated) in your `.env`.

## Deploying

Create a `.env` file containing all the required credentials, look at `.env.example` for an example. If you pass in Airtable tokens, the app must be marked as `hq_official` on idv.

Use the `docker-compose.yaml` file to deploy it.

Use the `staging` image tag instead of `production` for the staging environment.
