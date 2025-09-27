

GET ALL FUND PRICES
let
    url = "https://api.fmarket.vn/res/products/filter",
    headers = [#"Content-Type"="application/json"],
    body = "{
        ""types"":[""NEW_FUND"",""TRADING_FUND""],
        ""issuerIds"":[],
        ""sortOrder"":""DESC"",
        ""sortField"":""annualizedReturn36Months"",
        ""page"":1,
        ""pageSize"":100,
        ""isIpo"":false,
        ""fundAssetTypes"":[],
        ""bondRemainPeriods"":[],
        ""searchField"":"""",
        ""isBuyByReward"":false,
        ""thirdAppIds"":[]
        }",
    response = Json.Document(Web.Contents(url,
        [
            Headers = headers,
            Content = Text.ToBinary((body))
        ])),
    data = response[data],
    #"Converted to Table1" = Record.ToTable(data),
    Value = #"Converted to Table1"{3}[Value],
    #"Converted to Table" = Table.FromList(Value, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column1" = Table.ExpandRecordColumn(#"Converted to Table", "Column1", {"name", "shortName", "nav"}, {"name", "shortName", "nav"}),
    #"Renamed Columns" = Table.RenameColumns(#"Expanded Column1",{{"shortName", "Symbols"}, {"nav", "Price"}})
in
    #"Renamed Columns"

LẤY GIÁ VÀNG
let
    // Lấy dữ liệu từ URL
    Source = Web.Contents("http://giavang.doji.vn/sites/default/files/data/hienthi/vungmien_109.dat"),
    // Chuyển binary thành text
    HtmlText = Text.FromBinary(Source),
    
    // Xử lý chuỗi HTML
    CleanText = Text.Replace(HtmlText, "&lt;", "<"),
    CleanText2 = Text.Replace(CleanText, "&gt;", ">"),
    CleanText3 = Text.Replace(CleanText2, "&amp;", "&"),
    
    // Trích xuất bảng
    ExtractedTable = Html.Table(CleanText3, {
        {"Loại vàng", "table.goldprice-view tbody tr td.label"},
        {"Mua vào", "table.goldprice-view tbody tr td:nth-child(2)"},
        {"Bán ra", "table.goldprice-view tbody tr td:nth-child(3)"}
    }, [RowSelector="table.goldprice-view tbody tr"]),
    
    // Chuyển đổi kiểu dữ liệu
    Result = Table.TransformColumnTypes(ExtractedTable,{
        {"Mua vào", type number}, 
        {"Bán ra", type number}
    }),
    #"Renamed Columns" = Table.RenameColumns(Result,{{"Loại vàng", "Loại"}})
in
    #"Renamed Columns"
	
LẤY TỶ GIÁ
let
    Source = Web.Page(Web.Contents("https://tygiausd.org/nganhang/vietcombank")),
    Data = Source{2}[Data],
    #"Replaced Value" = Table.ReplaceValue(Data,",","",Replacer.ReplaceText,{"Mua vào","Chuyển Khoản", "Bán Ra"})
in
    #"Replaced Value"

GET ALL STOCK PRICES IN HOSE	
let
    Source = Json.Document(Web.Contents("https://iboard-query.ssi.com.vn/stock/exchange/hose?boardId=MAIN")),
    #"Converted to Table" = Table.FromList(Source[data], Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column2" = Table.ExpandRecordColumn(#"Converted to Table", "Column1", {"stockSymbol", "expectedMatchedPrice"}, {"Symbols", "Price"})
in
    #"Expanded Column2"
	
GET ALL STOCK PRICES IN HNX	
let
    Source = Json.Document(Web.Contents("https://iboard-query.ssi.com.vn/stock/exchange/hnx?boardId=MAIN")),
    #"Converted to Table" = Table.FromList(Source[data], Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column2" = Table.ExpandRecordColumn(#"Converted to Table", "Column1", {"stockSymbol", "expectedMatchedPrice"}, {"Symbols", "Price"})
in
    #"Expanded Column2"
	
GET ALL ETF:
let
    Source = Json.Document(Web.Contents("https://iboard-query.ssi.com.vn/stock/type/e/hose")),
    #"Converted to Table" = Table.FromList(Source[data], Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column2" = Table.ExpandRecordColumn(#"Converted to Table", "Column1", {"stockSymbol", "expectedMatchedPrice"}, {"Symbols", "Price"})
in
    #"Expanded Column2"

GET PRICE HISTORY
https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=VNIndex&StartDate=08/01/2025&EndDate=08/31/2025&PageIndex=1&PageSize=20