var fs = require('fs'),
    http = require('http')
    staticS = require("node-static");
var file = new(staticS.Server)(__dirname);
http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(9000);