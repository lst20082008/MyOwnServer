var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mysql = require('mysql');

//建立数据库连接(未连接状态)
var connection = mysql.createConnection(
	{
		host:'localhost',
		user:'root',
		password:'288794613aA!@#',
		database:'nodejs'
	}
);
connection.connect();

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

	socket.on('register',function(data)
		{
			console.log("新对象请求注册:",data.name);
			var response = {state:'ok'};
			//数据库并查重
			connection.query('SELECT * FROM `mytable`', function(err,rows,fields)
				{
					if(err)
						response.state = 'error';
					else 
					{
						rows.forEach(function(name)
							{
								if(name.name === data.name)
									response.state = 'error';
							}
						)
						//若没有重复则注册
						if(response.state === 'ok')
						{
							//TODO 插入数据库
							connection.query('insert into mytable(name) values(?)',data.name,function(err,result)
								{
									if(err)
										throw err;
									console.log('注册成功：',data.name);
								}
							);
						}
						else
							console.log('注册失败!');
					}
					socket.emit('register',response);
					console.log('返回对象值:',response.state);
				}
			);
		}
	);

	socket.on('log in',function(data)
		{
			console.log('用户请求登陆：',data.name);
			var response = 	{state:'error',name:'',item:[]};
			connection.query('SELECT * FROM `mytable`', function(err,rows,fields)
				{
					if(err)
						response.state = 'error';
					else
						rows.forEach(function(name)
							{
								if(name.name === data.name)
								{
									response.state = 'ok';
									response.name = data.name;
									response.item.push(name.item1);
									response.item.push(name.item2);
									response.item.push(name.item3);
									response.item.push(name.item4);
									response.item.push(name.item5);
									response.item.push(name.item6);
								}
							})
					currentPlayer.name = data.name;
					socket.emit('log in',response);
					console.log('用户登陆请求返回:',response.state);
				}
			);
		}
	);

	socket.on('player connect',function()
		{
		console.log(currentPlayer.name+' recv:player connect');
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
			console.log(currentPlayer.name+' emit:other player connected: '+JSON.stringify(playerConnected));
		}
		}
	);

	socket.on('play',function(data)
		{
			console.log(currentPlayer.name+' recv:play: '+JSON.stringify(data));
			//if this is the first person to join the game init the enemies
			if(clients.length === 0)
			{
				spawnPoint = {position:data.spawnPointPosition,rotation:data.spawnPointRotation};
				console.log(spawnPoint.position,spawnPoint.rotation);
			}
			currentPlayer = {
			name:data.name,
			position:spawnPoint.position,
			rotation:spawnPoint.rotation,
			health:100
			};
			clients.push(currentPlayer);
			console.log(currentPlayer.name+' emit:play:'+JSON.stringify(currentPlayer));
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
			console.log('recv:magic'+JSON.stringify(data));
			socket.emit('use magic',usemagicres);
			socket.broadcast.emit('use magic',usemagicres);
			console.log(currentPlayer.name,'使用魔法广播');
		}
	)

	socket.on('health',function(data){
		console.log(currentPlayer.name+' recv:health:'+JSON.stringify(data));
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
			console.log(currentPlayer.name+' bcst:health:'+JSON.stringify(response));
			socket.emit('health',response);
			socket.broadcast.emit('health',response);
		}
	})

	socket.on('disconnect',function()
		{
			console.log(currentPlayer.name+' recv:disconnect '+currentPlayer.name);
			socket.broadcast.emit('other player disconnected', currentPlayer);
			console.log(currentPlayer.name+' bcst:other player disconnected' + JSON.stringify(currentPlayer));
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