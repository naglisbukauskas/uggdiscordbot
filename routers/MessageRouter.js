const {userController} = require('../controllers/UserController');

let prefix = process.env.PREFIX;

async function routeMessage(message) {
    let responseMessage = "";
    //Basic checks go here, if I want to do Admin Functionality I'd put the distinction here as well.

    if (await isBotAuthor(message)) {
        console.log('bot is author');
        return;
    }

    if(await isMessageAddressingBot(message)) {
         await userController.parseMessage(message).then(resMessage => {
             responseMessage = resMessage;
         });
    } else {
         console.log('Message Does Not Address Bot');
         return;
    }

    return responseMessage;

}

async function isBotAuthor(message) {
    return message.author.bot;

}

async function isMessageAddressingBot(message) {
    let messageContent = message['content'];
    return messageContent.startsWith(prefix);
}



//TODO: Useful stuff for sending a message that isn't a reply
// let channelId = message['channelId'];
// client.channels.cache.get(message['channelId']).send('NAGLIS');

module.exports.messageRouter = {
    routeMessage,
}

