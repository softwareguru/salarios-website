/* Hallazgos SG Tech Pulse 2026. Portado de campaign/findings-site.
   Pinta cada figura desde window.SG_DATA, revela las escenas al entrar en
   pantalla y mueve la barra de avance. Lo unico que se quito del original
   es su propio toggle de tema: el sitio ya trae uno en la barra, y el
   original escribia sobre el mismo data-theme y la misma llave sg-theme,
   asi que los dos se peleaban por el control. */
(function(){
  "use strict";
  var D = window.SG_DATA || {};
  // chart primitives (pesoFull, pesoK, barsH, compare, comparePct, pairBars, slope, shareBars, waterfall, waffle, donut) come from charts.js


  // ---- render figures ---------------------------------------------
  var L=D.levers||{}, G=D.gender||{}, AI=D.ai||{}, HU=D.human||{}, M=D.meta||{};
  function setFig(name, html){ var n=document.querySelector('[data-fig="'+name+'"]'); if(n) n.innerHTML=html; }
  function setCap(name, txt){ document.querySelectorAll('[data-cap="'+name+'"]').forEach(function(n){ n.textContent=txt; }); }

  // hero
  document.getElementById("heroMedian").textContent = pesoFull(D.overall.median);
  document.getElementById("heroNote").textContent = "IC 95% ["+pesoFull(D.overall.median_ci[0])+", "+pesoFull(D.overall.median_ci[1])+"] · n="+D.overall.n+" con salario · residentes en México · preliminar";

  // experience
  setFig("experience", barsH(L.experience.map(function(d){return {label:d.label+" años", value:d.median, n:d.n};})));
  setCap("experience", "Mediana de salario base mensual por años de experiencia en tecnología. n por tramo: "+L.experience.map(function(d){return d.label+"="+d.n;}).join(", ")+".");

  // english
  setFig("english", barsH(L.english.map(function(d){return {label:d.label, value:d.median, n:d.n};}), {accentFn:function(d,i){return i===0?"var(--men)":"var(--bar)";}}));
  setCap("english", "Mediana por frecuencia de uso del inglés. Nunca "+pesoFull(L.english[0].median)+" contra todo el tiempo "+pesoFull(L.english[L.english.length-1].median)+", unas "+L.english_mult.mult+" veces (IC 95% ["+L.english_mult.ci[0]+", "+L.english_mult.ci[1]+"]). n="+L.english.reduce(function(a,d){return a+d.n;},0)+". Asociación. El efecto aislado del inglés exige el DAG del estudio 2020-2022.");

  // foreign
  setFig("foreign", compare({label:"Empleador extranjero", value:L.foreign.foreign_median}, {label:"Empleador local", value:L.foreign.local_median}, "+"+L.foreign.premium_pct+"%", {c1:"var(--bar)", c2:"var(--men)"}));
  setCap("foreign", L.foreign.share_pct+"% trabaja para un empleador extranjero. Mediana "+pesoFull(L.foreign.foreign_median)+" contra "+pesoFull(L.foreign.local_median)+" local, +"+L.foreign.premium_pct+"% (IC 95% ["+L.foreign.premium_ci[0]+"%, "+L.foreign.premium_ci[1]+"%], amplio). n extranjero="+L.foreign.foreign_n+". Asociación. Quién llega a un empleo extranjero no es aleatorio.");

  // stack
  setFig("stack", barsH(L.stack.filter(function(d){return d.n>=8||["Java","C#","Python","JavaScript"].indexOf(d.label)>=0;}).map(function(d){return {label:d.label, value:d.median, n:d.n};})));
  setCap("stack", "Mediana por lenguaje de programación más usado en el trabajo (n≥8). Java "+pesoFull(L.stack.filter(function(d){return d.label==="Java";})[0].median)+", JavaScript "+pesoFull(L.stack.filter(function(d){return d.label==="JavaScript";})[0].median)+". El lenguaje es un marcador del mercado, no una palanca que acciones sola. Asociación, no causa.");

  // city
  setFig("city", barsH(L.city.map(function(d){return {label:d.label, value:d.median, n:d.n};}), {accentFn:function(d,i){return i===0?"var(--bar)":(i===L.city.length-1?"var(--women)":"var(--bar)");}}));
  setCap("city", "Mediana por ciudad (n≥10). CDMX "+pesoFull(L.city[0].median)+" encabeza. Monterrey "+pesoFull(L.city.filter(function(d){return d.label==="Monterrey";})[0].median)+". Asociación. Refleja dónde se concentran las industrias, no un efecto de mudarse.");

  // modality
  setFig("modality", compare({label:"Totalmente remoto", value:L.modality.remote_median}, {label:"Totalmente presencial", value:L.modality.onsite_median}, "+"+Math.round(100*(L.modality.remote_median/L.modality.onsite_median-1))+"%", {c1:"var(--bar)", c2:"var(--men)"}));
  setCap("modality", "Mediana remoto "+pesoFull(L.modality.remote_median)+" (n="+L.modality.remote_n+") contra presencial "+pesoFull(L.modality.onsite_median)+" (n="+L.modality.onsite_n+"). Asociación. El remoto suele venir con empleadores que ya pagan más.");

  // equity
  setFig("equity", compare({label:"Con acciones", value:L.equity.with_median}, {label:"Sin acciones", value:L.equity.without_median}, "+"+Math.round(100*(L.equity.with_median/L.equity.without_median-1))+"%", {c1:"var(--bar)", c2:"var(--men)"}));
  setCap("equity", "Solo "+L.equity.share_pct+"% recibe acciones, una de cada "+Math.round(100/L.equity.share_pct)+". Con acciones "+pesoFull(L.equity.with_median)+" contra "+pesoFull(L.equity.without_median)+" sin ellas. n con acciones="+L.equity.with_n+". Asociación. Las acciones marcan el tipo de empresa, no un efecto por sí mismas.");

  // degree + learning
  setFig("degree", barsH(L.degree.filter(function(d){return d.n>=10;}).map(function(d){return {label:d.label, value:d.median, n:d.n};})));
  setCap("degree", "Mediana por nivel educativo más alto (n≥10). Asociación. Los retornos a la educación están confundidos por selección.");
  setFig("learning", barsH(L.learning.map(function(d){return {label:d.label.replace("En.el","En el"), value:d.median, n:d.n};})));
  setCap("learning", "Mediana por cómo aprendiste a desarrollar software. Asociación, no causa.");

  // company size
  var cs_sorted=L.company_size.slice().sort(function(a,b){return a.median-b.median;});
  setFig("company_size", barsH(cs_sorted.map(function(d){return {label:d.label+" empleados", value:d.median, n:d.n};}), {accentFn:function(d,i){return i===0?"var(--women)":"var(--bar)";}}));
  setCap("company_size", "Mediana por tamaño de empresa. La más chica, "+cs_sorted[0].label+", en "+pesoFull(cs_sorted[0].median)+". Asociación. El tamaño marca estructura y presupuesto.");

  // certs
  setFig("certs", compare({label:"Con certificación", value:L.certs.with_median}, {label:"Sin certificación", value:L.certs.without_median}, "+"+L.certs.pct_delta+"%", {c1:"var(--bar)", c2:"var(--men)"}));
  setCap("certs", "Con al menos una certificación activa "+pesoFull(L.certs.with_median)+" contra "+pesoFull(L.certs.without_median)+" sin ninguna. La mitad de la muestra tiene alguna. n="+L.certs.with_n+"/"+L.certs.without_n+". Asociación, no causa. Certificarse y ganar más pueden venir juntos.");

  // gender raw
  document.getElementById("rawGap").textContent = G.raw.gap_pct+"%";
  document.getElementById("rawGapSub").textContent = "Hombres "+pesoFull(G.raw.men_median)+". Mujeres "+pesoFull(G.raw.women_median)+".";
  setCap("raw", "Brecha cruda de salario base. IC 95% ["+G.raw.ci_low+"%, "+G.raw.ci_high+"%]. n="+G.raw.women_n+" mujeres, "+G.raw.men_n+" hombres.");

  // vanishing
  setFig("vanishing", shareBars(G.vanishing));
  setCap("vanishing", "% de mujeres en cada nivel. Mayoría en Junior y Medio. "+G.senior_plus_share+"% de senior en adelante. Participación total "+G.participation+"%.");

  // scissors
  setFig("scissors", slope(G.by_tier));
  setCap("scissors", "Mediana por nivel. Medio -"+G.by_tier[0].gap_pct+"%, Senior -"+G.by_tier[1].gap_pct+"%. Gerente descansa en "+G.by_tier[2].women_n+" mujeres, direccional.");

  // oaxaca
  var R=G.rigor;
  setFig("gender_ladder", barsH(R.sensitivity.map(function(s){return {label:s.spec, value:s.penalty};}), {fmt:function(v){return v+"%";}, accentFn:function(d,i){return i===0?"var(--women)":(i===R.sensitivity.length-1?"var(--men)":"var(--bar)");}}));
  setCap("gender_ladder", "Brecha ajustada, por conjunto de controles. Con todo ajustado queda ~"+R.bounds_lower+"% (IC 95% ["+R.adjusted_ci[0]+", "+R.adjusted_ci[1]+"], toca el cero). Estable entre tipos de cambio 17 y 20.");
  document.getElementById("boundsLine").textContent = "El efecto del género queda acotado entre ~"+R.bounds_lower+"% (emparejando todo) y "+R.bounds_upper+"% (sin ajustar). La parte que ni el nivel ni el rol explican es chica, y su intervalo de confianza toca el cero, así que no afirmamos un castigo fijo por el mismo trabajo. La brecha es, sobre todo, de progresión.";

  // foreign gap
  setFig("foreign_gap", pairBars([{tier:"Extranjero", men_median:G.foreign_gap.men_median, women_median:G.foreign_gap.women_median, gap_pct:G.foreign_gap.gap_pct, men_n:G.foreign_gap.men_n, women_n:G.foreign_gap.women_n}]));
  setCap("foreign_gap", "En empleadores extranjeros: hombres "+pesoFull(G.foreign_gap.men_median)+" contra mujeres "+pesoFull(G.foreign_gap.women_median)+". Acceso parejo: "+G.foreign_gap.access_m+"% ellos, "+G.foreign_gap.access_w+"% ellas. n="+G.foreign_gap.women_n+" mujeres, direccional.");

  // pause
  setFig("pause", compare({label:"Mujeres", value:G.pause.women_pct}, {label:"Hombres", value:G.pause.men_pct}, G.pause.ratio+"x", {c1:"var(--women)", c2:"var(--men)"}));
  // override formatter for pause (percent, not pesos): rebuild manually
  (function(){
    var pw=G.pause.women_pct, pm=G.pause.men_pct, max=Math.max(pw,pm)*1.25;
    var W=680,H=250, baseY=186, bw=150, gap=120, x1=180, x2=x1+bw+gap;
    var h1=(pw/max)*150, h2=(pm/max)*150;
    var s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
    [[x1,h1,pw,"Mujeres","var(--women)"],[x2,h2,pm,"Hombres","var(--men)"]].forEach(function(r){
      s+='<rect x="'+r[0]+'" y="'+(baseY-r[1])+'" width="'+bw+'" height="'+r[1]+'" rx="7" fill="'+r[4]+'" class="gcol"/>';
      s+='<text x="'+(r[0]+bw/2)+'" y="'+(baseY-r[1]-12)+'" text-anchor="middle" font-size="24" font-weight="800" fill="var(--ink)" class="glabel" font-family="Bricolage Grotesque">'+r[2]+'%</text>';
      s+='<text x="'+(r[0]+bw/2)+'" y="'+(baseY+24)+'" text-anchor="middle" font-size="15" fill="var(--ink-2)">'+r[3]+'</text>';
    });
    s+='<text x="'+(W/2)+'" y="34" text-anchor="middle" font-size="22" font-weight="800" fill="var(--women)" class="glabel" font-family="Bricolage Grotesque">'+G.pause.ratio+'x</text>';
    s+='</svg>';
    setFig("pause", s);
  })();
  setCap("pause", "% que interrumpió o redujo su carrera >10 meses por motivos familiares o personales. Mujeres "+G.pause.women_pct+"% contra hombres "+G.pause.men_pct+"%.");

  // isolation
  setFig("isolation", waffle(G.lived.isolation_pct));
  setCap("isolation", G.lived.isolation_pct+"% de las mujeres son ≤20% de su equipo. Mediana: "+G.lived.isolation_median+"% de pares mujeres. n="+G.lived.isolation_n+".");
  var ll=document.getElementById("livedList");
  ll.innerHTML = "<li>"+G.lived.harassment_pct+"% reporta haberse sentido insegura o haber sufrido acoso en su empleo actual, "+G.lived.harassment_freq_n+" de ellas de forma frecuente.</li>"+
                 "<li>"+G.lived.noprogram_pct+"% dice que su empresa no tiene ningún programa formal para promover mujeres al liderazgo.</li>";

  // origin
  document.getElementById("originList").innerHTML =
    "<li>Edad del primer programa: "+G.origin.first_program_w+" años las mujeres, "+G.origin.first_program_m+" los hombres. Igual.</li>"+
    "<li>Computadora en la infancia: "+G.origin.computer_w+"% ellas, "+G.origin.computer_m+"% ellos. Si acaso, ellas un poco más.</li>";

  // AI coding split
  setFig("coding_split", donut([
    {label:"Instruyo a los agentes", value:AI.coding_split.agentic_pct},
    {label:"A mano + IA de apoyo", value:AI.coding_split.support_pct},
    {label:"A mano + IA complementaria", value:AI.coding_split.complementary_pct}
  ], "instruye agentes"));
  setCap("coding_split", "Cómo se crea código hoy, entre quienes respondieron cómo lo crean. n="+AI.coding_split.n+" (México).");

  // agentic pay
  setFig("agentic_pay", compare({label:"Instruye agentes", value:AI.agentic_pay.agent_median}, {label:"El resto", value:AI.agentic_pay.rest_median}, "+"+AI.agentic_pay.pct+"%", {c1:"var(--lime)", c2:"var(--men)"}));
  setCap("agentic_pay", "Mediana de quienes sobre todo instruyen agentes "+pesoFull(AI.agentic_pay.agent_median)+" contra "+pesoFull(AI.agentic_pay.rest_median)+" el resto, +"+AI.agentic_pay.pct+"% (IC 95% ["+AI.agentic_pay.ci[0]+"%, "+AI.agentic_pay.ci[1]+"%]). Descriptivo, no causal.");

  // ai gender
  (function(){
    var pw=AI.adoption_by_gender.women_pct, pm=AI.adoption_by_gender.men_pct, max=100;
    var W=680,H=250, baseY=186, bw=150, gap=120, x1=180, x2=x1+bw+gap;
    var h1=(pm/max)*150, h2=(pw/max)*150;
    var s='<svg viewBox="0 0 '+W+' '+H+'" role="img">';
    [[x1,h1,pm,"Hombres","var(--men)"],[x2,h2,pw,"Mujeres","var(--women)"]].forEach(function(r){
      s+='<rect x="'+r[0]+'" y="'+(baseY-r[1])+'" width="'+bw+'" height="'+r[1]+'" rx="7" fill="'+r[4]+'" class="gcol"/>';
      s+='<text x="'+(r[0]+bw/2)+'" y="'+(baseY-r[1]-12)+'" text-anchor="middle" font-size="24" font-weight="800" fill="var(--ink)" class="glabel" font-family="Bricolage Grotesque">'+r[2]+'%</text>';
      s+='<text x="'+(r[0]+bw/2)+'" y="'+(baseY+24)+'" text-anchor="middle" font-size="15" fill="var(--ink-2)">'+r[3]+'</text>';
    });
    s+='</svg>';
    setFig("ai_gender", s);
  })();
  setCap("ai_gender", "Entre quienes desarrollan software, % que sobre todo instruye a los agentes. Hombres "+AI.adoption_by_gender.men_pct+"% (n="+AI.adoption_by_gender.men_n+") contra mujeres "+AI.adoption_by_gender.women_pct+"% (n="+AI.adoption_by_gender.women_n+").");

  // ai roles
  document.getElementById("aiRoles").textContent = AI.roles.count;
  setCap("roles", "Puestos centrados en IA en México: "+AI.roles.count+". Hombres "+AI.roles.men+" contra mujeres "+AI.roles.women+".");

  // finances
  (function(){
    var items=[
      {label:"Sin fondo de retiro", value:HU.finances.no_retirement_pct},
      {label:"Con deuda educativa", value:HU.finances.edu_debt_pct},
      {label:"Segundo empleo", value:HU.finances.second_job_pct},
      {label:"No ahorra nada", value:HU.finances.no_savings_pct},
      {label:"Sin seguridad social", value:HU.finances.no_ss_pct}
    ];
    setFig("finances", barsH(items, {fmt:function(v){return v+"%";}, accentFn:function(){return "var(--coral)";}}));
  })();
  setCap("finances", "% de la muestra, residentes en México. Ahorro mediana "+HU.finances.savings_median+"% del ingreso. n="+HU.finances.n+".");

  // neurodiv
  setFig("neurodiv", waffle(HU.neurodiv.no_support_pct));
  setCap("neurodiv", HU.neurodiv.pct+"% reporta una neurodivergencia (n="+HU.neurodiv.n+"). De quienes respondieron, "+HU.neurodiv.no_support_pct+"% dice que su empresa no la apoya. Las celdas marcan ese "+HU.neurodiv.no_support_pct+"%.");

  // footer
  document.getElementById("footNote").textContent = "Volcado del "+M.date_es+" · "+M.total_n+" respuestas, "+M.mx_n+" en México · muestra autoseleccionada, preliminar";

  // ---- scroll: reveal + progress ----------------------------------
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); } });
  }, {threshold:0.15, rootMargin:"0px 0px -8% 0px"});
  // attach to scenes (so figures animate) and to each .rv
  document.querySelectorAll("[data-scene], .act, .hero").forEach(function(n){ io.observe(n); });
  document.querySelectorAll(".rv").forEach(function(n){ io.observe(n); });
  // mark scene 'in' also toggles figure anim via parent; ensure fig svg animates by adding .in to scene container
  var io2=new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting) e.target.classList.add("in"); });
  }, {threshold:0.2});
  document.querySelectorAll(".fig").forEach(function(n){ io2.observe(n); });

  var prog=document.getElementById("progress");
  function onScroll(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    prog.style.width=(100*window.scrollY/h)+"%";
  }
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();

})();
