# Stocks Display

This extension allows you to get updated quotes for the stocks and
indexes that you choose. Go check it on the [chrome
gallery](https://chrome.google.com/extensions/detail/hoidaconopihnbiobcfdlljlnemdpaka)!

# Description

The code uses [jQuery](http://jquery.com) and
[jQueryUI](http://jqueryui.com) quite heavily. The information is
extracted from [Yahoo Finance](http://finance.yahoo.com), thanks to
their awesome API's.

## Auto-Complete Server

There is a seemingly forgotten
[url from Yahoo](http://d.yimg.com/autoc.finance.yahoo.com/autoc),
which is used by this extension to enable auto completion of stock
symbols in the options page. However, this API is only accessible
through _jsonp_, and the new manifest rules for Chrome Extensions
forbid this method for non https url's (see
https://developer.chrome.com/extensions/contentSecurityPolicy.html#relaxing).

To bypass this restriction, I set up a _Node.js_ server that reroutes
the _jsonp_ requests as normal _JSON_ requests. The code for the
server is in the _auto-complete-server_ folder.

# License

You can do pretty much what you want with the code, which is released
under the MIT license.
