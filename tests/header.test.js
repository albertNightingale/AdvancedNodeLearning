/**
 *  testing the header navigation bar in the frontend 
 */ 

const pup = require('puppeteer');

let browser, page;

beforeEach( async () => {
    // create a browser
    browser = await pup.launch({
        headless: false // headless means it will display the user interface of the launched browser
    });

    // create a page in the browser
    page = await browser.newPage();
    await page.goto('localhost:3000'); // navigating to a page
});

afterEach( async () => {
    // close the browser 
    await browser.close(); 
}); 

test('Able to see the logo on the header', async () => {
    
    // select an element and take its innerHTML
    const text = await page.$eval('a.brand-logo', el => el.innerHTML); 
    
    expect(text).toEqual('Blogster');
})

test('clicking login will start the oauth flow', async () => {
    await page.click('.right a');

    const url = await page.url();

    expect(url).toMatch(/accounts\.google\.com/); 
})