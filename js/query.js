/*jslint white: false, onevar: true, undef: true, nomen: true, eqeqeq: true, strict: true */
/*global $, jQuery, chrome, document */
"use strict";

QUERY = function() {

    /**
     * Object with user-friendly names for the modifiers.
     */
    var modifiers = {
        name : 'n',
        symbol : 's',
        last_price : 'l1',
        last_time : 't1',
        percent_change : 'p2',
        change : 'c1'
    };

    // Credit to http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data
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

    return {
        /**
         * Builds the modifiers string from the given arguments. The
         * method accept any number of arguments. Each of them is used as
         * a key in the modifiers object to find the corresponding option.
         *
         * @return {String} the modifiers as a string
         */
        options : function() {
            return $.map(arguments, function(option) {
                             return modifiers[option];
                         })
                .join('');
        },

        /**
         * Parses a csv formated string into an array of arrays.
         *
         * @param {String} strData the csv text.
         * @param {String} strDelimiter The delimiter. If no value is
         * provided, comma is used.
         */
        parseCsv : csvToArray,

        /**
         * Builds a query string with the given stocks and modifiers.
         *
         * @param {Array} stocks the list of stocks. It can be given
         * as a list of string ids, or as a list of objects with an id attribute
         * @param {String} options the modifiers to use, as returned
         * by options
         * @return {String} the url to use for the query
         */
        build : function(stocks, options) {
            var idArray;

            idArray = $.map(stocks,
                            function(stock) {
                                if (typeof(stock) == 'string') {
                                    return stock;
                                } else if (typeof(stock) == 'object' && stock.hasOwnProperty('id')) {
                                    return stock.id;
                                } else {
                                    throw {
                                        name: 'TypeError',
                                        message: 'Object cannot be interpreted as a stock'
                                    };
                                }
                            });

            return "http://download.finance.yahoo.com/d/quotes.csv?s=" +
                idArray.join("+") +
                "&f=" +
                options;
        },

        /**
         * Executes the request asynchronously, using a callback when the request returns.
         * @param {String} url the url of the request, as returned by build
         * @param {Function} callback the callback to use when the
         * request returns
         */
        send : function(url, callback) {
            $.get(url, callback);
        }
    };

}();
