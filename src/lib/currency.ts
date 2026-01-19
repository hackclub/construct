import {
	BETA_DATE_CUTOFF,
	BETA_MULTIPLIER,
	BRICKS_PER_HOUR,
	CLAY_PER_HOUR,
	PRINT_MINUTES_PER_GRAM
} from './defs';

export function minutesToClay(minutes: number) {
	const hours = minutes / 60;

	return hours * CLAY_PER_HOUR;
}

export function minutesToBricks(minutes: number) {
	const hours = minutes / 60;

	return hours * BRICKS_PER_HOUR;
}

export function calculateShopScore(minutes: number, multiplier: number) {
	const hours = minutes / 60;

	return hours * multiplier;
}

export function calculateMinutes(timeSpent: number, printGrams: number) {
	return timeSpent - printGrams * PRINT_MINUTES_PER_GRAM;
}

export function calculateCurrencyPayout(
	minutes: number,
	hasBasePrinter: boolean,
	dateCreated: Date
) {
	return dateCreated.getTime() < BETA_DATE_CUTOFF.getTime()
		? { clay: null, bricks: minutesToBricks(minutes) * BETA_MULTIPLIER }
		: hasBasePrinter
			? { clay: null, bricks: minutesToBricks(minutes) }
			: { clay: minutesToClay(minutes), bricks: null };
}

export function calculatePayouts(
	timeSpent: number,
	printGrams: number,
	shopScoreMultiplier: number,
	hasBasePrinter: boolean,
	dateCreated: Date
) {
	const time = calculateMinutes(timeSpent, printGrams);
	const currency = calculateCurrencyPayout(time, hasBasePrinter, dateCreated);
	const shopScore =
		calculateShopScore(timeSpent, shopScoreMultiplier) *
		(dateCreated.getTime() < BETA_DATE_CUTOFF.getTime() ? BETA_MULTIPLIER : 1);

	return { ...currency, shopScore };
}
