const async = require('async');
const request = require('request');
const ora = require('ora');

/**
 * Robinhood superclass.
 * @private
 */
class Robinhood {

	constructor() {
		this.url = "https://api.robinhood.com";
	}

	static handleResponse(error, response, body, token, resolve, reject) {
		if (error) reject(error);
		else if (response.statusCode !== 200) reject(new Error("Robinhood responded with code: " + response.statusCode + ".\n\t" + body));
		else try {
				const json = JSON.parse(body);
				if (json.next) {
					let loading = ora("Downloading from Robinhood").start();
					let array = json.results;
					let next = json.next;
					async.whilst(() => { return next !== null; }, callback => {
						let options = {
							uri: next
						};
						if (token !== null) options.headers = {
							'Authorization': 'Token ' + token
						};
						request(options, (error, response, body) => {
							if (error) reject(error);
							else if (response.statusCode !== 200) reject(new Error(body));
							else {
								const nextJson = JSON.parse(body);
								next = nextJson.next;
								array.push(nextJson.results);
								loading.text += '.';
								callback();
							}
						})
					}, () => {
						loading.succeed("Download complete.");
						resolve(array);
					});
				} else if (json.results) resolve(json.results.length === 1 ? json.results[0] : json.results);
				else resolve(json);
			} catch (error) {
				reject(error);
			}
	}

}

module.exports = Robinhood;