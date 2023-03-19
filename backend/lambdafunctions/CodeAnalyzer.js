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
        const question = `Tell me ${MessageConstants.TOPICS.length} things about this code: ${MessageConstants.TOPICS.join(',')}`;
        return question + '\n' + code;
    }

    static async analyseResponseMessage (message) {
        this.orderedArray = [];
        const splitted = message.split('\n');

        for (const line of splitted) {
            if (parseInt(line[0])) {
                this.orderedArray[line[0]] = line.slice(line.indexOf(': ') + 2);
            }
        }

        this.processedResult = {
            [MessageConstants.ANALYSE]: this.orderedArray[`${MessageConstants.ANALYSE_INDEX}`],
        };
        this.assignLanguage();
        this.assignComplexity(MessageConstants.TIME);
        this.assignComplexity(MessageConstants.SPACE);

        return this.processedResult;
    }

    static async assignLanguage () {
        this.processedResult[`${MessageConstants.LANGUAGE}_${MessageConstants.DETAILS}`] =
            this.orderedArray[`${MessageConstants.LANGUAGE_INDEX}`];

        const punctuationRegex = /[!"$%&'()*,-./:;<=>?@[\]^_`{|}~]$/g;
        const splitted = this.processedResult[`${MessageConstants.LANGUAGE}_${MessageConstants.DETAILS}`].split(' ');

        splitted.forEach((word, idx) => {
            if (idx !== 0 && /^[A-Z]/.test(word)) {
                this.processedResult[MessageConstants.LANGUAGE] = word.replace(punctuationRegex, '');
            }
        });
    }

    static async assignComplexity(option) {
        const complexity = `${option}_${MessageConstants.COMPLEXITY}`;
        this.processedResult[`${complexity}_${MessageConstants.DETAILS}`] =
            this.orderedArray[MessageConstants[`${complexity}_${MessageConstants.INDEX}`.toUpperCase()]];

        const complexityPunctuationRegex = /[!"#$%&'*,.:;<=>?@[\]_`{|}~]$/g;
        const complexityRegex = /^O\(.*\)$/i;

        const splitted = this.processedResult[`${complexity}_${MessageConstants.DETAILS}`].split(' ');
        splitted.forEach(word => {
            if (complexityRegex.test(word.replace(complexityPunctuationRegex, ''))) {
                this.processedResult[`${complexity}`] = word.replace(complexityPunctuationRegex, '');
            }
        });

        // if no complexity found and word constant was found set complexity to O(1)
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

        return response.data?.choices?.[0].message?.content;
    }
}

module.exports = CodeAnalyzer;
