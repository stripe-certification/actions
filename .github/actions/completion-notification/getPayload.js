export default getPayload = (user, repo) =>
  JSON.stringify({
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: user + " has completed a GitHub hands-on lab.",
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
          url: "https://github.com/stripe-certification/" + repo,
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
  });
