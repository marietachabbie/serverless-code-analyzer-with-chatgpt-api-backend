const Utils = require('../utils/Utils');
const DBConnectionManager = require('../utils/DBConnectionManager');

class DataCollector {
    async execute(event) {
        const data = Utils.parseLambdaEvent(event);
        const dbConnectionManager = new DBConnectionManager();

    }
}

module.exports = DataCollector;
