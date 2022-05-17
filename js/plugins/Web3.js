//=============================================================================
// Web3
// Web3.js
//=============================================================================


//=============================================================================
/*:
* @target MZ
* @plugindesc Web3 for RPGMaker \o/ !
* @author mouradif.eth
* @url https://github.com/Mouradif
*
* @help
* ============================================================================
* Adds commands to interact with a Web3 Provider (like Metamask)
* ============================================================================
*
* @param ethStatusVariable
* @text Ethereum Status Variable ID
* @desc ID of the variable where the Ethereum Status should be stored (0 = pending 200 = OK, Anything else = error)
* @type number
*
* @command login
* @text Login
* @desc Login with Ethereum wallet
*
* @command sign
* @text Sign
* @desc Sign a message with your Ethereum wallet
*
* @arg msg
* @text Message
* @type multiline_string
* @desc The message to sign
**/

(function() {
  const pluginName = 'Web3';
  const $thisPlugin = this.$plugins.find(p => p.name === pluginName);

  const $discordPlugin = this.$plugins.find(p => p.name === 'Discord_Connect');
  const localStorageKey = $discordPlugin.parameters.varName;

  function ethereumLogin() {
    $gameVariables.setValue($thisPlugin.parameters.ethStatusVariable, 0);
    if (typeof window.ethereum === 'undefined') {
      $gameVariables.setValue($thisPlugin.parameters.ethStatusVariable, 404);
      return;
    }
    return window.ethereum.request({ method: 'eth_requestAccounts' }).then((addresses) => {
      if (addresses.length === 0) {
        $gameVariables.setValue($thisPlugin.parameters.ethStatusVariable, 403);
        return;
      }
      window._shatteredRealmsAddress = addresses[0];
      $gameVariables.setValue($thisPlugin.parameters.ethStatusVariable, 200);
      $gameActors.actor(3).setName(addresses[0]);
    }).then(() =>
      new Promise(resolve => setTimeout(resolve, 1500))
    ).then(() => window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{
        chainId: '0x1'
      }] })).catch((e) => {
      console.error(e);
      $gameVariables.setValue($thisPlugin.parameters.ethStatusVariable, 500);
    });
  }

  PluginManager.registerCommand(pluginName, 'login', (args) => {
    ethereumLogin();
  });

  PluginManager.registerCommand(pluginName, 'sign', async (args) => {
    $gameVariables.setValue($thisPlugin.parameters.ethStatusVariable, 0);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const signature = await signer.signMessage(args.msg);
      const response = await fetch('/sign', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          message: args.msg,
          token: JSON.parse(localStorage.getItem(localStorageKey)).token,
          signature
        })
      }).catch(e => {
        console.log('CATCH');
        console.log(e);
      });
      const json = await response.json();
      if (json.success) {
        $gameVariables.setValue($thisPlugin.parameters.ethStatusVariable, 200);
      } else {
        $gameVariables.setValue($thisPlugin.parameters.ethStatusVariable, 500);
      }
    } catch (e) {
      console.log(e.message);
      $gameVariables.setValue($thisPlugin.parameters.ethStatusVariable, 500);
    }
  })
})();
