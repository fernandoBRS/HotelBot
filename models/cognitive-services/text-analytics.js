// The exported functions in this module makes a call to Text Analytics API that returns sentiment by a score (0 to 1).
// For more info, check out the API reference:
// https://westus.dev.cognitive.microsoft.com/docs/services/TextAnalytics.V2.0/operations/56f30ceeeda5650db055a3c9

const request = require('request');

const TEXT_ANALYTICS_API_URL = 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment',
      TEXT_ANALYTICS_KEY = process.env.TEXT_ANALYTICS_API_KEY;

/**
 * Gets the correct spelling for the given text
 * @param {string} text The text to be analysed
 * @returns {Promise} Promise with the sentiment score, error otherwise.
 */
exports.getScore = text => {
    return new Promise(
        (resolve, reject) => {
            if (text) {
                const requestData = {
                    url: TEXT_ANALYTICS_API_URL,
                    headers: {
                        "Ocp-Apim-Subscription-Key": TEXT_ANALYTICS_KEY
                    },
                    json: true,
                    body: {
                        documents: [
                            {
                                language : "en",
                                id: "1",
                                text: text
                            }
                        ]
                    }
                }

                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode != 200) {
                        reject(body);
                    }
                    else {
                        var result = '';

                        for (var i = 0; i < body.documents.length; i++) {
                            result += body.documents[i].score;
                        }

                        resolve(result);
                    }
                });
            } else {
                resolve(text);
            }
        }
    )
}
