const { App } = require('@slack/bolt');
require('dotenv').config();
const ingestion = require('./ingestion');
const storage = require('./storage');
require('./worker');
require('./dashboard');
const logger = require('./logger');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Basic event subscriptions
app.event('app_home_opened', async ({ event, client }) => {
  // Fetch user's tasks from storage (placeholder: fetch all tasks for now)
  const tasks = [];
  for (const [key, metadata] of storage.store.entries()) {
    if (metadata.owner === event.user) {
      tasks.push(metadata);
    }
  }

  // Build blocks for the App Home view
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Welcome to SlackPM! Here are your tasks:'
      }
    }
  ];

  if (tasks.length === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'No tasks found.'
      }
    });
  } else {
    tasks.forEach(task => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${task.summary}* (Project: ${task.projectId})`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Mark Done',
            emoji: true
          },
          value: `${task.source.channel}:${task.source.ts}`,
          action_id: 'mark_done'
        }
      });
    });
  }

  await client.views.publish({
    user_id: event.user,
    view: {
      type: 'home',
      blocks
    }
  });
});

app.event('app_mention', async ({ event, say }) => {
  await say(`Hi <@${event.user}>, how can I help you manage your tasks today?`);
});

app.event('message', async ({ event }) => {
  // Only process user messages (not bot messages or message_changed, etc.)
  if (event.subtype === undefined && event.text) {
    ingestion.enqueue({
      ts: event.ts,
      channel: event.channel,
      user: event.user,
      text: event.text,
      thread_ts: event.thread_ts || null
    });
    console.log(`Enqueued message from ${event.user} in ${event.channel} at ${event.ts}`);
  }
});

// Handle interactive button clicks
app.action('mark_done', async ({ ack, body, client }) => {
  await ack();
  const [channel, ts] = body.value.split(':');
  const metadata = storage.getMetadata(channel, ts);
  if (metadata) {
    metadata.status = 'done';
    storage.saveMetadata(channel, ts, metadata);
    // Optionally, update the App Home view again
    await client.views.publish({
      user_id: body.user.id,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Task marked as done!'
            }
          }
        ]
      }
    });
  }
});

// Log webhook events
app.use(async (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const latency = Date.now() - start;
    logger.info('Webhook event', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latency
    });
  });
  next();
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ SlackPM app is running!');
})(); 