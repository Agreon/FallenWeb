function server(io) {
    var debug = true;
    var timeOutDelay = 2500;
    var maxPlayers = 4;
    
    // Todo : Have a look what each does
    var clientPlayers = {}; // clientPlayers[socket.id] = int
    var clients = {}; // clients[socket.id] = room
    var hosts = {}; // hosts[socket.id] = bool
    var games = []; // Array of rooms
    
    
    // When a socket connects with the server
    // 'socket' is a client
    io.on('connection', function(socket) {
        log('Connection!');
        clients[socket.id] = null;
        
        socket.on('error', function(data) {
            log('onError','e');
            log(data,'e');
        });
    
        // If the client sends a host request
        socket.on('host', function(data, ack) {
            var room = makeGameID();
            socket.join(room, function (err) {
                if(!err){
                    clientPlayers[socket.id] = 0;
                    clients[socket.id] = room;
                    hosts[socket.id] = true;
                    ack(room);
                    getSocket(socket.id).emit('becomeHost');
                    log('host '+socket.id+' connected to room: '+room); 
                }
                else{
                    log(err,'e');
                    sendError(1,"host: cant join room",socket);
                }
            });
        });

        // On join request
        socket.on('join', function(data, ack) {
            log('Someone is joining');
            var room = data;
            if(roomExists(room)){
                var conns = socketsInRoom(room).length;
                if(conns < 1){
                    log('Room doesnt exists');
                    sendError(4, "That room doesnt exists". socket);
                }
                else if(conns >= maxPlayers){
                    log('Room is full');
                    sendError(5, "The room is full!", socket);
                }
                else{
                    socket.join(room, function (err) {
                       if(!err){
                            clients[socket.id] = room;
                            var players = socketsInRoom(room);
                            clientPlayers[socket.id] = players.length -1;
                            ack({ playersCount: players.length });
                            getSocket(socket.id).emit('joinedRoom',{playerID: players.length });
                            log("client "+socket.id+" connected to room "+ room + ' (' + players.length + '/'+maxPlayers+')');
                            io.to(room).emit("joined", { playersCount: players.length });
                       }
                       else{
                           log(err, 'e');
                           sendError(3, "client: cant join room", socket);
                       }
                    });
                }
            }
            else{
                sendError(2, "that room doesn't exists", socket);
                log('Room doesnt exist');
            }
        });

        socket.on('startCounting', function(socketID) {
           var room = clients[socketID]; 
           var players = socketsInRoom(room);
           if(players.length == maxPlayers){
               setTimeout(function () {
                   startTimeOut(room);
               }, timeOutDelay);
           }
           else{
               sendError(7, "players are not reachable:\\ ", socket, room);
           }
        });

        // Deletes player references
        socket.on('disconnect', function() {
            var p = clientPlayers[socket.id];
            clientPlayers[socket.id] = null;
            delete clientPlayers[socket.id];
            
            var room = clients[socket.id];
            clients[socket.id] = null;
            delete clients[socket.id];
            
            var players = socketsInRoom(room);
            
            if(room != null && players.length > 0)
            {
                io.to(room).emit('playerLeft', {playerLeft: p, playersCount: players.length });
                if(hosts[socket.id] && players.length > 1){
                    hosts[socket.id] = false;
                    delete hosts[socket.id];
                    
                    var newHostID = players[Math.floor(Math.random()*players.length)];
                    hosts[newHostID] = true;
                    
                    getSocket(newHostID).emit('becomeHost');
                }
                else if(players.length == 1){
                    sendError(8,"all the other players left the game!", socket, room);
                }
            }
            else{
                log('room destroyed');
                if(games[room] != undefined) 
                    delete games[room];
            }
        });

        socket.on('ping', function() {
            socket.emit('ping');
        });
        
        socket.on('gameUpdate', function(data){
                      
           var room = clients[data.socketID];    
           delete data.socketID; 
           
           io.to(room).emit('clientUpdate', data);         
           
        });
        
    });
    
    // Simple log
    function log(msg, type) {
        if (type == undefined) {
            type = 'l';
        }

        if (type == 'e' && debug) console.error(msg);
        else if (type == 'w' && debug) console.warn(msg);
        else console.log(msg);
    }
    
    function in_array(search, array) {
        return array.indexOf(search) >= 0;
    }
    
    // Create a unique Game ID
    function makeGameID() {
        var id;
        do{
            id = (0|Math.random()*9e6).toString(36).substr(0,4);
        }
        while(in_array(id,games));
        return id;
    }
    
    // Checks if a room exists
    function roomExists(room) {
        return io.nsps["/"].adapter.rooms[room] != undefined;
    }
    
    // Returns a socket
    function getSocket(socketID) {
        return io.sockets.connected[socketID];
    }
    
    // Returns a room
    function getRoom(room) {
        return io.nsps["/"].adapter.rooms[room];
    }
    
    // Returns all sockets in a room
    function socketsInRoom(room) {
        if(io == undefined){
            log("io is undefined: \\",'e');
        }
        
        if(io.nsps["/"] == undefined){
            log("/ namespace is undefined:\\",'e');
        }
        
        if (io.nsps["/"].adapter == undefined) {
            log("adapter is undefined :\\",'e');
        }

        if (io.nsps["/"].adapter.rooms == undefined) {
            log("rooms is undefined :\\",'e');
        }
        
        var r = getRoom(room);
        
        if(typeof r === 'object'){
            return Object.keys(r);
        }
        else{
            return [];
        }
    }
    
    
    // Sends a Error to clients in a room
    function sendError(number, msg, socket, room) {
        try{
            if(room != undefined){
                socket = socket.to(room);
            }
            socket.emit('errorMsg', {num: number, msg: msg});
        }
        catch(ex){
            log(ex,'e');
        }
    }
    
    // I dont get this function
    function startTimeOut(room, playerCounter, times) {
        if(playerCounter == undefined) playerCounter = 0;
        if(times == undefined) times = 0;
        
        var players = socketsInRoom(room);
        
        if(times > 3) return;
        else if( playerCounter >= maxPlayers){
            startTimeOut(room, 0, ++times);
        }
        else{
            var sid = players[playerCounter];
            var socket = getSocket(sid);
            
            if(socket != undefined){
                log("ticking... "+times+" "+sid);
                socket.emit('timeOut', {times: times}, function (socketID) {
                    log('ticking back... '+times+" "+socketID);
                    startTimeOut(room, ++playerCounter, times);
                });
            }
            else{
                log('socket not found:\\ '+sid,'e');
            }
        }
        
    }
}

module.exports = server;