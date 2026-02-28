require('dotenv').config();

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require("fs");
const axios = require("axios");
const { parse } = require("csv-parse/sync");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemma-3-1b-it" });

(async function loginToLinkedIn() {

let options = new chrome.Options();
// options.addArguments('--headless');  // Enable headless mode
// options.addArguments('--no-sandbox');
// options.addArguments('--disable-dev-shm-usage');   
  // Set up the Chrome browser
//   let driver = await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options()).build();
  let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  try {
    // Step 1: Navigate directly to LinkedIn login page
    await driver.get('https://www.linkedin.com/login');

    // Step 2: Wait for the email input field to appear and enter your email
    let emailInput = await driver.wait(until.elementLocated(By.id('username')), 10000);
    await emailInput.sendKeys(process.env.email_id);

    // Step 3: Enter the password into the password field
    let passwordInput = await driver.findElement(By.id('password'));
    await passwordInput.sendKeys(process.env.password);
    
    // Step 4: Submit the login form
    let loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    // Wait for login to complete and redirect to feed
    await driver.wait(until.urlContains('/feed'), 15000);
    await driver.sleep(3000);

    await driver.get('https://www.linkedin.com/search/results/content/?datePosted=%22past-week%22&keywords=hiring%20sde%201&origin=FACETED_SEARCH&searchId=26a4efc0-b646-4bac-9479-d7cd3c123da7&sid=7w1&sortBy=%22date_posted%22');
    // Step 6: Enter "Manager at Meesho" into the search bar
    // let searchBar = await driver.findElement(By.xpath("//*[@id='global-nav-typeahead']/input"));
    // await searchBar.sendKeys(`hiring software engineer`, Key.RETURN);

    // // Step 7: Wait for search results to load
    // await driver.sleep(3000);

    // // Step 8: Click on the "People" filter in the search results
    // let postsTab = await driver.findElement(By.xpath("//*[@id='search-reusables__filters-bar']/ul/li[1]/button"));
    // await postsTab.click();
    
    // // step 9: Click on "sort by" tab-
    // await driver.sleep(2000);
    // let sortByTab = await driver.findElement(By.xpath("//*[@id='search-reusables__filters-bar']/ul/li[3]"))
    // await sortByTab.click()

    // // step 10: Click on "Latest" button-
    // await driver.sleep(2000)
    // let latestButton = await driver.findElement(By.xpath("//span[text()='Latest']"))
    // await latestButton.click()

    // // step 11: Click on "show results" button-
    // await driver.sleep(2000)
    // let showResultButton = await driver.findElements(By.xpath("//button[@aria-label='Apply current filter to show results']/span[text()='Show results']"))
    // await driver.sleep(1000)
    // await showResultButton[0].click()

    // scroll to load all the posts-
    await driver.sleep(2000);
    for (let i=0;i<3;i++){
        await driver.sleep(3000);
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
    }
    
    // extract all posts - using updated selectors for LinkedIn's current UI
    await driver.sleep(2000);
    
    // Try multiple selectors to find post content (LinkedIn updates these frequently)
    let allPosts = await driver.findElements(By.css('[data-urn*="activity"] .feed-shared-update-v2__description, .update-components-text, .feed-shared-inline-show-more-text'));
    
    // Fallback to alternative selectors if none found
    if (allPosts.length === 0) {
        allPosts = await driver.findElements(By.xpath("//div[contains(@class, 'feed-shared-update-v2')]//span[@dir='ltr']"));
    }
    
    // Another fallback - broader selector
    if (allPosts.length === 0) {
        allPosts = await driver.findElements(By.css('.feed-shared-update-v2 .break-words'));
    }
    
    await driver.sleep(1000);
    let NumOfPosts = allPosts.length;
    console.log("Number of posts found:", NumOfPosts);
    
    let PostContents = [];
    for (let i = 0; i < NumOfPosts; i++) {
        try {
            let PostText = await allPosts[i].getAttribute("innerText");
            if (PostText && PostText.trim().length > 50) { // Filter out empty or very short texts
                PostContents.push(PostText);
            }
        } catch (e) {
            console.log(`Skipping post ${i} due to error`);
        }
    }
    console.log("Posts with content extracted:", PostContents.length);

    // extract relevent job openings and store them in csv file-
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

    // Function to call Gemini API
    async function analyzeJobPost(postText) {
        try {
            const prompt = `Tell me if this is a relevant job opening for me to which I should apply to-
                ${postText}
                Figure out if it is relevant job opeing that i should apply to from my following resume text-
                ${resumeText}
                I am looking for Software engineer 1 and 2 job roles that pay more than 12 LPA and preferably I am looking for mid-to-high-scale stage startups/companies, product based companies likee zomato, swiggy, hotstar, tata 1mg, pharmeasy, startups, etc.
                I am specifically looking for fullstack engineer, frontend engineer and backend engineer roles.
                If you think it is relevant then respond with the following only-
                "Yes, Company Name, Role, How to Apply"
                For "How to Apply" column, extract any of these from the post: job application link, email address, or name of the person to contact. If none of these are available, just write "N/A".
                If you think it is not relevant then just respond with only-
                "No"
                The Post might have multiple openings, so i want you to give me all the relevant job openings in format specified above (one per line).
                The response should not have any explainations or openions, only strictly follow the specified format.
                `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text() || "No results found.";
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return "Error";  // Handle errors gracefully
        }
    }

    // Function to save results to CSV
    function saveToCSV(data) {
        const csvHeader = "Company Name,Role,How to Apply\n";
        const csvRows = data.map(row => {
            // Escape commas in fields by wrapping in quotes if needed
            return row.map(field => {
                if (field.includes(',') || field.includes('"')) {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            }).join(",");
        }).join("\n");
        fs.writeFileSync("relevant_jobs_5.csv", csvHeader + csvRows, "utf8");
        console.log("CSV file saved as relevant_jobs_5.csv");
    }

    // Main function to process all job posts
    (async function processJobPosts(postContents) {
        let relevantJobs = [];

        for (let i = 0; i < postContents.length; i++) {
            console.log(`Analyzing Post ${i + 1}...`);
            let response = await analyzeJobPost(postContents[i]);
            console.log(`Response: ${response}`);

            // Handle multiple lines in response (multiple job openings)
            const lines = response.split('\n').filter(line => line.trim().startsWith("Yes,"));
            
            for (const line of lines) {
                let details = line.split(",").map(item => item.trim());
                if (details.length >= 3) {
                    // Extract company and role (required)
                    let company = details[1] || "Unknown Company";
                    let role = details[2] || "Unknown Role";
                    // How to apply is optional - join remaining parts in case it contains commas
                    let howToApply = details.length > 3 ? details.slice(3).join(", ") : "N/A";
                    relevantJobs.push([company, role, howToApply]);
                    console.log(`  -> Saved: ${company} - ${role}`);
                }
            }
            
            // Pause 10 seconds between API calls to avoid rate limiting
            if (i < postContents.length - 1) {
                console.log("Waiting 5 seconds before next API call...");
                await new Promise(resolve => setTimeout(resolve, 5000));
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
