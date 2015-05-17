var GO_IDs = 0;

function Rect(x,y,w,h)
{
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}

/*function Skeleton(x,y,game)
{
	this.id = ++GO_IDs;
	this.name = "Skeleton";
	this.sprite = game.add.sprite(x,y,"Skeleton");
	this.type = "Enemy";
	this.attributes = { "health": 100, "dmg": 20 };
	this.health = 15;
	this.dmg = 15;
}*/

function Player(x,y,game)
{
	this.id = ++GO_IDs;
	this.name = "Player";
	this.sprite = game.add.sprite(x,y,"Skeleton");
	this.type = "Player";
}

function Sender() 
{
	this.changes = [];
	
	this.AddNew = function(obj)
	{
		this.changes.push({type:1, object: obj});
	};
	
	this.AddDelete = function(objID)
	{
		this.changes.push({type:2, objectID: objID});
	};
	
	this.AddChange = function(objID, attr, val)
	{
		this.changes.push({type:3, objectID: objID, attribute: attr, value: val});	
	};
}

function Game(w, h) {
	var self = this;
	var socket = io();
	
	var debug = false;
	
	socket.on('disconnect', function(data){
		var msg = "Connection loss:\\";
		console.error(msg+"\n"+data);
	});
	
	socket.on('error', function (data) {
		console.error(data);
	});
	
	socket.on('errormsg', function (data) {
		console.error(data.msg);
	});
	
	var pingTime;
	var ping;
	socket.on('pong', function () {
		latency = Date.now() - pingTime;
		ping = latency;
	});
	
	function measurePing() {
		setTimeout(function(){
			pingTime = Date.now();
			socket.emit('ping');
			measurePing();
		}, 2000);
	}
	measurePing();

	var game = new Phaser.Game(w, h, Phaser.CANVAS, "game", null, false, false);
//	var game = new Phaser.Game(w, h, Phaser.CANVAS, "game", { preload: preload, create: create, update: update, render: render});
	var skel;
	
	var host = false;
	var currentPlayer = -1;
	var master = false;
	
	/*var arrow =  game.input.keyboard.createCursorKeys();
	//This will stop the arrow keys from scrolling the page
	game.input.keyboard.addKeyCapture(arrow);
	*/
	var LoadingState = {
		preload: function() {
			game.load.image("Skeleton","data/img/skeleton.png");		
			game.load.image("Player","data/img/player.png");		
			game.time.advancedTiming = true;
		},
		create: function () {
			game.state.start("game");
		},
		update: function(){
			
		}
		
	};
	
	var GameState = {
		counter: 0,
		scene: 0,
		sender: 0,
		factory: 0,
		master,
		socketTiming: 0,
		socketDelay: 16,
		init: function(data){
			var self = this;
			
			scene = new Scene();
			sender = new Sender();
			factory = new Factory(game);
			factory.Init();
			
			counter = 0;
			master = false;
					
			for(var i = 0;  i < 10; i++)
			{
				scene.AddObjectXY(factory.CreateObject("Skeleton"),20,10+(i*64));
			}
			
			socket.on('becomeHost', function(data){
				master = true;
				if(currentPlayer == -1) currentPlayer = 0;
				//scene.AddObject(new Player(50,50,game),"Player");
				console.log("Your are host!");
			});
			
			socket.on('clientUpdate', function(data){
				self.updateClient(data);
			});
			
			socket.on('joined', function (data) {
				$("#PlayerCount").text(data.playersCount);
				//scene.AddObject(new Player(50,50,scene,game),"Player");
				//scene.AddObjectXY(factory.CreateObject("Player"),50,50);
				currentPlayer = 0;
			});
			
			socket.on('joinedRoom', function(data){
				currentPlayer = data.playerID;
				console.log("You are player "+currentPlayer);
			//	scene.AddObject(new Player(50,50,game),"Player");
				//scene.AddObjectXY(factory.CreateObject("Player"),50,50);
			});
			
		},	
		create: function(){
			game.stage.backgroundColor = '#000000';
		},
		update: function(){
					
			/*var p = scene.GetObjects("Player")[currentPlayer];
			
			if(p == undefined)
			{
				return;
			}
			
			if(game.input.keyboard.isDown(Phaser.Keyboard.LEFT)){
				p.sprite.x -= 4;
			}
			if(game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)){
				p.sprite.x += 4;
			}*/		

			if(master){
				var enemies = scene.GetObjects("Enemy");
				
				// Add Obj
				if(game.input.keyboard.isDown(Phaser.Keyboard.UP)){
					scene.AddObjectXY(factory.CreateObject("Skeleton"),100,Math.random() * 300+100);
					sender.AddNew(scene.GetLastAdded("Enemy").Copy());
				}
				
				// Delete Obj
				if(game.input.keyboard.isDown(Phaser.Keyboard.X))
				{
					sender.AddDelete(enemies[enemies.length-1].id);
					scene.RemoveObject(enemies[enemies.length-1].id);		
				}
			
				// Update
				for(var i = 0; i < os.length; i++)
				{
					enemies[i].sprite.x = (Math.sin(counter) * 100) + 200;
					sender.AddChange(enemies[i].id, "posX", enemies[i].sprite.x);
					sender.AddChange(enemies[i].id, "posY", enemies[i].sprite.y);
				}
			
				counter += 0.1;	
			}
			this.updateServer();
		},
		render: function(){
			game.debug.text(game.time.fps || '--',2,14, '#00ff00');	
		},
		updateServer: function(){
			this.socketTiming += game.time.elapsed;
			if(this.socketTiming < this.socketDelay)
				return;
			this.socketTiming = 0;
			
			var data = {socketID: socket.id, playerID: currentPlayer};
			
			if(master){			
				data['sender'] = sender;
			}
			
			//data['player'] = scene.GetObjects("Player")[currentPlayer];
			
			socket.emit('gameUpdate', data);
			sender.changes = [];					
		},
		updateClient: function(data){
			
			if(currentPlayer != data.playerID)
			{
				//scene.GetObjects("Player")[data.playerID] = data.player;
			}
			
			if(!master && data.sender/*&& data.objects*/){
				
				for(var i = 0; i < data.sender.changes.length; i++)
				{
					var change = data.sender.changes[i];
					
					// New
					if(change.type == 1)
					{
						if(change.object == undefined)
						{
							console.log("New obj is undefined: "+change.objectID);
							continue;
						}
						
						var newObj = factory.CreateObject(change.object.name);
						for(var attr in change.object)
						{
							if(change.object.hasOwnProperty(attr))
							{
								newObj[attr] = change.object[attr];
							}
						}

						scene.AddObject(newObj, newObj.type);
					}
					// Delete
					else if(change.type == 2)
					{
						scene.RemoveObject(change.objectID);
					}
					// Change
					else if(change.type == 3)
					{
						if(change.attribute == "posX") scene.GetObject(change.objectID).sprite.x = change.value;
						else if(change.attribute == "posY") scene.GetObject(change.objectID).sprite.y = change.value;
					}
				}
				
				/*for(var i = 0; i < data.objects.length; i++)
				{
					scene.GetObjects("Enemy")[i].sprite.x = parseInt(data.objects[i]);
				}*/
			}
		}
	};
	
	game.state.add("preload", LoadingState, true);
	game.state.add("game", GameState, false);
	
	
	/*function preload(){
		game.load.image("Skeleton","data/img/skeleton.png");		
	}
	
	function create() {
		game.stage.backgroundColor = '#000000';
		var scene = new Scene();
		skel = new Skeleton(50,50,scene,game);
	}
	
	function update() {
		if(game.input.keyboard.isDown(Phaser.Keyboard.LEFT)){
			skel.sprite.x -= 4;
		}
		if(game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)){
			skel.sprite.x += 4;
		}
	}
	
	function render() {
		game.debug.spriteInfo(skel.sprite, 20, 32);
	}
	
		*/
	/*var s = new Scene();

	s.objects["Enemy"][0] = new Skeleton(0,0,s);
	s.objects["Enemy"][1] = new Skeleton(0,0,s);
	
	s.GetObject(1).Update();	
	//s.objects["Enemy"][0].position.x = 10;
	
	console.log(s.GetObject(2).position.x);*/
	
	
	this.getSocket = function(){
		return socket;	
	};
	
}

Game.prototype.getSocket = function () {
	return this.socket;
};