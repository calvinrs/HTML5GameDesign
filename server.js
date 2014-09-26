var io = require('socket.io')();

//wait for a connection
io.on('connection', function(socket) {
	//listen for a score update
	socket.on('score', function(msg){
		io.emit('score', msg)
	});
});

io.listen(2000);