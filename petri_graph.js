
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

function SPGGrouper() {
	this.transListFromNet = function(net_obj) {
		return net_obj.map(function (x) { return x.name; });
	}

	this.stateListFromEdge = function(commands){
		return commands.i.map(function (x) { return x[0]; }).concat(commands.o.map(function (x) { return x[0]; }));
	}

	this.transListFromEdge = function(commands){
		return commands.i.map(function (x) { return x[1]; }).concat(commands.o.map(function (x) { return x[1]; }));
	}

	this.stateListFromCrit = function(crit_obj){
		var output = [];
		for (var s in crit_obj) {
			for (var k in crit_obj[s].initial) {output.push(k);}
			output = output.concat(crit_obj[s].criteria.map(function(x) { return x.state; }));
		}
		return output;
	}

	this.uniqueDiff = function(arr1,arr2) {
		var output = arr1.filter(function(x) { return arr2.indexOf(x) < 0; });
		var output2 = [];

		for (var i in output) {
			if (output2.indexOf(output[i]) < 0){
				output2.push(output[i]);
			}
		}

		return output2;
	}

	this.disjointNodes = function(net_obj, crit_obj, named) {
		var commands = this.readCommand(net_obj);
		var loose_t = this.uniqueDiff(this.transListFromNet(net_obj), this.transListFromEdge(commands));
		var loose_s = this.uniqueDiff(this.stateListFromCrit(crit_obj), this.stateListFromEdge(commands));
		var high = Math.max.apply(null, named.map(function(x) { return x.y; }));
		var maxid = Math.max.apply(null, named.map(function(x) { return x.name; }));
		if (high == null || !isFinite(high)) { high = -0.5; }
		if (maxid == null || !isFinite(maxid)) { maxid = 1; }

		var output = named.map(function (x) { return x; });
		for (var i in loose_t) {
			output.push({"name":++maxid,"x":parseInt(i)+1,"y":high+1,"display":loose_t[i],"type":"trans"});
		}
		for (var i in loose_s) {
			output.push({"name":++maxid,"x":loose_t.length+parseInt(i)+1,"y":high+1,"display":loose_s[i],"type":"state"});
		}
		return output;
	}
}

SPGGrouper.prototype.numPairToSeries = function (lhs,rhs)
{
	return new SPGSeriesNode(new SPGLeafNode(lhs), new SPGLeafNode(rhs));
}

SPGGrouper.prototype.mtxToSerList = function(mtx)
{
	var output = [];

	for (var i = 0; i < mtx.length; i++)
	{
		for (var j = 0; j < i; j++)
		{
			if (mtx[i][j] || mtx[j][i])
			{
				output.push(this.numPairToSeries(i,j));
			}
		}
	}

	return output;
}

SPGGrouper.prototype.uniqueCount = function(list)
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

SPGGrouper.prototype.uniqueCountInListOfList = function(list)
{
	var output = [];
	for (var i in list) { output[i] = this.uniqueCount(list[i]); }
	return output;
}

SPGGrouper.prototype.countUNodeOrders = function(serlist)
{
	var output = [];

	for (var i = 0; i < serlist.length; i++)
	{
		lhs = serlist[i].first();
		rhs = serlist[i].last();
		if (output[lhs]) { output[lhs].push(rhs); } else { output[lhs] = [rhs]; }
		if (output[rhs]) { output[rhs].push(lhs); } else { output[rhs] = [lhs]; }
	}

	return this.uniqueCountInListOfList(output);
}

SPGGrouper.prototype.countNodeOrders = function(serlist)
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

SPGGrouper.prototype.mergeSerNodes = function(lhs, rhs)
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
SPGGrouper.prototype.elim2OrderNode = function(idx, serlist)
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
	output[lhs] = this.mergeSerNodes(temp1, temp2);

	return output;
}

SPGGrouper.prototype.findAndRemove2ndOrderNode = function(serlist)
{
	var counts = this.countNodeOrders(serlist);
	var ucounts = this.countUNodeOrders(serlist);
	var idx = counts.indexOf(2);
	while (idx > -1 && ucounts[idx] != 2) { idx = counts.indexOf(2, idx+1); }
	if (idx == -1) { return serlist; }
	return this.elim2OrderNode(idx, serlist);
}

SPGGrouper.prototype.removeAll2ndOrder = function(serlist)
{
	var oldlength = serlist.length + 1;

	while (serlist.length != oldlength)
	{
		oldlength = serlist.length;
		serlist = this.findAndRemove2ndOrderNode(serlist);
	}

	return serlist;
}

SPGGrouper.prototype.normalizeAndSortSerList = function(serlist)
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

SPGGrouper.prototype.findAndMergePar = function(serlist)
{
	var lhs, rhs;
	var parnode;
	var innerlist = [];
	var output;

	this.normalizeAndSortSerList(serlist);
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

SPGGrouper.prototype.mergeAllPar = function(serlist)
{
	var oldlength = serlist.length + 1;
	while (serlist.length != oldlength)
	{
		oldlength = serlist.length;
		serlist = this.removeAll2ndOrder(serlist);
		serlist = this.findAndMergePar(serlist);
	}

	return serlist;
}

SPGGrouper.prototype.countLeaves = function(counts, serlist)
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

SPGGrouper.prototype.findNodeWithLeaves = function(lcount)
{
	var found = -1;
	for (var i = 0; i < lcount.length && found == -1; i++)
		{ if (lcount[i] > 1) { found = i; } }
	for (var i = 0; i < lcount.length && found == -1; i++)
		{ if (lcount[i] > 0) { found = i; } }
	return found;
}

SPGGrouper.prototype.leavesOn = function(node, counts, serlist)
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

SPGGrouper.prototype.removeMaxHeight = function(leaves, serlist)
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

SPGGrouper.prototype.splitSerList = function(leaves, serlist)
{
	var output = {leaf: [], nonleaf: []};
	for (var i in serlist)
	{
		if (leaves.indexOf(i) > -1) { output.leaf.push(serlist[i]); }
		else { output.nonleaf.push(serlist[i]); }
	}

	return output;
}

SPGGrouper.prototype.mergeLeafs = function(found, newid, list)
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

SPGGrouper.prototype.maxNodeId = function(serlist)
{
	var output = 0;
	for (i = 0; i < serlist.length; i++)
	{
		output = Math.max(serlist[i].maxID(), output);
	}

	return output;
}

SPGGrouper.prototype.classifyLeaves = function(serlist)
{
	var counts = this.countNodeOrders(serlist);
	var lcount = this.countLeaves(counts, serlist);
	var found = this.findNodeWithLeaves(lcount);
	if (found == -1) { return serlist; }
	var leaves = this.leavesOn(found, counts, serlist);
	if (counts[found] == lcount[found]) { leaves = this.removeMaxHeight(leaves, serlist); }
	if (leaves.length == 1) { return serlist; }
	var split = this.splitSerList(leaves, serlist);
	var output = split.nonleaf;
	output.push(this.mergeLeafs(found, this.maxNodeId(serlist)+1, split.leaf));
	return output;
}

SPGGrouper.prototype.mergeAllLeaf = function(serlist)
{
	var oldlength = serlist.length + 1;
	while (serlist.length != oldlength)
	{
		oldlength = serlist.length;
		serlist = this.mergeAllPar(serlist);
		serlist = this.classifyLeaves(serlist);
	}

	return serlist;
}

SPGGrouper.prototype.foldOverLoneLeaf = function(found, leaf, ser)
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

SPGGrouper.prototype.classifyLoneLeaves = function(serlist)
{
	var counts = this.countNodeOrders(serlist);
	var lcount = this.countLeaves(counts, serlist);
	var found = this.findNodeWithLeaves(lcount);
	if (found == -1) { return serlist; }
	var leaves = this.leavesOn(found, counts, serlist);
	var split = this.splitSerList(leaves, serlist);
	var output = split.nonleaf;
	var neigh;
	for (var i in output)
	{
		if (output[i].first() == found || output[i].last() == found)
		{
			neigh = i;
		}
	}
	output[neigh] = this.foldOverLoneLeaf(found, split.leaf[0], output[neigh]);
	return output;
}

//iterates the mergeAllLeaf function, collecting leaf (and newly created leaf)
SPGGrouper.prototype.mergeAllLone = function(serlist)
{
        var oldlength = serlist.length + 1;
        while (serlist.length != oldlength)
        {
                oldlength = serlist.length;
                serlist = this.mergeAllLeaf(serlist);
                serlist = this.classifyLoneLeaves(serlist);
        }

        return serlist;
}

//converts a serial node into a list of xy pairs
SPGGrouper.prototype.serNodeToXY = function(ser)
{
	var starth = ser.width()/2.0;
	var output = ser.XY(0.0, starth);
	return output;
}

// ensures all elements are numeric rather than string
SPGGrouper.prototype.intifyArray = function(arr)
{
	var output = [];

	for (var idx in arr)
	{
		output.push(parseInt(arr[idx]));
	}

	return output;
}

SPGGrouper.prototype.ioTripleSort = function(a,b) {
	if (a[0] < b[0] || (a[0]==b[0] &&  a[1] < b[1])) { return -1; }
	else if (a[0]==b[0] && a[1]==b[1]) { return 0; }
	else { return 1; }
}

SPGGrouper.prototype.mergeEdgeCounts = function(net_def) {
	spgg = this;
	net_def.i.sort(spgg.ioTripleSort);
	net_def.o.sort(spgg.ioTripleSort);
	var temp = [];
	var output = {"i":[], "o":[]};
	for (var i = 0; i < net_def.i.length; i++) {
		if (i == 0 || spgg.ioTripleSort(net_def.i[i-1], net_def.i[i]) != 0) {
			temp.push(net_def.i[i]);
		} else {
			temp[temp.length-1][2] += net_def.i[i][2];
		}
	}
	output.i = temp;
	temp = [];
	for (var i = 0; i < net_def.o.length; i++) {
		if (i == 0 || spgg.ioTripleSort(net_def.o[i-1], net_def.o[i]) != 0) {
			temp.push(net_def.o[i]);
		} else {
			temp[temp.length-1][2] += net_def.o[i][2];
		}
	}
	output.o = temp;

	return output;
}

// breaks the input, line-by-line and parses each separately
// divides into 2 definitions (arrays), input and output
SPGGrouper.prototype.readCommand = function(net_obj)
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


	return this.mergeEdgeCounts(output);
}

// looks at input and output definitions and collects unique lists
// for either state or transition
SPGGrouper.prototype.idxList = function(postParse, offs)
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
SPGGrouper.prototype.stateList = function(postParse) { return this.idxList(postParse, 0); }
// unique ordered list of all transitions in use
SPGGrouper.prototype.transList = function(postParse) { return this.idxList(postParse, 1); }

// creates a N-by-N matrix, undefined everywhere
SPGGrouper.prototype.NbyNNull = function(n)
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
SPGGrouper.prototype.StateTransCommonIdx = function(states, trans)
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
SPGGrouper.prototype.toStateTransMtx = function(postparse)
{
	var states = this.stateList(postparse);
	var trans = this.transList(postparse);
	var size = states.length + trans.length;
	var output = this.NbyNNull(size);
	var mtx_idx = this.StateTransCommonIdx(states, trans);

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

SPGGrouper.prototype.withNameAndType = function(xy, postparse)
{
	var output = [];
	var states = this.stateList(postparse);
	var trans = this.transList(postparse);
	var mtx_idx = this.StateTransCommonIdx(states, trans);
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


function petriSVGfact()
{
	this.radius = 10.0;
	this.tsize = {w: 20, h: 30};
	this.mult = 30.0;
	this.xoffs = 10.0;
	this.yoffs = 10.0;

	this.svgtop = function(w, h)
	{
		var svghead = " xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" ";
		return "<svg viewbox=\"" + (-this.xoffs)  + " " + 0.0 + " " + w + " " + h + "\"" + svghead + ">\n";
	}

	this.makeTrans = function(loc, mult, xoffs, yoffs)
	{
		return "<rect x=\"" + (loc.x*mult + xoffs -this.radius)
			+ "\" y=\"" + (loc.y*mult + yoffs -this.radius) + "\" "
			+ "width=\"" + this.radius*2.0 + "\" "
			+ "height=\"" + this.radius*2.0 + "\" "
			+"stroke=\"gray\" stroke-width=\"1\" fill=\"CornflowerBlue\" />";
	}

	this.makeState = function(loc, mult, xoffs, yoffs)
	{
		return "<circle cx=\"" + (loc.x*mult + xoffs)
			+ "\" cy=\"" + (loc.y*mult + yoffs) + "\" "
			+ "r=\"" + this.radius + "\" stroke=\"brown\" stroke-width=\"1\" fill=\"yellow\" />";
	}

	this.makeObjs = function(xy)
	{
		var output = "";
		for (var idx in xy)
		{
			output += xy[idx].type == "state"
				? this.makeState(xy[idx], this.mult, this.xoffs, this.yoffs)
				: this.makeTrans(xy[idx], this.mult, this.xoffs, this.yoffs);
		}

		return output;
	}

	this.label = function(node, mult, xoffs, yoffs)
	{
		return "<text x=\"" + (node.x*mult + xoffs)
			+ "\" y=\"" + (node.y * mult + yoffs)
			+ "\" font-size=\"" + this.radius/1.50 + "\" "
			+ " dominant-baseline=\"middle\" "
			+ " font-family=\"verdana\" "
			+ " text-anchor=\"middle\" >"
			+ node.display + "</text>\n";
	}

	this.makeText = function(xy)
	{
		var output = "";
		for (var idx in xy)
		{
			output += this.label(xy[idx], this.mult, this.xoffs, this.yoffs);
		}
		return output;
	}

	this.locAdd = function(loc1, loc2) { return { x: loc1.x + loc2.x, y: loc1.y + loc2.y }; }
	this.locScale = function(loc, k) { return { x: k*loc.x, y:k*loc.y }; }
	this.locDist = function(loc) { return Math.sqrt(loc.x*loc.x + loc.y*loc.y); }
	this.locRot = function(loc, angle)
	{
		return {x: loc.x*Math.cos(angle) - loc.y*Math.sin(angle),
		y: loc.x*Math.sin(angle) + loc.y*Math.cos(angle) };
	}

	this.lineArray = function (locarr) {
		var output = "\t<path d=\"M";
		if (locarr.length < 2) { throw("Array too short for lineArray."); }
		var temp = locarr.map(function(q) { return q.x + "," + q.y + " "; });
		output += temp[0];
		for (var i = 1; i < temp.length; i++) {
			output += "L" + temp[i];
		}
		output += "\" style=\"stroke-opacity:0.7;stroke:rgb(0,0,0);stroke-width:1\" fill=\"none\" />\n";
		return output;
	}

	this.lineAt = function(loc1, loc2)
	{
		return "<line x1=\"" + loc1.x + "\" "
			+ " y1=\"" + loc1.y + "\" "
			+ " x2=\"" + loc2.x + "\" "
			+ " y2=\"" + loc2.y + "\" "
			+ " style=\"stroke-opacity:0.7;stroke:rgb(0,0,0);stroke-width:1\" />";
	}
	this.triangle = function(p1, p2, p3)
	{
	}
	this.curveAt = function(loc1, loc2)
	{
		var diff = this.locAdd(loc2, this.locScale(loc1, -1.0));
		var half = this.locScale(this.locAdd(loc2, loc1), 0.5);
		var len = this.locDist(diff);
		var dir = this.locScale(diff, 1/len);
		var centerpoint =  this.locAdd(half, this.locScale({x: dir.y, y: -dir.x }, len/4.0));

		return "<path d=\"M" + Math.round(loc1.x) + "," + Math.round(loc1.y) + " "
			+ "S" + Math.round(centerpoint.x) + "," + Math.round(centerpoint.y) + " "
			+ " " + Math.round(loc2.x) + "," + Math.round(loc2.y) + "\" "
			+ " style=\"stroke-opacity:0.7;stroke:rgb(0,0,0);stroke-width:1\" "
			+ " fill=\"none\" />";
	}
	this.radialLine = function(start, angle, len)
	{
		return this.locAdd(start, this.locScale( this.locRot({x:1.0, y:0.0}, angle), len));
	}
	this.angleFromDir = function(dir)
	{
		var dist = this.locDist(dir);
		return (dir.y == 0 ? 0 : Math.atan(dir.y/dir.x))
			+ ( dir.x < 0 ? 0 : Math.PI);
	}

	this.singleArrow = function(loc1, loc2, iter)
	{
		var diff = this.locAdd(loc2, this.locScale(loc1, -1.0));
		var len = this.locDist(diff);
		var dir = this.locScale(diff, 1/len);
		var start = this.locAdd(this.locScale(dir, this.radius), loc1);
		var end = this.locAdd(this.locScale(dir, len - this.radius), loc1);
		var angle = this.angleFromDir(dir);
		var output = "";
		var inc = this.locScale({x: dir.y, y: -dir.x}, 4.0);

		for (var i = 0; i < iter; i++)
		{
			output += this.curveAt(start, end)
				+ this.lineArray([this.radialLine(end, angle - Math.PI/9, this.radius/3.0),
				end,
				this.radialLine(end, angle + Math.PI/3, this.radius/3.0)]);
			start = this.locAdd(start, inc);
			end = this.locAdd(end, inc)
		}

		return output;
	}

	this.makeRevLook = function(xy)
	{
		var output = {};
		for (var i in xy)
		{
			output[xy[i].type + "_" + xy[i].display] = i;
		}
		return output;
	}

	this.makeArrows = function(xy, commands)
	{
		var output = "";
		var lookup = this.makeRevLook(xy);
		var state, trans;
		var sloc, tloc;

		for (var i in commands.i)
		{
			state = xy[lookup["state_"+commands.i[i][0]]];
			trans = xy[lookup["trans_"+commands.i[i][1]]];
			sloc = this.locAdd(this.locScale(state, this.mult),{ x: this.xoffs, y: this.yoffs });
			tloc = this.locAdd(this.locScale(trans, this.mult),{ x: this.xoffs, y: this.yoffs });

			output += this.singleArrow(sloc, tloc, commands.i[i][2]);
		}

		for (var i in commands.o)
		{
			state = xy[lookup["state_"+commands.o[i][0]]];
			trans = xy[lookup["trans_"+commands.o[i][1]]];
			sloc = this.locAdd(this.locScale(state, this.mult),{ x: this.xoffs, y: this.yoffs });
			tloc = this.locAdd(this.locScale(trans, this.mult),{ x: this.xoffs, y: this.yoffs });

			output += this.singleArrow(tloc, sloc, commands.o[i][2]);
		}

		return output;
	}

	this.make = function(xy, commands)
	{
		var output = "";
		this.radius = 10;
		if (xy.length == 0) {return this.svgtop(3, 1) + "</svg>\n";}
		this.tsize.w = 4*this.xoffs + this.mult * Math.max.apply(null, xy.map(function (x) {return x.x;}));
		this.tsize.h = 4*this.yoffs + this.mult * Math.max.apply(null, xy.map(function (x) {return x.y;}));
		output += this.svgtop(this.tsize.w, this.tsize.h);
		output += this.makeObjs(xy);
		output += this.makeText(xy);
		output += this.makeArrows(xy, commands);

		return output + "</svg>\n";
	}

	this.makeWithDisjoint = function(net_obj, crit_obj) {
		var spgg = new SPGGrouper();
		var commands = spgg.readCommand(net_obj);
		var mtx = spgg.toStateTransMtx(commands);
		var serlist = spgg.mtxToSerList(mtx);
		var comb = new SPGParNode(null, null);
		var namedpoints;

		comb.data = spgg.mergeAllPar(serlist);
		comb.data = spgg.mergeAllLone(comb.data);

		namedpoints = spgg.withNameAndType(spgg.serNodeToXY(comb), commands);
		return this.make( spgg.disjointNodes(net_obj, crit_obj, namedpoints), commands);
	}
}

