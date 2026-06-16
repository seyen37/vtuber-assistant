# Live2D 角色授權須知（重要）

本專案內附的 **Hiyori** 範例模型來自 Live2D 官方
[CubismWebSamples](https://github.com/Live2D/CubismWebSamples)，僅作為**示範用途**。

- Live2D 的範例模型與 Cubism Core（`assets/vendor/live2dcubismcore.min.js`）
  受 **Live2D 自家授權條款** 規範，**不適用本專案的 MIT 授權**。
- 範例模型一般僅供個人 / 學習 / 非商業展示。**商業使用前請務必自行確認並取得授權**：
  - Cubism SDK Release License: https://www.live2d.com/en/sdk/license/
  - Free Material License（免費素材）: https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html

## 商用怎麼辦？換成你自己的角色

本程式的角色是「可抽換」的。要換角色，把你的 Cubism 模型整包放到
`assets/live2d/<你的角色>/`，然後把 `src/renderer/live2d.js` 裡的

```js
const DEFAULT_MODEL = '/assets/live2d/hiyori/Hiyori.model3.json';
```

改成你的 `*.model3.json` 路徑即可。

可用來源：
- VRoid 匯出 → 轉 Cubism / 或改用 3D 載入（後續可擴充）
- 自行用 Live2D Cubism Editor 製作並取得商用授權的模型
- 其他明確標示可商用的 Live2D 模型
