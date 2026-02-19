/*
    {
        name: 'name',
        longName: 'long name',
        description: 'interesting description',
		isBasePrinter: false,
		singlePurchase: true,
		maxBrick: 500,
		minBrick: 50,
		minShopScore: 0,
		maxShopScore: 5000,
		minRequiredShopScore: 0,
        x: 50,
        y: 50,
        children: []
	}
*/

export const printers: Printer[] = [
	{
		name: 'A1 mini',
		longName: 'Bambu Lab A1 mini',
		description: 'like the A1 but cheaper',
		isBasePrinter: true,
		singlePurchase: true,
		minRequiredShopScore: 0,
		x: 59.3,
		y: 41.27,
		children: [
			{
				name: 'AMS Lite',
				longName: 'Bambu Lab A1 mini + AMS lite',
				description: 'multicolour printing!',
				isBasePrinter: false,
				singlePurchase: true,
				maxBrick: 500,
				minBrick: 450,
				minShopScore: 0,
				maxShopScore: 5000,
				minRequiredShopScore: 0,
				x: 53.5,
				y: 36.23,
				children: []
			},
			{
				name: 'A1',
				longName: 'Bambu Lab A1',
				description: 'like the A1 mini but bigger',
				isBasePrinter: false,
				singlePurchase: true,
				maxBrick: 300,
				minBrick: 270,
				minShopScore: 0,
				maxShopScore: 5000,
				minRequiredShopScore: 0,
				x: 64.45,
				y: 38.35,
				children: [
					{
						name: 'AMS Lite',
						longName: 'Bambu Lab A1 + AMS lite',
						description: 'multicolour printing!',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 500,
						minBrick: 450,
						minShopScore: 0,
						maxShopScore: 5000,
						minRequiredShopScore: 0,
						x: 72.97,
						y: 41.18,
						children: []
					},
					{
						name: 'P1S',
						longName: 'Bambu Lab P1S',
						description: 'P1, s-type!',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 600,
						minBrick: 540,
						minShopScore: 0,
						maxShopScore: 5000,
						minRequiredShopScore: 0,
						x: 72.33,
						y: 32.97,
						children: [
							{
								name: 'AMS',
								longName: 'Bambu Lab P1S + AMS',
								description: 'multicolour printing!',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 600,
								minBrick: 540,
								minShopScore: 0,
								maxShopScore: 5000,
								minRequiredShopScore: 0,
								x: 67,
								y: 26.4,
								children: [
									{
										name: 'AMS Pro 2',
										longName: 'Bambu Lab P1S + AMS Pro 2',
										description: 'multicolour printing, pro edition!',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 450,
										minBrick: 420,
										minShopScore: 0,
										maxShopScore: 5000,
										minRequiredShopScore: 0,
										x: 60,
										y: 20.95,
										children: []
									}
								]
							},
							{
								name: 'P2S',
								longName: 'Bambu Lab P2S',
								description: 'P1S but better',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 630,
								minBrick: 570,
								minShopScore: 0,
								maxShopScore: 5000,
								minRequiredShopScore: 0,
								x: 84.05,
								y: 15.15,
								children: [
									{
										name: 'AMS Pro 2',
										longName: 'Bambu Lab P2S + AMS Pro 2',
										description: 'multicolour printing, pro edition!',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 1000,
										minBrick: 900,
										minShopScore: 0,
										maxShopScore: 10000,
										minRequiredShopScore: 0,
										x: 94.6,
										y: 13.91,
										children: []
									},
									{
										name: 'H2S',
										longName: 'Bambu Lab H2S',
										description: 'P2S but even better yet',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 3200,
										minBrick: 3000,
										minShopScore: 0,
										maxShopScore: 10000,
										minRequiredShopScore: 0,
										x: 92.03,
										y: 6,
										children: []
									}
								]
							}
						]
					}
				]
			}
		]
	},
	{
		name: 'Ender 3 V3 SE',
		longName: 'Creality Ender 3 V3 SE',
		description: 'ender 3',
		isBasePrinter: true,
		singlePurchase: true,
		minRequiredShopScore: 0,
		x: 39.4,
		y: 41.25,
		children: [
			{
				name: 'Ender 3 V3 KE',
				longName: 'Creality Ender 3 V3 KE',
				description: 'ender 3 but better',
				isBasePrinter: false,
				singlePurchase: true,
				maxBrick: 350,
				minBrick: 300,
				minShopScore: 0,
				maxShopScore: 5000,
				minRequiredShopScore: 0,
				x: 40.2,
				y: 33.62,
				children: [
					{
						name: 'Ender 3 V3',
						longName: 'Creality Ender 3 V3',
						description: 'ender 3 but even better',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 250,
						minBrick: 210,
						minShopScore: 0,
						maxShopScore: 5000,
						minRequiredShopScore: 0,
						x: 31.6,
						y: 25.4,
						children: [
							{
								name: 'K2',
								longName: 'Creality K2',
								description: 'pretty good printer',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 450,
								minBrick: 350,
								minShopScore: 0,
								maxShopScore: 5000,
								minRequiredShopScore: 0,
								x: 21.3,
								y: 29.65,
								children: [
									{
										name: 'K2 COMBO',
										longName: 'Creality K2 COMBO',
										description: 'pretty good printer with multi material printing',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 650,
										minBrick: 600,
										minShopScore: 0,
										maxShopScore: 5000,
										minRequiredShopScore: 0,
										x: 9.4,
										y: 35.7,
										children: []
									},
									{
										name: 'K2 PRO',
										longName: 'Creality K2 PRO',
										description: 'pretty good printer pro',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 2000,
										minBrick: 1800,
										minShopScore: 0,
										maxShopScore: 10000,
										minRequiredShopScore: 0,
										x: 19.7,
										y: 22.5,
										children: [
											{
												name: 'K2 PRO COMBO',
												longName: 'Creality K2 PRO COMBO',
												description: 'pretty good printer pro with multi material printing',
												isBasePrinter: false,
												singlePurchase: true,
												maxBrick: 800,
												minBrick: 750,
												minShopScore: 0,
												maxShopScore: 5000,
												minRequiredShopScore: 0,
												x: 4.6,
												y: 20.12,
												children: []
											},
											{
												name: 'K2 PLUS',
												longName: 'Creality K2 PLUS',
												description: 'pretty good printer pro++',
												isBasePrinter: false,
												singlePurchase: true,
												maxBrick: 700,
												minBrick: 650,
												minShopScore: 0,
												maxShopScore: 5000,
												minRequiredShopScore: 0,
												x: 15.7,
												y: 6.95,
												children: [
													{
														name: 'K2 PLUS COMBO',
														longName: 'Creality K2 PLUS COMBO',
														description: 'pretty good printer pro++ with multi material printing',
														isBasePrinter: false,
														singlePurchase: true,
														maxBrick: 1000,
														minBrick: 900,
														minShopScore: 0,
														maxShopScore: 10000,
														minRequiredShopScore: 0,
														x: 8.71,
														y: 3.4,
														children: []
													}
												]
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	},
	{
		name: 'Neptune 4',
		longName: 'Elegoo Neptune 4',
		description: 'le goo',
		isBasePrinter: true,
		singlePurchase: true,
		minRequiredShopScore: 0,
		x: 56.3,
		y: 59.8,
		children: [
			{
				name: 'Neptune 4 Pro',
				longName: 'Elegoo Neptune 4 Pro',
				description: 'le goo, pro edition',
				isBasePrinter: false,
				singlePurchase: true,
				maxBrick: 110,
				minBrick: 90,
				minShopScore: 0,
				maxShopScore: 5000,
				minRequiredShopScore: 0,
				x: 65.35,
				y: 67.45,
				children: [
					{
						name: 'Centauri Carbon',
						longName: 'Elegoo Centauri Carbon',
						description: 'le goo, centauri version',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 350,
						minBrick: 300,
						minShopScore: 0,
						maxShopScore: 5000,
						minRequiredShopScore: 0,
						x: 57.7,
						y: 69.9,
						children: [
							{
								name: 'Bundle',
								longName: 'Elegoo Centauri Carbon Bundle',
								description: 'le goo, centauri version with multi material',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 420,
								minBrick: 390,
								minShopScore: 0,
								maxShopScore: 5000,
								minRequiredShopScore: 0,
								x: 52.2,
								y: 76.78,
								children: []
							}
						]
					},
					{
						name: 'Neptune 4 Plus',
						longName: 'Elegoo Neptune 4 Plus',
						description: 'le goo plus',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 420,
						minBrick: 390,
						minShopScore: 0,
						maxShopScore: 5000,
						minRequiredShopScore: 0,
						x: 67.3,
						y: 76.67,
						children: [
							{
								name: 'Bundle',
								longName: 'Elegoo Neptune 4 Plus Bundle',
								description: 'le goo plus with multi material',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 400,
								minBrick: 360,
								minShopScore: 0,
								maxShopScore: 5000,
								minRequiredShopScore: 0,
								x: 52.95,
								y: 85.6,
								children: []
							},
							{
								name: 'Neptune 4 MAX',
								longName: 'Elegoo Neptune 4 MAX',
								description: 'le goo MAX 🔥',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 470,
								minBrick: 420,
								minShopScore: 0,
								maxShopScore: 5000,
								minRequiredShopScore: 0,
								x: 73.1,
								y: 83.1,
								children: [
									{
										name: 'Bundle',
										longName: 'Elegoo Neptune 4 MAX Bundle',
										description: 'le goo max with multi material',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 250,
										minBrick: 210,
										minShopScore: 0,
										maxShopScore: 5000,
										minRequiredShopScore: 0,
										x: 63,
										y: 84.5,
										children: []
									},
									{
										name: 'Orangestorm Giga',
										longName: 'Elegoo Orangestorm Giga',
										description: 'massive ahh printer with a price to match',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 8000,
										minBrick: 7500,
										minShopScore: 0,
										maxShopScore: 5000,
										minRequiredShopScore: 0,
										x: 95,
										y: 94.4,
										children: []
									}
								]
							}
						]
					}
				]
			}
		]
	},
	{
		name: 'Kobra 3',
		longName: 'Anycubic Kobra 3',
		description: 'snake cubes',
		isBasePrinter: true,
		singlePurchase: true,
		minRequiredShopScore: 0,
		x: 42.9,
		y: 55,
		children: [
			{
				name: 'Kobra 3 V2',
				longName: 'Anycubic Kobra 3 V2',
				description: 'snake cubes v2',
				isBasePrinter: false,
				singlePurchase: true,
				maxBrick: 180,
				minBrick: 150,
				minShopScore: 0,
				maxShopScore: 5000,
				minRequiredShopScore: 0,
				x: 34.5,
				y: 65.2,
				children: [
					{
						name: 'COMBO',
						longName: 'Anycubic Kobra 3 V2 COMBO',
						description: 'snake cubes v2 with multi material',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 400,
						minBrick: 360,
						minShopScore: 0,
						maxShopScore: 5000,
						minRequiredShopScore: 0,
						x: 25.85,
						y: 65.3,
						children: []
					},
					{
						name: 'Kobra 3 Max',
						longName: 'Anycubic Kobra 3 Max',
						description: 'snake cubes to the max',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 900,
						minBrick: 750,
						minShopScore: 0,
						maxShopScore: 5000,
						minRequiredShopScore: 0,
						x: 37.1,
						y: 71.5,
						children: [
							{
								name: 'COMBO',
								longName: 'Anycubic Kobra 3 Max COMBO',
								description: 'snake cubes max with multi material',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 700,
								minBrick: 600,
								minShopScore: 0,
								maxShopScore: 5000,
								minRequiredShopScore: 0,
								x: 30.7,
								y: 79.3,
								children: []
							}
						]
					},
					{
						name: 'Kobra X',
						longName: 'Anycubic Kobra X',
						description: 'snake cubes in a cross',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 300,
						minBrick: 270,
						minShopScore: 0,
						maxShopScore: 5000,
						minRequiredShopScore: 0,
						x: 25.9,
						y: 60.3,
						children: [
							{
								name: 'COMBO',
								longName: 'Anycubic Kobra X COMBO',
								description: 'snake cubes in a cross, now with multi material',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 500,
								minBrick: 450,
								minShopScore: 0,
								maxShopScore: 5000,
								minRequiredShopScore: 0,
								x: 17.8,
								y: 51.1,
								children: [
									{
										name: 'COMBO + Ace 2 Pro',
										longName: 'Anycubic Kobra X COMBO + Ace 2 Pro',
										description: 'snake cubes in a cross, now with multi material and spy cam',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 700,
										minBrick: 675,
										minShopScore: 0,
										maxShopScore: 5000,
										minRequiredShopScore: 0,
										x: 14.3,
										y: 41.4,
										children: []
									}
								]
							}
						]
					},
					{
						name: 'S1',
						longName: 'Anycubic S1',
						description: 'anycubic s1',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 350,
						minBrick: 300,
						minShopScore: 0,
						maxShopScore: 5000,
						minRequiredShopScore: 0,
						x: 27.35,
						y: 71,
						children: [
							{
								name: 'COMBO',
								longName: 'Anycubic S1 COMBO',
								description: 'anycubic s1, now with multi material',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 360,
								minBrick: 330,
								minShopScore: 0,
								maxShopScore: 5000,
								minRequiredShopScore: 0,
								x: 18.8,
								y: 66.25,
								children: []
							},
							{
								name: 'S1 Max',
								longName: 'Anycubic S1 Max',
								description: 'anycubic s1 max',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 1300,
								minBrick: 1200,
								minShopScore: 0,
								maxShopScore: 10000,
								minRequiredShopScore: 0,
								x: 22,
								y: 74.95,
								children: [
									{
										name: 'COMBO',
										longName: 'Anycubic S1 Max COMBO',
										description: 'anycubic s1 max, with multi material',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 800,
										minBrick: 750,
										minShopScore: 0,
										maxShopScore: 5000,
										minRequiredShopScore: 0,
										x: 8.1,
										y: 83.75,
										children: [
											{
												name: 'COMBO + Ace Pro 2',
												longName: 'Anycubic S1 Max COMBO + Ace Pro 2',
												description: 'anycubic s1 max, with multi material and spy cam',
												isBasePrinter: false,
												singlePurchase: true,
												maxBrick: 800,
												minBrick: 750,
												minShopScore: 0,
												maxShopScore: 5000,
												minRequiredShopScore: 0,
												x: 4,
												y: 91.35,
												children: []
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	},
	{
		name: 'Buy your own',
		longName: 'Buy your own printer!',
		description: '$180 to buy your own printer',
		isBasePrinter: true,
		singlePurchase: true,
		minRequiredShopScore: 0,
		x: 60.8,
		y: 51.15,
		children: [
			{
				name: '+$10',
				longName: '$10 top up',
				description: 'more yummy money',
				isBasePrinter: false,
				singlePurchase: false,
				maxBrick: 40,
				minBrick: 35,
				minShopScore: 0,
				maxShopScore: 5000,
				minRequiredShopScore: 0,
				x: 69.3,
				y: 56.06,
				children: []
			},
			{
				name: '+$50',
				longName: '$50 top up',
				description: 'more yummy money pro',
				isBasePrinter: false,
				singlePurchase: false,
				maxBrick: 180,
				minBrick: 170,
				minShopScore: 0,
				maxShopScore: 5000,
				minRequiredShopScore: 0,
				x: 77.9,
				y: 53.5,
				children: []
			},
			{
				name: '+$100',
				longName: '$100 top up',
				description: 'more yummy money pro max',
				isBasePrinter: false,
				singlePurchase: false,
				maxBrick: 345,
				minBrick: 330,
				minShopScore: 0,
				maxShopScore: 5000,
				minRequiredShopScore: 0,
				x: 90.9,
				y: 55.95,
				children: []
			},
			{
				name: '+$250',
				longName: '$250 top up',
				description: 'more yummy money pro max ultra',
				isBasePrinter: false,
				singlePurchase: false,
				maxBrick: 760,
				minBrick: 755,
				minShopScore: 0,
				maxShopScore: 5000,
				minRequiredShopScore: 0,
				x: 88.7,
				y: 66.35,
				children: []
			}
		]
	}
];

export const printersSingleList = combinePrinterList(printers, []);

type Printer = {
	name: string;
	longName: string;
	description: string;
	isBasePrinter: boolean;
	singlePurchase: boolean;
	maxBrick?: number;
	minBrick?: number;
	minShopScore?: number;
	maxShopScore?: number;
	minRequiredShopScore: number;
	x: number;
	y: number;
	children: Printer[];
};

export function combinePrinterList(printers: Printer[], path: number[]) {
	const combinedPrinters: {
		x: number;
		y: number;
		name: string;
		path: number[];
	}[] = [];

	printers.forEach((printer: Printer, index: number) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { children: _, ...printerWithoutChildren } = printer;

		combinedPrinters.push(
			{
				...printerWithoutChildren,
				path: [...path, index]
			},
			...combinePrinterList(printer.children, [...path, index])
		);
	});

	return combinedPrinters;
}
