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
        if (data.success) {
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



let currentValue = document.getElementById("current-value")
let lastValues = document.querySelectorAll('#last-values > input')
let setHzForm = document.getElementById("set-hz-form")
let modeSelector = document.getElementById("mode-selector")
let secondHz = document.getElementById("second-hz")
let monoModeBox = document.getElementById("mono-mode")
let secret = document.getElementById("secret")
let help = document.getElementById("help")

// Get default values
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

// Add handler for all three buttons
Array.prototype.map.call(lastValues, (x) => x.addEventListener("click", buttonClickedHandler))

// Handler for hide/show second Hz selector
modeSelector.addEventListener("input", (e) => {
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

// Handler to set hz from ranges
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

secret.addEventListener("click", (e) => {
    if (document.body.style.backgroundImage == "") {
        document.body.style.backgroundImage = "url('RF.png')"
    } else {
        document.body.style.backgroundImage = ""
    }
})

help.addEventListener("click", (e) => {
    alert("text\ntext\ntext\ntext\ntext\ntext\n")
})
