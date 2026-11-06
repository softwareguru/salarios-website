// Shared SVG chart engine for the findings site (index.html) and the report
// (report.html). Pure functions: given data, return an SVG string. Colors use
// CSS variables so both light/dark (site) and print (report) themes work.
// Single source of truth for figures. Do not duplicate these elsewhere.

function pesoFull(v){ return "$" + Math.round(v).toLocaleString("es-MX"); }
function pesoK(v){ return "$" + Math.round(v/1000) + "k"; }

// horizontal bar chart: items [{label, value}], opts {fmt, accentFn}
function barsH(items, opts){
  opts = opts || {};
  var fmt = opts.fmt || pesoK;
  var W = 680, rowH = 46, padL = 150, padR = 64, top = 8;
  var H = top*2 + items.length*rowH;
  var max = Math.max.apply(null, items.map(function(d){return d.value;}));
  var innerW = W - padL - padR;
  var s = '<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  items.forEach(function(d,i){
    var y = top + i*rowH;
    var bw = Math.max(2, innerW * d.value / max);
    var accent = opts.accentFn ? opts.accentFn(d,i) : "var(--bar)";
    s += '<text x="'+(padL-12)+'" y="'+(y+rowH/2)+'" text-anchor="end" dominant-baseline="middle" font-size="15" fill="var(--ink-2)">'+d.label+'</text>';
    s += '<rect x="'+padL+'" y="'+(y+8)+'" width="'+bw+'" height="'+(rowH-20)+'" rx="5" fill="'+accent+'" class="gbar"/>';
    s += '<text x="'+(padL+bw+8)+'" y="'+(y+rowH/2)+'" dominant-baseline="middle" font-size="15" font-weight="600" fill="var(--ink)" class="glabel">'+fmt(d.value)+'</text>';
  });
  s += '</svg>';
  return s;
}

// two-bar compare: a,b each {label,value}; gapText. opts {c1,c2,fmt}
function compare(a, b, gapText, opts){
  opts = opts || {};
  var fmt = opts.fmt || pesoFull;
  var W=680,H=250, baseY=186, bw=150, gap=120;
  var max=Math.max(a.value,b.value)*1.18;
  var x1=180, x2=x1+bw+gap;
  var h1=(a.value/max)*150, h2=(b.value/max)*150;
  var c1=opts.c1||"var(--bar)", c2=opts.c2||"var(--women)";
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  [[x1,h1,a,c1],[x2,h2,b,c2]].forEach(function(r){
    var x=r[0],h=r[1],d=r[2],c=r[3];
    s+='<rect x="'+x+'" y="'+(baseY-h)+'" width="'+bw+'" height="'+h+'" rx="7" fill="'+c+'" class="gcol"/>';
    s+='<text x="'+(x+bw/2)+'" y="'+(baseY-h-12)+'" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink)" class="glabel">'+fmt(d.value)+'</text>';
    s+='<text x="'+(x+bw/2)+'" y="'+(baseY+24)+'" text-anchor="middle" font-size="15" fill="var(--ink-2)">'+d.label+'</text>';
  });
  if(gapText){
    s+='<text x="'+(W/2)+'" y="34" text-anchor="middle" font-size="26" font-weight="800" fill="var(--women)" class="glabel" font-family="Bricolage Grotesque">'+gapText+'</text>';
  }
  s+='</svg>';
  return s;
}

// percent two-bar compare (values are percentages, bars labeled with %)
function comparePct(a, b, badgeText, opts){
  opts = opts || {};
  var max=Math.max(a.value,b.value)*1.25;
  var W=680,H=250, baseY=186, bw=150, gap=120, x1=180, x2=x1+bw+gap;
  var h1=(a.value/max)*150, h2=(b.value/max)*150;
  var c1=opts.c1||"var(--women)", c2=opts.c2||"var(--men)";
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  [[x1,h1,a,c1],[x2,h2,b,c2]].forEach(function(r){
    s+='<rect x="'+r[0]+'" y="'+(baseY-r[1])+'" width="'+bw+'" height="'+r[1]+'" rx="7" fill="'+r[3]+'" class="gcol"/>';
    s+='<text x="'+(r[0]+bw/2)+'" y="'+(baseY-r[1]-12)+'" text-anchor="middle" font-size="24" font-weight="800" fill="var(--ink)" class="glabel" font-family="Bricolage Grotesque">'+r[2].value+'%</text>';
    s+='<text x="'+(r[0]+bw/2)+'" y="'+(baseY+24)+'" text-anchor="middle" font-size="15" fill="var(--ink-2)">'+r[2].label+'</text>';
  });
  if(badgeText){
    s+='<text x="'+(W/2)+'" y="34" text-anchor="middle" font-size="22" font-weight="800" fill="var(--women)" class="glabel" font-family="Bricolage Grotesque">'+badgeText+'</text>';
  }
  s+='</svg>';
  return s;
}

// grouped pair bars (men/women) by tier, with gap label per row
function pairBars(rows){
  var W=680, rowH=74, top=16, padL=90, padR=70;
  var H=top + rows.length*rowH + 30;
  var max=Math.max.apply(null,rows.map(function(r){return Math.max(r.men_median,r.women_median);}))*1.12;
  var innerW=W-padL-padR;
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  rows.forEach(function(r,i){
    var y=top+i*rowH;
    var mw=innerW*r.men_median/max, ww=innerW*r.women_median/max;
    s+='<text x="'+(padL-12)+'" y="'+(y+rowH/2-4)+'" text-anchor="end" dominant-baseline="middle" font-size="15" fill="var(--ink-2)">'+r.tier+'</text>';
    s+='<rect x="'+padL+'" y="'+y+'" width="'+mw+'" height="22" rx="4" fill="var(--men)" class="gbar"/>';
    s+='<text x="'+(padL+mw+7)+'" y="'+(y+11)+'" dominant-baseline="middle" font-size="13.5" fill="var(--ink-2)" class="glabel">'+pesoK(r.men_median)+'</text>';
    s+='<rect x="'+padL+'" y="'+(y+28)+'" width="'+ww+'" height="22" rx="4" fill="var(--women)" class="gbar"/>';
    s+='<text x="'+(padL+ww+7)+'" y="'+(y+39)+'" dominant-baseline="middle" font-size="13.5" font-weight="600" fill="var(--women)" class="glabel">'+pesoK(r.women_median)+'</text>';
    s+='<text x="'+(W-padR+10)+'" y="'+(y+rowH/2-4)+'" text-anchor="start" dominant-baseline="middle" font-size="17" font-weight="800" fill="var(--women)" class="glabel" font-family="Bricolage Grotesque">-'+r.gap_pct+'%</text>';
  });
  s+='<rect x="'+padL+'" y="'+(H-14)+'" width="12" height="12" rx="2" fill="var(--men)"/><text x="'+(padL+18)+'" y="'+(H-4)+'" font-size="13" fill="var(--muted)">Hombres</text>';
  s+='<rect x="'+(padL+110)+'" y="'+(H-14)+'" width="12" height="12" rx="2" fill="var(--women)"/><text x="'+(padL+128)+'" y="'+(H-4)+'" font-size="13" fill="var(--muted)">Mujeres</text>';
  s+='</svg>';
  return s;
}

// slope lines (scissors)
function slope(rows){
  var W=680,H=320, padL=60,padR=70,top=40,bot=60;
  var xs = rows.map(function(r,i){ return padL + (W-padL-padR)*i/(rows.length-1); });
  var all = rows.reduce(function(a,r){return a.concat([r.men_median,r.women_median]);},[]);
  var max=Math.max.apply(null,all)*1.1, min=Math.min.apply(null,all)*0.82;
  var yOf=function(v){ return top + (H-top-bot)*(1-(v-min)/(max-min)); };
  function path(key){ return rows.map(function(r,i){ return (i?'L':'M')+xs[i]+' '+yOf(r[key]); }).join(' '); }
  var mp=path("men_median"), wp=path("women_median");
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  rows.forEach(function(r,i){
    s+='<text x="'+xs[i]+'" y="'+(H-32)+'" text-anchor="middle" font-size="15" fill="var(--ink-2)">'+r.tier+'</text>';
    s+='<text x="'+xs[i]+'" y="'+(H-14)+'" text-anchor="middle" font-size="13" font-weight="700" fill="var(--women)" class="glabel" font-family="Bricolage Grotesque">-'+r.gap_pct+'%</text>';
  });
  s+='<path d="'+mp+'" pathLength="1" fill="none" stroke="var(--men)" stroke-width="3.5" class="gline"/>';
  s+='<path d="'+wp+'" pathLength="1" fill="none" stroke="var(--women)" stroke-width="3.5" class="gline"/>';
  rows.forEach(function(r,i){
    s+='<circle cx="'+xs[i]+'" cy="'+yOf(r.men_median)+'" r="5" fill="var(--men)" class="gdot"/>';
    s+='<circle cx="'+xs[i]+'" cy="'+yOf(r.women_median)+'" r="5" fill="var(--women)" class="gdot"/>';
  });
  s+='<text x="'+xs[0]+'" y="'+(yOf(rows[0].men_median)-12)+'" text-anchor="middle" font-size="13" fill="var(--men)" class="glabel">Hombres</text>';
  s+='<text x="'+xs[0]+'" y="'+(yOf(rows[0].women_median)+22)+'" text-anchor="middle" font-size="13" font-weight="600" fill="var(--women)" class="glabel">Mujeres</text>';
  s+='</svg>';
  return s;
}

// vanishing: female share bars with 50% line
function shareBars(rows){
  var W=680, colW=(W-40)/rows.length, top=30, H=300, baseY=236;
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  var y50=baseY-(baseY-top)*0.5;
  s+='<line x1="20" y1="'+y50+'" x2="'+(W-20)+'" y2="'+y50+'" stroke="var(--baseline)" stroke-width="1" stroke-dasharray="4 4"/>';
  s+='<text x="'+(W-20)+'" y="'+(y50-6)+'" text-anchor="end" font-size="12" fill="var(--muted)" class="mono">paridad 50%</text>';
  rows.forEach(function(r,i){
    var x=28+i*colW, h=(baseY-top)*r.women_share/100;
    var c = r.women_share>=50 ? "var(--women)" : "var(--men)";
    s+='<rect x="'+x+'" y="'+(baseY-h)+'" width="'+(colW-18)+'" height="'+h+'" rx="5" fill="'+c+'" class="gcol"/>';
    s+='<text x="'+(x+(colW-18)/2)+'" y="'+(baseY-h-10)+'" text-anchor="middle" font-size="16" font-weight="700" fill="var(--ink)" class="glabel">'+r.women_share+'%</text>';
    s+='<text x="'+(x+(colW-18)/2)+'" y="'+(baseY+18)+'" text-anchor="middle" font-size="12.5" fill="var(--ink-2)">'+r.tier.replace("Staff-Principal","Staff")+'</text>';
  });
  s+='</svg>';
  return s;
}

// oaxaca stacked bar (explained / unexplained of the raw gap)
function waterfall(ox){
  var W=680,H=150, padL=20, barY=40, barH=52, innerW=W-40;
  var ew=innerW*ox.explained_pct/100, uw=innerW*ox.unexplained_pct/100;
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  s+='<rect x="'+padL+'" y="'+barY+'" width="'+ew+'" height="'+barH+'" rx="5" fill="var(--men)" class="gbar"/>';
  s+='<rect x="'+(padL+ew)+'" y="'+barY+'" width="'+uw+'" height="'+barH+'" rx="5" fill="var(--women)" class="gbar"/>';
  s+='<text x="'+(padL+ew/2)+'" y="'+(barY+barH/2)+'" text-anchor="middle" dominant-baseline="middle" font-size="16" font-weight="700" fill="#fff" class="glabel">'+ox.explained_pct+'% explicado</text>';
  s+='<text x="'+(padL+ew+uw/2)+'" y="'+(barY+barH/2)+'" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="700" fill="#fff" class="glabel">'+ox.unexplained_pct+'%</text>';
  s+='<text x="'+padL+'" y="28" font-size="13" fill="var(--muted)">Composición (experiencia, nivel, rol, inglés)</text>';
  s+='<text x="'+(W-20)+'" y="'+(barY+barH+24)+'" text-anchor="end" font-size="13" fill="var(--women)" font-weight="600">sin explicación</text>';
  s+='</svg>';
  return s;
}

// waffle 100 cells, N highlighted
function waffle(pct){
  var W=680, cell=54, gap=8, cols=10, side=(W-(cols*cell+(cols-1)*gap))/2;
  var rows=10, H=rows*cell+(rows-1)*gap+8;
  var n=Math.round(pct);
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  for(var i=0;i<100;i++){
    var r=Math.floor(i/10), cvar=i%10;
    var x=side+cvar*(cell+gap), y=4+r*(cell+gap);
    var c = i<n ? "var(--women)" : "var(--surface-2)";
    s+='<rect x="'+x+'" y="'+y+'" width="'+cell+'" height="'+cell+'" rx="7" fill="'+c+'" class="cell" style="transition-delay:'+(i*7)+'ms"/>';
  }
  s+='</svg>';
  return s;
}

// donut split (first part is the highlighted/center one)
function donut(parts, centerLabel){
  var W=680,H=300, cx=200, cy=150, r=100, rin=58;
  var cols=["var(--lime)","var(--men)","var(--baseline)"];
  var tot=parts.reduce(function(a,p){return a+p.value;},0), acc=0;
  function arc(a0,a1){
    var x0=cx+r*Math.cos(a0), y0=cy+r*Math.sin(a0), x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
    var xi0=cx+rin*Math.cos(a1), yi0=cy+rin*Math.sin(a1), xi1=cx+rin*Math.cos(a0), yi1=cy+rin*Math.sin(a0);
    var large=(a1-a0)>Math.PI?1:0;
    return 'M'+x0+' '+y0+' A'+r+' '+r+' 0 '+large+' 1 '+x1+' '+y1+' L'+xi0+' '+yi0+' A'+rin+' '+rin+' 0 '+large+' 0 '+xi1+' '+yi1+' Z';
  }
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
  parts.forEach(function(p,i){
    var a0=-Math.PI/2 + 2*Math.PI*acc/tot; acc+=p.value;
    var a1=-Math.PI/2 + 2*Math.PI*acc/tot;
    s+='<path d="'+arc(a0,a1-0.012)+'" fill="'+cols[i]+'" class="glabel"/>';
    var yy=70+i*42;
    s+='<rect x="380" y="'+(yy-14)+'" width="14" height="14" rx="3" fill="'+cols[i]+'"/>';
    s+='<text x="402" y="'+(yy-2)+'" font-size="15" fill="var(--ink)" font-weight="600" class="glabel">'+p.value+'%</text>';
    s+='<text x="436" y="'+(yy-2)+'" font-size="14" fill="var(--ink-2)" class="glabel">'+p.label+'</text>';
  });
  s+='<text x="'+cx+'" y="'+(cy-4)+'" text-anchor="middle" font-size="30" font-weight="800" fill="var(--ink)" font-family="Bricolage Grotesque" class="glabel">'+parts[0].value+'%</text>';
  s+='<text x="'+cx+'" y="'+(cy+18)+'" text-anchor="middle" font-size="12.5" fill="var(--muted)" class="glabel">'+(centerLabel||"")+'</text>';
  s+='</svg>';
  return s;
}
