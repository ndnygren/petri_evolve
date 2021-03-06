
var petri_examples = [{},{},{},{}];

petri_examples[0].network = [
	{
		"name": "h_out",
		"input": ["heat"],
		"output": [],
		"rate": 1.0
	},
	{
		"name": "h_in",
		"input": [],
		"output": [ "heat" ],
		"rate": 1.0
	}
];
petri_examples[0].initial =
[
	{
		"initial":{"heat":50.0},
		"criteria": [{"time":100, "state": "heat", "quant": 20.0},
		{"time":20, "state": "heat", "quant": 30.0},
		{"time":80, "state": "heat", "quant": 20.0}]
	}
/*	{
		"initial":{"heat":0.0},
		"criteria": [{"time":100, "state": "heat", "quant": 20.0},
		{"time":80, "state": "heat", "quant": 20.0}]
	}*/
];
petri_examples[0].colors = {"heat": "red"};

petri_examples[1].network=[
	{
		"name": "die",
		"input": ["yeast"],
		"output": [],
		"rate": 0.000013
	},
	{
		"name": "reproduce",
		"input": ["yeast", "atp","atp","atp"],
		"output": ["yeast","yeast"],
		"rate": 0.0001
	},
	{
		"name": "r1",
		"input": ["glucose", "yeast"],
		"output": ["yeast","atp","atp","pyruvate","pyruvate"],
		"rate": 0.00096
	},
	{
		"name": "r2",
		"input": ["pyruvate","pyruvate"],
		"output": ["acetaldehyde","acetaldehyde","co2","co2"],
		"rate": 1.5
	},
	{
		"name": "r3",
		"input": ["acetaldehyde","acetaldehyde"],
		"output": ["ethanol","ethanol"],
		"rate": 1.5
	},
/*
	{
		"name": "activity",
		"input": ["yeast",],
		"output": ["yeast","heat"],
		"rate": 0.00015
	},
	{
		"name": "h_out",
		"input": [ "heat" ],
		"output": [],
		"rate": 0.053196589691781926
	},
	{
		"name": "h_in",
		"input": [],
		"output": [ "heat" ],
		"rate": 1.0502397547975513
	},
	*/
	{
		"name": "poison",
		"input": [ "ethanol", "yeast" ],
		"output": [ "ethanol" ],
		"rate": 0.00007349
	}
	];
petri_examples[1].initial = [
	{
		"initial":{"glucose":100.0, "yeast":10.0},
		"criteria": [
			{"time":960, "state": "glucose", "quant": 0.0},
			{"time":60, "state": "glucose", "quant": 98.0},
			{"time":960, "state": "ethanol", "quant": 196.0},
/*
			{"time":260, "state": "heat", "quant": 26.0},
			{"time":350, "state": "heat", "quant": 28.0},
			{"time":760, "state": "heat", "quant": 26.0},
*/
			]
	}
];
petri_examples[1].colors = {
	"glucose": "orange",
	"ethanol":"blue",
	"yeast":"green"
};

petri_examples[2].network = [
	{
		"name": "eat",
		"input": [ "rabbit", "grass" , "grass", "grass"],
		"output": [ "rabbit", "rabbit" ],
		"rate": 0.00007349
	},
	{
		"name": "die",
		"input": [ "rabbit" ],
		"output": [  ],
		"rate": 0.00007349
	},
	{
		"name": "grow",
		"input": [ "grass" ],
		"output": [ "grass","grass" ],
		"rate": 0.00007349
	}
];
petri_examples[2].initial = [
	{
                "initial":{"grass":300.0, "rabbit":10.0},
                "criteria": [
			{"time":100, "state": "grass", "quant": 200.0},
			{"time":90, "state": "grass", "quant": 200.0},
			{"time":100, "state": "rabbit", "quant": 30.0},
			{"time":90, "state": "rabbit", "quant": 30.0},
		]
	},
	{
                "initial":{"grass":10.0},
                "criteria": [
			{"time":100, "state": "grass", "quant": 1000.0},
			{"time":85, "state": "grass", "quant": 500.0},
			{"time":100, "state": "rabbit", "quant": 0.0},
			{"time":50, "state": "rabbit", "quant": 0.0},
		]
	},
	{
                "initial":{"rabbit":10.0},
                "criteria": [
			{"time":100, "state": "grass", "quant": 0.0},
			{"time":50, "state": "grass", "quant": 0.0},
			{"time":100, "state": "rabbit", "quant": 0.0},
			{"time":20, "state": "rabbit", "quant": 1.0},
		]
	}
];
petri_examples[2].colors = {"grass":"green", "rabbit":"gray"};

petri_examples[3].network = [];
petri_examples[3].initial = petri_examples[2].initial;
petri_examples[3].colors = petri_examples[2].colors;
