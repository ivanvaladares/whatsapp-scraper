const LoadModel = require('../models/load-model.js');
const logger = require('../logger.js');
const moment = require('moment');


exports.saveNew = () => {

    return new Promise((resolve, reject) => {

		let loadJson = {};
		loadJson.date = new Date();

		LoadModel.save(loadJson, (err, message) => {
            if (err) { 
                logger.log('Error on saveNew', err);
                return reject(err);
            }

            resolve(true);
        });

    });
};


exports.find = (searchCriteria, sortBy) => {

    return new Promise((resolve, reject) => {

        LoadModel.find(searchCriteria, sortBy, (err, items) => {
            if (err) { 
				logger.log('Error on get messages', err);
                return reject(err);
			}
			
			items.forEach(item => {
				if (item.date !== undefined){
					item.date = moment(item.date).format("DD/MM/YYYY HH:mm");
				}
			});

            resolve(items);
        });

    });
};