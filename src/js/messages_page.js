(function () {
	
	$(window).load(() => {
		
		let dateFrom = new Date();
		dateFrom.setTime(dateFrom.getTime() - ((24 * 60 * 60 * 1000) * 30)); //-10 days

		$("#messageFilterFrom").datepicker({dateFormat: "dd/mm/yy"}).datepicker("setDate", dateFrom);
		$("#messageFilterTo").datepicker({dateFormat: "dd/mm/yy"}).datepicker("setDate", new Date());

		window.mask($("#messageFilterFrom")[0], "NN/NN/NNNN");
		window.mask($("#messageFilterTo")[0], "NN/NN/NNNN");

		$('#messageFilterForm').on("submit", (event) => {
			event.preventDefault();
			reloadTable();
		});

		$("#tbl_messages").paginate({'elemsPerPage': 50, 'maxButtons': 6});

		$(".nav-link[href='#messages-page']").on("click", () => {
			if (!window.carregouPageMensagens){
				reloadComboChatContatos();
				reloadTable();
			}
		});
		
	});

	function reloadComboChatContatos (){

		$.blockUI({ message: '' });

		let searchCriteria = {};
		searchCriteria.direction = "out";

		window.ContactController.find(searchCriteria).then((items) => {

			$('#messageFilterChatContato').html("");

			if (items.length <= 0){
				$('#messageFilterChatContato').append($('<option>', {
					value: '',
					text: "- no contact found -"
				}));
			}else{
				$('#messageFilterChatContato').append($('<option>', {
					value: "",
					text: "All"
				}));

				items.forEach(c => {
	
					$('#messageFilterChatContato').append($('<option>', {
						value: c.contact,
						text: c.contact
					}));
	
				});

			}

		});

	}

	function viewMessage (btn) { 

		let messageId = $(btn).closest("tr").attr("data-id");

		$.blockUI({ message: '' });

		let searchCriteria = {};
		searchCriteria._id = messageId;

		window.MessageController.find(searchCriteria).then((message) => {

			searchCriteria = {};
			searchCriteria.from = message[0].date.substr(0, 10);
			searchCriteria.to = message[0].date.substr(0, 10);
			searchCriteria.direction = "out";

			window.MessageController.find(searchCriteria).then((mensagens) => {

				let arrMensagensSimilares = [];
				let messageCortada = message[0].message;
				messageCortada = messageCortada.substr(0, messageCortada.lastIndexOf(":") - 2);
				let messageDtDate = message[0].dtDate;

				mensagens.forEach(msg => {
					let secDiff = window.moment(msg.dtDate).diff(window.moment(messageDtDate), 'seconds');

					if (secDiff > -10 && secDiff < 10){
						let msgCortada = msg.message.substr(0, msg.message.lastIndexOf(":") - 2);

						if (msgCortada === messageCortada){
							arrMensagensSimilares.push(msg);
						}
					}

				});

				let contLidas = 0;
				arrMensagensSimilares.forEach(msg => {
					contLidas += msg.read ? 1 : 0;
				});


				let modalHead = 'Message details';
				let modalBody = `Message sent <b>${message[0].date}</b> <br /> 
								To <b>${arrMensagensSimilares.length}</b> chat/contact(s) <br /> 
								Read <b>${contLidas}</b> chat/contact(s) <br />`;

				modalBody += `<div style="max-height: 350px; overflow-y:auto"><table class="table table-striped" cellspacing="0" width="100%">
							<thead>
								<tr>
									<th>Chat/Contact</th>
									<th class="text-center" style="width:50px">Lida</th>
								</tr>
							</thead>
							<tbody>
							`;

				arrMensagensSimilares.sort((x, y) => {
					if (x.read > y.read) {
						return -1;
					}
					else if (x.read < y.read) {
						return 1;
					}
					else {
						return (x.chatName >= y.chatName);
					}
				}).forEach(msg => {

					let html_delivered = '<span class="glyphicon glyphicon-' + 
						(msg.read === true ? 'check' : 'unchecked') + '"></span>';

					modalBody += `<tr><td>${msg.chatName}</td><td class="text-center">${html_delivered}</td></tr>`;				
				});

				modalBody += `</tbody>
							</table>
							</div>
							`;				

				$.unblockUI();

				window.bootstrapPopup(modalHead, modalBody, null, "Ok");			

			}).catch(err => {
				$.unblockUI();
				window.bootstrapPopup("Error", "Could not find any record!<br><br>Please try again.", null, "Ok");	
				console.log(err);
			});

		}).catch(err => {
			$.unblockUI();
			window.bootstrapPopup("Error", "Could not find any record!<br><br>Please try again.", null, "Ok");		
			console.log(err);
		});

	}

	function reloadTable () {

		$.blockUI({ message: '' });

		let searchCriteria = {};
		searchCriteria.chatName = $("#messageFilterChatContato").val();
		searchCriteria.from = $("#messageFilterFrom").val();
		searchCriteria.to = $("#messageFilterTo").val();
		searchCriteria.read = $("#messageFilterStatus").val();
		//searchCriteria.direction = "out";
		searchCriteria.busca = $("#messageFilterBusca").val();

		window.MessageController.find(searchCriteria).then((items) => {
			
			window.carregouPageMensagens = true;

			$('#tbl_messages tbody').html("");

			let html = "";

			items.forEach((message) => {

				let html_delivered = '<span class="glyphicon glyphicon-' + 
										(message.read === true ? 'check' : 'unchecked') + '"></span>';

				let messageText = message.message.split("\n").join(" - ");
				messageText = messageText.replace("-  -", "-");

				let messageImg = "";
				if (message.img !== null){
					messageImg = "<a class='imgPopup' href='" + message.img.replace(".", "_orig.") + "' title='" + messageText + "'><img src='" + message.img + "'></a> ";
				}
				
				html += '<tr data-id="' + message._id + '" class="direction-' + message.direction + '">' +
						'<td class="td-nmChat">' + message.chatName + '</td>' +
						'<td class="td-chatMsg">' + messageImg + messageText + '</td>' +
						'<td>' + message.date + '</td>' +
						'<td class="text-center">' + html_delivered + '</td>' +
						'<td class="text-center">' +
							'<span class="glyphicon glyphicon-eye-open"></span>' +
						'</td>' +
					'</tr>';						
			});

			$('#tbl_messages tbody').append(html);

			$('#tbl_messages tbody').find(".glyphicon-eye-open").on("click", function () {
				viewMessage(this);
			});

			$('#tbl_messages').paginate('update', 1);

			$('.imgPopup').magnificPopup({
				type: 'image',
				titleSrc: 'title',
				gallery: {
					// options for gallery
					enabled: true
				}
				// other options
			});

			if (html === ""){
				html = "<tr><td colspan='5' class='text-center bg-danger'><strong>No record was found.</strong></td></tr>";
				$('#tbl_messages tbody').append(html);
			}
			
			$.unblockUI();

		}).catch(err => {
			$.unblockUI();
			window.bootstrapPopup("Error", "Could not find any record!<br><br>Please try again.", null, "Ok");		
			console.log(err);
		});

	}

}());