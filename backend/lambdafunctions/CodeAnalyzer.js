const { Configuration, OpenAIApi } = require('openai');

const Utils = require('../utils/Utils');
const MessageConstants = require('../utils/MessageConstants');

class CodeAnalyzer {
    static async execute(code) {
        if (!code) {
            return Utils.httpResponse(200, null);
        }

        const question = this.generateQuestion(code);
        const response = await this.requestDataFromChatgptAPI(question);

        const data = await this.analyseResponseMessage(response);
        return Utils.httpResponse(200, data);
    }

    static generateQuestion(code) {
        const question = `Tell me ${MessageConstants.TOPICS_AMOUNT} things about this code: ${MessageConstants.TOPICS.join(',')}`;
        return question + '\n' + code;
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

        result[MessageConstants.LANGUAGE_DETAILS] = orderedArray[MessageConstants.LANGUAGE_INDEX];
        result[MessageConstants.VERSION_DETAILS] = orderedArray[MessageConstants.VERSION_INDEX];
        result[MessageConstants.ANALYSE] = orderedArray[MessageConstants.ANALYSE_INDEX];

        const language = result[MessageConstants.LANGUAGE_DETAILS].split(' ');
        language.forEach((word, idx) => {
            if (idx !== 0 && /^[A-Z]/.test(word)) {
                result[MessageConstants.LANGUAGE] = word.replace(punctuationRegex, '');
            }
        });

        const version = result[MessageConstants.VERSION_DETAILS].split(' ');
        version.forEach((word) => {
            if (/\d/.test(word)) {
                result[MessageConstants.VERSION] = word.replace(punctuationRegex, '');
            }
        });

        if (!result[MessageConstants.VERSION]) {
            result[MessageConstants.VERSION] = 'Not specified';
        }
    }

    static async assignComplexities(result, orderedArray) {
        const complexityPunctuationRegex = /[!"#$%&'*+,-.:;<=>?@[\]_`{|}~]/g;
        const complexityRegex = /^O\(.*\)$/i;

        result[MessageConstants.TIME_COMPLEXITY_DETAILS] =
            orderedArray[MessageConstants.TIME_COMPLEXITY_INDEX];
        result[MessageConstants.SPACE_COMPLEXITY_DETAILS] =
            orderedArray[MessageConstants.SPACE_COMPLEXITY_INDEX];

        const tcomplexity = result[MessageConstants.TIME_COMPLEXITY_DETAILS].split(' ');
        tcomplexity.forEach(word => {
            if (complexityRegex.test(word.replace(complexityPunctuationRegex, ''))) {
                result[MessageConstants.TIME_COMPLEXITY] = word.replace(complexityPunctuationRegex, '');
            }
        });

        const scomplexity = result[MessageConstants.SPACE_COMPLEXITY_DETAILS].split(' ');
        scomplexity.forEach(word => {
            if (complexityRegex.test(word.replace(complexityPunctuationRegex, ''))) {
                result[MessageConstants.SPACE_COMPLEXITY] = word.replace(complexityPunctuationRegex, '');
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
