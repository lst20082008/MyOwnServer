var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);

//服务器全局变量
//拥有角色的玩家
var clients = [];
var spawnPoint = [];

app.get('/', function (req, res) {
    res.send('hey you get back get "/"');
});

io.on('connection', function (socket) {

	var currentPlayer = {};
	currentPlayer.name = 'unknown';
	console.log('一名玩家连接至服务器');

	socket.on('log in',function(data)
		{
			console.log('用户请求登陆：',data.name);
			var response = 	{state:'ok',name:''};
			clients.forEach(function(player){
				if (player.name !== data.name) {
				}else{
					response.state = 'error';
				}
			});
			currentPlayer.name = data.name;
			socket.emit('log in',response);
			console.log("请求登陆结果：",response);			
		});


	socket.on('player connect',function()
		{
		console.log('收到玩家连接',currentPlayer.name);
		for(var i = 0; i<clients.length;i++)
		{
			var playerConnected = {
				name:clients[i].name,
				position:clients[i].position,
				rotation:clients[i].rotation,
				health:clients[i].health
			};
			// in your current game , we need to tell you about the other players.
			socket.emit('other player connected',playerConnected);
		}
		}
	);

	socket.on('play',function(data)
		{
			console.log('收到玩家加入游戏',currentPlayer.name);
			//if this is the first person to join the game init the enemies
			if(clients.length === 0)
			{
				spawnPoint = {position:data.spawnPointPosition,rotation:data.spawnPointRotation};
			}
			currentPlayer = {
			name:data.name,
			position:spawnPoint.position,
			rotation:spawnPoint.rotation,
			health:100
			};
			clients.push(currentPlayer);
			socket.emit('play',currentPlayer);
			//in your current game, we need to tell the other players about you.
			socket.broadcast.emit('other player connected',currentPlayer);
			}
	);

	socket.on('player move',function(data)
		{
			currentPlayer.position = data.position;
			socket.broadcast.emit('player move',currentPlayer);
		}
	);

	socket.on('player turn',function(data)
		{
			currentPlayer.rotation = data.rotation;
			socket.broadcast.emit('player turn',currentPlayer);
		}
	);

	socket.on('use magic',function(data)
		{
			var usemagicres = {name:currentPlayer.name,i:data.i};
			socket.emit('use magic',usemagicres);
			socket.broadcast.emit('use magic',usemagicres);
			console.log(currentPlayer.name,'使用魔法广播');
		}
	)

	socket.on('health',function(data){
		if(data.from===currentPlayer.name)
		{
			var indexDamage = 0;
			var response = {name:data.name,health:0};
			clients = clients.map(function(client,index)
					{
						if(client.name === data.name)
						{
							indexDamage = index;
							client.health -= data.healthChange;
							response.health = client.health;
						}
						return client;
					});
			console.log('玩家',response.name,'生命值变更为',response.health);
			socket.emit('health',response);
			socket.broadcast.emit('health',response);
		}
	})

	socket.on('disconnect',function()
		{
			console.log('玩家离线',currentPlayer.name);
			socket.broadcast.emit('other player disconnected', currentPlayer);
			for(var i=0;i<clients.length;i++)
			{
				if(clients[i].name === currentPlayer.name)
				{
					clients.splice(i,1);
				}
			}
		}
	);

});

console.log('--- server is running ...');

function guid(){
	function s4(){
		return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}