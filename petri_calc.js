
function assoc_fold(array, func) {
	if (!array || array.length == 0) { throw("bad input to fold."); }
	if (array.length == 1) { return array[0]; }
	var output = array[0];
	for (var i = 1; i < array.length; i++) {
		output = func(output, array[i]);
	}
	return output;
}

function calcStepSize(key, current_vect, net_obj) {
	var out_count = 0, in_count = 0;
	var pop_prod = 0;
	var total = 0;
	for (var i = 0; i < net_obj.length; i++) {
		out_count = net_obj[i].output.filter(function(x) {return x == key}).length;
		in_count = net_obj[i].input.filter(function(x) {return x == key}).length;
		if (out_count == in_count) { pop_prod = 0.0; }
		else if (net_obj[i].input.length > 0) {
			pop_prod = assoc_fold(net_obj[i].input.map(function(x) { return current_vect[x] || 0;}), function(x,y) {return x*y;});
		}
		else {
			pop_prod = 1.0;
		}

		//alert(key + ", " + net_obj[i].name + ", " + (net_obj[i].rate*(out_count-in_count)*pop_prod));
		total += net_obj[i].rate*(out_count-in_count)*pop_prod;
	}
	return total;
}

// Given a petri net and a vector of population levels, calculates a new vector,
// one timestep into the future.
function calcAllNext(current_vect, net_obj) {
	var output = {};
	var step;
	for (var x in current_vect) {
		step = calcStepSize(x, current_vect, net_obj);
		output[x] = isNaN(step)||!isFinite(step) ? current_vect[x] : Math.max(0, current_vect[x] + step);
	}
	return output;
}

// concatenate function that works on arrays
function sumStrings(array) {
	if (!array || array.length == 0) { return ""; }
	return assoc_fold(array, function (x,y) { return x+y; });
}

// renders a list of population vectors as a list HTML table
function vectTableToHTML(table){
	var header = [];
	var output = "<table>";
	if (!table || table.length < 1) { return "<i>empty table</i>"; }
	for (var key in table[0]) { header.push(key); }

	output += "<tr>" + sumStrings( header.map(function(col) {return "<th>" + col + "</th>";})) + "</tr>\n";
	output += sumStrings(table.map(function(row) {
		return "<tr>" + sumStrings(header.map(function(col) {
			return "<td>" + (row[col].toFixed(2)) + "</td>";
		})) + "</tr>\n"
	}));

	return output + "</table>\n";
}

// Iterates a petri net on a population vector,
// creates a list of population vectors, in chronological order.
function calcVectTable(init_vect, net_obj, steps) {
	var output = [];
	var current = init_vect;
	for (var i = 0; i < steps; i++) {
		output.push(current);
		current = calcAllNext(current, net_obj);
	}
	return output;
}

// sets population to default 0 for implictly stated dimensions.
function fillInitVect(net, init_vect) {
	var output = {};
	for (var k in init_vect) {
		output[k] = init_vect[k];
	}

	for (var t in net) {
		for (var i in net[t].input) {
			key = net[t].input[i];
			if (!init_vect[key]) {
				output[key] = 0.0;
			}
		}
		for (var i in net[t].output) {
			key = net[t].output[i];
			if (!init_vect[key]) {
				output[key] = 0.0;
			}
		}
	}
	return output;
}

function petriEvolve(crit_obj, net_obj) {
	this.crit_obj = crit_obj;
	this.ls = [];
	this.freq = 0.9;
	this.intensity = 0.5;
	this.edge_inten = 0.0;
	this.trans_inten = 0.0;
	this.tinc = 0;

	for (var x in crit_obj) {
		crit_obj[x].initial = fillInitVect(net_obj, crit_obj[x].initial);
	}

	this.calcTable = function(net) {
		var steps = 0;
		var output = [];
		for (var j in this.crit_obj)
			for (var x in this.crit_obj[j].criteria) {
				steps = Math.max(steps, this.crit_obj[j].criteria[x].time);
			}

		for (var j in this.crit_obj) {
			output.push(calcVectTable(this.crit_obj[j].initial, net, steps+5));
		}

		return output;
	}

	this.makeEvalCache = function() {
		var temp;
		for (var x in this.ls) {
			this.ls[x].table = this.calcTable(this.ls[x].net);
			this.ls[x].score = this.evalTable(this.ls[x].table);
		}
	}

	this.eval = function(idx) {
		if (idx < 0 || idx >= this.ls.length) {
			throw("Index out of range ("+idx+" of " + this.ls.length + ").");
		}
		return this.ls[idx].score;
	}

	this.table = function(idx){
		if (idx < 0 || idx >= this.ls.length) {
			throw("Index out of range ("+idx+" of " + this.ls.length + ").");
		}
		return this.ls[idx].table;
	}

	this.bestTable = function() {
		return this.best_net.table;
	}

	this.evalTable = function(table) {
		var error = 0;
		var diff = 0;
		if (table.length != this.crit_obj.length){
			throw("Table("+table.length+") to Criteria("+this.crit_obj.length+") mismatch.");
		}
		for (var j in this.crit_obj)
		for (var x in this.crit_obj[j].criteria) {
			var cr = this.crit_obj[j].criteria[x];
			diff = (table[j][cr.time][cr.state] - cr.quant) || 0;
			error += (diff*diff);
			if (isNaN(error)) {throw("Table evaluated to Nan at row " + j + " in " + x + ".\n" + cr.state + "\n" + JSON.stringify(table[j][cr.time]));}
		}

		return error;
}

	this.copyTransition = function(t) {
		var output = {};
		output.rate = t.rate;
		output.name = t.name;
		output.input = [];
		output.output = [];
		for (var x in t.input) {
			output.input[x] = t.input[x];
		}
		for (var x in t.output) {
			output.output[x] = t.output[x];
		}

		return output;
	}

	this.copyNet = function(net_obj) {
		var ev = this;
		return net_obj.map(function(x) { return ev.copyTransition(x); });
	}

	this.stateList = function() {
		var output = [];
		for (var i in crit_obj[0].initial) {
			output.push(i);
		}
		return output;
	}

	this.randomState = function() {
		if (crit_obj.length == 0) { return "new_state"; }
		var states = this.stateList();
		return states[Math.floor(states.length * Math.random()) ];
	}

	this.mutateNetEdge = function(net_obj) {
		var output = [];
		var marked = Math.floor(Math.random()*net_obj.length);
		var addrem = Math.random() < 0.5;
		var inout = Math.random() < 0.5;
		var temp;
		for (var x in net_obj) {
			temp = net_obj[x];
			if (x == marked) {
				if (inout && addrem) {
					temp.input.push(this.randomState());
				} else if (inout && !addrem && temp.input.length > 0) {
					temp.input.splice(Math.floor(temp.input.length*Math.random()), 1);
				} else if (!inout && addrem) {
					temp.output.push(this.randomState());
				} else if (temp.output.length > 0){
					temp.output.splice(Math.floor(temp.output.length*Math.random()), 1);
				}
			}
			output.push(temp);
		}

		return output;
	}

	this.randomTrans = function() {
		this.tinc++;
		var output = {"name": "auto"+this.tinc, "rate":0.0001*Math.random(), input:[], output: []};
		var in_x = Math.floor(Math.random()*3);
		var out_x = Math.floor(Math.random()*3);

		for (var i = 0; i < in_x; i++) {
			output.input.push(this.randomState());
		}
		for (var i = 0; i < out_x; i++) {
			output.output.push(this.randomState());
		}

		return output;
	}

	this.mutateNetTrans = function(net_obj) {
		var output = [];
		var temp;
		var addrem = Math.random() < 0.5;
		for (var x in net_obj) {
			output.push(net_obj[x]);
		}

		if (addrem){
			output.push(this.randomTrans());
		} else {
			output.splice(Math.floor(output.length*Math.random()), 1);
		}

		return output;
	}

	this.mutateNetRates = function(net_obj) {
		var freq = this.freq;
		var intensity = this.intensity;
		var output = [];
		var temp;

		for (var x in net_obj) {
			temp = net_obj[x];
			if (Math.random() < freq) {
				temp.rate *= 1 + Math.max((Math.random() - 0.5) * intensity, -0.99);
			}
			output.push(temp);
		}

		return output;
	}

	this.bestInSet = function() {
		var list = this.ls;
		var b_so_far = this.best_net.score;
		var next;
		for (var x in list) {
			next = this.eval(x);
			if (next < b_so_far) {
				b_so_far = next;
				this.best_net = list[x];
			}
		}
		this.assertTriple(this.best_net);
		return this.best_net;
	}

	this.assertTriple = function(obj) {
		var table = this.calcTable(obj.net);
		if (obj.score != this.evalTable(table)) {
			throw("bad triple: changed somewhere");
		}
		else {
			console.log("good triple: " + obj.score);
		}

	}

	this.invertScore = function(input) {
		return 1.0/Math.max(input, 0.0025);
	}

	this.rouletteMess = function(lambda) {
		var cummu = [0.0];
		var output = [];
		var total = 0.0;

		var target,high,low;
		if (this.ls.length == 0) { this.ls = [this.best_net]; }

		for (var x in this.ls) {
			if (x == 0) {
				cummu.push(this.invertScore(this.ls[x].score));
			} else {
				cummu.push(this.invertScore(this.ls[x].score) + cummu[x-1]);
			}
			total += this.invertScore(this.ls[x].score);
		}

		for (var x = 0; x < lambda; x++) {
			target = Math.random()*total;
			low = 0;
			high = this.ls.length;
			while (high - low > 1) {
				if (cummu[Math.floor((high + low)/2)] < target) {
					low = Math.floor((high + low)/2);
				} else {
					high = Math.floor((high + low)/2);
				}
			}
			output.push(this.copyNet(this.ls[low].net));
		}

		return output;
	}

	this.makeLambdaSet = function(lambda) {
		var output = [];
		var temp;
		var rm = this.rouletteMess(lambda);
		for (var i = 0; i < lambda; i++) {
			temp =  rm[i]; //this.best_net.net;
			if (Math.random() < this.edge_inten) {
				temp = this.mutateNetEdge(temp);
			}
			if (Math.random() < this.trans_inten) {
				temp = this.mutateNetTrans(temp);
			}
			output.push({"net":this.mutateNetRates(temp)});
		}
		output.push({"net":this.copyNet(this.best_net.net)});
		this.ls = output;
		this.makeEvalCache();
		return output;
	}

	this.best_net = {"net":net_obj, "table":this.calcTable(net_obj), "score":this.evalTable(this.calcTable(net_obj))};
}

