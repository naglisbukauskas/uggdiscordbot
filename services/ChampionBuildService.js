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
                skillOrder: Array.from(document.querySelectorAll('div.skill-path-container > div.skill-order-row > div.skill-order')).map(x => x.innerHTML),
                image: document.querySelector('img.champion-image').src,
                position: document.querySelector('span.champion-title').innerHTML,
                winrate: document.querySelector('div.win-rate > div.value').innerHTML,
                summoners: (Array.from(document.querySelectorAll('div.content-section_content.summoner-spells > div > img')).map(x => x.alt)).map(x => x.split(" ")[2]),

            };
        });

        console.log(data);

        let startingItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content starting-items"] > div > div[class="item-row"] > div[class="item-dupe"] > div[class="item-img"]');
        let mythicCoreItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div > div[class="item-row"] > div[class] > div[class="item-img"]');
        let mythicCoreItemOptions2 = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div > div[class="item-row mythic-row"] > div > div[class="item-img"]');
        let fourthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-1"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
        let fifthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-2"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
        let sixthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-3"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');

        // let primaryTreeName = await page.$('div[class="rune-trees-container-2 media-query media-query_MOBILE_LARGE__DESKTOP_LARGE"] > div > div[class="rune-tree_v2 primary-tree"] > div[class="rune-tree_header"] > div[class="perk-style-title"]');

        // console.log('Primary Tree Name');
        // console.log(primaryTreeName);

        let qLevelOrder = extractSkillOrder(data["skillOrder"][0]);
        let wLevelOrder = extractSkillOrder(data["skillOrder"][1]);
        let eLevelOrder = extractSkillOrder(data["skillOrder"][2]);
        let rLevelOrder = extractSkillOrder(data["skillOrder"][3]);

        data['qOrder'] = qLevelOrder;
        data['wOrder'] = wLevelOrder;
        data['eOrder'] = eLevelOrder;
        data['rOrder'] = rLevelOrder;

        let startingItemsList = await evaluateImages(page, startingItemOptions);
        let mythicCoreItemsList = await evaluateImages(page, mythicCoreItemOptions);
        let mythicCoreItemsList2 = await evaluateImages(page, mythicCoreItemOptions2);
        let fourthItemsList = await evaluateImages(page, fourthItemOptions);
        let fifthItemsList = await evaluateImages(page, fifthItemOptions);
        let sixthItemsList = await evaluateImages(page, sixthItemOptions);




        data['startingItems'] = startingItemsList;
        data['mythicCoreItems'] = mythicCoreItemsList;
        data['mythicCoreItems2'] = mythicCoreItemsList2;
        data['fourthItems'] = fourthItemsList;
        data['fifthItems'] = fifthItemsList;
        data['sixthItems'] = sixthItemsList;

        let positionInfo = data['position'].split(' ');

        data['champion'] = champion;
        data['position'] = positionInfo[2].slice(0, -1);

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

function getRunePosition(rune) {
    rune = rune.toLowerCase().trim();
    console.log(rune);
    if(rune === 'press the attack'
        || rune === 'overheal'
        || rune === 'legend: alacrity'
        || rune === 'coup de grace'
        || rune === 'electrocute'
        || rune === 'cheap shot'
        || rune === 'zombie ward'
        || rune === 'ravenous hunter'
        || rune === 'summon aery'
        || rune === 'nullifying orb'
        || rune === 'transcendence'
        || rune === 'scorch'
        || rune === 'grasp of the undying'
        || rune === 'demolish'
        || rune === 'conditioning'
        || rune === 'overgrowth'
        || rune === 'glacial augment'
        || rune === 'hextech flashtraption'
        || rune === "future's market"
        || rune === 'cosmic insight') {
        return 1;
    } else if(rune === 'lethal tempo'
        || rune === 'triumph'
        || rune === 'legend: tenacity'
        || rune === 'cut down'
        || rune === 'predator'
        || rune === 'taste of blood'
        || rune === 'ghost poro'
        || rune === 'ingenious hunter'
        || rune === 'arcane comet'
        || rune === 'manaflow band'
        || rune === 'celerity'
        || rune === 'waterwalking'
        || rune === 'aftershock'
        || rune === 'font of life'
        || rune === 'second wind'
        || rune === 'revitalize'
        || rune === 'unsealed spellbook'
        || rune === 'magical footwear'
        || rune === "minion dematerializer"
        || rune === 'approach velocity') {
        return 2;
    } else if(rune === 'fleet footwork'
        || rune === 'presence of mind'
        || rune === 'legend: bloodline'
        || rune === 'last stand'
        || rune === 'dark harvest'
        || rune === 'sudden impact'
        || rune === 'eyeball collection'
        || rune === 'relentless hunter'
        || rune === 'phase rush'
        || rune === 'nimbus cloak'
        || rune === 'absolute focus'
        || rune === 'gathering storm'
        || rune === 'guardian'
        || rune === 'shield bash'
        || rune === 'bone plating'
        || rune === 'unflinching'
        || rune === 'first strike'
        || rune === 'perfect timing'
        || rune === "biscuit delivery"
        || rune === 'time warp tonic') {
        return 3;
    } else if(rune === 'conqueror'
        || rune === 'hail of blades'
        || rune === 'ultimate hunter') {
        return 4;
    }
}

function capitalizeChampionName(champion) {
    const lower = champion.toLowerCase();
    return champion.charAt(0).toUpperCase() + lower.slice(1);
}

function extractSkillOrder(skillList) {
    let retList = [];
    skillList = skillList.split("div");

    for(let item of skillList) {
        if(item.length > 6) {
            if(item.includes("no")) {
                retList.push("no-skill-up");
            } else {
                retList.push("skill-up");
            }
        }
    }

    return retList;


    // let lvlArray = skillList.split('"');
    // let i = 0;
    //
    // while (i < lvlArray.length) {
    //     if (lvlArray[i].trim() !== "skill-up" && lvlArray[i] !== "no-skill-up") {
    //         lvlArray.splice(i, 1);
    //     } else if(lvlArray[i] === "skill-up ") {
    //         lvlArray[i] = lvlArray[i].trim();
    //         ++i;
    //     } else {
    //         ++i;
    //     }
    // }

    // return lvlArray;

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
        case 'scaling cdr':
            return ':yellow_circle:';
        case 'armor':
            return ':red_circle:';
        case 'magic resist':
            return ':purple_circle:';
        case 'scaling bonus health':
            return ':green_circle:';
    }
}

function visualizeSkillOrder(skillArr) {
    let naglis = skillArr;
    for(let i = 0; i < naglis.length; i++) {
        if(naglis[i] === 'no-skill-up') {
            naglis[i] = ':white_large_square:';
            // naglis[i] = ':white_small_square:';
        } else {
            switch(i + 1) {
                case 1:
                    naglis[i] = ':one:';
                    break;
                case 2:
                    naglis[i] = ':two:';
                    break;
                case 3:
                    naglis[i] = ':three:';
                    break;
                case 4:
                    naglis[i] = ':four:';
                    break;
                case 5:
                    naglis[i] = ':five:';
                    break;
                case 6:
                    naglis[i] = ':six:';
                    break;
                case 7:
                    naglis[i] = ':seven:';
                    break;
                case 8:
                    naglis[i] = ':eight:';
                    break;
                case 9:
                    naglis[i] = ':nine:';
                    break;
                case 10:
                    naglis[i] = ':keycap_ten:';
                    break;
                default:
                    naglis[i] = ':blue_square:'

            }
            // naglis[i] = ':large_blue_diamond:'
            // naglis[i] = ':small_blue_diamond:';
        }
    }


    return naglis;
}

function extractSummonerColor(summoner) {
    switch (summoner.toLowerCase()) {
        case 'heal':
            return ':green_square:';
        case 'ghost':
            return ':blue_square:';
        case 'barrier':
            return ':brown_square:';
        case 'exhaust':
            return ':brown_square:';
        case 'clarity':
            return ':blue_square:';
        case 'flash':
            return ':yellow_square:';
        case 'teleport':
            return ':purple_square:';
        case 'smite':
            return ':brown_square:';
        case 'cleanse':
            return ':blue_square:';
        case 'ignite':
            return ':orange_square:';
    }
}

function formatListOfItems(data) {
    let list = "";
    for(let item of data) {

    }
}

function formatDataForResponse(data) {
    console.log(data);
    let championName = capitalizeChampionName(data['champion']);
    let championPosition = data['position'];

    let runes = normalizeRunes(data['runes']);
    let shards = normalizeShards(data['shards']);

    let summonerColorOne = extractSummonerColor(data['summoners'][0]);
    let summonerColorTwo = extractSummonerColor(data['summoners'][1]);

    let primaryTreeColor = extractRuneTreeColor(data['primaryTreeName']);
    let secondaryTreeColor = extractRuneTreeColor(data['secondaryTreeName']);

    let firstShardColor = extractShardColor(shards[0]);
    let secondShardColor = extractShardColor(shards[1]);
    let thirdShardColor = extractShardColor(shards[2]);

    let QSO = visualizeSkillOrder(data['qOrder']);
    let WSO = visualizeSkillOrder(data['wOrder']);
    let ESO = visualizeSkillOrder(data['eOrder']);
    let RSO = visualizeSkillOrder(data['rOrder']);

    if(data['mythicCoreItems'].length === 0) {
        data['mythicCoreItems'] = data['mythicCoreItems2'];
    }

    // console.log('mythic 1 size: ' + data['mythicCoreItems'].);
    // console.log('mythic 2 size: ' + data['mythicCoreItems2'].size);

    console.log('FIXED DATA? ' + data['mythicCoreItems'])

    // let startingItemsList = formatListOfItems(data['startingItems']);
    // let mythicCoreItemsList = formatListOfItems(data['mythicCoreItems']);
    // let fourthItemsList = formatListOfItems(data['fourthItems']);
    // let fifthItemsList = formatListOfItems(data['fifthItems']);
    // let sixthItemsList = formatListOfItems(data['sixthItems']);

    const build = new MessageEmbed();
    build.setColor('#0099ff');
    // build.setTitle(data['champion']);
    build.setTitle(championName + " - " + championPosition + " - " + data['winrate']);
    // build.setThumbnail(data['image']);
    //TODO: Runes, Precision and Domination

    let compactSpacing = '\n'
    let standardSpacing = '\n\n'
    let spacing = compactSpacing;

    build.addFields(
        // { name: 'Runes', value: data['primaryTreeName'] + ' & ' + data['secondaryTreeName']},
        { name: 'Runes', value: data['primaryTreeName'] + ' & ' + data['secondaryTreeName'], inline: true},
        { name: 'Summoners', value: summonerColorOne + " " + data['summoners'][0] + spacing + summonerColorTwo + " " + data['summoners'][1], inline: true},
        // { name: "Keystone", value: "<:yellow_square:933963482699825223>" + " " + runes[0] + "\n NAGLIS IS DA BEST"},
        // { name: "Keystone", value: primaryTreeColor + " " + runes[0]},
        // { name: "Primary", value: primaryTreeColor + " " + runes[1] + '\n\n' + primaryTreeColor + " " + runes[2] + '\n\n' + primaryTreeColor + " " + runes[3], inline: true},
        // { name: "Secondary", value: secondaryTreeColor + " " + runes[4] + '\n\n' + secondaryTreeColor + " " + runes[5], inline: true},
        // { name: "Shards", value: firstShardColor + " " + shards[0] + "\n\n" + secondShardColor + " " + shards[1] + "\n\n" + thirdShardColor + " "  + shards[2]},

        { name: "Keystone", value: primaryTreeColor + " " + runes[0] + " - " + getRunePosition(runes[0])},
        { name: "Primary", value: primaryTreeColor + " " + runes[1] + " - " + getRunePosition(runes[1]) + spacing + primaryTreeColor + " " + runes[2] + " - " + getRunePosition(runes[2]) + spacing + primaryTreeColor + " " + runes[3] + " - " + getRunePosition(runes[3]), inline: true},
        { name: "Secondary", value: secondaryTreeColor + " " + runes[4] + " - " + getRunePosition(runes[4]) + spacing + secondaryTreeColor + " " + runes[5] + " - " + getRunePosition(runes[5]), inline: true},
        { name: "Shards", value: firstShardColor + " " + shards[0] + spacing + secondShardColor + " " + shards[1] + spacing + thirdShardColor + " "  + shards[2]},

        // {name: "Skill-Order", value: ":regional_indicator_q: " + QSO[0] + QSO[1] + QSO[2] + QSO[3] + QSO[4] + QSO[5] + QSO[6] + QSO[7] + QSO[8] + QSO[9] + QSO[10] + QSO[11] + QSO[12] + QSO[13] + QSO[14] + QSO[15] + "\n\n"
        // + ":regional_indicator_w: " + WSO[0] + WSO[1] + WSO[2] + WSO[3] + WSO[4] + WSO[5] + WSO[6] + WSO[7] + WSO[8] + WSO[9] + WSO[10] + WSO[11] + WSO[12] + WSO[13] + WSO[14] + WSO[15]},
        // {name: '\u200b', value: ":regional_indicator_e: " + ESO[0] + ESO[1] + ESO[2] + ESO[3] + ESO[4] + ESO[5] + ESO[6] + ESO[7] + ESO[8] + ESO[9] + ESO[10] + ESO[11] + ESO[12] + ESO[13] + ESO[14] + ESO[15] + "\n\n"
        //         + ":regional_indicator_r: " + RSO[0] + RSO[1] + RSO[2] + RSO[3] + RSO[4] + RSO[5] + RSO[6] + RSO[7] + RSO[8] + RSO[9] + RSO[10] + RSO[11] + RSO[12] + RSO[13] + RSO[14] + RSO[15]},

        // {name: "Skill-Order", value: ":regional_indicator_q: " + QSO[0] + " " + QSO[1] + " " + QSO[2] + " " + QSO[3] + " " + QSO[4] + " " + QSO[5] + " " + QSO[6] + " " + QSO[7] + " " + QSO[8] + " " + QSO[9] + " " + QSO[10] + " " + QSO[11] + " " + QSO[12] + " " + QSO[13] + " " + QSO[14] + " " + QSO[15] + " " + QSO[16] + " " + QSO[17] + "\n\n"
        //         + ":regional_indicator_w: " + WSO[0] + " " + WSO[1] + " " + WSO[2] + " " + WSO[3] + " " + WSO[4] + " " + WSO[5] + " " + WSO[6] + " " + WSO[7] + " " + WSO[8] + " " + WSO[9] + " " + WSO[10] + " " + WSO[11] + " " + WSO[12] + " " + WSO[13] + " " + WSO[14] + " " + WSO[15] + " " + WSO[16]+ " " + WSO[17]},
        // {name: '\u200b', value: ":regional_indicator_e: " + ESO[0] + " " + ESO[1] + " " + ESO[2] + " " + ESO[3] + " " + ESO[4] + " " + ESO[5] + " " + ESO[6] + " " + ESO[7] + " " + ESO[8] + " " + ESO[9] + " " + ESO[10] + " " + ESO[11] + " " + ESO[12] + " " + ESO[13] + " " + ESO[14] + " " + ESO[15] + " " + ESO[16] + " " + ESO[17] + "\n\n"
        //         + ":regional_indicator_r: " + RSO[0] + " " + RSO[1] + " " + RSO[2] + " " + RSO[3] + " " + RSO[4] + " " + RSO[5] + " " + RSO[6] + " " + RSO[7] + " " + RSO[8] + " " + RSO[9] + " " + RSO[10] + " " + RSO[11] + " " + RSO[12] + " " + RSO[13] + " " + RSO[14] + " " + RSO[15] + " " + RSO[16] + " " + RSO[17]},

        {name: "Skill-Order", value: ":regional_indicator_q: " + QSO[0] + QSO[1] + QSO[2] + QSO[3] + QSO[4] + QSO[5] + QSO[6] + QSO[7] + QSO[8] + QSO[9] + QSO[10] + QSO[11] + QSO[12] + QSO[13] + QSO[14] + QSO[15] + QSO[16] + QSO[17] + "\n\n"
                + ":regional_indicator_w: " + WSO[0] + WSO[1] + WSO[2] + WSO[3] + WSO[4] + WSO[5] + WSO[6] + WSO[7] + WSO[8] + WSO[9] + WSO[10] + WSO[11] + WSO[12] + WSO[13] + WSO[14] + WSO[15] + WSO[16]+ WSO[17]},
        {name: '\u200b', value: ":regional_indicator_e: " + ESO[0] + ESO[1] + ESO[2] + ESO[3] + ESO[4] + ESO[5] + ESO[6] + ESO[7] + ESO[8] + ESO[9] + ESO[10] + ESO[11] + ESO[12] + ESO[13] + ESO[14] + ESO[15] + ESO[16] + ESO[17] + "\n\n"
                + ":regional_indicator_r: " + RSO[0] + RSO[1] + RSO[2] + RSO[3] + RSO[4] + RSO[5] + RSO[6] + RSO[7] + RSO[8] + RSO[9] + RSO[10] + RSO[11] + RSO[12] + RSO[13] + RSO[14] + RSO[15] + RSO[16] + RSO[17]},
        {name: "Starting Items", value: data['startingItems'].toString().split(',').join(', ')},
        {name: "Core Items", value: data['mythicCoreItems'].toString().split(',').join(', ')},
        {name: "Fourth Item", value: data['fourthItems'].toString().split(',').join(', ')},
        {name: "Fifth Item", value: data['fifthItems'].toString().split(',').join(', ')},
        {name: "Sixth Item", value: data['sixthItems'].toString().split(',').join(', ')},


        // + "E: " + ESO[0] + ESO[1] + ESO[2] + ESO[3] + ESO[4] + ESO[5] + ESO[6] + ESO[7] + ESO[8] + ESO[9] + ESO[10] + ESO[11] + ESO[12] + ESO[13] + ESO[14] + ESO[15] + "\n\n"
        // + "R: " + RSO[0] + RSO[1] + RSO[2] + RSO[3] + RSO[4] + RSO[5] + RSO[6] + RSO[7] + RSO[8] + RSO[9] + RSO[10] + RSO[11] + RSO[12] + RSO[13] + RSO[14] + RSO[15]},



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