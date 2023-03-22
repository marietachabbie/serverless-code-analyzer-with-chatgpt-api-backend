const { Configuration, OpenAIApi } = require('openai');

const Utils = require('../utils/Utils');
const MessageConstants = require('../utils/MessageConstants');

class CodeAnalyser {
    async execute(code) {
        if (!code) {
            return Utils.httpResponse(200, null);
        }

        const question = this.generateQuestion(code);
        const response = await this.requestDataFromChatgptAPI(question);

        const data = await this.analyseResponseMessage(response);
        return Utils.httpResponse(200, data);
    }

    generateQuestion(code) {
        const question = `Tell me ${MessageConstants.TOPICS.length} things about this code: ${MessageConstants.TOPICS.join(',')}`;
        return question + '\n' + code;
    }

    analyseResponseMessage (message) {
        this.processedResult = {};
        this.orderedArray = [];
        const splitted = message.split('\n');

        for (const line of splitted) {
            if (parseInt(line[0])) {
                this.orderedArray[line[0]] = line.slice(line.indexOf(': ') + 2);
            }
        }

        this.assignAnalyse();
        this.assignLanguage();
        this.assignPackages();
        this.assignStylisticPractises();
        this.assignComplexity(MessageConstants.TIME);
        this.assignComplexity(MessageConstants.SPACE);

        return this.processedResult;
    }

    assignAnalyse () {
        this.processedResult[MessageConstants.ANALYSE] = this.orderedArray[`${MessageConstants.ANALYSE_INDEX}`];
    }

    assignStylisticPractises () {
        this.processedResult[`${MessageConstants.STYLES}`] =
            this.orderedArray[`${MessageConstants.STYLES_INDEX}`];
    }

    assignPackages () {
        this.processedResult[`${MessageConstants.PACKAGES}_${MessageConstants.DETAILS}`] =
            this.orderedArray[`${MessageConstants.PACKAGES_INDEX}`];

        this.processedResult.packages = [];
        const punctuationRegex = /[!"$%&'()*,:;<=>?@[\]^`{|}~]/g;
        const splitted = this.processedResult[`${MessageConstants.PACKAGES}_${MessageConstants.DETAILS}`].split('.')[0].split(' ');
        splitted.forEach((word, idx) => {
            if (((word.startsWith('"') || word.startsWith("'") || word.startsWith('`')) &&
                (word.endsWith('"') || word.endsWith("'") || word.endsWith('`')) ||
                word.endsWith(',') ||
                splitted[idx - 1] === 'and')) {
                this.processedResult.packages.push(word.replace(punctuationRegex, ''));
            }
        });
    }

    assignLanguage () {
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

    assignComplexity(option) {
        const complexity = `${option}_${MessageConstants.COMPLEXITY}`;
        this.processedResult[`${complexity}_${MessageConstants.DETAILS}`] =
            this.orderedArray[MessageConstants[`${complexity}_${MessageConstants.INDEX}`.toUpperCase()]];

        const complexityPunctuationRegex = /[!"#$%&'*,.:;<=>?@[\]_`{|}~]$/g;
        const complexityRegex = /^O\(.*\)$/i;
        let isConstant = false;

        const splitted = this.processedResult[`${complexity}_${MessageConstants.DETAILS}`].split(' ');
        splitted.forEach(word => {
            if (complexityRegex.test(word.replace(complexityPunctuationRegex, ''))) {
                this.processedResult[`${complexity}`] = word.replace(complexityPunctuationRegex, '');
            } else if (word === 'constant') {
                isConstant = true;
            }
        });

        if (!this.processedResult[`${complexity}`] && isConstant) {
            this.processedResult[`${complexity}`] = 'O(1)';
        }
    }

    async requestDataFromChatgptAPI (content) {
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

module.exports = CodeAnalyser;
