import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './task/task.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './task/task.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TaskModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'taskdb.sqlite',
      entities: [TaskEntity],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
