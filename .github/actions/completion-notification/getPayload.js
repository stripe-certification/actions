function getPayload(user, repo) {
  const userMessage = user + " has completed a GitHub hands-on lab.";
  const repoUrl = "https://github.com/stripe-certification" + repo;
  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: userMessage,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "You can find their solution repo here:",
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
          text: "Please react with 👀 to let teammates know you are provisioning, then complete the following steps:",
        },
        accessory: {
          type: "checkboxes",
          options: [
            {
              text: {
                type: "mrkdwn",
                text: "this is mrkdwn text",
              },
              value: "value-0",
            },
            {
              text: {
                type: "mrkdwn",
                text: "this is mrkdwn text",
              },
              value: "value-1",
            },
            {
              text: {
                type: "mrkdwn",
                text: "this is mrkdwn text",
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
