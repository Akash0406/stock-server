[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Ie0S5NgP)
## Table of Contents
1. [Welcome!](#welcome)
2. [Due Date & Submissions](#due-date--submissions)
3. [Website designs & requirements](#website-designs--requirements)
   - [Dashboard (`/`)](#dashboard-)
   - [Stock Selling Modal (`/`)](#stock-selling-modal-)
   - [Stock Buying Page (`/buy`)](#stock-buying-page-buy)
4. [Marking Criteria](#marking-criteria)
5. [Updates & Clarifications](#updates--clarifications)
6. [Sync Fork? Contribute?](#sync-fork-contribute)
7. [Notes / Questions / Rules](#notes--questions--rules)
8. [Deployment & Databases](#deployment--databases)
9. [Stock Pricing & API](#stock-pricing--api)
10. [Key Metrics Explained](#key-metrics-explained)
    - [Example Calculations](#example-calculations)

## Welcome!

You are creating a simple paper-trading webapp that lets users practice trading stocks on the NASDAQ without spending any money. Watch the following 2 minute video for a walkthrough:

https://youtu.be/EGtEROGlQUw

## Due Date & Submissions
**Please go into `INFO.md` and fill out the email you used for your application so we can identify you.**

This take home assessment is due on: **Monday 9th September at 23:59** (unless you have an extension)

You don't need to create a submission, we will visit your repository once the deadline has passed. No commits after the deadline will be considered.

## Website designs & requirements

The designs and video provided are intended for reference purposes only - you don't need to try for pixel perfect accuracy. We will accept any website that somewhat resembles the original design, provided that the required functionality is implemented.

- Using a design library can greatly improve your efficiency. We recommend Ant Design, TailwindCSS or Chakra UI.
- The design uses the font **Montserrat.**

### Dashboard (`/`)
- Displays portfolio's value & profit / loss. (Please refer to "Key Metrics Explained" at the bottom for calculation explanations.)
- Displays the **Symbol**, **Current Value**, **Total Shares** & **Profit / Loss**. Opens the Stock Selling Modal when clicked.

![dashboard](https://github.com/user-attachments/assets/9b28e2f4-90b3-48dd-aff6-c760f2aea398)

### Stock Selling Modal (`/`)
- Displays the purchase price & total shares owned.
- Users can sell any amount of the stock.
- After a stock is sold, it no longer needs to be accounted for in any of the stats.

![sellingmodal](https://github.com/user-attachments/assets/80d1c877-113d-466e-80cc-ba916ec0acca)

### Stock Buying Page (`/buy`)

- When a user enters something in the NASDAQ Symbol field, the API performs a lookup and finds the price of the stock.
    - Handle the case where the Symbol is invalid / doesn’t exist.
- The price of the stock is displayed and also filled into the price box. The default quantity should be `1`.
- If the quantity is adjusted, the total price should change as well.
- When Buy is clicked, the share is added to the database.
    - To simplify things, **you can only buy shares you don’t own already**.
    - This is so you don’t need to keep track of multiple purchase prices.

![buying](https://github.com/user-attachments/assets/36a207ee-6fa4-4e43-813e-ee3522ae3ca0)

## Marking Criteria

You don’t need to finish this assessment with 100% to get an interview! Do as much as you can and you might be surprised!

| Category                    | Description                                                                                                                                       | Percentage |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|------------|
| Functionality               | Do all features work as expected? Does the website handle normal errors a user can make?                                                           | 20%        |
| Database & API              | Is the choice of database & API appropriate? Is the database & API implementation efficient & secure?                                              | 20%        |
| Design                      | Does the website resemble the original design? Is the use of CSS & HTML efficient? Is the design responsive? (i.e. can use on mobile & desktop)     | 20%        |
| Code Quality                | Is the code written readable and efficient? Does the structure of the code make sense?                                                             | 20%        |
| Maintainability & Scalability | Is the code maintainable? Will there be any issues if a lot of users use the site? Is the chosen framework & libraries appropriate? Is the usage of frameworks & libraries efficient? | 10%        |
| Tools                       | Does the project use software tools efficiently? (e.g. CI/CD, linting, code format, Git)                                                           | 10%        |

## Updates & Clarifications

If you are unsure about requirements, you can make your own reasonable assumptions and proceed. Don't forget to discuss them in your `INFO.md` file.

Please email us if it's a major issue! I will update the follow document all major issues so please check it often.

https://docs.google.com/document/d/1d8F5ELhY7H_sIGVj9X0uqKwMFy741hQW7R0eEGnR0sw/pub

## Sync Fork? Contribute?
If you see the prompt below, you can safely ignore it.

![image](https://github.com/user-attachments/assets/73b644a7-55ef-4fc9-8121-7f530ce8e093)

## Notes / Questions / Rules

- You are **encouraged to use AI tools** to help you complete this.
- You must commit progressively to your GitHub.
    - Please name your commits appropriately.
- This is a solo project. You cannot work together with someone else. Do not share solutions before the **14th of September**. After that you can do whatever you want with this project.
- You don’t need to write tests for this project.
- In your `INFO.md` file, you can add information about your project if you want to share with us. (e.g. explain assumptions / decisions, discuss challenges)

### Deployment & Databases

- Please deploy your website whether it’s complete or not.
    - We may refuse to download and run your code for security reasons.
    - We recommend using Vercel https://vercel.com/ - it is completely free.
- Local databases are not accepted. (e.g. `.sqlite` database) You must use a cloud based database.
    - We recommend MongoDB Atlas, Supabase or Firebase. All are completely free.
- If you want to build a backend, please do so within the same repository.
    - You can deploy a backend on Firebase or Vercel for no costs at all.
    - Hint: you might not need to deploy a backend separately! research all of the frameworks available today.

### Stock Pricing & API

- Stock prices should be no more than a day old.
- We recommend this API: https://finnhub.io/docs/api/, it is completely free with a 60 calls / minute limit.
- We will not reimburse any API / hosting fees.

## Key Metrics Explained
The **Total Value** of your portfolio is calculated by summing up the current market value of all your owned shares. This represents how much your portfolio is worth today based on the latest market prices.

The **Total Profit/Loss** reflects the difference between the current value of your portfolio and the amount you originally invested. It shows whether you’ve made a profit or incurred a loss based on the purchase prices of your shares.

Each stock in your portfolio displays the following:

- **Symbol**: The NASDAQ symbol of the stock.
- **Current Value**: The latest market price of the stock.
- **Total Shares**: The total number of shares you own.
- **Profit/Loss**: The net gain or loss for this stock, calculated as `(Current Value - Buy Price) * Shares Owned`.

<details>
  <summary>Example Calculations</summary>

  ### Example Portfolio:
  --- 
  **MSFT**  
  - Current Value: $400  
  - Buy Price: $300  
  - Shares Owned: 10  
  
  **AAPL**  
  - Current Value: $200  
  - Buy Price: $300  
  - Shares Owned: 10

  ### Example Calculations
  ---
  **MSFT's Stock Information**  
  Symbol: MSFT  
  Current Value: $400  
  Total Shares: 10  
  Profit/Loss: ($400 - $300) * 10 = $1000 Profit
  
  **AAPL's Stock Information**  
  Symbol: AAPL  
  Current Value: $200  
  Total Shares: 10  
  Profit/Loss: ($200 - $300) * 10 = -$1000 Loss

  **Portfolio's Total Value**  
  Total Value
  = MSFT + AAPL  
  = ($400 * 10) + ($200 * 10)  
  = $6000
  
  **Portfolio's Total Profit/Loss**  
  Total Profit/Loss 
  = (MSFT Current Value - MSFT Buy Price) * MSFT Shares Owned + (AAPL Current Value - AAPL Buy Price) * AAPL Shares Owned  
  = ($400 - $300) * 10 + ($200 - $300) * 10  
  = $1000 + (-$1000)  
  = $0

  ---

</details>
