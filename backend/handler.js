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
        await Utils.lambdaFunctionExecutor(DataCollector, event);
    } catch (error) {
        console.error(error);
    }
};
