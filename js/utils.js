/*jslint white: false, onevar: true, undef: true, nomen: true, eqeqeq: true, strict: true */
/*global localStorage, $, jQuery, chrome */
"use strict";

/**
 * Stores the array containing the stock objects to local storage.
 *
 * @param {Array} stocks the array of stock objects.
 */
function storeStocks(stocks) {
    localStorage.stocks = JSON.stringify(stocks);
}

/**
 * Loads the array containing the stock objects from local storage.
 *
 * @return {Array} the array of stock objects.
 */
function loadStocks() {
    var json = localStorage.stocks;

    if (json === undefined) {
        return [];
    }

    return JSON.parse(json);
}

/**
 * Creates a template for a stock config element.
 *
 * @return {jQuery} a stock element.
 */
function stockConfigTemplate() {
    var template, handle, name, id, del;

    handle = $('<span></span>')
        .addClass('handle ui-icon ui-icon-arrowthick-2-n-s');

    name = $('<span></span>')
        .addClass('stock_name');

    id = $('<span></span>')
        .addClass('stock_id');

    del = $('<a></a>')
        .addClass('delete ui-icon ui-icon-closethick');

    template = $('<li></li>')
        .addClass('stock ui-state-default')
        .append(handle)
        .append(name)
        .append(del)
        .append(id)
        .hide();

    return template;
}

/**
 * Creates a template for a stock element.
 *
 * @return {jQuery} a stock element.
 */
function stockTemplate() {
    var template, name, price, chg;

    name = $('<div></div>')
        .addClass('stock_name');

    price = $('<div></div>')
        .addClass('stock_price');

    chg = $('<div></div>')
        .addClass('stock_chg');

    template = $('<li></li>')
        .addClass('stock ui-state-default')
        .append(name)
        .append(price)
        .append(chg)
        .hide();

    return template;
}

/**
 * Swaps the content of the given element with the data contained in
 * the given key.
 *
 * @param {jQuery} elem the element where the swap takes place.
 * @param {String} key the name of the key where the alternate info is stored.
 */
function swap(elem, key) {
    var temp = elem.data(key);
    elem.data(key, elem.text());
    elem.text(temp);
}

/**
 * Toggles a boolean key stored in the given element with the given key.
 *
 * @param {jQuery} elem the element where the boolean is stored.
 * @param {String} key the name of the key. If the key is undefined,
 * it is taken as false.
 * @return {boolean} the value of the key before toggling, false if it
 * was undefined.
 */
function toggleKey(elem, key) {
    var value = elem.data(key) || false;
    elem.data(key, !value);
    return value;
}

/**
 * Gets a boolean key stored in the given element with the given key.
 *
 * @param {jQuery} elem the element where the boolean is stored.
 * @param {String} key the name of the key. If the key is undefined,
 * it is taken as false.
 * @return {boolean} the value of the key, false if it
 * was undefined.
 */
function getBoolKey(elem, key) {
    return elem.data(key) || false;
}

/**
 * Gets the default localized title assigned to the portfolio.
 *
 * @return {String} the default title for the portfolio.
 */
function getDefaultTitle() {
    return  chrome.i18n.getMessage("title");
}

/**
 * Gets the title for the portfolio.
 *
 * @return {String} the stored title for the portfolio, or a default
 * one if no title exists.
 */
function getTitle() {
    return localStorage.title || getDefaultTitle();
}
