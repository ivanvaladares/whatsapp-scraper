(function () {

	let carregouDados = false;

	$(window).load(() => {

		let dateFrom = new Date();
		dateFrom.setTime(dateFrom.getTime() - ((24 * 60 * 60 * 1000) * 30)); //-10 days

		$("#chartFilterFrom").datepicker({ dateFormat: "dd/mm/yy" }).datepicker("setDate", dateFrom);
		$("#chartFilterTo").datepicker({ dateFormat: "dd/mm/yy" }).datepicker("setDate", new Date());

		window.mask($("#chartFilterFrom")[0], "NN/NN/NNNN");
		window.mask($("#chartFilterTo")[0], "NN/NN/NNNN");

		$('#chartFilterForm').on("submit", (event) => {
			event.preventDefault();
			reloadData();
		});

		$(".nav-link[href='#chart-page']").on("click", () => {
			if (carregouDados){
				setTimeout(() => {
					$("#div_chart").highcharts().reflow();
				}, 100);
			}
			if (!carregouDados) {
				reloadData();
			}
		});

		$(window).on("carregouMensagens", () => {
			console.log("carregouMensagens na chart page");
			reloadData();
		});
			
	});

	function reloadData () {

		$.blockUI({ message: '' });

		let searchCriteria = {};
		searchCriteria.from = $("#chartFilterFrom").val();
		searchCriteria.to = $("#chartFilterTo").val();
		searchCriteria.direction = "out";

		window.MessageController.getChart(searchCriteria).then((items) => {

			plotChart([{
				name: 'Lidas',
				data: items.read,
				color: "#00FF00"
			}, {
				name: 'Não lidas',
				data: items.notRead,
				color: "#FF0000"
			}]);

			carregouDados = true;

			$.unblockUI();

		}).catch(err => {
			$.unblockUI();
			window.bootstrapPopup("Error", "Nao foi possível executar a busca!<br><br>Por favor, tente novamente.", null, "Ok");	
			console.log(err);
		});

	}

	function plotChart (data) {

		window.Highcharts.setOptions({ time: { useUTC: false } });

		window.Highcharts.chart('div_chart', {
			yAxis: {
				title: { text: 'Mensagens' },
				allowDecimals: false
			},
			xAxis: {
				type: 'datetime',
				showFirstLabel: true,
				minTickInterval: (24 * 3600 * 1000)
			},
			series: data,
			plotOptions: { spline: { marker: { enabled: true } } },
			credits: { enabled: false },
			exporting: { enabled: false },
			title: { text: null },
			subtitle: { text: null }

		});
	}

}());