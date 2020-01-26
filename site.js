var wou = wou || {};
wou.site = wou.site || {};

$(function (){

	var _sidePotCount = 0;
	
	$('#versionInfo').on('click', function(e) { wou.util.loadHardCodedData(); });
	
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
			payersDiv.append(wou.view.appendAttendantRow(i));	
		}
				
		$(payersDiv).append(wou.view.appendButtonsDiv());

		// calculate button: calculate for every memeber of the party, how much money he should transfer to who
		$('.btn_calculate').on('click', function(e) { calcPayments(); });

		// add side pot button: add side pot when someone pays for something that is'nt shared with the entire group.
		$('.btn_addSidePot').on('click', function(e) { addSidePotRow(); });

		// check for name validity and availability. add number to already existing name and enable buttons
		$('.attendantName').on('blur', function () { wou.util.validate_inputs(); });
	}

	// calculate the funds transaction
	function calcPayments () {
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

			var summaryContent = wou.view.buildSummaryContent(attndCount, sum, precalculatedEachShare);
			var tableContent = wou.calc.buildTableContent(precalculatedEachShare, attndData);

			showResult(summaryContent, tableContent);
	}
	
	// switch between panels to display the html content
	function showResult(summaryContent, tableContent){

		var resultPanel = $('#panel_result'),
			payersPanel = $('#panel_payers'),
			buttonContent = wou.view.btnDiv_backAndCopy();
		
		resultPanel.find('tbody').empty();
		resultPanel.find('#div_summaryInfo').remove();
		resultPanel.find('.btn_back').remove();
		resultPanel.find('.btn_copyToClipboard').remove();
		resultPanel.show();
		payersPanel.hide();

		resultPanel.append(summaryContent + buttonContent);
		resultPanel.find('tbody').append(tableContent);

		$('.btn_shareViaWhatsApp').attr('href', `whatsapp://send?text=${wou.util.transactionsAsText}`);
		
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
			attendantRow = payersPanel.find('.attendantRow'),
			buttonsDiv = payersPanel.find('.buttonsDiv').detach();
			attndNames = [];

		$.each(attendantRow, function (i, el){
			let attendant = $(el),
				atndName = attendant.find('.attendantName').val();
			attndNames.push(atndName);
		});

		$('#panel_payers').append(wou.view.getEmptySidePotRow(++_sidePotCount, attndNames));

		var thisSidepot = payersPanel.find('#sidepot_'+_sidePotCount+'');
		thisSidepot.find('.sidePot_participant_multiselect').multiselect({}); // init multiselection

		$(payersPanel).append(buttonsDiv);
		buttonsDiv.find('button').attr('disabled', true); // disable buttons until validated
		$('.attendantName').attr('disabled', true) // disable name input once siderows are present

		// display selected name on DropDown and validate sidepots
		$('.dropdown-item').on('click', function(){
			$(this).parents('.sidepot_whoPaid').find('button').text(this.text).addClass('valid');
			wou.util.validate_sidePotRows();
		});
		
		// validate sidepots
		$('.multiselect-container input[type="checkbox"]').on('change', function () { wou.util.validate_sidePotRows(); });

		// remove sidepot row - enable\disabled buttons and name inputs if no more sidepots left
		$('.removeSidePot').off('click').on('click', function () { --_sidePotCount;  wou.util.removeSidePotRow(this); });
	}
})
