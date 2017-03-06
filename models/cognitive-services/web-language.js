// The exported functions in this module makes a call to Web Language Model API that inserts spaces into a string.
// For more info, check out the API reference:
// https://westus.dev.cognitive.microsoft.com/docs/services/55de9ca4e597ed1fd4e2f104/operations/55de9ca4e597ed19b0de8a51
const request = require('request');

const SPELL_CHECK_API_URL = 'https://westus.api.cognitive.microsoft.com/text/weblm/v1.0/breakIntoWords',
      SPELL_CHECK_API_KEY = process.env.WEB_LANGUAGE_API_KEY;

/**
 * Gets the correct spelling for the given text
 * @param {string} text The text to be corrected
 * @returns {Promise} Promise with the string breaked into words if succeeded, error otherwise.
 */
exports.breakIntoWords = text => {
    return new Promise(
        (resolve, reject) => {
            if (text) {
                const requestData = {
                    // For demo purposes, we are considering only one candidate through the maxNumOfCandidatesReturned parameter.
                    // By default, the number of candidates is 5.

                    url: SPELL_CHECK_API_URL + "?model=query" + "&text=" + text + "&maxNumOfCandidatesReturned=1",
                    headers: {
                        "Ocp-Apim-Subscription-Key": SPELL_CHECK_API_KEY
                    },
                    json: true
                }

                request.post(requestData, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    else if (response.statusCode != 200) {
                        reject(body);
                    }
                    else {
                        // As we defined only one candidate during the request, we are just returning the first index.
                        var result = body.candidates[0].words;

                        resolve(result);
                    }
                });
            } else {
                resolve(text);
            }
        }
    )
}
