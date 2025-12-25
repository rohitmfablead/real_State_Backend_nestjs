const { Controller, Get, Post, Param, UseGuards } = require('@nestjs/common');
const AdminService = require('./admin.service');
const jwtGuard = require('../common/guards/jwt.guard');

@Controller('admin')
@UseGuards(jwtGuard)
class AdminController {
  constructor() {
    this.adminService = AdminService;
  }

  @Get('properties')
  getAllProperties() {
    return this.adminService.getAllProperties();
  }

  @Post('properties/:id/approve')
  approveProperty(@Param('id') id) {
    return this.adminService.approveProperty(id);
  }

  @Post('properties/:id/reject')
  rejectProperty(@Param('id') id) {
    return this.adminService.rejectProperty(id);
  }
}

module.exports = { AdminController };