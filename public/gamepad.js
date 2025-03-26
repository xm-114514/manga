const DEAD_ZONE = 0.15;
let previousButtonStates = {}; 

window.addEventListener("gamepadconnected", (event) => {
    console.log("🎮 ゲームパッドが接続されました:", event.gamepad.id);
    pollGamepad();
});

window.addEventListener("gamepaddisconnected", (event) => {
    console.log("❌ ゲームパッドが切断されました:", event.gamepad.id);
});

function applyDeadZone(value, threshold = DEAD_ZONE) {
    return Math.abs(value) < threshold ? 0 : value;
}

function pollGamepad() {
    if (!navigator.getGamepads) return;

    function update() {
        const gamepads = navigator.getGamepads();
        if (gamepads[0]) {
            const gp = gamepads[0];
            const leftStickX = applyDeadZone(gp.axes[0]);
            const leftStickY = applyDeadZone(gp.axes[1]);
            const rightStickX = applyDeadZone(gp.axes[2]);
            const rightStickY = applyDeadZone(gp.axes[3]);

            if (!(
                leftStickX.toFixed(2) == 0.00 && 
                leftStickY.toFixed(2) == 0.00 &&
                rightStickX.toFixed(2) == 0.00 &&
                rightStickY.toFixed(2) == 0.00
            )) {
                console.log(`左スティック: (${leftStickX.toFixed(2)}, ${leftStickY.toFixed(2)})`);
                console.log(`右スティック: (${rightStickX.toFixed(2)}, ${rightStickY.toFixed(2)})`);
            }

            gp.buttons.forEach((button, index) => {
                if (button.pressed && !previousButtonStates[index]) {
                    console.log(`ボタン ${index} が押されました`);
                    if (location.pathname.includes("/favorite.html")) {
                        if (index == 2) {
                            const currentItem = favList[currentIndex];
                            currentItem && removeFavorite(currentIndex, currentItem);         
                            currentItem ? popup_function() : alert("なんかおかしい [if]")        
                        }
                        if (index == 15) {
                            nextImage();
                        } if (index == 14) {
                            prevImage();
                        }
                    } 
                }
                previousButtonStates[index] = button.pressed;
            });
        }
        requestAnimationFrame(update);
    }

    update();
}

function popup_function() {
    const popup = document.createElement("div");
    popup.id = "popup";
    popup.textContent = `${current_path} をお気に入りから削除`;

    popup.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        padding: 10px;
        background: rgba(184, 184, 184, 0.8);
        color: #fff;
        text-align: center;
        border-radius: 6px;
        border: 1px solid #fff;
        opacity: 0;
        transition: opacity 0.5s;
        z-index: 9999;
    `;
    document.body.appendChild(popup);
    fadeInOut(popup);
}

async function fadeInOut(element) {
    await delay(10);
    element.style.opacity = "1";
    await delay(1500);
    element.style.opacity = "0";
    await delay(500);
    element.remove();
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
