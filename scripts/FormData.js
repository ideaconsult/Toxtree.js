/**
 * Emulate FormData for some browsers
 * MIT License
 * (c) 2010 François de Metz
 */
(function(w) {
    if (w.FormData)
        return;
    function FormData() {
        this.fake = true;
        this.boundary = "--------FormData" + Math.random();
        this._fields = [];
        if (arguments[0] instanceof HTMLFormElement){
          var form = arguments[0];
          for(var i = 0, fc = form.elements.length; i < fc; i++){
            var el = form.elements[i];
            if(el.type == 'checkbox' || el.type == 'radio'){
              if(el.checked){
                this._fields.push([el.name, el.value]);
              }
            }
            else if(el.name != ''){
              this._fields.push([el.name, el.value]);
            }
          }
        }
    }
    FormData.prototype.append = function(key, value) {
        this._fields.push([key, value]);
    }
    FormData.prototype.toString = function() {
        var boundary = this.boundary;
        var body = [];
        this._fields.forEach(function(field) {
            body.push(field[0] + "=" + field[1]);
        });
        return body.join("&");
    }
    w.FormData = FormData;
})(window);
