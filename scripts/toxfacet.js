/* toxfacet.js - General hierarchy viewer, using Voronoi diagrams
 *
 * Copyright 2012-2016, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxFacet = (function () {
  var defaultSettings = {
      "viewStep": 3,
      "loadStep": Infinity,
      "minFontSize": 10.0,
      "maxFontSize": 64.0,
      "showTooltips": false,
      "parentZoom": true,     // zoom to the parent of the selected item. On false - go one level deeper - directly to the selection.
      "unloadDelay": 3000,    // unload the invisible items after that many milliseconds.
      
      // colors
      "parentFill": "rgba(240, 240, 240, 0.5)", // Color for transparent parent fills. The provided object's toString() method will be invoked.
      "colorScale": d3.scale.category10(),                       
      
      "onHover": null,
      "onHoverOut": null,
      "onSelect": null,
      "fValue": function(d) { return Math.sqrt(d.size); },
      "fLabel": function(d) { return { "label": d.name.join("/"), "size" : d.size > 200 ? "(" + ccLib.briefNumber(d.size) + ")" : null }; },
    };
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even in manual initialization.

    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);

    if (!self.settings.viewRange)
      self.settings.viewRange = [0, self.settings.viewStep];
      
    if (self.settings.loadStep < self.settings.viewStep)
      self.settings.loadStep = self.settings.viewStep;
                
    // some color scale setup
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
    return (4.5 - 4 * d.depth / (d.context.settings.viewRange[1] + 1)) / Math.sqrt(d.context.currentScale); 
  }
  
  function textFontSize(d) { 
    return Math.max(
      d.context.settings.maxFontSize * Math.sqrt(d.value / d.context.dataTree.value), 
      d.context.settings.minFontSize) / Math.sqrt(d.context.currentScale); 
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

    ccLib.traverseTree(tree, function (d) {
      var el = d.element;
      
      if (!isVisible(el)) {
        console.log ("Go invisible: " + d.name.join("/"));
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
            d.element.classList.remove("leaf");
            d.element.classList.add("parent");
            
            populateRect(d, d.polygon);
            
            var g = d3.select(d.element);
            g.select("path").attr("fill", polyFill(d));

            presentTree(d, g);
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
    });
    
    return { "shown": ressurects, "hidden": victims, "active": visual };
  }
  
  function clusterZoom(d) {
    // if we have hidden children, we'd like to zoom directly to them.
    if (d.context.settings.parentZoom)
      d = d.parent;

    if (d == d.context.currentSelection)
      return d;
      
    var context = d.context,
        selection = d,
        el = d.element,
        backCTM = context.rootRegion.node().getCTM().inverse(),
      	rootBBox = el.ownerSVGElement.getBoundingClientRect(),
      	ctm = el.ownerSVGElement.createSVGMatrix(),
      	normalizeBox = function (box) {
        	return { 
            'left': box.left - rootBBox.left, 'top': box.top - rootBBox.top, 
            'right': box.right - rootBBox.left, 'bottom': box.bottom - rootBBox.top, 
            'width': box.width, 'height': box.height };
      	};
        
    if (el != context.rootRegion.node()) {
      var bbox = polyTransform(normalizeBox(el.getBoundingClientRect()), backCTM),
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
    }
    
    // backCTM becomes the transformation from the current to the new state
    backCTM = backCTM.multiply(ctm);
    context.currentScale = ctm.a;
    
    // Ok, we now prepare for the zoom - counting the outsiders and the returnings
    var t = d3.transition("zoom").duration(500),
        delta = showHideOnZoom(context.dataTree, context, selection, function (el) {
          var bbox = polyTransform(normalizeBox(el.getBoundingClientRect()), backCTM),
              l = Math.max(bbox.left, 0),
              t = Math.max(bbox.top, 0),
              r = Math.min(bbox.right, rootBBox.width),
              b = Math.min(bbox.bottom, rootBBox.height);
          return l < r && t < b;
        });
      
    // now launch the transition to...
    t.each(function () {
      // ... transform the root...
      context.rootRegion
        .transition("zoom")
          .attr("transform", "translate(" + ctm.e + "," + ctm.f + ") scale(" + ctm.a + ")");
      
      // ... scale the path's strokes, not to become so thick, while zoomed...
      var active = d3.select(delta.active.element);
      
      active.selectAll("path")
        .transition("zoom")
          .style("stroke-width", polyStroke);
      
      active.selectAll("text")
        .transition("zoom")
          .style("font-size", textFontSize);
          
      // ... make sure former invisibles are back visible
      d3.selectAll(delta.shown)
        .transition("zoom")
          .style("opacity", 1.0);
      
      // .. and dismiss all invisibles
      d3.selectAll(delta.hidden)
        .transition("zoom")
          .style("opacity", 0.0);
    });
    
    return selection;
  }
    
  function clusterDOM(d, i) {
  	d.element = this;
  	
    // now proceed with drawing  	
  	var settings = d.context.settings, 
  	    g, t, fontSz, svgt,
  	    offset = [0, 0];

  	// offset the whole geometry of the node  	
    d.polygon.forEach(function (pt) { pt[0] -= d.centroid.x; pt[1] -= d.centroid.y; });
    
    if (!!d.parent)
      offset = [ d.centroid.x - d.parent.centroid.x, d.centroid.y - d.parent.centroid.y ];
  	    
  	g = d3.select(this)
  		.attr("class", "cluster " + (!!d.children ? "parent" : "leaf"))
  		.attr("transform", offset[0] || offset[1] ? 'translate(' + offset[0]  + ',' + offset[1]  + ')' : null)
    	.on("mouseout", function (d) { 
      	this.classList.remove("selected"); 
      	if (this.classList.contains("leaf"))
      	  ccLib.fireCallback(settings.onHoverOut, this, d);
      })
    	.on("mouseover", function (d) { 
      	this.classList.add("selected"); 
      	if (this.classList.contains("leaf"))
      	  ccLib.fireCallback(settings.onHover, this, d);
      })
    	.on("click", function (d) {
        d3.event.stopPropagation();
        ccLib.fireCallback(settings.onSelect, this, d);
        d.context.currentSelection = clusterZoom(d);
    	});

    presentTree(d, g);
  	  	  
    g.append("path")
  		.attr("fill", polyFill(d))
  		.attr("stroke-width", polyStroke(d))
  		.attr("d", !!d.polygon ? "M" + d.polygon.join("L") + "Z" : null);
  		
    t = settings.fLabel(d);
    
    if (!t) return;
    
    fontSz = textFontSize(d),
    svgt = g.append("text")
      .attr("x", -d.dx * .25)
      .attr("y", -fontSz)
  	  .attr("font-size", fontSz)
  	  .text(t.label);	  
  
    d3plus.textwrap()
      .container(svgt)
      .align("center")
      .shape("square")
      .width(d.dx * 0.5)
      .draw();

    if (!!t.size)
      svgt.append("tspan")
  	    .attr("dy", "1.1em")
  	    .attr("x", "0")
        .text(t.size);
  }
  
  // Runs treemap and voronoi, to fill the tree with additional, polygon information
  function populateRect(tree, boundaries, width, height) {
    var r,
        settings = tree.context.settings,
        originalDepth = tree.depth || 0;
        
    if (!width || !height) {
      r = d3plus.geom.largestRect(boundaries, { 'angle': 0, 'maxAspectRatio': 7 })[0];
      r.cx -= r.width / 2;
      r.cy -= r.height / 2;
    }
    else
      r = { cx: 0, cy: 0, width: width, height: height };
      
    if (tree.centroid != null) {
      r.cx += tree.centroid.x;
      r.cy += tree.centroid.y;
      boundaries = polyTransform(boundaries, { a: 1, b: 0, c: 0, d: 1, e: tree.centroid.x, f: tree.centroid.y });
    }
    
    var treemap = d3.layout.treemap()
          .size([r.width, r.height])
          .sticky(true)
          .value(settings.fValue);
    
    var nodes = treemap.nodes(tree).reverse(),
        vertices = nodes
    	  	.map(function (e, i) {  
      	  	e.depth += originalDepth; 
      	  	return !e.children ?  { x: r.cx + e.x + e.dx  / 2, y: r.cy + e.y + e.dy / 2, value: e.value, index: i } : null; 
      	  })
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
      
      node.offsetRoot = tree;
    });
        
    return { w: width, h: height };
  }
  
  function presentTree(tree, root) {
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
  			groups[f.subcategory] = parent = { 'name': [f.subcategory], 'size': 0, 'children': [], 'id': root.children.length };
  			addChild(root, parent);
  		}
  			
  		el = { 'name': [f.value], 'size': f.count };
  		addChild(parent, el);
  	}
  	
  	while (root.children.length == 1)
  		root = root.children[0];
  	
  	return root;
  }
  
  function extractTree(data, context, depth, master) {
    
    if (depth == null)
      depth = 0;
      
    var tree = { 'name': [data.name], 'size': data.size || 1, 'depth': depth, 'context': context, 'count': 1 };

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
          cnt = 0,
          child,
          arr = new Array(data.children.length);
        
      for (var i = 0;i < data.children.length; ++i) {
        arr[i] = child = extractTree(data.children[i], context, depth + 1, master != null ? master : i);
        
        child.parent = tree;
        sz += child.size;
        cnt += child.count;
      }
      
      tree.size = sz;
      tree.count = cnt;
      
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
    
    self.currentScale = 1;
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
      
      populateRect(tree, boundaries, width, height);
      presentTree(tree, self.rootRegion);
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
