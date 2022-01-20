const {BASE_UGG_URI} = require("../utils/GlobalConstants");

let baseUri = BASE_UGG_URI;

async function buildUriForChampion(champion) {
    champion = champion.replace(/\s/g, "").replace(/'/g,"");
    return baseUri + champion + '/build';
}

async function buildUriForChampionAndPosition(champion, position) {
    champion = champion.replace(/\s/g, "").replace(/'/g,"");
    position = position.toLowerCase();

    if(position === 'top') {
        return baseUri + champion + '/build?role=top';
    } else if ((position === 'middle') || (position === 'mid')) {
        return baseUri + champion + '/build?role=middle';
    } else if ((position === 'jg') || (position === 'jungle')) {
        return baseUri + champion + '/build?role=jungle';
    } else if ((position === 'adc') || (position === 'bot') || (position === 'bottom')) {
        return baseUri + champion + '/build?role=adc';
    } else if ((position === 'sup') || (position === 'supp') || (position === 'support')) {
        return baseUri + champion + '/build?role=support';
    }
}

module.exports.uriUtilities = {
    buildUriForChampionAndPosition,
    buildUriForChampion
}

