-- bidforge_auth is created by the POSTGRES_DB env var
-- This script creates the remaining service databases on first container start
CREATE DATABASE bidforge_notifications;
CREATE DATABASE bidforge_jobs;
CREATE DATABASE bidforge_contracts;
