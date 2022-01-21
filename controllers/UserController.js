//The purpose of this controller is to pull data out, validate it, and then send to services
const {INVALID_COMMAND, VALID_CHAMPIONS_LIST, VALID_POSITIONS_LIST, INTERNAL_ERROR} = require("../utils/GlobalConstants");
const {championBuildService} = require("../services/ChampionBuildService");
let prefix = process.env.PREFIX

let champPosArr;

async function parseMessage(message) {
    //in this case, the controller really only has one service to route to
    //but once I add other user commands this will have to change
    if(isValidCommand(message)) {
        if(champPosArr) {
            // console.log(await championBuildService.fetchAndProcessChampionData(champPosArr))

            return JSON.stringify(await championBuildService.fetchAndProcessChampionData(champPosArr));
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
    messageArr = normalizeInput(messageArr);

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

function normalizeInput(messageArr) {

    //Todo: This is extremely brute force. I think I can make this better by grouping similar names (twisted fate, lee sin, xin zhao, etc,) and their functionality

    let firstItemToCheck = '';
    let secondItemToCheck = '';

    if(messageArr[0]) firstItemToCheck = messageArr[0].toLowerCase();
    if(messageArr[1]) secondItemToCheck = messageArr[1].toLowerCase();

    if(firstItemToCheck === "nunu"
        || secondItemToCheck === "willump"
        || secondItemToCheck === "and"
        || secondItemToCheck === '&') {

        if(messageArr.length > 1) {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ['nunu & willump', position]
            } else {
                return false;
            }
        } else {
            messageArr = ['nunu & willump'];
        }
    } else if(firstItemToCheck === "dr."
        || firstItemToCheck === "dr"
        || firstItemToCheck === "mundo"
        || firstItemToCheck === "dr.mundo"
        || firstItemToCheck === "doctor") {
        if(messageArr.length > 2 && secondItemToCheck === 'mundo') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ['dr.mundo', position]
            } else {
                return false;
            }
        } else if((firstItemToCheck === 'dr' || firstItemToCheck === 'dr.') && secondItemToCheck === 'mundo') {
            messageArr = ['dr. mundo'];
        } else {
            messageArr = ['dr. mundo'];
        }
    } else if(firstItemToCheck === "aurelion"
        || secondItemToCheck === "sol"
        || firstItemToCheck === "aurelionsol") {

        if(messageArr.length > 2 && secondItemToCheck === 'sol') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ['aurelion sol', position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'aurelion' && secondItemToCheck === 'sol') {
            messageArr = ['aurelion sol'];
        } else {
            messageArr = ['aurelion sol'];
        }
    } else if(firstItemToCheck === "chogath"
        || firstItemToCheck === "cho"
        || (secondItemToCheck === '\'' && firstItemToCheck === "cho")
        || secondItemToCheck === 'gath'
        || firstItemToCheck === "cho'"
        || secondItemToCheck === "'gath") {
        if (messageArr.length > 2 && secondItemToCheck === 'gath') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["cho'gath", position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'cho' && messageArr.length === 2) {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["cho'gath", position]
            } else {
                return false;
            }
        } else if(messageArr.length === 2 && (firstItemToCheck === "chogath" || firstItemToCheck === "cho'gath") && validPosition(secondItemToCheck))  {
            messageArr = ["cho'gath", secondItemToCheck]
        } else if((firstItemToCheck === 'cho' || firstItemToCheck === "cho'") && secondItemToCheck === 'gath') {
            messageArr = ["cho'gath"];
        } else {
            messageArr = ["cho'gath"];
        }
    } else if(firstItemToCheck === "jarvan"
        || secondItemToCheck === "iv"
        || firstItemToCheck === "jarvaniv"
        || firstItemToCheck === "j4"
        || secondItemToCheck === '4') {

        if(messageArr.length > 2 && (secondItemToCheck === 'iv' || secondItemToCheck === '4')) {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ['jarvan iv', position]
            } else {
                return false;
            }
        } else if(messageArr.length === 2 && (firstItemToCheck === 'j4' || firstItemToCheck === 'jarvan') && validPosition(secondItemToCheck))  {
            messageArr = ['jarvan iv', secondItemToCheck]
        } else if(firstItemToCheck === 'jarvan' && (secondItemToCheck === 'iv' || secondItemToCheck === '4')) {
            messageArr = ['jarvan iv'];
        } else {
            messageArr = ['jarvan iv'];
        }
    } else if(firstItemToCheck === "kaisa"
        || firstItemToCheck === "kai"
        || (secondItemToCheck === '\'' && firstItemToCheck === "kai")
        || secondItemToCheck === 'sa'
        || firstItemToCheck === "kai'"
        || secondItemToCheck === "'sa") {


        if (messageArr.length > 2 && secondItemToCheck === 'sa') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["kai'sa", position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'kai' && messageArr.length > 2) {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["kai'sa", position]
            } else {
                return false;
            }
        } else if(messageArr.length === 2 && (firstItemToCheck === 'kaisa' || firstItemToCheck === "kai'sa") && validPosition(secondItemToCheck))  {
            messageArr = ["kai'sa", secondItemToCheck]
        } else if((firstItemToCheck === 'kai' || firstItemToCheck === "kai'") && secondItemToCheck === 'sa') {
            messageArr = ["kai'sa"];
        } else {
            messageArr = ["kai'sa"];
        }
    } else if(firstItemToCheck === "khazix"
        || firstItemToCheck === "kha"
        || (secondItemToCheck === '\'' && firstItemToCheck === "kha")
        || secondItemToCheck === 'zix'
        || firstItemToCheck === "kha'"
        || secondItemToCheck === "'zix") {

        if (messageArr.length > 2 && secondItemToCheck === 'zix') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["kha'zix", position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'kha' && messageArr.length > 2) {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["kha'zix", position]
            } else {
                return false;
            }
        } else if(messageArr.length === 2 && (firstItemToCheck === 'khazix' || firstItemToCheck === "kha'zix" || firstItemToCheck === "kha") && validPosition(secondItemToCheck))  {
            messageArr = ["kha'zix", secondItemToCheck]
        } else if((firstItemToCheck === 'kha' || firstItemToCheck === "kha'") && secondItemToCheck === 'zix') {
            messageArr = ["kha'zix"];
        } else {
            messageArr = ["kha'zix"];
        }
    } else if(firstItemToCheck === "kogmaw"
        || firstItemToCheck === "kog"
        || (secondItemToCheck === '\'' && firstItemToCheck === "kog")
        || secondItemToCheck === 'maw'
        || firstItemToCheck === "kog'"
        || secondItemToCheck === "'maw") {

        if (messageArr.length > 2 && secondItemToCheck === 'maw') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["kog'maw", position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'kog' && messageArr.length > 2) {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["kog'maw", position]
            } else {
                return false;
            }
        } else if(messageArr.length === 2 && (firstItemToCheck === 'kogmaw' || firstItemToCheck === "kog'maw" || firstItemToCheck === "kog") && validPosition(secondItemToCheck))  {
            messageArr = ["kog'maw", secondItemToCheck]
        } else if((firstItemToCheck === 'kog' || firstItemToCheck === "kog'") && secondItemToCheck === 'maw') {
            messageArr = ["kog'maw"];
        } else {
            messageArr = ["kog'maw"];
        }
    } else if(firstItemToCheck === "lee"
        || secondItemToCheck === "sin"
        || firstItemToCheck === "leesin") {

        if(messageArr.length > 2 && secondItemToCheck === 'sin') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ['lee sin', position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'lee' && secondItemToCheck === 'sin') {
            messageArr = ['lee sin'];
        } else if(firstItemToCheck === 'lee' && validPosition(secondItemToCheck)) {
            messageArr = ['lee sin', secondItemToCheck];
        } else {
            messageArr = ['lee sin'];
        }
    } else if(firstItemToCheck === "master"
        || secondItemToCheck === "yi"
        || firstItemToCheck === "masteryi"
        || firstItemToCheck === "yi") {

        if(messageArr.length > 2 && secondItemToCheck === 'yi') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ['master yi', position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'master' && secondItemToCheck === 'yi') {
            messageArr = ['master yi'];
        } else if(firstItemToCheck === 'yi' && validPosition(secondItemToCheck)) {
            messageArr = ['master yi', secondItemToCheck];
        } else {
            messageArr = ['master yi'];
        }
    } else if(firstItemToCheck === "miss"
        || secondItemToCheck === "fortune"
        || firstItemToCheck === "missfortune"
        || firstItemToCheck === "mf") {

        if(messageArr.length > 2 && secondItemToCheck === 'fortune') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ['miss fortune', position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'miss' && secondItemToCheck === 'fortune') {
            messageArr = ['miss fortune'];
        } else if(firstItemToCheck === 'mf' && validPosition(secondItemToCheck)) {
            messageArr = ['miss fortune', secondItemToCheck];
        } else {
            messageArr = ['miss fortune'];
        }
    } else if(firstItemToCheck === "reksai"
    || firstItemToCheck === "rek"
    || (secondItemToCheck === '\'' && firstItemToCheck === "rek")
    || secondItemToCheck === 'sai'
    || firstItemToCheck === "rek'"
    || secondItemToCheck === "'sai") {

        if (messageArr.length > 2 && secondItemToCheck === 'sai') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["rek'sai", position]
            } else {
                return false;
            }
        } else if (firstItemToCheck === 'rek' && messageArr.length > 2) {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["rek'sai", position]
            } else {
                return false;
            }
        } else if (messageArr.length === 2 && (firstItemToCheck === 'reksai' || firstItemToCheck === "rek'sai" || firstItemToCheck === "rek") && validPosition(secondItemToCheck)) {
            messageArr = ["rek'sai", secondItemToCheck]
        } else if ((firstItemToCheck === 'rek' || firstItemToCheck === "rek'") && secondItemToCheck === 'sai') {
            messageArr = ["rek'sai"];
        } else {
            messageArr = ["rek'sai"];
        }
    } else if(firstItemToCheck === "tahm"
        || secondItemToCheck === "kench"
        || firstItemToCheck === "tahmkench") {

        if(messageArr.length > 2 && secondItemToCheck === 'kench') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ['tahm kench', position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'tahm' && secondItemToCheck === 'kench') {
            messageArr = ['tahm kench'];
        } else if(firstItemToCheck === 'tahm' && validPosition(secondItemToCheck)) {
            messageArr = ['tahm kench', secondItemToCheck];
        } else {
            messageArr = ['tahm kench'];
        }
    } else if(firstItemToCheck === "twisted"
        || secondItemToCheck === "fate"
        || firstItemToCheck === "twistedfate"
        || firstItemToCheck === "tf") {

        if(messageArr.length > 2 && secondItemToCheck === 'fate') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ['twisted fate', position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'twisted' && secondItemToCheck === 'fate') {
            messageArr = ['twisted fate'];
        } else if(firstItemToCheck === 'tf' && validPosition(secondItemToCheck)) {
            messageArr = ['twisted fate', secondItemToCheck];
        } else {
            messageArr = ['twisted fate'];
        }
    }  else if(firstItemToCheck === "velkoz"
        || firstItemToCheck === "vel"
        || (secondItemToCheck === '\'' && firstItemToCheck === "vel")
        || secondItemToCheck === 'koz'
        || firstItemToCheck === "vel'"
        || secondItemToCheck === "'koz") {

        if (messageArr.length > 2 && secondItemToCheck === 'koz') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["vel'koz", position]
            } else {
                return false;
            }
        } else if (firstItemToCheck === 'vel' && messageArr.length > 2) {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ["vel'koz", position]
            } else {
                return false;
            }
        } else if (messageArr.length === 2 && (firstItemToCheck === 'velkoz' || firstItemToCheck === "vel'koz" || firstItemToCheck === "vel") && validPosition(secondItemToCheck)) {
            messageArr = ["vel'koz", secondItemToCheck]
        } else if ((firstItemToCheck === 'vel' || firstItemToCheck === "vel'") && secondItemToCheck === 'koz') {
            messageArr = ["vel'koz"];
        } else {
            messageArr = ["vel'koz"];
        }
    }  else if(firstItemToCheck === "xin"
        || secondItemToCheck === "zhao"
        || firstItemToCheck === "xinzhao") {

        if(messageArr.length > 2 && secondItemToCheck === 'zhao') {
            let position = messageArr[messageArr.length - 1];
            if (validPosition(position)) {
                messageArr = ['xin zhao', position]
            } else {
                return false;
            }
        } else if(firstItemToCheck === 'xin' && secondItemToCheck === 'zhao') {
            messageArr = ['xin zhao'];
        } else if(firstItemToCheck === 'xin' && validPosition(secondItemToCheck)) {
            messageArr = ['xin zhao', secondItemToCheck];
        } else {
            messageArr = ['xin zhao'];
        }
    }

    return messageArr;
}



module.exports.userController = {
    parseMessage,
}