/*
 * Create and export configuration variables
 *
 */

// Container for all the environments
var environments = {};

// Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "thisIsASecret",
  maxChecks: 5,
  twilio: {
    accountSid: "AC2c0476bbab5ceb730663ba395d9e75ac",
    authToken: "4973afaa39f649ecd65f4e6484268bc4",
    fromPhone: "+923049356003",
  },
  'templateGlobals': {
    'appName': 'Uptime Checker',
    'companyName': 'Code Experts',
    'yearCreated': '2018',
    'baseUrl': 'http://localhost:3000/'
  }
};

// Production environment
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "thisIsAlsoASecret",
  maxChecks: 5,
  twilio: {
    accountSid: "",
    authToken: "",
    fromPhone: "",
  },
  'templateGlobals': {
    'appName': 'Uptime Checker',
    'companyName': 'Code Experts',
    'yearCreated': '2018',
    'baseUrl': 'http://localhost:3000/'
  }
};

// Determine which environment was passed as a command-line argument
var currentEnviornment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

// Check that the current environment is one of the environment above, if not, default to staging
var environmentToExport =
  typeof environments[currentEnviornment] == "object"
    ? environments[currentEnviornment]
    : environments.staging;

// Export the module
module.exports = environmentToExport;
