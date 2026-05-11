# 上线与绑定域名（域名在 Cloudflare 时）

**你的主域名**：`lumigzs.com`（DNS 托管在 Cloudflare）

本站为**纯静态文件**。域名已在 Cloudflare 购买时，用 **Cloudflare Pages** 托管最顺：DNS 与证书多在同一面板里自动完成。

---

## 一、准备代码（GitHub）

1. 在 GitHub 新建一个仓库（例如 `project-x-dex-site`）。
2. 把本目录里的站点文件全部 push 上去（至少包含：`index.html`、`kpi.html`、`app.js`、`styles.css`、`data.json`、`kpi-details.json`、`vercel.json` 可选）。
3. 若仓库**根目录就是本站**：下面「构建输出目录」用 `/`。  
   若本站只是大仓库里的子文件夹：记下路径，例如 `project-x-dex-site`，下面填这个目录名。

---

## 二、创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → 左侧 **Workers & Pages**。
2. **Create application** → 选 **Pages** → **Connect to Git** → 授权 GitHub → 选中你的仓库。
3. **Set up builds and deployments**：
   - **Framework preset**：`None`（或 Plain HTML）。
   - **Build command**：留空；若界面必填，可填 `exit 0`（纯静态、无需构建）。
   - **Build output directory**：
     - 仓库根就是站点 → 填 `/` 或 `.`（以 Cloudflare 界面说明为准，有的写 `/`）。
     - 站点在子目录 → 填 `project-x-dex-site`（与你的实际路径一致）。
4. **Save and Deploy**。首次部署完成后会得到 `https://<项目名>.pages.dev`。

---

## 三、绑定域名：只用子域名（lumigzs.com）

在 **Custom domains** 里添加**完整子域名**，任选其一即可（前缀可自定，以下为示例）：

| 用途示例 | 在 Pages 里填写的 Custom domain |
|----------|----------------------------------|
| DEX 数据站 | `dex.lumigzs.com` |
| 短一点 | `x.lumigzs.com` |
| 数据 / 看板感 | `data.lumigzs.com` |

1. Pages 项目 → **Custom domains** → **Set up a custom domain**。
2. 输入例如 **`dex.lumigzs.com`**，不要只填 `lumigzs.com`（根域名）。
3. 在 **Websites → lumigzs.com → DNS → Records** 中，按 Pages 提示**自动创建**或核对一条 **CNAME**：**Name** = `dex`（仅前缀），**Target** = Cloudflare 给出的目标（常见为 `xxx.pages.dev`，以界面为准）。
4. 等证书就绪后访问 **`https://dex.lumigzs.com`**（换成你实际添加的子域名）。根域名 **`https://lumigzs.com`** 不必指向本站。

**说明**：本仓库多为相对路径（如 `./kpi.html`），挂在子域名下**一般不用改代码**。

**若还要 `www.lumigzs.com`**：可作为第二个 Custom domain 单独添加；与 `dex.lumigzs.com` 是两条不同站点入口，按需二选一或都做跳转规则即可。

---

## 四、确认 DNS 区域

- Dashboard → **Websites** → **lumigzs.com** → **DNS** → **Records**。  
  绑定 Pages 后应出现类型为 **CNAME**（或 Pages 要求的记录）指向 `*.pages.dev` 一类目标；若你手动添加，以 Pages 自定义域名页面上的说明为准。

---

## 五、不想接 Git 时（本地上传）

在已安装 [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) 的前提下，在本目录执行：

```bash
npx wrangler pages deploy . --project-name=你的项目名
```

之后在 Dashboard 里同样到 **Custom domains** 绑定域名即可。

---

## 六、更新数据

- `data.json`：本地跑 `python3 build-data.py` 后 commit + push，Pages 会自动重新部署。
- `kpi-details.json`：可定期执行  
  `curl -sS 'https://flux.megaeth.com/api/kpi/details' -o kpi-details.json`  
  再提交推送。

---

## 七、其他说明

- `kpi.html` 会请求 Flux 官方接口；若浏览器 CORS 失败，会回退到同目录的 `kpi-details.json`。
- 不要把 API Key、私钥写进仓库或前端。

---

## 备选：Vercel / GitHub Pages

若你更想用 Vercel 或 GitHub Pages，流程仍可行；域名 DNS 在 Cloudflare 时，只需在 **DNS → Records** 里按对应平台文档添加 **CNAME** 或 **A** 记录即可。
