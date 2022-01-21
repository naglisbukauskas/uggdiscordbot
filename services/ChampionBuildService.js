const puppeteer = require('puppeteer');
const {uriUtilities} = require('../utils/URIUtilities');
const {Mouse} = require("puppeteer");

async function fetchAndProcessChampionData(message) {
    let uri = "";
    let data;

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

        //TODO: This seems to make the item evaluation work
        await page.setViewport({ width: 400, height: 400 })

        // await page.goto('https://u.gg/lol/champions/vayne/build',  { waitUntil: 'networkidle0' });
        //TODO: If there are any issues with reliability, it will most likely be here.
        await page.goto(uri);
        await page.addStyleTag({ content: "{scroll-behavior: auto !important;}" });

        data = await page.evaluate(async () => {
            return {
                runes: (Array.from(document.querySelectorAll('div.perk.perk-active')).map(x => x.innerHTML).splice(0, 6)).map(x => x.slice(x.indexOf('alt=') + 5,x.indexOf(">"))),
                shards: (Array.from(document.querySelectorAll('div.shard.shard-active')).map(x => x.innerHTML).splice(0, 3)).map(x => x.slice(x.indexOf('alt=') + 5,x.indexOf(">"))),
            };
        });

        let startingItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content starting-items"] > div > div[class="item-row"] > div[class="item-dupe"] > div[class="item-img"]');
        let mythicCoreItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div > div[class="item-row"] > div[class] > div[class="item-img"]');
        let fourthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-1"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
        let fifthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-2"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
        let sixthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-3"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');

        let startingItemsList = await evaluateImages(page, startingItemOptions);
        let mythicCoreItemsList = await evaluateImages(page, mythicCoreItemOptions);
        let fourthItemsList = await evaluateImages(page, fourthItemOptions);
        let fifthItemsList = await evaluateImages(page, fifthItemOptions);
        let sixthItemsList = await evaluateImages(page, sixthItemOptions);

        data['startingItems'] = startingItemsList;
        data['mythicCoreItems'] = mythicCoreItemsList;
        data['fourthItems'] = fourthItemsList;
        data['fifthItems'] = fifthItemsList;
        data['sixthItems'] = sixthItemsList;

        await browser.close();

    } catch (error) {
        console.error(error);
    }

    return data;
}

async function evaluateImages(page, imageItemsList) {
    let loadedItems = [];
    for await (let image of imageItemsList) {
        try {
            await image.hover().then(async () => {
                loadedItems.push(await page.evaluate(async (selector) => {
                    let item = document.querySelector('div.tooltip-item').innerHTML;
                    return item.slice(18,item.indexOf("</div>"));

                }));
            });
        } catch (error) {
            console.log(error);
        }
    }
    return loadedItems;
}

module.exports.championBuildService = {
    fetchAndProcessChampionData,
}