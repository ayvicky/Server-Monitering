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
var util = require("util");
const { type } = require("os");
var debug = util.debuglog("server");

// Instantiate the server module object
var server = {};

// Insantiate the HTTP server
server.httpServer = http.createServer(function (req, res) {
  server.unifiedServer(req, res);
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
    chosenHandler(data, function (statusCode, payload, contentType) {
      // Determine the type of response(fallback to JSON)
      contentType = typeof contentType == "string" ? contentType : "json";

      // Use the status code called back by the handler, or default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      // Return the response parts that are content-specific
      var payloadString = "";
      if (contentType == "json") {
        res.setHeader("Content-Type", "application/json");
        payload = typeof payload == "object" ? payload : {};
        payloadString = JSON.stringify(payload);
      }
      if (contentType == "html") {
        res.setHeader("Content-Type", "text/html");
        payloadString = typeof payload == "string" ? payload : "";
      }
      // Return the response-parts, that are common to all content-types
      res.writeHead(statusCode);
      res.end(payloadString);

      // if response is 200, print green otherwise print red
      if (statusCode == 200) {
        debug(
          "\x1b[32m%s\x1b[0m",
          method.toUpperCase() + " /" + trimmedPath + " " + statusCode
        );
      } else {
        debug(
          "\x1b[31m%s\x1b[0m",
          method.toUpperCase() + " /" + trimmedPath + " " + statusCode
        );
      }
      debug("Returning this response : ", statusCode, payloadString);
    });
  });
};

// Define a request router
server.router = {
  "": handlers.index,
  "account/create": handlers.accountCreate,
  "account/edit": handlers.accountEdit,
  "account/deleted": handlers.accountDeleted,
  "session/create": handlers.sessionCreate,
  "session/deleted": handlers.sessionDeleted,
  "checks/all": handlers.checkList,
  "checks/create": handlers.checksCreate,
  "checks/edit": handlers.checksEdit,

  ping: handlers.ping,
  "api/users": handlers.users,
  "api/tokens": handlers.tokens,
  "api/checks": handlers.checks,
};

// Init script
server.init = function () {
  // Start the http server

  // Start the HTTP server
  server.httpServer.listen(config.httpPort, function () {
    // console.log(
    //   "The server is listening on port " +
    //     config.httpPort +
    //     " in " +
    //     config.envName +
    //     " mode."
    // );
    console.log(
      "\x1b[35m%s\x1b[0m",
      "The server is listening on port " +
        config.httpPort +
        " in " +
        config.envName +
        " mode."
    );
  });

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, function () {
    // console.log(
    //   "The server is listening on port " +
    //     config.httpsPort +
    //     " in " +
    //     config.envName +
    //     " mode."
    // );
    console.log(
      "\x1b[36m%s\x1b[0m",
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
