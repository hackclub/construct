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
	idvToken: text(), // IDV token (stored encrypted)
	slackId: text().notNull().unique(), // Slack ID
	profilePicture: text().notNull(), // Profile pic URL
	name: text().notNull(), // Username on Slack

	hackatimeTrust: hackatimeTrustEnum().notNull(), // Hackatime trust
	trust: trustEnum().notNull().default('blue'), // User trust, used if hackatime trust can't be used

	clay: real().notNull().default(0),
	brick: real().notNull().default(0),

	shopScore: real().notNull().default(0),

	hasBasePrinter: boolean().notNull().default(false),
	// bricksSpentOnUpgrades: integer().notNull().default(0),

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
	claimedAt: timestamp(), // When the project was claimed for printing

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

export const legionActionEnum = pgEnum('legion_action', [
	'mark_for_printing',
	'unmark_for_printing',
	'print',
	'add_comment',
	'reject',
	'already_printed'
]);

// Actions done by legion
export const legionReview = pgTable('legion_review', {
	id: serial().primaryKey(),
	userId: integer()
		.notNull()
		.references(() => user.id),
	projectId: integer()
		.notNull()
		.references(() => project.id),

	feedback: text(),
	notes: text(),
	filamentUsed: real(),
	action: legionActionEnum().notNull(),

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
	image: text(),
	notes: text(),
	shopScoreMultiplier: real().notNull().default(25.0),

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

// Market

export const marketItem = pgTable('market_item', {
	id: serial().primaryKey(),
	createdBy: integer().references(() => user.id),

	name: text().notNull(),
	description: text().notNull(),
	image: text().notNull(),

	minRequiredShopScore: integer().notNull().default(0),

	minShopScore: integer().notNull(),
	maxShopScore: integer().notNull(), // Score after which price becomes constant
	maxPrice: integer().notNull(),
	minPrice: integer().notNull(),

	isPublic: boolean().notNull().default(false),

	deleted: boolean().notNull().default(false),
	createdAt: timestamp().notNull().defaultNow(),
	updatedAt: timestamp().notNull().defaultNow()
});

export const ovenpheusLog = pgTable('ovenpheus_log', {
	id: serial().primaryKey(),
	userId: integer().references(() => user.id),

	clay: real().notNull(),
	bricksReceived: real().notNull(),

	timestamp: timestamp().notNull().defaultNow(),
});

export const marketOrderStatus = pgEnum('market_order_status', [
	'awaiting_approval',
	'fulfilled',
	'denied',
	'refunded'
]);

export const marketItemOrder = pgTable('market_item_order', {
	id: serial().primaryKey(),
	userId: integer().references(() => user.id).notNull(),

	addressId: text().notNull(),
	bricksPaid: integer().notNull(),

	status: marketOrderStatus().notNull().default('awaiting_approval'),
	userNotes: text().notNull(),
	notes: text(),	// stuff like tracking code, shown to user

	deleted: boolean().notNull().default(false),
	createdAt: timestamp().notNull().defaultNow()
});

// export const marketBasePrinter = pgTable('market_base_printer', {
// 	id: serial().primaryKey(),
// 	createdBy: integer().references(() => user.id),

// 	name: text().notNull(),
// 	description: text().notNull(),
// 	image: text().notNull(),

// 	minRequiredShopScore: integer().notNull().default(0),
// 	isPublic: boolean().notNull().default(false),

// 	deleted: boolean().notNull().default(false),
// 	createdAt: timestamp().notNull().defaultNow(),
// 	updatedAt: timestamp().notNull().defaultNow()
// });

// export const marketPrinterUpgrade = pgTable('market_printer_upgrade', {
// 	id: serial().primaryKey(),
// 	createdBy: integer().references(() => user.id),

// 	name: text().notNull(),
// 	description: text().notNull(),
// 	image: text().notNull(),

// 	minRequiredShopScore: integer().notNull().default(0),

// 	minShopScore: integer().notNull(),
// 	maxShopScore: integer().notNull(), // Score after which price becomes constant
// 	maxPrice: integer().notNull(),
// 	minPrice: integer().notNull(),

// 	isPublic: boolean().notNull().default(false),

// 	deleted: boolean().notNull().default(false),
// 	createdAt: timestamp().notNull().defaultNow(),
// 	updatedAt: timestamp().notNull().defaultNow()
// });

// Impersonate audit logs
export const impersonateAuditLog = pgTable('impersonate_audit_log', {
	id: serial().primaryKey(),
	adminUserId: integer()
		.notNull()
		.references(() => user.id), // Admin who performed the impersonation
	targetUserId: integer()
		.notNull()
		.references(() => user.id), // User who was impersonated
	timestamp: timestamp().notNull().defaultNow()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Project = typeof project.$inferSelect;
export type ImpersonateAuditLog = typeof impersonateAuditLog.$inferSelect;

export type T1Review = typeof t1Review.$inferSelect;
export type LegionReview = typeof legionReview.$inferSelect;
export type T2Review = typeof t2Review.$inferSelect;

export type MarketItem = typeof marketItem.$inferSelect;
