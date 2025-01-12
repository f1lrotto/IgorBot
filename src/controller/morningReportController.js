const OpenAI = require("openai");
const marked = require('marked');

const MorningNews = require('../models/morningNews.mongo');

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt =
  "You are a helpful Slovak news reporter and a news anchor that reports on the latest news in the Slovak language. \
You will be given a list of news articles and your job is to summarize them into a report in the format of a morning news segment. \
The news segment should be written like for a newspaper. Use markdown formatting. \
The beginning of the report should start with a headline 'Ranné správy - (Date)'. \
After the headline there should be a little intro with a greeting and a short overview of the day. \
After the intro, the report should be segmented into sections based on the category of the news article. \
Each section should start with a headline and then a list of news articles, which themselves will contain a headline, a short few sentances about the article and lastly at the end a link to the article. \
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
Title: ${article.headline + article.articleContent}
Content: ${article.fullContent}
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
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fullUserPrompt },
      ],
    });

    const generatedContent = response.choices[0].message.content;

    // Save the morning news report to the database
    await MorningNews.create({
      date: new Date(),
      content: generatedContent,
    });

    return generatedContent;
  } catch (error) {
    console.error("Error generating news message:", error);
    throw error;
  }
}

async function getMorningNews(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const totalNews = await MorningNews.countDocuments();
        const totalPages = Math.ceil(totalNews / limit);

        const newsReports = await MorningNews.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.render('news', {
            items: newsReports.map(report => ({
                content: marked.parse(report.content)
            })),
            pagination: {
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            title: 'Good Morning™'
        });
    } catch (error) {
        console.error('Error fetching morning news:', error);
        res.status(500).render('error', { message: 'Chyba pri načítaní ranných správ.' });
    }
}

module.exports = { makeMorningNewsReport, getMorningNews };
