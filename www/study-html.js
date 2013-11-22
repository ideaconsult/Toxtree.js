jToxKit.templates['all-studies']  = 
"	  <div id=\"jtox-studies\">" +
"	    <ul>" +
"	      <li><a href=\"#jtox-composition\">Composition</a></li>" +
"	      <li><a href=\"#jtox-pchem\" data-type=\"P-CHEM\">P-Chem (0)</a></li>" +
"	      <li><a href=\"#jtox-envfate\" data-type=\"ENV_FATE\">Env Fate (0)</a></li>" +
"	      <li><a href=\"#jtox-ecotox\" data-type=\"ECOTOX\">Eco Tox (0)</a></li>" +
"	      <li><a href=\"#jtox-tox\" data-type=\"TOX\">Tox (0)</a></li>" +
"	    </ul>" +
"	    <div id=\"jtox-composition\">" +
"	      <p>Substance: <span class=\"data-field\" data-field=\"substanceID\"></span></p>" +
"	    </div>" +
"	    <div id=\"jtox-pchem\" class=\"jtox-study-tab P-CHEM\">" +
"	      <p><input type=\"text\" class=\"jtox-study-filter ui-input\" placeholder=\"Filter...\"></input></p>" +
"      </div>" +
"	    <div id=\"jtox-envfate\" class=\"jtox-study-tab ENV_FATE\">" +
"	      <p><input type=\"text\" class=\"jtox-study-filter ui-input\" placeholder=\"Filter...\"></input></p>" +
"	    </div>" +
"	    <div id=\"jtox-ecotox\" class=\"jtox-study-tab ECOTOX\">" +
"	      <p><input type=\"text\" class=\"jtox-study-filter ui-input\" placeholder=\"Filter...\"></input></p>" +
"	    </div>" +
"	    <div id=\"jtox-tox\" class=\"jtox-study-tab TOX\">" +
"	      <p><input type=\"text\" class=\"jtox-study-filter ui-input\" placeholder=\"Filter...\"></input></p>" +
"	    </div>" +
"	  </div>" +
""; // end of #jtox-studies 

jToxKit.templates['one-study']  = 
"    <div id=\"jtox-study\" class=\"jtox-study jtox-foldable folded unloaded\">" +
"      <div class=\"jtox-study-title\"><p class=\"data-field\" data-field=\"title\">? (0)</p></div>" +
"      <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" class=\"jtox-study-table\">" +
"        <thead>" +
"          <tr class=\"jtox-preheader\">" +
"            <th rowspan=\"2\">Name</th>" +
"            <th>Conditions</th>" +
"            <th colspan=\"2\">Effects</th>" +
"            <th>Interpretation</th>" +
"            <th colspan=\"3\">Protocol</th>" +
"          </tr>" +
"          <tr class=\"jtox-header\">" +
"            <th>Endpoint</th>" +
"            <th>Result</th>" +
"            <th>Guidance</th>" +
"            <th>Owner</th>" +
"            <th>UUID</th>" +
"          </tr>" +
"        </thead>" +
"        <tbody></tbody>" +
"      </table>" +
"    </div>" +
""; // end of #jtox-study 

