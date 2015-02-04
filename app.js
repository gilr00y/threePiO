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

var commands = [];

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

    // user cancels command
    socket.on('command_canceled', function(data) {
      commands = commands.filter(function(command) {
        return command.uuid != data.uuid;
      });
      commandCompleted(data.uuid);
    });
  });

  socket.on('timeout_change', function(data) {
    console.log("TIMEOUT CHANGE:");
    console.log(data);
  });
});

function commandCompleted(uuid) {
  io.sockets.emit('command_completed', { uuid: uuid });
}

// start server
var port = process.env.PORT || 3000;
server.listen(port);
