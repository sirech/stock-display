/*jslint white: false, onevar: true, undef: true, nomen: true, eqeqeq: true, strict: true */
/*global $, jQuery, chrome, document */
"use strict";

(function() {

     /**
      * @return {boolean} true if there are already stocks saved,
      * false otherwise
      */
     function existingStocks() {
         return loadStocks().length != 0;
     }

     /**
      * Gets the query string of the page, and converts it to a list
      * of stock ids.
      *
      * @return {Array} the list of stocks ids, or an empty list if
      * the query string did not contain the required information
      */
     function parseStockList() {
         var query, matches, raw, stocks;

         query = window.location.search;
         matches = query.match(/^\?stocks=(.*)/);
         stocks = [];

         if (matches && matches.length == 2) {
             raw = matches[1].split(',');
             for(var i = 0; i < raw.length; i++) {
                 if(raw[i] != "") {
                     stocks.push(decodeURI(raw[i]));
                 }
             }
         }
         return stocks;
     }

     // TODO: remove duplication

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

     function presentStocks(stocks) {
         var i, stockElem;

         for (i = 0; i < stocks.length; i++) {
             stockElem = stockTemplate().show();
             stockElem.find('.stock_name').text(stocks[i]);
             $('#stocks ul').append(stockElem);
         }
     }

     function process(response) {
         var stocks, existing;
         stocks = $.map(csvToArray(response),
                        function(stock) {
                            if(stock[0] === "") {
                                return null;
                            }

                            return {
                                'id' : stock[1],
                                'name' : stock[0]
                            };
                        });

         stocks = $.grep(stocks, function(n, i) {
                             return(n);
                         });

         existing = loadStocks();
         stocks = existing.concat(stocks);
         storeStocks(stocks);
         $('#notification').text(chrome.i18n.getMessage("import_finished"));
     }

     function buildRequest(stocks) {
         return "http://download.finance.yahoo.com/d/quotes.csv?s=" +
             stocks.join("+") +
             "&f=" +
             "ns";
     }

     function sendRequest(url) {
         $.get(url, function (data) {
                   process(data);
               });
     }

     /**
      * Retrieves the list of stocks ids from the query string, builds
      * a request to retrieve the stock names and persists the stocks.
      *
      * If one of the steps returns an invalid/empty value, the
      * process is aborted and a message is displayed.
      */
     function importStocks() {
         var stocks;

         stocks = parseStockList();
         presentStocks(stocks);

         $('#notification').addClass('ui-state-highlight').text(chrome.i18n.getMessage("import_before"));
         $('#import').
             button({
                        label: chrome.i18n.getMessage("import"),
                        icons: {
                            primary: "ui-icon-gear"
                        }
                    })
             .click(
                 function() {
                     sendRequest(buildRequest(stocks));
                     $(this).button('option', 'disabled', true);
                     return false;
                 });

         if(stocks.length == 0) {
             $('#notification').addClass('ui-state-error').text(chrome.i18n.getMessage("import_empty"));
             $('#stocks').hide();
             $('#import').button('option', 'disabled', true);
             return;
         }
     }

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

             $('#notification').ajaxError(
                 function() {
                     $(this).addClass('ui-state-error').text(chrome.i18n.getMessage("import_error"));
                 });

             importStocks();
         }
     );
 })();
