
// ensures all elements are numeric rather than string
function intifyArray(arr)
{
	var output = [];

	for (idx in arr)
	{
		output.push(parseInt(arr[idx]));
	}

	return output;
}

// breaks the input, line-by-line and parses each separately
// divides into 2 definitions (arrays), input and output
function readCommand(net_obj)
{
	var output = {};
	output.i = [];
	output.o = [];
	var current;
	for (var x in net_obj) {
		for (var y in net_obj[x].input) {
			output.i.push([net_obj[x].input[y], net_obj[x].name, 1]);
		}
		for (var y in net_obj[x].output) {
			output.o.push([net_obj[x].output[y], net_obj[x].name, 1]);
		}
	}


	return output;
}

// looks at input and output definitions and collects unique lists
// for either state or transition
function idxList(postParse, offs)
{
	var output = [], output1 = [];
	var last;

	for (var idx in postParse.i) { output.push(postParse.i[idx][offs]); }
	for (var idx in postParse.o) { output.push(postParse.o[idx][offs]); }

	output.sort();
	for (var idx in output)
	{
		if (last !== output[idx])
		{
			last = output[idx];
			output1.push(parseInt(last))
		}
	}

	return output1;
}

// unique ordered list of all states in use
function stateList(postParse) { return idxList(postParse, 0); }
// unique ordered list of all transitions in use
function transList(postParse) { return idxList(postParse, 1); }

// creates a N-by-N matrix, undefined everywhere
function NbyNNull(n)
{
	var output = [];
	output.length = n;

	for (var idx = 0; idx < n; idx++)
	{
		output[idx] = [];
		output[idx].length = n;
	}

	return output;
}

// Creates a pair of lookup tables, to identify row/column 
// for the combined list of states and transitions
function StateTransCommonIdx(states, trans)
{
	var output = {};
	output.s = [];
	output.t = [];
	for (var idx in states)
	{
		output.s[states[idx]] = parseInt(idx);
	}
	for (var idx in trans)
	{
		output.t[trans[idx]] = parseInt(idx) + states.length;
	}

	return output;
}

// creates an adjacentcy matrix, treating both states and transitions 
// as nodes in the same graph. Used for graph drawing.
function toStateTransMtx(postparse)
{
	var states = stateList(postparse);
	var trans = transList(postparse);
	var size = states.length + trans.length;
	var output = NbyNNull(size);
	var mtx_idx = StateTransCommonIdx(states, trans);

	for (var idx in postparse.i)
	{
		output
		[mtx_idx.s[postparse.i[idx][0]]]
		[mtx_idx.t[postparse.i[idx][1]]] 
			= true;
	}
	for (var idx in postparse.o)
	{
		output[mtx_idx.s[postparse.o[idx][0]]][mtx_idx.t[postparse.o[idx][1]]] = true;
	}
	return output;
}

