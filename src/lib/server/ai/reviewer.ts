import { env } from '$env/dynamic/private';
import type { AiDevlogReview, AiProjectReview, Devlog, Project } from '$lib/server/db/schema.js';

const model = 'qwen/qwen3-vl-235b-a22b-instruct';

const systemPrompt = `You are a fabrication reviewer for Hack Club Construct. Keep feedback concise and professional.

Important policy:
- Only check for overstated time (over-reporting). If the devlog likely took LESS time than claimed, do NOT flag it.
- Under-reporting (claiming fewer minutes than actual) is acceptable; do NOT penalize or mention it.
- Flag only when claimed minutes seem clearly more than reasonable for the pictured/modelled work and description.
`;

type ReviewResponse = {
	overallVerdict: 'approve' | 'flag';
	overallSummary: string;
	devlogs: {
		id: number;
		approve: boolean;
		explanation: string;
	}[];
};

type ReviewInput = {
	project: Pick<Project, 'id' | 'name' | 'description' | 'status'>;
	devlogs: (Pick<Devlog, 'id' | 'description' | 'timeSpent' | 'image' | 'model' | 'createdAt'> & {
		s3PublicUrl: string;
	})[];
};

async function callHackClubAI(message: string) {
	if (!env.AI_API_KEY) {
		throw new Error('AI_API_KEY is missing');
	}

	const res = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.AI_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model,
			temperature: 0.25,
			max_tokens: 800,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: message }
			]
		})
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`AI request failed: ${res.status} ${text}`);
	}

	const json = await res.json();
	const content: string | undefined = json?.choices?.[0]?.message?.content;
	if (!content) {
		throw new Error('AI response missing content');
	}

	return content.trim();
}

async function reviewProjectOverall(project: ReviewInput['project'], devlogs: ReviewInput['devlogs']) {
	const totals = {
		devlogCount: devlogs.length,
		totalMinutes: devlogs.reduce((sum, l) => sum + (l.timeSpent ?? 0), 0),
		avgPerLog: devlogs.length > 0 ? Math.round(devlogs.reduce((s, l) => s + (l.timeSpent ?? 0), 0) / devlogs.length) : 0
	};
	const devlogSummaries = devlogs.map((l) => ({
		id: l.id,
		minutes: l.timeSpent,
		createdAt: l.createdAt,
		description: (l.description ?? '').slice(0, 220)
	}));
	const payload = {
		project: {
			id: project.id,
			name: project.name,
			description: project.description,
			status: project.status
		},
		totals,
		devlogs: devlogSummaries
	};
	const userPrompt = `Create a concise professional overview for moderator review. Include: 1) brief summary of the project intent; 2) time analysis (total, average, count); 3) highlights/risks from logs (only mention potential OVER-REPORTING, ignore under-reporting); 4) recommended next steps. Then decide if it's ready for approval.
Reply strict JSON: {"overallVerdict":"approve|flag","overview":string}.
${JSON.stringify(payload, null, 2)}`;
	const rawContent = await callHackClubAI(userPrompt);
	const sanitizedContent = rawContent.replace(/```json|```/g, '').trim();
	let parsed: { overallVerdict: 'approve' | 'flag'; overview: string };
	try { parsed = JSON.parse(sanitizedContent); } catch { throw new Error(`AI response was not JSON. First 200 chars: ${rawContent.slice(0, 200)}`); }
	return {
		overallApproved: parsed.overallVerdict === 'approve',
		summary: parsed.overview,
		prompt: `${systemPrompt}\n${userPrompt}`,
		model
	} satisfies Pick<AiProjectReview, 'overallApproved' | 'summary' | 'prompt' | 'model'>;
}

async function reviewSingleDevlog(projectId: number, log: ReviewInput['devlogs'][number]) {
	const payload = {
		id: log.id,
		description: log.description,
		minutes: log.timeSpent,
		imageUrl: `${log.s3PublicUrl}/${log.image}`,
		modelUrl: log.model ? `${log.s3PublicUrl}/${log.model}` : null,
		createdAt: log.createdAt
	};
	const userPrompt = `Judge if claimed minutes are OVERSTATED for this single devlog. Approve unless minutes appear clearly higher than reasonable. Ignore possible under-reporting.
Reply strict JSON: {"id":number,"approve":boolean,"explanation":string}.
${JSON.stringify(payload, null, 2)}`;
	const rawContent = await callHackClubAI(userPrompt);
	const sanitizedContent = rawContent.replace(/```json|```/g, '').trim();
	let parsed: ReviewResponse['devlogs'][number];
	try { parsed = JSON.parse(sanitizedContent); } catch { throw new Error(`AI response was not JSON. First 200 chars: ${rawContent.slice(0, 200)}`); }
	return {
		devlogId: parsed.id,
		projectId,
		approved: parsed.approve,
		rationale: parsed.explanation,
		prompt: `${systemPrompt}\n${userPrompt}`,
		model
	} satisfies Pick<AiDevlogReview, 'devlogId' | 'projectId' | 'approved' | 'rationale' | 'prompt' | 'model'>;
}

export async function reviewDevlogs({ project, devlogs }: ReviewInput): Promise<{
	projectReview: Pick<AiProjectReview, 'overallApproved' | 'summary' | 'prompt' | 'model'>;
	devlogReviews: Pick<AiDevlogReview, 'devlogId' | 'projectId' | 'approved' | 'rationale' | 'prompt' | 'model'>[];
}> {
	const projectReview = await reviewProjectOverall(project, devlogs);
	const devlogReviews = await Promise.all(devlogs.map(log => reviewSingleDevlog(project.id, log)));
	return { projectReview, devlogReviews };
}
