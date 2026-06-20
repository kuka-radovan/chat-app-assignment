#!/bin/sh
set -e

node dist/database/run-migrations.js
exec node dist/main.js
