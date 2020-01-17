var wou = wou || {};
wou.util = wou.util || {};


// load attendant rows with hardcoded dummy data.
wou.util.loadHardCodedData = function (){
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
}