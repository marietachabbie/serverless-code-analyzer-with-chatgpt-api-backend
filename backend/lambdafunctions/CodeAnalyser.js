const { Configuration, OpenAIApi } = require('openai');
const geoip = require('geoip-lite');

const Utils = require('../utils/Utils');
const MessageConstants = require('../utils/MessageConstants');

class CodeAnalyser {
    async execute(event) {
        const [ code, httpData ] = Utils.parseHttpEvent(event, 'code');
        if (!code) {
            return Utils.httpResponse(200, null);
        }

        const task = httpData.path.slice(1);
        const question = this.generateQuestion(code, task);
        const response = await this.requestDataFromChatgptAPI(question);

        this.processedResult = {}; this.orderedArray = [];
        if (task === MessageConstants.ANALYSE){
            this.generateCodeAnalysisData(response);
        } else {
            this.generateCodeOptimisationData(response);
        }
        const dataForDb = this.generateCompleteDataForDb(httpData, task);
        await Utils.snsPublish(process.env.DATA_COLLECTOR_SNS, dataForDb);
    }

    generateQuestion(code, task) {
        let question = 'Tell me ';
        switch (task) {
            case MessageConstants.OPTIMISE:
                question += 'language of this code and optimise it';
                break;
            case MessageConstants.COMMENT:
                question += 'language of this code and add comments to it';
                break;
            case MessageConstants.ANALYSE:
            default:
                question += `${MessageConstants.TOPICS.length} things about this code: ${MessageConstants.TOPICS.join(',')}`;
        }
        return question + '\n' + code;
    }

    generateCodeOptimisationData (message) {
        const splitted = message.split('\n');
        this.orderedArray[MessageConstants.LANGUAGE_INDEX] = splitted.shift();
        this.assignLanguage();
        this.processedResult.result = splitted.join('\n');
    }

    generateCodeAnalysisData (message) {
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
    }

    generateCompleteDataForDb(http, task) {
        return {
            data: this.processedResult,
            language: this.processedResult.language,
            task: task,
            country: geoip.lookup(http.sourceIp).country,
            user_agent: http.userAgent,
        };
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
            this.orderedArray[MessageConstants.LANGUAGE_INDEX];

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
