const Articles = require('../models/articles.mongo');
const marked = require('marked');

async function getNewsFeed(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalArticles = await Articles.countDocuments();
        const totalPages = Math.ceil(totalArticles / limit);

        const articles = await Articles.find()
            .sort({ articleTimestamp: -1 })
            .skip(skip)
            .limit(limit);

        res.render('news', {
            items: articles.map(article => ({
                content: marked.parse(`## ${article.headline}\n${article.articleContent}\n\n*${article.category} • ${article.articleDate} ${article.articleTime}${article.source ? ` • ${article.source}` : ''}*\n\n${article.articleUrl ? `[Čítať viac »](${article.articleUrl})` : ''}`)
            })),
            pagination: {
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            title: 'Správy'
        });
    } catch (error) {
        console.error('Error fetching news feed:', error);
        res.status(500).render('error', { message: 'Chyba pri načítaní správ.' });
    }
}

module.exports = { getNewsFeed };
