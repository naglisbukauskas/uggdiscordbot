//The purpose of this controller is to pull data out, validate it, and then send to services
const {INVALID_COMMAND, VALID_CHAMPIONS_LIST, VALID_POSITIONS_LIST, INTERNAL_ERROR} = require("../utils/GlobalConstants");
const {championBuildService} = require("../services/ChampionBuildService");
const {utilities} = require("../utils/Utilities");
let prefix = process.env.PREFIX

let champPosArr;

async function parseMessage(message) {
    //in this case, the controller really only has one service to route to
    //but once I add other user commands this will have to change
    if(isValidCommand(message)) {
        if(champPosArr) {
            return await championBuildService.fetchAndProcessChampionData(champPosArr);
        } else {
            return INTERNAL_ERROR;
        }
    } else {
        return INVALID_COMMAND;
    }

}

function isValidCommand(message) {
    let messageContent = message['content'];
    messageContent = messageContent.replace(prefix, "");

    let messageArr = new Set(messageContent.split(" "));
    messageArr.delete(" ");
    messageArr.delete('');

    messageArr = Array.from(messageArr);
    messageArr = utilities.normalizeChampionName(messageArr);

    if(messageArr.length > 2) {
        return false;
    }

    if(messageArr.length === 1) {
        let champion = messageArr[0].toLowerCase();
        if(validChampion(champion)) {
            champPosArr = messageArr;
            return true;
        } else {
            return false;
        }
    } else {
        let champion = messageArr[0].toLowerCase();
        let position = messageArr[1].toLowerCase();

        if(validChampion(champion)) {
            if(validPosition(position)) {
                champPosArr = messageArr;
                return true;
            }
        } else {
            return false;
        }
    }

}

function validChampion(champion) {
    champion = champion.toLowerCase();
    return VALID_CHAMPIONS_LIST.includes(champion);
}

function validPosition(position) {
    position = position.toLowerCase();
    return VALID_POSITIONS_LIST.includes(position);
}

module.exports.userController = {
    parseMessage,
}