var wou = wou || {};
wou.view = wou.view || {};

// returns HTML for "Calculate" & "AddSidePot" buttons
wou.view.appendButtonsDiv = function(){
    return `<div class="buttonsDiv" style="text-align: center;">
                <button class="btn btn-primary btn_addSidePot" disabled >Add side pot</button>
                <button class="btn btn-primary btn_calculate" disabled >Calculate</button>
            </div>`;
}

// returns HTML for "back" & "copy" buttons
wou.view.btnDiv_backAndCopy = function(){
    return `<div style="text-align: center;">
                <button class="btn btn-primary btn_back">Back</button>
                <button class="btn btn-primary btn_copyToClipboard">Copy as text</button>
            </div>`;
}

// return HTML for empty attendant row
wou.view.appendAttendantRow = function(i){
    return `<div class="form-group row attendantRow">
                <label class="col-1">${i+1}. </label>
                <div class="col-5">
                    <input class="form-control attendantName" type="text" placeholder="Attendant#${i+1}" id="attndName${i+1}" data-attendantNum="${i+1}">
                </div>
                <label class="col-2">Paid </label>
                <div class="col-4">
                    <input class="form-control attendantPaid" type="number" placeholder="0" id="attndPayment_${i+1}" data-attendantNum="${i+1}"">
                </div>
            </div> `;
}

// build the basic summary string based on input data
wou.view.buildSummaryContent = function (attndCount, sum, precalculatedEachShare){
    return `<div id="div_summaryInfo">
            <span>Main pot has <strong>${sum}</strong> collected by all <strong>${attndCount} parties</strong>.</span><br>
            <span>Split evenly between everyone: <strong>${precalculatedEachShare.toFixed(1)}</strong>.</span>
        </div>`;
}


// build empty sidepot row
wou.view.getEmptySidePotRow = function (sidePotRowCount, allNames){
    var ddItems = '',
        multiSelect_Items = '';

    // build dropdown for payer selection
    // build multiSelect list for participating attendants
    $.each(allNames, function (i, name){
        ddItems += `<a class="dropdown-item" href="#">${name}</a>`;
        multiSelect_Items += `<option value="${name}">${name}</option>`;
    });

    return `<div class="sidepotRow row" id="sidepot_${sidePotRowCount}">
                <div class="sidepot_whoPaid row" style="display:flex;">
                    <i class="fa fa-trash removeSidePot col-1"></i>
                    <div class="col-5 btn-group dropup">
                        <button type="button" class="btn btn-warning dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> WhoPaid </button>
                        <div class="dropdown-menu">
                            ${ddItems}
                        </div>
                    </div>
                    <label class="col-2">Paid </label>
                    <div class="col-4">
                        <input class="form-control sidepotPaid" type="number" style="margin-top: 9px;" placeholder="0" id="sidepot_${sidePotRowCount}_amountPaid">
                    </div>
                </div>
                <div class="sidepot_forWho row" style="display:flex;">
                    <label class="col-1"> </label>
                    <label class="col-2">For </label>
                    <div class="col-9">
                        <select id="boot-multiselect-demo" class="sidePot_participant_multiselect" multiple="multiple">
                            ${multiSelect_Items}
                        </select>
                    </div>
                </div>
            </div>`;
}

wou.view.generateTableContentForTransactions = function (transactions) {
    tblContent = '';
    $.each(transactions, function(index, t){
        tblContent += `<tr><td>${t.From}</td><td>${t.To}</td><td>${t.Total}</td></tr>`;
    });
    return tblContent;
}

