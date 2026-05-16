import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL?.trim() || null;

/** Homebrew Postgres on macOS usually has no `postgres` role — default OS user works with trust/peer. */
const defaultLocalUrl = `postgres://${process.env.USER || 'postgres'}@localhost:5432/civic_pulse`;

if (!databaseUrl) {
  console.warn(`DATABASE_URL empty/unset — using local default: ${defaultLocalUrl}`);
}

export const sequelize = new Sequelize(
  databaseUrl || defaultLocalUrl,
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);
