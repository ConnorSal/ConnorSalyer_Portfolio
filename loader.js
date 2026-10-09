(function ()
{
    const loader = document.getElementById("loader");

    if (!loader)
    {
        return;
    }

    const bar = loader.querySelector(".loader-bar");
    const percentText = loader.querySelector(".loader-percent");
    const statusText = loader.querySelector(".loader-status");

    const SEGMENTS = 20;
    const MIN_TIME = 1500;
    const MAX_TIME = 6000; 

    document.documentElement.classList.add("is-loading");

    // Build the bar segments
    const segments = [];

    for (let i = 0; i < SEGMENTS; i++)
    {
        const seg = document.createElement("span");
        seg.className = "loader-seg";
        bar.appendChild(seg);
        segments.push(seg);
    }

    const startTime = performance.now();
    let progress = 0;
    let pageLoaded = false;
    let finished = false;

    function render()
    {
        const shown = Math.floor(progress);
        percentText.textContent = String(shown).padStart(3, "0") + "%";

        const lit = Math.floor((progress / 100) * SEGMENTS);

        segments.forEach((seg, i) =>
        {
            seg.classList.toggle("on", i < lit);
        });
    }

    const tick = setInterval(() =>
    {
        const elapsed = performance.now() - startTime;
        const ready = pageLoaded && elapsed >= MIN_TIME;
        const target = ready ? 100 : 90;

        if (progress < target)
        {
            const step = ready ? 8 : Math.random() * 6;
            progress = Math.min(target, progress + step);
        }

        render();

        if (progress >= 100)
        {
            finish();
        }

    }, 80);

    function finish()
    {
        if (finished)
        {
            return;
        }

        finished = true;
        clearInterval(tick);

        statusText.textContent = "READY!";
        statusText.classList.remove("blink");

        setTimeout(() =>
        {
            loader.classList.add("loader-done");

            setTimeout(() =>
            {
                loader.remove();
                document.documentElement.classList.remove("is-loading");
            }, 600);

        }, 500);
    }

    // window "load" waits for images, fonts and the YouTube iframe
    if (document.readyState === "complete")
    {
        pageLoaded = true;
    }
    else
    {
        window.addEventListener("load", () => { pageLoaded = true; });
    }

    setTimeout(() => { pageLoaded = true; }, MAX_TIME);

    loader.addEventListener("click", () =>
    {
        pageLoaded = true;
        progress = 100;
        render();
        finish();
    });

})();