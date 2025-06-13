import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { TestingController } from './testing.controller';

@Module({
  imports: [UserAccountsModule],
  controllers: [TestingController],
  providers: [],
  exports: [],
})
export class TestingModule {}
