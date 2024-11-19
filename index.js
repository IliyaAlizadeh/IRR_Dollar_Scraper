const express = require('express');
const cheerio = require('cheerio');
const got = require('got');
const cors = require('cors');
const app = express();
const port = 6060;
const currencyUrl = "https://www.tgju.org/currency";
let cachedData = null;
app.use(cors({
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE'],
    headers: ['Content-Type']
}));
const fetchAll = async function () {
    var response = await got(currencyUrl);
    var $ = cheerio.load(response.body);
    var dollar = {
        price: $('#l-price_dollar_rl > span > span.info-price').text(),
        change: _findPriceChange($('#l-price_dollar_rl > span > span.info-change'), $),
        codes: "USD",
        symbol: "$"
    };
    var euro = {
        price: $('#l-price_eur > span > span.info-price').text(),
        change: _findPriceChange($('#l-price_eur > span > span.info-change'), $),
        codes: "EUR",
        symbol: "€"
    };
    var oilBrent = $('#l-oil_brent > span > span.info-price').text();
    const dateUploading = new Date().toLocaleDateString("fa-IR", {
        day: "numeric",
        weekday: "long",
        month: "numeric",
        year: "numeric",
    });
    const timeUploading = new Date().toLocaleString("fa-IR", {
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });


    cachedData = {
        "date": dateUploading,
        "time": timeUploading,
        dollar,
        euro,
        "oil": { oilBrent },
    };
};

const _findPriceChange = function (elm, $) {
    let firstLevelClass = elm.attr('class');
    let firstChild = elm.children().get(0);
    let targetClassName = null;

    if (firstChild && firstChild.tagName == 'span') {
        targetClassName = $(firstChild).attr('class');
    } else {
        let parent = elm.parents('li');
        targetClassName = parent.attr('class');
    }

    if (targetClassName) {
        if (targetClassName.indexOf('high') > -1) {
            return {
                type: "positive",
                change: elm.text()
            };
        }
        if (firstLevelClass.indexOf('low') > -1) {
            return {
                type: "negative",
                change: elm.text()
            };
        }
    }

    return {
        type: "none",
        change: elm.text()
    };
};

app.get('/api/prices', (req, res) => {
    if (cachedData) {
        res.json(cachedData);
    } else {
        res.status(500).send(' داده‌ای برای نمایش وجود ندارد');
    }
});

setInterval(async () => {
    try {
        await fetchAll();
    } catch (error) {
        console.error('خطا در به‌روزرسانی داده‌ها:', error);
    }
}, 3600);

app.listen(port, () => {
    console.log(`سرور در http://localhost:${port} در حال اجرا است`);
});