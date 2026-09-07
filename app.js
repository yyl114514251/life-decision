/* ============================================================
 * 蓝本 · 生涯决策辅助系统  Prototype v0.1
 * 纯前端多目标评分模型 + SVG 图表，无外部依赖
 * ============================================================ */

(() => {
  "use strict";

  // ---------- 8 个评估维度 ----------
  const DIMS = [
    { key: "income",    label: "预期收入" },
    { key: "success",   label: "成功率" },
    { key: "time",      label: "时间效率" },
    { key: "finance",   label: "经济友好" },
    { key: "risk",      label: "风险可控" },
    { key: "upside",    label: "发展上限" },
    { key: "interest",  label: "兴趣匹配" },
    { key: "stability", label: "稳定性" },
  ];

  // ---------- 5 条路径的基础分 (0-10) ----------
  const PATHS = {
    grad: {
      name: "考研",
      color: "#60a5fa",
      base: { income:7, success:5, time:3, finance:6, risk:5, upside:8, interest:5, stability:7 },
      milestones: [
        { year: "第 1 年", text: "确定目标院校与专业，开始系统复习数学/英语/专业课" },
        { year: "第 2 年", text: "参加初试（12 月），若过线则准备复试（3-4 月）" },
        { year: "第 3 年", text: "入学读研，确定研究方向，参与导师课题或实验室项目" },
        { year: "第 4 年", text: "发表论文/完成项目，积累科研成果，考虑读博或就业" },
        { year: "第 5 年", text: "硕士毕业，凭借更高学历进入研发岗/选调/继续读博" },
      ],
    },
    work: {
      name: "就业",
      color: "#34d399",
      base: { income:6, success:8, time:9, finance:9, risk:6, upside:6, interest:5, stability:5 },
      milestones: [
        { year: "第 1 年", text: "完善简历与作品集，参加暑期实习，积累项目经验" },
        { year: "第 2 年", text: "参加秋招/春招，投递目标公司，面试拿 offer" },
        { year: "第 3 年", text: "入职工作，熟悉业务与技术栈，通过试用期并转正" },
        { year: "第 4 年", text: "承担核心模块，争取晋升或跳槽涨薪，积累行业资源" },
        { year: "第 5 年", text: "成为中级/高级工程师，或转向技术管理/产品方向" },
      ],
    },
    civil: {
      name: "考公",
      color: "#fbbf24",
      base: { income:5, success:2, time:6, finance:7, risk:7, upside:5, interest:5, stability:10 },
      milestones: [
        { year: "第 1 年", text: "了解国考/省考/选调岗位要求，开始行测+申论系统学习" },
        { year: "第 2 年", text: "参加国考（11 月）/省考（3-4 月），笔试后进面" },
        { year: "第 3 年", text: "面试+体检+政审，若上岸则入职；未上岸可继续备考" },
        { year: "第 4 年", text: "入职公务员/事业单位，熟悉体制内工作流程与晋升通道" },
        { year: "第 5 年", text: "稳定履职，争取科员→四级主任科员晋升，或参与遴选" },
      ],
    },
    abroad: {
      name: "出国",
      color: "#c084fc",
      base: { income:8, success:6, time:4, finance:2, risk:5, upside:9, interest:5, stability:4 },
      milestones: [
        { year: "第 1 年", text: "准备语言考试（托福/雅思/GRE），提升 GPA 与科研/实习背景" },
        { year: "第 2 年", text: "选校定校，撰写文书，秋季递交申请，等待 offer" },
        { year: "第 3 年", text: "办理签证，出国就读硕士（1-2 年），适应海外学习生活" },
        { year: "第 4 年", text: "完成学业，在海外找实习/工作，或准备回国就业" },
        { year: "第 5 年", text: "凭借海外学历与国际视野，进入外企/大厂/科研机构，或留海外发展" },
      ],
    },
    startup: {
      name: "创业",
      color: "#f87171",
      base: { income:9, success:1, time:7, finance:3, risk:2, upside:10, interest:5, stability:1 },
      milestones: [
        { year: "第 1 年", text: "寻找创业方向与合伙人，做市场调研，完成最小可行产品（MVP）" },
        { year: "第 2 年", text: "产品上线，获取首批用户，尝试变现，可能寻求天使轮融资" },
        { year: "第 3 年", text: "验证商业模式，扩大团队与用户规模，争取 Pre-A/A 轮融资" },
        { year: "第 4 年", text: "规模化增长或转型，应对竞争与现金流压力，核心团队磨合" },
        { year: "第 5 年", text: "若存活则进入稳定增长或被收购/上市；若失败则复盘转型或回归就业" },
      ],
    },
  };

  // ---------- 各核心目标对应的维度权重 ----------
  const GOAL_WEIGHTS = {
    money:    { income:0.25, upside:0.20, finance:0.10, success:0.10, risk:0.10, time:0.10, stability:0.05, interest:0.10 },
    stable:   { stability:0.30, risk:0.25, success:0.15, income:0.10, time:0.05, finance:0.05, upside:0.05, interest:0.05 },
    academic: { upside:0.25, interest:0.20, success:0.15, income:0.10, time:0.10, finance:0.10, risk:0.05, stability:0.05 },
    freedom:  { interest:0.25, upside:0.20, time:0.15, risk:0.10, income:0.10, finance:0.10, success:0.05, stability:0.05 },
    status:   { upside:0.25, stability:0.20, income:0.15, success:0.10, risk:0.10, interest:0.08, time:0.06, finance:0.06 },
    family:   { stability:0.25, time:0.20, risk:0.15, income:0.15, success:0.10, finance:0.08, upside:0.04, interest:0.03 },
  };

  // ---------- 兴趣对各路径的基础匹配加成 ----------
  const INTEREST_BOOST = {
    research:    { grad: 2, abroad: 1.5, work: 0.5, civil: 0, startup: 0 },
    engineering: { work: 2, grad: 1.5, abroad: 0.5, civil: 0.5, startup: 0.5 },
    product:     { work: 1.5, startup: 1.5, grad: 0, abroad: 0.5, civil: 0 },
    management:  { civil: 1.5, startup: 1.5, work: 1, grad: 0.5, abroad: 0.5 },
    stable:      { civil: 2, work: 1, grad: 0.5, abroad: 0, startup: -1 },
    freedom:     { startup: 2, abroad: 1.5, work: 0.5, grad: 0, civil: -1 },
  };

  // ---------- 工具函数 ----------
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const $ = (id) => document.getElementById(id);

  function getSelectedTags(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} .tag.active`)).map(t => t.dataset.value);
  }

  // ---------- 核心：根据输入计算各路径调整后分数 ----------
  function computeScores(input) {
    const results = {};
    const activeInterests = input.interests;
    const constraints = input.constraints;

    for (const [key, path] of Object.entries(PATHS)) {
      // 排除被约束禁用的路径
      if (constraints.includes("noGoAbroad") && key === "abroad") continue;
      if (constraints.includes("noStartup") && key === "startup") continue;

      const score = { ...path.base };

      // 兴趣匹配
      let interestScore = 4; // 基础中性
      for (const interest of activeInterests) {
        interestScore += (INTEREST_BOOST[interest]?.[key] || 0) / Math.max(1, activeInterests.length * 0.5);
      }
      score.interest = clamp(interestScore, 0, 10);

      // 成绩排名（路径专属加成）
      const gpaMods = {
        top5:   { grad: { success: 2 }, abroad: { success: 2 }, work: { income: 1 } },
        top15:  { grad: { success: 1 }, abroad: { success: 1 } },
        top30:  {},
        top50:  { grad: { success: -1 }, abroad: { success: -1 } },
        bottom: { grad: { success: -2 }, abroad: { success: -2 }, work: { success: -1 } },
      };
      const gpaMod = gpaMods[input.gpa]?.[key] || {};
      for (const [dim, val] of Object.entries(gpaMod)) {
        score[dim] = clamp((score[dim] || 0) + val, 0, 10);
      }

      // 年级
      if (input.grade === "senior") {
        score.success = clamp(score.success - 2, 0, 10);
        if (key === "grad" || key === "abroad") score.success = clamp(score.success - 1, 0, 10);
        if (key === "work") score.success = clamp(score.success + 1, 0, 10);
      } else if (input.grade === "junior") {
        if (key === "grad") score.success = clamp(score.success - 1, 0, 10);
      }

      // 家庭经济
      if (input.finance === "poor") {
        if (key === "abroad") { score.finance = clamp(score.finance - 3, 0, 10); score.success = clamp(score.success - 1, 0, 10); }
        if (key === "startup") { score.finance = clamp(score.finance - 2, 0, 10); }
        if (key === "civil") score.stability = clamp(score.stability + 1, 0, 10);
      } else if (input.finance === "good") {
        if (key === "abroad") score.finance = clamp(score.finance + 2, 0, 10);
        if (key === "startup") { score.finance = clamp(score.finance + 1, 0, 10); score.success = clamp(score.success + 1, 0, 10); }
      } else if (input.finance === "wealthy") {
        if (key === "abroad") score.finance = clamp(score.finance + 3, 0, 10);
        if (key === "startup") { score.finance = clamp(score.finance + 2, 0, 10); score.success = clamp(score.success + 2, 0, 10); }
      }

      // 风险偏好
      if (input.risk === "conservative") {
        if (key === "startup") score.risk = clamp(score.risk - 2, 0, 10);
        if (key === "abroad") score.risk = clamp(score.risk - 1, 0, 10);
        if (key === "civil") score.risk = clamp(score.risk + 1, 0, 10);
      } else if (input.risk === "aggressive") {
        if (key === "startup") score.risk = clamp(score.risk + 2, 0, 10);
        if (key === "abroad") score.risk = clamp(score.risk + 1, 0, 10);
        if (key === "civil") score.risk = clamp(score.risk - 1, 0, 10);
      }

      // 特殊约束
      if (constraints.includes("mustEarn")) {
        if (key === "grad" || key === "abroad") score.time = clamp(score.time - 2, 0, 10);
        if (key === "work") score.time = clamp(score.time + 2, 0, 10);
        if (key === "civil") score.time = clamp(score.time + 1, 0, 10);
      }
      if (constraints.includes("stayCity")) {
        if (key === "work" || key === "grad") score.stability = clamp(score.stability + 1, 0, 10);
        if (key === "civil") score.stability = clamp(score.stability - 1, 0, 10);
      }

      results[key] = score;
    }
    return results;
  }

  // ---------- 计算综合得分 ----------
  function computeComposite(scores, weights) {
    const composite = {};
    for (const [key, score] of Object.entries(scores)) {
      let total = 0;
      for (const dim of DIMS) {
        total += (weights[dim.key] || 0) * (score[dim.key] || 0);
      }
      composite[key] = Math.round(total / 10 * 100); // 0-100
    }
    return composite;
  }

  // ---------- 生成推荐理由 ----------
  function generateReason(topKey, input, scores) {
    const path = PATHS[topKey];
    const s = scores[topKey];
    const reasons = [];

    const goalText = { money:"高收入", stable:"稳定安全", academic:"学术研究", freedom:"自由自主", status:"社会地位", family:"兼顾家庭" }[input.goal];

    reasons.push(`以「${goalText}」为第一优先级加权计算，${path.name}在综合匹配上得分最高。`);

    // 强项
    const strengths = [];
    if (s.income >= 7) strengths.push("预期收入较高");
    if (s.success >= 7) strengths.push("成功概率大");
    if (s.time >= 7) strengths.push("时间效率高、能尽快产出");
    if (s.finance >= 7) strengths.push("经济压力小");
    if (s.risk >= 7) strengths.push("风险可控");
    if (s.upside >= 8) strengths.push("发展上限高");
    if (s.interest >= 7) strengths.push("与你的兴趣方向匹配度高");
    if (s.stability >= 8) strengths.push("稳定性极强");
    if (strengths.length) reasons.push(`核心优势：${strengths.slice(0, 3).join("、")}。`);

    // 弱项提醒
    const weaknesses = [];
    if (s.success <= 3) weaknesses.push("成功率偏低，需要充分准备或备选方案");
    if (s.finance <= 3) weaknesses.push("经济成本较高，需评估家庭承受能力");
    if (s.risk <= 3) weaknesses.push("风险较高，需有心理准备和止损计划");
    if (s.stability <= 3) weaknesses.push("稳定性低，未来不确定性大");
    if (weaknesses.length) reasons.push(`需要注意：${weaknesses.slice(0, 2).join("；")}。`);

    // 个性化提示
    if (input.interests.length) {
      reasons.push(`结合你选择的兴趣方向，建议在${path.name}过程中重点关注相关领域的能力积累。`);
    }

    return reasons.join(" ");
  }

  // ---------- 渲染：柱状图 ----------
  function renderBarChart(composite) {
    const container = $("barChart");
    container.innerHTML = "";
    const sorted = Object.entries(composite).sort((a, b) => b[1] - a[1]);
    for (const [key, val] of sorted) {
      const path = PATHS[key];
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <span class="bar-label">${path.name}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:0%; background:linear-gradient(90deg, ${path.color}88, ${path.color});">${val}</div>
        </div>`;
      container.appendChild(row);
      // 动画
      requestAnimationFrame(() => {
        row.querySelector(".bar-fill").style.width = `${val}%`;
      });
    }
  }

  // ---------- 渲染：雷达图 (SVG) ----------
  function renderRadar(topPaths, scores) {
    const svg = $("radarChart");
    svg.innerHTML = "";
    const cx = 200, cy = 200, R = 130;
    const n = DIMS.length;

    // 网格
    for (let level = 1; level <= 4; level++) {
      const r = R * level / 4;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + i * 2 * Math.PI / n;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      poly.setAttribute("points", pts.join(" "));
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", "rgba(255,255,255,0.08)");
      poly.setAttribute("stroke-width", "1");
      svg.appendChild(poly);
    }

    // 轴线 + 标签
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + i * 2 * Math.PI / n;
      const x = cx + R * Math.cos(angle);
      const y = cy + R * Math.sin(angle);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", cx); line.setAttribute("y1", cy);
      line.setAttribute("x2", x); line.setAttribute("y2", y);
      line.setAttribute("stroke", "rgba(255,255,255,0.1)");
      svg.appendChild(line);

      const lx = cx + (R + 22) * Math.cos(angle);
      const ly = cy + (R + 22) * Math.sin(angle);
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", lx); text.setAttribute("y", ly);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("fill", "#9ca3af");
      text.setAttribute("font-size", "11");
      text.textContent = DIMS[i].label;
      svg.appendChild(text);
    }

    // 路径多边形
    for (const key of topPaths) {
      const path = PATHS[key];
      const score = scores[key];
      const pts = [];
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + i * 2 * Math.PI / n;
        const val = (score[DIMS[i].key] || 0) / 10;
        pts.push(`${cx + R * val * Math.cos(angle)},${cy + R * val * Math.sin(angle)}`);
      }
      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      poly.setAttribute("points", pts.join(" "));
      poly.setAttribute("fill", path.color + "33");
      poly.setAttribute("stroke", path.color);
      poly.setAttribute("stroke-width", "2");
      svg.appendChild(poly);
    }

    // 图例
    const legend = $("radarLegend");
    legend.innerHTML = "";
    for (const key of topPaths) {
      const path = PATHS[key];
      const item = document.createElement("span");
      item.className = "legend-item";
      item.innerHTML = `<span class="legend-dot" style="background:${path.color}"></span>${path.name}`;
      legend.appendChild(item);
    }
  }

  // ---------- 渲染：对比表格 ----------
  function renderTable(scores) {
    const tbody = document.querySelector("#compareTable tbody");
    tbody.innerHTML = "";
    const pathKeys = Object.keys(PATHS);
    for (const dim of DIMS) {
      const tr = document.createElement("tr");
      let html = `<td>${dim.label}</td>`;
      const vals = pathKeys.map(k => scores[k]?.[dim.key] ?? "-");
      const maxVal = Math.max(...vals.filter(v => typeof v === "number"));
      const minVal = Math.min(...vals.filter(v => typeof v === "number"));
      for (const v of vals) {
        let cls = "";
        if (v === maxVal && maxVal !== minVal) cls = "cell-high";
        else if (v === minVal && maxVal !== minVal) cls = "cell-low";
        html += `<td class="${cls}">${v}</td>`;
      }
      tr.innerHTML = html;
      tbody.appendChild(tr);
    }
  }

  // ---------- 渲染：时间线 ----------
  function renderTimeline(topKey) {
    const container = $("timeline");
    container.innerHTML = "";
    for (const ms of PATHS[topKey].milestones) {
      const item = document.createElement("div");
      item.className = "tl-item";
      item.innerHTML = `<div class="tl-year">${ms.year}</div><div class="tl-text">${ms.text}</div>`;
      container.appendChild(item);
    }
  }

  // ---------- 主分析流程 ----------
  function analyze() {
    const input = {
      major: $("major").value.trim(),
      grade: $("grade").value,
      gpa: $("gpa").value,
      finance: $("finance").value,
      risk: $("risk").value,
      goal: $("goal").value,
      interests: getSelectedTags("interests"),
      constraints: getSelectedTags("constraints"),
    };

    if (!input.interests.length) input.interests = ["engineering"]; // 默认

    const weights = GOAL_WEIGHTS[input.goal] || GOAL_WEIGHTS.stable;
    const scores = computeScores(input);
    const composite = computeComposite(scores, weights);

    // 排序取前 3
    const sorted = Object.entries(composite).sort((a, b) => b[1] - a[1]);
    const topKey = sorted[0][0];
    const top3 = sorted.slice(0, 3).map(s => s[0]);

    // 渲染
    $("resultPanel").style.display = "block";
    $("recName").textContent = PATHS[topKey].name;
    $("recScore").textContent = composite[topKey];
    $("recReason").textContent = generateReason(topKey, input, scores);

    renderBarChart(composite);
    renderRadar(top3, scores);
    renderTable(scores);
    renderTimeline(topKey);

    // 滚动到结果
    setTimeout(() => {
      $("resultPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  // ---------- 标签点击切换 ----------
  document.querySelectorAll(".tag-group").forEach(group => {
    group.addEventListener("click", (e) => {
      if (e.target.classList.contains("tag")) {
        e.target.classList.toggle("active");
      }
    });
  });

  // ---------- 绑定按钮 ----------
  $("analyzeBtn").addEventListener("click", analyze);

  // 默认执行一次（用预填值）
  analyze();
})();
