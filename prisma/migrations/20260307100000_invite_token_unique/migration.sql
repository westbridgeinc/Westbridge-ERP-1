-- AlterTable
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_accountId_email_key" UNIQUE ("accountId", "email");
