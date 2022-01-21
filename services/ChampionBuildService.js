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

        // await page.goto(uri,  { waitUntil: 'networkidle0' });
        //TODO: If there are any issues with reliability, it will most likely be here.
        await page.goto(uri)
        // await page.addStyleTag({ content: "{scroll-behavior: auto !important;}" });

        data = await page.evaluate(async () => {
            return {
                runes: (Array.from(document.querySelectorAll('div.perk.perk-active')).map(x => x.innerHTML).splice(0, 6)).map(x => x.slice(x.indexOf('alt=') + 5,x.indexOf(">") - 1)),
                shards: (Array.from(document.querySelectorAll('div.shard.shard-active')).map(x => x.innerHTML).splice(0, 3)).map(x => x.slice(x.indexOf('alt=') + 5,x.indexOf(">") - 1)),
                primaryTreeName: document.querySelector('div.rune-trees-container-2.media-query.media-query_MOBILE_LARGE__DESKTOP_LARGE > div > div.rune-tree_v2.primary-tree > div.rune-tree_header > div.perk-style-title').innerHTML,
                secondaryTreeName: document.querySelector('div.rune-trees-container-2.media-query.media-query_MOBILE_LARGE__DESKTOP_LARGE > div.secondary-tree > div > div.rune-tree_v2 > div.rune-tree_header > div.perk-style-title').innerHTML,
            };
        });

        let startingItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content starting-items"] > div > div[class="item-row"] > div[class="item-dupe"] > div[class="item-img"]');
        let mythicCoreItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div > div[class="item-row"] > div[class] > div[class="item-img"]');
        let fourthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-1"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
        let fifthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-2"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
        let sixthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-3"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');

        // let primaryTreeName = await page.$('div[class="rune-trees-container-2 media-query media-query_MOBILE_LARGE__DESKTOP_LARGE"] > div > div[class="rune-tree_v2 primary-tree"] > div[class="rune-tree_header"] > div[class="perk-style-title"]');

        // console.log('Primary Tree Name');
        // console.log(primaryTreeName);

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

function normalizeShards(shards) {
    let normalizedShards = [];
    for(let shard of shards) {
        let normalizedShard = "";
        shard = shard.split(" ");
        shard[0] = "";
        shard[shard.length - 1] = "";

        for(let word of shard) {
            normalizedShard = normalizedShard + " " + word;
        }
        normalizedShards.push(normalizedShard.trim());
    }
    return normalizedShards;
}

function normalizeRunes(runes) {
    let normalizedRunes = [];
    for(let rune of runes) {
        let normalizedRune = "";
        rune = rune.split(" ");
        rune = rune.splice(2, rune.length);
        for(let word of rune) {
            normalizedRune = normalizedRune + " " + word;
        }
        normalizedRunes.push(normalizedRune);
    }
    return normalizedRunes;
}

function capitalizeChampionName(champion) {

    let capitalizeFirst = true;
    let capitalizeNext = false;

    for(let char of champion) {
        if(capitalizeFirst) {
            char = char.toUpperCase();
        }
        capitalizeFirst = false;

        if(capitalizeNext) {
            char = char.toUpperCase();
            capitalizeNext = false;
        }

        if(char === "'" || char === " ") {
            capitalizeNext = true;
        }
    }
    return champion;
}

function extractRuneTreeColor(treeName) {
    treeName = treeName.toLowerCase();
    switch(treeName) {
        case 'precision':
            return  ':yellow_square:'
            // return '<:yellow_square:933963482699825223>';
        case 'domination':
            return ':red_square:'
            // return '<:red_square:933969543599108096>';
        case 'sorcery':
            return ':purple_square:';
            // return '<:purple_square:934123011655761930';
        case 'resolve':
            return ':green_square:';
            // return '<:green_square:934122822048026735';
        case 'inspiration':
            return ':blue_square:';
            // return '<:blue_square:934123047680626718';
    }
}

function extractShardColor(shard) {
    shard = shard.toLowerCase();
    console.log("SHARD - " + shard);
    switch(shard) {
        case 'adaptive force':
            return  ':purple_circle:'
        case 'attack speed':
            return ':yellow_circle:'
        case 'ability haste':
            return ':yellow_circle:';
        case 'armor':
            return ':red_circle:';
        case 'magic resist':
            return ':purple_circle:';
        case 'health':
            return ':green_circle:';
    }
}

function formatDataForResponse(data) {
    console.log(data);
    let championName = capitalizeChampionName(data['champion']);
    let runes = normalizeRunes(data['runes']);
    let shards = normalizeShards(data['shards']);

    let primaryTreeColor = extractRuneTreeColor(data['primaryTreeName']);
    let secondaryTreeColor = extractRuneTreeColor(data['secondaryTreeName']);

    let firstShardColor = extractShardColor(shards[0]);
    let secondShardColor = extractShardColor(shards[1]);
    let thirdShardColor = extractShardColor(shards[2]);

    const build = new MessageEmbed();
    build.setColor('#0099ff');
    build.setTitle(data['champion']);
    //TODO: Runes, Precision and Domination
    build.addFields(
        { name: 'Runes', value: data['primaryTreeName'] + ' & ' + data['secondaryTreeName']},
        // { name: "Keystone", value: "<:yellow_square:933963482699825223>" + " " + runes[0] + "\n NAGLIS IS DA BEST"},
        { name: "Keystone", value: primaryTreeColor + " " + runes[0]},
        { name: "Primary", value: primaryTreeColor + " " + runes[1] + '\n\n' + primaryTreeColor + " " + runes[2] + '\n\n' + primaryTreeColor + " " + runes[3], inline: true},
        { name: "Secondary", value: secondaryTreeColor + " " + runes[4] + '\n\n' + secondaryTreeColor + " " + runes[5], inline: true},
        { name: "Shards", value: firstShardColor + " " + shards[0] + "\n\n" + secondShardColor + " " + shards[1] + "\n\n" + thirdShardColor + " "  + shards[2]}

        // {name: '\u200b', value: '\u200b'},
        // { name: "\u200b", value: "<:yellow_square:933963482699825223>" + " " + runes[1], inline: true},
        // { name: "1st Secondary", value: runes[4], inline: true},
        // {name: '\u200b', value: '\u200b'},
        // { name: "2nd Primary", value: "<:yellow_square:933963482699825223>" + " " + runes[2], inline: true},
        // { name: "2nd Secondary", value: runes[5], inline: true},
        // {name: '\u200b', value: '\u200b'},
        // { name: "3rd Primary", value: "<:yellow_square:933963482699825223>" + " " + runes[3]}
        // { name: runes[1], inline: true },
    )
    return build;

}



module.exports.championBuildService = {
    fetchAndProcessChampionData,
}