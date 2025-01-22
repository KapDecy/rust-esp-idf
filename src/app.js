let theForm = document.getElementById("the-form");
let lprange = document.getElementById("lp-range");
let serverResp = document.getElementById("server-resp");
let url = theForm.action;


// let cur
let setHzForm = document.getElementById("set-hz-form")
let modeSelector = document.getElementById("mode-selector")
let secondHz = document.getElementById("second-hz")
let monoModeBox = document.getElementById("mono-mode")

// function sendHzRequest(url)

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


async function setHzHandler(entries) {
    try {
        let resp = await fetch("/set-hz", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(entries),
        });
        // console.log(entries)
        // serverResp.innerText = await resp.text();
    } catch (err) {
        console.error(err);
    }
}


theForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let form = e.currentTarget;
    let url = form.action;
    console.log(url)

    try {
        let entries = Object.fromEntries(new FormData(form).entries());
        console.log(entries)
        entries["lp"] = parseInt(entries["lp"]);
        let resp = await fetch("url", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(entries),
        });
        console.log(entries)
        serverResp.innerText = await resp.text();
    } catch (err) {
        console.error(err);
    }
});

lprange.addEventListener('input', async (e) => {
    e.preventDefault();


    try {
        let entries = Object();
        entries["lp"] = parseInt(e.target.value);
        let resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(entries),
        });
        serverResp.innerText = await resp.text();
    } catch (err) {
        console.error(err);
    }
});