import { db } from '$lib/server/db/index.js';
import {
	project, user, devlog, ship,
	t1Review, legionReview, t2Review,
	printerOrder, ovenpheusLog,
	marketItemOrder, marketItem,
	club, clubMembership
} from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { count, eq, sql, and, ne, countDistinct, inArray } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const [users] = await db
		.select({
			count: count(),
			total: {
				clay: sql<number>`sum(${user.clay})`,
				brick: sql<number>`sum(${user.brick})`,
				shopScore: sql<number>`sum(${user.shopScore})`
			},
			average: {
				clay: sql<number>`avg(${user.clay})`,
				brick: sql<number>`avg(${user.brick})`,
				shopScore: sql<number>`avg(${user.shopScore})`
			}
		})
		.from(user);

	const [usersWithProjects] = await db
		.select({
			total: countDistinct(project.userId),
			shipped: sql<number>`count(distinct ${project.userId}) filter (where ${project.status} != 'building')`
		})
		.from(project)
		.where(eq(project.deleted, false));

	const [projectCount] = await db
		.select({
			count: count(),
			building: sql<number>`count(*) filter (where ${project.status} = 'building')`,
			submitted: sql<number>`count(*) filter (where ${project.status} = 'submitted')`,
			t1_approved: sql<number>`count(*) filter (where ${project.status} = 't1_approved')`,
			printing: sql<number>`count(*) filter (where ${project.status} = 'printing')`,
			printed: sql<number>`count(*) filter (where ${project.status} = 'printed')`,
			t2_approved: sql<number>`count(*) filter (where ${project.status} = 't2_approved')`,
			finalized: sql<number>`count(*) filter (where ${project.status} = 'finalized')`,
			rejected: sql<number>`count(*) filter (where ${project.status} = 'rejected')`,
			rejected_locked: sql<number>`count(*) filter (where ${project.status} = 'rejected_locked')`
		})
		.from(project)
		.where(eq(project.deleted, false));

	const [devlogs] = await db
		.select({
			count: count(),
			totalTime: sql<number>`sum(${devlog.timeSpent})`,
			timePerDevlog: sql<number>`avg(${devlog.timeSpent})`
		})
		.from(devlog)
		.where(eq(devlog.deleted, false));

	const shippedProjects = db
		.select({
			id: project.id,
			timeSpent: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`.as('time_spent'),
			devlogCount: sql<number>`COALESCE(COUNT(${devlog.id}), 0)`.as('devlog_count')
		})
		.from(project)
		.leftJoin(devlog, and(eq(project.id, devlog.projectId), eq(devlog.deleted, false)))
		.where(and(eq(project.deleted, false), ne(project.status, 'building')))
		.groupBy(project.id)
		.as('shippedProjects');

	const [shippedStats] = await db.select({
		count: count(),
		totalTimeSpent: sql<number>`sum(${shippedProjects.timeSpent})`,
		averageTimeSpent: sql<number>`avg(${shippedProjects.timeSpent})`,
		totalDevlogs: sql<number>`sum(${shippedProjects.devlogCount})`,
		averageDevlogs: sql<number>`avg(${shippedProjects.devlogCount})`,
	}).from(shippedProjects);

	// --- User Funnel ---
	const [totalUsers] = await db.select({ count: count() }).from(user);
	const [funnel] = await db.select({
		withProject: sql<number>`count(distinct ${project.userId}) filter (where ${project.deleted} = false)`,
		submitted: sql<number>`count(distinct ${project.userId}) filter (where ${project.deleted} = false and ${project.status} != 'building')`,
		t1Approved: sql<number>`count(distinct ${project.userId}) filter (where ${project.deleted} = false and ${project.status} in ('t1_approved', 'printing', 'printed', 't2_approved', 'finalized'))`,
		printed: sql<number>`count(distinct ${project.userId}) filter (where ${project.deleted} = false and ${project.status} in ('printed', 't2_approved', 'finalized'))`,
		finalized: sql<number>`count(distinct ${project.userId}) filter (where ${project.deleted} = false and ${project.status} = 'finalized')`,
	}).from(project);
	// --- Hours Finalised (on finalized projects) ---
	const hoursOnFinalized = await db
		.select({
			totalMinutes: sql<number>`sum(${devlog.timeSpent})`,
		})
		.from(devlog)
		.innerJoin(project, eq(devlog.projectId, project.id))
		.where(
			and(
				eq(devlog.deleted, false),
				eq(project.deleted, false),
				eq(project.status, 'finalized')
			)
		)
		.groupBy(devlog.userId);

	const hours10 = hoursOnFinalized.filter(r => Number(r.totalMinutes) >= 600).length;
	const hours25 = hoursOnFinalized.filter(r => Number(r.totalMinutes) >= 1500).length;
	const hours40 = hoursOnFinalized.filter(r => Number(r.totalMinutes) >= 2400).length;

	// --- Printer Milestones ---
	const [printerBought] = await db
		.select({ count: countDistinct(printerOrder.userId) })
		.from(printerOrder);

	const [requestedPrinter] = await db
		.select({ count: count() })
		.from(user)
		.where(inArray(user.printerFulfilment, ['queued', 'approved', 'fulfilled']));

	const [printerFulfilled] = await db
		.select({ count: count() })
		.from(user)
		.where(eq(user.printerFulfilment, 'fulfilled'));

	const funnelData = {
		totalUsers: totalUsers.count,
		...funnel,
		hours10,
		hours25,
		hours40,
		boughtPrinter: printerBought.count,
		requestedPrinter: requestedPrinter.count,
		printerFulfilled: printerFulfilled.count,
	};

	// --- Review Pipeline ---
	const [t1Stats] = await db.select({
		total: count(),
		approve: sql<number>`count(*) filter (where ${t1Review.action} = 'approve')`,
		approveNoPrint: sql<number>`count(*) filter (where ${t1Review.action} = 'approve_no_print')`,
		reject: sql<number>`count(*) filter (where ${t1Review.action} = 'reject')`,
		rejectLock: sql<number>`count(*) filter (where ${t1Review.action} = 'reject_lock')`,
		addComment: sql<number>`count(*) filter (where ${t1Review.action} = 'add_comment')`,
		uniqueReviewers: sql<number>`count(distinct ${t1Review.userId})`,
	}).from(t1Review);

	const [legionStats] = await db.select({
		total: count(),
		markForPrinting: sql<number>`count(*) filter (where ${legionReview.action} = 'mark_for_printing')`,
		print: sql<number>`count(*) filter (where ${legionReview.action} = 'print')`,
		reject: sql<number>`count(*) filter (where ${legionReview.action} = 'reject')`,
		addComment: sql<number>`count(*) filter (where ${legionReview.action} = 'add_comment')`,
		alreadyPrinted: sql<number>`count(*) filter (where ${legionReview.action} = 'already_printed')`,
		uniqueReviewers: sql<number>`count(distinct ${legionReview.userId})`,
		totalFilament: sql<number>`COALESCE(sum(${legionReview.filamentUsed}), 0)`,
	}).from(legionReview);

	const [t2Stats] = await db.select({
		total: count(),
		uniqueReviewers: sql<number>`count(distinct ${t2Review.userId})`,
		avgMultiplier: sql<number>`COALESCE(avg(${t2Review.shopScoreMultiplier}), 0)`,
	}).from(t2Review);

	const [awaitingT1] = await db.select({
		count: count(),
	}).from(project)
		.where(and(eq(project.deleted, false), eq(project.status, 'submitted')));

	const [awaitingPrint] = await db.select({
		count: count(),
	}).from(project)
		.where(and(eq(project.deleted, false), eq(project.status, 't1_approved')));

	const [awaitingT2] = await db.select({
		count: count(),
	}).from(project)
		.where(and(eq(project.deleted, false), eq(project.status, 'printed')));

	// --- Printer Ecosystem ---
	const printerFulfilment = await db.select({
		status: user.printerFulfilment,
		count: count(),
	})
		.from(user)
		.groupBy(user.printerFulfilment);

	const [basePrinterStats] = await db.select({
		hasBase: sql<number>`count(*) filter (where ${user.hasBasePrinter} = true)`,
		noBase: sql<number>`count(*) filter (where ${user.hasBasePrinter} = false)`,
	}).from(user);

	const [printerOrderCount] = await db.select({
		count: count(),
	}).from(printerOrder);

	const [printedProjectCount] = await db.select({
		count: count(),
	}).from(project)
		.where(and(
			eq(project.deleted, false),
			inArray(project.status, ['printed', 't2_approved', 'finalized'])
		));

	// --- Trust Distribution ---
	const trustDistribution = await db.select({
		trust: user.hackatimeTrust,
		count: count(),
	})
		.from(user)
		.groupBy(user.hackatimeTrust)
		.orderBy(user.hackatimeTrust);

	// --- Club Stats ---
	const [clubStats] = await db.select({
		totalClubs: count(),
	}).from(club);

	const [membershipStats] = await db.select({
		totalMemberships: count(),
	}).from(clubMembership);

	const clubSizes = await db.select({
		id: club.id,
		name: club.name,
		count: sql<number>`count(${clubMembership.id})`,
	})
		.from(club)
		.leftJoin(clubMembership, eq(club.id, clubMembership.clubId))
		.groupBy(club.id, club.name)
		.orderBy(sql`count(${clubMembership.id}) desc`);

	// --- Economy: Ovenpheus ---
	const [ovenpheusStats] = await db.select({
		totalClay: sql<number>`COALESCE(sum(${ovenpheusLog.clay}), 0)`,
		totalBricks: sql<number>`COALESCE(sum(${ovenpheusLog.bricksReceived}), 0)`,
		totalConversions: count(),
	}).from(ovenpheusLog);

	// --- Market Orders ---
	const orderStatusBreakdown = await db.select({
		status: marketItemOrder.status,
		count: count(),
	})
		.from(marketItemOrder)
		.where(eq(marketItemOrder.deleted, false))
		.groupBy(marketItemOrder.status);

	// --- Market Items ---
	const [marketItemStats] = await db.select({
		total: count(),
		public: sql<number>`count(*) filter (where ${marketItem.isPublic} = true)`,
		private: sql<number>`count(*) filter (where ${marketItem.isPublic} = false)`,
	}).from(marketItem)
		.where(eq(marketItem.deleted, false));

	// --- Trends Over Time ---
	const usersOverTime = await db.select({
		month: sql<string>`date_trunc('week', ${user.createdAt})`,
		count: count(),
	})
		.from(user)
		.groupBy(sql`date_trunc('week', ${user.createdAt})`)
		.orderBy(sql`date_trunc('week', ${user.createdAt})`);

	const projectsOverTime = await db.select({
		month: sql<string>`date_trunc('week', ${project.createdAt})`,
		count: count(),
	})
		.from(project)
		.where(eq(project.deleted, false))
		.groupBy(sql`date_trunc('week', ${project.createdAt})`)
		.orderBy(sql`date_trunc('week', ${project.createdAt})`);

	const submissionsOverTime = await db.select({
		month: sql<string>`date_trunc('week', ${ship.timestamp})`,
		count: count(),
	})
		.from(ship)
		.groupBy(sql`date_trunc('week', ${ship.timestamp})`)
		.orderBy(sql`date_trunc('week', ${ship.timestamp})`);

	const devlogHoursOverTime = await db.select({
		month: sql<string>`date_trunc('week', ${devlog.createdAt})`,
		hours: sql<number>`COALESCE(sum(${devlog.timeSpent}) / 60.0, 0)`,
	})
		.from(devlog)
		.where(eq(devlog.deleted, false))
		.groupBy(sql`date_trunc('week', ${devlog.createdAt})`)
		.orderBy(sql`date_trunc('week', ${devlog.createdAt})`);

	return {
		users,
		project: projectCount,
		usersWithProjects,
		shippedStats,
		devlogs,
		funnel: funnelData,
		t1Stats,
		legionStats,
		t2Stats,
		awaitingT1: awaitingT1.count,
		awaitingPrint: awaitingPrint.count,
		awaitingT2: awaitingT2.count,
		printerFulfilment,
		basePrinterStats,
		printerOrderCount: printerOrderCount.count,
		printedProjectCount: printedProjectCount.count,
		trustDistribution,
		clubStats: clubStats,
		membershipStats: membershipStats,
		ovenpheusStats,
		orderStatusBreakdown,
		marketItemStats,
		usersOverTime,
		projectsOverTime,
		submissionsOverTime,
		devlogHoursOverTime,
	};
}
