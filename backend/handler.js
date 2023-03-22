const Utils = require('./utils/Utils');
Utils.setupEnvironment('dev');

const CodeAnalyser = require('./lambdafunctions/CodeAnalyser');
const UserDataCollector = require('./lambdafunctions/UserDataCollector');

module.exports.CodeAnalysis = async (event) => {
    try {
        const [ body, httpData ] = Utils.parseHttpEvent(event);
        await Utils.snsPublish(process.env.DATA_COLLECTOR_SNS, httpData);

        const lambdaInstance = new CodeAnalyser();
        return await lambdaInstance.execute(body.code);
    } catch (error) {
        console.error(error);
    }
};

module.exports.UserDataCollection = async (event) => {
    try {
        const httpData = Utils.parseSnsEvent(event);
        const lambdaInstance = new UserDataCollector();
        await lambdaInstance.execute(httpData);
    } catch (error) {
        console.error(error);
    }
};
