const Datastore = require('nedb');
const electron = require('electron');
const path = require('path');

const userDataPath = (electron.app || electron.remote.app).getPath('userData');

const dbMessages = new Datastore({
	inMemoryOnly: false,
	filename: path.join(userDataPath, 'whatsapp-scraper-messages.db'),
	autoload: true
});

dbMessages.ensureIndex({ fieldName: 'date', unique: false });
dbMessages.ensureIndex({ fieldName: 'read', unique: false });
dbMessages.ensureIndex({ fieldName: 'direction', unique: false });

exports.find = (criteria, sortBy, callback) => {

	dbMessages.find(criteria).sort(sortBy).exec((err, items) => {
		if (err) {
			return callback(err, null);
		}

		callback(null, items);
	});

};

exports.save = (entry, callback) => {

	dbMessages.insert(entry, (err, message) => {
		if (err) {
			return callback(err, null);
		}

		callback(null, message);
	});

};

exports.update = (query, entry, options, callback) => {

	dbMessages.update(query, entry, options, (err, message) => {
		if (err) {
			return callback(err, null);
		}

		callback(null, message);
	});

};

exports.remove = (criteria, callback) => {

	dbMessages.remove(criteria, { multi: true }, (err, numRemoved) => {
		if (err) {
			return callback(err, null);
		}

		dbMessages.persistence.compactDatafile();

		callback(null, numRemoved);
	});

};