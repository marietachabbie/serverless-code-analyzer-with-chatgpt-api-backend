const Utils = require('../utils/Utils');
const DBConnectionManager = require('../utils/DBConnectionManager');
const CONSTANTS = require('../utils/Constants');

class DataCollector {
    async execute(event) {
        const eventMessage = Utils.parseLambdaEvent(event);
        const { codeData, requestData } = eventMessage;

        const dbConnectionManager = new DBConnectionManager();
        await dbConnectionManager.insertMap(CONSTANTS.CODE_ANALYSES_TABLE, codeData);
        await dbConnectionManager.insertMap(CONSTANTS.REQUEST_STATISTICS_TABLE, requestData);
    }
}

module.exports = DataCollector;
