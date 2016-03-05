
function SPGLeafNode (input)
{
	this.data = input;
	this.code = "L";

	this.XY = function(offx, offy)
	{
		return [{ name: this.data, x: offx, y: offy}];
	}

	this.reverse = function () { return this; }
	this.width = function () { return 1.0; }
	this.height = function () { return 1.0; }
	this.copy = function() { return new SPGLeafNode(this.data); }
	this.maxID = function() { return this.data; }
}

function SPGSeriesNode(lhs, rhs)
{
	this.data = [];
	this.code = "S";
	this.data.push(lhs);
	this.data.push(rhs);

	this.first = function() { return this.data[0].data; }
	this.last = function() { return this.data[this.data.length-1].data; }

	this.XY = function(offx, offy)
	{
		var output = [];
		var depth = 0.0;

		for (var i = 0; i < this.data.length; i++)
		{
			output = output.concat(this.data[i].XY(offx + depth, offy));
			depth += this.data[i].height();
		}
		return output;
	}

	this.width = function()
	{
		var output = 0.0;

		for (var i = 0; i < this.data.length; i++)
		{
			output = Math.max(output, this.data[i].width());
		}
		return output;
	}

	this.height = function()
	{
		var output = 0.0;
		for (var i = 0; i < this.data.length; i++)
		{
			output += this.data[i].height();
		}
		return output;
	}

	this.reverse = function()
	{
		var output = new SPGSeriesNode(this.data[0], this.data[0]);

		output.data.length = this.data.length;
		for (var i = 0; i < this.data.length; i++)
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
		for (var i = 3; i < this.data.length-1; i++)
		{
			output.data.push(this.data[i]);
		}

		return output;
	}

	this.copy = function()
	{
		var output = new SPGSeriesNode();
		output.data = [];
		output.data.length = this.data.length;
		for (var i in this.data) { output.data[i] = this.data[i].copy(); }
		return output;
	}

	this.maxID = function ()
	{
		var output = 0;
		for (var i in this.data) {output = Math.max(output, this.data[i].maxID()); }
		return output;
	}
}

function SPGParNode(lhs, rhs)
{
	this.data = [];
	this.code = "P";
	this.data.push(lhs);
	this.data.push(rhs);

	this.height = function()
	{
		var output = 0.0;
		for (var i = 0; i < this.data.length; i++)
		{
			output = Math.max(output, this.data[i].height());
		}
		return output;
	}

	this.XY = function(offx, offy)
	{
		var output = [];
		var start = offy - this.width()/2.0;
		var depth = 0.0;

		for (var i = 0; i < this.data.length; i++)
		{
			output = output.concat(this.data[i].XY(offx, start + depth + this.data[i].width()/2.0));
			depth += this.data[i].width();
		}
		return output;
	}

	this.width = function()
	{
		var output = 0.0;
		for (var i = 0; i < this.data.length; i++)
		{
			output += this.data[i].width();
		}
		return output;
	}

	this.reverse = function()
	{
		for (var i in this.data)
		{
			this.data[i] = this.data[i].reverse();
		}
		return this;
	}

	this.copy = function()
	{
		var output = new SPGParNode();
		output.data = [];
		output.data.length = this.data.length;
		for (var i in this.data) { output.data[i] = this.data[i].copy(); }
		return output;
	}

	this.maxID = function ()
	{
		var output = 0;
		for (var i in this.data) {output = Math.max(output, this.data[i].maxID()); }
		return output;
	}
}

function SPGDebug(serlist)
{
	if (!serlist) { return 0; }
	if (typeof(serlist) == 'number') { return serlist; }
	var output = "["
	for (var i in serlist)
	{
		output += SPGDebug(serlist[i].data) + ",";
	}
	return output + "]";
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

function uniqueCount(list)
{
	list.sort();
	if (!list || list.length == 0) { return 0; }
	var count = 1;
	var last = list[0];
	for (var i in list)
	{
		if (last != list[i]) {count++; last = list[i]; }
	}

	return count;
}

function uniqueCountInListOfList(list)
{
	var output = [];
	for (var i in list) { output[i] = uniqueCount(list[i]); }
	return output;
}

function countUNodeOrders(serlist)
{
	var output = [];

	for (var i = 0; i < serlist.length; i++)
	{
		lhs = serlist[i].first();
		rhs = serlist[i].last();
		if (output[lhs]) { output[lhs].push(rhs); } else { output[lhs] = [rhs]; }
		if (output[rhs]) { output[rhs].push(lhs); } else { output[rhs] = [lhs]; }
	}

	return uniqueCountInListOfList(output);
}

function countNodeOrders(serlist)
{
	var output = [];

	for (var i = 0; i < serlist.length; i++)
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
	var ucounts = countUNodeOrders(serlist);
	var idx = counts.indexOf(2);
	while (idx > -1 && ucounts[idx] != 2) { idx = counts.indexOf(2, idx+1); }
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

function mergeAllPar(serlist)
{
	var oldlength = serlist.length + 1;
	while (serlist.length != oldlength)
	{
		oldlength = serlist.length;
		serlist = removeAll2ndOrder(serlist);
		serlist = findAndMergePar(serlist);
	}

	return serlist;
}

function countLeaves(counts, serlist)
{
	var output = [];
	output.length = counts.length;
	for (var i = 0; i < serlist.length; i++)
	{
		if (counts[serlist[i].first()] == 1 && counts[serlist[i].last()] > 1)
			{ output[serlist[i].last()] = output[serlist[i].last()] ? output[serlist[i].last()] + 1 : 1; }
		if (counts[serlist[i].last()] == 1 && counts[serlist[i].first()] > 1)
			{ output[serlist[i].first()] = output[serlist[i].first()] ? output[serlist[i].first()] + 1 : 1; }
	}
	return output;
}

function findNodeWithLeaves(lcount)
{
	var found = -1;
	for (var i = 0; i < lcount.length && found == -1; i++)
		{ if (lcount[i] > 1) { found = i; } }
	for (var i = 0; i < lcount.length && found == -1; i++)
		{ if (lcount[i] > 0) { found = i; } }
	return found;
}

function leavesOn(node, counts, serlist)
{
	var output = [];
	for (var i in serlist)
	{
		if (counts[serlist[i].first()] == 1 && serlist[i].last() == node)
			{ output.push(i); }
		if (counts[serlist[i].last()] == 1 && serlist[i].first() == node)
			{ output.push(i); }
	}

	return output;
}

function removeMaxHeight(leaves, serlist)
{
	var output = leaves.slice(0);
	var max = 0;
	var maxNode = 0;

	for (var i in leaves)
	{
		maxNode = serlist[leaves[i]].height() > max ? i : maxNode;
		max = serlist[leaves[i]].height() > max ? serlist[leaves[i]].height() : max;
	}

	output.splice(maxNode, 1);

	return output;
}

function splitSerList(leaves, serlist)
{
	var output = {leaf: [], nonleaf: []};
	for (var i in serlist)
	{
		if (leaves.indexOf(i) > -1) { output.leaf.push(serlist[i]); }
		else { output.nonleaf.push(serlist[i]); }
	}

	return output;
}

function mergeLeafs(found, newid, list)
{
	var output = new SPGSeriesNode();
	output.data = [new SPGLeafNode(newid), new SPGParNode(), new SPGLeafNode(found)];
	output.data[1].data = list;
	for (var i = 0; i < output.data[1].data.length; i++)
	{
		if (output.data[1].data[i].first() == found)
		{
			output.data[1].data[i].data.shift();
		}
		else if (output.data[1].data[i].last() == found)
		{
			output.data[1].data[i].data.pop();
		}
	}

	return output;
}

function maxNodeId(serlist)
{
	var output = 0;
	for (i = 0; i < serlist.length; i++)
	{
		output = Math.max(serlist[i].maxID(), output);
	}

	return output;
}

function classifyLeaves(serlist)
{
	var counts = countNodeOrders(serlist);
	var lcount = countLeaves(counts, serlist);
	var found = findNodeWithLeaves(lcount);
	if (found == -1) { return serlist; }
	var leaves = leavesOn(found, counts, serlist);
	if (counts[found] == lcount[found]) { leaves = removeMaxHeight(leaves, serlist); }
	if (leaves.length == 1) { return serlist; }
	var split = splitSerList(leaves, serlist);
	var output = split.nonleaf;
	output.push(mergeLeafs(found, maxNodeId(serlist)+1, split.leaf));
	return output;
}

function mergeAllLeaf(serlist)
{
	var oldlength = serlist.length + 1;
	while (serlist.length != oldlength)
	{
		oldlength = serlist.length;
		serlist = mergeAllPar(serlist);
		serlist = classifyLeaves(serlist);
	}

	return serlist;
}

function foldOverLoneLeaf(found, leaf, ser)
{
	if (leaf.first() != found) { leaf = leaf.reverse(); }
	if (ser.first() != found) { ser = ser.reverse(); }

	var topnode = leaf.copy();

	if (topnode.data.length > 2) { topnode.data.shift(); }
	else { topnode = new SPGLeafNode(topnode.last()); }

	var output = new SPGSeriesNode(new SPGLeafNode(found),
		new SPGParNode(topnode, ser.inner()));
	output.data.push(new SPGLeafNode(ser.last()));

	return output;
}

function classifyLoneLeaves(serlist)
{
	var counts = countNodeOrders(serlist);
	var lcount = countLeaves(counts, serlist);
	var found = findNodeWithLeaves(lcount);
	if (found == -1) { return serlist; }
	var leaves = leavesOn(found, counts, serlist);
	var split = splitSerList(leaves, serlist);
	var output = split.nonleaf;
	var neigh;
	for (var i in output)
	{
		if (output[i].first() == found || output[i].last() == found)
		{
			neigh = i;
		}
	}
	output[neigh] = foldOverLoneLeaf(found, split.leaf[0], output[neigh]);
	return output;
}

function mergeAllLone(serlist)
{
        var oldlength = serlist.length + 1;
        while (serlist.length != oldlength)
        {
                oldlength = serlist.length;
                serlist = mergeAllLeaf(serlist);
                serlist = classifyLoneLeaves(serlist);
        }

        return serlist;
}

function serNodeToXY(ser)
{
	var starth = ser.width()/2.0;
	var output = ser.XY(0.0, starth);
	return output;
}

// ensures all elements are numeric rather than string
function intifyArray(arr)
{
	var output = [];

	for (var idx in arr)
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
			output1.push(last);
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
	output.s = {};
	output.t = {};
	var count = 0;
	for (var idx in states)
	{
		output.s[states[idx]] = count++;
	}
	for (var idx in trans)
	{
		output.t[trans[idx]] = count++;
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

function withNameAndType(xy, postparse)
{
	var output = [];
	var states = stateList(postparse);
	var trans = transList(postparse);
	var mtx_idx = StateTransCommonIdx(states, trans);
	var maxnode = 0;
	for (var idx in mtx_idx.t) { maxnode = Math.max(maxnode, mtx_idx.t[idx]); }

	for (var idx in xy)
	{
		if (0 <= xy[idx].name && xy[idx].name <= maxnode) { output[xy[idx].name] = xy[idx]; }
	}

	for (var idx in mtx_idx.s)
	{
		output[mtx_idx.s[idx]].display = idx;
		output[mtx_idx.s[idx]].type = "state";
	}
	for (var idx in mtx_idx.t)
	{
		output[mtx_idx.t[idx]].display = idx;
		output[mtx_idx.t[idx]].type = "trans";
	}

	return output;
}

