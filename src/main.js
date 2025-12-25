require('dotenv').config();
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 5000);
  console.log("Server running on port " + (process.env.PORT || 5000));
}
bootstrap();