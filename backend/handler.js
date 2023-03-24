const Utils = require('./utils/Utils');
Utils.setupEnvironment('dev');

const CodeAnalyser = require('./lambdafunctions/CodeAnalyser');
const DataCollector = require('./lambdafunctions/DataCollector');

module.exports.CodeAnalysis = async (event) => {
    try {
        await Utils.lambdaFunctionExecutor(CodeAnalyser, event);
    } catch (error) {
        console.error(error);
    }
};

module.exports.DataCollection = async (event) => {
    try {
        await Utils.lambdaFunctionExecutor(DataCollector, event);
    } catch (error) {
        console.error(error);
    }
};
