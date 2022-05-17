//=============================================================================
// Discord_Connect
// Discord_Connect.js
//=============================================================================


//=============================================================================
/*:
* @target MZ
* @plugindesc [RPG Maker MZ] [DiscordConnect] [up]
* @author Mouradif
* @url https://satoshiflowers.art
*
* @help
* ============================================================================
* Created a plugin command to connect discord
* ============================================================================
*
* @param varName
* @text Variable Name
* @desc The name of the Local Storage variable that stores the token
* @type string
*
* @command check
* @text Check
* @desc Check Connection
*
* @arg switchId
* @text Switch ID
* @type number
* @desc Switch in witch to store the result
* @default 1
*
* @command connect
* @text Connect
* @desc Connect Discord
*
* @command serverCheck
* @text Check Server Status
* @desc Checks if the server is open
*
* @arg varId
* @text Variable ID
* @type number
* @desc Variable in which to store the server status
* @default 23
*
* @command membershipCheck
* @text Check Membership
* @desc Checks if the connected user is in the guild
*
* @arg varId
* @text Variable ID
* @type number
* @desc Variable in which to store the server status
* @default 24
*
*/
(function() {
  const pluginName = 'Discord_Connect';
  const $thisPlugin = this.$plugins.find(p => p.name === pluginName);
  const localStorageKey = $thisPlugin.parameters.varName;

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  if (typeof params.code === 'string') {
    fetch(`/auth/${params.code}`).then(res => res.json()).then(data => {
      if (data.id && data.username && data.discriminator)
        localStorage.setItem(localStorageKey, JSON.stringify(data));
    }).then(() => {
      window.location.replace('/');
    });
  }

  PluginManager.registerCommand(pluginName, 'check', args => {
    const token = localStorage.getItem(localStorageKey);
    try {
      const data = JSON.parse(token);
      $gameSwitches.setValue(args.switchId, true);
      $gameActors.actor(2).setName([data.username, data.discriminator].join('#'));
    } catch (e) {
      $gameSwitches.setValue(args.switchId, false);
    }
  });

  PluginManager.registerCommand(pluginName, 'serverCheck', async (args) => {
    const token = localStorage.getItem(localStorageKey);
    try {
      const data = JSON.parse(token);
      const response = await fetch(`/status/${data.token}`);
      const json = await response.json();
      if (json.status === 300) {
        localStorage.removeItem(localStorageKey);
        window.location.replace('/');
      } else {
        $gameVariables.setValue(args.varId, json.status);
      }
    } catch (e) {
      $gameVariables.setValue(args.varId, 500);
    }
  });

  PluginManager.registerCommand(pluginName, 'membershipCheck', async (args) => {
    const token = localStorage.getItem(localStorageKey);
    try {
      const data = JSON.parse(token);
      const response = await fetch(`/member/${data.token}`);
      const json = await response.json();
      $gameVariables.setValue(args.varId, json.status);
    } catch (e) {
      $gameSwitches.setValue(args.varId, 500);
    }
  });

  PluginManager.registerCommand(pluginName, 'connect', () => {
    window.location.replace('/auth/new');
  });
})();
