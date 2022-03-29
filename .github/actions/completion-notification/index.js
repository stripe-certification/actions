const core = require("@actions/core");
const github = require("@actions/github");
const https = require("https");

const getPayload = require("./getPayload");

const SLACK_URL = core.getInput("slack-webhook-url");
const repositoryName = core.getInput("repo-name");
const authorName = core.getInput("user-name");

/**
 * Liberally borrowed from tiloio/slack-webhook-action [0],
 * but making our own copy to (a) simplify, and (b) reduce
 * external dependencies.
 *
 * [0] https://github.com/tiloio/slack-webhook-action/blob/main/index.js
 */
(async () => {
  try {
    const payload = getPayload(authorName, repositoryName);
    const result = await sendSlackNotification(payload);
    if (result !== "ok") {
      if (result === "invalid_payload") {
        core.setFailed(
          "Could not send notification with invalid payload: " + result
        );
      } else {
        core.setFailed("Could not send notification: " + result);
      }
    }
  } catch (err) {
    core.setFailed(err.message);
  }
})();

function sendSlackNotification(payload) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      SLACK_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": payload.length,
        },
      },
      (response) => {
        response.on("data", (responseData) => resolve(responseData.toString()));
        response.on("error", (error) => reject(error));
      }
    );

    request.on("error", (error) => reject(error));
    request.write(payload);
    request.end();
  });
}
