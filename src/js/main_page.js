window.electron = require("electron");
window.moment = require("moment");
window.MessageController = require("./controller/message-controller.js");
window.ContactController = require('./controller/contact-controller');
window.LoadController = require("./controller/load-controller.js");
window.Highcharts = require("Highcharts");

const jimp = require("jimp");
const fs = require('fs');
const userDataPath = (window.electron.app || window.electron.remote.app).getPath('userData');


window.paginaAtual = null;
window.carregouPageMensagens = false;
window.carregouPageRanking = false;

$(window).on("load", () => {

	$(".nav-link").on("click", function (event) {
		event.preventDefault();

		window.paginaAtual = $(this).attr("href");

		$(".nav-link").parent().removeClass("active");
		$(".nav-link[href='" + $(this).attr("href") + "']").parent().addClass("active");

		$(".page").hide();
		$($(this).attr("href")).show();

		$("#myNavbar").collapse("hide");
	});

	$(".btn-carregar").on("click", () => {
		$("#dataLoad").datepicker("show");
	});

	$("#dataLoad").datepicker({
		dateFormat: "dd/mm/yy",
		maxDate: '-1',
		onSelect: function (dt){

			let dias = window.moment(new Date()).diff(window.moment(dt, "DD/MM/YYYY"), 'd', false);

			if (confirm("Dou you want to load " + dias + " day(s) of messages from WhatsApp?")){
				window.electron.remote.getGlobal("varGlobal").dias = dias;
		
				$(".navbar").hide();
				$(".page").hide();

				$("#whats-page").show();
				$("#whats-page webview").attr("src", "https://web.whatsapp.com/");
				
				//just in case it does not work
				setTimeout(() => {
					$("#whats-page webview").attr("src", "https://web.whatsapp.com/");
				}, 1000);
			}
		}
	});

	$("webview")[0].addEventListener('ipc-message', (event) => {

		if (event.channel === "fecharWhatsApp"){
			$(".navbar").show();
			$(".page").hide();

			$("#whats-page").hide();
			$("#whats-page webview").attr("src", "./whatsapp.html");

			$("#chart-page").show();

			salvarMensagens(event.args[0]);
		}
		
		if (event.channel === "salvarImagem"){
			let objImg = event.args[0];

			salvarImagem(objImg.imgUid, objImg.imgBase64).catch((err) => {
				console.log(err);
			});
		}

	});

	window.showLastLoadDate();

	$("body").show();

	$(".nav-link[href='#chart-page']").trigger("click");

});

$(window).on("load resize", () => {
	$("body").css("margin-top", parseInt($(".navbar").css("height")) + 10); 
});

window.showLastLoadDate = () => {
	window.LoadController.find({}, {date: -1}).then((items) => {
		
		if (items.length > 0) {
			$("#li_last_load span").text("Last load was: " + items[0].date + " ");
		}else{
			$("#li_last_load span").text("No load was done");
		}

	});
};

window.bootstrapPopup = function (heading, question, cancelButtonTxt, okButtonTxt, okButtonType, callback) {

	var cancelButton = "";
	var okButton = "";

	if (cancelButtonTxt !== null && cancelButtonTxt !== undefined) {
		cancelButton = '<a href="#!" class="btn btn-default" data-dismiss="modal">' + cancelButtonTxt + '</a>';
	}

	if (okButtonTxt !== null && okButtonTxt !== undefined) {
		okButtonType = (okButtonType === null || okButtonType === undefined) ? "primary" : okButtonType;
		okButton = '<a href="#!" id="okButton" class="btn btn-' + okButtonType + '" data-dismiss="modal">' + okButtonTxt + '</a>';
	}

	let confirmModal =
		$('<div class="modal fade" role="dialog" tabindex="-1">' +
			'<div class="modal-dialog">' +
				'<div class="modal-content">' +
					'<div class="modal-header">' +
						'<button type="button" class="close" data-dismiss="modal">' +
						'<span>&times;</span>' +
						'</button>' +
						'<h4 class="modal-title">' + heading + '</h4>' +
					'</div>' +
					'<div class="modal-body">' +
						'<p>' + question + '</p>' +
					'</div>' +
					'<div class="modal-footer">' + cancelButton + okButton + '</div>' +
				'</div>' +
			'</div>' +
		'</div>');

	confirmModal.find('#okButton').click(() => {
		confirmModal.modal('hide');
		if (callback) {
			return callback();
		}
	});

	confirmModal.modal('show');
};

function salvarMensagens (arrMensagens) {

	if (!Array.isArray(arrMensagens)){
		return;
	}

	let contacts = {};

	window.LoadController.saveNew();

	$.blockUI({ message: 'Saving captured messages...' });

	let arrPromises = arrMensagens.map((mensagem) => {

		let fileName = null;

		if (mensagem.imgUid !== null){
			fileName = userDataPath + "/" + mensagem.imgUid;
		}

		contacts[mensagem.chatName] = {contact: mensagem.chatName};

		return window.MessageController.saveMessage(mensagem.chatName, mensagem.message, mensagem.direction, fileName, mensagem.date, mensagem.read); 

	});

	let contatosArr = Object.keys(contacts).map((key) => { return contacts[key]; });

	contatosArr.forEach(c => {
		arrPromises.push(window.ContactController.saveContact(c.contact));
	});

	window.carregouPageMensagens = false;
	window.carregouPageRanking = false;

	Promise.all(arrPromises).then(() => {
		window.showLastLoadDate();
		window.MessageController.carregarBusca();
		$(window).trigger("carregouMensagens");
	}).catch(() => {
		window.bootstrapPopup("Erro", "One or more messages could not be saved!", null, "Ok", "", null);
		window.showLastLoadDate();
		window.MessageController.carregarBusca();
		$(window).trigger("carregouMensagens");
	});

}

function salvarImagem (imgUid, base64Data) {
	return new Promise((resolve, reject) => {

		if (base64Data === undefined || base64Data === ""){
			return resolve("");
		}

		let imageType = base64Data.match(/data:image\/([a-zA-Z0-9-.+]+).*,.*/);

		if (!Array.isArray(imageType)){
			return resolve("");
		}

		base64Data = base64Data.replace(/^data:image\/\w+;base64,/, '');
		
		let filename = userDataPath + "/" + imgUid;
		let filename_orig = userDataPath + "/" + imgUid.replace(".", "_orig.");

		jimp.read(Buffer.from(base64Data, 'base64'), (err, image) => {
			if (err) {
				return reject(err);
			}
			
			image
				.cover(40, 40, jimp.HORIZONTAL_ALIGN_CENTER | jimp.VERTICAL_ALIGN_MIDDLE)
				.write(filename, (err) => {
					if (err) {
						return reject(err);
					}

					fs.writeFile(filename_orig, base64Data, 'base64', (err) => {
						if (err) {
							return reject(err);
						}

						resolve(filename);
					});

				});
				
		});

	});

}