$(function () {
	
	var game = new Game($(window).width()-20,$(window).height()-60);
	var socket = game.getSocket();
	
	$("#hostGame").click(function () {
		$("#start").hide();
		$("#hosting").show();
		$("#playing").show();
		$("#game").show();
		
		/*socket.on('joined', function (data) {
			$("#PlayerCount").text(data.playersCount);
			// TODO: ping
		});*/
		
		
		socket.on('playerLeft', function(data){
			$("#PlayerCount").text(data.playersCount);
			// TODO: pong
		});
		
		socket.emit('host', '', function (data) {
			$("#gameID").text(data);
		});
		
		
	});
	
	$("#joinGame").click(function () {
		$("#start").hide();
		$("#joining").show();
		
		$("#inputGameID").select();
	});
	
	$("#joinGameBtn").click(function(){
		socket.emit('join',$("#inputGameID").val().trim(), function (data) {
			// TODO: pong
			$("#joining").hide();
			$("#playing").show();
			$("#game").show();
		});
		

	});
	
});