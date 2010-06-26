/*jslint white: false, onevar: true, undef: true, nomen: true, eqeqeq: true, strict: true */
/*global localStorage, $, jQuery, loadStocks, storeStocks, stockConfigTemplate */
"use strict";

// Configuration

var config = {
    // the element used to display one stock.
    template : stockConfigTemplate()
};

// Replicate yahoo object to receive results
var YAHOO = {
    Finance : {
        SymbolSuggest : {}
    }
};

// Save&Load settings

/**
 * Stores all the existing stocks in local storage.
 */
function persist() {
    var stocks = [];
    $('#stocks ul .stock').each(
        function (index, elem) {
            var stock = { 'id' : $(elem).find('.stock_id').text(),
                          'name' : $(elem).find('.stock_name').text() };
            stocks.push(stock);
        }
    );
    storeStocks(stocks);
}

/**
 * Checks if the stock with the given id is already in our list.
 *
 * @param {String} id the id of the searched stock.
 * @return {boolean} true if the stock is already present, false otherwise.
 */
function stockExists(id) {
    var i, stocks = loadStocks();
    for (i = 0; i < stocks.length; i++) {
        if(stocks[i].id === id) {
            return true;
        }
    }
    return false;
}

/**
 * Removes the given element from the list, and persists the change to
 * local storage.
 *
 * @param {jQuery} stockElem the element to remove from the list.
 */
function removeStock(stockElem) {
    stockElem.fadeOut(
        'slow',
        function () {
            stockElem.remove();
            persist();
        }
    );
}

/**
 * Adds a stock to the list. It persists it to localStorage too, if
 * the shouldPersist flag is true.
 *
 * @param {Object} stock the stock to add.
 * @param {boolean} shouldPersist whether the stock should be
 * persisted or not.
 */
function addStock(stock, shouldPersist) {
    var stockElem = config.template.clone();
    stockElem.find('.stock_name').text(stock.name);
    stockElem.find('.stock_id').text(stock.id);

    stockElem.find('.delete').click(
        function (e) {
            removeStock($(this).parent());
            return false;
        });

    $('#stocks ul').append(stockElem);
    stockElem.fadeIn('slow');

    if (shouldPersist) {
        persist();
    }
}

/**
 * Retrieves the stored stocks from local storage and displays them.
 */
function unpersist() {
    var stocks, i;

    stocks = loadStocks();
    for (i = 0; i < stocks.length; i++) {
        addStock(stocks[i], false);
    }
}

// Search tickers via Yahoo

/**
 * Shows the ticker information in the auto-complete box, using a
 * provided callback.
 *
 * @param {function} response the callback for the auto-complete box.
 * @param {Array} data the list of objects returned by Yahoo.
 */
function showResults(response, data) {
    response(
        $.map(data,
              function(item) {
                  return {
                      label: item.name +
                          ' (' + item.symbol + ')'
                          + (item.exchDisp ? ' in ' + item.exchDisp : ''),
                      value: { id : item.symbol, name : item.name }
                  };
              }));
}

/**
 * Initializes a search box that looks for tickers.
 */
function setupLookup() {
    $('#search_field').autocomplete(
        {
            source: function(request, response) {
                $.ajax(
                    {
                        type: "GET",
                        url: "http://d.yimg.com/autoc.finance.yahoo.com/autoc",
                        data : {
                            query : request.term
                        },
                        dataType: "jsonp",
                        jsonpCallback : "YAHOO.Finance.SymbolSuggest.ssCallback"
                    });
                YAHOO.Finance.SymbolSuggest.ssCallback = function(data) {
                    showResults(response, data.ResultSet.Result);
                };
            },
            select: function(event, ui) {
                var stock = ui.item.value;
                if (!stockExists(stock.id)) {
                    addStock(stock, true);
                }
                $('#search_field').val(stock.name);
                return false;
            },
            focus: function(event, ui) {
                var stock = ui.item.value;
                $('#search_field').val(stock.name);
                return false;
            },
            open: function() {
                $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
            },
            close: function() {
                $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
            }
        });
}

jQuery(
    function () {

        $('#search_field').focus(
            function (event) {
                $(this).removeClass('example').val("");
            }
        );

        $('#stocks ul').sortable(
            {
                handle : ".handle",
                update : function(event, ui) {
                    persist();
                }
            })
            .disableSelection();

        // i18n
        document.title = chrome.i18n.getMessage("options_title", [chrome.i18n.getMessage("extension_name")]);
        $('#stocks_header div #start').text(chrome.i18n.getMessage("start"));
        $('#stocks_header div #search_field').val(chrome.i18n.getMessage("example", ["Apple"]));
        $('#usage #help_start').text(chrome.i18n.getMessage("help_start"));
        $('#usage #help_comp').text(chrome.i18n.getMessage("help_comp"));
        $('#usage #help_drag').text(chrome.i18n.getMessage("help_drag"));

        unpersist();
        setupLookup();
    }
);
