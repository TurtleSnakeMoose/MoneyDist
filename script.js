$(function (){
	
	// TESTING ONLY - REMOVE WHEN WORKING
	$('#versionInfo').on('click', function(e) {
		var hardCodedData = [
			{Name: 'Jinji', Paid:593},
			{Name: 'Mini', Paid:345},
			{Name: 'Igor', Paid:400},
			{Name: 'Yan', Paid:0},
			{Name: 'Bomj', Paid:0},
			{Name: 'Slava', Paid:123},
			{Name: 'Eli', Paid:50},
			{Name: 'Vova', Paid:50},
			{Name: 'Oleg', Paid:23}
			],
			atndRows = $('.attendantRow');

		for(i = 0 ; i < atndRows.length ; i++){
			$(atndRows[i]).find('.attendantName').val(hardCodedData[i].Name);
			$(atndRows[i]).find('.attendantPaid').val(hardCodedData[i].Paid);
		}
	});
	
	// start button : correct number if num > 25 OR num < 2. display attendant names and payment inputs.
	$('.btn_start').on('click', function(e) {
		var numOfAttendants =  parseInt($('#input_attendNum').val());
		appendAttendantInfo(numOfAttendants < 2 ? 2 : numOfAttendants > 25 ? 25 : numOfAttendants)
	});

	// append attendant names and payment inputs to form 
	function appendAttendantInfo(numOfAttendants){
		var payersDiv = $('#panel_payers');
		$(payersDiv).empty();

		for(i = 0 ; i < numOfAttendants ; i++){
			payersDiv.append(`
			<div class="form-group row attendantRow">
				
				<label class="col-1">${i+1}. </label>

				<div class="col-5">
					<input class="form-control attendantName" type="text" placeholder="Attendant#${i+1}" id="attndName${i+1}" data-attendantNum="${i+1}">
				</div>

				<label class="col-2">Paid </label>

				<div class="col-4">
					<input class="form-control attendantPaid" type="number" placeholder="0" id="attndPayment_${i+1}" data-attendantNum="${i+1}"">
				</div>
					
			</div>	
			`);	
				}
				
				$(payersDiv).append(`
			<div style="text-align: center;">
				<button class="btn btn-primary btn_addSidePot" disabled >Add side pot</button>
				<button class="btn btn-primary btn_calculate" disabled >Calculate</button>
			</div>
		`);

		// calculate button: calculate for every memeber of the party, how much money he should transfer to who
		$('.btn_calculate').on('click', function(e) {
			calcPayments();
		});

		// calculate button: calculate for every memeber of the party, how much money he should transfer to who
		$('.btn_addSidePot').on('click', function(e) {
			alert('add side pot');
		});

		// check for name validity and availability. add number to already existing name and enable buttons
		$('.attendantName').on('blur', function () {
			var allNames = [],
				buttons = $('.btn_addSidePot, .btn_calculate'),
				isValid = true;

			// check for duplicated names - clear if duplicate. push name into list for future validation
			$('.attendantName').each(function (i,el) {
				el.value = allNames.includes(el.value) ? '' : el.value;
				allNames.push(el.value);			
			});
			
			// check if form is valid - no empty or white spaces 
			$(allNames).each( function (i,el){
				if(this.trim().length === 0) { isValid =  false; }
			});
			
			// enable\disable buttons
			buttons.removeAttr('disabled').attr('disabled' , isValid ? false : true);
				
		});
	}

	// calculate the funds transaction
	function calcPayments (){
		var payersPanel = $('#panel_payers'),
			attndCount = parseInt($('#input_attendNum').val()),
			attndData = [],
			sum = 0;
			precalculatedEachShare = 0;

			payersPanel.find('.attendantRow').each(function (i, el){
				var attendant = $(el),
					atndName = attendant.find('.attendantName').val(),
					atndPaid = parseInt(attendant.find('.attendantPaid').val() === '' ? 0 : attendant.find('.attendantPaid').val());
				sum += atndPaid;
				attndData.push({Name: atndName, Paid: atndPaid});
			});

			precalculatedEachShare = sum / attndCount;

			var summaryContent = buildSummaryContent(attndCount, sum, precalculatedEachShare);
			var tableContent = buildTableContent(precalculatedEachShare, attndData);

			showResult(summaryContent, tableContent);
	}
	
	// build the result string based on input data
	function buildSummaryContent(attndCount, sum, precalculatedEachShare){
		var summarySection = `
			<div id="div_summaryInfo">
				<span>Combined amount of <strong>${sum}</strong> was collected by all <strong>${attndCount} attendants</strong>.</span><br>
				<span>Split evenly between everyone: <strong>${precalculatedEachShare}</strong>.</span>
			</div>
		`;
		return summarySection;
	}

	// build the result string based on input data
	function buildTableContent(precalculatedEachShare, attndData){
		var attendantsInDebt = [],
			attendantsOverPaid = [];
			
		$(attndData).each(function(i ,atnd){
			var atndBalance = precalculatedEachShare - atnd.Paid;
			if(atndBalance >= 0){
				attendantsInDebt.push({Name: atnd.Name, DebtBalance: atndBalance });
			}
			else {
				attendantsOverPaid.push({Name: atnd.Name, OverPaidBalance: Math.abs(atndBalance)});
			}
		});
		var transactions = generateTransactions(attendantsInDebt, attendantsOverPaid);

		var transactionSection = '';
		var transactionTextToCopy = '';
		$(transactions).each(function(i, trns){
			transactionTextToCopy += `*${trns.From}* --${trns.Total}--> *${trns.To}*\r\n`;
			transactionSection += `<tr><td>${trns.From}</td><td>${trns.To}</td><td>${trns.Total}</td></tr>`;
		});	
		$('#copiableTransaction').val(transactionTextToCopy);
		return transactionSection;
		
	}

	function generateTransactions(attendantsInDebt, attendantsOverPaid){

		attendantsInDebt.sort(function(a,b) { return a.DebtBalance - b.DebtBalance; }); //sort inDebt ascending
		attendantsOverPaid.sort(function(a,b) { return b.OverPaidBalance - a.OverPaidBalance; }); //sort overPaid descending
		var transactions = [];
		
		$(attendantsOverPaid).each(function (opIndex, opAtnd){
			$(attendantsInDebt).each(function (dIndex, debtAtnd){

				if(debtAtnd.DebtBalance == 0 || opAtnd.OverPaidBalance == 0)
					return;
				
				var curOpAtndBalance = opAtnd.OverPaidBalance;
				var curDebtAtndBalance = debtAtnd.DebtBalance;
				
				if(curOpAtndBalance - curDebtAtndBalance < 0 ){
					transactions.push({From: debtAtnd.Name, To: opAtnd.Name, Total: Math.round(curOpAtndBalance)});
					debtAtnd.DebtBalance -= curOpAtndBalance;
					opAtnd.OverPaidBalance = 0;
					console.log(`${debtAtnd.Name} ---${curOpAtndBalance}---> ${opAtnd.Name} | ${debtAtnd.Name}'s debt is: ${debtAtnd.DebtBalance} | ${opAtnd.Name}'s balance is 0`);
					console.log(`-------------------------------------------------------------------------------`);
				}
				else {
					transactions.push({From: debtAtnd.Name, To: opAtnd.Name, Total: Math.round(curDebtAtndBalance)});
					opAtnd.OverPaidBalance -= debtAtnd.DebtBalance;
					debtAtnd.DebtBalance = 0;
					console.log(`${debtAtnd.Name} ---${curDebtAtndBalance}---> ${opAtnd.Name} | ${debtAtnd.Name}'s debt is: 0 | ${opAtnd.Name}'s balance is ${opAtnd.OverPaidBalance}`);
					console.log(`-------------------------------------------------------------------------------`);
				}
			});
		});

		return transactions;
	}
	
	// switch between panels to display the html content
	function showResult(summaryContent, tableContent){

		var resultPanel = $('#panel_result'),
			payersPanel = $('#panel_payers'),
			buttonContent = `<div style="text-align: center;">
								<button class="btn btn-primary btn_back">Back</button>
								<button class="btn btn-primary btn_copyToClipboard">Copy as text</button>
							</div>`;
		
		resultPanel.find('tbody').empty();
		resultPanel.find('#div_summaryInfo').remove();
		resultPanel.find('.btn_back').remove();
		resultPanel.find('.btn_copyToClipboard').remove();
		resultPanel.show();
		payersPanel.hide();

		resultPanel.append(summaryContent + buttonContent);
		resultPanel.find('tbody').append(tableContent);

		$('.btn_back').on('click', function(){
			resultPanel.hide();
			payersPanel.show();
		})

		$('.btn_copyToClipboard').on('click', function(){
			$('#copiableTransaction').select();
			document.execCommand("copy");
		})
	}

})
