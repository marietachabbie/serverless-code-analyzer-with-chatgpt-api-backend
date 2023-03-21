const Utils = require('./utils/Utils');
Utils.setupEnvironment('dev');

const CodeAnalyzer = require('./lambdafunctions/CodeAnalyzer');
const UserDataCollector = require('./lambdafunctions/UserDataCollector');

module.exports.CodeAnalyzer = async (event) => {
    try {
        const lambdaInstance = new CodeAnalyzer();
        const [ body, httpData ] = Utils.parseHttpEvent(event);
        await UserDataCollector.execute(httpData);
        return await lambdaInstance.execute(body.code);
    } catch (error) {
        console.error(error);
    }
};
