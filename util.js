var wou = wou || {};
wou.util = wou.util || {};


// load attendant rows with hardcoded dummy data.
wou.util.loadHardCodedData = function (){
    var hardCodedData = [
        {Name: 'Jinji', Paid:593},
        {Name: 'Mini', Paid:345},
        {Name: 'Igor', Paid:400},
        {Name: 'Bomj', Paid:0},
        {Name: 'Yan', Paid:0},
        {Name: 'Slava', Paid:123},
        {Name: 'Eli', Paid:50},
        {Name: 'Vova', Paid:50},
        {Name: 'Oleg', Paid:23}
        ],
    atndRows = $('.attendantRow');

    $.each(atndRows, function(i, element){
        $(element).find('.attendantName').val(hardCodedData[i].Name);
        $(element).find('.attendantPaid').val(hardCodedData[i].Paid);
    });

    wou.util.validate_inputs();
}

// validate inputs , no duplicate names / no empty inputs - enable/disable buttons respectivly
wou.util.validate_inputs= function () {
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
}


wou.util.validate_sidePotRows= function () {
    var sidepotRows = $('.sidepotRow'),
        buttons = $('.buttonsDiv button'),
        isValid = true;

    $.each(sidepotRows, function(i, row){
        var isPaidDropDownSelected = $(row).find('.dropdown-toggle').hasClass('valid'),
            isParticipantSelected = $(row).find('input[type="checkbox"]:checked').length > 0;
        
        isValid = isPaidDropDownSelected && isParticipantSelected;
    });
    
    // enable\disable buttons
    buttons.attr('disabled' , !isValid);
}


// remove sidepot row - enable\disabled buttons and name inputs if no more sidepots left
wou.util.removeSidePotRow = function (icon) {
    $(icon).closest('.sidepotRow').remove(); 

    var sidepots_count = $('.sidepotRow').length,
        txt_attendantNames = $('.attendantName'),
        btns = $('.buttonsDiv button');

    $(txt_attendantNames).attr('disabled', sidepots_count === 0 ? false : true);
    $(btns).attr('disabled', sidepots_count === 0 ? false : true);

}

wou.util.transactionsAsText = '';

wou.util.buildCopiableTransactionText = function (tranactions) {
    var str_result = '',
        currentPayer = '';
    $.each(tranactions, function (index, t){
        if(t.From !== currentPayer){
            currentPayer = t.From
            str_result += '--------------------------------- \r\n';
            str_result += `*${currentPayer}*: \r\n`;
        }
        str_result += `\t${t.Total}  -->  *${t.To}*  \r\n`;
    });
    str_result += '---------------------------------';

    wou.util.transactionsAsText = window.encodeURIComponent(str_result);
    return str_result;
};