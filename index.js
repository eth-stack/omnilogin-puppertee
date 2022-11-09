const axios = require("axios");
const puppeteer = require("puppeteer-core");

const BASE_URL = "http://localhost:35353";

async function open(profile) {
  try {
    // const debug_port = Math.floor(Math.random() * (50000 - 8000 + 1) + 8000);
    // Goi api mo browser
    const res = await axios.get(`${BASE_URL}/open?profile_id=${profile.id}`);
    if (res.data) {
      console.log("response: ", res.data);

      // connect puppeteer vao browser vua mua
      const browser = await puppeteer.connect({
        browserWSEndpoint: res.data.web_socket_debugger_url,
        defaultViewport: null
      });
      const contexts = browser.browserContexts();
      const context = contexts[0];
      const pages = await context.pages();
      const page = pages[0] ?? (await browser.newPage());

      // tra ve thong tin profile, browser, page ma puppeteer connect
      return { profile, browser, page };
    }
  } catch (e) {
    if (axios.isAxiosError(e)) {
      console.log(
        `Open profile  ${profile.id} error: `,
        e?.response?.data ?? e?.message
      );
    } else {
      console.log(`Open profile  ${profile.id} error: `, e.message);
    }
    return false;
  }
}

async function runScript(profile) {
  const result = await open(profile);

  if (!result) {
    return;
  }

  try {
    const { page, browser } = result;
    await page.goto("https://whoer.net/");
    await new Promise((r) => setTimeout(r, 6000));
    await browser.close();
    console.log(`Profile ${profile?.id} go to whoer.net success`);
  } catch (e) {
    console.error(`[Profile ${profile.id}] `, e);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  // Lay danh sach profile tu api
  const res = await axios.get(
    `${BASE_URL}/profiles?sort=date_created&sort_type=asc&page=0&pageSize=10`
  );
  console.log("response: ", res.data);
  const profiles = res.data.docs;

  for (const profile of profiles) {
    // Do not await here to run in parallel
    runScript(profile);
    await sleep(1000);
  }
}

main().catch((e) => {
  process.exitCode = 1;
  console.error("Error while running scripts: ", e.message);
});
