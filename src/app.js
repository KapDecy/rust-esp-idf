let theForm = document.getElementById("the-form");
let lprange = document.getElementById("lp-range");
let serverResp = document.getElementById("server-resp");
let url = theForm.action;

theForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let form = e.currentTarget;
    let url = form.action;
    console.log(url)

    try {
        let entries = Object.fromEntries(new FormData(form).entries());
        entries["lp"] = parseInt(entries["lp"]);
        let resp = await fetch(url, {
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