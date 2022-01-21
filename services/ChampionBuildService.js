const puppeteer = require('puppeteer');
const {uriUtilities} = require('../utils/URIUtilities');
const {Mouse} = require("puppeteer");
const {MessageEmbed} = require("discord.js");

async function fetchAndProcessChampionData(message) {
    let uri = "";
    let data;
    let retBuild;
    let champion;
    let position;

    if(message.length === 1) {
        champion = message[0].toLowerCase();
        uri = await uriUtilities.buildUriForChampion(champion);
    } else if (message.length === 2) {
        champion = message[0].toLowerCase();
        position = message[1].toLowerCase();
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

        data['champion'] = champion;
        data['position'] = position;

        await browser.close();

    } catch (error) {
        console.error(error);
    }

    if(data) {
        retBuild = formatDataForResponse(data);
    }

    return retBuild;
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

function formatDataForResponse(data) {
    console.log(data);
    let runes = data['runes'];
    const build = new MessageEmbed();
    build.setColor('#0099ff');
    build.setTitle(data['champion']);
    //TODO: Runes, Precision and Domination
    build.addFields(
        { name: 'Runes', value: 'runes' },
        { name: "Keystone", value: "<:yellow_square:933963482699825223>" + " " + runes[0]},
        { name: "1st Primary", value: "<:yellow_square:933963482699825223>" + " " + runes[1], inline: true},
        { name: "1st Secondary", value: runes[4], inline: true},
        { name: "2nd Primary", value: "<:yellow_square:933963482699825223>" + " " + runes[2], inline: true},
        { name: "2nd Secondary", value: runes[5], inline: true},
        { name: "3rd Primary", value: "<:yellow_square:933963482699825223>" + " " + runes[3]}
        // { name: runes[1], inline: true },
    )
    return build;

}

module.exports.championBuildService = {
    fetchAndProcessChampionData,
}