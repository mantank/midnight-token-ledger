"use strict";
const UsageCard = (() => {
  const site = "mantank.github.io/midnight-token-ledger/";
  const oneDay = 86400000;
  const atMidnight = date => Date.parse(date + "T00:00:00Z");
  const amount = row => row.input + row.output;
  const qr = new Image();
  qr.src = "data:image/png;base64,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";

  function makeCard({period, through, active, history, bill, toolName, nickname="深夜开发者", avatar, sample=false}) {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1430;
    const ctx = canvas.getContext("2d");
    const colors = {
      line:"#23464c", mint:"#73e8c3", ink:"#f3fbfa", muted:"#a1bbb9",
      heat:["#172e3a","#16484d","#20645c","#208676","#3bb79b","#87f3cd"]
    };
    function text(value,x,y,size,fill=colors.ink,weight=600,width=790) {
      ctx.fillStyle=fill;
      ctx.font=weight+" "+size+"px system-ui, sans-serif";
      ctx.fillText(value,x,y,width);
    }
    function tile(x,y,w,h,r,fill) {
      ctx.fillStyle=fill;
      ctx.beginPath();
      ctx.roundRect(x,y,w,h,r);
      ctx.fill();
    }

    const bg = ctx.createLinearGradient(0,0,900,1430);
    bg.addColorStop(0,"#122b3d");
    bg.addColorStop(.55,"#0c1627");
    bg.addColorStop(1,"#102b2b");
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,900,1430);
    ctx.strokeStyle=colors.line;
    ctx.lineWidth=1.5;
    for (const radius of [76,105,134,163,192,221]) {
      ctx.beginPath();
      ctx.arc(874,140,radius,0,Math.PI*2);
      ctx.stroke();
    }
    tile(52,54,42,42,11,"#164e58");
    [11,17,25].forEach((height,i)=>tile(61+i*8,87-height,5,height,2,colors.mint));
    text("深夜开发者",109,84,29);
    ctx.textAlign="right";
    text(period,848,84,24,colors.muted);
    ctx.textAlign="left";
    ctx.save(); ctx.beginPath();ctx.arc(99,167,47,0,2*Math.PI);ctx.clip();
    ctx.fillStyle="#205b59";ctx.fillRect(52,120,94,94);
    if(avatar){const side=Math.min(avatar.naturalWidth,avatar.naturalHeight);ctx.drawImage(avatar,(avatar.naturalWidth-side)/2,(avatar.naturalHeight-side)/2,side,side,52,120,94,94);}
    else {ctx.textAlign="center";text(Array.from(nickname)[0]||"夜",99,183,44);}
    ctx.restore();text(nickname,164,167,44,colors.ink,700,665);
    text(sample?"个人用量名片 · 示例数据":"个人用量名片",165,205,22,colors.muted);
    ctx.translate(0,42);
    text("所选时段消耗 · Token",52,231,27,colors.muted,500);
    const tokens = active.reduce((total,row)=>total+amount(row),0);
    const unit=tokens>=1e8?"亿":tokens>=1e4?"万":"";
    const number=unit?(tokens/(unit==="亿"?1e8:1e4)).toFixed(2):String(tokens);
    text(number+" "+unit,48,368,124,colors.ink,720);

    const priced = bill.items.length !== bill.missing;
    const price = priced ? Pricing.dollars(bill.total) : "待配置";
    const costLabel = bill.missing ? "已定价小计  " : "估算费用  ";
    text(costLabel+price,52,436,33,colors.mint);
    if (bill.missing) text(bill.missing+" 个模型缺少单价",53,473,21,colors.muted,500);

    const daily = new Map(), cutoff = atMidnight(through);
    for (const row of history) {
      const date = atMidnight(row.date);
      if (date <= cutoff && amount(row))
        daily.set(date,(daily.get(date)||0)+amount(row));
    }
    let consecutive = 0;
    while (daily.has(cutoff - consecutive*oneDay)) consecutive++;
    const record=[...daily.values()].filter(n=>n>0);
    const rank=record.filter(n=>n>(daily.get(cutoff)||0)).length+1;
    const insight=period.length===10?"个人活跃日用量第 "+rank+" 名 / "+daily.size+" 天":"本月活跃 "+new Set(active.map(r=>r.date)).size+" 天";
    tile(52,488,796,50,12,"#183e43");text(insight,72,522,24,colors.mint,600);
    ctx.translate(0,50);
    tile(52,521,796,340,24,"#142635");
    text("使用轨迹",78,577,32);
    ctx.textAlign="right";
    text("时段末连续 "+consecutive+" 天 · 有记录 "+daily.size+" 天",823,577,23,colors.muted,500,525);
    ctx.textAlign="left";

    const columns = 26;
    const firstDay = cutoff - (columns*7-1)*oneDay;
    const peak = Math.max(1,...[...daily].filter(([d])=>d>=firstDay).map(([,n])=>n));
    for(let column=0;column<columns;column++) {
      for(let day=0;day<7;day++) {
        const time=firstDay+(column*7+day)*oneDay;
        const count=daily.get(time)||0;
        const level=count?Math.ceil(5*Math.sqrt(count/peak)):0;
        tile(79+column*29,605+day*28,22,22,5,colors.heat[level]);
      }
    }
    text("近 26 周 · 每格一天",79,838,22,colors.muted,500);

    const tools = new Map();
    for (const row of active) tools.set(row.tool,(tools.get(row.tool)||0)+amount(row));
    const ordered=[...tools].sort((a,b)=>b[1]-a[1]);
    const parts=ordered.slice(0,3);
    const rest=ordered.slice(3).reduce((n,p)=>n+p[1],0);
    if(rest) parts.push(["其他",rest]);
    const swatches=["#76e3bf","#95b9ef","#ffbf8d","#a7aeb9"];
    text("主力工具",52,933,32);
    let x=52;
    parts.forEach(([name,n],i)=>{
      const width=796*n/tokens;ctx.fillStyle=swatches[i];ctx.fillRect(x,961,width,14);x+=width;
      const left=52+(i%2)*400, y=1011+Math.floor(i/2)*42;
      tile(left,y-15,13,13,4,swatches[i]);text(toolName(name)+"  "+(100*n/tokens).toFixed(1)+"%",left+23,y,24,colors.ink,550,361);
    });
    ctx.translate(0,40);
    tile(52,1063,796,1,0,colors.line);
    text("生成你的用量分享卡",52,1127,30);
    text(site,52,1175,22,colors.mint,550,600);
    text("依据本地用量记录 · 费用按模型单价估算",52,1233,21,colors.muted,500,600);
    if(qr.complete && qr.naturalWidth){
      tile(686,1097,162,162,17,"#fff");
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(qr,700,1111,134,134);
    }
    return canvas.toDataURL("image/png");
  }
  return {makeCard, ready:()=>qr.decode().catch(()=>{})};
})();
