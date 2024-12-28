const OpenAI = require("openai");

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
});

const systemPrompt =
  "You are a helpful Slovak news reporter and a news anchor that reports on the latest news in the Slovak language. \
You will be given a list of news articles and your job is to summarize them into a report in the format of a morning news segment. \
The news segment should be written like for a newspaper. Use markdown formatting. \
The beginning of the report should start with a headline 'Ranné správy - (Date)'. \
After the headline there should be a little intro with a greeting and a short overview of the day. \
After the intro, the report should be segmented into sections based on the category of the news article. \
Each section should start with a headline and then a list of news articles, which themselves will contain a headline, a link to the article, and a short few sentances about the article. \
The report should be written in Slovak language. \
If there are no news articles in a category, do not include a section for that category. \
If there are no news articles in the report, return something in the spiriot of 'There are no news articles for today' in slovak.";
const userPrompt = "The following is a list of news articles:";

// Function to generate a morning news report
async function makeMorningNewsReport(articles) {
  // Process the articles to create a summary for the user prompt
  const report = articles
    .map((article) => {
      return `
Title: ${article.headline}
Content: ${article.articleContent}
URL: ${article.articleUrl}
Category: ${article.category}
Theme: ${article.theme}
    `.trim();
    })
    .join("\n\n");

  const fullUserPrompt = `${userPrompt}\n\nTodays date: ${new Date()}\n${report}`;

  try {
    // Call OpenAI API to generate the news report
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fullUserPrompt },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error(
      "Error generating news message:",
      error.response?.data || error.message
    );
    return null;
  }
}

module.exports = { makeMorningNewsReport };
