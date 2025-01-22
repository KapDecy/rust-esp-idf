// Button logic
async function buttonClickedHandler(e) {
    e.preventDefault()
    let value = e.target.value
    let data = value.split(" | ")
    let entries = {
        "first": parseInt(data[0]),
        "second": parseInt(data[1])
    }
    await setHzHandler(entries)
}

// Response to set hz
async function setHzHandler(entries) {
    document.body.style.pointerEvents = "none"
    let resp = await fetch("/set-hz", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(entries),
    });
    if (resp.ok) {
        // currentValue.innerText = "hihi"
        let data = JSON.parse(await resp.text())
        if (data.success == "true") {
            setCurrentHz([data.first, data.second])
        } else {
            alert("Not succes response")
        }
        // console.log(testtext)
    } else {
        alert("Error with post request")
    };

    document.body.style.pointerEvents = ""
}

// Only for visual current Hz set
function setCurrentHz(data) {
    currentValue.innerText = data.join(" | ")
}

// Set default values
function setDefaultHz(data) {
    setCurrentHz(data.current)
    for (let i = 0; i < 3; i++) {
        lastValues[i].value = data[`default-${i}`].join(" | ")
    }
}


function blockUnblock() {
    document.body.style.pointerEvents = "none"
}


let currentValue = document.getElementById("current-value")
let lastValues = document.querySelectorAll('#last-values > input')
let setHzForm = document.getElementById("set-hz-form")
let modeSelector = document.getElementById("mode-selector")
let secondHz = document.getElementById("second-hz")
let monoModeBox = document.getElementById("mono-mode")


let resp = await fetch("/default", {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    }
})
if (resp.ok) {
    let data = JSON.parse(await resp.text())
    setDefaultHz(data)
} else {
    alert("Default response error")
};

Array.prototype.map.call(lastValues, (x) => x.addEventListener("click", buttonClickedHandler))

// Handler for hide/show second Hz selector
modeSelector.addEventListener("input", async (e) => {
    e.preventDefault()

    let mode = e.target.value

    switch (mode) {
        case "mono":
            secondHz.hidden = true
            document.getElementById("second-hz-range").value = 500
            document.getElementById("second-hz-input").value = 500
            break
        case "stereo":
            secondHz.hidden = false
            break
    }
})


setHzForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    let form = e.currentTarget
    let entries = Object()
    entries["first"] = parseInt(form.amountRange1.value);

    if (monoModeBox.checked) {
        entries["second"] = entries["first"]
    } else {
        entries["second"] = parseInt(form.amountRange2.value)
    }

    await setHzHandler(entries)
})



















// theForm.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     let form = e.currentTarget;
//     let url = form.action;
//     console.log(url)

//     try {
//         let entries = Object.fromEntries(new FormData(form).entries());
//         console.log(entries)
//         entries["lp"] = parseInt(entries["lp"]);
//         let resp = await fetch("url", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 Accept: "application/json",
//             },
//             body: JSON.stringify(entries),
//         });
//         console.log(entries)
//         // console.log(resp.text());
//         serverResp.innerText = await resp.text();
//     } catch (err) {
//         console.error(err);
//     }
// });

// lprange.addEventListener('input', async (e) => {
//     e.preventDefault();


//     try {
//         let entries = Object();
//         entries["lp"] = parseInt(e.target.value);
//         let resp = await fetch(url, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 Accept: "application/json",
//             },
//             body: JSON.stringify(entries),
//         });
//         serverResp.innerText = await resp.text();
//     } catch (err) {
//         console.error(err);
//     }
// });