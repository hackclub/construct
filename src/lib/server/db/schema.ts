import {
	integer,
	pgTable,
	pgEnum,
	text,
	boolean,
	serial,
	timestamp,
	real
} from 'drizzle-orm/pg-core';

export const hackatimeTrustEnum = pgEnum('hackatime_trust', ['green', 'blue', 'yellow', 'red']);
export const trustEnum = pgEnum('trust', ['green', 'blue', 'yellow', 'red']);

export const user = pgTable('user', {
	id: serial().primaryKey(), // User ID
	idvId: text().notNull().unique(), // IDV ID
	slackId: text().notNull().unique(), // Slack ID
	profilePicture: text().notNull(), // Profile pic URL
	name: text().notNull(), // Username on Slack

	hackatimeTrust: hackatimeTrustEnum().notNull(), // Hackatime trust
	trust: trustEnum().notNull().default('blue'), // User trust, used if hackatime trust can't be used

	clay: real().notNull().default(0),
	brick: real().notNull().default(0),

	shopScore: real().notNull().default(0),

	hasBasePrinter: boolean().notNull().default(false),

	hasT1Review: boolean().notNull().default(false), // Has access to t1 review
	hasT2Review: boolean().notNull().default(false), // Has access to t2 review

	hasAdmin: boolean().notNull().default(false), // Has access to admin section

	isPrinter: boolean().notNull().default(false), // Is a printer

	createdAt: timestamp().notNull().defaultNow(), // Account creation timestamp
	lastLoginAt: timestamp().notNull().defaultNow() // Last login timestamp
});

export const session = pgTable('session', {
	id: serial().primaryKey(),
	token: text().notNull(),
	userId: integer()
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp().notNull()
});

export const projectStatusEnum = pgEnum('status', [
	'building',
	'submitted',
	't1_approved',
	'printing',
	'printed',
	't2_approved',
	'finalized',
	'rejected',
	'rejected_locked'
]); // rejected == can still re-ship, rejected_locked == can't re-ship

export const editorFileEnum = pgEnum('editor_file_type', ['url', 'upload']);

export const project = pgTable('project', {
	id: serial().primaryKey(),
	userId: integer()
		.notNull()
		.references(() => user.id),

	name: text(),
	description: text(),

	url: text(),

	editorFileType: editorFileEnum(),
	editorUrl: text(),
	uploadedFileUrl: text(),

	modelFile: text(),

	status: projectStatusEnum().notNull().default('building'),
	printedBy: integer().references(() => user.id),

	submittedToAirtable: boolean().default(false),

	deleted: boolean().notNull().default(false), // Projects aren't actually deleted, just marked as deleted (I cba to deal with foreign key delete issues for audit logs)

	createdAt: timestamp().notNull().defaultNow(),
	updatedAt: timestamp().notNull().defaultNow()
});

export const projectAuditLogTypeEnum = pgEnum('project_audit_log_type', [
	'create',
	'update',
	'delete'
]);

export const ship = pgTable('ship', {
	id: serial().primaryKey(),
	userId: integer()
		.notNull()
		.references(() => user.id),
	projectId: integer()
		.notNull()
		.references(() => project.id),

	url: text().notNull(),

	editorFileType: editorFileEnum().notNull(),
	editorUrl: text(),
	uploadedFileUrl: text(),

	modelFile: text().notNull(),

	timestamp: timestamp().notNull().defaultNow()
});

export const t1ReviewActionEnum = pgEnum('t1_review_action', [
	'approve',
	'approve_no_print',
	'add_comment',
	'reject',
	'reject_lock'
]);

// T1 review: approve/reject
export const t1Review = pgTable('t1_review', {
	id: serial().primaryKey(),
	userId: integer()
		.notNull()
		.references(() => user.id),
	projectId: integer()
		.notNull()
		.references(() => project.id),

	feedback: text(),
	notes: text(),
	action: t1ReviewActionEnum().notNull(),

	timestamp: timestamp().notNull().defaultNow()
});

export const t2Review = pgTable('t2_review', {
	id: serial().primaryKey(),
	userId: integer()
		.notNull()
		.references(() => user.id),
	projectId: integer()
		.notNull()
		.references(() => project.id),

	feedback: text(),
	notes: text(),
	currencyMultiplier: real().notNull().default(1.0),

	timestamp: timestamp().notNull().defaultNow()
});

export const devlog = pgTable('devlog', {
	id: serial().primaryKey(),
	userId: integer().references(() => user.id),
	projectId: integer()
		.notNull()
		.references(() => project.id),

	description: text().notNull(),
	timeSpent: integer().notNull(), // Time spent in mins
	image: text().notNull(),
	model: text().notNull(),

	deleted: boolean().notNull().default(false), // Works the same as project deletion
	createdAt: timestamp().notNull().defaultNow(),
	updatedAt: timestamp().notNull().defaultNow()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Project = typeof project.$inferSelect;

export type T1Review = typeof t1Review.$inferSelect;
// export type T2Review = typeof t2Review.$inferSelect;
