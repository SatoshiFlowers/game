//=============================================================================
// Satoshi_AnchorEvent
// Satoshi_AnchorEvent.js
//=============================================================================


//=============================================================================
/*:
* @target MZ
* @plugindesc Position events with custom x/y anchor
* @author Mouradif
* @url https://satoshiflowers.art
*
* @help
* ============================================================================
* Position events by the pixel
*
* Add a note to an event:
* <AnchorX: 0.4><AnchorY: 0.9>
* ============================================================================
*/

const noteRegexp = /<([^\s]+):\s*([^\s]+)>/;

function parseNote(note) {
  let obj = null;
  const matches = note.trim().match(/<([^\s]+):\s*([^\s]+)>/g);
  if (matches === null) return null;
  for (const match of matches) {
    const details = match.match(noteRegexp);
    if (details === null) continue;
    if (obj === null) {
      obj = {};
    }
    obj[details[1]] = details[2];
  }
  return obj;
}

SpriteCharacer_init = Sprite_Character.prototype.initialize;
Sprite_Character.prototype.initialize = function(character) {
  SpriteCharacer_init.call(this, character);
  if (!this._character) return;
  const event = $dataMap.events[this._character._eventId];
  if (!event) return;
  const notes = parseNote(event.note);
  if (!notes) return;
  const anchorX = parseFloat(notes.AnchorX) || 0;
  const anchorY = parseFloat(notes.AnchorY) || 0;
  this._anchor.x += anchorX;
  this._anchor.y += anchorY;
};

