// Abgewandelt von: http://mfikri.com/en/blog/nodejs-restful-api-mysql
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const uuidv4 = require('uuid/v4');
require('dotenv').config();

// Parser for JSON
app.use(bodyParser.json());

// Swagger
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Create DB pool
var pool  = mysql.createPool({
    host     : process.env.SQL_HOST,
    user     : process.env.SQL_USER,
    password : process.env.SQL_PASSWORD,
    database : process.env.SQL_DATABASE
});

// Return all Carts
app.get('/v1/carts',(request, response) => {
  let sql = "SELECT * FROM carts";
  let query = pool.query(sql, (error, results) => {
    //Somethings wrong interally
    if(error) return sendResponse(response, 500, error, null);
    // All good
    sendResponse(response, 200, null, results);
  });
});

// Return specific Carts
app.get('/v1/carts/:userid',(request, response) => {
  let sql = "SELECT content FROM carts WHERE userid='"+request.params.userid+"'";
  let query = pool.query(sql, (error, results) => {
    //Somethings wrong interally
    if(error) return sendResponse(response, 500, error, null);
    // All good
    sendResponse(response, 200, null, results);
  });
});

// Update specific Cart
app.put('/v1/carts/:userid',(request, response) => {
  let data = request.body;
  data.content = JSON.stringify(data.content[0]);
  let sql = "UPDATE carts SET ? WHERE userid='"+request.params.userid+"'";
  let query = pool.query(sql, data,(error, results) => {
    // Missing or wrong attributes used
    if(error) return sendResponse(response, 400, error.sqlMessage, null);
    // Id is unkown and no changes were made
    if(results.affectedRows < 1) return sendResponse(response, 404, "Cart not found.", null);
    // All good
    sendResponse(response, 200, null, results.message);
  });
});

// Create new Cart
app.post('/v1/carts/:userid',(request, response) => {
  let data = request.body;
  data.userid = request.params.userid;
  data.content = JSON.stringify(data.content[0]);
  let sql = "INSERT INTO carts SET ?";
  let query = pool.query(sql, data,(error, results) => {
    // Missing or wrong attributes used
    if(error) return sendResponse(response, 400, error, null);
    // All good
    sendResponse(response, 200, null, results);
  });
});

// Delete specific content in Cart
app.delete('/v1/carts/:userid',(request, response) => {
  let sql = "DELETE FROM carts WHERE userid='"+request.params.userid+"'";
  let query = pool.query(sql, (error, results) => {
    //Somethings wrong interally
    console.log(results);
    if(error) return sendResponse(response, 500, error.sqlMessage, null);
    // Id is unkown and no changes were made
    if(results.affectedRows < 1) return sendResponse(response, 404, "User not found.", null);
    // All good
    sendResponse(response, 200, null, results);
  });
});

// Return all Orders
app.get('/v1/orders',(request, response) => {
  let sql = "SELECT * FROM orders";
  let query = pool.query(sql, (error, results) => {
    //Somethings wrong interally
    if(error) return sendResponse(response, 500, error, null);
    // All good
    sendResponse(response, 200, null, results);
  });
});

// Return specific Order
app.get('/v1/orders/:orderid',(request, response) => {
  let sql = "SELECT * FROM orders WHERE orderid='"+request.params.orderid+"'";
  let query = pool.query(sql, (error, results) => {
    //Somethings wrong interally
    if(error) return sendResponse(response, 500, error, null);
    // Id is unkown and no changes were made
    if(results.length < 1) return sendResponse(response, 404, "Not found.", null);
    // All good
    sendResponse(response, 200, null, results);
  });
});

// Create new Order
app.post('/v1/orders',(request, response) => {
  let data = request.body;
  data.orderid = uuidv4();
  data.content = JSON.stringify(data.content[0]);
  let sql = "INSERT INTO orders SET ?";
  let query = pool.query(sql, data,(error, results) => {
    // Missing or wrong attributes used
    if(error) return sendResponse(response, 400, error, null);
    // All good
    sendResponse(response, 200, null, results);
  });
});

// Update orderstatus
app.put('/v1/orders/:orderid/orderstatus',(request, response) => {
  let data = request.body;
  let sql = "UPDATE orders SET ? where orderid='"+request.params.orderid+"'";
  let query = pool.query(sql, data,(error, results) => {
    // Missing or wrong attributes used
    if(error) return sendResponse(response, 400, error.sqlMessage, null);
    // Id is unkown and no changes were made
    if(results.affectedRows < 1) return sendResponse(response, 404, "User not found.", null);
    // All good
    sendResponse(response, 200, null, {'Neuer Orderstatus: "':data.orderstatus+'"'});
  });
});

// Delete specific Order
app.delete('/v1/orders/:orderid',(request, response) => {
  let sql = "DELETE FROM orders WHERE orderid='"+request.params.orderid+"'";
  let query = pool.query(sql, (error, results) => {
    //Somethings wrong interally
    if(error) return sendResponse(response, 500, error.sqlMessage, null);
    // Id is unkown and no changes were made
    if(results.affectedRows < 1) return sendResponse(response, 404, "User not found.", null);
    // All good
    sendResponse(response, 200, null, {'Gelöschte Order: "':request.params.orderid+'"'});
  });
});

// Return all Orders of specific User
app.get('/v1/users/:userid/orders',(request, response) => {
  let sql = "SELECT * FROM orders WHERE userid='"+request.params.userid+"'";
  let query = pool.query(sql, (error, results) => {
    //Somethings wrong interally
    if(error) return sendResponse(response, 500, error, null);
    // Id is unkown and no changes were made
    if(results.length < 1) return sendResponse(response, 404, "Not found.", null);
    // All good
    sendResponse(response, 200, null, results);
  });
});

// Catch wrong JSON in requests
app.use(function (error, request, response, next) {
  if (error instanceof SyntaxError) {
    sendResponse(response, 400, "Invalid JSON.", null);
  } else {
    next();
  }
});

//Server listening
app.listen(3000,() =>{
  console.log('Server started on port 3000...');
});

function sendResponse(response, status, error, result) {
  response.status(status).send(JSON.stringify({"status": status, "error": error, "result": result}));
}
