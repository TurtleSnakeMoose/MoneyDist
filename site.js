var wou = wou || {};
wou.site = wou.site || {};

$(function (){

	var _sidePotCount = 0;
	
	// TESTING ONLY - REMOVE WHEN WORKING
	$('#versionInfo').on('click', function(e) {
		wou.util.loadHardCodedData();
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
			payersDiv.append(wou.view.appendAttendantRow(i));	
		}
				
		$(payersDiv).append(wou.view.appendButtonsDiv());

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

		// display selected name on DropDown
		$('.dropdown-item').on('click', function(){
			debugger;
			$(this).parents('.sidepot_whoPaid').find('button').text(this.text);
		});

		$('.removeSidePot').off('click').on('click', function (){ $(this).closest('.sidepotRow').remove() });
	}
})
