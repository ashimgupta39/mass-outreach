const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();

(async function loginToLinkedIn() {
  // Set up the Chrome browser
  let driver = await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options()).build();

  try {
    // Step 1: Navigate to LinkedIn
    await driver.get('https://www.linkedin.com');

    // Step 2: Wait for the "Sign in" button to appear and click it
    let signInButton = await driver.wait(until.elementLocated(By.linkText('Sign in')), 10000);
    await signInButton.click();

    // Step 3: Wait for the email input field to appear and enter your email
    let emailInput = await driver.wait(until.elementLocated(By.id('username')), 10000);
    await emailInput.sendKeys(process.env.email_id);

    // Step 4: Enter the password into the password field
    let passwordInput = await driver.findElement(By.id('password'));
    await passwordInput.sendKeys(process.env.password);
    
    // Step 5: Submit the login form
    let loginButton = await driver.findElement(By.xpath("//button[@type='submit']"));
    await loginButton.click();

    // Wait for some post-login element to ensure login is successful
    await driver.sleep(5000);

    // Step 6: Enter "Manager at Meesho" into the search bar
    let searchBar = await driver.findElement(By.xpath("//*[@id='global-nav-typeahead']/input"));
    await searchBar.sendKeys(`Engineering at ${process.env.company}`, Key.RETURN);

    // Step 7: Wait for search results to load
    await driver.sleep(3000);

    // Step 8: Click on the "People" filter in the search results
    let peopleTab = await driver.findElement(By.xpath("//*[@id='search-reusables__filters-bar']/ul/li[1]/button"));
    await peopleTab.click();

    // Wait for the people filter results to load
    await driver.sleep(7000);
    let profileUrls = [];
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
    await driver.sleep(2000);
    let paginationItems = await driver.findElements(By.css("li.artdeco-pagination__indicator.artdeco-pagination__indicator--number.ember-view"));

    let it =0;
    for (it = 0;it<3;it++){
        await driver.sleep(2000);
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
        await driver.sleep(1000);
        let paginationItems = await driver.findElements(By.css("li.artdeco-pagination__indicator.artdeco-pagination__indicator--number.ember-view"));
        await driver.sleep(1000);
        await paginationItems[it].click();


    // Step 9: Find all profile links with the class 'app-aware-link'
    await driver.sleep(2000);
    let profileLinks = await driver.findElements(By.css('a.app-aware-link.scale-down'));

    // Step 10: Extract href attribute (profile links) from the found elements
    
    for (let link of profileLinks) {
      let href = await link.getAttribute('href');
      if (href.includes('linkedin.com/in')) {  // Only include valid profile URLs
        profileUrls.push(href);
      }
    }
    }
    
    await driver.sleep(3000);
    
    // Print all the extracted profile URLs
    console.log('Extracted Profile Links:', profileUrls);
    await driver.sleep(3000);
    // Step 10: Loop through the buttons and click only those with the text 'Connect'

    let role = "SDE 1"
    let xx = 0;
    for (let link of profileUrls) {
        xx++;
        // if(xx<26) continue;
        await driver.get(link);
        await driver.sleep(3000);
        // Wait for the profile page to load
        await driver.wait(until.elementLocated(By.css("button.artdeco-button.artdeco-button--2.artdeco-button--primary.ember-view.pvs-profile-actions__action")), 10000);
  
        // Step 12: Find the button with the specific classes and extract the text
        let button = await driver.findElement(By.css("button.artdeco-button.artdeco-button--2.artdeco-button--primary.ember-view.pvs-profile-actions__action"));
        let buttonText = await button.findElement(By.css('span.artdeco-button__text')).getText();

        // get the name of the person-
        let profileName = await driver.findElement(By.css("h1.text-heading-xlarge.inline")).getText();
        let firstName = profileName.split(' ')[0];
        
        console.log(`Profile: ${link} - Button Text: ${buttonText} with ${profileName}`);

        // if the first button is Connect-
        if(buttonText == "Connect"){
            await button.click()
            await driver.sleep(2000)
            let noteButton = await driver.findElement(By.css("button.mr1"));
            await noteButton.click();
            await driver.sleep(2000);

            let referral_msg= `Hi ${firstName}, I recently came across a ${process.env.role} opening at your company. The role suits my experience and skills. It would be really helpful if you could refer me for it. Please accept my invite so that I can share my resume for the same. Thanks! `
            let searchBar = await driver.findElement(By.css("textarea.ember-text-area"));
            await searchBar.sendKeys(referral_msg);
            await driver.sleep(1000);
            await driver.findElement(By.css("button.ml1")).click();
            await driver.sleep(4000);
        }
        else{
            let moreButtons = await driver.findElements(By.css('button.artdeco-dropdown__trigger.artdeco-dropdown__trigger--placement-bottom.artdeco-button--secondary'));
            if (moreButtons.length > 0) {
                await moreButtons[1].click();
            }
            await driver.sleep(2000);
            let connectButtons = await driver.findElements(By.css("span.display-flex.t-normal.flex-1"));
            await connectButtons[7].click();
            let buttonText = await connectButtons[7].getText();
            if(buttonText!=="Connect") {continue;}
            await driver.sleep(2000);

            let noteButton = await driver.findElement(By.css("button.mr1"));
            await noteButton.click();
            await driver.sleep(2000);

            let referral_msg= `Hi ${firstName}, I recently came across a ${process.env.role} opening at your company. The role suits my experience and skills. It would be really helpful if you could refer me for it. Please accept my invite so that I can share my resume for the same. Thanks! `
            let searchBar = await driver.findElement(By.css("textarea.ember-text-area"));
            await searchBar.sendKeys(referral_msg);
            await driver.sleep(1000);
            await driver.findElement(By.css("button.ml1")).click();
            await driver.sleep(4000);

        }
      }

    console.log('Successfully searched for "Manager at Meesho" and clicked on the People filter.');

    console.log('Successfully logged into LinkedIn!');
  } catch (error) {
    console.error('Error during login:', error);
  } finally {
    // Close the browser after a short delay
    await driver.sleep(60000);
    await driver.quit();
  }
})(); 
