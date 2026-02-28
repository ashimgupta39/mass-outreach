const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();

(async function loginToLinkedIn() {
  console.log('Running script.js (People search + Connect flow)');

  let options = new chrome.Options();
// options.addArguments('--headless');  // Enable headless mode
// options.addArguments('--no-sandbox');
// options.addArguments('--disable-dev-shm-usage');   
  // Set up the Chrome browser
//   let driver = await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options()).build();
  let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  try {
    // Step 1: Go directly to login page (avoids relying on homepage "Sign in" button)
    await driver.get('https://www.linkedin.com/login');

    // Step 2: Wait for the email input field and enter your email
    let emailInput = await driver.wait(until.elementLocated(By.id('username')), 10000);
    await emailInput.sendKeys(process.env.email_id);

    // Step 4: Enter the password into the password field
    let passwordInput = await driver.findElement(By.id('password'));
    await passwordInput.sendKeys(process.env.password);
    
    // Step 5: Submit the login form
    let loginButton = await driver.findElement(By.xpath("//button[@type='submit']"));
    await loginButton.click();

    // Wait for login to complete
    await driver.wait(until.urlContains('/feed'), 15000);
    await driver.sleep(3000);

    let profileUrls = [];
    try {
      const searchQuery = `SDE at ${process.env.company || 'company'}`;
      await driver.get(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`);
      await driver.sleep(3000);
      try {
        const peopleTab = await driver.findElement(By.xpath("//button[contains(., 'People')]"));
        await peopleTab.click();
        await driver.sleep(2000);
      } catch (e) {
        // Already on People results or filter has different structure
      }
      await driver.sleep(5000);
    const maxPages = 3; // How many result pages to scrape (page 1 + 2 more)

    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      try {
        await driver.sleep(2000);
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await driver.sleep(2000);

        let profileLinks = await driver.findElements(By.css("a.app-aware-link[href*='/in/']"));
        if (profileLinks.length === 0) {
          profileLinks = await driver.findElements(By.xpath("//a[contains(@href,'/in/') and not(contains(@href,'?'))]"));
        }
        if (profileLinks.length === 0) {
          profileLinks = await driver.findElements(By.xpath("//*/div/ul/li//div/div/div/div[2]//a[contains(@href,'linkedin.com/in')]"));
        }

        const seen = new Set(profileUrls);
        for (const link of profileLinks) {
          try {
            const href = await link.getAttribute('href');
            const cleanHref = href ? href.split('?')[0] : '';
            if (cleanHref && cleanHref.includes('linkedin.com/in/') && !seen.has(cleanHref)) {
              seen.add(cleanHref);
              profileUrls.push(cleanHref);
            }
          } catch (e) { /* skip this link */ }
        }
        console.log(`Page ${pageNum + 1}: found ${profileLinks.length} links, total unique so far: ${profileUrls.length}`);

        if (pageNum + 1 >= maxPages) break;
        let nextClicked = false;
        try {
          const nextBtn = await driver.findElement(By.css("button.artdeco-pagination__button--next"));
          const disabled = await nextBtn.getAttribute('aria-disabled');
          if (disabled !== 'true') {
            await nextBtn.click();
            nextClicked = true;
            await driver.sleep(3000);
          }
        } catch (e) { /* no next button or single page */ }
        if (!nextClicked) break;
      } catch (e) {
        console.warn(`Page ${pageNum + 1} error (continuing):`, e.message);
      }
    }
    } catch (e) {
      console.warn('Search or extraction error (continuing with collected links):', e.message);
    }

    await driver.sleep(2000);
    console.log('Extracted Profile Links:', profileUrls);
    await driver.sleep(3000);
    // Step 10: Loop through the buttons and click only those with the text 'Connect'

    const role = process.env.role || "SDE 1";
    for (let xx = 0; xx < profileUrls.length; xx++) {
      const link = profileUrls[xx];
      try {
        await driver.get(link);
        await driver.sleep(3000);

        let profileName = 'there';
        try {
          const nameEl = await driver.findElement(By.css("h1.text-heading-xlarge, h1.v-align-middle, h1.inline"));
          profileName = await nameEl.getText();
        } catch (e) { /* name optional */ }
        const firstName = profileName.split(' ')[0] || 'there';

        let buttons = [];
        try {
          await driver.wait(until.elementLocated(By.css("button.artdeco-button--primary")), 8000);
          buttons = await driver.findElements(By.css("button.artdeco-button.artdeco-button--2.artdeco-button--primary.ember-view, button.artdeco-button--primary"));
        } catch (e) {
          console.warn(`Skipping ${link}: no primary buttons found`);
          continue;
        }

        let connectButton = null;
        let buttonText = '';
        for (const btn of buttons) {
          try {
            const textEl = await btn.findElement(By.css('span.artdeco-button__text'));
            const text = await textEl.getText();
            if (text && text.trim().toLowerCase().startsWith('connect')) {
              connectButton = btn;
              buttonText = text.trim();
              break;
            }
          } catch (e) { continue; }
        }

        if (!connectButton) {
          console.log(`Profile ${link}: no Connect button (e.g. Message/Pending) - skipping`);
          continue;
        }

        console.log(`Profile: ${link} - Button: ${buttonText} - ${profileName}`);

        try {
          await connectButton.click();
        } catch (e) {
          console.warn(`Could not click Connect for ${link}:`, e.message);
          continue;
        }
        await driver.sleep(2000);

        let noteButton = null;
        try {
          noteButton = await driver.findElement(By.css("button.mr1"));
        } catch (e) {
          try {
            noteButton = await driver.findElement(By.xpath("//button[contains(., 'Add a note')]"));
          } catch (e2) { /* no note option */ }
        }
        if (noteButton) {
          try {
            await noteButton.click();
            await driver.sleep(2000);
            const referral_msg = `Hi ${firstName}, I recently came across a ${role} opening at your company. The role suits my experience and skills. It would be really helpful if you could refer me for it. Please accept my invite so that I can share my resume for the same. Thanks! `;
            const textarea = await driver.findElement(By.css("textarea.ember-text-area, textarea.msg-form__message-texteditor"));
            await textarea.sendKeys(referral_msg);
            await driver.sleep(1000);
            const sendBtn = await driver.findElement(By.css("button.ml1, button.msg-form__send-button"));
            await sendBtn.click();
            await driver.sleep(4000);
          } catch (e) {
            console.warn(`Could not add note for ${link}:`, e.message);
            try {
              const dismissBtn = await driver.findElement(By.css("button.artdeco-modal__dismiss"));
              await dismissBtn.click();
              await driver.sleep(1000);
            } catch (e2) { /* ignore */ }
          }
        } else {
          try {
            const sendBtn = await driver.findElement(By.css("button.artdeco-button--primary[aria-label*='Send'], button.ml1"));
            await sendBtn.click();
            await driver.sleep(2000);
          } catch (e2) { /* ignore */ }
        }
      } catch (error) {
        console.warn(`Skipping profile ${link}:`, error.message);
      }
    }

    console.log('Profile visit loop finished.');

    console.log('Successfully logged into LinkedIn!');
  } catch (error) {
    console.error('Error during login:', error);
  } finally {
    // Close the browser after a short delay
    await driver.sleep(60000);
    await driver.quit();
  }
})(); 
