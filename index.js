var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mysql = require('mysql');

//建立数据库连接(未连接状态)
var connection = mysql.createConnection(
	{
		host:'localhost',
		user:'root',
		password:'288794613',
		database:'nodejs'
	}
);
connection.connect();

server.listen(3000);

//服务器全局变量
//拥有角色的玩家
var clients = [];

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
					socket.emit('log in',response);
					console.log('用户登陆请求返回:',response.state);
				}
			);
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