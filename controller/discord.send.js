function makeNewsDiscordMessage(newArticles) {
  const messages = [];

  // Create header message based on the number of articles
  let headerMessage = `📰 **Pribudlo ${newArticles.length} nových článkov na SME!**\n\n`;
  if (newArticles.length === 1) {
    headerMessage = `📰 **Pribudol ${newArticles.length} nový článok na SME!**\n\n`;
  }
  messages.push(headerMessage);

  // Loop through each article and format its details
  newArticles.forEach((article) => {
    const time = `${article.articleDate} - ${article.articleTime}`;

    let themeLine = '';
    if (article.theme) {
      themeLine = `\n**Témy:** ${article.theme}`;
    }

    let link = '';
    if (article.articleUrl) {
      link = `📢 **(${article.category}) [${article.headline}](<${article.articleUrl}>)**\n`;  // Added < > to prevent Discord embeds
    } else {
      link = `📢 **(${article.category}) ${article.headline}**\n`;
    }

    const formattedArticle = `\n\n
🗓️ **Dátum a Čas:** ${time}
${link}
${article.articleContent}${themeLine}\n\n`;
    messages.push(formattedArticle);
  });

  return messages;
}

module.exports = { makeNewsDiscordMessage };
