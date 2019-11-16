$(function (){

	var _sidePotCount = 0;
	
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
			
			if(i == atndRows.length - 1){
				$(atndRows[i]).find('.attendantName').trigger('blur');
			}
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
			<div class="buttonsDiv" style="text-align: center;">
				<button class="btn btn-primary btn_addSidePot" disabled >Add side pot</button>
				<button class="btn btn-primary btn_calculate" disabled >Calculate</button>
			</div>
		`);

		// calculate button: calculate for every memeber of the party, how much money he should transfer to who
		$('.btn_calculate').on('click', function(e) {
			calcPayments();
		});

		// add side pot button: add side pot when someone pays for something that is'nt shared with the entire group.
		$('.btn_addSidePot').on('click', function(e) {
			addSidePotRow();
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
				<span>Main pot has <strong>${sum}</strong> collected by all <strong>${attndCount} parties</strong>.</span><br>
				<span>Split evenly between everyone: <strong>${precalculatedEachShare.toFixed(1)}</strong>.</span>
			</div>
		`;
		return summarySection;
	}

	// build the result string based on input data
	function buildTableContent(precalculatedEachShare, attndData){
		var attendantsInDebt = [],
			attendantsOverPaid = [];
			isSidePotExists = $('.sidepotRow').length > 0;

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

		if(isSidePotExists){
			transactions = calcSidePots(transactions);
		}

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
				}
				else {
					transactions.push({From: debtAtnd.Name, To: opAtnd.Name, Total: Math.round(curDebtAtndBalance)});
					opAtnd.OverPaidBalance -= debtAtnd.DebtBalance;
					debtAtnd.DebtBalance = 0;
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

	function addSidePotRow() {
		var payersPanel = $('#panel_payers'),
			buttonsDiv = payersPanel.find('.buttonsDiv').detach();
			attndNames = [];

		payersPanel.find('.attendantRow').each(function (i, el){
			var attendant = $(el),
				atndName = attendant.find('.attendantName').val();

			attndNames.push(atndName);
		});

		$('#panel_payers').append(`
						<div class="sidepotRow row" id="sidepot_`+ ++_sidePotCount +`">
							<div class="sidepot_whoPaid row" style="display:flex;"></div>
							<div class="sidepot_forWho row" style="display:flex;"></div>
						</div>`
		);

		var thisSidepot = payersPanel.find('#sidepot_'+_sidePotCount+'');
		var thisSidepotWhoPaidRow = $(thisSidepot).find('.sidepot_whoPaid');
		var thisSidepotForWho = $(thisSidepot).find('.sidepot_forWho');

		$(thisSidepotWhoPaidRow).append(`<i class="fa fa-trash removeSidePot col-1"></i>`);
		$(thisSidepotWhoPaidRow).append(cunstructDropdownElement(attndNames)); // append sidepot payer dropdown selection
		$(thisSidepotWhoPaidRow).append(`
				<label class="col-2">Paid </label>

				<div class="col-4">
					<input class="form-control sidepotPaid" type="number" style="margin-top: 9px;" placeholder="0" id="sidepot_`+_sidePotCount+`_amountPaid">
				</div>
		`);
		$(thisSidepotForWho).append(constructMultiSelectElement(attndNames)); // append sidepot participents multiselection
		$(thisSidepotForWho).find('.sidePot_participant_multiselect').multiselect({}); // init multiselection
		$(payersPanel).append(buttonsDiv);

		$('.dropdown-item').on('click', function(){
			displayDropDownSelection($(this));
		});

		$('.removeSidePot').on('click', function (){ $(this).closest('.sidepotRow').remove() });
	}

	function constructMultiSelectElement(allNames){
		var msElement = `
						<label class="col-1"> </label>
						<label class="col-2">For </label>
					`;

		for(i = 0 ; i < allNames.length ; i++){
			if(i == 0) {
				msElement += '<div class="col-9"><select id="boot-multiselect-demo" class="sidePot_participant_multiselect" multiple="multiple">';
			}
			
			msElement += '<option value="'+ allNames[i] +'">'+ allNames[i] +'</option>';

			if(i == allNames.length-1) {
				msElement += '</select></div>';
			}
		}

		return msElement;
	}

	function cunstructDropdownElement(allNames){
		var ddElement = '';
		for(i = 0 ; i < allNames.length ; i++){
			if(i == 0) {
				ddElement += `
				<div class="col-5 btn-group dropup">
					<button type="button" class="btn btn-warning dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> WhoPaid </button>
				<div class="dropdown-menu">
				`;
			}
			
			ddElement += '<a class="dropdown-item" href="#">'+ allNames[i] +'</a>';

			if(i == allNames.length-1) {
				ddElement += `
					</div>
				</div>
				`;
			}
		}

		return ddElement;
	}

	function displayDropDownSelection(item){
		$(item).parents('.sidepot_whoPaid').find('button').text(item.text());
	}

	function calcSidePots(generalTransactions){
		var sidePots = $('.sidepotRow'),
			sidePotTransactions = [];

		sidePots.each(function(i, el){
			var sp_payer = $(this).find('.sidepot_whoPaid button').text(),
			sp_for = $(this).find('.sidepot_forWho button').attr('title').split(','),
			amount = $(this).find('.sidepotPaid').val(),
			amountPerPerson = Math.round(amount / sp_for.length);

			$(sp_for).each(function(index, attendant){
				if(attendant.trim() === sp_payer.trim()){
					return;
				}
				sidePotTransactions.push({From:attendant.trim(), To:sp_payer.trim(), Total:amountPerPerson, Calculated: false});
			});
		});

		return crossCalcGeneralAndSidePots(generalTransactions, sidePotTransactions);
	}

	function crossCalcGeneralAndSidePots(generalTransactions, sidePotTransactions){
		var temp = {},
			finalCalcTransactions = [];

		$(generalTransactions).each(function(i, gt){
			temp = {};
			$(sidePotTransactions).each(function(j, spt){	

				if($.isEmptyObject(temp)){
					temp = gt;
				} 
				else if (spt.Calculated === false && (temp.From === spt.From || temp.From === spt.To ) && (temp.To === spt.From || temp.To === spt.To )) {
					
					if(temp.From === spt.From){
						temp = {From:temp.From, To:temp.To, Total:temp.Total + spt.Total};
					}
				
					if(temp.From === spt.To){
						if(temp.Total > spt.Total){
							temp = {From:temp.From, To:temp.To, Total:temp.Total - spt.Total};
						}
						else{
							temp = {From:temp.To, To:temp.From, Total:spt.Total - temp.Total};
						}
					}

					spt.Calculated = true;
				}
			})
			finalCalcTransactions.push(temp);
		});
		
		return calcAndAddRemainingSidePotTransactions(finalCalcTransactions, sidePotTransactions);
	}

	function calcAndAddRemainingSidePotTransactions (finalCalcTransactions, sidePotTransactions){
		var temp = {};
			cloneSidePotTransactions = JSON.parse(JSON.stringify(sidePotTransactions))

		$(sidePotTransactions).each(function(i, spt){
			if (spt.Calculated){
				return;
			}
			temp = {};
			$(cloneSidePotTransactions).each(function(j, cloneSpt){	
				if(i==j || cloneSpt.Calculated === true || spt.Calculated === true) {
					return;
				}

				if($.isEmptyObject(temp)){
					temp = spt;
				} 
				else if ((temp.From === cloneSpt.From || temp.From === cloneSpt.To ) && (temp.To === cloneSpt.From || temp.To === cloneSpt.To )) {

					if(temp.From === cloneSpt.From){
						temp = {From:temp.From, To:temp.To, Total:temp.Total + cloneSpt.Total};
					}
				
					if(temp.From === cloneSpt.To){
						if(temp.Total > cloneSpt.Total){
							temp = {From:temp.From, To:temp.To, Total:temp.Total - cloneSpt.Total};
						}
						else{
							temp = {From:temp.To, To:temp.From, Total:cloneSpt.Total - temp.Total};
						}
					}
					
					cloneSidePotTransactions[j].Calculated = true;
					sidePotTransactions[i].Calculated = true;
					sidePotTransactions[j].Calculated = true;
				}
			})
			finalCalcTransactions.push(temp);
		});

		return finalCalcTransactions;
	}

})
