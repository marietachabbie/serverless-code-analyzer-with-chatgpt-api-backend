const Utils = require('../utils/Utils');
const DBConnectionManager = require('../utils/DBConnectionManager');
const MessageConstants = require('../utils/MessageConstants');

class DataCollector {
    async execute(event) {
        const eventMessage = Utils.parseLambdaEvent(event);
        const { codeData, requestData } = eventMessage;

        const dbConnectionManager = new DBConnectionManager();
        await dbConnectionManager.insertMap(MessageConstants.CODE_ANALYSES_TABLE, codeData);
        await dbConnectionManager.insertMap(MessageConstants.REQUEST_STATISTICS_TABLE, requestData);
    }
}

module.exports = DataCollector;
