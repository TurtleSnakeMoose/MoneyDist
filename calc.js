var wou = wou || {};
wou.calc = wou.calc || {};

// build the result string based on input data
wou.calc.buildTableContent = function (precalculatedEachShare, attndData){
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

function generateTransactions (attendantsInDebt, attendantsOverPaid){

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
