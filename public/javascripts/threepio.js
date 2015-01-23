$(document).ready(function() {
	var socket = io.connect('http://localhost:3000');
  var $commandQueue = $('.command-queue');
  var $commandBtn = $('.command-btn');
  var $commandInput = $('.command-input');
  var $commandHistory = $('.command-history');
  var $nameInput = $('.name-input');

  var userCommands = [''];
  var commandPointer = 0;

  // helper functions
  function getName() {
    return $nameInput.val() || 'Anonymous';
  }

  function modifyCommandPointer(num) {
    commandPointer = (commandPointer + num) % userCommands.length;
    // cycle back to end if go past beginning
    if(commandPointer === -1) {
      commandPointer = userCommands.length - 1;
    }
    $commandInput.val(userCommands[commandPointer]);
  }

	//print received commands
	socket.on('added_command', function(data) {
    $commandQueue.append('<div id="' + data.uuid +'">' + data.name + ': ' + data.cmd + '</div>');
    $commandHistory.append('<div>' + data.name + ': ' + data.cmd + '</div>');
	});

  // remove completd command from queue
  socket.on('command_completed', function(data) {
    $('#' + data.uuid).remove();
  });

	//send commands
  function addCommand() {
		var cmd = $commandInput.val();
    var name = getName();
    if(cmd) {
      // store command history
      userCommands.push(cmd);
      commandPointer = userCommands.length;

      // send command to server
      socket.emit('add_command', { name: name, cmd: cmd });
      $commandInput.val('');
    }
  }

  // register event handlers
	$commandBtn.click(function(ev) {
    addCommand();
	});

  $commandInput.keyup(function(ev) {
    if(ev.keyCode === 13) { // enter
      addCommand();
    }
    else if(ev.keyCode === 38) { // up arrow
      modifyCommandPointer(-1);
    }
    else if(ev.keyCode === 40) { // down arrow
      modifyCommandPointer(1);
    }
  });

});
