function getPayload(user, repo) {
  const headerMessage = `*<https://github.com/stripe-certification/${repo}|${user}> has completed the Payments Challenge.*`;
  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: headerMessage,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Please follow the steps from the Certification Runbook (link to that heading) and react with a :check: to let teammates know.  For convenience, they're summarized below.",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "1. Find the learner's name & email address by searching for their GitHub username in the <https://docs.google.com/spreadsheets/d/1gF-N6joOmVm2r2V14Kn90zuRPtc3mUJRxaIJN8tLdaA/edit#gid=1584607354|Intake Spreadsheet>.",
          },
          {
            type: "mrkdwn",
            text: "2. Go to the <admin.mindtickle.com|MindTickle reviews> and mark that learner as having passed.",
          },
          {
            type: "mrkdwn",
            text: "3. Go back to the intake spreadsheet and mark their challenge as completed & submitted on today's date.",
          },
        ],
      },
    ],
  };

  return JSON.stringify(payload);
}

module.exports = getPayload;
