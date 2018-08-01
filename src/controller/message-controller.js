const MessageModel = require('../models/message-model');
const logger = require('../logger.js');
const moment = require('moment');
const nss = require('node-suggestive-search').init();

function carregarBusca () {

	MessageModel.find({}, {}, (err, messages) => {
		if (err) {
			logger.log('Error on get load busca nss', err);
		}

		messages.forEach((message) => {
			message.message = message.message.split("\n").join(" ");
		});	

		nss.loadJsonString(JSON.stringify(messages), "_id", "chatName", "message").then(
			data => {
				console.log(data);
			},
			() => {
				//...
			}
		);

	});
}

carregarBusca();

exports.carregarBusca = carregarBusca;

exports.saveMessage = (chatName, message, direction, img, date, read) => {

	return new Promise((resolve, reject) => {

		let messageJson = {};
		messageJson.chatName = chatName;
		messageJson.message = message;
		messageJson.direction = direction;
		messageJson.img = img;
		messageJson.date = new Date(date);
		messageJson.read = read;

		let query = Object.assign({}, messageJson);
		delete query.read;

		MessageModel.update(query, messageJson, { upsert: true }, (err, message) => {
			if (err) {
				logger.log('Error on saveMessage', err);
				return reject(err);
			}

			resolve(true);
		});

	});
};

exports.find = (searchCriteria) => {

	let criteria = {};

	try {

		if (searchCriteria.chatName !== undefined && searchCriteria.chatName !== "") {
			criteria.chatName = searchCriteria.chatName;
		}

		if (searchCriteria.from !== undefined || searchCriteria.to !== undefined) {

			if (moment(searchCriteria.from, "DD/MM/YYYY").isValid()) {
				criteria.date = {};
				criteria.date.$gt = moment(searchCriteria.from, "DD/MM/YYYY").toDate();
			}
			if (moment(searchCriteria.to, "DD/MM/YYYY").isValid()) {
				criteria.date = criteria.date || {};
				criteria.date.$lt = moment(searchCriteria.to, "DD/MM/YYYY").add(1, "day").toDate();
			}
		}

		if (searchCriteria.read !== undefined && searchCriteria.read !== "") {
			criteria.read = searchCriteria.read == "LIDA";
		}

		if (searchCriteria._id !== undefined) {
			criteria._id = searchCriteria._id;
		}

		if (searchCriteria.direction !== undefined) {
			criteria.direction = searchCriteria.direction;
		}

	} catch (err) {
		criteria = {};
	}


	if (searchCriteria.busca !== undefined && searchCriteria.busca.trim() !== "") {

		return new Promise((resolve, reject) => {

			nss.query(searchCriteria.busca.trim()).then(
				data => {

					if (data.itemsId.length > 0) {
						criteria._id = { $in: data.itemsId };

						MessageModel.find(criteria, { date: -1 }, (err, messages) => {
							if (err) {
								logger.log('Error on get messages', err);
								return reject(err);
							}

							messages.forEach(message => {
								message.dtDate = message.date;
								message.date = moment(message.date).format("DD/MM/YYYY HH:mm");
							});

							resolve(messages);
						});
					}else{
						resolve([]);
					}

				},
				err => {
					//...
				}
			);

		});

	} else {
		return new Promise((resolve, reject) => {

			MessageModel.find(criteria, { date: -1 }, (err, messages) => {
				if (err) {
					logger.log('Error on get messages', err);
					return reject(err);
				}

				messages.forEach(message => {
					message.dtDate = message.date;
					message.date = moment(message.date).format("DD/MM/YYYY HH:mm");
				});

				resolve(messages);
			});

		});
	}
};

exports.getChart = (searchCriteria) => {

	let criteria = {};

	try {

		if (searchCriteria.from !== undefined || searchCriteria.to !== undefined){
			
			if (moment(searchCriteria.from, "DD/MM/YYYY").isValid()){
				criteria.date = {};
				criteria.date.$gt = moment(searchCriteria.from, "DD/MM/YYYY").toDate(); 
			}
			if (moment(searchCriteria.to, "DD/MM/YYYY").isValid()){
				criteria.date = criteria.createdAt || {};
				criteria.date.$lt = moment(searchCriteria.to, "DD/MM/YYYY").add(1, "day").toDate();
			}

		}

		if (searchCriteria.direction !== undefined) {
			criteria.direction = searchCriteria.direction;
		}

	} catch (err) {
		criteria = {};
	}

    return new Promise((resolve, reject) => {

        MessageModel.find(criteria, {date: 1}, (err, items) => {
            if (err) { 
				logger.error('Error on get messages', err);
                return reject({ code: 500, "message": err.message });
			}

			let read = {};
			let notRead = {};
			let startDate = null;
			let endDate = 0; 

			items.forEach(message => {

				if (message.date !== null){

					let dtTicks = new Date(message.date.getFullYear(), message.date.getMonth(), message.date.getDate()).getTime();

					if (startDate === null || dtTicks < startDate){
						startDate = dtTicks;
					}

					if (dtTicks > endDate) {
						endDate = dtTicks;
					}

					if (!message.read) {
						if (notRead[dtTicks] === undefined){
							notRead[dtTicks] = 1;
						}else{
							notRead[dtTicks]++;
						}
					}

					if (message.read) {
						if (read[dtTicks] === undefined){
							read[dtTicks] = 1;
						}else{
							read[dtTicks]++;
						}
					}

				}

			});


			//fill with 0 the days without values
			let days = moment(endDate).diff(moment(startDate), 'd', false);

			for (let i = 0; i <= days; i++) {
				let nDate = moment(startDate).add(i, 'days').toDate();
				let dtTicks = new Date(nDate.getFullYear(), nDate.getMonth(), nDate.getDate()).getTime();

				if (notRead[dtTicks] === undefined){
					notRead[dtTicks] = 0;
				}
			
				if (read[dtTicks] === undefined){
					read[dtTicks] = 0;
				}
			}

			//transform the key/value dictionary to array
			let arrNotRead = Object.keys(notRead).map((key) => { 
				return [parseFloat(key), notRead[key]]; 
			});

			let arrRead = Object.keys(read).map((key) => { 
				return [parseFloat(key), read[key]]; 
			});

			//sort them ascending by day
			arrNotRead.sort((a, b) => { return a[0] - b[0]; });
			arrRead.sort((a, b) => { return a[0] - b[0]; });

			resolve({notRead: arrNotRead, read: arrRead});
			
        });

    });
};