import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SessionService {
  constructor(private dataSource: DataSource) {}

  // async findSessionByDeviceIdAndDate(deviceId: string, iat: number) {
  //   const date = new Date(iat * 1000);
  //   const lowerBound = new Date(date.getTime() - 500);
  //   const upperBound = new Date(date.getTime() + 500);
  //
  //   const result = await this.dataSource.query(
  //     `SELECT * FROM sessions
  //    WHERE device_id = $1 AND last_active_date BETWEEN $2 AND $3`,
  //     [deviceId, lowerBound.toISOString(), upperBound.toISOString()],
  //   );
  //
  //   return result[0] || null;
  // }
  //
  // async updateSessionLastActiveDate(
  //   deviceId: string,
  //   oldIat: number,
  //   newIat: number,
  // ) {
  //   const oldDate = new Date(oldIat * 1000);
  //   const newDate = new Date(newIat * 1000);
  //
  //   const result = await this.dataSource.query(
  //     `UPDATE sessions
  //    SET last_active_date = $1
  //    WHERE device_id = $2 AND last_active_date = $3`,
  //     [newDate.toISOString(), deviceId, oldDate.toISOString()],
  //   );
  //
  //   if (result.rowCount === 0) {
  //     throw new NotFoundException('Session not found for update');
  //   }
  // }
  async findSessionByDeviceIdAndDate(deviceId: string, iat: number) {
    // временная заглушка: всегда "находит" сессию
    return { deviceId, lastActiveDate: new Date(iat * 1000) };
  }

  async updateSessionLastActiveDate(
    deviceId: string,
    oldIat: number,
    newIat: number,
  ) {
    // заглушка: имитирует обновление
    console.log(`Session updated: ${deviceId} from ${oldIat} → ${newIat}`);
  }

  async deleteSessionByDeviceIdAndDate(
    deviceId: string,
    iat: number,
  ): Promise<void> {
    // Заглушка — просто логируем удаление
    console.log(`Session DELETED: deviceId=${deviceId}, iat=${iat}`);
  }
}
