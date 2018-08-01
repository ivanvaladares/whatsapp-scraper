const Datastore = require('nedb');
const electron = require('electron');
const path = require('path');

const userDataPath = (electron.app || electron.remote.app).getPath('userData');

const dbContacts = new Datastore({
	inMemoryOnly: false,
	filename: path.join(userDataPath, 'whatsapp-scraper-contacts.db'),
	autoload: true
});

exports.find = (criteria, sortBy, callback) => {

	dbContacts.find(criteria).sort(sortBy).exec((err, items) => {
		if (err) {
			return callback(err, null);
		}

		callback(null, items);
	});

};

exports.save = (entry, callback) => {

	dbContacts.insert(entry, (err, contact) => {
		if (err) {
			return callback(err, null);
		}

		callback(null, contact);
	});

};

exports.update = (query, entry, options, callback) => {

	dbContacts.update(query, entry, options, (err, contact) => {
		if (err) {
			return callback(err, null);
		}

		callback(null, contact);
	});

};

exports.remove = (criteria, callback) => {

	dbContacts.remove(criteria, { multi: true }, (err, numRemoved) => {
		if (err) {
			return callback(err, null);
		}

		callback(null, numRemoved);
	});

};