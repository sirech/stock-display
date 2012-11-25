var connect = require('connect'),
    http    = require('http');

var callback = "YAHOO.Finance.SymbolSuggest.ssCallback";

var askYahoo = function(q, res) {
    var query = "callback=" + callback + "&query=" + q;
    var headers = {
        host: "d.yimg.com",
        path: "/autoc.finance.yahoo.com/autoc" + "?" + query,
        method: "GET",
        headers: {
            "Accept": "*/*",
            "Content-Type": "application/json-rpc; charset=utf-8"
        }
    };

    http.request(
        headers
        , function(yahoo) {
            var str = '';
            yahoo.on('data', function (chunk) {
                str += chunk;
            });
            yahoo.on('end', function () {
                str = str.replace(callback + "(", "");
                str = str.slice(0, str.length - 1);
                var obj = JSON.parse(str);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(obj.ResultSet.Result));
            });
        }).end();
};

var server = connect().
    use(connect.logger('dev')).
    use(connect.query()).
    use(function(req,res) {
        var q = req.query.q;
        askYahoo(q, res);
    }).
    listen(3023);