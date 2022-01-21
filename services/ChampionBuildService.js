const puppeteer = require('puppeteer');
const {uriUtilities} = require('../utils/URIUtilities');
const {Mouse} = require("puppeteer");

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
        //TODO: This seems to make the item evaluation work
        await page.setViewport({ width: 400, height: 400 })

        // await page.goto('https://u.gg/lol/champions/vayne/build',  { waitUntil: 'networkidle0' });
        //TODO: If there are any issues with reliability, it will most likely be here.
        await page.goto(uri);
        await page.addStyleTag({ content: "{scroll-behavior: auto !important;}" });
        //
        // page.lo
        // const data = await page.evaluate(() => document.querySelector('div.rune-tree_v2').outerHTML);
        // const data = await page.evaluate((selector) => {
        //     return {
        //         body: document.querySelector(selector).outerHTML,
        //     };
        // }, 'div.rune-tree_v2');
        //TODO: CAN GET STARTING ITEMS OFF OF BACKGROUND POSITION
        //TODO: OR WE LOOK AT HOVER;
        //TODO: ITEM NAMES WILL HAVE TO BE A LIST OF HOVERS

        let data;



        // let imageItems = await page.$$('div[class="item-img"]');
        // let imageItems = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_TABLET__DESKTOP_SMALL"] > div[class="content-section_content starting-items"] > div[class="item-row"] > div[class="item-dupe"] > div[class=""item-img]');
        let startingItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content starting-items"] > div > div[class="item-row"] > div[class="item-dupe"]');
        let coreItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content core-items mythic-border-container"] > div > div[class="item-row"] > div[class="item-dupe"]');
        let fourthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-1"] > div > div[class="item-row"] > div[class="item-dupe"]');
        let fifthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-2"] > div > div[class="item-row"] > div[class="item-dupe"]');
        let sixthItemOptions = await page.$$('div[class="content-section content-section_no-padding recommended-build_items media-query media-query_MOBILE_SMALL__MOBILE_LARGE"] > div[class="content-section_content item-options item-options-3"] > div > div[class="item-row"] > div[class="item-dupe"]');

        let startingItemsList = await evaluateImages(page, startingItemOptions);
        let coreItemsList = await evaluateImages(page, coreItemOptions);
        let FourthItemsList = await evaluateImages(page, fourthItemOptions);
        let FifthItemsList = await evaluateImages(page, fifthItemOptions);
        let SixthItemsList = await evaluateImages(page, sixthItemOptions);

        console.log(startingItemsList);


        // let imageItems = await page.$$('div[class="item-option"]');

        // imageItems = imageItems.splice(0, (imageItems.length/3));

        //
        // for await (let image of imageItems) {
        //     try {
        //         await image.hover().then(async () => {
        //             data = await page.evaluate(async (selector) => {
        //
        //                 // await page.hover('div.item-img').then(() => {
        //                 //     console.log('hello');
        //                 // })
        //
        //                 return {
        //                     // keystone: document.querySelector('div.perk.keystone.perk-active').innerHTML,
        //                     runes: Array.from(document.querySelectorAll('div.perk.perk-active')).map(x => x.innerHTML).splice(0, 6),
        //                     shards: Array.from(document.querySelectorAll('div.shard.shard-active')).map(x => x.innerHTML).splice(0, 3),
        //                     startingItems: Array.from(document.querySelectorAll('div.item-dupe')).map(x => x.innerHTML),
        //                     // curious: Array.from(document.querySelectorAll('div.tooltip-portal')).map(x => x.innerHTML)
        //                     curious: document.querySelector('div.tooltip-item').innerHTML
        //
        //                 };
        //             }, 'div.perk.keystone.perk-active');
        //         });
        //         console.log(data);
        //     } catch (error) {
        //         console.log(error);
        //     }
        // }




        // console.log(test);



        // await imageItems[12].hover().then(async () => {
        //     data = await page.evaluate(async (selector) => {
        //
        //         // await page.hover('div.item-img').then(() => {
        //         //     console.log('hello');
        //         // })
        //
        //         return {
        //             // keystone: document.querySelector('div.perk.keystone.perk-active').innerHTML,
        //             runes: Array.from(document.querySelectorAll('div.perk.perk-active')).map(x => x.innerHTML).splice(0, 6),
        //             shards: Array.from(document.querySelectorAll('div.shard.shard-active')).map(x => x.innerHTML).splice(0, 3),
        //             startingItems: Array.from(document.querySelectorAll('div.item-dupe')).map(x => x.innerHTML),
        //             // curious: Array.from(document.querySelectorAll('div.tooltip-portal')).map(x => x.innerHTML)
        //             curious: document.querySelector('div.tooltip-item').innerHTML
        //
        //         };
        //     }, 'div.perk.keystone.perk-active');
        // });

        // for(let naglis of imageItems) {
        //     await naglis.hover().then(async () => {
        //         await page.evaluate(async (selector) => {
        //
        //             test.push(document.querySelector('div.tooltip-item').innerHTML);
        //
        //         });
        //     })
        // }

        // console.log(test);

        // await page.hover('div.item-img').then(async () => {
        //     data = await page.evaluate(async (selector) => {
        //
        //         // await page.hover('div.item-img').then(() => {
        //         //     console.log('hello');
        //         // })
        //
        //         return {
        //             // keystone: document.querySelector('div.perk.keystone.perk-active').innerHTML,
        //             runes: Array.from(document.querySelectorAll('div.perk.perk-active')).map(x => x.innerHTML).splice(0, 6),
        //             shards: Array.from(document.querySelectorAll('div.shard.shard-active')).map(x => x.innerHTML).splice(0, 3),
        //             startingItems: Array.from(document.querySelectorAll('div.item-dupe')).map(x => x.innerHTML),
        //             // curious: Array.from(document.querySelectorAll('div.tooltip-portal')).map(x => x.innerHTML)
        //             curious: document.querySelector('div.tooltip-item').innerHTML
        //
        //         };
        //     }, 'div.perk.keystone.perk-active');
        // })

        // const data = await page.evaluate(async (selector) => {
        //
        //     // await page.hover('div.item-img').then(() => {
        //     //     console.log('hello');
        //     // })
        //
        //     return {
        //         // keystone: document.querySelector('div.perk.keystone.perk-active').innerHTML,
        //         runes: Array.from(document.querySelectorAll('div.perk.perk-active')).map(x => x.innerHTML).splice(0, 6),
        //         shards: Array.from(document.querySelectorAll('div.shard.shard-active')).map(x => x.innerHTML).splice(0, 3),
        //         startingItems: Array.from(document.querySelectorAll('div.item-dupe')).map(x => x.innerHTML),
        //         // curious: Array.from(document.querySelectorAll('div.tooltip-portal')).map(x => x.innerHTML)
        //         curious: document.querySelector('div.item-img').innerHTML
        //
        //     };
        // }, 'div.perk.keystone.perk-active');


        // await page.hover('div.item-img').then(() => {
        //     console.log(document.querySelector('div.tooltip-item').innerHTML);
        // });

        // await page.hover('div.item-img')
        // const imageItems = await page.$$('[class="images-view-list"]');




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

async function evaluateImages(page, imageItemsList) {
    let loadedItems = [];
    for await (let image of imageItemsList) {
        try {
            await image.hover().then(async () => {
                loadedItems.push(await page.evaluate(async (selector) => {
                    return {
                        curious: document.querySelector('div.tooltip-item').innerHTML
                    };
                }, 'div.perk.keystone.perk-active'));
            });
            console.log(data);
        } catch (error) {
            console.log(error);
        }
    }
    return loadedItems;
}

module.exports.championBuildService = {
    fetchAndProcessChampionData,
}