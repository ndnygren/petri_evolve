
function SPGLeafNode (input)
{
	this.data = input;

	this.reverse = function () { return this; }
	this.width = function () { return 1; }
	this.height = function () { return 1; }
}

function SPGSeriesNode(lhs, rhs)
{
	this.data = [];
	this.data.push(lhs);
	this.data.push(rhs);

	this.first = function() { return this.data[0].data; }
	this.last = function() { return this.data[this.data.length-1].data; }

	this.width = function()
	{
		var output = 0;
		for (i = 0; i < this.data.length; i++)
		{
			output = Math.max(output, this.data[i].width());
		}
	}

	this.height = function()
	{
		var output = 0;
		for (i = 0; i < this.data.length; i++)
		{
			output += this.data[i].height();
		}
		return output;
	}

	this.reverse = function()
	{
		var output = new SPGSeriesNode(this.data[0], this.data[0]);

		output.data.length = this.data.length;
		for (i = 0; i < this.data.length; i++)
		{
			output.data[i] = this.data[this.data.length - i - 1].reverse();
		}

		return output;
	}

	this.inner = function()
	{
		if (this.data.length == 2) { return new SPGLeafNode(-1); }
		if (this.data.length == 3) { return this.data[1]; }

		var output= new SPGSeriesNode(this.data[1], this.data[2]);
		for (var i = 3; i < this.data.length; i++)
		{
			output.data.push(this.data[i]);
		}

		return output;
	}
}

function SPGParNode(lhs, rhs)
{
	this.data = [];
	this.data.push(lhs);
	this.data.push(rhs);

	this.height = function()
	{
		var output = 0;
		for (i = 0; i < this.data.length; i++)
		{
			output = Math.max(output, this.data[i].height());
		}
	}

	this.width = function()
	{
		var output = 0;
		for (i = 0; i < this.data.length; i++)
		{
			output += this.data[i].width();
		}
		return output;
	}

	this.reverse = function()
	{
		return this;
	}
}

function numPairToSeries (lhs,rhs)
{
	return new SPGSeriesNode(new SPGLeafNode(lhs), new SPGLeafNode(rhs));
}

function mtxToSerList(mtx)
{
	var output = [];

	for (var i = 0; i < mtx.length; i++)
	{
		for (var j = 0; j < i; j++)
		{
			if (mtx[i][j] || mtx[j][i])
			{
				output.push(numPairToSeries(i,j));
			}
		}
	}

	return output;
}

function countNodeOrders(serlist)
{
	var output = [];

	for (i = 0; i < serlist.length; i++)
	{
		lhs = serlist[i].first();
		rhs = serlist[i].last();
		if (output[lhs]) { output[lhs]++; } else { output[lhs] = 1; }
		if (output[rhs]) { output[rhs]++; } else { output[rhs] = 1; }
	}

	return output;
}

function mergeSerNodes(lhs, rhs)
{
	var output;

	if (lhs.first() == rhs.first() || lhs.first() == rhs.last())
	{
		lhs = lhs.reverse();
	}
	if (rhs.last() == lhs.first() || rhs.last() == lhs.last())
	{
		rhs = rhs.reverse();
	}

	output = new SPGSeriesNode(lhs.data[0], lhs.data[1]);

	for (var i = 2; i < lhs.data.length; i++)
	{
		output.data.push(lhs.data[i]);
	}

	for (var i = 1; i < rhs.data.length; i++)
	{
		output.data.push(rhs.data[i]);
	}

	return output;
}

// For a node of order 2, the SPGSeriesNodes containing it will be removed and
// a single merged SPGNode will be added
function elim2OrderNode(idx, serlist)
{
	var lhs = -1, rhs = -1;
	var temp1, temp2;

	for (var i = 0; i < serlist.length; i++)
	{
		if (serlist[i].first() == idx || serlist[i].last() == idx)
		{
			if (lhs == -1) { lhs = i; }
			else { rhs = i; }
		}
	}

	temp1 = serlist[lhs];
	temp2 = serlist[rhs];
	output = serlist.slice(0);
	output.splice(rhs, 1);
	output[lhs] = mergeSerNodes(temp1, temp2);

	return output;
}

function findAndRemove2ndOrderNode(serlist)
{
	var counts = countNodeOrders(serlist);
	var idx = counts.indexOf(2);
	if (idx == -1) { return serlist; }
	return elim2OrderNode(idx, serlist);
}

function removeAll2ndOrder(serlist)
{
	var oldlength = serlist.length + 1;

	while (serlist.length != oldlength)
	{
		oldlength = serlist.length;
		serlist = findAndRemove2ndOrderNode(serlist);
	}

	return serlist;
}

function normalizeAndSortSerList(serlist)
{
	for (var i = 0; i < serlist.length; i++)
	{
		if (serlist[i].first() > serlist[i].last())
		{
			serlist[i] = serlist[i].reverse();
		}
	}
	serlist.sort(function(a,b)
		{
			if (a.first() == b.first()) { return a.last() - b.last(); }
			else { return a.first() - b.first(); }
		});
}

function findAndMergePar(serlist)
{
	var lhs, rhs;
	var parnode;
	var innerlist = [];
	var output;

	normalizeAndSortSerList(serlist);
	output = serlist.slice(0);

	for (var i = 0; i < serlist.length; i++)
	{
		for (var j = i + 1; j < serlist.length
			&&(serlist[j].first() == serlist[i].first()
			&& serlist[j].last() == serlist[i].last())
			; j++)
		{
			innerlist.push(serlist[j].inner());
		}
		if (j != i + 1)
		{
			innerlist.push(serlist[i].inner());
			parnode = new SPGParNode();
			parnode.data = innerlist;
			output.splice(i+1, j - i - 1);
			output[i].data = [output[i].data[0],
					parnode,
					output[i].data[output[i].data.length -1]
				];
			return output;
		}
	}

	return output;
}

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

