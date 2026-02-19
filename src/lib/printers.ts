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
        x: 50,
        y: 50,
        children: []
	}
*/

export const printers: Printer[] = [
	{
		name: 'A1 mini',
		longName: 'Bambu Lab A1 mini',
		description: "Small but sturdy, a beginner's best friend",
		isBasePrinter: true,
		singlePurchase: true,
		x: 59.3,
		y: 41.27,
		children: [
			{
				name: 'AMS Lite',
				longName: 'Bambu Lab A1 mini + AMS lite',
				description: 'Multicolour printing!',
				isBasePrinter: false,
				singlePurchase: true,
				maxBrick: 500,
				minBrick: 450,
				minShopScore: 0,
				maxShopScore: 5000,

				x: 53.5,
				y: 36.23,
				children: []
			},
			{
				name: 'A1',
				longName: 'Bambu Lab A1',
				description: 'A beginner\'s "better" best friend.',
				isBasePrinter: false,
				singlePurchase: true,
				maxBrick: 300,
				minBrick: 270,
				minShopScore: 0,
				maxShopScore: 5000,

				x: 64.45,
				y: 38.35,
				children: [
					{
						name: 'AMS Lite',
						longName: 'Bambu Lab A1 + AMS lite',
						description: 'Multicolour printing!',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 500,
						minBrick: 450,
						minShopScore: 0,
						maxShopScore: 5000,

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

						x: 72.33,
						y: 32.97,
						children: [
							{
								name: 'AMS',
								longName: 'Bambu Lab P1S + AMS',
								description: 'Multicolour printing!',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 600,
								minBrick: 540,
								minShopScore: 0,
								maxShopScore: 5000,

								x: 67,
								y: 26.4,
								children: [
									{
										name: 'AMS Pro 2',
										longName: 'Bambu Lab P1S + AMS Pro 2',
										description: 'Multicolour printing, pro edition!',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 450,
										minBrick: 420,
										minShopScore: 3000,
										maxShopScore: 10000,

										x: 60,
										y: 20.95,
										children: []
									}
								]
							},
							{
								name: 'P2S',
								longName: 'Bambu Lab P2S',
								description:
									'A refreshed version of the P1S. It contains all the features of the P1S and more!',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 630,
								minBrick: 570,
								minShopScore: 0,
								maxShopScore: 5000,

								x: 84.05,
								y: 15.15,
								children: [
									{
										name: 'AMS Pro 2',
										longName: 'Bambu Lab P2S + AMS Pro 2',
										description: 'Multicolour printing, pro edition!',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 1000,
										minBrick: 900,
										minShopScore: 3000,
										maxShopScore: 10000,

										x: 94.6,
										y: 13.91,
										children: []
									},
									{
										name: 'H2S',
										longName: 'Bambu Lab H2S',
										description:
											'A professional printer designed to be able to print whatever your heart desires!',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 3200,
										minBrick: 3000,
										minShopScore: 3000,
										maxShopScore: 10000,

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
		description: 'God will only know what you do to this thing',
		isBasePrinter: true,
		singlePurchase: true,
		x: 39.4,
		y: 41.25,
		children: [
			{
				name: 'Ender 3 V3 KE',
				longName: 'Creality Ender 3 V3 KE',
				description: 'Cook an egg on this!',
				isBasePrinter: false,
				singlePurchase: true,
				maxBrick: 350,
				minBrick: 300,
				minShopScore: 0,
				maxShopScore: 5000,

				x: 40.2,
				y: 33.62,
				children: [
					{
						name: 'Ender 3 V3',
						longName: 'Creality Ender 3 V3',
						description: 'The 3rd version of the ender 3!',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 250,
						minBrick: 210,
						minShopScore: 0,
						maxShopScore: 5000,

						x: 31.6,
						y: 25.4,
						children: [
							{
								name: 'K2',
								longName: 'Creality K2',
								description: 'The K stands for killer printer',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 450,
								minBrick: 350,
								minShopScore: 0,
								maxShopScore: 5000,

								x: 21.3,
								y: 29.65,
								children: [
									{
										name: 'K2 COMBO',
										longName: 'Creality K2 COMBO',
										description: 'Get multicolor printing with this!',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 650,
										minBrick: 600,
										minShopScore: 0,
										maxShopScore: 5000,

										x: 9.4,
										y: 35.7,
										children: []
									},
									{
										name: 'K2 PRO',
										longName: 'Creality K2 PRO',
										description: 'A professional 3d printer designed to be a fit of all needs!',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 2000,
										minBrick: 1800,
										minShopScore: 3000,
										maxShopScore: 10000,

										x: 19.7,
										y: 22.5,
										children: [
											{
												name: 'K2 PRO COMBO',
												longName: 'Creality K2 PRO COMBO',
												description: 'Get multicolor printing with this!',
												isBasePrinter: false,
												singlePurchase: true,
												maxBrick: 800,
												minBrick: 750,
												minShopScore: 3000,
												maxShopScore: 10000,

												x: 4.6,
												y: 20.12,
												children: []
											},
											{
												name: 'K2 PLUS',
												longName: 'Creality K2 PLUS',
												description:
													'A flagship 3D printer. It has pretty much everything you would most likely need!',
												isBasePrinter: false,
												singlePurchase: true,
												maxBrick: 700,
												minBrick: 650,
												minShopScore: 3000,
												maxShopScore: 10000,

												x: 15.7,
												y: 6.95,
												children: [
													{
														name: 'K2 PLUS COMBO',
														longName: 'Creality K2 PLUS COMBO',
														description: 'Get multicolor printing with this!',
														isBasePrinter: false,
														singlePurchase: true,
														maxBrick: 1000,
														minBrick: 900,
														minShopScore: 3000,
														maxShopScore: 10000,

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
		description: 'An awesome printer that is amazing value for the price!',
		isBasePrinter: true,
		singlePurchase: true,
		x: 56.3,
		y: 59.8,
		children: [
			{
				name: 'Neptune 4 Pro',
				longName: 'Elegoo Neptune 4 Pro',
				description: 'For when you decide that you need pro features!',
				isBasePrinter: false,
				singlePurchase: true,
				maxBrick: 110,
				minBrick: 90,
				minShopScore: 0,
				maxShopScore: 5000,

				x: 65.35,
				y: 67.45,
				children: [
					{
						name: 'Centauri Carbon',
						longName: 'Elegoo Centauri Carbon',
						description: 'Print carbon fibre with this beast of a 3d printer!',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 350,
						minBrick: 300,
						minShopScore: 0,
						maxShopScore: 5000,

						x: 57.7,
						y: 69.9,
						children: [
							{
								name: 'Bundle',
								longName: 'Elegoo Centauri Carbon Bundle',
								description: 'Carbon fibre beast with multi material printing!',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 420,
								minBrick: 390,
								minShopScore: 0,
								maxShopScore: 5000,

								x: 52.2,
								y: 76.78,
								children: []
							}
						]
					},
					{
						name: 'Neptune 4 Plus',
						longName: 'Elegoo Neptune 4 Plus',
						description: 'For when you decide that you need plus features!',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 420,
						minBrick: 390,
						minShopScore: 0,
						maxShopScore: 5000,

						x: 67.3,
						y: 76.67,
						children: [
							{
								name: 'Bundle',
								longName: 'Elegoo Neptune 4 Plus Bundle',
								description: 'Get multicolour printing with this bundle!',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 400,
								minBrick: 360,
								minShopScore: 0,
								maxShopScore: 5000,

								x: 52.95,
								y: 85.6,
								children: []
							},
							{
								name: 'Neptune 4 MAX',
								longName: 'Elegoo Neptune 4 MAX',
								description: 'For when you decide that you need MAX features!',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 470,
								minBrick: 420,
								minShopScore: 3000,
								maxShopScore: 10000,

								x: 73.1,
								y: 83.1,
								children: [
									{
										name: 'Bundle',
										longName: 'Elegoo Neptune 4 MAX Bundle',
										description: 'Get multicolour printing with this bundle!',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 250,
										minBrick: 210,
										minShopScore: 3000,
										maxShopScore: 10000,

										x: 63,
										y: 84.5,
										children: []
									},
									{
										name: 'Orangestorm Giga',
										longName: 'Elegoo Orangestorm Giga',
										description: 'Why?',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 8000,
										minBrick: 7500,
										minShopScore: 3000,
										maxShopScore: 10000,

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
		description: 'This printer does not slither away',
		isBasePrinter: true,
		singlePurchase: true,
		x: 42.9,
		y: 55,
		children: [
			{
				name: 'Kobra 3 V2',
				longName: 'Anycubic Kobra 3 V2',
				description: 'A sssssuper cool V2 of the original Kobra 3',
				isBasePrinter: false,
				singlePurchase: true,
				maxBrick: 180,
				minBrick: 150,
				minShopScore: 0,
				maxShopScore: 5000,

				x: 34.5,
				y: 65.2,
				children: [
					{
						name: 'COMBO',
						longName: 'Anycubic Kobra 3 V2 COMBO',
						description: 'Get multicolour printing with this bundle!',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 400,
						minBrick: 360,
						minShopScore: 0,
						maxShopScore: 5000,

						x: 25.85,
						y: 65.3,
						children: []
					},
					{
						name: 'Kobra 3 Max',
						longName: 'Anycubic Kobra 3 Max',
						description: 'Print sssnakes with this printer!',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 900,
						minBrick: 750,
						minShopScore: 3000,
						maxShopScore: 10000,

						x: 37.1,
						y: 71.5,
						children: [
							{
								name: 'COMBO',
								longName: 'Anycubic Kobra 3 Max COMBO',
								description: 'Get multicolour printing with this bundle!',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 700,
								minBrick: 600,
								minShopScore: 3000,
								maxShopScore: 10000,

								x: 30.7,
								y: 79.3,
								children: []
							}
						]
					},
					{
						name: 'Kobra X',
						longName: 'Anycubic Kobra X',
						description: 'A beefy cool printer that can print up to 19 colors?!!',
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 300,
						minBrick: 270,
						minShopScore: 0,
						maxShopScore: 5000,

						x: 25.9,
						y: 60.3,
						children: [
							{
								name: 'COMBO',
								longName: 'Anycubic Kobra X COMBO',
								description: 'Get multicolour printing with this bundle (Prints 7 colors)!',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 500,
								minBrick: 450,
								minShopScore: 0,
								maxShopScore: 5000,

								x: 17.8,
								y: 51.1,
								children: [
									{
										name: 'COMBO + Ace 2 Pro',
										longName: 'Anycubic Kobra X COMBO + Ace 2 Pro',
										description: 'Get multicolour printing with this bundle! (Prints 11 colors)!',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 700,
										minBrick: 675,
										minShopScore: 3000,
										maxShopScore: 10000,

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
						description: "Get this BEAST of a 3D printer! It's enclosed too!",
						isBasePrinter: false,
						singlePurchase: true,
						maxBrick: 350,
						minBrick: 300,
						minShopScore: 0,
						maxShopScore: 5000,

						x: 27.35,
						y: 71,
						children: [
							{
								name: 'COMBO',
								longName: 'Anycubic S1 COMBO',
								description: 'Get multicolour printing with this bundle!',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 360,
								minBrick: 330,
								minShopScore: 0,
								maxShopScore: 5000,

								x: 18.8,
								y: 66.25,
								children: []
							},
							{
								name: 'S1 Max',
								longName: 'Anycubic S1 Max',
								description: 'An even beastlier enclosed 3d printer!',
								isBasePrinter: false,
								singlePurchase: true,
								maxBrick: 1300,
								minBrick: 1200,
								minShopScore: 3000,
								maxShopScore: 10000,

								x: 22,
								y: 74.95,
								children: [
									{
										name: 'COMBO',
										longName: 'Anycubic S1 Max COMBO',
										description: 'Get multicolour printing with this bundle!',
										isBasePrinter: false,
										singlePurchase: true,
										maxBrick: 800,
										minBrick: 750,
										minShopScore: 3000,
										maxShopScore: 10000,

										x: 8.1,
										y: 83.75,
										children: [
											{
												name: 'COMBO + Ace Pro 2',
												longName: 'Anycubic S1 Max COMBO + Ace Pro 2',
												description:
													'Get PRO multicolour printing with this bundle! (prints up to 8 colours!)',
												isBasePrinter: false,
												singlePurchase: true,
												maxBrick: 800,
												minBrick: 750,
												minShopScore: 3000,
												maxShopScore: 10000,

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
		description: '$180 to buy (or build) your own printer',
		isBasePrinter: true,
		singlePurchase: true,
		x: 60.8,
		y: 51.15,
		children: [
			{
				name: '+$10',
				longName: '$10 top up',
				description: 'More yummy money',
				isBasePrinter: false,
				singlePurchase: false,
				maxBrick: 40,
				minBrick: 35,
				minShopScore: 0,
				maxShopScore: 5000,

				x: 69.3,
				y: 56.06,
				children: []
			},
			{
				name: '+$50',
				longName: '$50 top up',
				description: 'More yummy money pro',
				isBasePrinter: false,
				singlePurchase: false,
				maxBrick: 180,
				minBrick: 170,
				minShopScore: 0,
				maxShopScore: 5000,

				x: 77.9,
				y: 53.5,
				children: []
			},
			{
				name: '+$100',
				longName: '$100 top up',
				description: 'More yummy money pro max',
				isBasePrinter: false,
				singlePurchase: false,
				maxBrick: 345,
				minBrick: 330,
				minShopScore: 3000,
				maxShopScore: 10000,

				x: 90.9,
				y: 55.95,
				children: []
			},
			{
				name: '+$250',
				longName: '$250 top up',
				description: 'More yummy money pro max ultra',
				isBasePrinter: false,
				singlePurchase: false,
				maxBrick: 760,
				minBrick: 755,
				minShopScore: 3000,
				maxShopScore: 10000,

				x: 88.7,
				y: 66.35,
				children: []
			}
		]
	}
];

export const printersSingleList = combinePrinterList(printers, []);

export type Printer = {
	name: string;
	longName: string;
	description: string;
	isBasePrinter: boolean;
	singlePurchase: boolean;
	maxBrick?: number;
	minBrick?: number;
	minShopScore?: number;
	maxShopScore?: number;
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

export function getPrinterFromPath(path: number[], printerList: Printer[] = printers) {
	if (path.length === 1) {
		return printerList[path[0]];
	} else {
		return getPrinterFromPath(path.slice(1), printerList[path[0]].children);
	}
}

export function getPurchaseablePrinters(current: number[]) {
	return (current.length === 0 ? printers : getPrinterFromPath(current).children).map(
		(_value, index) => [...current, index]
	);
}
