//The purpose of this controller is to pull data out, validate it, and then send to services
const {INVALID_COMMAND, VALID_CHAMPIONS_LIST, VALID_POSITIONS_LIST} = require("../utils/GlobalConstants");
let prefix = process.env.PREFIX

async function parseMessage(message) {
    //for now we'll have to validate the message
    if(isValidCommand(message)) {

    } else {
        return INVALID_COMMAND;
    }


    //
    // if(isSearchingForChampionData(message)) {
    //
    // }
}

function isSearchingForChampionData(message) {
}

function isValidCommand(message) {
    //we know the message already starts with ??
    //Ex: ??Vayne Top
    //What about: ?? Vayne Top
    //What about just Vayne

    let messageContent = message['content'];

    messageContent = messageContent.replace(prefix, "");
    let messageArr = new Set(messageContent.split(" "));
    messageArr.delete(" ");
    messageArr.delete('');
    messageArr = Array.from(messageArr);

    //TODO: refactor this so that I'm not calling toLowerCase on all of these
    //Crazy normalization function
    let firstItemToCheck = '';
    let secondItemToCheck = '';

    if(messageArr[0]) {
        firstItemToCheck = messageArr[0].toLowerCase();
    }

    if(messageArr[1]) {
        secondItemToCheck = messageArr[1].toLowerCase();
    }

    if(firstItemToCheck === "nunu"
        || secondItemToCheck === "willump"
        || secondItemToCheck === "and"
        || secondItemToCheck === '&') {

        console.log('inside nunu check');
        console.log(messageArr);

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
            console.log(messageArr);
        } else {
            messageArr = ['aurelion sol'];
            console.log(messageArr);
        }
    } else if(firstItemToCheck === "chogath"
        || firstItemToCheck === "cho"
        || (secondItemToCheck === '\'' && firstItemToCheck === "cho")
        || secondItemToCheck === 'gath'
        || firstItemToCheck === "cho'"
        || secondItemToCheck === "'gath") {

        console.log('inside cho gath check');

    }

    console.log(2, messageArr);


    if(messageArr.length > 2) {
        return false;
    }

    if(messageArr.length === 1) {
        console.log(messageArr);
        let champion = messageArr[0].toLowerCase();
        if(validChampion(champion)) {
            console.log('VALID CHAMPION');
        } else {
            console.log('INVALID CHAMPION');
        }
        return true;
    } else {
        let champion = messageArr[0].toLowerCase();
        let position = messageArr[1].toLowerCase();

        console.log(VALID_CHAMPIONS_LIST.length);
        return true;
    }

}

function validChampion(champion) {
    //TODO: This is so bad lol. Maybe I do this in the call to the API instead?
    champion = champion.toLowerCase();


    if(VALID_CHAMPIONS_LIST.includes(champion)) {
        return true;
    } else {
        return false;
    }


}

function validPosition(position) {
    position = position.toLowerCase();

    if(VALID_POSITIONS_LIST.includes(position)) {
        return true;
    } else {
        return false;
    }

}



module.exports.userController = {
    parseMessage,
}