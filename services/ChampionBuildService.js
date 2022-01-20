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
        console.log('URI: ' + uri);
        const browser = await puppeteer.launch();
        const [page] = await browser.pages();

        // await page.goto('https://u.gg/lol/champions/vayne/build',  { waitUntil: 'networkidle0' });
        //TODO: If there are any issues with reliability, it will most likely be here.
        await page.goto(uri);

        page.lo
        // const data = await page.evaluate(() => document.querySelector('div.rune-tree_v2').outerHTML);
        // const data = await page.evaluate((selector) => {
        //     return {
        //         body: document.querySelector(selector).outerHTML,
        //     };
        // }, 'div.rune-tree_v2');
        //TODO: CAN GET STARTING ITEMS OFF OF BACKGROUND POSITION
        //TODO: OR WE LOOK AT HOVER;

        const data = await page.evaluate((selector) => {
            return {
                // keystone: document.querySelector('div.perk.keystone.perk-active').innerHTML,
                runes: Array.from(document.querySelectorAll('div.perk.perk-active')).map(x => x.innerHTML).splice(0, 6),
                shards: Array.from(document.querySelectorAll('div.shard.shard-active')).map(x => x.innerHTML).splice(0, 3),
                startingItems: Array.from(document.querySelectorAll('div.item-dupe')).map(x => x.innerHTML),
                curious: Array.from(document.querySelectorAll('div.tooltip-portal')).map(x => x.innerHTML)

            };
        }, 'div.perk.keystone.perk-active');


        // const data = await page.evaluateHandle(() => document.querySelector('div.rune-tree_v2'));
        // console.log(await data.getProperties());


        // const data = await page.$$(`${'div.rune-tree_v2'} > *`);

        // const data = await page.evaluate(() => document.querySelector('div.rune-tree_v2').outerHTML).then((res) => {
        //     console.log(r);
        // })
        // const data = await page.evaluate(() => document.querySelectorAll('div.perk'));

        // let test = await page.evaluate(() => {
        //     let elements = Array.from(document.querySelectorAll('div.rune-tree_v2'));
        //     let links = elements.map(element => {
        //         return element.outerHTML
        //     })
        //     return links;
        // });
        //
        // console.log(test);
        console.log(data);
        await browser.close();

    } catch (error) {
        console.error(error);
    }
}


async function extractData(page) {
    try {
        const persons = await page.evaluate(() => {
            let persons = [];
            const personsElem = document.querySelectorAll("div.rune-tree_v2");
            const personsElemLen = personsElem.length;

            for (let i = 0; i < personsElemLen; i++) {
                try {
                    const personElem = personsElem[i];

                    const photo = personElem.querySelector("img").src;

                    const name = personElem.querySelector("h3").innerText;
                    const email = personElem.querySelector(".email").innerText;
                    const phone = personElem.querySelector(".phone").innerText;

                    persons.push({ photo, name, services, price, ratings, reviews });
                } catch (e) {}
            }

            return persons;
        });



        // do anything with persons

        console.log(persons.length, "persons", persons);
    } catch(e) {
        console.error("Unable to extract persons data", e);
    }
};

module.exports.championBuildService = {
    fetchAndProcessChampionData,
}