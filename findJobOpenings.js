const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require("fs");
const axios = require("axios");
const { parse } = require("csv-parse/sync");
const OpenAI =require("openai");
const openai = new OpenAI();

require('dotenv').config();

(async function loginToLinkedIn() {

let options = new chrome.Options();
// options.addArguments('--headless');  // Enable headless mode
// options.addArguments('--no-sandbox');
// options.addArguments('--disable-dev-shm-usage');   
  // Set up the Chrome browser
//   let driver = await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options()).build();
  let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

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

    // Wait for login to complete
    await driver.wait(until.urlContains('/feed'), 15000);
    await driver.sleep(3000);

    // Step 6: Go directly to content search (no nav search bar - LinkedIn UI changes break selectors)
    await driver.get('https://www.linkedin.com/search/results/content/?keywords=hiring%20software%20engineer&origin=SWITCH_SEARCH_VERTICAL&datePosted="past-week"&sortBy="date_posted"');

    // Step 7: Wait for search results to load
    await driver.sleep(3000);

    // Step 8: Filters may already be applied via URL; click "Latest" / "Show results" if present
    try {
      const sortBy = await driver.findElement(By.xpath("//span[text()='Latest']"));
      await sortBy.click();
      await driver.sleep(1500);
    } catch (e) { /* optional */ }
    try {
      const showResults = await driver.findElement(By.xpath("//button[.//span[text()='Show results']]"));
      await showResults.click();
      await driver.sleep(2000);
    } catch (e) { /* optional */ }
    
    // step 9: Click on "sort by" tab-
    await driver.sleep(2000);
    let sortByTab = await driver.findElement(By.xpath("//*[@id='search-reusables__filters-bar']/ul/li[3]"))
    await sortByTab.click()

    // step 10: Click on "Latest" button-
    await driver.sleep(2000)
    let latestButton = await driver.findElement(By.xpath("//span[text()='Latest']"))
    await latestButton.click()

    // step 11: Click on "show results" button-
    await driver.sleep(2000)
    let showResultButton = await driver.findElements(By.xpath("//button[@aria-label='Apply current filter to show results']/span[text()='Show results']"))
    await driver.sleep(1000)
    await showResultButton[0].click()

    // scroll to load all the posts-
    await driver.sleep(2000);
    for (let i=0;i<15;i++){
        await driver.sleep(3000);
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
    }
    
    // extract all posts-
    await driver.sleep(1000)
    let allPosts = await driver.findElements(By.xpath("//div[contains(@class, 'feed-shared-update-v2')]/div/span/span[@dir='ltr']"))
    await driver.sleep(1000)
    let NumOfPosts = allPosts.length
    console.log("number of posts found- ",NumOfPosts)
    let PostContents = []
    for (let i = 0;i<NumOfPosts;i++){
        let PostText = await allPosts[i].getAttribute("innerText")
        PostContents.push(PostText)
    }

    // extract relevent job openings and store them in csv file-
    openai_api_key = process.env.OPENAI_API_KEY
    const resumeText = `
        Experience
        Software Engineer, Tredence Inc.– Bengaluru
        Jun 2023 - Present
        Tools: Next.js, Python, FastAPI, GraphQL, SQL, Code Splitting, SSR
        • Implemented a modular web application with a Next.js frontend and FastAPI backend, enabling scalable DDL script conversion
        for 7,000+ scripts weekly with an average latency of under 200ms per request.
        • Automated data migration workflows for diverse source-to-target database systems, including Snowflake, Databricks and
        Teradata reducing 70% manual effort and achieving estimated cost savings of $60k per project.
        • Engineered code splitting and Server-Side Rendering (SSR) in the DDL analyzer module, optimizing resource loading and
        reducing initial page load times by 40%, enhancing the overall user experience for data migration workflows.
        • Built a testing framework for the DDL converter module, automating validation for diverse SQL files (tables, views, stored
        procedures) achieving an 80% reduction in QA time, significantly lowering testing effort and project costs.
        • Designed scalable database schemas for metadata management, supporting horizontal scaling and maintaining a consistent
        query performance of <50ms for metadata retrieval.
        Software Engineering Intern, Birla Textiles Ltd.
        Dec 2021 – Feb 2022
        Tools: React.js, Express.js, MySQL, Socket.IO, Indexing, Query Batching
        • Developed a full-stack web application using React.js, Node.js and MySQL to digitize machinery issue tracking, reducing
        complaint resolution time by 50%, and improving overall operational efficiency.
        • Deployed real-time status updates into the system using Socket.IO, achieving instant visibility for issue resolution progress,
        enhancing collaboration among teams.
        • Optimized database queries in the complaint management system by implementing indexed search and query batching,
        improving data retrieval speeds by 35%.
        Projects
        YouTubeGPT- YouTube Video Chatbot | Website | Chrome Extension
        Tools: React.js, Redux, Tailwind CSS, RAG, Debouncing, Caching, Microservices
        • Developed a YouTube clone with a Q&A chatbot using React.js, Redux, Tailwind CSS, and YouTube’s Data API for seamless video
        fetching and integration.
        • Integrated a multilingual Q&A chatbot with RAG-based architecture using Llama, Mixtral/Gemma, and Chroma DB,
        leveraging vector embeddings to improve retrieval efficiency and reducing query latency by 70%, enhancing user engagement
        across diverse languages.
        • Optimized search functionality with techniques like debouncing and caching, reducing search API call’s latency by 40% and
        ensuring rapid, accurate search result retrieval.
        • Implemented interactive features like nested comments (n-level nesting) and video statistics (views, likes, subscribers), ensuring
        100% functionality coverage in testing and demonstrating scalability for large datasets.
        TLance- Freelancing website for Teachers
        Tools: React.js, Express.js, MySQL, Socket.IO, Indexing, Query Batching
        • Built a freelancing platform for teachers using HTML, CSS, JS, MySQL, and Express.js, enabling job postings and candidate
        browsing for universities.
        • Integrated a real-time chat system with Socket.IO, facilitating seamless communication between teachers and universities.
        • Designed user interfaces with Bootstrap and HBS, ensuring a smooth and intuitive user experience.
        Education
        Code
        Code
        Thapar Institute of Engineering and Technology (TIET)
        BE in Computer Science Engineering CGPA: 8.01
        Skills
        Aug 2019 – Jul 2023
        Programming Languages: Javascript, Python, C++, SQL
        Technologies and Frameworks: Next.js, React.js, REST APIs, Microservices, FastAPI, Socket.IO, Redux, Tailwind CSS, Express.js,
        GraphQL, HTML, Docker, Git, AWS, Node.js, HBS, Bootstrap
        Concepts: Data Structures and Algorithms, System Design, Scalability, Performance Optimization, Agile Development, Unit and
        Integration Testing
    `;

    // Function to call OpenAI API
    async function analyzeJobPost(postText) {
        try {
            const prompt = `Tell me if this is a relevant job opening for me to which I should apply to-
                ${postText}
                Figure out if it is relevant job opeing that i should apply to from my following resume text-
                ${resumeText}
                I am looking for SDE 1 jobs that pay more than 12 LPA and preferably I am looking for mid-to-high-scale stage startups/companies which are not very popular and have less competition in the job market.
                If you think it is relevant then respond with the following only-
                "Yes, Company Name, role, job opening link"
                If you think it is not relevant then just respond with only-
                "No"
                The Post might have multiple openings, so i want you to give me all the relevant job openings in format specified above.
                The response should not have any explainations or openions, only strictly follow the specified format.
                `
                ;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                store: true,
                messages: [{ "role": "user", "content": prompt }]
            });

            return completion.choices[0]?.message?.content || "No results found.";
        } catch (error) {
            console.error("Error calling OpenAI API:", error);
            return "Error";  // Handle errors gracefully
        }
    }

    // Function to save results to CSV
    function saveToCSV(data) {
        const csvHeader = "Company Name,Role,Opening Link\n";
        const csvRows = data.map(row => row.join(",")).join("\n");
        fs.writeFileSync("relevant_jobs_2.csv", csvHeader + csvRows, "utf8");
        console.log("CSV file saved as relevant_jobs_2.csv");
    }

    // Main function to process all job posts
    (async function processJobPosts(postContents) {
        let relevantJobs = [];

        for (let i = 0; i < postContents.length; i++) {
            console.log(`Analyzing Post ${i + 1}...`);
            let response = await analyzeJobPost(postContents[i]);
            console.log(`Response: ${response}`);

            if (response.startsWith("Yes,")) {
                let details = response.split(",").map(item => item.trim());
                if (details.length === 4) {
                    let [_, company, role, link] = details;
                    relevantJobs.push([company, role, link]);
                }
            }
        }

        if (relevantJobs.length > 0) {
            saveToCSV(relevantJobs);
        } else {
            console.log("No relevant jobs found.");
        }
    })(PostContents)

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
