/* toxfacet.js - General hierarchy viewer, using Voronoi diagrams
 *
 * Copyright 2012-2016, IDEAconsult Ltd. http://www.ideaconsult.net/
 * Created by Ivan Georgiev
**/

var jToxFacet = (function () {
  var colorThemes = {
        "dark": {
          "parentFill": "rgba(240, 240, 240, 0.66)"
        },
        
        "light": {
        }
      },
      defaultSettings = {
        "viewStep": 2,
        "loadStep": Infinity,
        "colorTheme": "dark",
        "minFontSize": 11.0,
        "maxFontSize": 64.0
      },
      instanceCount = 0;
  
  var cls = function (root, settings) {
    var self = this;
    self.rootElement = root;
    jT.$(root).addClass('jtox-toolkit'); // to make sure it is there even in manual initialization.

    self.settings = jT.$.extend(true, {}, defaultSettings, jT.settings, settings);
    
    var theme = self.settings.colorTheme;
    if (typeof theme === "string" && colorThemes[theme] != null)
      self.settings.colorTheme = colorThemes[theme];

    self.instanceNo = instanceCount++;

    // finally make the query, if Uri is provided
    if (self.settings['facetUri'] != null){
      self.queryFacets(self.settings['facetUri']);
    }
  };
  
  /***** Now follow the helper functions ****/    
  function polyFill(d) {
  	if (!!d.children && d.children.length > 0)
  	  return d.context.settings.colorTheme.parentFill;
  		
  	var v = d.value / d.parent.value;
  	var v = Math.round(220 - 220 * v );
  	var carr = [v, v, v];
  	carr[d.parent.id % 3] = 255;
  	return "rgb(" + carr.join(",") + ")";
  }
  
  function polyStroke(d) {
  	return 6.5 - 6 * d.depth / d.context.dataTree.maxdepth;
  }
  
  function textOpacity (d, i) { 
    return d.depth / (d.context.dataTree.maxdepth * 2) + 0.5; 
  }
  
  function traverseTree(tree, fn) {
    if (!fn) return false;
    
    var r = fn(tree);
    if (r && tree.children != null) {
      for (var i = 0;i < tree.children.length; ++i)
        traverseTree(tree.children[i], fn);
    }
    
    return r;
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
        
  function clusterZoom(d) {
    do { d = d.parent; } while (d.children.length == 1 && !d.root);      
      
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
      	
    if (d == context.currentSelection)
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
        victims = [],
        ressurects = [],
        visual = selection;
        isVisible = function (bbox) {
          var l = Math.max(bbox.left, 0),
              t = Math.max(bbox.top, 0),
              r = Math.min(bbox.right, rootBBox.width),
              b = Math.min(bbox.bottom, rootBBox.height);
          return l < r && t < b;
        };

    traverseTree(context.dataTree, function (d) {
      var el = d.element,
          bbox = polyTransform(normalizeBox(el.getBoundingClientRect()), backCTM);
      
      if (!isVisible(bbox)) {
//           delete d.children;
        d.unloaded = true;
        victims.push(el);

        return false;

      } else {
        if (d.unloaded !== undefined) {
          ressurects.push(d.element);
          delete d.unloaded;
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
      
    console.log("Current common visual: " + visual.name);


    // now launch the transition to...
    t.each(function () {
      // ... transform the root...
      context.rootRegion
        .transition("zoom")
          .attr("transform", "translate(" + ctm.e + "," + ctm.f + ") scale(" + scale + ")");
      
      // ... scale the path's strokes, not to become so thick, while zoomed...
      d3.select(visual.element).selectAll("path")
        .transition("zoom")
          .style("stroke-width", function (d, i) { 
            return polyStroke(d, i) / Math.sqrt(scale);
          });
      
      // ... make sure former invisibles are back visible
      d3.selectAll(ressurects)
        .transition("zoom")
          .style("opacity", 1.0);
      
      // .. and dismiss all invisibles
      d3.selectAll(victims)
        .transition("zoom")
          .style("opacity", 0.1);
    });
    
    return selection;
  }
    
  function clusterDOM(d, i) {
  	d.element = this;
  	
  	// offset the whole geometry of the node
    d.polygon.forEach(function (pt) { pt[0] -= d.centroid.x; pt[1] -= d.centroid.y; });
  
  	for (var n = d.parent; !!n; n = n.parent) {
      d.centroid.x -= n.centroid.x;
      d.centroid.y -= n.centroid.y;
  	}
  	  
    // now proceed with drawing  	
  	var g = d3.select(this)
  		.attr("class", "cluster " + (!!d.children ? "parent" : "leaf"))
  		.attr("transform", 'translate(' + d.centroid.x + ',' + d.centroid.y  + ')')
    	.on("mouseout", function () { this.classList.remove("selected"); } )
    	.on("mouseover", function () { this.classList.add("selected"); })
    	.on("click", function (d) {
        var nm = "";
        for (var e = d; !e.root; e = e.parent)
          nm = e.name + ((nm.length > 0) ? " <- " : "") + nm;
          
        console.log("Selected: " + nm);
        d3.event.stopPropagation();
        
        d.context.currentSelection = clusterZoom(d);
    	});
    
    if (!!d.children) {
      g
        .selectAll("g")
        .data(d.children)
        .enter()
          .append("g")
          .each(clusterDOM);
    }
  	  	  
    g.append("path")
  		.attr("fill", polyFill(d, i))
  		.attr("stroke-width", polyStroke(d, i))
  		.attr("d", !!d.polygon ? "M" + d.polygon.join("L") + "Z" : null);
  		
  	g.append("text")
  	  .attr("font-size", Math.max(d.context.settings.maxFontSize * Math.sqrt(d.value / d.context.dataTree.value), d.context.settings.minFontSize))
  	  .style("opacity", textOpacity(d, i))
  	  .text(d.name)
  	  .call(textWrap, d.dx * 0.5)
  	    .append("tspan")
  	    .attr("dy", "1.1em")
  	    .attr("x", "0")
        .text(d.size != null ? "(" + d.size + ")" : null)
  }
  
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
    var root = { 'name': "", 'children': [], 'context': context },
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
  			groups[f.subcategory] = parent = { 'name': f.subcategory, 'size': 0, 'children': [], 'id': root.children.length, 'maxdepth': 1 };
  			addChild(root, parent);
  		}
  			
  		el = { 'name': f.value, 'size': f.count, 'maxdepth': 0 };
  		addChild(parent, el);
  	}
  	
  	while (root.children.length == 1)
  		root = root.children[0];
  	
  	root.maxdepth = 2;
  	return root;
  }
  
  function prepareTree(tree, context) {
    
    if (!tree.children || tree.children.length < 1) {
      tree.maxdepth = 0;
      tree.count = 1;
      tree.context = context;
    }
    else {
      var sz = 0,
          dep = 0,
          cnt = 0;
      
      for (var i = 0;i < tree.children.length; ++i) {
        var child = tree.children[i];
        if (tree.id !== undefined)
          child.id = tree.id;
        else
          child.id = i;
        
        prepareTree(child, context);
        
        child.parent = tree;
        sz += child.size;
        cnt += child.count;
        dep = Math.max(child.maxdepth, dep);
      }
      
      tree.size = sz;
      tree.count = cnt;
      tree.maxdepth = dep + 1;
      tree.context = context;
    }
  
    return tree;
  }
    	
  cls.prototype.init = function () {
    var self = this;
        
    var width = this.rootElement.clientWidth,
        height = this.rootElement.clientHeight,
        boundaries = [[0, 0], [0, height], [width, height], [width, 0]],
        fValue = function(d) { return Math.sqrt(d.size); };
        
    self.voronoi = d3.geom.voronoi()
      .clipPoly(boundaries)
      .x(function (d) { return d.x; })
      .y(function (d) { return d.y; })
      .value (function (d) { return d.value; });

    self.rootSVG = d3.select(this.rootElement).append("svg")
      .attr("width", width)
      .attr("height", height);
            
    self.treemap = d3.layout.treemap()
      .size([width, height])
      .sticky(true)
      .value(fValue);
    
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
  	
  cls.prototype.queryFacets = function (facetUri) {
    var self = this;
    
    if (!self.initialized)
      self.init();
    
    d3.json(window.location.search.substring(1) || facetUri, function(error, data) {
      if (error) throw error;
    
      if (data.facet !== undefined) 
        self.dataTree = treeFromFacets(data, self);
     else
        self.dataTree = prepareTree(data, self);
      
      self.dataTree.root = true;
      var nodes = self.treemap.nodes(self.dataTree).reverse(),
          vertices = nodes
      	  	.map(function (e, i) {  return e.children == null ? { x: e.x + e.dx / 2, y: e.y + e.dy / 2, value: e.value, index: i} : null; })
      	  	.filter(function (e) { return e != null; });

//       var cells = self.voronoi(vertices);
        
      self.voronoi.centroidal(vertices, 2).forEach(function (p) { 
        var i = p.point.index;
        p.edges = p.cell.edges;
        delete p.cell;
        
        nodes[i].polygon = p;
        nodes[i].centroid = p.centroid;
      });      
    
      // ensure everybody has polygon and centroid members    
      nodes.forEach(function (node) {
        if (node.root)
          node.centroid = { x: 0, y: 0 };
        else if (!node.centroid) {
          node.polygon = mergePolygons(node.children.map(function(n) { return n.polygon; }))
          var carr = d3.geom.polygon(node.polygon).centroid();
          node.centroid = { x: carr[0], y: carr[1] };
        }
      });
      
      self.rootRegion = self.rootSVG
        .append("g")
        .attr("class", "cluster cluster-root");
      self.dataTree.element = self.rootRegion.node();
      
/*
      self.rootRegion
        .selectAll("g")
        .data(cells)
        .enter()
          .append("path")
      		.attr("fill", function (d, i) { 
        		var cc = [155, 155, 155];
        		cc[1] += parseInt(d.point.value);
        		cc[2] += parseInt(i * 100 / cells.length);
        		return "rgb(" + cc + ")"; 
          })
      		.attr("stroke-width", function (d, i) { 
        		return Math.sqrt(d.point.value);
          })
      		.attr("d", function (d, i) { return "M" + d.join("L") + "Z"; });
*/
      
        
      self.rootRegion
        .selectAll("g")
        .data(self.dataTree.children)
        .enter()
          .append("g")
          .each(clusterDOM);
    });
  };
  
  return cls;
})();
