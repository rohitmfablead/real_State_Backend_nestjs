const { Module } = require('@nestjs/common');
const { PropertiesController } = require('./properties.controller');

@Module({
  controllers: [PropertiesController],
})
class PropertiesModule {}

module.exports = { PropertiesModule };