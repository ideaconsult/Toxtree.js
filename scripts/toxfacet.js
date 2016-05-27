/* toxfacet.js - General hierarchy viewer, using Voronoi diagrams
 *
 * Copyright 2012-2016, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxFacet = (function () {
  var defaultSettings = {
        "viewStep": 4,
        "loadStep": Infinity,
        "minFontSize": 11.0,
        "maxFontSize": 64.0,
        "showTooltips": false,
        "numberFormat": null,   // which defaults to jToxKit's number formatter. If non-function d3js's d3.format is used with that given value
        
        // colors
        "parentFill": "rgba(240, 240, 240, 0.5)", // Color for transparent parent fills. The provided object's toString() method will be invoked.
        "colorScale": null,                       // This will inforce defaulting to: d3.scale.category10(). Otherwise - an array of colors is expected.
        "fValue": function(d) { return Math.sqrt(d.size); }
      },
      instanceCount = 0;
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even in manual initialization.

    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    self.instanceNo = instanceCount++;

    if (!self.settings.viewRange)
      self.settings.viewRange = [0, self.settings.viewStep];
      
    if (self.settings.loadStep < self.settings.viewStep)
      self.settings.loadStep = self.settings.viewStep;
      
    if (!self.settings.numberFormat)
      self.settings.numberFormat = jT.ui.formatCounter;
    else if (typeof self.settings.numberFormat !== "function")
      self.settings.numberFormat = d3.format(self.settings.numberFormat);
          
    // some color scale setup
    self.settings.colorScale = !!self.settings.colorScale ? d3.scale.ordinal().range(self.settings.colorScale) : d3.scale.category10();
    var dom = new Array(self.settings.colorScale.range().length);
    for (var i = 0;i < dom.length; ++i) dom[i] = i;
    self.settings.colorScale.domain(dom);

    // finally make the query, if Uri is provided
    if (self.settings['facetUri'] != null){
      self.queryFacets(self.settings['facetUri']);
    }
  };
  
  /***** Now follow the helper functions ****/    
  function polyFill(d) {
  	if (!!d.children && d.children.length > 0)
  	  return d.context.settings.parentFill.toString();
  		
  	var v = d.value / d.parent.value,
  	    c = d3.hsl(d.context.settings.colorScale(d.master));
  	
    c.l = Math.max(0.9 - v, 0.1);
  	return c.toString();
  }
  
  function polyStroke(d) {
  	return 6.5 - 6 * d.depth / d.context.dataTree.maxdepth;
  }
  
  function textOpacity (d, i) { 
    return d.depth / (d.context.dataTree.maxdepth * 2) + 0.5; 
  }
  
  function traverseTree(tree, hidden, pre, post) {
    if (typeof hidden !== "boolean") {
      post = pre;
      pre = hidden;
      hidden = false;
    }
    
    var r = !!pre ? pre(tree) : true,
        arr = tree.children;

    if (!arr && hidden)
      arr = tree.hidden;
      
    if (r !== false && arr != null)
      for (var i = 0;i < arr.length; ++i)
        traverseTree(arr[i], hidden, pre, post);
    
    if (!!post) 
      post(tree);
  }
  
  function textWrap(text, width) {
    text.each(function(i) {      
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = .25,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = 0,
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
          
      if (typeof width === 'function') {
        width = width(text.datum(), i);
      }
          
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineHeight + "em").text(word);
          ++lineNumber;
        }
      }
      
      text.attr("y", (-lineNumber * lineHeight / 2) + "em");
    });
  }
  
  function polyTransform(poly, ctm) {
    var  box = false;
        
    if (poly.left !== undefined) {
      poly = [[poly.left, poly.top], [poly.right, poly.bottom]];
      box = true;
    }
    
    var out = new Array(poly.length);
    
    for (var i = 0;i < poly.length; ++i) {
      var x = poly[i].x === undefined ? poly[i][0] : poly[i].x,
          y = poly[i].y === undefined ? poly[i][1] : poly[i].y;
          
      out[i] = [ ctm.a * x + ctm.c * y + ctm.e, ctm.b * x + ctm.d * y + ctm.f ];
    }
    
    return !box ? out : { 
      'left': out[0][0], 
      'top': out[0][1], 
      'right': out[1][0], 
      'bottom': out[1][1], 
      'width': out[1][0] - out[0][0], 
      'height': out[1][1] - out[0][1] 
    };
  }
        
  function showHideOnZoom(tree, context, selection, isVisible) {
    var victims = [],
        ressurects = [],
        visual = selection;

    traverseTree(tree, false, function (d) {
      var el = d.element;
      
      if (!isVisible(el)) {
        d.hidden = d.children;
        delete d.children;
        victims.push(el);
        return false;

      } else {
        if (d.hidden !== undefined) {
          for (var e = d; !!e && e.depth > selection.depth; e = e.parent);
          if (e == selection) {
            d.children = d.hidden;
            delete d.hidden;
            e.element.classList.remove("leaf");
            e.element.classList.add("parent");
            populateRect(d, d.polygon, context.settings);
            presentPoly(d, d3.select(d.element));
            ressurects.push(d.element);
          }
        }
        
        // equalize depths
        while (d.depth > visual.depth) d = d.parent;
        while (d.depth < visual.depth) visual = visual.parent;
          
        // now make sure the visual is the first common parent of d (which is visible) 
        // and visual, which was known to be visible too.
        while (d != visual) {
          d = d.parent;
          visual = visual.parent;
        }
      }
      
      return true;
    });
    
    return { "shown": ressurects, "hidden": victims, "active": visual };
  }
  
  function clusterZoom(d) {
    // if we have hidden children, we'd like to zoom directly to them.
    if (!d.hidden)
      d = d.parent;
      
    var context = d.context,
        selection = d,
        el = d.element,
        scale = 1,
        backCTM = context.rootRegion.node().getCTM().inverse(),
      	rootBBox = el.ownerSVGElement.getBoundingClientRect(),
      	ctm = el.ownerSVGElement.createSVGMatrix(),
      	normalizeBox = function (box) {
        	return { 
            'left': box.left - rootBBox.left, 'top': box.top - rootBBox.top, 
            'right': box.right - rootBBox.left, 'bottom': box.bottom - rootBBox.top, 
            'width': box.width, 'height': box.height };
      	}
      	
    if (selection == context.currentSelection)
      return context.currentSelection;
        
    if (el != context.rootRegion.node()) {
      var bbox = polyTransform(normalizeBox(el.getBoundingClientRect()), backCTM);

      scale = Math.min(rootBBox.width / bbox.width, rootBBox.height / bbox.height) * 0.8;
      
      if (scale > 1.0) {
        ctm = ctm
          .scale(scale)
          .translate((rootBBox.width / scale - bbox.right - bbox.left) / 2, (rootBBox.height / scale - bbox.bottom - bbox.top) / 2);
        
        // now check if the transformation won't put the edges of the whole picture inside it.
        var newRootBBox = polyTransform(normalizeBox(rootBBox), ctm),
            offX = 0,
            offY = 0;
            
        if (newRootBBox.left > 0)
          offX = -newRootBBox.left;
        else if (newRootBBox.right < rootBBox.width)
          offX = rootBBox.width - newRootBBox.right;
          
        if (newRootBBox.top > 0)
          offY = -newRootBBox.top;
        else if (newRootBBox.bottom < rootBBox.height)
          offY = rootBBox.height - newRootBBox.bottom;
        
        // since the scale is already applied on the transformation - we need to scale down the values.
        ctm = ctm.translate(offX / scale, offY / scale);
      }
      else
        scale = 1;
    }
    
    // backCTM becomes the transformation from the current to the new state
    backCTM = backCTM.multiply(ctm);
    
    // Ok, we now prepare for the zoom - counting the outsiders and the returnings
    var t = d3.transition("zoom").duration(500),
        isVisible = function (el) {
          var bbox = polyTransform(normalizeBox(el.getBoundingClientRect()), backCTM),
              l = Math.max(bbox.left, 0),
              t = Math.max(bbox.top, 0),
              r = Math.min(bbox.right, rootBBox.width),
              b = Math.min(bbox.bottom, rootBBox.height);
          return l < r && t < b;
        },
        delta = showHideOnZoom(context.dataTree, context, selection, isVisible);
      
    // now launch the transition to...
    t.each(function () {
      // ... transform the root...
      context.rootRegion
        .transition("zoom")
          .attr("transform", "translate(" + ctm.e + "," + ctm.f + ") scale(" + scale + ")");
      
      // ... scale the path's strokes, not to become so thick, while zoomed...
      d3.select(delta.active.element).selectAll("path")
        .transition("zoom")
          .style("stroke-width", function (d, i) { 
            return polyStroke(d, i) / Math.sqrt(scale);
          });
      
      // ... make sure former invisibles are back visible
      d3.selectAll(delta.shown)
        .transition("zoom")
          .style("opacity", 1.0);
      
      // .. and dismiss all invisibles
      d3.selectAll(delta.hidden)
        .transition("zoom")
          .style("opacity", 0.1);
    });
    
    return selection;
  }
    
  function clusterDOM(d, i) {
  	d.element = this;
  	
  	// offset the whole geometry of the node  	
    d.polygon.forEach(function (pt) { pt[0] -= d.centroid.x; pt[1] -= d.centroid.y; });
    if (!!d.parent) {
      d.centroid.x -= d.parent.offset.x;
      d.centroid.y -= d.parent.offset.y;
    }
    	  
    // now proceed with drawing  	
  	var g = d3.select(this)
  		.attr("class", "cluster " + (!!d.children ? "parent" : "leaf"))
  		.attr("transform", d.centroid.x || d.centroid.y ? 'translate(' + d.centroid.x + ',' + d.centroid.y  + ')' : null)
    	.on("mouseout", function () { this.classList.remove("selected"); } )
    	.on("mouseover", function () { this.classList.add("selected"); })
    	.on("click", function (d) {
        d3.event.stopPropagation();
        d.context.currentSelection = clusterZoom(d);
    	});

    presentPoly(d, g);
  	  	  
    g.append("path")
  		.attr("fill", polyFill(d, i))
  		.attr("stroke-width", polyStroke(d, i))
  		.attr("d", !!d.polygon ? "M" + d.polygon.join("L") + "Z" : null);
  		
    var svgt = g.append("text")
      .attr("x", -d.dx * .25)
  	  .attr("font-size", Math.max(d.context.settings.maxFontSize * Math.sqrt(d.value / d.context.dataTree.value), d.context.settings.minFontSize))
  	  .style("opacity", textOpacity(d, i))
  	  .text(d.name.join("/"))
  	  .call(textWrap, d.dx * 0.5)
  	    .append("tspan")
  	    .attr("dy", "1.1em")
  	    .attr("x", "0")
        .text(d.size != null ? "(" + d.context.settings.numberFormat(d.size) + ")" : null)
  
/*
    d3plus.textwrap()
      .container(svgt)
      .align("center")
      .shape("square")
      .width(d.dx * 0.5)
      .draw();
    
    svgt.append("tspan")
  	    .attr("dy", "1.1em")
  	    .attr("x", "0")
        .text(d.size != null ? "(" + d.size + ")" : null)
*/
  }
  
  // Runs treemap and voronoi, to fill the tree with additional, polygon information
  function populateRect(tree, boundaries, settings, width, height) {
	  console.log("Populate for: " + tree.name);

    if (!width || !height) {
        var r = d3plus.geom.largestRect(boundaries, { 'angle': 0, 'maxAspectRatio': 7})[0];
        width = r.width;
        height = r.height;
    }
    
    var treemap = d3.layout.treemap()
          .size([width, height])
          .sticky(true)
          .value(settings.fValue),
        originalDepth = tree.depth || 0;
    
    var nodes = treemap.nodes(tree).reverse(),
        vertices = nodes
    	  	.map(function (e, i) {  e.depth += originalDepth; return !e.children ?  { x: e.x + e.dx / 2, y: e.y + e.dy / 2, value: e.value, index: i } : null; })
    	  	.filter(function (e) { return e != null; });

    var voronoi = d3.geom.voronoi()
      .clipPoly(boundaries)
      .x(function (d) { return d.x; })
      .y(function (d) { return d.y; })
      .value (function (d) { return d.value; });

    voronoi.centroidal(vertices, 2).forEach(function (p) { 
      var i = p.point.index;
      p.edges = p.cell.edges;
      delete p.cell;
      
      nodes[i].polygon = p;
      nodes[i].centroid = p.site;
    });      
  
  
    // ensure everybody has polygon and centroid members. NOTE: We're traversing in reverse
    // which implies that children are traversed before their parents.
    nodes.forEach(function (node) {
      if (!node.centroid) {
        node.polygon = mergePolygons(node.children.map(function(n) { return n.polygon; }))
        var carr = d3.geom.polygon(node.polygon).centroid();
        node.centroid = { x: carr[0], y: carr[1] };
      }
    });
    
    tree.offset = { x: 0, y: 0 };
    tree.offsetRoot = tree;
    nodes.reverse().forEach(function (node) {
      if (node != tree) {
        node.offset = { x: node.parent.offset.x + node.centroid.x, y: node.parent.offset.y + node.centroid.y };
        node.offsetRoot = tree;
      }
    });
  }
  
  function presentPoly(tree, root) {
    if (!!tree.children && tree.children.length > 0 )
      root
        .selectAll("g")
        .data(tree.children)
        .enter()
          .insert("g", ":first-child")
          .each(clusterDOM);
  }
  
  // Merges several adjacent polygon to find the outlining one, which is returned.
  function mergePolygons(poly) {
  	var merged = [],
  	    edges = [];
  
    // traverse all edges and mark how may times, each one is used.
  	poly.forEach(function (p, pi) {
    	p.edges.forEach(function (e, ei) {
      	if (e.edge.use === undefined)
      	  e.edge.use = { count: 1, poly: [pi], index: [ei] };
        else {
          ++e.edge.use.count;
          e.edge.use.poly.push(pi);
          e.edge.use.index.push(ei);
        }
    	});
  	});
  	
  	for (var started = null, pi = 0, ei = 0;true; ++ei) {
    	// ensure that we're within boundaries
    	if (ei >= poly[pi].edges.length) {
        ei = 0;
        if (started === null)
          ++pi;
      }
    	
    	// we've made a circle around
    	if (started !== null && pi == started[0] && ei == started[1])
    		break;
    		
    	var edge = poly[pi].edges[ei];
    	
  		if (1 == edge.edge.use.count) {
      	var s = edge.start();
    	  merged.push([s.x, s.y]);
    	  edges.push(edge);
    	  if (started === null)
    	    started = [pi, ei];
      }
      else if (started !== null) {
        var ni = edge.edge.use.poly.findIndex(function (p) { return p != pi; });
        pi = edge.edge.use.poly[ni];
        ei = edge.edge.use.index[ni];
      }
  	}
  
    // traverse again to delete the usage counter
  	poly.forEach(function (p, pi) {
    	p.edges.forEach(function (e, ei) {
        delete e.edge.use;
    	});
  	});
  	
  	merged.edges = edges;
  	return merged;
  }
  
  function treeFromFacets(facets, context) {
    var root = { 'name': [""], 'children': [], 'context': context },
        groups = { };
  	
  	var addChild = function (p, e) {
  		p.children.push(e);
  		if (p.size !== undefined)
  			p.size += e.size;
      e.parent = p;
      e.context = context;
  	}
  	
  	for (var i = 0;i < facets.facet.length; ++i) {
  		var f = facets.facet[i];
  		var parent = groups[f.subcategory];
  		
  		if (parent === undefined) {
  			groups[f.subcategory] = parent = { 'name': [f.subcategory], 'size': 0, 'children': [], 'id': root.children.length, 'maxdepth': 1 };
  			addChild(root, parent);
  		}
  			
  		el = { 'name': [f.value], 'size': f.count, 'maxdepth': 0 };
  		addChild(parent, el);
  	}
  	
  	while (root.children.length == 1)
  		root = root.children[0];
  	
  	root.maxdepth = 2;
  	return root;
  }
  
  function extractTree(data, context, depth, master) {
    
    if (depth == null)
      depth = 0;
      
    var tree = { 'name': [data.name], 'size': data.size || 1, 'depth': depth, 'context': context, 'maxdepth': 0, 'count': 1 };

    if (master != null)
      tree.master = master;
    
    if (!data.children || data.children.length < 1)
      ;
    else if (data.children.length == 1) {
      tree = extractTree(data.children[0], context, depth, master);
      tree.name.splice(0, 0, data.name);
    }
    else if (depth < context.settings.loadDepth) {
      var sz = 0,
          dep = 0,
          cnt = 0,
          child,
          arr = new Array(data.children.length);
        
      for (var i = 0;i < data.children.length; ++i) {
        arr[i] = child = extractTree(data.children[i], context, depth + 1, master != null ? master : i);
        
        child.parent = tree;
        sz += child.size;
        cnt += child.count;
        dep = Math.max(child.maxdepth, dep);
      }
      
      tree.size = sz;
      tree.count = cnt;
      tree.maxdepth = dep + 1;
      
      if (depth < context.settings.viewRange[1])
        tree.children = arr;
      else
        tree.hidden = arr;
    }
  
    return tree;
  }
    	
  cls.prototype.init = function () {
    var self = this;
        
    self.rootSVG = d3.select(this.rootElement).append("svg")
      .attr("width", this.rootElement.clientWidth)
      .attr("height", this.rootElement.clientHeight);
                
    $(document).on("keydown", function (e) {
      var key = e.key || e.keyCode;
      if (key != 27) // i.e. ESC
        return;
        
      if (!self.currentSelection.root)
        self.currentSelection = clusterZoom(self.currentSelection);
    });
    
    self.currentSelection = null;
    self.initialized = true;
  };
  	
  cls.prototype.queryRange = function (facetUri, dataRoot) {
    var self = this,
        dataDepth = (!!dataRoot ? dataRoot.depth : 0);

    // TODO: Form the proper URL for loading from a specific node, downwards    
    d3.json(window.location.search.substring(1) || facetUri, function(error, data) {
      if (error) throw error;
    
      var width, height,
          boundaries,
          nodes, tree;

      self.settings.loadDepth = dataDepth + self.settings.loadStep;
      
      if (data.facet !== undefined) 
        tree = treeFromFacets(data, self);
      else
        tree = extractTree(data, self, dataDepth);

      if (dataDepth === 0) {
        self.rootRegion = self.rootSVG
          .append("g")
          .attr("class", "cluster cluster-root");
          
        self.dataTree = tree;
        self.dataTree.centroid = { x: 0, y: 0};
        self.dataTree.element = self.rootRegion.node();
        
        width = self.rootElement.clientWidth;
        height = self.rootElement.clientHeight;
        boundaries = [[0, 0], [0, height], [width, height], [width, 0]];
      }
      
      populateRect(tree, boundaries, self.settings, width, height);
      presentPoly(tree, self.rootRegion);
    });
  }
  
  cls.prototype.queryFacets = function (facetUri) {
    var self = this;
    
    if (!self.initialized)
      self.init();
      
    self.queryRange(facetUri)
  };
  
  return cls;
})();
