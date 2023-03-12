const { Configuration, OpenAIApi } = require('openai');

const Utils = require('../utils/Utils');

class CodeAnalyzer {
    static async analyzeWithChatgptAPI (code) {
        const role = 'user';
        const content = `Analyse this code. What language and version is it? What is its
            complexity?` + '\n' + code;
        const configuration = new Configuration({
            organization: process.env.OPENAI_ORGANIZATION_ID,
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const response = await openai.createChatCompletion({
            model: process.env.OPENAI_MODEL,
            messages: [{ role, content }],
        }) .catch(err => {
            console.error(err);
        });
    }

    static async execute(code) {
        if (!code) {
            return Utils.httpResponse(200, null);
        }

        await this.analyzeWithChatgptAPI(code);
        return Utils.httpResponse(200, {
            verdict: 'Code analyzed',
        });
    }
}

module.exports = CodeAnalyzer;
