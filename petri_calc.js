
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

function calcAllNext(current_vect, net_obj) {
	var output = {};
	for (var x in current_vect) {
		output[x] = Math.max(0, current_vect[x] + calcStepSize(x, current_vect, net_obj));
	}
	return output;
}

function sumStrings(array) {
	if (!array || array.length == 0) { return ""; }
	return assoc_fold(array, function (x,y) { return x+y; });
}

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

function calcVectTable(init_vect, net_obj, steps) {
	var output = [];
	var current = init_vect;
	for (var i = 0; i < steps; i++) {
		output.push(current);
		current = calcAllNext(current, net_obj);
	}
	return output;
}

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
	//throw("input:" + JSON.stringify(init_vect) + "\noutput:" + JSON.stringify(output));
	return output;
}

function petriEvolve(crit_obj, net_obj) {
	this.net_obj = net_obj;
	this.crit_obj = crit_obj;
	this.best_net = net_obj;
	this.ls = [];
	this.freq = 0.3;
	this.intensity = 0.5;

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

	this.bestTable = function() {
		return this.calcTable(this.best_net);
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
		for (var x in t) {
			output[x] = t[x];
		}
		return output;
	}

	this.mutateNetRates = function(net_obj) {
		var freq = this.freq;
		var intensity = this.intensity;
		var output = [];
		var temp;

		for (var x in net_obj) {
			temp = this.copyTransition(net_obj[x]);
			if (Math.random() < freq) {
				temp.rate *= 1 + ((Math.random() - 0.5) * intensity);
			}
			output.push(temp);
		}

		return output;
	}

	this.bestInSet = function(list) {
		var b_so_far = this.evalTable(this.bestTable());
		var next;
		for (var x in list) {
			next = this.evalTable(this.calcTable(list[x]));
			if (next < b_so_far) {
				b_so_far = next;
				this.best_net = list[x];
			}
		}
		return this.best_net;
	}

	this.makeLambdaSet = function(lambda) {
		var output = [];
		for (var i = 0; i < lambda; i++) {
			output.push(this.mutateNetRates(this.best_net));
		}
		output.push(this.best_net);
		this.ls = output;
		return output;
	}
}

