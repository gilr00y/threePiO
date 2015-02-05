$(document).ready(function() {
	var socket = io.connect('http://10.1.2.169:3000');
  var $commandQueue = $('.command-queue');
  var $commandBtn = $('.command-btn');
  var $commandInput = $('.command-input');
  var $commandHistory = $('.command-history');
  var $nameInput = $('.name-input');
  var $timeoutSelect = $('[data-js="select-timeout"]');

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

  function timestamp() {
    var date = new Date();
    return (date.getMonth() + 1) + '/' +
      date.getDate() + '/' +
      date.getFullYear() + ' ' +
      date.getHours() + ':' +
      date.getMinutes() + ':' +
      date.getSeconds();
  }

	//print received commands
	socket.on('added_command', function(data) {
    $commandQueue.append('<div class="queue-item" id="' + data.uuid +'">' +
                         data.name + ': ' + data.cmd +
                         ' <button data-uuid="' + data.uuid +
                         '"class="btn btn-default cancel">Cancel</button></div>');
    $commandHistory.append('<div class="history-item">' +
                           data.name + ': ' + data.cmd +
                           ' (' + timestamp()  + ')</div>');
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

  function publishTimeoutChange(timeoutValue) {
    socket.emit('timeout_change', { timeout: timeoutValue });
  }

  // register event handlers
	$commandBtn.click(function(ev) {
    addCommand();
	});

  $timeoutSelect.change(function(ev) {
    publishTimeoutChange(ev.target.value);
  })

  $commandInput.keyup(function(ev) {
    if(ev.keyCode === 13 && !ev.shiftKey) { // enter
      addCommand();
    }
    else if(ev.keyCode === 38) { // up arrow
      modifyCommandPointer(-1);
    }
    else if(ev.keyCode === 40) { // down arrow
      modifyCommandPointer(1);
    }
  });

  $('.command-queue').on('click', '.cancel', function(ev) {
    var uuid = $(this).data('uuid');
    socket.emit('command_canceled', { uuid: uuid });
  });

});
