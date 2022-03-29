function getPayload(user, repo) {
  const headerMessage = user + " has completed a GitHub hands-on lab.";
  const repoUrl = "https://github.com/stripe-certification/" + repo;
  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: headerMessage,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Visit their solution repo:",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "GitHub Repo",
            emoji: true,
          },
          value: "click_me_123",
          url: repoUrl,
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
          text: "React with eyes to let teammates know you've taken this notification, then complete the following steps",
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
