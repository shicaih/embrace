const http = require('http');

const hostname = 'embrace.etc.cmu.edu/home/embrace-user/server/embrace/server';
const port = 6000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hola Mundo');
});

server.listen(port, hostname, () => {
    console.log(`El servidor se está ejecutando en http://${hostname}:${port}/`);
});