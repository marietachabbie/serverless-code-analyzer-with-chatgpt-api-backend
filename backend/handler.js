const Utils = require('./utils/Utils');
Utils.setupEnvironment('dev');

const CodeAnalyser = require('./lambdafunctions/CodeAnalyser');
const DBServicesProvider = require('./lambdafunctions/DBServicesProvider');

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
        await Utils.lambdaFunctionExecutor(DBServicesProvider, eventMessage);
    } catch (error) {
        console.error(error);
    }
};

module.exports.ShowResults = async (event) => {
    try {
        const eventMessage = Utils.parseLambdaEvent(event);
        const result = await DBServicesProvider.getResults(eventMessage.userToken);
        return Utils.httpResponse(200, result?.[0] ?? null);
    } catch (err) {
        return Utils.httpResponse(500, { message: 'Something went wrong!' });
    }
};

module.exports.ShowStats = async (event) => {
    try {
        const result = await DBServicesProvider.getStats();
        return Utils.httpResponse(200, result ?? null);
    } catch (err) {
        return Utils.httpResponse(500, { message: 'Something went wrong!' });
    }
};

module.exports.UserFeedback = async (event) => {
    try {
        const eventMessage = Utils.parseLambdaEvent(event);
        await DBServicesProvider.processFeedback(eventMessage);
        return Utils.httpResponse(200, { message: 'Thank you!' });
    } catch (err) {
        return Utils.httpResponse(500, { message: 'Something went wrong!' });
    }
};
