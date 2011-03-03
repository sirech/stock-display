/*jslint white: false, onevar: true, undef: true, nomen: true, eqeqeq: true, strict: true */
/*global $, jQuery, load, store, loadStocks, stockTemplate, getTitle,
 swap, toggleKey, getBoolKey, window, chrome, Image, Math */
"use strict";

(function() {

     // Configuration

     var app = {

         // object with user-friendly names for the modifiers.
         modifiers : {
             name : 'n',
             symbol : 's',
             last_price : 'l1',
             last_time : 't1',
             percent_change : 'p2',
             change : 'c1'
         },

         // object that maps fields in a stock object to positions in the data
         // array returned by yahoo. Set up by buildModifiers.
         format : {},

         // the stocks that have to be displayed. Stored here to avoid
         // possible updates during runtime.
         stocks : loadStocks(),

         // the element used to display one stock.
         template : stockTemplate(),

         // stores the time argument for the chart API.
         chartArguments : {
             today : 'b',
             lastWeek : 'w',
             threeMonths : '3m',
             sixMonths : '6m',
             lastYear : '1y',
             twoYears : '2y',
             fiveYears : '5y',
             max : 'my'
         }
     };

     // Get the data from Yahoo

     /**
      * Builds a string with the modifiers that specify what to get for
      * every stock. Also sets up the format variable.
      *
      * @return {String} the modifiers as a string.
      */
     function buildModifiers() {
         app.format = {
             last_time : 0,
             name : 1,
             last_price : 2,
             percent_change : 3,
             change : 4,
             symbol : 5
         };

         return app.modifiers.last_time +
             app.modifiers.name +
             app.modifiers.last_price +
             app.modifiers.percent_change +
             app.modifiers.change +
             app.modifiers.symbol;
     }

     /**
      * Builds an url to request quotes from Yahoo Finance.
      *
      * @param {Array} stocks the list of stocks.
      * @return {String} the url as a string.
      */
     function buildRequest(stocks) {
         var idArray, i;

         idArray = [];
         for(i = 0; i < stocks.length; i++) {
             idArray.push(stocks[i].id);
         }

         return "http://download.finance.yahoo.com/d/quotes.csv?s=" +
             idArray.join("+") +
             "&f=" +
             buildModifiers();
     }

     /**
      * Executes the request, setting a callback that presents the results.
      * @param {String} the url of the request.
      */
     function sendRequest(url) {
         $.get(url, function (data) {
                   present(data);
               });
     }

     /**
      * Gets the last quote for every stock/index in the given list, and
      * presents the information in the popup.
      *
      * @param {Array} stocks the list of stocks.
      */
     function refresh(stocks) {

         if(app.stocks.length === 0) {
             return;
         }

         sendRequest(buildRequest(stocks));
     }

     // Charts

     /**
      * Builds a request to get a chart from Yahoo.
      *
      * @param {String} id the id of the stock for which the chart is desired.
      * @param {String} time the time interval for the chart
      * @return {String} the url request.
      */
     function buildChartRequest(id, time) {
         var extra, url = "http://ichart.finance.yahoo.com/";
         if(time === app.chartArguments.today || time === app.chartArguments.lastWeek) {
             url += time + '?s=';
             extra = '&';
         } else {
             url += 'c/' + time + '/';
             extra = '?';
         }
         return url + id + extra + Math.floor(Math.random() * 1000000);
     }

     /**
      * Shows a chart for the given ticker.
      *
      * @param {String} id The id of the stock that is to be displayed.
      * @param {boolean} dontSlide whether the chart should have an effect
      * when presented or not.
      */
     function showChart(id, dontSlide) {
         var time, img;

         time = app.chartArguments[load('time')] || app.chartArguments.today;

         $('#chart').data('id', id);
         $('#chart ul')
             .find('#' + load('time'))
             .addClass('ui-state-active').siblings().removeClass('ui-state-active');

         img = new Image();
         img.src = buildChartRequest(id, time);
         img.onload = function () {
             $('#chart img').remove();
             if(dontSlide) {
                 $('#chart').append(img);
             } else {
                 $('#chart').append(img).effect('slide');
             }
         };
     }

     // Graphical part

     /**
      * Prepares a single stock to be displayed, using an existing template.
      *
      * @param {Stock} stock the object with the relevant information.
      * @return {jQuery} the graphical element, ready to be displayed.
      */
     function prepareStock(stock) {
         var stockElem = app.template.clone()
             .data('id', stock.id)
             .show();
         stockElem.find('.stock_name').text(stock.name);

         stockElem.click(
             function (e) {
                 $(this).addClass('selected').siblings().removeClass('selected');
                 showChart($(this).data('id'));
                 return false;
             }).mouseenter(
                 function (e) {
                     $(this).addClass('highlighted').siblings().removeClass('highlighted');
                     return false;
                 }
             );

         stockElem.find('.stock_chg').click(
             function (e) {
                 togglePrice();
                 return false;
             }
         );

         return stockElem;
     }

     /**
      * Prepares the graphical list of stocks, using the stocks saved in the app.
      * @return {boolean} true if there were stocks to show, false if the
      * list of saved stocks is empty.
      */
     function prepareList() {
         var i, stockElem;

         if(app.stocks.length === 0) {
             showEmptyMsg();
             return false;
         }

         for (i = 0; i < app.stocks.length; i++) {
             stockElem = prepareStock(app.stocks[i]);
             $('#stocks ul').append(stockElem);
         }
         return true;
     }

     /**
      * Processes the information transmitted from Yahoo and presents it in
      * the popup.
      * @param {String} the response as a csv string.
      */
     function present(response) {
         var dataArray, i, display_price_chg, main_price, alt_price, price_class;

         dataArray = csvToArray(response);
         i = 0;

         // depending on the current mode, we want to display the abs
         // change or the percent.
         display_price_chg = getBoolKey($('#stocks'), 'price_chg');
         main_price = display_price_chg ? app.format.change : app.format.percent_change;
         alt_price =  display_price_chg ? app.format.percent_change : app.format.change;

         $('#stocks ul .stock').each(
             function (index, elem) {
                 var row = dataArray[i];
                 if(row[app.format.symbol] === $(elem).data('id')) {

                     price_class = row[main_price].charAt(0) === '+' ? 'up'
                         : row[main_price].charAt(0) === '-' ? 'down' : 'neutral';

                     $(elem).find('.stock_price').text(row[app.format.last_price]);
                     $(elem).find('.stock_chg')
                         .removeClass('up down neutral')
                         .addClass(price_class)
                         .data('alt', row[alt_price])
                         .text(row[main_price]);

                     i++;
                 } else {
                     $(elem).find('.stock_price').text('-');
                     $(elem).find('.stock_chg')
                         .removeClass('up down neutral')
                         .addClass('neutral')
                         .data('alt', '-')
                         .text('-');
                 }
             }
         );

         if($('#chart img').length != 0) {
             showChart($('#chart').data('id'), true);
         }
     }

     /**
      * Shows a message if there are no stocks in the list.
      */
     function showEmptyMsg() {
         $('#empty').show().
             find('a').click(
                 function () {
                     window.open(chrome.extension.getURL('options.html'));
                     window.close();
                     return false;
                 }
             );
         $('#title').hide();
         $('#disclaimer').hide();
         $('#last_update').hide();
     }

     /**
      * Toggles the price between percent and absolute for every stock.
      */
     function togglePrice() {
         toggleKey($('#stocks'), 'price_chg');
         $('#stocks ul .stock .stock_chg').each(
             function (index, elem) {
                 swap($(elem), 'alt');
             }
         );
     }

     // Extra functions


     // Credit to http://www.webdeveloper.com/forum/showthread.php?t=123460

     /**
      * Converts a time returned from Yahoo in string format to a date object.
      * The input has the format hh:mm(am|pm) (Eastern Time). The day is
      * not relevant.
      *
      * This function does not deal with DST.
      *
      * @param {String} strDate the time.
      * @return {Date} a date object.
      */
     function yahooTimeToDate(strDate) {
         var mark, time, now, timeZoneDiff, utcMs;

         mark = strDate.slice(-2).toLowerCase();
         time = strDate.slice(0, -2).split(':');

         // Credit to http://stackoverflow.com/questions/440061/convert-12-hour-date-time-to-24-hour-date-time
         function to24(hour12, isPm) {
             return isPm ? (hour12 % 12) + 12 : hour12 % 12;
         }

         now = new Date();
         now.setHours(to24(parseInt(time[0], 10), mark === 'pm'));
         now.setMinutes(parseInt(time[1], 10));
         now.setSeconds(0);

         timeZoneDiff = 240 - now.getTimezoneOffset();
         utcMs = now.getTime() + timeZoneDiff * 60 * 1000; // EST is GMT-4
         return new Date(utcMs);
     }

     // Credit to http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data

     /**
      * Parses a csv formated string into an array of arrays.
      *
      * @param {String} strData the csv text.
      * @param {String} strDelimiter The delimiter. If no value is
      * provided, comma is used.
      */
     function csvToArray( strData, strDelimiter ){
         var objPattern, arrData, arrMatches, strMatchedDelimiter, strMatchedValue;

         // Check to see if the delimiter is defined. If not,
         // then default to comma.
         strDelimiter = (strDelimiter || ",");

         // Create a regular expression to parse the CSV values.
         objPattern = new RegExp(
             (
                 // Delimiters.
                 "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                 // Quoted fields.
                 "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                 // Standard fields.
                 "([^\"\\" + strDelimiter + "\\r\\n]*))"
             ),
             "gi"
         );

         // Create an array to hold our data. Give the array
         // a default empty first row.
         arrData = [[]];

         // Create an array to hold our individual pattern
         // matching groups.
         arrMatches = null;

         // Keep looping over the regular expression matches
         // until we can no longer find a match.
         while ((arrMatches = objPattern.exec( strData ))){

             // Get the delimiter that was found.
             strMatchedDelimiter = arrMatches[ 1 ];

             // Check to see if the given delimiter has a length
             // (is not the start of string) and if it matches
             // field delimiter. If id does not, then we know
             // that this delimiter is a row delimiter.
             if (
                 strMatchedDelimiter.length &&
                     (strMatchedDelimiter !== strDelimiter)
             ){

                 // Since we have reached a new row of data,
                 // add an empty row to our data array.
                 arrData.push( [] );

             }

             // Now that we have our delimiter out of the way,
             // let's check to see which kind of value we
             // captured (quoted or unquoted).
             if (arrMatches[ 2 ]){

                 // We found a quoted value. When we capture
                 // this value, unescape any double quotes.
                 strMatchedValue = arrMatches[ 2 ].replace(
                     new RegExp( "\"\"", "g" ),
                     "\""
                 );

             } else {
                 // We found a non-quoted value.
                 strMatchedValue = arrMatches[ 3 ];
             }

             // Now that we have our value string, let's add
             // it to the data array.
             arrData[ arrData.length - 1 ].push( strMatchedValue );
         }

         // Return the parsed data.
         return( arrData );
     }

     // Start

     jQuery(
         function() {
             $('#status').ajaxStart(
                 function() {
                     $(this).show();
                 });

             $('#status').ajaxError(
                 function() {
                     $(this).hide();
                 });

             $('#status').ajaxStop(
                 function() {
                     $(this).fadeOut(2000);
                 });

             // i18n
             $('#title')
                 .click(
                     function () {
                         window.open(chrome.extension.getURL('standalone.html'));
                         window.close();
                         return false;
                     })
                 .mouseenter(
                     function () {
                         $(this).addClass('title_highlight');
                         return false;
                     })
                 .mouseleave(
                     function () {
                         $(this).removeClass('title_highlight');
                         return false;
                     })
                 .attr('title', chrome.i18n.getMessage("help_standalone"))
                 .text(getTitle());
             $('#disclaimer').text(chrome.i18n.getMessage("disclaimer"));
             $('#empty a').text(chrome.i18n.getMessage("empty_add"));

             // time charts
             $('#time_options li')
                 .addClass('ui-state-default')
                 .click(
                     function() {
                         store('time', $(this).attr('id'));
                         showChart($('#chart').data('id'));
                         return false;
                     });

             if(prepareList()) {

                 refresh(app.stocks);

                 // Yahoo Updates prices every minute
                 window.setInterval(
                     function() {
                         refresh(app.stocks);
                     }, 45 * 1000);

             }
         }
     );

})();
