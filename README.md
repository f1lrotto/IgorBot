# Discord-News

## Introduction
This is a Node.js application that connects to a discord server via webhooks to serve the latest news from DennikNs [Minuta po minute](https://dennikn.sk/minuta).
### Functionality
Every 30 minutes, this application sends a `GET` request to [DennikN-scraper](https://github.com/f1lrotto/DennikN-scraper), to obtain the latest news posted. It checks the database to find out if there are any duplicate news with those that were served already. If there are duplicates, it trims them and sends them to the discord server via a webhook. Then it saves the new articles to a MongoDB database.

## Example
![example](/example.png)
### Technologies used
This application is running **Node.js** with **express**.

To send a `GET` request to [DennikN-scraper](https://github.com/f1lrotto/DennikN-scraper) every 30 minutes, **axios** and **node-cron** is used.

Sending messages via webhooks is handled by **discord.js**

This application stores its data on a **mongoDB** database that is hosted on Atlas. To access the mongoDB database, **mongoose** is used
## Running the project

### Install the dependencies
```
npm install
``` 
### Creating .env file
You need to create a `.env` file in the projects root directory

In this file you should include:
- `PORT` - on which the application will run on
- `MONGO_URI` - a connect URI to your mongoDB database
- `DENNIK_DISCORD_URL` - webhook link to your discord server
- `DENNIK_DISCORD_USERNAME` - name of your discord bot
- `DENNIK_DISCORD_AVATAR_URL` - URL for your profile picture

### Start the application 
```
npm start
```
### Start the application in development mode (hot-code reloading)
```
npm run dev
```
