import { dataSource } from './data-source';

async function main(): Promise<void> {
  await dataSource.initialize();

  try {
    const applied = await dataSource.runMigrations();

    if (applied.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    for (const migration of applied) {
      console.log(`Applied migration: ${migration.name}`);
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
