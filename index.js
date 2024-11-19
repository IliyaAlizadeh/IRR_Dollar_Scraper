const express = require('express');
const cheerio = require('cheerio');
const got = require('got');

const app = express();
const port = 3000; // می‌توانید پورت دلخواه خود را انتخاب کنید

const currencyUrl = "https://www.tgju.org/currency";

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
    var createtime = (new Date().getTime());

    var output = {
        "timestamp": createtime,
        "currency": {
            dollar,
            euro,
        },
        "oil": { oilBrent },
    };

    return output;
};

const _findPriceChange = function (elm, $) {
    let firstLevelClass = elm.attr('class');
    let firstchild = elm.children().get(0);
    let targetClassName = null;

    if (firstchild && firstchild.tagName == 'span') {
        targetClassName = $(firstchild).attr('class');
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

// تعریف یک مسیر API
app.get('/api/prices', async (req, res) => {
    try {
        const data = await fetchAll();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('خطا در دریافت داده‌ها');
    }
});

// راه‌اندازی سرور
app.listen(port, () => {
    console.log(`سرور در http://localhost:${port} در حال اجرا است`);
});