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
    ],
  };

  return JSON.stringify(payload);
}

module.exports = getPayload;
