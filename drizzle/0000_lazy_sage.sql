CREATE TABLE `multiplayer_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`player_role` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `multiplayer_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host_token_hash` text NOT NULL,
	`guest_token_hash` text,
	`state_json` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
