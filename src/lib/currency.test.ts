import { describe, it, expect } from 'vitest';
import {
	minutesToClay,
	minutesToBricks,
	calculateShopScore,
	calculateMinutes,
	calculateCurrencyPayout,
	calculatePayouts
} from './currency';
import {
	CLAY_PER_HOUR,
	BRICKS_PER_HOUR,
	PRINT_MINUTES_PER_GRAM,
	BETA_DATE_CUTOFF,
	BETA_MULTIPLIER
} from './defs';

describe('minutesToClay', () => {
	it('converts 0 minutes to 0 clay', () => {
		expect(minutesToClay(0)).toBe(0);
	});

	it('converts 60 minutes to CLAY_PER_HOUR', () => {
		expect(minutesToClay(60)).toBe(CLAY_PER_HOUR);
	});

	it('converts 120 minutes to 2 * CLAY_PER_HOUR', () => {
		expect(minutesToClay(120)).toBe(2 * CLAY_PER_HOUR);
	});

	it('handles fractional minutes', () => {
		expect(minutesToClay(30)).toBeCloseTo(0.5 * CLAY_PER_HOUR);
	});
});

describe('minutesToBricks', () => {
	it('converts 0 minutes to 0 bricks', () => {
		expect(minutesToBricks(0)).toBe(0);
	});

	it('converts 60 minutes to BRICKS_PER_HOUR', () => {
		expect(minutesToBricks(60)).toBe(BRICKS_PER_HOUR);
	});

	it('converts 120 minutes to 2 * BRICKS_PER_HOUR', () => {
		expect(minutesToBricks(120)).toBe(2 * BRICKS_PER_HOUR);
	});

	it('handles fractional minutes', () => {
		expect(minutesToBricks(30)).toBeCloseTo(0.5 * BRICKS_PER_HOUR);
	});
});

describe('calculateShopScore', () => {
	it('returns 0 for 0 minutes', () => {
		expect(calculateShopScore(0, 1)).toBe(0);
	});

	it('multiplies hours by the multiplier', () => {
		expect(calculateShopScore(60, 2)).toBe(2);
		expect(calculateShopScore(120, 3)).toBe(6);
	});

	it('handles fractional multipliers', () => {
		expect(calculateShopScore(60, 0.5)).toBeCloseTo(0.5);
	});
});

describe('calculateMinutes', () => {
	it('subtracts print gram time from total time spent', () => {
		const timeSpent = 100;
		const printGrams = 50;
		expect(calculateMinutes(timeSpent, printGrams)).toBe(
			timeSpent - printGrams * PRINT_MINUTES_PER_GRAM
		);
	});

	it('returns timeSpent when printGrams is 0', () => {
		expect(calculateMinutes(100, 0)).toBe(100);
	});

	it('can return negative values if print time exceeds time spent', () => {
		expect(calculateMinutes(1, 1000)).toBeLessThan(0);
	});
});

describe('calculateCurrencyPayout', () => {
	const beforeBeta = new Date('2025-01-01');
	const afterBeta = new Date('2026-01-01');

	it('returns bricks with BETA_MULTIPLIER for dates before beta cutoff', () => {
		const result = calculateCurrencyPayout(60, false, beforeBeta);
		expect(result.clay).toBeNull();
		expect(result.bricks).toBe(minutesToBricks(60) * BETA_MULTIPLIER);
	});

	it('returns bricks without multiplier for post-beta with base printer', () => {
		const result = calculateCurrencyPayout(60, true, afterBeta);
		expect(result.clay).toBeNull();
		expect(result.bricks).toBe(minutesToBricks(60));
	});

	it('returns clay for post-beta without base printer', () => {
		const result = calculateCurrencyPayout(60, false, afterBeta);
		expect(result.clay).toBe(minutesToClay(60));
		expect(result.bricks).toBeNull();
	});
});

describe('calculatePayouts', () => {
	const beforeBeta = new Date('2025-01-01');
	const afterBeta = new Date('2026-01-01');

	it('calculates payouts for a pre-beta project', () => {
		const result = calculatePayouts(120, 10, 1, false, beforeBeta);
		const expectedMinutes = calculateMinutes(120, 10);
		const expectedCurrency = calculateCurrencyPayout(expectedMinutes, false, beforeBeta);

		expect(result.clay).toBe(expectedCurrency.clay);
		expect(result.bricks).toBe(expectedCurrency.bricks);
		expect(result.shopScore).toBe(calculateShopScore(120, 1) * BETA_MULTIPLIER);
	});

	it('calculates payouts for a post-beta project with base printer', () => {
		const result = calculatePayouts(120, 10, 1, true, afterBeta);
		const expectedMinutes = calculateMinutes(120, 10);
		const expectedCurrency = calculateCurrencyPayout(expectedMinutes, true, afterBeta);

		expect(result.clay).toBe(expectedCurrency.clay);
		expect(result.bricks).toBe(expectedCurrency.bricks);
		expect(result.shopScore).toBe(calculateShopScore(120, 1));
	});

	it('calculates payouts for a post-beta project without base printer', () => {
		const result = calculatePayouts(120, 10, 1, false, afterBeta);
		const expectedMinutes = calculateMinutes(120, 10);
		const expectedCurrency = calculateCurrencyPayout(expectedMinutes, false, afterBeta);

		expect(result.clay).toBe(expectedCurrency.clay);
		expect(result.bricks).toBe(expectedCurrency.bricks);
		expect(result.shopScore).toBe(calculateShopScore(120, 1));
	});

	it('applies shop score multiplier correctly', () => {
		const multiplier = 2.5;
		const result = calculatePayouts(60, 0, multiplier, false, afterBeta);
		expect(result.shopScore).toBe(calculateShopScore(60, multiplier));
	});
});
