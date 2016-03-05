
var petri_examples = [{},{}];

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
	"name": "h_out",
	"input": ["heat"],
	"output": [],
	"rate": 1.0
}];
petri_examples[1].initial = [
	{
		"initial":{"glucose":100.0, "yeast":100.0},
		"criteria": [
			{"time":960, "state": "glucose", "quant": 0.0},
			{"time":960, "state": "ethanol", "quant": 200.0},
		]
	}
];
petri_examples[1].colors = {"glucose": "orange", "ethanol":"blue", "yeast":"green"};

