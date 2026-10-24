import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Keep this definition aligned with the existing multiplayer migrations.
export const multiplayerRooms = sqliteTable("multiplayer_rooms", {
  code: text("code").primaryKey().notNull(),
  hostTokenHash: text("host_token_hash").notNull(),
  guestTokenHash: text("guest_token_hash"),
  stateJson: text("state_json").notNull(),
  revision: integer("revision").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
}, (table) => [index("multiplayer_rooms_expires_at_idx").on(table.expiresAt)]);
