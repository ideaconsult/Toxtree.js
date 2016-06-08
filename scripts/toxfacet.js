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
      "lightnessScale": 0.9,
      "collapseSingles": false,
      "parentZoom": true,     // zoom to the parent of the selected item. On false - go one level deeper - directly to the selection.
      "unloadDelay": 3000,    // unload the invisible items after that many milliseconds.
      "recalcSize": false,    // force the initial processing to reach the bottom of the tree, outside visible range to recalc the size.
      
      // colors
      "parentFill": "rgb(240, 240, 240)", // Color for parent fills. Alpha component is added automatically.
      "colorScale": d3.scale.category10(),                       
      
      "onPrepared": null,       // invoked when the initial call for determining the tabs/columns is ready
      "onHover": null,
      "onDeHover": null,
      "onSelect": null,
      "fnCollate": null,
      "fnChildren": null,
      "fnSize": function(entry) {  return entry.size },
      "fnLabel": function(entries) { 
        return {  "label": entries.length > 1 ? "..." : entries.map(function (e) { return e.name; }).join("/"), 
                  "size" : entries[0].size > 200 ? "(" + ccLib.briefNumber(entries[0].size) + ")" : null 
              }; 
      }
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
    
    var fill = d3.rgb(self.settings.parentFill);
    self.settings.parentFill = "rgba(" + fill.r + "," + fill.g + "," + fill.b + "," + (1.0 / (self.settings.viewStep) + 0.15) + ")";
    
    self.unloaders = [];
    
    // finally make the query, if Uri is provided
    if (self.settings['facetUri'] != null){
      self.queryFacets(self.settings['facetUri']);
    }
  };
  
  /***** Now follow the helper functions ****/    
  function polyFill(d) {
    var settings = d.context.settings;
    
  	if (d.element.classList.contains("parent"))
  	  return settings.parentFill.toString();
  		
  	var v = d.size * settings.lightnessScale / d.master.size,
  	    c = d3.hsl(settings.colorScale(d.master.masterIndex));
  	
    c.l = Math.max(0.95 - v, 0.20);
  	return c.toString();
  }
  
  function polyStroke(d) { 
    return (4.5 - 4 * d.depth / (d.context.settings.viewRange[1] + 1)) / Math.sqrt(d.context.currentScale); 
  }
  
  function textFontSize(d) { 
    var settings = d.context.settings;
    return Math.max(settings.maxFontSize * d.size / d.context.dataTree.size, settings.minFontSize) / Math.sqrt(d.context.currentScale * 1.1 - 0.3);
  }
        
  function showHideOnZoom(tree, context, selection, isVisible) {
    var victims = [],
        ressurects = [],
        settings = tree.context.settings,
        unloadSubtree = function (node) { tree.context.unloaders.push(node); },
        switchNode = function (node, on, off) {
          node.element.classList.remove(off);
          node.element.classList.add(on);
          // Ugly! But neither JS, nor d3 has a _normal_ way to get immediate child...
          var all = node.element.children;
          for (var i = 0;i < all.length; ++i) {
            var child = all[i];
            if (child.tagName === "path") {
              d3.select(child).attr("fill", polyFill(node));
              break;
            }
          };
        };

    ccLib.traverseTree(tree, function (d) {
      if (!isVisible(d)) {
        victims.push(d.element);

        ccLib.traverseTree(d, function (node) {
          // we MUST delete the elements that go out...
          delete node.element;
                  
          if (node.depth >= settings.viewRange[1])
            unloadSubtree(node);
        });
                
        // no need to traverse further down - they are all invisible and cleared.
        return false;

      } else { // i.e. IS visible...
        var pi = tree.context.unloaders.indexOf(d.parent);
        if (pi > -1) // we need to remove ourselves from unloaders
          tree.context.unloaders.splice(pi, 1);
        
        // now start the unloading / loading stuff
        if (d.element != null && d.children != null && d.depth >= settings.viewRange[1]) { // ... but too deep.
          d.children.forEach(function (n) { victims.push(n.element); });
          unloadSubtree(d);
          switchNode(d, "leaf", "parent");
          return false;
        }
        else if (d.children === undefined && d.depth == settings.viewRange[0]) {
          
          // i.e. show only hidden units that are under our selection
          for (var e = d; !!e && e.depth > selection.depth; e = e.parent);
          if (e == selection) {
            d.children = [];
            d.entries.forEach(function (e) {
              // TODO: Make the new depths loading HERE.
              
              var t = extractTree(e, d.context, d.depth, d.master);
              if (t.children !== undefined)
                d.children = d.children.concat(t.children);
              else
                d.children.push(t);
              
              ccLib.fireCallback(d.context.settings.onPrepared, self, t);
            });
            
            console.log ("Creating: " + d.entries[0].name);
            var gEl = d.element || d3.select(d.parent.element).insert("g", ":first-child").datum(d).node();

            populateRect(d, d.polygon);
            clusterDOM.call(gEl, d);
            switchNode(d, "parent", "leaf");
            
            ressurects.push(d.element);
            
            return false;
          }
        }
        
        if (d.element === undefined) {
          var g = d3.select(d.parent.element).insert("g", ":first-child").datum(d);
          clusterDOM.call(g.node(), d);
          ressurects.push(d.element);
        }
      }
    });
    
    // Now is time to invoke the actual unloading
    setTimeout(function () {
      tree.context.unloaders.forEach(function (node) {
        console.log("Unloading: " + node.entries[0].name);
        delete node.children;
      });
      
      tree.context.unloaders = [];
    }, parseInt(settings.unloadDelay));
    
    return { "shown": ressurects, "hidden": victims };
  }
  
  function clusterZoom(d) {
    // or, if we're not actually making change...
    if (d == d.context.currentSelection) return d;
    
    var context = d.context,
        el = d.element,
        dextent = d.polygon.extent().transform({ a: 1, b: 0, c: 0, d: 1, e: d.origin.x, f: d.origin.y }),
        width = context.rootElement.clientWidth,
        height = context.rootElement.clientHeight,
        ctm = el.ownerSVGElement.createSVGMatrix();

    context.settings.viewRange[0] = d.depthRoot.depth + (d.depth > d.depthRoot.depth + context.settings.viewStep - 1) * context.settings.viewStep;
    context.settings.viewRange[1] = context.settings.viewRange[0] + context.settings.viewStep;
    
    console.log("Current range: " + context.settings.viewRange);
      	              	        
    if (el != context.rootRegion.node()) {
      dextent.width = dextent[1][0] - dextent[0][0];
      dextent.height = dextent[1][1] - dextent[0][1];
      var scale = Math.min(width / dextent.width, height / dextent.height) * 0.8;
      
      if (scale > 1.0) {
        ctm = ctm
          .scale(scale)
          .translate((width / scale - dextent[1][0] - dextent[0][0]) / 2, (height / scale - dextent[1][1] - dextent[0][1]) / 2);
        
        // now check if the transformation won't put the edges of the whole picture inside it.
        var rb = d3.geom.polygon([[0, 0], [width, height]]).transform(ctm),
            offX = 0,
            offY = 0;
            
        if (rb[0][0] > 0)
          offX = -rb[0][0];
        else if (rb[1][0] < width)
          offX = width - rb[1][0];
          
        if (rb[0][1] > 0)
          offY = -rb[0][1];
        else if (rb[1][1] < height)
          offY = height - rb[1][1];
        
        // since the scale is already applied on the transformation - we need to scale down the values.
        ctm = ctm.translate(offX / scale, offY / scale);
      }
    }
    
    // backCTM becomes the transformation from the current to the new state
    context.currentScale = ctm.a;
    
    // Ok, we now prepare for the zoom - counting the outsiders and the returnings
    var delta = showHideOnZoom(context.dataTree, context, d, function (e) {
          var bbox = e.polygon.extent().transform(ctm.translate(e.origin.x, e.origin.y)),
              l = Math.max(bbox[0][0], 0),
              t = Math.max(bbox[0][1], 0),
              r = Math.min(bbox[1][0], width),
              b = Math.min(bbox[1][1], height);
          return l < r && t < b;
        });

    d3.transition("zoom").duration(500).each(function () {
      // First, make the actual zoom ...
      context.rootRegion.transition("zoom").attr("transform", "translate(" + ctm.e + "," + ctm.f + ") scale(" + ctm.a + ")");
      
      // ... scale the path's strokes, not to become so thick, while zoomed...
      context.rootRegion.selectAll("path").transition("zoom").style("stroke-width", polyStroke);
      
      // ... change the text's font size, so it doesn't become too big too.
      context.rootRegion.selectAll("text").transition("zoom").style("font-size", textFontSize);
          
      // .. and fade and dismiss all invisibles.
      d3.selectAll(delta.hidden).transition("zoom").style("opacity", 0.1).remove();
    });
        
    return d;
  }
    
  function clusterDOM(d) {
  	var settings = d.context.settings, 
  	    g = d3.select(this), 
  	    offset = !!d.parent ? [ d.origin.x - d.parent.origin.x, d.origin.y - d.parent.origin.y ] : [0, 0],
  	    t, fontSz, svgt;

    // make the recursive invocation...  	    
    if (!!d.children && d.children.length > 0 )
      g.selectAll("g")
        .data(d.children)
        .enter()
          .insert("g", ":first-child")
          .each(clusterDOM);

    if (d.element != null) return;
    
  	d.element = this;
  	
    // now proceed with drawing  	
    g
  		.attr("class", "cluster " + (!!d.children ? "parent" : "leaf"))
  		.attr("transform", offset[0] || offset[1] ? 'translate(' + offset[0]  + ',' + offset[1]  + ')' : null)
    	.on("mouseout", function (d) {
      	this.classList.remove("selected"); 
      	if (this.classList.contains("leaf"))
      	  ccLib.fireCallback(settings.onDeHover, this, d);
    	})
    	.on("mouseover", function (d) { 
      	this.classList.add("selected"); 
      	if (this.classList.contains("leaf"))
      	  ccLib.fireCallback(settings.onHover, this, d);
      })
    	.on("click", function (d) {
        d3.event.stopPropagation();
        
        ccLib.fireCallback(settings.onSelect, this, d);

        // if we have hidden children, we'd like to zoom directly to them.
        if (d.context.settings.parentZoom) d = d.parent;
        
        d.context.currentSelection = clusterZoom(d);
    	});

    g.append("path")
  		.attr("fill", polyFill(d))
  		.attr("stroke-width", polyStroke(d))
  		.attr("d", !!d.polygon ? "M" + d.polygon.join("L") + "Z" : null);
  		
    t = settings.fnLabel(d.entries);
    
    if (!t) return g;
    
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
      svgt.attr("class", "sized").append("tspan")
  	    .attr("dy", "1.2em")
  	    .attr("x", "0")
        .text(t.size);
        
    return g;
  }
    
  // Runs treemap and voronoi, to fill the tree with additional, polygon information
  function populateRect(tree, boundaries, width, height) {
    var r,
        settings = tree.context.settings,
        originalDepth = tree.depth || 0;
        
    if (!width || !height) {
      r = d3plus.geom.largestRect(boundaries, { 'angle': 0, 'maxAspectRatio': 11 })[0];
      r.cx -= r.width / 2;
      r.cy -= r.height / 2;
    }
    else
      r = { cx: 0, cy: 0, width: width, height: height };
      
    if (tree.origin != null) {
      r.cx += tree.origin.x;
      r.cy += tree.origin.y;
      boundaries = boundaries.transform({ a: 1, b: 0, c: 0, d: 1, e: tree.origin.x, f: tree.origin.y });
    }
    
    var treemap = d3.layout.treemap()
          .size([r.width, r.height])
          .sticky(true)
          .value(function (d) { return Math.sqrt(d.size); });
    
    var nodes = treemap.nodes(tree).reverse(),
        vertices = nodes
    	  	.map(function (e, i) {  
      	  	e.depth += originalDepth; 
      	  	return !e.children ?  { x: r.cx + e.x + e.dx  / 2, y: r.cy + e.y + e.dy / 2, size: e.size, index: i } : null; 
      	  })
    	  	.filter(function (e) { return e != null; });

    var voronoi = d3.geom.voronoi()
      .clipPoly(boundaries)
      .x(function (d) { return d.x; })
      .y(function (d) { return d.y; })
      .value (function (d) { return d.size; });

    voronoi.edges(vertices).forEach(function (p) { 
      var i = p.point.index;

      nodes[i].polygon = p;
      nodes[i].origin = p.site;
    });      
      
    // ensure everybody has polygon and centroid members. NOTE: We're traversing in reverse
    // which implies that children are traversed before their parents.
    nodes.forEach(function (node) {
      if (!node.origin) {
        node.polygon = mergePolygons(node.children.map(function(n) { return n.polygon; }))
        var carr = d3.geom.polygon(node.polygon).centroid();
        node.origin = { x: carr[0], y: carr[1] };
      }
      
      node.depthRoot = tree;
      delete node.x;
      delete node.y;
    });
  
    nodes.pop(); // clears the last one... which is the master parent.
            
    // we have to do that separately, because otherwise we're going to mess up the
    // mergePolygons procedure up there.
    nodes.forEach(function (node) {
      node.polygon.forEach(function (pt) { pt[0] -= node.origin.x; pt[1] -= node.origin.y; });        
    });
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
        var ni = ccLib.findIndex(edge.edge.use.poly, function (p) { return p != pi; });
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
      depth = context.settings.viewRange[0];
      
    var tree = { 'entries': [data], 'size': context.settings.fnSize(data) || 1, 'depth': depth, 'context': context, 'count': 1 };

    if (depth == 1) master = tree;

    tree.master = master;
    
    if (!data.children || data.children.length < 1)
      ;
    else if (data.children.length == 1 && context.settings.collapseSingles) {
      tree = extractTree(data.children[0], context, depth, master);
      tree.entries.splice(0, 0, data);
    }
    else if (depth < context.settings.loadDepth && (!!context.settings.recalcSize || depth < context.settings.viewRange[1])) {
      var sz = 0,
          cnt = 0,
          child, i,
          collated = null,
          arr = new Array(data.children.length);
          
      for (i = 0;i < data.children.length; ++i) {
        child = arr[i] = extractTree(data.children[i], context, depth + 1, master );
        
        if (depth == 0) child.masterIndex = i;
        
        child.parent = tree;
        sz += child.size;
        cnt += child.count;
      }

      tree.size = sz;
      tree.count = cnt;
      
      if (depth < context.settings.viewRange[1]) {

        tree.children = arr;
        
        // strange enough... we need to do the collating stuff _now_
        for (i = 0;i < arr.length; ++i) {
          child = arr[i];
          if (ccLib.fireCallback(context.settings.fnCollate, data, child) === true) {
            if (!collated)
              collated = child;
            else {
              collated.entries = collated.entries.concat(child.entries);
              collated.size += child.size;
              collated.count += child.count;
            }
            
            arr.splice(i--, 1);
          }
        }      
        
        if (!!collated)
          arr.push(collated)
      }
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
        
      if (self.currentSelection != null && self.currentSelection.depth > 0)
        self.currentSelection = clusterZoom(self.currentSelection.parent);

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
      
      if (data.children !== undefined) 
        tree = extractTree(data, self);
      else if (data.facet !== undefined)
        tree = treeFromFacets(data, self);
      else
        throw new Error('Unrecognized data type!');
        
      if (dataDepth === 0) {
        self.rootRegion = self.rootSVG
          .append("g")
          .attr("class", "cluster cluster-root");
                  
        width = self.rootElement.clientWidth;
        height = self.rootElement.clientHeight;
        boundaries = [[0, 0], [0, height], [width, height], [width, 0]];
        
        self.dataTree = dataRoot = tree;
        self.dataTree.origin = { x: 0, y: 0};
        self.dataTree.element = self.rootRegion.node();
        self.dataTree.polygon = boundaries;
      } else {
        jT.$.extend(dataRoot, tree)
      }

      ccLib.fireCallback(self.settings.onPrepared, self, dataRoot);
      
      populateRect(dataRoot, boundaries, width, height);
      clusterDOM.call(self.rootRegion.node(), dataRoot);
    });
  }
  
  cls.prototype.queryFacets = function (facetUri) {
    var self = this;
    
    if (!self.initialized)
      self.init();
      
    self.queryRange(facetUri)
  };
  
  cls.prototype.updateColors = function (callback) {
  }
  
  return cls;
})();
