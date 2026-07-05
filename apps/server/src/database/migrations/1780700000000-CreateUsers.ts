import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1780700000000 implements MigrationInterface {
  name = 'CreateUsers1780700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id           UUID PRIMARY KEY,
        nickname     VARCHAR(32) UNIQUE NOT NULL,
        token        UUID UNIQUE NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_users_token ON users (token)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_users_token`);
    await queryRunner.query(`DROP TABLE users`);
  }
}
