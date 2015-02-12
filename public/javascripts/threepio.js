$(document).ready(function() {
	var socket = io.connect('http://localhost:3000');
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

  function appendQueueItem(command) {
    $commandQueue.append('<div class="queue-item" id="' + command.uuid +'">' +
                         command.name + ': ' + command.cmd +
                         ' <button data-uuid="' + command.uuid +
                         '"class="btn btn-default cancel">Cancel</button></div>');
  }

  function appendHistoryItem(command) {
    $commandHistory.append('<div class="history-item">' +
                           command.name + ': ' + command.cmd +
                           ' (' + timestamp()  + ')</div>');
  }

  // request initial data
  socket.on('connect', function() {
    socket.emit('get_initial_data');
  });

	//print received commands
	socket.on('added_command', function(data) {
    appendQueueItem(data);
    appendHistoryItem(data);
	});

  // remove completd command from queue
  socket.on('command_completed', function(data) {
    $('#' + data.uuid).remove();
  });

  socket.on('timeout_changed', function(data) {
    $timeoutSelect.val(data.timeout);
  });

  socket.on('initial_data', function(data) {
    // show existing commands in the queue
    var commands = data.commands;
    commands.forEach(function(command) {
      appendQueueItem(command);
    });

    // set existing timeout
    $timeoutSelect.val(data.timeout);
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
      socket.emit('add_command', { name: name, cmd: cmd, user: $nameInput.val() });
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
