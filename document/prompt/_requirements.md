# Portfolio Management System - requirements

## Requirements
    As an investor, i want to track my trading and their profit. 
    I also want to see my portfolio asset real-time.

---

## Functional Requirements

### 1. Portfolio
    - Display current value of each portfolio (value, ROE %, NAV %, YTD %)
    - Display total value percentage of asset type/asset name in portfolio
    - Can filter by Asset Type, Asset Name

    - Display NAV history (all data)
    - Display ROE history (filtering data range by month)
    - Display current value and profit of each one (asset type and asset name)
    - Display portfolio week on week change % history 
    - Display portfolio return history by group asset
    - Display holding days and monthly return by asset
    - Display day on day change by asset
    - Display percentage history by asset
    - CRUD entities: Accounts, Assets, Portfolios, ...

### 2. Trading
    - Create/update transactions
    - Create/update asset value target to monitor Stoploss, Take profit
    - Display list assets by asset type (name, quantity, value, profit)
    - Display detail of asset: Quantity, Buy value, Market price, Current value, Profit, Stoploss, Take profit

## Non-functional Requirements
    - Low latency < 500ms
    - Market data prices refresh every 5 mins
    - High available and scalability
