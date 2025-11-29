# Construct

A [Hack Club](https://hackclub.com) YSWS event

Built with SvelteKit, deployed with Docker (auto-builds container image and publishes to GitHub packages!)

Stack:

- SvelteKit
- Drizzle ORM
- PostgreSQL (coming soon!)
- Cloudflare R2 (coming soon asw!)

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

## Deploying

Create a `.env` file containing all the required credentials, look at `.env.example` for an example.

Use the following `docker-compose.yaml` file to deploy:

```yaml
services:
  db:
    restart: always
    image: postgres:latest
    environment:
      - POSTGRES_HOST_AUTH_METHOD=trust # fine for testing, ideally add a password before deployment
    volumes:
      - constructdb:/var/lib/postgresql
  construct:
    restart: always
    depends_on:
      - db
    ports:
      - 3004:3000
    env_file:
      - .env
    pull_policy: always
    image: ghcr.io/arcaege/construct:latest
networks: {}
volumes:
  constructdb:
```

Use the `staging` image tag instead of `latest` for the staging environment.
