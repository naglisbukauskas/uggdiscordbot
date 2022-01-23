const {uriUtilities} = require("../utils/URIUtilities");
const puppeteer = require("puppeteer");
const {VALID_CHAMPIONS_LIST, NORMALIZED_POSITIONS_LIST} = require("../utils/GlobalConstants");
const {utilities} = require("../utils/Utilities");
const {MongoClient} = require("mongodb");
const { v4: uuidv4 } = require('uuid');



async function pullAndSaveChampionData() {
    console.log('Inside Pull and Save Champion Data');
        let uri = "";
        let data;
        let retBuild;
        let champion;
        let position;

        // uri = await uriUtilities.buildUriForChampionAndPosition(champion, position);
        uri = await uriUtilities.buildUriForChampionAndPosition('vayne', 'bot');

        try {
            console.log(uri);
            const browser = await puppeteer.launch();
            const [page] = await browser.pages();
            await page.setViewport({ width: 400, height: 400 })
            await page.goto(uri)

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

            let splitUrl = page.url().split("/")
            console.log(splitUrl[splitUrl.length - 1]);
            if(!splitUrl[splitUrl.length - 1].includes(position)) {
                console.log('DEEEEEEEEEEEEEEEEEFFFFFFFFFAAAAAAAAAAAAAAUUUUUUUUUUUULLLLLLLLLLLLLLTTTTTTTTTTTTTTTTTTTTT');
            }


            let startingItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content starting-items"] > div > div[class="item-row"] > div[class="item-dupe"] > div[class="item-img"]');
            let mythicCoreItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div > div[class="item-row"] > div[class] > div[class="item-img"]');
            let mythicCoreItemOptions2 = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div > div[class="item-row mythic-row"] > div > div[class="item-img"]');
            let fourthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-1"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
            let fifthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-2"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
            let sixthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-3"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');

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


            if(mythicCoreItemsList.length === 0) {
                data['mythicCoreItems'] = mythicCoreItemsList2
            } else {
                data['mythicCoreItems'] = mythicCoreItemsList;
            }


            data['startingItems'] = startingItemsList;
            data['fourthItems'] = fourthItemsList;
            data['fifthItems'] = fifthItemsList;
            data['sixthItems'] = sixthItemsList;

            let positionInfo = data['position'].split(' ');

            data['champion'] = champion;
            data['position'] = positionInfo[2].slice(0, -1);

            delete data['skillOrder'];

            data['shards'] = normalizeShards(data['shards']);
            data['runes'] = normalizeRunes(data['runes']);

            await browser.close();

        } catch (error) {
            console.error(error);
        }

        console.log(data);

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
        normalizedRunes.push(normalizedRune.trim());
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

}

async function funnyGoofyTest() {
    console.log('Inside Pull and Save Champion Data');
    const uri = "mongodb+srv://discordbot:" + process.env.DATABASE_PASSWORD + "@botcluster.1j2yr.mongodb.net/champion_data?retryWrites=true&w=majority";
    const databaseClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await databaseClient.connect();
    const database = databaseClient.db('champion_data');
    const builds = database.collection('build_data');
    let championData = [];

    for await(let champion of VALID_CHAMPIONS_LIST) {
        for await (let position of NORMALIZED_POSITIONS_LIST) {
            await databaseClient.connect();
            const database = databaseClient.db('champion_data');
            const builds = database.collection('build_data');

            let uri = "";
            let data;

            uri =  await uriUtilities.buildUriForChampionAndPosition(champion, position);
            if(champion !== 'aphelios' && position !== 'jungle') {
                try {
                    console.log(uri);
                    const browser = await puppeteer.launch();
                    const [page] = await browser.pages();
                    await page.setViewport({width: 400, height: 400})
                    await page.goto(uri)

                    data = await page.evaluate(async () => {
                        return {
                            runes: (Array.from(document.querySelectorAll('div.perk.perk-active')).map(x => x.innerHTML).splice(0, 6)).map(x => x.slice(x.indexOf('alt=') + 5, x.indexOf(">") - 1)),
                            shards: (Array.from(document.querySelectorAll('div.shard.shard-active')).map(x => x.innerHTML).splice(0, 3)).map(x => x.slice(x.indexOf('alt=') + 5, x.indexOf(">") - 1)),
                            primaryTreeName: document.querySelector('div.rune-trees-container-2.media-query.media-query_MOBILE_LARGE__DESKTOP_LARGE > div > div.rune-tree_v2.primary-tree > div.rune-tree_header > div.perk-style-title').innerHTML,
                            secondaryTreeName: document.querySelector('div.rune-trees-container-2.media-query.media-query_MOBILE_LARGE__DESKTOP_LARGE > div.secondary-tree > div > div.rune-tree_v2 > div.rune-tree_header > div.perk-style-title').innerHTML,
                            skillOrder: Array.from(document.querySelectorAll('div.skill-path-container > div.skill-order-row > div.skill-order')).map(x => x.innerHTML),
                            image: document.querySelector('img.champion-image').src,
                            position: document.querySelector('span.champion-title').innerHTML,
                            winrate: document.querySelector('div.win-rate > div.value').innerHTML,
                            summoners: (Array.from(document.querySelectorAll('div.content-section_content.summoner-spells > div > img')).map(x => x.alt)).map(x => x.split(" ")[2]),

                        };
                    });

                    let defaultRole = false;
                    let splitUrl = page.url().split("/")
                    if (!splitUrl[splitUrl.length - 1].includes(position)) {
                        defaultRole = true;
                    }


                    let startingItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content starting-items"] > div > div[class="item-row"] > div[class="item-dupe"] > div[class="item-img"]');
                    let mythicCoreItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div > div[class="item-row"] > div[class] > div[class="item-img"]');
                    let mythicCoreItemOptions2 = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div > div[class="item-row mythic-row"] > div > div[class="item-img"]');
                    let fourthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-1"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
                    let fifthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-2"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
                    let sixthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-3"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');

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


                    if (mythicCoreItemsList.length === 0) {
                        data['mythicCoreItems'] = mythicCoreItemsList2
                    } else {
                        data['mythicCoreItems'] = mythicCoreItemsList;
                    }


                    data['startingItems'] = startingItemsList;
                    data['fourthItems'] = fourthItemsList;
                    data['fifthItems'] = fifthItemsList;
                    data['sixthItems'] = sixthItemsList;

                    data['champion'] = champion;
                    data['position'] = position;
                    data['defaultRole'] = defaultRole;

                    delete data['skillOrder'];

                    data['shards'] = normalizeShards(data['shards']);
                    data['runes'] = normalizeRunes(data['runes']);
                    data['_id'] = uuidv4(undefined, undefined, undefined);

                    await page.close();
                    await browser.close();

                } catch (error) {
                    console.error(error);
                }
            }

            console.log(data);
            console.log('Finished for ' + champion + " " + position);
            let champComp = champion;
            let positionComp = position;

            // console.log(await builds.findOne({
            //     champion: 'aatrox',
            //     position: 'jungle'
            // }));

            if(await builds.findOne({champion: '' + champComp, position: '' + positionComp}) === null) {
                if(data) {
                    await builds.insertOne(data);
                }
            }
            // await databaseClient.close();

            championData.push(data);



        }
    }

    // await builds.insertMany(championData).then(() => {
    //     console.log('lmao it worked');
    // });

    // await databaseClient.close();
}

async function fetchPairsNotPopulated() {
    const uri = "mongodb+srv://discordbot:" + process.env.DATABASE_PASSWORD + "@botcluster.1j2yr.mongodb.net/champion_data?retryWrites=true&w=majority";
    // const databaseClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const databaseClient = new MongoClient(uri);
    await databaseClient.connect();
    const database = databaseClient.db('champion_data');
    const builds = database.collection('build_data');

    let databaseChampPosPairs = await builds.find({}).toArray();
    let possibleChampPosPairs = [];
    let populatedChampPosPairs = [];
    let champPosPairsToPull = [];


    for(let build of databaseChampPosPairs) {
        populatedChampPosPairs.push([build['champion'], build['position']]);
    }

    for await(let champion of VALID_CHAMPIONS_LIST) {
        for await (let position of NORMALIZED_POSITIONS_LIST) {
            possibleChampPosPairs.push([champion, position]);
        }
    }

    // console.log(populatedChampPosPairs);
    // console.log(possibleChampPosPairs);

    for(let one of possibleChampPosPairs) {
        let populated = false;
        for(let two of populatedChampPosPairs) {
           if((two[0] === one[0]) && (two[1] === one[1])) {
               populated = true;
           }
        }
        if(!populated) {
            champPosPairsToPull.push(one);
        }
    }

    // console.log(champPosPairsToPull);

    console.log('Inside Pull and Save Champion Data');
    // const uri = "mongodb+srv://discordbot:" + process.env.DATABASE_PASSWORD + "@botcluster.1j2yr.mongodb.net/champion_data?retryWrites=true&w=majority";
    // const databaseClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    // await databaseClient.connect();
    // const database = databaseClient.db('champion_data');
    // const builds = database.collection('build_data');
    // let championData = [];

    // for await(let champion of VALID_CHAMPIONS_LIST) {
    //     for await (let position of NORMALIZED_POSITIONS_LIST) {
    for await(let pair of champPosPairsToPull) {
            let champion = pair[0];
            let position = pair[1];

            await databaseClient.connect();
            const database = databaseClient.db('champion_data');
            const builds = database.collection('build_data');

            let uri = "";
            let data;

            uri =  await uriUtilities.buildUriForChampionAndPosition(champion, position);
            // uri =  await uriUtilities.buildUriForChampionAndPosition('vayne', 'bot');

            // if(champion !== 'aphelios' && position !== 'jungle') {
                try {
                    console.log(uri);
                    const browser = await puppeteer.launch();
                    const [page] = await browser.pages();
                    await page.setViewport({width: 400, height: 400})
                    await page.goto(uri, { waitUntil: 'networkidle0' })


                    data = await page.evaluate(async () => {
                        // // console.log('in evaluate')
                        // let retObject = {};
                        //
                        // // let runesArray = Array.from(document.querySelectorAll('div.perk.perk-active'));
                        // // if(runesArray) {
                        // //     retObject['runes'] = runesArray.map(x => x.innerHTML).splice(0, 6)).map(x => x.slice(x.indexOf('alt=') + 5, x.indexOf(">") - 1));
                        // // }
                        // // let shardsArray = Array.from(document.querySelectorAll('div.shard.shard-active'));
                        // // if(shardsArray) {
                        // //     retObject['shards'] = shardsArray.map(x => x.innerHTML).splice(0, 3)).map(x => x.slice(x.indexOf('alt=') + 5, x.indexOf(">") - 1));
                        // // }
                        // // retObject["primaryTreeName"] = document.querySelector('div.rune-trees-container-2.media-query.media-query_MOBILE_LARGE__DESKTOP_LARGE > div > div.rune-tree_v2.primary-tree > div.rune-tree_header > div.perk-style-title').innerHTML;
                        // // retObject["secondaryTreeName"] = document.querySelector('div.rune-trees-container-2.media-query.media-query_MOBILE_LARGE__DESKTOP_LARGE > div.secondary-tree > div > div.rune-tree_v2 > div.rune-tree_header > div.perk-style-title').innerHTML;
                        //
                        // retObject['runes'] = (Array.from(document.querySelectorAll('div.perk.perk-active')).map(x => x.innerHTML).splice(0, 6)).map(x => x.slice(x.indexOf('alt=') + 5, x.indexOf(">") - 1));
                        // retObject['shards'] = (Array.from(document.querySelectorAll('div.shard.shard-active')).map(x => x.innerHTML).splice(0, 3)).map(x => x.slice(x.indexOf('alt=') + 5, x.indexOf(">") - 1));
                        // retObject['primaryTreeName'] = document.querySelector('div.rune-trees-container-2.media-query.media-query_MOBILE_LARGE__DESKTOP_LARGE > div > div.rune-tree_v2.primary-tree > div.rune-tree_header > div.perk-style-title').innerHTML;
                        // retObject['secondaryTreeName'] = document.querySelector('div.rune-trees-container-2.media-query.media-query_MOBILE_LARGE__DESKTOP_LARGE > div.secondary-tree > div > div.rune-tree_v2 > div.rune-tree_header > div.perk-style-title').innerHTML;
                        //
                        // let skillOrderArray = Array.from(document.querySelectorAll('div.skill-path-container > div.skill-order-row > div.skill-order'));
                        // if(skillOrderArray) {
                        //     retObject['skillOrder'] = skillOrderArray.map(x => x.innerHTML);
                        // }
                        //
                        // retObject['image'] = document.querySelector('img.champion-image');
                        // retObject['position'] = document.querySelector('span.champion-title').innerHTML;
                        // retObject['winrate'] = document.querySelector('div.win-rate > div.value').innerHTML;
                        // retObject['summoners'] = (Array.from(document.querySelectorAll('div.content-section_content.summoner-spells > div > img')).map(x => x.alt)).map(x => x.split(" ")[2]);
                        //
                        //
                        // return retObject;
                        return {
                            runes: (Array.from(document.querySelectorAll('div.perk.perk-active')).map(x => x.innerHTML).splice(0, 6)).map(x => x.slice(x.indexOf('alt=') + 5, x.indexOf(">") - 1)),
                            shards: (Array.from(document.querySelectorAll('div.shard.shard-active')).map(x => x.innerHTML).splice(0, 3)).map(x => x.slice(x.indexOf('alt=') + 5, x.indexOf(">") - 1)),
                            primaryTreeName: document.querySelector('div.rune-trees-container-2.media-query.media-query_MOBILE_LARGE__DESKTOP_LARGE > div > div.rune-tree_v2.primary-tree > div.rune-tree_header > div.perk-style-title').innerHTML,
                            secondaryTreeName: document.querySelector('div.rune-trees-container-2.media-query.media-query_MOBILE_LARGE__DESKTOP_LARGE > div.secondary-tree > div > div.rune-tree_v2 > div.rune-tree_header > div.perk-style-title').innerHTML,
                            skillOrder: Array.from(document.querySelectorAll('div.skill-path-container > div.skill-order-row > div.skill-order')).map(x => x.innerHTML),
                            image: document.querySelector('img.champion-image'),
                            position: document.querySelector('span.champion-title').innerHTML,
                            winrate: document.querySelector('div.win-rate > div.value').innerHTML,
                            summoners: (Array.from(document.querySelectorAll('div.content-section_content.summoner-spells > div > img')).map(x => x.alt)).map(x => x.split(" ")[2]),
                        };
                    });

                    console.log(data);
                    // break;

                    let defaultRole = false;
                    let splitUrl = page.url().split("/")
                    if (!splitUrl[splitUrl.length - 1].includes(position)) {
                        defaultRole = true;
                    }


                    let startingItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content starting-items"] > div > div[class="item-row"] > div[class="item-dupe"] > div[class="item-img"]');
                    let mythicCoreItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div > div[class="item-row"] > div[class] > div[class="item-img"]');
                    let mythicCoreItemOptions2 = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div > div[class="item-row mythic-row"] > div > div[class="item-img"]');
                    let fourthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-1"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
                    let fifthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-2"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');
                    let sixthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-3"] > div[class="item-option-list"] > div[class="item-option"] > div[class="item-img"]');


                    //TODO: THESE NEED TO BE SURROUNDED BY NULL CHECKS

                    // if(data["skillOrder"]) {
                    //     let qLevelOrder = extractSkillOrder(data["skillOrder"][0]);
                    // }
                    //
                    // if(data["skillOrder"]) {
                    //     let wLevelOrder = extractSkillOrder(data["skillOrder"][1]);
                    // }
                    //
                    // if(data["skillOrder"][2]) {
                    //     let eLevelOrder = extractSkillOrder(data["skillOrder"][2]);
                    // }
                    //
                    // if(data["skillOrder"][3]) {
                    //     let rLevelOrder = extractSkillOrder(data["skillOrder"][3]);
                    // }

                    let qLevelOrder
                    let wLevelOrder
                    let eLevelOrder
                    let rLevelOrder

                    console.log(data);

                    if(data["skillOrder"]) {
                       qLevelOrder = extractSkillOrder(data["skillOrder"][0]);
                       wLevelOrder = extractSkillOrder(data["skillOrder"][1]);
                       eLevelOrder = extractSkillOrder(data["skillOrder"][2]);
                       rLevelOrder = extractSkillOrder(data["skillOrder"][3]);
                    }


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


                    if (mythicCoreItemsList.length === 0) {
                        data['mythicCoreItems'] = mythicCoreItemsList2
                    } else {
                        data['mythicCoreItems'] = mythicCoreItemsList;
                    }


                    data['startingItems'] = startingItemsList;
                    data['fourthItems'] = fourthItemsList;
                    data['fifthItems'] = fifthItemsList;
                    data['sixthItems'] = sixthItemsList;

                    data['champion'] = champion;
                    data['position'] = position;
                    data['defaultRole'] = defaultRole;

                    delete data['skillOrder'];

                    data['shards'] = normalizeShards(data['shards']);
                    data['runes'] = normalizeRunes(data['runes']);
                    data['_id'] = uuidv4(undefined, undefined, undefined);

                    await page.close();
                    await browser.close();

                } catch (error) {
                    console.error(error);
                }
            // }

            console.log(data);
            console.log('Finished for ' + champion + " " + position);
            let champComp = champion;
            let positionComp = position;

            // console.log(await builds.findOne({
            //     champion: 'aatrox',
            //     position: 'jungle'
            // }));

            if(await builds.findOne({champion: '' + champComp, position: '' + positionComp}) === null) {
                if(data) {
                    await builds.insertOne(data);
                }
            }
            await databaseClient.close();

            // championData.push(data);



        }


    // await builds.insertMany(championData).then(() => {
    //     console.log('lmao it worked');
    // });

    // await databaseClient.close();


}


module.exports.championDataService = {
    pullAndSaveChampionData,
    funnyGoofyTest,
    fetchPairsNotPopulated
}