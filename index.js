const axios = require("axios").default;
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
      const page = pages[0];

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

(async () => {
  // Lay danh sach profile tu api
  const res = await axios.get(
    `${BASE_URL}/profiles?sort=date_created&sort_type=asc&page=0&pageSize=10`
  );
  console.log("response: ", res.data);
  const profiles = res.data.docs;
  const browsers = {};

  // Mo lan luot tung profile, luu thong tin vao `browsers` tranh trung port
  for (const profile of profiles) {
    browsers[profile.id] = await open(profile);
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Chay dong thoi tat ca cac profile trong `browsers`
  await Promise.all(
    Object.values(browsers)
      .filter((e) => e)
      .map(async ({ profile, browser, page }) => {
        console.log(`Profile ${profile?.id} go to ...`);
        await page.goto("https://whoer.net/");
        await new Promise((r) => setTimeout(r, 6000));
        await browser.close();
        console.log(`Profile ${profile?.id} go to whoer.net success`);
      })
  );
})().catch((e) => {
  process.exitCode = 1;
  console.error("Error: ", e.message);

  if (axios.isAxiosError(e) && e.response?.data) {
    console.log("Response", e.response.data);
  }
});
