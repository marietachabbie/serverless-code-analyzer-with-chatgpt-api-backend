const Utils = require('../utils/Utils');

class CodeAnalyzer {
    static async execute(body) {
        if (!body) {
            return Utils.httpResponse(200, null);
        }

        return Utils.httpResponse(200, {
            verdict: 'Code analyzed',
        });
    }
}

module.exports = CodeAnalyzer;
