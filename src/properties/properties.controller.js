const { Controller, Get, Post, Req, Body, Param, UseGuards } = require('@nestjs/common');
const Property = require('./property.schema');
const jwtGuard = require('../common/guards/jwt.guard');

@Controller('properties')
class PropertiesController {

  @Get()
  async getAll() {
    return Property.find({ approved: true }).populate('owner', 'name');
  }

  @Get(':id')
  getOne(@Param('id') id) {
    return Property.findById(id).populate('owner');
  }

  @Post()
  @UseGuards(jwtGuard)
  create(@Req() req, @Body() body) {
    return Property.create({ ...body, owner: req.user.id });
  }
}

module.exports = { PropertiesController };