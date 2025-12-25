const { Module } = require('@nestjs/common');
const connectDB = require('./config/db');

const { AuthModule } = require('./auth/auth.module');
const { UsersModule } = require('./users/users.module');
const { PropertiesModule } = require('./properties/properties.module');
const { AdminModule } = require('./admin/admin.module');

connectDB();

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PropertiesModule,
    AdminModule
  ],
})
class AppModule {}

module.exports = { AppModule };