const puppeteer = require('puppeteer');
const {uriUtilities} = require('../utils/URIUtilities');

async function fetchAndProcessChampionData(message) {
    let uri = "";

    if(message.length === 1) {
        let champion = message[0].toLowerCase();
        uri = await uriUtilities.buildUriForChampion(champion);
    } else if (message.length === 2) {
        let champion = message[0].toLowerCase();
        let position = message[1].toLowerCase();
        uri = await uriUtilities.buildUriForChampionAndPosition(champion, position);
    }


    try {
        const browser = await puppeteer.launch();
        const [page] = await browser.pages();

        // await page.goto('https://u.gg/lol/champions/vayne/build',  { waitUntil: 'networkidle0' });
        //TODO: If there are any issues with reliability, it will most likely be here.
        await page.goto(uri);
        const data = await page.evaluate(() => document.querySelector('*').outerHTML);

        console.log(data);
        await browser.close();

    } catch (error) {
        console.error(error);
    }
}

module.exports.championBuildService = {
    fetchAndProcessChampionData,
}