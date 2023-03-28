const Utils = require('../utils/Utils');
const DBConnectionManager = require('../utils/DBConnectionManager');
const CONSTANTS = require('../utils/Constants');

class DBServicesProvider {
    static async execute(event, type) {
        this.dbConnectionManager = new DBConnectionManager();
        const eventMessage = Utils.parseLambdaEvent(event);
        switch (type) {
            case 'results':
                return await this.getResults(eventMessage.userToken);
            case 'stats':
                return await this.getStats();
            case 'feedback':
                await this.processFeedback(eventMessage);
                break;
            case 'collect':
            default:
                await this.collectData(event);
        }
    }

    static async collectData (event) {
        const { codeData, requestData } = event;
        await this.dbConnectionManager.insertMap(CONSTANTS.CODE_ANALYSES_TABLE, codeData);
        await this.dbConnectionManager.insertMap(CONSTANTS.REQUEST_STATISTICS_TABLE, requestData);
    }

    static async getResults (token) {
        const query = `select data from code_analyses where user_token = '${token}'`;
        return await this.dbConnectionManager.query(query);
    }

    static async getStats () {
        const statistics = {};
        statistics.likeAndOptimise = await this.dbConnectionManager.query(`select
                        sum(case when request != 'optimise' then 1 else 0 end) as total,
                        sum(case when request = 'optimise' then 1 else 0 end) as optimise,
                        sum(case when does_like then 1 else 0 end) as like
                        from request_statistics`);
        statistics.languages = await this.dbConnectionManager.query(`select
                        language as lang, count(*) from request_statistics
                        group by language order by count desc limit 10`);
        statistics.countries = await this.dbConnectionManager.query(`select
                        country_code as country, count(*) from request_statistics
                        group by country_code order by count desc limit 10`);
        return statistics;
    }

    static async processFeedback (event) {
        const { userToken, ...updateData } = event;
        await this.dbConnectionManager.updateMap(CONSTANTS.REQUEST_STATISTICS_TABLE, updateData, `user_token = '${userToken}'`);
    }
}

module.exports = DBServicesProvider;
