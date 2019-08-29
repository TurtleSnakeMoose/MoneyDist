$(function (){
	
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
				
				<label class="col-1 col-form-label">${i+1}. </label>

				<div class="col-5">
					<input class="form-control attendantName" type="text" placeholder="Attendant#${i+1}" id="attndName${i+1}" data-attendantNum="${i+1}">
				</div>

				<label class="col-1 col-form-label">Paid </label>

				<div class="col-1" style="padding: 0 1vw">
					<input class="form-control attendantPaid" type="number" placeholder="0" id="attndPayment_${i+1}" style="width:5vw; data-attendantNum="${i+1}"">
				</div>

			</div>	
			`);	
		}

		$(payersDiv).append(`
			<div style="text-align: center;">
				<button class="btn btn-primary btn_calculate">Calculate</button>
			</div>
		`);

		// calculate button: calculate for every memeber of the party, how much money he should transfer to who
		$('.btn_calculate').on('click', function(e) {
			calcPayments();
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
			var resultContent = buildResultContent(attndCount, sum, precalculatedEachShare, attndData)
			displayCalculation(resultContent);
	}
	
	// build the result string based on input data
	function buildResultContent(attndCount, sum, precalculatedEachShare, attndData){
		console.table(attndData);
		var attendantsInDebt = [],
			attendantsOverPaid = [],
			transactions = [];

		//CONTINUE HERE =================================================================================================================================================
		$(attndData).each(function(i ,atnd){
			var atndBalance = precalculatedEachShare - atnd.Paid;
			if(atndBalance >= 0){
				attendantsInDebt.push({Name: atnd.Name, DebtBalance: atndBalance });
			}
			else {
				attendantsOverPaid.push({Name: atnd.Name, OverPaidBalance: Math.abs(atndBalance)});
			}
		});

		transactions = generateTransactions(attendantsInDebt, attendantsOverPaid);
		
		var resultContent = `
			<span>Combined sum of <strong>${sum}</strong> was collected by all <strong>${attndCount} attendants</strong>.</span><br>
			<span>Split evenly between all attendies BEFORE calculated distribution is <strong>${precalculatedEachShare}</strong>.</span>
		`;

		return resultContent;

	}

	function generateTransactions(attendantsInDebt, attendantsOverPaid){
		attendantsInDebt.sort(function(a,b) { return a.DebtBalance - b.DebtBalance; }); //sort inDebt ascending
		attendantsOverPaid.sort(function(a,b) { return b.OverPaidBalance - a.OverPaidBalance; }); //sort overPaid descending
		var transactions = [];
		
		debugger;
		$(attendantsOverPaid).each(function (opIndex, opAtnd){
			$(attendantsInDebt).each(function (dIndex, debtAtnd){
				if(debtAtnd.DebtBalance == 0)
					return;
				
				var curOpAtndBalance = opAtnd.OverPaidBalance;
				var curDebtAtndBalance = debtAtnd.DebtBalance;

				debugger;
				if(curOpAtndBalance - curDebtAtndBalance >= 0){
					transactions.push({From: debtAtnd.Name, To: opAtnd.Name, Total: curDebtAtndBalance});
					opAtnd.OverPaidBalance -= debtAtnd.DebtBalance;
					debtAtnd.DebtBalance = 0;
				}
				
			});
		});


	}
	
	// switch between panels to display the html content
	function displayCalculation(content){

		var resultPanel = $('#panel_result'),
			payersPanel = $('#panel_payers'),
			buttonContent = `<div style="text-align: center;"><button class="btn btn-primary btn_back">Back</button></div>`;

		resultPanel.show().empty();
		payersPanel.hide();

		resultPanel.append(content + buttonContent);

		$('.btn_back').on('click', function(){
			resultPanel.hide();
			payersPanel.show();
		})
	}

})
