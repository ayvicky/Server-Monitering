/*
 * Server-related tasks
 *
 */

// Dependencies
var http = require("http");
var https = require("https");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./config");
var fs = require("fs");
var handlers = require("./handlers");
const helpers = require("./helpers");
var path = require("path");

// Instantiate the server module object
var server = {};

// Insantiate the HTTP server
server.httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

// Instantiate the HTTPS server
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
};
server.httpsServer = https.createServer(server.httpsServerOptions, function (
  req,
  res
) {
  server.unifiedServer(req, res);
});

// All the server logic for both http & https server
server.unifiedServer = function (req, res) {
  // Get the URL and parse it
  var parseUrl = url.parse(req.url, true);

  // Get the path
  var path = parseUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query string as an object // pass as ?fizz=buzz
  var queryStringObject = parseUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  //   Get the headers as an object --> use postman
  var headers = req.headers;

  //   Get the payload, if any --> send post request with raw text
  var decoder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", function (data) {
    buffer += decoder.write(data);
  });
  req.on("end", function () {
    buffer += decoder.end();
    // Choose the handler this request should go to, if one is not found use the notFound handler
    var chosenHandler =
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFound;

    // Construct the object send to the data handler -->
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    // Route the request to the handler specified in the request
    chosenHandler(data, function (statusCode, payload) {
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      // Use the payload called back by the handler or default to an empty object
      payload = typeof payload == "object" ? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log("Returning this response : ", statusCode, payloadString);
    });
  });
};

// Define a request router
server.router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};

// Init script
server.init = function () {
  // Start the http server

  // Start the HTTP server
  server.httpServer.listen(config.httpPort, function () {
    console.log(
      "The server is listening on port " +
        config.httpPort +
        " in " +
        config.envName +
        " mode."
    );
  });

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, function () {
    console.log(
      "The server is listening on port " +
        config.httpsPort +
        " in " +
        config.envName +
        " mode."
    );
  });
};

// Export the module
module.exports = server;
