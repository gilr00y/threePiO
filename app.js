var app = require('koa')();
var router = require('koa-router');
var serve = require('koa-static');
var handlebars = require("koa-handlebars");
var uuid = require('node-uuid');

// configure middleware
app.use(serve(__dirname + '/public'));
app.use(handlebars({
    defaultLayout: "main"
}));
app.use(router(app));

// this must come after last app.use()
var server = require('http').Server(app.callback());
var io = require('socket.io')(server);

var commands = ['test'];

// routes
app.get('/', function *(next) {
  yield this.render('index', {
    commands: commands
  });
});

// socket.io
io.sockets.on('connection', function(socket) {
  // user submits command
  socket.on('add_command', function(data) {
    var id = uuid.v1();
    commands.push({cmd: data.cmd, uuid: id});
    io.sockets.emit('added_command', {
      uuid: id,
      name: data.name,
      cmd: data.cmd
    });
  });
});

// start server
var port = process.env.PORT || 3000;
server.listen(port);
