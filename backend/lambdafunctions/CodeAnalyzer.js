const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');

const Utils = require('../utils/Utils');

class CodeAnalyzer {
    static async execute(code) {

        if (!code) {
            return Utils.httpResponse(200, null);
        }

        const question = '';
        const analyse = await this.requestDataFromChatgptAPI(question); // (code first then question (maybe))
        const data = await this.analyseResponseMessage(analyse);
        return Utils.httpResponse(200, data);
    }

    static async analyseResponseMessage (message) {
    }

    static async requestDataFromChatgptAPI (content) {
        const role = process.env.OPENAI_USER;
        const configuration = new Configuration({
            organization: process.env.OPENAI_ORGANIZATION_ID,
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const response = await openai.createChatCompletion({
            model: process.env.OPENAI_MODEL,
            messages: [{ role, content }],
        }).catch(err => {
            console.error(err);
        });

        return response.data.choices[0].message.content;
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
