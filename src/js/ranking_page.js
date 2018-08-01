(function () {
			
	$(window).load(() => {
		
		let dateFrom = new Date();
		dateFrom.setTime(dateFrom.getTime() - ((24 * 60 * 60 * 1000) * 30)); //-10 days

		$("#rankingFilterFrom").datepicker({dateFormat: "dd/mm/yy"}).datepicker("setDate", dateFrom);
		$("#rankingFilterTo").datepicker({dateFormat: "dd/mm/yy"}).datepicker("setDate", new Date());

		window.mask($("#rankingFilterFrom")[0], "NN/NN/NNNN");
		window.mask($("#rankingFilterTo")[0], "NN/NN/NNNN");

		$('#rankingFilterForm').on("submit", (event) => {
			event.preventDefault();
			reloadTable();
		});

		$("#tbl_ranking").paginate({'elemsPerPage': 50, 'maxButtons': 6});

		$(".nav-link[href='#ranking-page']").on("click", () => {
			if (!window.carregouPageRanking){
				reloadTable();
			}
		});
		
	});

	function reloadTable () {

		$.blockUI({ message: '' });

		let searchCriteria = {};
		searchCriteria.from = $("#rankingFilterFrom").val();
		searchCriteria.to = $("#rankingFilterTo").val();
		searchCriteria.direction = "out";


		window.MessageController.find(searchCriteria).then((items) => {

			window.carregouPageRanking = true;

			$('#tbl_ranking tbody').html("");

			let html = "";

			let contatosTbl = {};

			items.forEach((message) => {

				if (contatosTbl[message.chatName] === undefined){
					contatosTbl[message.chatName] = {contato: message.chatName, mensagens: 1, lidas: 0};
				}else{
					contatosTbl[message.chatName].mensagens ++;
				}

				contatosTbl[message.chatName].lidas += message.read === true ? 1 : 0;
			});

			let contatosArr = Object.keys(contatosTbl).map((key) => { return contatosTbl[key]; });

			contatosArr.forEach(contato => {
				contato.pct = ((contato.lidas / contato.mensagens) * 100).toFixed(2);
			});

			contatosArr.sort((x, y) => {
				return (y.pct - x.pct);
			}).forEach(contato => {

				html += '<tr>' +
				'<td>' + contato.contato + '</td>' +
				'<td class="text-center">' + contato.pct + '%</td>' +
				'</tr>';					

			});

			$('#tbl_ranking tbody').append(html);

			$('#tbl_ranking').paginate('update', 1);

			if (html === ""){
				html = "<tr><td colspan='5' class='text-center bg-danger'><strong>No record was found.</strong></td></tr>";
				$('#tbl_ranking tbody').append(html);
			}
			
			$.unblockUI();

		}).catch(err => {
			$.unblockUI();
			window.bootstrapPopup("Error", "Could not find any record!<br><br>Please try again.", null, "Ok");	
			console.log(err);
		});

	}

}());