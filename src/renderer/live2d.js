// Live2D 控制層。對外暴露 window.L2D：
//   init(canvas, modelUrl) 初始化 PIXI + 載入指定（或預設）角色
//   loadModel(url)         換角色（指向另一個 *.model3.json）
//   setSpeaking(bool)      講話狀態（做嘴型）
//   playMotion(group)      播放動作群組（如 'TapBody'）
window.L2D = (function () {
  let app = null;
  let model = null;
  let speaking = false;
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

    try {
      await loadModel(modelUrl || DEFAULT_MODEL);
    } catch (e) {
      console.error('[L2D] 模型載入失敗', e);
      return false;
    }

    // 嘴型更新放在最低優先度，盡量在模型更新後覆寫
    app.ticker.add(tickMouth, null, PIXI.UPDATE_PRIORITY.LOW);
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

  function playMotion(group) {
    try { if (model) model.motion(group); } catch (_e) {}
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

  return { init, loadModel, setSpeaking, playMotion };
})();
