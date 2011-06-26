/*jslint white: false, onevar: true, undef: true, nomen: true, eqeqeq: true, strict: true */
/*global $, jQuery, chrome, document, QUERY */
"use strict";

(function() {

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

     /**
      * Display the given list of stocks ids in the page.
      *
      * @param {Array} stocks the stocks to display, as strings
      */
     function presentStocks(stocks) {
         var i, stockElem;

         for (i = 0; i < stocks.length; i++) {
             stockElem = stockTemplate().show();
             stockElem.find('.stock_name').text(stocks[i]);
             $('#stocks ul').append(stockElem);
         }
     }

     /**
      * Reads the stocks from the response and persists them.
      */
     function process(response) {
         var stocks, existing;
         stocks = $.map(QUERY.parseCsv(response),
                        function(stock) {
                            if(stock[0] === "") {
                                return null;
                            }

                            return {
                                'id' : stock[1],
                                'name' : stock[0]
                            };
                        });

         // remove empty values
         stocks = $.grep(stocks, function(n, i) {
                             return(n);
                         });

         existing = loadStocks();
         stocks = existing.concat(stocks);
         storeStocks(stocks);
         $('#notification').text(chrome.i18n.getMessage("import_finished"));
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
                     QUERY.send(QUERY.build(stocks, QUERY.options('name', 'symbol')), process);
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
