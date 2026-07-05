import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessages1780700001000 implements MigrationInterface {
  name = 'CreateMessages1780700001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id              UUID PRIMARY KEY,
        author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content         VARCHAR(4000) NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC, id DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_author ON messages (author_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_messages_author`);
    await queryRunner.query(`DROP INDEX idx_messages_created`);
    await queryRunner.query(`DROP TABLE messages`);
  }
}
