Toxtree.js
==========

Front end web UI to Toxtree (http://toxtree.sf.net), using the OpenTox API.


Calling / loading
------------------

It is a single page, JavaScript driven interface, that can be invoked (loaded) from any place, because all requests are asynchronous. So the actual server for all functions need to be passed to the page and this is done via 'server' parameter in the url. Example:

toxtree.html?server=http://ideaconsult...:8080/ambit2


TODO:
-----
* style driven showing and hiding of results. 'predicted', 'high', ...
* tested on ... browsers;

* Use the query line as result messaging - be it with query description, be it with error
* POST requests to be finished;
* test on more browsers (includ. IE)
* Write help - some more in toxtree.js and more detailed here. Good description of elements.
