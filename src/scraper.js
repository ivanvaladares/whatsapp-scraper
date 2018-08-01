let _setImmediate = setImmediate;
process.once('loaded', () => {
  global.setImmediate = _setImmediate;
});

// document.addEventListener("keydown", function (e) {
// 	if (e.which === 123) {
// 		window.electron.remote.getCurrentWindow().toggleDevTools();
// 	}
// });

window.electron = require('electron');
window.path = require("path");
const moment = require('moment');
const crypto = require('crypto');

let parou = false;
let diasCapturar = window.electron.remote.getGlobal('varGlobal').dias;
let podeRolar = false;
let chatName = "";
let idioma = "en";
let inseriuCover = false;
let intervalInicializador;
let intervalCapturaChat;
let tentativasCapturarChatFrustradas = 0;
let arrMensagens = [];
let arrMensagensParaSalvar = [];
let ultimoChat = null;

let arr_dias_extenso_br = "hoje,ontem,segunda,terça,quarta,quinta,sexta,sábado,domingo".split(',');
let arr_dias_extenso_us = "today,yesterday,monday,tuesday,wednesday,thursday,friday,saturday,sunday".split(',');

function click (el, etype) {
	let evt = document.createEvent("MouseEvents");
	evt.initMouseEvent(etype, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	el.dispatchEvent(evt);
}

function strDateToDate (dtStr){
	let data;

	for (let index = 0; index < arr_dias_extenso_br.length; index++) {
		if (dtStr.toLowerCase().indexOf(arr_dias_extenso_br[index]) >= 0){
			dtStr = arr_dias_extenso_us[index];
		}		
	}

	if (arr_dias_extenso_us.indexOf(dtStr.toLowerCase()) >= 0){

		if (dtStr.toLowerCase() === "hoje" || dtStr.toLowerCase() === "today"){
			data = new Date();
		}else{
			if (dtStr.toLowerCase() === "ontem" || dtStr.toLowerCase() === "yesterday"){
				data = moment(new Date()).add(-1, "day").toDate();
			}else{

				let old_dt = moment(new Date()).add(-1, "day");
				let nLoops = 0;

				while (dtStr.toLowerCase() !== old_dt.format("dddd").toLowerCase()){
					old_dt = moment(old_dt).add(-1, "day");
					nLoops++;

					if (nLoops > 20){
						break;
					}
				}

				data = old_dt.toDate();
			}
		}

	}else{

		switch (idioma) {
			case "en":
				data = moment(dtStr, "MM/DD/YYYY").toDate();
				break;
			default:
				data = moment(dtStr, "DD/MM/YYYY").toDate();
				break;
		}
	
	}

	return data;
}

function capturarProximoChat (){

	if (parou) {
		return;
	}

	let posicaoAtual = -1000;
	let arrChats = Array.from(document.querySelectorAll("#pane-side ._2wP_Y")); //tocou dom

	if (arrChats.length > 0){

		if (ultimoChat !== null){
			posicaoAtual = ultimoChat.getBoundingClientRect().top; 
		}

		let chatMaisProximo = null;
		let xmin = 9000000;

		arrChats.forEach(img => {

			let xtop = img.getBoundingClientRect().top; 

			if (xtop > posicaoAtual && xtop < xmin) {
				xmin = xtop;
				chatMaisProximo = img;
			}

		});

		return chatMaisProximo;
	}

	return null;
}

function voltarParaRelatorios (){
	parou = true;
	window.electron.ipcRenderer.sendToHost('fecharWhatsApp', arrMensagensParaSalvar.slice());
}

function inicializar () {
	if (parou) {
		return;
	}

	let chat = capturarProximoChat();

	if (chat === null){
		return;
	}


	if (!inseriuCover) {
		inseriuCover = true;
		let cover = document.createElement('div');
		cover.setAttribute('style', 'position: fixed; display: block; width: 100%; height: 100%; top: 0; left: 0;right: 0;bottom: 0;background-color: rgba(0,0,0,0.5); z-index: 99999; cursor: not-allowed;');

		document.body.appendChild(cover); //tocou dom

		let divMsgCarregando = document.createElement('div');
		divMsgCarregando.setAttribute('style', 'text-align:center; width: 200px;height: 80px;background-color: #fff;position:absolute;top:50%;left:50%;margin-left:-100px;margin-top:-40px;z-index: 999999;padding:20px;');
		let msgCarregando = document.createTextNode("loading messages..."); 
		divMsgCarregando.appendChild(msgCarregando);  

		let linebreak = document.createElement("hr");
		divMsgCarregando.appendChild(linebreak);

		let btnCancelar = document.createElement("BUTTON");
		let txtCancelar = document.createTextNode("Stop");
		btnCancelar.appendChild(txtCancelar);   
		btnCancelar.style.backgroundColor = "#4CAF50";
		btnCancelar.style.color = "white";
		btnCancelar.style.padding = "10px";
		btnCancelar.style.textAlign = "center";
		btnCancelar.style.cursor = "pointer";

		btnCancelar.onclick = () => { 
			voltarParaRelatorios();
		};
		divMsgCarregando.appendChild(btnCancelar); 

		document.body.appendChild(divMsgCarregando); //tocou dom

	}

	try {
		idioma = document.querySelector("html").attributes["lang"].value; //tocou dom
	} catch (error) {
		//nada
	}

	clearInterval(intervalInicializador);
	
	iniciarCapturaChat(chat);
}

function iniciarCapturaChat (chat){
	if (parou) {
		return;
	}

	ultimoChat = chat;

	chat.scrollIntoView();
	click(chat.querySelector(".dIyEr"), 'mousedown'); //tocou dom
	
	let nmChat = "[SEM NOME]";

	try {
		nmChat = chat.innerText.trim().split("\n")[0];

		let str_dt = chat.innerText.trim().split("\n")[1]; //pode ser hora:min, dia ou data:  //tocou dom

		if (str_dt.match(/[0-9]+[:][0-9]+/i) === null){
			let dataIni = strDateToDate(str_dt);

			if (moment(new Date()).diff(dataIni, 'days') > diasCapturar){
				
				if (capturarProximoChat() !== null) {
					setTimeout(() => {
						inicializar();
					}, 500);
				}else{
					console.log("captured all chats!");
					voltarParaRelatorios();
				}

				return;
			}
		}

	} catch (ex) {
		console.log("chat without name...");
	}

	chatName = nmChat;

	console.log('Entering a chat...' + nmChat);

	intervalCapturaChat = setInterval(() => {
		capturarMensagens();
	}, 500);
}

function capturarMensagens (){
	if (parou) {
		return;
	}

	podeRolar = true;

	//loading chat
	try {
		if (document.querySelectorAll("._3dGYA")[0].getBoundingClientRect().top > 0) {  //tocou dom
			console.log("loading chat....");
			return;
		}
	} catch (error) {
		//nada		
	}

	let achou_data_ini = false;
	let dataIni = moment(new Date()).toDate();

	let arrMensagensNew = Array.from(document.querySelectorAll(".message-in, .message-out"));  //tocou dom

	arrMensagensNew.forEach(elMsg => { 
		try {
			let str_dt = elMsg.querySelector(".copyable-text").attributes["data-pre-plain-text"].value; //[21:24, 3/5/2018] contact name:  //tocou dom
			dataIni = strDateToDate(str_dt.match(/[0-9]+\/[0-9]+\/[0-9]+/i)[0]);

			if (moment(new Date()).diff(dataIni, 'days') > diasCapturar){
				achou_data_ini = true;
			}

		} catch (error) {
			//console.log(error)
		}			
	});

	if (arrMensagensNew.length !== arrMensagens.length){
		arrMensagens = Array.from(arrMensagensNew);
		tentativasCapturarChatFrustradas = 0;
	}else{
		tentativasCapturarChatFrustradas++;
	}

	if (tentativasCapturarChatFrustradas > 20 || achou_data_ini){
		clearInterval(intervalCapturaChat);
		processarMensagensCapturadas();
	}	
}

function processarMensagensCapturadas (){

	if (parou) {
		return;
	}
	
	podeRolar = false;

	tentativasCapturarChatFrustradas = 0;

	let data_atual = null;

	arrMensagens.forEach(message => {

		try {
			let str_dt = message.querySelector(".copyable-text").attributes["data-pre-plain-text"].value; //[21:24, 3/5/2018] contact name:  //tocou dom
			data_atual = strDateToDate(str_dt.match(/[0-9]+\/[0-9]+\/[0-9]+/i)[0]);
		} catch (error) {
			//console.log(error)
		}	

		if (data_atual !== null && (message.classList.contains('message-in') || message.classList.contains('message-out'))){ //tocou dom
			let direction = message.classList.contains('message-in') ? "in" : "out"; //tocou dom
			let read = true;

			if (message.classList.contains('message-chat')) { //tocou dom

				try {
					let str_dt_name = message.querySelector(".copyable-text").attributes["data-pre-plain-text"].value; //[21:24, 3/5/2018] contact name:  //tocou dom
					let hora_minuto = str_dt_name.match(/[0-9]+[:][0-9]+/i)[0].split(":");
					data_atual.setHours(hora_minuto[0], hora_minuto[1]);
				} catch (error) {
					//console.log(error)
				}				

			}else{

				try {
					let arr_msg_text = message.innerText.trim().split("\n");
					let hora_minuto = arr_msg_text[arr_msg_text.length - 1].split(":");
					data_atual.setHours(hora_minuto[0], hora_minuto[1]);
				} catch (error) {
					//console.log(error)
				}
			}

			let imgUid = null;
			if (message.querySelector("._1JVSX") !== null) { //tocou dom 
				let img = message.querySelector("._1JVSX"); //tocou dom

				let canv = document.createElement("canvas");
				canv.width = img.naturalWidth; 
				canv.height = img.naturalHeight;
				let ctx = canv.getContext("2d");
				ctx.drawImage(img, 0, 0);
				let imgBase64 = canv.toDataURL();
				imgUid = gerarUidFromBase64(imgBase64);
				
				window.electron.ipcRenderer.sendToHost('salvarImagem', {imgUid, imgBase64});
			}

			if (direction === "out"){
				if (message.querySelector("[data-icon='msg-dblcheck-ack']") === null && message.querySelector("[data-icon='msg-dblcheck-ack-light']") === null){ //tocou dom
					read = false;
				}
			}

			if (moment(new Date()).diff(data_atual, 'days') < diasCapturar){
				arrMensagensParaSalvar.push({chatName, message: message.innerText, imgUid, direction, date: data_atual.getTime(), read});
			}			
		}

	});

	console.log(arrMensagens.length + " messages captured.");

	arrMensagens = [];

	if (capturarProximoChat() !== null) {
		setTimeout(() => {
			inicializar();
		}, 500);
	}else{
		console.log("captured all chats!");
		voltarParaRelatorios();
	}
}

function gerarUidFromBase64 (data) {
	let imageType = data.match(/data:image\/([a-zA-Z0-9-.+]+).*,.*/);

	if (!Array.isArray(imageType)){
		return null;
	}

	let id = data.substr(0, 1000);
	let sha = crypto.createHash('sha1');
	sha.update(id);
	let extensao = imageType[1];
	return sha.digest('base64').replace(/[\/\\\.,+=]+/gi, "") + "." + extensao;
}

document.addEventListener("DOMContentLoaded", () => {
	
	console.log('Initializing...');

	intervalInicializador = setInterval(() => {
		inicializar();
	}, 1000);

	//faz o chat rolar
	setInterval(() => {
		try {
			if (podeRolar){
				document.querySelectorAll(".message-in, .message-out")[0].scrollIntoView();
			}
		} catch (error) {
			//nada
		}
	}, 500);
});