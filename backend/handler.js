const Utils = require('./utils/Utils');
Utils.setupEnvironment('dev');

const CodeAnalyzer = require('./lambdafunctions/CodeAnalyzer');
const UserDataCollector = require('./lambdafunctions/UserDataCollector');

module.exports.CodeAnalyzer = async (event) => {
    try {
        const [ body, httpData ] = Utils.parseHttpEvent(event);
        await UserDataCollector.execute(httpData);
        return await CodeAnalyzer.execute(body.code);
    } catch (error) {
        console.error(error);
    }
};
