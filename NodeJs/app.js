var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var totalPrice = "$40";
var Client = require('node-rest-client').Client;
var client = new Client();


var cartApiUrl = "http://localhost:9090/v1/starbucks/orders";
var cartApiPostUrl = "http://localhost:9090/v1/starbucks/order";
var CartPostArgs = {
          "location": "take-out",
          "items": [
            {
              "qty": 1,
              "name": "latte",
              "milk": "whole",
              "size": "large"
            }
          ]
        };

//Handle from post data
var bodyParser = require('body-parser');

var path = require('path'); 
var catalog;
var connections = [];

app.use(bodyParser.urlencoded({ extended: true })); 

//app.use(express.bodyParser());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

 
app.post('/login', function (req, res, next) {
  var email = req.body.email;
        var password = req.body.password;

  
      if (req.body.email && req.body.email=== email && req.body.password && req.body.password === password) {
        req.session.authenticated = true;
        res.redirect('/secure');
      } else {
        req.flash('error', 'Username and password are incorrect');
        
      }
   res.send('username sent to Node Server: "' + email + '".'+ '<br/> password sent to Node Server: "' + password + '".');
   response = {
      username:email,
      password:password
      
   };

   console.log(response);

    });

// Register User
app.post('/register', function(req, res){
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var password2 = req.body.cpassword;

  // Validation
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('cpassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if(errors){
    res.render('register',{
      errors:errors
    });
  } else {
    var newUser = new User({
      name: name,
      email:email,
      password: password
    });

    User.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(user);
    });

    req.flash('success_msg', 'You are registered and can now login');
  }

res.send('You are registered successfully');
   
console.log('New User successfully registered');

});


server.listen(8080, function() {
  console.log('Server running at http://127.0.0.1:8080/');
});

//handle socket connections
io.sockets.on('connection', function(socket) {
  
  console.log('new client:' + socket.id);
  connections.push(socket.id); 
  io.sockets.emit('join', {user : socket.id });
  //sendRestGetRequest(cartApiUrl,123);
    

  socket.on('addPizza', function (data) {
      console.log(data.pizzaId);
      //todo: rest call to golang pizza api
      var cartUuid = sendRestPostRequest(cartApiUrl,CartPostArgs,addPizzaCallBack);
      console.log(cartUuid);
     });
  
  addPizzaCallBack = function(cartUuid,data){
      io.sockets.emit('addPizza',{pizzaId:data.pizzaId,totalPrice:totalPrice,user : socket.id,cartUuid : cartUuid});
  }
  socket.on('removePizza', function (data) {
      console.log(data.pizzaId);
      //todo: rest call to golang pizza api
      io.sockets.emit('removePizza', { pizzaId: data.pizzaId,totalPrice:totalPrice,user : socket.id });
   
    });

  socket.on('addQuantity', function (data) {
      console.log(data.pizzaId);
      //todo: rest call to golang pizza api
      io.sockets.emit('addQuantity', { pizzaId: data.pizzaId,totalPrice:totalPrice,user : socket.id });
   
    });

  socket.on('reduceQuantity', function (data) {
      console.log(data.pizzaId);
      //todo: rest call to golang pizza api
      io.sockets.emit('reduceQuantity', { pizzaId: data.pizzaId,totalPrice:totalPrice,user : socket.id });
   
    });

  socket.on('lookingAt',function(data){
      //todo: rest call to golang pizza api
      io.sockets.emit('lookingAt', { pizzaId: data.pizzaId,user : socket.id });
  });

  socket.on('getCatalog',function(){
    catalog = [{id:'0',name: "Pepperoni pizza", price : "$12",img_url:"img/product/1.jpg",desc:"This is a medium spicy Pepperoni Pizza with Tomato sauce, triple Pepperoni and mozzarella cheese."},
    {id:'1',name: "Pizza 2", price : "$10",img_url:"img/product/2.jpg",desc:"This is a medium spicy pizza 2."},
    {id:'2',name: "Pizza 3", price : "$14",img_url:"img/product/3.jpg",desc:"This is a medium spicy pizza 3."},
    {id:'3',name: "Pizza 4", price : "$15",img_url:"img/product/4.jpg",desc:"This is a medium spicy pizza 4."},
    {id:'4',name: "Pizza 5", price : "$18",img_url:"img/product/5.jpg",desc:"This is a medium spicy pizza 5."}];
    socket.emit('catalog',{catalog:catalog,user : socket.id});
    console.log('sent catalog');
  });

  socket.on('closeConnection',function(){
      console.log('Client disconnects'  + socket.id);
      socket.disconnect();
      removePlayer(socket.id);
      io.sockets.emit('left', {user : socket.id });
  });

  socket.on('disconnect', function() {
      console.log('Got disconnected!'  + socket.id);
      socket.disconnect();
      io.sockets.emit('left', {user : socket.id });
      removePlayer(socket.id);
   });
});

function removePlayer(item)
{
var index = connections.indexOf(item);
connections.splice(index, 1);
}


function sendRestGetRequest(url,uuid){
// direct way 
client.get(url, function (data, response) {
    // parsed response body as js object 
    console.log(data);

    // raw response 
    //console.log(response);
});

};


function sendRestPostRequest(url,args,callback,socketData){
// direct way 
client.post(url,args, function (data, response) {
    // parsed response body as js object 
    console.log(data);
    //replace with uuid varibale returned in post json response
    var uuid = data[0].id;
    console.log('uuid : '+uuid);
    callback(uuid,socketData);
    // raw response 
    //console.log(response);
});

};
