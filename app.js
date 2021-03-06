var app = require('koa')();
var router = require('koa-router');
var serve = require('koa-static');
var handlebars = require("koa-handlebars");
var uuid = require('node-uuid');
var net  = require ('net');

var commandDelay = 3000; //ms

// configure middleware
app.use(serve(__dirname + '/public'));
app.use(serve(__dirname + '/bower_components'));
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
  // user requests intitial data
  socket.on('get_initial_data', function(data) {
    socket.emit('initial_data', {
      timeout: commandDelay / 1000,
      commands: commands
    });
  });

  // user submits command
  socket.on('add_command', function(data) {
    var id = uuid.v1();
    commands.push({cmd: data.cmd, uuid: id, name: data.name});
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

  // user changes timeout (command delay)
  socket.on('timeout_change', function(data) {
    var newDelaySeconds = parseFloat(data.timeout);
    commandDelay = newDelaySeconds * 1000 // convert seconds to ms
    io.sockets.emit('timeout_changed', { timeout: newDelaySeconds });
  });
});

function commandCompleted(uuid) {
  io.sockets.emit('command_completed', { uuid: uuid });
}

function executeCommands() {
  if(commands.length > 0) {
    command = commands.shift();
    console.log(command)
    tcp.write(command.cmd + '\n');
    commandCompleted(command.uuid);
  }
  setTimeout(executeCommands, commandDelay);
}

// connect to tcp socket
// returns new net.Socket object
tcp = net.connect(7570);

// start server
var port = process.env.PORT || 3000;
server.listen(port);

// begin command execution
executeCommands();
