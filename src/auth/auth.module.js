// Create a plain JavaScript module without decorators
const AuthModule = {};

// Define module properties
AuthModule.providers = [];
AuthModule.controllers = [require('./auth.controller').AuthController];

// Export the module
module.exports = { AuthModule };