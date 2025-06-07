# SlackPM

SlackPM is a lightweight project management proof-of-concept built with [Slack Bolt](https://slack.dev/bolt-js/). It listens to Slack messages, extracts actionable tasks via a simple NLP pipeline and exposes an admin dashboard.

## Prerequisites

- **Node.js** 18 or later
- **npm** (comes with Node)
- Optional: **Docker** and **Docker Compose** for containerised usage

Install dependencies after cloning:

```bash
npm install
```

## Running the app

Start the Slack Bolt app locally:

```bash
npm start
```

The dashboard server will also start on port `3001`.

## Running tests

Execute the Jest test suite:

```bash
npm test
```

## Docker usage

Build and run with Docker:

```bash
docker build -t slackpm .
docker run -p 3000:3000 -p 3001:3001 slackpm
```

Or use Docker Compose:

```bash
docker-compose up
```

## Slack integration features

- Uses Slack Socket Mode via Bolt to receive events
- Extracts tasks from messages using NLP (language detection, profanity check, date parsing)
- Stores task metadata and displays tasks in the App Home view
- Interactive buttons let users mark tasks as done
- Includes an admin dashboard to view metrics and audit logs

