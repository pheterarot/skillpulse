'use strict';

/**
 * client.js
 *
 * Single shared PrismaClient instance for the entire backend.
 *
 * Every service file must import { prisma } from here instead of calling
 * `new PrismaClient()` itself. Each PrismaClient() call opens its own
 * connection pool to Postgres — multiple instances can exhaust the
 * connection limit on hosted free tiers (Neon, Supabase), causing
 * "too many connections" errors under real traffic.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = { prisma };
