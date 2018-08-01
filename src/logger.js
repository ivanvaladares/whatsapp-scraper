const util = require('util');
const electron = require('electron');
const path = require('path');

const userDataPath = (electron.app || electron.remote.app).getPath('userData');

let Logger = require('nedb-logger')
  , logger = new Logger({ filename:  path.join(userDataPath, 'whatsapp-scraper-logs.db') });

exports.log = (message, details) => {
	let logText = message;
	if (details){
		logText += "  -  " + getDetails(details);
	}
	logger.insert({ date: new Date(), message, details });
};

const getDetails = (details) => {
	try {
		let logText = util.inspect(details, { showHidden: true, depth: null });
		return logText.split('"').join('\'').split('\n').join(' - ');
	} catch (error) {
		return "";
	}
};