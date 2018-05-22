/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
 
function fmt(d)
{
    if (d % 1.0 == 0)
        return d.toString();
    else
        return d.toFixed(4);
}

function calc_feed(conc_EUP, conc_Feed, conc_Tails){
    return ((conc_EUP - conc_Tails) / (conc_Feed - conc_Tails));
}

function calc_swu(conc_EUP, conc_Feed, conc_Tails){
    var a = (2 * conc_EUP / 100 - 1) * Math.log(conc_EUP / (100 - conc_EUP));
    var b = (2 * conc_Tails / 100 - 1) * Math.log(conc_Tails / (100 - conc_Tails));
    var c = (2 * conc_Feed / 100 - 1) * Math.log(conc_Feed / (100 - conc_Feed));

    return ((a - b) - calc_feed(conc_EUP, conc_Feed, conc_Tails) * (c - b));
}

function calc_tail(SWU_Feed_Price_Ratio){
    var tail, precision, price, tail_min, tail_max, price_min, price_max;
    tail_min = 0.001;
    tail_max = 0.007;

    price_min = calc_swu(0.045, 0.00711, tail_min) * SWU_Feed_Price_Ratio + calc_feed(0.045, 0.00711, tail_min);
    price_max = calc_swu(0.045, 0.00711, tail_max) * SWU_Feed_Price_Ratio + calc_feed(0.045, 0.00711, tail_max);

    precision = 0.0000001;
    
    do {
        if (price_min > price_max){
            tail = tail_max;
            tail_max = tail_min;
            tail_min = tail;
            price = price_max;
            price_max = price_min;
            price_min = price;
        }
        tail = (tail_min + tail_max) / 2;
        price = calc_swu(0.045, 0.00711, tail) * SWU_Feed_Price_Ratio + calc_feed(0.045, 0.00711, tail);
        if (price < price_max){
            price_max = price;
            tail_max = tail;
        }
    } while (Math.abs(tail_max - tail_min) > precision);

    return (tail_min + tail_max) * 100 / 2;
}

function getEUPfromRaw(){
    return raw/calc_feed(eup_conc, feed, tail);
}

function getFeedNeed(){
    return eup*calc_feed(eup_conc, feed, tail);
}

function getEUPCost(u3o8){
    return (u3o8*conv_cost + u3o8*feed_cost + swu*swu_cost)/eup;
}

function getOptTailConc(){
    if (swu_cost <= 0 || (feed_cost + conv_cost) <= 0) return 0;
    return (calc_tail(swu_cost/(feed_cost + conv_cost)));
}

function setVariables() {
    swuField      = $('#swu_input');
    eupField      = $('#eup_input');
    rawField      = $('#raw_input');
                 
    tailField     = $('#tail_input');
    feedField     = $('#feed_input');
    eupConcField  = $('#eup_conc_input');
            
    swuCostField  = $('#swu_cost_input');
    feedCostField = $('#feed_cost_input');
    convCostField = $('#conv_cost_input');
    
    eupCostField     = $('#eup_cost_output');
    optTailConcField = $('#opt_tail_conc_output');
    u235Field = $('#u235_output');
    
    var elems = $('input').parent().removeClass('has-error');
    
    swu       = parseFloat(swuField.val().replace(',', '.') || 0); 
    eup       = parseFloat(eupField.val().replace(',', '.') || 0); 
    raw       = parseFloat(rawField.val().replace(',', '.') || 0);
              
    tail      = parseFloat(tailField.val().replace(',', '.') || 0.3);
    feed      = parseFloat(feedField.val().replace(',', '.') || 0.711);
    eup_conc  = parseFloat(eupConcField.val().replace(',', '.') || 4.4);
              
    swu_cost  = parseFloat(swuCostField.val().replace(',', '.') || 0);
    feed_cost = parseFloat(feedCostField.val().replace(',', '.') || feed_spot_price);
    conv_cost = parseFloat(convCostField.val().replace(',', '.') || 0);
    
    if (swu == NaN || swu < 0) swuField.parent().addClass("has-error");
    if (eup == NaN || eup < 0) eupField.parent().addClass("has-error");
    if (raw == NaN || raw < 0) rawField.parent().addClass("has-error");
    
    if (tail == NaN || tail <= 0) tailField.parent().addClass("has-error");
    if (feed == NaN || feed <= 0) feedField.parent().addClass("has-error");
    if (eup_conc == NaN || eup_conc <= 0) eupConcField.parent().addClass("has-error");
    
    if (swu_cost == NaN || swu_cost < 0) swuCostField.parent().addClass("has-error");
    if (feed_cost == NaN || feed_cost < 0) feedCostField.parent().addClass("has-error");
    if (conv_cost == NaN || conv_cost < 0) convCostField.parent().addClass("has-error");
    
    if (tail >= feed){
        tailField.parent().addClass("has-error");
        feedField.parent().addClass("has-error");
        //essayText.setError("Should be smaller than feed.");
    }
    if (eup_conc < feed || eup_conc < tail){
        eupConcField.parent().addClass("has-error");
        //prodText.setError("Should be larger than feed and essay.");
    }
    return $('.has-error').length;
}
 
var swuField, eupField, rawField, 
    tailField, feedField, eupConcField, 
    swuCostField, feedCostField, convCostField,
    eupCostField, optTailConcField, u235Field;

var swu, eup, raw, 
    tail, feed, eup_conc, 
    swu_cost, feed_cost, conv_cost,
    feed_spot_price;

var app = {
    // Application Constructor
    initialize: function() {
        app.bindEvents();
        app.getPrice();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {      
        $('#swu_button').click(this.calculateFromSWU);
        $('#eup_button').click(this.calculateFromEUP);
        $('#raw_button').click(this.calculateFromRaw);
        
        $('#opt_tail_conc_button').click(this.setOptTail);
    },
    getPrice: function(){
        var url = "https://www.quandl.com/api/v3/datasets/ODA/PURAN_USD/data.json?limit=1";
        $.ajax({
          type: 'GET',
          url: url,
          dataType: 'json',
          crossDomain: true,
          success: function(data) {
            feed_spot_price = parseInt(data.dataset_data.data[0][1])*2.61285;
            $('#feed_cost_input').attr('placeholder', feed_spot_price);
          }
        });
    },
    calculateFromSWU: function(){
        if (setVariables() != 0){
            eupField.val('');
            u235Field.val('');
            return;
        };
        eup  = swu / calc_swu(eup_conc, feed, tail);
        u235 = eup * eup_conc / 100;
        eupField.val(fmt(eup));
        u235Field.val(fmt(u235));
        
        rawField.val(fmt(feed_need = getFeedNeed()));
        eupCostField.val(fmt(getEUPCost(feed_need) || 0));
        optTailConcField.val(fmt(getOptTailConc()));
    },  
    calculateFromEUP: function(){
        if (setVariables() != 0){
            swuField.val("");
            rawField.val('');
            return;
        };
        swu = eup * calc_swu(eup_conc, feed, tail);
        u235 = eup * eup_conc / 100;
        swuField.val(fmt(swu));
        u235Field.val(fmt(u235));
        
        rawField.val(fmt(feed_need = getFeedNeed()));
        eupCostField.val(fmt(getEUPCost(feed_need)));
        optTailConcField.val(fmt(getOptTailConc()));
    },
    calculateFromU235: function(){// Not working now
        if (setVariables() != 0){
            swuField.val('');
            eupField.val('');
            return;
        };
        swu = (raw*100/ eup_conc) * calc_swu(eup_conc, feed, tail);
        eup = (raw*100/eup_conc);
        swuField.val(fmt(swu));
        eupField.val(fmt(eup));
        
        rawField.val(fmt(feed_need = getFeedNeed()));
        eupCostField.val(fmt(getEUPCost(feed_need)));
        optTailConcField.val(fmt(getOptTailConc()));
    },
    calculateFromRaw: function(){
        if (setVariables() != 0){
            swuField.val('');
            eupField.val('');
            return;
        };
        eup = getEUPfromRaw();
        swu = eup * calc_swu(eup_conc, feed, tail);
        u235 = eup * eup_conc / 100;
        eupField.val(fmt(eup));
        swuField.val(fmt(swu));
        u235Field.val(fmt(u235));
        
        eupCostField.val(fmt(getEUPCost(raw)));
        optTailConcField.val(fmt(getOptTailConc()));
    },
    setOptTail: function(){
        $('#tail_input').val($('#opt_tail_conc_output').val());
        app.calculateFromEUP();
    }
};
