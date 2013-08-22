Toxtree.js
==========

Front end web UI to Toxtree (http://toxtree.sf.net), using the OpenTox API.


Calling / loading
------------------

It is a single page, JavaScript driven interface, that can be invoked (loaded) from any place, because all requests are asynchronous. So the actual server for all functions need to be passed to the page and this is done via 'server' parameter in the url. Example:

toxtree.html?server=http://ideaconsult...:8080/ambit2
