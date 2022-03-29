function getPayload(user, repo) {
  const userMessage = user + " has completed a GitHub hands-on lab.";
  const repoUrl = "https://github.com/stripe-certification/" + repo;
  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "This is a header block",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "This is a section block with a button.",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Click Me",
            emoji: true,
          },
          value: "click_me_123",
          action_id: "button-action",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "This is a section block with checkboxes.",
        },
        accessory: {
          type: "checkboxes",
          options: [
            {
              text: {
                type: "mrkdwn",
                text: "*this is mrkdwn text*",
              },
              description: {
                type: "mrkdwn",
                text: "*this is mrkdwn text*",
              },
              value: "value-0",
            },
            {
              text: {
                type: "mrkdwn",
                text: "*this is mrkdwn text*",
              },
              description: {
                type: "mrkdwn",
                text: "*this is mrkdwn text*",
              },
              value: "value-1",
            },
            {
              text: {
                type: "mrkdwn",
                text: "*this is mrkdwn text*",
              },
              description: {
                type: "mrkdwn",
                text: "*this is mrkdwn text*",
              },
              value: "value-2",
            },
          ],
          action_id: "checkboxes-action",
        },
      },
    ],
  };

  return JSON.stringify(payload);
}

module.exports = getPayload;
