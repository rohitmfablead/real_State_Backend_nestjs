const { Module } = require('@nestjs/common');
const { AdminController } = require('./admin.controller');
const AdminService = require('./admin.service');

@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
class AdminModule {}

module.exports = { AdminModule };