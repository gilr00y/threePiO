$(document).ready(function() {
	var socket = io.connect('http://localhost:3000');
  var $commandQueue = $('.command-queue');
  var $commandBtn = $('.command-btn');
  var $commandInput = $('.command-input');
  var $commandHistory = $('.command-history');
  var $nameInput = $('.name-input');

  var commandHistory = [''];
  var commandPointer = 0;

  // helper functions
  function getName() {
    return $nameInput.val() || 'Anonymous';
  }

  function modifyCommandPointer(num) {
    commandPointer = (commandPointer + num) % commandHistory.length;
    // cycle back to end if go past beginning
    if(commandPointer === -1) {
      commandPointer = commandHistory.length - 1;
    }
    $commandInput.val(commandHistory[commandPointer]);
  }

	//print received commands
	socket.on('added_command', function(data) {
    $commandQueue.append('<div>' + data.name + ': ' + data.cmd + '</div>');
	});

	//send commands
  function addCommand() {
		var cmd = $commandInput.val();
    var name = getName();
    if(cmd) {
      // store command history
      commandHistory.push(cmd);
      commandPointer = commandHistory.length;

      // send command to server
      socket.emit('add_command', { name: name, cmd: cmd });
      $commandHistory.append('<div>' + name + ': ' + cmd + '</div>');
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
