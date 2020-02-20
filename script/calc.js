var wou = wou || {};
wou.calc = wou.calc || {};

// build the result string based on input data
wou.calc.buildTableContent = function (precalculatedEachShare, attndData){

    var attendantsInDebt = [],
        attendantsOverPaid = [],
        generalTransactions = [],
        sidepotTransactions = [],
        allTransactions = [],
        finalTransactions = [],
        transactionSection = '',
        transactionTextToCopy = '',
        isSidePotExists = $('.sidepotRow').length > 0;

    //  arrange main pot attendants into 2 groups, those who overpaid and those underpaid.
    $.each(attndData, function(index ,atnd) {
        var atndBalance = precalculatedEachShare - atnd.Paid;
        if(atndBalance >= 0){
            attendantsInDebt.push({Name: atnd.Name, DebtBalance: atndBalance });
        }
        else {
            attendantsOverPaid.push({Name: atnd.Name, OverPaidBalance: Math.abs(atndBalance)});
        }
    });

    // generate mainpot transactions from undepaid attendants to overpaid attendants.
    generalTransactions = generateTransactions(attendantsInDebt, attendantsOverPaid);

    // if sidepot transactions are present, get all transactions.
    if(isSidePotExists){
        sidepotTransactions = getSidePotTransactions();
    }

    // merge mainpot transactions with all sidepot transactions.
    allTransactions = $.merge(generalTransactions, sidepotTransactions);

    // join and recalculate transactions between same attendants. e.g.:
    // jeff to walter 20 bucks | jeff to walter 40 bucks => jeff to walter 60 bucks, or
    // jeff to walter 30 bucks | walter to jeff 5 bucks => jeff to walter 25 bucks.
    finalTransactions = mergeIntersectingTransactions(allTransactions);

    // sort transactions by Name
    finalTransactions = finalTransactions.sort((a, b) => (a.From > b.From) ? 1 : -1);

    // generate table content and copiable transaction text for final transaction list. 
    transactionSection = wou.view.generateTableContentForTransactions(finalTransactions);
    transactionTextToCopy = wou.util.buildCopiableTransactionText(finalTransactions);

    $('#copiableTransaction').val(transactionTextToCopy);
    return transactionSection;
}

function generateTransactions (attendantsInDebt, attendantsOverPaid){
    attendantsInDebt.sort(function(a,b) { return a.DebtBalance - b.DebtBalance; }); //sort inDebt ascending
    attendantsOverPaid.sort(function(a,b) { return b.OverPaidBalance - a.OverPaidBalance; }); //sort overPaid descending
    var transactions = [];

    $(attendantsOverPaid).each(function (opIndex, opAtnd){
        $(attendantsInDebt).each(function (dIndex, debtAtnd){
            if(debtAtnd.DebtBalance == 0 || opAtnd.OverPaidBalance == 0){
                return;
            }

            var curOpAtndBalance = opAtnd.OverPaidBalance;
            var curDebtAtndBalance = debtAtnd.DebtBalance;

            if(curOpAtndBalance - curDebtAtndBalance < 0 ){
                transactions.push({From: debtAtnd.Name, To: opAtnd.Name, Total: Math.round(curOpAtndBalance), Skip: false});
                debtAtnd.DebtBalance -= curOpAtndBalance;
                opAtnd.OverPaidBalance = 0;
            }
            else {
                transactions.push({From: debtAtnd.Name, To: opAtnd.Name, Total: Math.round(curDebtAtndBalance), Skip: false});
                opAtnd.OverPaidBalance -= debtAtnd.DebtBalance;
                debtAtnd.DebtBalance = 0;
            }
        });
    });
    return transactions;
}

function getSidePotTransactions(){

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

            sidePotTransactions.push({From:attendant.trim(), To:sp_payer.trim(), Total:amountPerPerson, Skip: false});
        });
    });

    return sidePotTransactions;
}

function mergeIntersectingTransactions (allTransactions){
    var intersection = [],
        allIntersectionGroups = [];

    $.each(allTransactions, function(index_a, t_a){
        if(t_a.Skip){
            return;
        }
        t_a.Skip = true;
        intersection.push(t_a);

        $.each(allTransactions.filter(x => x.Skip === false) , function(index_b, t_b){
            if((t_a.From === t_b.From || t_a.From === t_b.To ) && (t_a.To === t_b.From || t_a.To === t_b.To )){
                t_b.Skip = true;
                intersection.push(t_b);
            }
        });
 
        allIntersectionGroups.push(intersection);
        intersection = [];
    });

    var finalTransactions = calculateIntersections(allIntersectionGroups)
    return finalTransactions;
}

 

function calculateIntersections(allIntersectionGroups) {
    var finalTransactionList = [];

    $.each(allIntersectionGroups, function(index, intersectionGroup){
        if (intersectionGroup.length > 1){
            var merged = {},
                side_a = { Name: intersectionGroup[0].From, Amount: 0},
                side_b = { Name: intersectionGroup[0].To, Amount: 0};

            $.map(intersectionGroup, x => {
                x.From == side_a.Name ? side_a.Amount += x.Total : side_b.Amount += x.Total;
            })

            if(side_a.Amount >= side_b.Amount){
                merged = {From: side_a.Name ,To: side_b.Name , Total: side_a.Amount - side_b.Amount};
            } else {
                merged = {From: side_b.Name ,To: side_a.Name , Total: side_b.Amount - side_a.Amount};
            }

            finalTransactionList.push(merged);
        } 
        else {
            finalTransactionList.push(intersectionGroup[0]);
        }
    });
    return finalTransactionList;
}


 

