import { describe, it, expect } from 'vitest';
import { isValidUrl, formatMinutes, calculateMarketPrice, getProjectLinkType } from './utils';

describe('isValidUrl', () => {
	it('returns true for valid HTTP URLs', () => {
		expect(isValidUrl('https://example.com')).toBe(true);
		expect(isValidUrl('http://example.com')).toBe(true);
	});

	it('returns true for URLs with paths and query params', () => {
		expect(isValidUrl('https://example.com/path?foo=bar')).toBe(true);
	});

	it('returns false for invalid URLs', () => {
		expect(isValidUrl('')).toBe(false);
		expect(isValidUrl('not a url')).toBe(false);
		expect(isValidUrl('://missing')).toBe(false);
	});
});

describe('formatMinutes', () => {
	it('formats zero minutes', () => {
		expect(formatMinutes(0)).toBe('0h 0min');
	});

	it('formats minutes less than an hour', () => {
		expect(formatMinutes(30)).toBe('0h 30min');
	});

	it('formats exact hours', () => {
		expect(formatMinutes(120)).toBe('2h 0min');
	});

	it('formats hours and minutes', () => {
		expect(formatMinutes(90)).toBe('1h 30min');
		expect(formatMinutes(150)).toBe('2h 30min');
	});

	it('handles null by treating it as 0', () => {
		expect(formatMinutes(null)).toBe('0h 0min');
	});
});

describe('calculateMarketPrice', () => {
	const minPrice = 10;
	const maxPrice = 100;
	const minShopScore = 0;
	const maxShopScore = 100;

	it('returns maxPrice when userShopScore is at or below minShopScore', () => {
		expect(calculateMarketPrice(minPrice, maxPrice, minShopScore, maxShopScore, 0)).toBe(maxPrice);
		expect(calculateMarketPrice(minPrice, maxPrice, minShopScore, maxShopScore, -10)).toBe(
			maxPrice
		);
	});

	it('returns minPrice when userShopScore is at or above maxShopScore', () => {
		expect(calculateMarketPrice(minPrice, maxPrice, minShopScore, maxShopScore, 100)).toBe(
			minPrice
		);
		expect(calculateMarketPrice(minPrice, maxPrice, minShopScore, maxShopScore, 150)).toBe(
			minPrice
		);
	});

	it('returns an interpolated price for scores between min and max', () => {
		// At midpoint (50), the price should be halfway: round(-0.9 * 50 + 100) = round(55) = 55
		expect(calculateMarketPrice(minPrice, maxPrice, minShopScore, maxShopScore, 50)).toBe(55);
	});

	it('returns a rounded value', () => {
		// score=33 => round(-0.9*33 + 100) = round(70.3) = 70
		expect(calculateMarketPrice(minPrice, maxPrice, minShopScore, maxShopScore, 33)).toBe(70);
	});
});

describe('getProjectLinkType', () => {
	it('returns onshape for onshape URLs', () => {
		expect(getProjectLinkType('url', 'https://cad.onshape.com/documents/123', null)).toBe(
			'onshape'
		);
	});

	it('returns fusion-link for autodesk360 URLs', () => {
		expect(getProjectLinkType('url', 'https://autodesk360.com/share/123', null)).toBe(
			'fusion-link'
		);
	});

	it('returns fusion-file for .f3d uploads', () => {
		expect(getProjectLinkType('upload', null, 'model.f3d')).toBe('fusion-file');
	});

	it('returns fusion-file for .f3z uploads', () => {
		expect(getProjectLinkType('upload', null, 'model.f3z')).toBe('fusion-file');
	});

	it('returns blender for .blend uploads', () => {
		expect(getProjectLinkType('upload', null, 'model.blend')).toBe('blender');
	});

	it('returns blender for .blend1 uploads', () => {
		expect(getProjectLinkType('upload', null, 'model.blend1')).toBe('blender');
	});

	it('returns freecad for .fcstd uploads (case insensitive)', () => {
		expect(getProjectLinkType('upload', null, 'model.fcstd')).toBe('freecad');
		expect(getProjectLinkType('upload', null, 'model.FCSTD')).toBe('freecad');
	});

	it('returns solvespace for .slvs uploads', () => {
		expect(getProjectLinkType('upload', null, 'model.slvs')).toBe('solvespace');
	});

	it('returns unknown for unrecognized types', () => {
		expect(getProjectLinkType('upload', null, 'model.stl')).toBe('unknown');
		expect(getProjectLinkType('url', 'https://example.com', null)).toBe('unknown');
		expect(getProjectLinkType(null, null, null)).toBe('unknown');
	});
});
