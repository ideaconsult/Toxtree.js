/* Common functions for UI implementations
*/
function renderRelation(data, type, full) {
  if (type != 'display')
    return ccLib.joinDeep(data, 'relation', ',');
    
  var res = '';
  for (var i = 0, il = data.length; i < il; ++i)
    res += '<span>' + data[i].relation.substring(4).toLowerCase() + '</span><sup><a target="_blank" href="' + (full.URI + '/composition') + '" title="' + data[i].compositionName + '(' + data[i].compositionUUID + ')">?</a></sup>';

  return res;
}
