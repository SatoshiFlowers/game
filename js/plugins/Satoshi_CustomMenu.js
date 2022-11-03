//=============================================================================
// Satoshi_CustomMenu
// Satoshi_CustomMenu.js
//=============================================================================


//=============================================================================
/*:
* @target MZ
* @plugindesc Manage the Stamina Bar
* @author Mouradif
* @url https://satoshiflowers.art
*
* @help
* ============================================================================
* Created a plugin command to connect discord
* ============================================================================
*
* @param varId
* @text Variable ID
* @desc The ID of the variable where to store the stamina
* @type number
*
* @command showStamina
* @text Show Stamina
*
* @command hideStamina
* @text HideStamina
*/


(async function() {
  Window_Selectable.prototype.drawBackgroundRect = () => {};
  Scene_Map.prototype.createButtons = function() {};
  Scene_MenuBase.prototype.createButtons = function() {};

  const pluginName = 'Satoshi_CustomMenu';
  const $thisPlugin = this.$plugins.find(p => p.name === pluginName);
  const $web3Plugin = this.$plugins.find(p => p.name === 'Web3');
  const $discordPlugin = this.$plugins.find(p => p.name === 'Discord_Connect');
  const discordLocalStorageKey = $discordPlugin.parameters.varName;

  // -------------
  // Sprite_Gold

  function Sprite_Gold() {
    this.initialize(...arguments);
  }

  Sprite_Gold.prototype = Object.create(Sprite.prototype);
  Sprite_Gold.prototype.constructor = Sprite_Gold;

  Sprite_Gold.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.bitmap = new Bitmap(120, 64);
    this.redraw();
  }

  Sprite_Gold.prototype.destroy = function(options) {
    this.bitmap.destroy();
    Sprite.prototype.destroy.call(this, options);
  }

  Sprite_Gold.prototype.setup = function() {
    this._value = this.currentValue()
  }

  Sprite_Gold.prototype.currentValue = function() {
    return $gameParty._gold;
  }

  Sprite_Gold.prototype.setupLabelFont = function() {
    this.bitmap.fontFace = $gameSystem.mainFontFace();
    this.bitmap.fontSize = $gameSystem.mainFontSize() - 1;
    this.bitmap.textColor = ColorManager.systemColor();
    this.bitmap.outlineColor = ColorManager.outlineColor();
    this.bitmap.outlineWidth = 3;
  };

  Sprite_Gold.prototype.drawAmount = function() {
    const x = 30;
    const y = 3;
    const width = 320;
    const height = 24;
    this.setupLabelFont();
    this.bitmap.drawText(this.currentValue().toString(), x, y, width, height, "left");
  }

  Sprite_Gold.prototype.drawGoldIcon = function() {
    const icon = ImageManager.loadSystem("IconSet");
    this.bitmap.blt(
      icon,
      ImageManager.iconWidth * 15,
      0,
      ImageManager.iconWidth,
      ImageManager.iconHeight,
      0,
      0
    );
  }

  Sprite_Gold.prototype.redraw = function() {
    this.bitmap.clear();
    this.drawGoldIcon();
    this.drawAmount();
  };

  // -------------
  // Sprite_StaminaGauche

  function Sprite_StaminaGauge() {
    this.initialize(...arguments);
  }

  Sprite_StaminaGauge.prototype = Object.create(Sprite.prototype);
  Sprite_StaminaGauge.prototype.constructor = Sprite_StaminaGauge;

  Sprite_StaminaGauge.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this._value = 0;
    this.bitmap = new Bitmap(320, 64);
    this.redraw();
  };

  Sprite_StaminaGauge.prototype.label = () => "Stamina";

  Sprite_StaminaGauge.prototype.destroy = function(options) {
    this.bitmap.destroy();
    Sprite.prototype.destroy.call(this, options);
  };

  Sprite_StaminaGauge.prototype.setup = function() {
    this._value = this.currentValue();
    this._maxValue = 100;
  };

  Sprite_StaminaGauge.prototype.currentValue = function() {
    return $gameVariables.value($thisPlugin.parameters.varId)
  };

  Sprite_StaminaGauge.prototype.redraw = function() {
    this.bitmap.clear();
    this.drawGauge();
    this.drawLabel();
  };

  Sprite_StaminaGauge.prototype.drawGauge = function() {
    const gaugeX = this.measureLabelWidth() + 10;
    const gaugeY = 3;
    const gaugewidth = 320 - gaugeX - 5;
    const gaugeHeight = 64;
    this.drawGaugeRect(gaugeX, gaugeY, gaugewidth, gaugeHeight);
  };

  Sprite_StaminaGauge.prototype.drawGaugeRect = function(x, y, width, height) {
    const rate = this.gaugeRate();
    const fillW = Math.floor((width - 2) * rate);
    const fillH = height - 2;
    const color0 = ColorManager.textColor(2);
    const color1 = ColorManager.textColor(10);
    const color2 = ColorManager.textColor(9);
    this.bitmap.fillRect(x, y, width, height, color0);
    this.bitmap.gradientFillRect(x + 1, y + 1, fillW, fillH, color1, color2);
  };

  Sprite_StaminaGauge.prototype.gaugeRate = function() {
    const value = this.currentValue();
    const maxValue = 100;
    return maxValue > 0 ? value / maxValue : 0;
  };

  Sprite_StaminaGauge.prototype.drawLabel = function() {
    const x = 0;
    const y = 7;
    const width = 320;
    const height = 24;
    this.setupLabelFont();
    this.bitmap.drawText(this.label(), x, y, width, height, "left");
  };

  Sprite_StaminaGauge.prototype.setupLabelFont = function() {
    this.bitmap.fontFace = $gameSystem.mainFontFace();
    this.bitmap.fontSize = $gameSystem.mainFontSize() - 1;
    this.bitmap.textColor = ColorManager.systemColor();
    this.bitmap.outlineColor = ColorManager.outlineColor();
    this.bitmap.outlineWidth = 3;
  };

  Sprite_StaminaGauge.prototype.measureLabelWidth = function() {
    this.setupLabelFont();
    return this.bitmap.measureTextWidth(this.label())
  };

  // ----------------
  // Window_Status

  function Window_Status() {
    this.initialize(...arguments);
  }

  Window_Status.prototype = Object.create(Window_StatusBase.prototype);
  Window_Status.prototype.constructor = Window_Status;

  Window_Status.prototype.initialize = function() {
    Window_StatusBase.prototype.initialize.call(this, new Rectangle(0, 0, 1016, 64));
    this.refresh();
  };

  Window_Status.prototype.refresh = function() {
    this.contents.clear();
    this.drawStamina();
    this.drawGold();
  };

  Window_Status.prototype.drawStamina = function() {
    this.gauge = this.createInnerSprite("stamina-bar", Sprite_StaminaGauge);
    this.gauge.setup();
    this.gauge.move(3, 3);
    this.gauge.show();
  }

  Window_Status.prototype.drawGold = function() {
    this.gold = this.createInnerSprite("gold-icon", Sprite_Gold);
    this.gold.setup();
    this.gold.move(850, 5);
    this.gold.show();
  }

  Window_Status.prototype.open = function() {
    this.refresh();
    Window_StatusBase.prototype.open.call(this);
  };

  // -----------------
  // Window_ItemList

  function Window_ItemsList(scene) {
    this.initialize(...arguments);
  }

  Window_ItemsList.prototype = Object.create(Window_Selectable);
  Window_ItemsList.prototype.constructor = Window_ItemsList;

  Window_ItemsList.prototype.initialize = function(scene) {
    this._scene = scene;
    Window_Selectable.prototype.initialize.call(this, new Rectangle(0, 70, 250, 690));
  }

  function Window_SatoshiMenu(scene) {
    this.initialize(...arguments);
  }

  Window_SatoshiMenu.prototype = Object.create(Window_Command.prototype);
  Window_SatoshiMenu.prototype.constructor = Window_SatoshiMenu;

  Window_SatoshiMenu.prototype.initialize = function(scene) {
    this._list = [];
    this._scene = scene;
    Window_Command.prototype.initialize.call(this, new Rectangle(0, 70, 250, 690));

  }

  Window_SatoshiMenu.prototype.makeCommandList = function() {
    this.addCommand("Items", "items", true);
    this.addCommand("Tools", "tools", true);
    this.addCommand("Status", "status", true);
    this.addCommand("Quests", "quests", true);
  }

  Window_SatoshiMenu.prototype.callOkHandler = function() {
    Window_Command.prototype.callOkHandler.call(this);
  }

  Window_SatoshiMenu.prototype.cursorUp = function() {
    Window_Selectable.prototype.cursorUp.call(this);
  }

  Window_SatoshiMenu.prototype.cursorDown = function() {
    Window_Selectable.prototype.cursorDown.call(this);
  }

  Scene_Menu.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._staminaWindow = new Window_Status();
    this._menuWindow = new Window_SatoshiMenu(this);
    // this._itemsWindow = new Window_ItemsList(this);
    // this._toolsWindow = new Window_ToolsList(this);
    // this._flowersWindow = new Window_FlowersList(this);
    // this._questsWindow = new Window_QuestsList(this);
    this.addWindow(this._staminaWindow);
    this.addWindow(this._menuWindow);
    // this.addWindow(this._itemsWindow);
  }

  Scene_Menu.prototype.start = function () {
    Scene_MenuBase.prototype.start.call(this);
  }

  Scene_Menu.prototype.update = function () {
    Scene_MenuBase.prototype.update.call(this);
    this._staminaWindow.refresh();
    if (Input.isTriggered("escape")) {
      SoundManager.playCancel();
      this.popScene();
    }
  }

  PluginManager.registerCommand(pluginName, 'showStamina', () => {
    if (this._staminaOverlay !== undefined) return;
    this._staminaOverlay = new Window_Status();
    SceneManager._scene.addWindow(this._staminaOverlay);
  });

  PluginManager.registerCommand(pluginName, 'hideStamina', () => {
    if (this._staminaOverlay === null) return;
    SceneManager._scene._windowLayer.removeChild(this._staminaOverlay);
    this._staminaOverlay = undefined;
  });

  PluginManager.registerCommand(pluginName, 'update', () => {
    $
  })


})().catch(e => {
  console.log('Could not load Stamina');
  console.error(e);
});
