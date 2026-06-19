// Live2D 控制層。對外暴露 window.L2D：
//   init(canvas, modelUrl) 初始化 PIXI + 載入指定（或預設）角色
//   loadModel(url)         換角色（指向另一個 *.model3.json）
//   setSpeaking(bool)      講話狀態（做嘴型）
//   playMotion(group)      播放動作群組（如 'TapBody'）
//   setOnTap(fn)           點擊角色時的回呼（renderer 用來顯示/唸台詞）
//   視線跟隨：靠 pixi-live2d-display 內建 autoInteract（游標移動自動 focus）
window.L2D = (function () {
  let app = null;
  let model = null;
  let speaking = false;
  let onTapCb = null;
  let emoParams = null;   // 無表情檔時的標準參數覆寫
  let emoUntil = 0;       // 覆寫到期時間（ms）
  const EMO_HOLD_MS = 6000;
  const MOUTH = 'ParamMouthOpenY';
  const DEFAULT_MODEL = '/assets/live2d/hiyori/Hiyori.model3.json';

  async function init(canvas, modelUrl) {
    if (!window.PIXI || !window.PIXI.live2d) {
      console.error('[L2D] PIXI 或 pixi-live2d-display 尚未載入');
      return false;
    }
    app = new PIXI.Application({
      view: canvas,
      resizeTo: canvas.parentElement,
      backgroundAlpha: 0, // 透明背景：角色浮在桌面上
      antialias: true,
      autoStart: true,
      sharedTicker: true
    });

    setupCanvasInteraction();

    try {
      await loadModel(modelUrl || DEFAULT_MODEL);
    } catch (e) {
      console.error('[L2D] 模型載入失敗', e);
      return false;
    }

    // 嘴型更新放在最低優先度，盡量在模型更新後覆寫
    app.ticker.add(tickMouth, null, PIXI.UPDATE_PRIORITY.LOW);
    app.ticker.add(tickEmotion, null, PIXI.UPDATE_PRIORITY.LOW);
    window.addEventListener('resize', fit);
    return true;
  }

  async function loadModel(url) {
    const next = await PIXI.live2d.Live2DModel.from(url);
    if (model) {
      app.stage.removeChild(model);
      try { model.destroy(); } catch (_e) {}
    }
    model = next;
    app.stage.addChild(model);
    setupInteraction();
    fit();
    return true;
  }

  function fit() {
    if (!app || !model) return;
    model.scale.set(1);
    const s = (app.renderer.height * 0.92) / model.height;
    model.scale.set(s);
    if (model.anchor) model.anchor.set(0.5, 1.0);
    model.x = app.renderer.width / 2;
    model.y = app.renderer.height;
  }

  // 視線/點擊互動：直接在 canvas 綁 DOM 事件（不依賴 pixi InteractionManager 註冊狀態，較穩）
  function setupCanvasInteraction() {
    if (!app || !app.view || app.view.__l2dBound) return;
    const canvas = app.view;
    canvas.__l2dBound = true;
    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener('pointermove', (e) => {
      if (!model) return;
      const p = toLocal(e);
      try { model.focus(p.x, p.y); } catch (_e) {}            // 視線跟隨游標
    });
    canvas.addEventListener('pointerdown', (e) => {
      if (!model) return;
      const p = toLocal(e);
      let areas = [];
      try { areas = (model.hitTest && model.hitTest(p.x, p.y)) || []; } catch (_e) {}
      let inBounds = false;
      try {
        const b = model.getBounds();
        inBounds = p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
      } catch (_e) {}
      if (areas.length || inBounds) handleHit(areas);          // 點到角色(命中區或外框內)就回應
    });
  }

  function setupInteraction() {
    if (!model) return;
    try { model.autoInteract = false; } catch (_e) {}          // 改由上面的 DOM 事件統一處理
  }

  // 依模型實際擁有的 motion 群組挑一個『點擊用』動作（跨模型穩健、無則略過）
  function tapGroup() {
    try {
      const defs = (model.internalModel && model.internalModel.settings && model.internalModel.settings.motions) || {};
      const groups = Object.keys(defs);
      return groups.find((g) => /tap|flick|touch|body/i.test(g))
          || groups.find((g) => !/idle/i.test(g))
          || groups[0] || null;
    } catch (_e) { return null; }
  }

  function handleHit(areas) {
    const g = tapGroup();
    if (g) { try { model.motion(g); } catch (_e) {} }
    if (typeof onTapCb === 'function') { try { onTapCb(areas || []); } catch (_e) {} }
  }

  function playMotion(group) {
    try { if (model) model.motion(group); } catch (_e) {}
  }

  // 情緒：六種 → 表情檔名（有表情檔時用）／標準參數配方（無表情檔時用）
  const EMO_EXP = { '開心': 'Smile', '難過': 'Sad', '生氣': 'Angry', '驚訝': 'Surprised', '害羞': 'Blushing', '一般': 'Normal' };
  const EMO_PARAMS = {
    '開心': { ParamMouthForm: 1, ParamEyeLSmile: 1, ParamEyeRSmile: 1 },
    '難過': { ParamMouthForm: -1, ParamBrowLY: -0.6, ParamBrowRY: -0.6, ParamBrowLForm: -0.5, ParamBrowRForm: -0.5 },
    '生氣': { ParamBrowLForm: -1, ParamBrowRForm: -1, ParamBrowLY: -0.5, ParamBrowRY: -0.5, ParamMouthForm: -0.4 },
    '驚訝': { ParamBrowLY: 1, ParamBrowRY: 1, ParamEyeLOpen: 1, ParamEyeROpen: 1, ParamMouthForm: 0 },
    '害羞': { ParamCheek: 1, ParamEyeLSmile: 0.4, ParamEyeRSmile: 0.4, ParamMouthForm: 0.4 },
    '一般': {}
  };

  function hasExpressions() {
    try {
      const e = model.internalModel.settings.expressions;
      return Array.isArray(e) && e.length > 0;
    } catch (_e) { return false; }
  }

  // 設定情緒：有表情檔→用美術手調表情（持久漂亮）；無→設標準參數撐幾秒
  function setEmotion(emo) {
    if (!model) return;
    if (hasExpressions()) {
      emoParams = null; emoUntil = 0;
      const name = EMO_EXP[emo];
      try { if (name) model.expression(name); } catch (_e) {}
      return;
    }
    const recipe = EMO_PARAMS[emo];
    if (!recipe || Object.keys(recipe).length === 0) { emoParams = null; emoUntil = 0; return; }
    emoParams = recipe;
    emoUntil = performance.now() + EMO_HOLD_MS;
  }

  function tickEmotion() {
    if (!model || !model.internalModel || !emoParams) return;
    if (performance.now() > emoUntil) { emoParams = null; return; }
    const core = model.internalModel.coreModel;
    for (const id in emoParams) {
      try { core.setParameterValueById(id, emoParams[id]); } catch (_e) {}
    }
  }

  function tickMouth() {
    if (!model || !model.internalModel) return;
    let v = 0;
    if (speaking) {
      v = Math.min(1, Math.abs(Math.sin(performance.now() / 90)) * (0.4 + Math.random() * 0.5));
    }
    try {
      model.internalModel.coreModel.setParameterValueById(MOUTH, v);
    } catch (_e) {}
  }

  function setSpeaking(on) {
    speaking = !!on;
    if (on) playMotion('TapBody');
  }

  return { init, loadModel, setSpeaking, playMotion, setOnTap: (fn) => { onTapCb = fn; }, setEmotion };
})();
