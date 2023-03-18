const { Configuration, OpenAIApi } = require('openai');

const Utils = require('../utils/Utils');
const MessageConstants = require('../utils/MessageConstants');

class CodeAnalyzer {
    static async execute(code) {
        if (!code) {
            return Utils.httpResponse(200, null);
        }

        const question = '';
        const response = await this.requestDataFromChatgptAPI(question);

        const data = await this.analyseResponseMessage(response);
        return Utils.httpResponse(200, data);
    }

    static async analyseResponseMessage (message) {
        const ordered = [];
        const processedResult = {};
        const splitted = message.split('\n');

        for (const line of splitted) {
            if (parseInt(line[0])) {
                ordered[line[0]] = line.slice(line.indexOf(': ') + 2);
            }
        }

        this.assignLanguageVersionExplanation(processedResult, ordered);
        this.assignComplexities(processedResult, ordered);

        return processedResult;
    }

    static async assignLanguageVersionExplanation (result, orderedArray) {
        const punctuationRegex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;

        result.language_details = orderedArray[MessageConstants.LANGUAGE_INDEX];
        result.version_details = orderedArray[MessageConstants.VERSION_INDEX];
        result.analyse = orderedArray[MessageConstants.ANALYSE_INDEX];

        const language = result.language_details.split(' ');
        language.forEach((word, idx) => {
            if (idx !== 0 && /^[A-Z]/.test(word)) {
                result.language = word.replace(punctuationRegex, '');
            }
        });

        const version = result.version_details.split(' ');
        version.forEach((word) => {
            if (/\d/.test(word)) {
                result.version = word.replace(punctuationRegex, '');
            }
        });

        if (!result.version) {
            result.version = 'Not specified';
        }
    }

    static async assignComplexities(result, orderedArray) {
        const complexityPunctuationRegex = /[!"#$%&'*+,-.:;<=>?@[\]_`{|}~]/g;
        const complexityRegex = /^O\(.*\)$/i;

        result.time_complexity_details = orderedArray[MessageConstants.TIME_COMPLEXITY_INDEX];
        result.space_complexity_details = orderedArray[MessageConstants.SPACE_COMPLEXITY_INDEX];

        const tcomplexity = result.time_complexity_details.split(' ');
        tcomplexity.forEach(word => {
            if (complexityRegex.test(word.replace(complexityPunctuationRegex, ''))) {
                result.time_complexity = word.replace(complexityPunctuationRegex, '');
            }
        });

        const scomplexity = result.space_complexity_details.split(' ');
        scomplexity.forEach(word => {
            if (complexityRegex.test(word.replace(complexityPunctuationRegex, ''))) {
                result.space_complexity = word.replace(complexityPunctuationRegex, '');
            }
        });
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
}

module.exports = CodeAnalyzer;
