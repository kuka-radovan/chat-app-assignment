import { dataSource } from './data-source';

async function schemaAlreadyPresent(): Promise<boolean> {
  const [result] = await dataSource.query<{ users: string | null }[]>(
    `SELECT to_regclass('public.users') AS users`,
  );

  return result?.users !== null;
}

async function runMigrations(): Promise<void> {
  await dataSource.initialize();

  try {
    const hasPendingMigrations = await dataSource.showMigrations();

    if (!hasPendingMigrations) {
      return;
    }

    const fake = await schemaAlreadyPresent();
    await dataSource.runMigrations({ fake });
  } finally {
    await dataSource.destroy();
  }
}

runMigrations().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
