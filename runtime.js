/* Мини-движок шаблонов для сайта Rsm Collection: {{ значение }}, sc-if, sc-for, onClick */
(function(){
  var SVG="http://www.w3.org/2000/svg";
  window.DCLogic=function(){this.state={};this.props={};var s=this;this.setState=function(p){Object.assign(s.state,p);schedule();};};
  var comp,tpl,root,queued=false;
  function lookup(scope,path){
    var parts=path.trim().split("."),v=scope;
    for(var i=0;i<parts.length;i++){ if(v==null) return undefined; v=v[parts[i]]; }
    return v;
  }
  var RE=/\{\{\s*([^}]+?)\s*\}\}/g, WHOLE=/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  function interp(str,scope){ return str.replace(RE,function(_,p){var v=lookup(scope,p);return v==null?"":v;}); }
  function build(node,scope,out,inSvg){
    if(node.nodeType===3){ out.push(document.createTextNode(interp(node.nodeValue,scope))); return; }
    if(node.nodeType!==1) return;
    var tag=node.nodeName.toLowerCase();
    if(tag==="sc-if"){
      var m=WHOLE.exec(node.getAttribute("value")||""); var v=m?lookup(scope,m[1]):node.getAttribute("value");
      if(v&&v!=="false") eachChild(node,scope,out,inSvg);
      return;
    }
    if(tag==="sc-for"){
      var lm=WHOLE.exec(node.getAttribute("list")||""); var list=(lm&&lookup(scope,lm[1]))||[]; var as=node.getAttribute("as")||"item";
      for(var i=0;i<list.length;i++){ var sc=Object.create(scope); sc[as]=list[i]; sc.index=i; eachChild(node,sc,out,inSvg); }
      return;
    }
    var svg=inSvg||tag==="svg";
    var el=svg?document.createElementNS(SVG,tag):document.createElement(tag);
    var attrs={},on={};
    for(var j=0;j<node.attributes.length;j++){
      var a=node.attributes[j],n=a.name;
      if(n.indexOf("hint-placeholder")===0) continue;
      if(/^on[a-z]+$/.test(n)){ var w=WHOLE.exec(a.value); if(w){ var fn=lookup(scope,w[1]); if(typeof fn==="function") on[n.slice(2)]=fn; } continue; }
      var val=interp(a.value,scope); attrs[n]=val; el.setAttribute(n,val);
    }
    el._attrs=attrs; el._on=on;
    for(var k in on) el.addEventListener(k,on[k]);
    var kids=[]; eachChild(node,scope,kids,svg&&tag!=="foreignobject");
    for(var c=0;c<kids.length;c++) el.appendChild(kids[c]);
    out.push(el);
  }
  function eachChild(node,scope,out,svg){ var cn=node.childNodes; for(var i=0;i<cn.length;i++) build(cn[i],scope,out,svg); }
  /* точечное обновление: меняем только то, что изменилось в шаблоне */
  function patch(live,next){
    var l=Array.prototype.slice.call(live.childNodes),i;
    for(i=0;i<next.length;i++){
      var n=next[i],o=l[i];
      if(!o){ live.appendChild(n); continue; }
      if(o.nodeType===3&&n.nodeType===3){ if(o.nodeValue!==n.nodeValue) o.nodeValue=n.nodeValue; continue; }
      if(o.nodeType===1&&n.nodeType===1&&o.nodeName===n.nodeName){ upd(o,n); continue; }
      live.replaceChild(n,o);
    }
    for(var r=l.length-1;r>=next.length;r--) live.removeChild(l[r]);
  }
  function upd(o,n){
    var oa=o._attrs||{},na=n._attrs||{},k;
    for(k in na) if(oa[k]!==na[k]){ o.setAttribute(k,na[k]); }
    for(k in oa) if(!(k in na)) o.removeAttribute(k);
    o._attrs=na;
    var oo=o._on||{},no=n._on||{};
    for(k in oo) o.removeEventListener(k,oo[k]);
    for(k in no) o.addEventListener(k,no[k]);
    o._on=no;
    patch(o,Array.prototype.slice.call(n.childNodes));
  }
  function render(){
    queued=false;
    var vals=comp.renderVals(),out=[];
    var cn=tpl.content.childNodes;
    for(var i=0;i<cn.length;i++) build(cn[i],vals,out,false);
    patch(root,out);
  }
  function schedule(){ if(queued) return; queued=true; requestAnimationFrame(render); }
  window.DCStart=function(C){ comp=new C(); tpl=document.getElementById("tpl"); root=document.getElementById("app"); render(); };
})();
