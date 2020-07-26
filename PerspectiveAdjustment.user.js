// ==UserScript==
// @name         Perspective Adjustment
// @namespace    p1
// @run-at       document-start
// @version      0.3
// @updateURL    https://github.com/p1-BCMC/PerspectiveAdjustment/raw/master/PerspectiveAdjustment.user.js
// @downloadURL  https://github.com/p1-BCMC/PerspectiveAdjustment/raw/master/PerspectiveAdjustment.user.js
// @description  Adding perspective to Box Critters! Adjusts the size of all players depending on how far away they are in a room.
// @author       p1
// @match        https://boxcritters.com/play/
// @match        https://boxcritters.com/play/?*
// @match        https://boxcritters.com/play/#*
// @match        https://boxcritters.com/play/index.html
// @match        https://boxcritters.com/play/index.html?*
// @match        https://boxcritters.com/play/index.html#*
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    let timer = setInterval(function() {
		if (typeof world !== "undefined" && typeof world.stage !== "undefined" && typeof world.stage.room !== "undefined") {
			clearInterval(timer);
			onWorldLoaded();
		}
	}, 1000/60);

	function onWorldLoaded() {
		var scaleNear = 1.225;
		var scaleFar = 0.775;
		var movementDistanceForScaleChange = 3; /* in ingame units */
		var updateInterval = movementDistanceForScaleChange * 5; /* critters move 200 units/s ; and in ms*/
		var currentlyMovingPlayerIds = [];

		function updateScale(playerId) {
			let player = world.stage.room.getPlayer(playerId);
			player.scale = scaleFar + (scaleNear - scaleFar) * player.y / world.stage.room.height;
		};

		function checkPlayer(playerId) {
			let player = world.stage.room.getPlayer(playerId);
			if (player.x != player.targetX || player.y != player.targetY) {
				currentlyMovingPlayerIds.push(playerId);
			};
		};

		function checkAllPlayers() {
			if (world.stage.room.getPlayer(world.player.playerId) == undefined) {
				setTimeout(function() {checkAllPlayers()}, 1000/60);
			} else {
				currentlyMovingPlayerIds = [];
				world.room.playerCrumbs.forEach(playerCrumb => {checkPlayer(playerCrumb.i); updateScale(playerCrumb.i);});
				if (currentlyMovingPlayerIds.length > 0) {
					setTimeout(function() {updateScalesScheduler();}, updateInterval);
				};
			};
		};

		function updatePlayer(playerId) {
			let player = world.stage.room.getPlayer(playerId);
			player.scale = scaleFar + (scaleNear - scaleFar) * player.y / world.stage.room.height;
			if (player.x == player.targetX && player.y == player.targetY) {
				currentlyMovingPlayerIds.splice(currentlyMovingPlayerIds.indexOf(playerId), 1);
			};
		};

		function updateScalesScheduler() {
			currentlyMovingPlayerIds.forEach(playerId => {updatePlayer(playerId)});
			if (currentlyMovingPlayerIds.length > 0) {
				setTimeout(function() {updateScalesScheduler();}, updateInterval);
			};
		};

		world.on("joinRoom", function () {
			currentlyMovingPlayerIds = [];
			checkAllPlayers();
		});

		world.on("login", function () {
			checkAllPlayers();
		});

		world.on("A", function (playerJoinEvent) {
			let player = world.stage.room.getPlayer(playerJoinEvent.i);
			player.scale = scaleFar + (scaleNear - scaleFar) * player.y / world.stage.room.height;
		});

		world.on("X", function (playerMoveEvent) {
			let wasAlreadyMoving = false; /* necessary if player clicks again before reaching target */
			if (currentlyMovingPlayerIds.indexOf(playerMoveEvent.i) == -1) {
				currentlyMovingPlayerIds.push(playerMoveEvent.i);
			} else {
				wasAlreadyMoving = true;
			};
			if (currentlyMovingPlayerIds.length == 1 && wasAlreadyMoving == false) {
				setTimeout(function() {updateScalesScheduler();}, updateInterval);
			}; /* otherwise, we are already going to update! */
		});

		world.on("R", function (playerRemoveEvent) {
			let movingPlayerIndex = currentlyMovingPlayerIds.indexOf(playerRemoveEvent.i);
			if (movingPlayerIndex != -1) {
				currentlyMovingPlayerIds.splice(movingPlayerIndex, 1);
			};
		});

		checkAllPlayers();
	};
})();
