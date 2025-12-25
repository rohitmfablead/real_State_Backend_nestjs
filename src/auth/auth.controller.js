// Import necessary functions
const { Injectable } = require('@nestjs/common');

// Create a plain JavaScript class without decorators
class AuthController {
  constructor() {
    // Import service inside constructor to avoid circular dependencies
    this.authService = require('./auth.service');
  }

  async register(req, res) {
    const body = req.body;
    return this.authService.register(body);
  }

  async login(req, res) {
    const body = req.body;
    return this.authService.login(body.email, body.password);
  }
}

// Export the controller class
module.exports = { AuthController };