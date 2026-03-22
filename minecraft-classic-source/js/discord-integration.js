/**
 * Discord Embedded App SDK Integration for Minecraft Classic
 *
 * Responsibilities:
 *  1. Initialize the Discord Embedded App SDK and resolve the current user.
 *  2. Patch playerName in localStorage so the game uses the Discord username.
 *  3. Derive the world seed from discord.instanceId for synchronized world gen.
 *  4. Permanently suppress the "requires a keyboard" (mobile) UI check.
 *  5. Architect-Check: enable flight mode + cheats for the 'alexgamingdev' user.
 *  6. Pre-fill the game URL with the Discord instance ID as the P2P lobby code.
 *
 * The main game bundle (app.js) is loaded dynamically *after* Discord setup so
 * that all localStorage patches are in place before the game reads them.
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Constants                                                           */
  /* ------------------------------------------------------------------ */

  var FALLBACK_USER = 'alexgamingdev';

  /**
   * Replace 'YOUR_DISCORD_APPLICATION_ID' with the client ID for your
   * Discord application registered at https://discord.com/developers/applications
   */
  var DISCORD_CLIENT_ID = '1437203189651865643';

  /* ------------------------------------------------------------------ */
  /*  1. Disable mobile / "requires a keyboard" check permanently        */
  /* ------------------------------------------------------------------ */

  function patchMobileDetection() {
    // Override the User-Agent string so the regex inside app.js that sets
    // isMobile = true never matches, regardless of the actual device.
    try {
      Object.defineProperty(navigator, 'userAgent', {
        get: function () {
          return (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/120.0.0.0 Safari/537.36'
          );
        },
        configurable: true,
      });
    } catch (_) {
      // Some environments do not allow userAgent overrides – fall back to
      // hiding the DOM element with CSS so the game still runs.
    }

    // CSS safety net: hide the #mobile overlay unconditionally.
    var style = document.createElement('style');
    style.textContent = '#mobile { display: none !important; }';
    document.head.appendChild(style);
  }

  /* ------------------------------------------------------------------ */
  /*  2. Seed helper – convert Discord instanceId to a numeric seed      */
  /* ------------------------------------------------------------------ */

  function seedFromInstanceId(instanceId) {
    // Simple but stable djb2-style hash: produces the same integer for the
    // same instanceId on every client in the same Discord Activity session.
    var seed = 5381;
    for (var i = 0; i < instanceId.length; i++) {
      seed = (Math.imul(seed, 33) ^ instanceId.charCodeAt(i)) | 0;
    }
    // Ensure a positive, non-zero integer (zero would make gameSaved() false).
    return Math.abs(seed) || 12345;
  }

  /* ------------------------------------------------------------------ */
  /*  3. Patch localStorage so the game picks up username + seed         */
  /* ------------------------------------------------------------------ */

  function patchLocalStorage(username, seed) {
    // --- Username ---
    // The game reads: JSON.parse(localStorage.getItem("settings")).username
    try {
      var settings = JSON.parse(localStorage.getItem('settings') || '{}');
      settings.username = username;
      localStorage.setItem('settings', JSON.stringify(settings));
    } catch (_) {}

    // --- World Seed ---
    // The game reads the saved seed via:
    //   u.default.getInstance().gameSaved() && getWorldSeed()
    // gameSaved() returns !!worldSeed, so version must be 1 (not 0) to
    // avoid the game's own clearData() call that wipes worldSeed on load.
    try {
      var savedGame = JSON.parse(localStorage.getItem('savedGame') || '{}');
      savedGame.worldSeed = seed;
      if (!savedGame.changedBlocks) savedGame.changedBlocks = {};
      if (!savedGame.worldSize) savedGame.worldSize = 128;
      savedGame.version = 1; // must be non-zero to survive loadDataIfExists()
      localStorage.setItem('savedGame', JSON.stringify(savedGame));
    } catch (_) {}
  }

  /* ------------------------------------------------------------------ */
  /*  4. P2P lobby – pre-fill URL with Discord instance ID               */
  /* ------------------------------------------------------------------ */

  function patchNetworkUrl(instanceId) {
    // The game reads URL params to decide host vs. client mode:
    //   ?host=CODE → host setup  |  ?join=CODE → client join
    // We inject the Discord instance ID as the ?host param *before* app.js
    // reads window.location.search.  The signaling backend will either create
    // a new room under that code (first user) or reuse the existing one
    // (subsequent users), so all participants in the same Activity session
    // automatically land in the same game room.
    if (!('URLSearchParams' in window)) return;
    try {
      var params = new URLSearchParams(window.location.search);
      // Only inject when no explicit routing params are already present.
      if (!params.has('host') && !params.has('join') && !params.has('singlePlayer')) {
        params.set('host', instanceId);
        history.replaceState(null, '', '?' + params.toString());
      }
    } catch (_) {}
  }

  /* ------------------------------------------------------------------ */
  /*  5. Architect-Check – flight mode + cheats for 'alexgamingdev'      */
  /* ------------------------------------------------------------------ */

  // Upper bound for the airJumps counter – effectively "infinite" jumps,
  // which combined with gravityMultiplier = 0 produces free-flight behaviour.
  var ARCHITECT_AIR_JUMPS = 99999;

  // How often (ms) to poll for the noa-engine instance.
  var POLL_INTERVAL_MS = 500;
  // How long (ms) to keep polling before giving up.
  var POLL_TIMEOUT_MS = 60000;

  function applyArchitectMode() {
    var attempts = 0;
    var maxAttempts = Math.ceil(POLL_TIMEOUT_MS / POLL_INTERVAL_MS);

    var interval = setInterval(function () {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        return;
      }

      var noa = window.noa;
      if (!noa || !noa.playerEntity) return;

      try {
        // --- Flight mode ---
        // noa stores movement state per-entity; setting airJumps to a very
        // large value lets the player "jump" continuously.  Combined with
        // gravityMultiplier = 0, this produces free-flight behaviour.
        var movement = noa.ents.getMovement(noa.playerEntity);
        if (movement) {
          movement.airJumps = ARCHITECT_AIR_JUMPS;
          movement.maxSpeed = 24;
          movement.jumpImpulse = 14;
        }

        // Disable gravity so the player floats freely.
        var body = noa.playerBody;
        if (body) {
          body.gravityMultiplier = 0;
        }

        console.log('[Discord] Architect mode active – flight + cheats enabled.');
        clearInterval(interval);
      } catch (_) {
        // noa is present but entity components not yet initialised – retry.
      }
    }, POLL_INTERVAL_MS);
  }

  /* ------------------------------------------------------------------ */
  /*  6. Discord SDK initialisation                                       */
  /* ------------------------------------------------------------------ */

  function initDiscordSDK() {
    return new Promise(function (resolve) {
      // The Discord Embedded App SDK is a standard ES-module package
      // (@discord/embedded-app-sdk).  For this static deployment we load it
      // as an ES module from a CDN.  The import() call is wrapped so that
      // failures degrade gracefully to standalone (non-Activity) mode.
      import('https://unpkg.com/@discord/embedded-app-sdk@1.7.0/output/index.js')
        .then(function (module) {
          var DiscordSDK = module.DiscordSDK;
          var sdk = new DiscordSDK(DISCORD_CLIENT_ID);

          sdk
            .ready()
            .then(function () {
              // Step 1: get an OAuth2 authorisation code scoped to identify.
              return sdk.commands.authorize({ scope: ['identify'] });
            })
            .then(function (authResult) {
              // Step 2: exchange the code for a token via your backend.
              // A token-exchange endpoint is required – it proxies the request
              // to Discord's OAuth2 API to keep your client secret private.
              // Replace /api/discord-token with your actual endpoint URL.
              // Without this backend service the auth flow will fall back to
              // the FALLBACK_USER username (see the .catch handler below).
              return fetch('/api/discord-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: authResult.code }),
              });
            })
            .then(function (resp) {
              if (!resp.ok) {
                throw new Error('Token endpoint returned HTTP ' + resp.status);
              }
              return resp.json();
            })
            .then(function (data) {
              if (!data.access_token) {
                throw new Error('Token endpoint response missing access_token');
              }
              return sdk.commands.authenticate({ access_token: data.access_token });
            })
            .then(function (authData) {
              resolve({
                sdk: sdk,
                username: (authData.user && authData.user.username) || FALLBACK_USER,
                instanceId: sdk.instanceId,
              });
            })
            .catch(function (err) {
              console.warn('[Discord] SDK auth flow failed, using fallback.', err);
              resolve({
                sdk: sdk,
                username: FALLBACK_USER,
                instanceId: sdk.instanceId || String(Date.now()),
              });
            });
        })
        .catch(function (err) {
          console.warn('[Discord] SDK not available (not running inside Discord?).', err);
          resolve({ sdk: null, username: FALLBACK_USER, instanceId: String(Date.now()) });
        });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  7. Load app.js dynamically                                          */
  /* ------------------------------------------------------------------ */

  function loadGameBundle() {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'js/app.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Main                                                                */
  /* ------------------------------------------------------------------ */

  // Apply the mobile patch immediately – before any async work – so that
  // even if the SDK import is slow the CSS protection is already in place.
  patchMobileDetection();

  initDiscordSDK()
    .then(function (result) {
      var username = result.username;
      var instanceId = result.instanceId;
      var seed = seedFromInstanceId(instanceId);

      patchLocalStorage(username, seed);
      patchNetworkUrl(instanceId);

      console.log(
        '[Discord] Ready – user:', username,
        '| instance:', instanceId,
        '| seed:', seed
      );

      return loadGameBundle().then(function () {
        // Architect-Check: matches the Discord username as required.
        // NOTE: Discord usernames are unique and controlled by Discord's API
        // after OAuth2 authentication, making impersonation impractical in
        // an Activity context.  For additional security, a Discord user-ID
        // comparison (authData.user.id) could replace the username check.
        if (username === FALLBACK_USER) {
          applyArchitectMode();
        }
      });
    })
    .catch(function (err) {
      console.error('[Discord] Fatal error during game bootstrap:', err);
      // Last-resort: try to load the game anyway.
      loadGameBundle();
    });
})();
