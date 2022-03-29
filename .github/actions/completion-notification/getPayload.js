function getPayload(user, repo) {
  const userMessage = user + " has completed a GitHub hands-on lab.";
  const repoUrl = "https://github.com/stripe-certification/" + repo;
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
    ],
  };

  return JSON.stringify(payload);
}

module.exports = getPayload;
