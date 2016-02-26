
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
			pop_prod = assoc_fold(net_obj[i].input.map(function(x) { return current_vect[x];}), function(x,y) {return x*y;});
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
		output[x] = current_vect[x] + calcStepSize(x, current_vect, net_obj);
	}
	return output;
}

function calcVectTable(init_vect, net_obj, steps) {
	var output = [];
	var current = init_vect;
	for (var i = 0; i < steps.length; i++) {
		output.push(current);
		current = calcAllNext(current, net_obj);
	}
	return output;
}

