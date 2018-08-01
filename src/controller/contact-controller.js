const ContactModel = require('../models/contact-model');
const logger = require('../logger.js');

exports.saveContact = (contact) => {

	return new Promise((resolve, reject) => {

		let contactJson = {};
		contactJson.contact = contact;

		ContactModel.update(contactJson, contactJson, { upsert: true }, (err) => {
			if (err) {
				logger.log('Error on saveContact', err);
				return reject(err);
			}

			resolve(true);
		});

	});
};

exports.find = (searchCriteria) => {

	let criteria = {};

	try {

		if (searchCriteria.contact !== undefined && searchCriteria.contact !== "") {
			criteria.contact = searchCriteria.contact;
		}

	} catch (err) {
		criteria = {};
	}

	return new Promise((resolve, reject) => {

		ContactModel.find(criteria, { contact: 1 }, (err, contacts) => {
			if (err) {
				logger.log('Error on get contacts', err);
				return reject(err);
			}

			resolve(contacts);
		});

	});

};