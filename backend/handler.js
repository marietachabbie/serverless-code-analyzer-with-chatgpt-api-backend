const Utils = require('./utils/Utils');
Utils.setupEnvironment('dev');

const CodeAnalyser = require('./lambdafunctions/CodeAnalyser');
const DataCollector = require('./lambdafunctions/DataCollector');

module.exports.CodeAnalysis = async (event) => {
    try {
        await Utils.lambdaFunctionExecutor(CodeAnalyser, event);
        return Utils.httpResponse(200, { message: 'Successfully processed!' });
    } catch (error) {
        console.error(error);
        return Utils.httpResponse(500, { message: 'Something went wrong!' });
    }
};

module.exports.DataCollection = async (event) => {
    try {
        const eventMessage = Utils.parseLambdaEvent(event);
        await Utils.lambdaFunctionExecutor(DataCollector, eventMessage);
    } catch (error) {
        console.error(error);
    }
};

module.exports.ShowResults = async (event) => {
    try {
        const eventMessage = Utils.parseLambdaEvent(event);
        const result = await DataCollector.getResults(eventMessage.userToken);
        return Utils.httpResponse(200, result?.[0] ?? null);
    } catch (err) {
        return Utils.httpResponse(500, { message: 'Something went wrong!' });
    }
};

module.exports.ShowStats = async (event) => {
    try {
        const result = await DataCollector.getStats();
        return Utils.httpResponse(200, result ?? null);
    } catch (err) {
        return Utils.httpResponse(500, { message: 'Something went wrong!' });
    }
};

module.exports.UserFeedback = async (event) => {
    try {
        const eventMessage = Utils.parseLambdaEvent(event);
        await DataCollector.processFeedback(eventMessage);
        return Utils.httpResponse(200, { message: 'Thank you!' });
    } catch (err) {
        return Utils.httpResponse(500, { message: 'Something went wrong!' });
    }
};
