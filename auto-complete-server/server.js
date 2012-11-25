var connect = require('connect');

var server = connect().
    use(connect.logger('dev')).
    use(connect.query()).
    use(function(req,res) {
        res.end('Hello: ' + Object.keys(req.query));
    }).
    listen(3023);
