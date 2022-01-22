const dotenv = require('dotenv').config();
const {Client, Intents, Channel} = require('discord.js');

const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const cron = require('node-cron');
const {messageRouter} = require("./routers/MessageRouter");
const {championDataService} = require("./services/ChampionDataService");

const client = new Client({
    intents: [Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES]
});

client.once('ready', () => {
    console.log('Bot is Ready');
});

client.login(process.env.TOKEN).then(() => {
    console.log('Bot Logged In')
});

client.on("messageCreate", async (message) => {
    let response;
    await messageRouter.routeMessage(message).then(resMessage => {
        response = resMessage;
        console.log('RESPONSE: ' + response);
        if(response) {
            if(typeof(response) === "object") {
                client.channels.cache.get(message['channelId']).send({ embeds: [response] });
            } else {
                client.channels.cache.get(message['channelId']).send(response);
            }


        }
    });
});

// function pullChampionData() {
//   let startDate = new Date();
//   console.log('Pulling Champion Data for Date: ' + startDate);
//   championDataService.pullAndSaveChampionData().then(() => {
//       let endDate = new Date();
//       console.log('Completed pulling champion data in ' + (endDate - startDate));
//   });
// }
//
// //6 hours
// // setInterval(pullChampionData, 21600000);
// setInterval(pullChampionData, 10000);

// let startDate = new Date();
//   console.log('Pulling Champion Data for Date: ' + startDate);
//   championDataService.pullAndSaveChampionData().then(() => {
//       let endDate = new Date();
//       console.log('Completed pulling champion data in ' + (endDate - startDate));
//   });

// championDataService.funnyGoofyTest();
championDataService.fetchPairsNotPopulated().then(r => console.log('nagils'));

module.exports.client = {
    client,
}

//
// client.on("message", async (message) => {
//     //"Ignore the message if the bot authored it"
//     if (message.author.bot) {
//         return;
//     }
//
//     //If the doesn't specifically mention the bot, return
//
//     if (message.content.includes("@here") || message.content.includes("@everyone")) {
//         return;
//     }
//
//     //Return if the message doesn't mention the bot
//     if (!message.mentions.has(client.user.id)) return;
//
//     try {
//         axios.get('https://u.gg/lol/champions/vayne/build?role=top').then(response => {
//             const html = response['data'];
//             console.log(html);
//             // const retard = cheerio.load(html);
//             // console.log(retard.text());
//         })
//     }
//     catch (error) {
//         message.reply("Sorry, an error occured");
//     }
// });
//
//
// async function fetchWebsitePullHtml() {
//     try {
//         const browser = await puppeteer.launch();
//         const [page] = await browser.pages();
//
//         // await page.goto('https://u.gg/lol/champions/vayne/build',  { waitUntil: 'networkidle0' });
//         //TODO: If there are any issues with reliability, it will most likely be here.
//         await page.goto('https://u.gg/lol/champions/vayne/build');
//         const data = await page.evaluate(() => document.querySelector('*').outerHTML);
//
//         console.log(data);
//         await browser.close();
//
//     } catch (error) {
//         console.error(error);
//     }
// }
// fetchWebsitePullHtml().then(r => console.log('naglis'));
