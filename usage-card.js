"use strict";
const UsageCard = (() => {
  const site = "mantank.github.io/midnight-token-ledger/";
  const oneDay = 86400000;
  const atMidnight = date => Date.parse(date + "T00:00:00Z");
  const amount = row => row.input + row.output;
  const qr = new Image();
  qr.src = "usage-qr.png";

  function makeCard({period, through, active, history, bill, toolName}) {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1290;
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

    const bg = ctx.createLinearGradient(0,0,900,1290);
    bg.addColorStop(0,"#122b3d");
    bg.addColorStop(.55,"#0c1627");
    bg.addColorStop(1,"#102b2b");
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,900,1290);
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
    text("我的 AI 用量",52,171,51);
    text("所选时段消耗 · Token",52,231,27,colors.muted,500);
    const tokens = active.reduce((total,row)=>total+amount(row),0);
    text(tokens.toLocaleString("zh-CN"),48,368,124,colors.ink,720);

    const priced = bill.items.length !== bill.missing;
    const price = priced ? Pricing.dollars(bill.total) : "待配置";
    const costLabel = bill.missing ? "已定价小计  " : "估算费用  ";
    text(costLabel+price,52,436,33,colors.mint);
    if (bill.missing)
      text(bill.missing+" 个模型缺少单价",53,481,23,colors.muted,500);

    const daily = new Map(), cutoff = atMidnight(through);
    for (const row of history) {
      const date = atMidnight(row.date);
      if (date <= cutoff && amount(row))
        daily.set(date,(daily.get(date)||0)+amount(row));
    }
    let consecutive = 0;
    while (daily.has(cutoff - consecutive*oneDay)) consecutive++;
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
    const [top,used] = [...tools].sort((a,b)=>b[1]-a[1])[0];
    const share = used/tokens;
    text("主力工具",52,933,32);
    tile(52,961,796,14,7,colors.line);
    tile(52,961,Math.max(12,796*share),14,7,colors.mint);
    text(toolName(top)+"  "+Math.round(share*100)+"%",52,1020,29,colors.ink,650,555);
    ctx.textAlign="right";
    text("其他 "+(100-Math.round(share*100))+"%",848,1020,25,colors.muted,500);
    ctx.textAlign="left";

    tile(52,1063,796,1,0,colors.line);
    text("生成你的用量分享卡",52,1127,30);
    text(site,52,1175,22,colors.mint,550,600);
    text("用量由用户导入 · 费用按模型单价估算",52,1233,21,colors.muted,500,600);
    if(qr.complete && qr.naturalWidth){
      tile(686,1097,162,162,17,"#fff");
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(qr,700,1111,134,134);
    }
    return canvas.toDataURL("image/png");
  }
  return {makeCard};
})();
