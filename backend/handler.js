const Utils = require('./utils/Utils');
Utils.setupEnvironment('dev');

const CodeAnalyser = require('./lambdafunctions/CodeAnalyser');
const DataCollector = require('./lambdafunctions/DataCollector');

module.exports.CodeAnalysis = async (event) => {
    try {
        const lambdaInstance = new CodeAnalyser();
        await lambdaInstance.execute(event);
    } catch (error) {
        console.error(error);
    }
};

module.exports.DataCollection = async (event) => {
    try {
        const lambdaInstance = new DataCollector();
        await lambdaInstance.execute(event);
    } catch (error) {
        console.error(error);
    }
};
