const Utils = require('../utils/Utils');
const DBConnectionManager = require('../utils/DBConnectionManager');
const CONSTANTS = require('../utils/Constants');

class DataCollector {
    async execute(event) {
        const { codeData, requestData } = event;

        const dbConnectionManager = new DBConnectionManager();
        await dbConnectionManager.insertMap(CONSTANTS.CODE_ANALYSES_TABLE, codeData);
        await dbConnectionManager.insertMap(CONSTANTS.REQUEST_STATISTICS_TABLE, requestData);
    }

    static async getResults (token) {
        const dbConnectionManager = new DBConnectionManager();
        const query = `select data from code_analyses where user_token = '${token}'`;
        return await dbConnectionManager.query(query);
    }

    static async getStats () {
        const statistics = {};
        const dbConnectionManager = new DBConnectionManager();
        statistics.likeAndOptimise = await dbConnectionManager.query(`select
                        sum(case when request != 'optimise' then 1 else 0 end) as total,
                        sum(case when request = 'optimise' then 1 else 0 end) as optimise,
                        sum(case when does_like then 1 else 0 end) as like
                        from request_statistics`);
        statistics.languages = await dbConnectionManager.query(`select
                        language as lang, count(*) from request_statistics
                        group by language order by count desc limit 10`);
        statistics.countries = await dbConnectionManager.query(`select
                        country_code as country, count(*) from request_statistics
                        group by country_code order by count desc limit 10`);
        return statistics;
    }

    static async processFeedback (event) {
        const { userToken, ...updateData } = event;
        const dbConnectionManager = new DBConnectionManager();
        await dbConnectionManager.updateMap(CONSTANTS.REQUEST_STATISTICS_TABLE, updateData, `user_token = '${userToken}'`);
    }
}

module.exports = DataCollector;
