const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const dataService = require('./dataService');
const { calculateTotalCost } = require('./costCalculator'); // 将引入新的计算模块

const app = express();
const PORT = 3000;

// 密码 - 通过环境变量获取，更安全的方式管理
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || 'yourpassword'; // 默认密码，生产环境中应通过环境变量设置

// 设置视图引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 中间件
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-very-secret-key-for-billflow', // 生产环境中应使用环境变量
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // 如果使用 HTTPS，应设为 true
}));

// 认证中间件
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.redirect('/login');
}

// 路由
// 登录页
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// 处理登录请求
app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === LOGIN_PASSWORD) {
        req.session.isAuthenticated = true;
        res.redirect('/');
    } else {
        res.render('login', { error: '密码错误，请重试' });
    }
});

// 登出
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// 受保护的根路由
app.get('/', isAuthenticated, async (req, res) => {
    try {
        const data = await dataService.getData();

        // 简单的数据处理逻辑
        const latestElectricity = data.electricity[data.electricity.length - 1] || { reading: 'N/A' };
        const latestColdWater = data.cold_water[data.cold_water.length - 1] || { reading: 'N/A' };
        const latestHotWater = data.hot_water[data.hot_water.length - 1] || { reading: 'N/A' };

        // --- 计算总费用 ---
        const totalCost = calculateTotalCost(data);

        // --- 图表数据处理 ---
        const chartData = {
            labels: [],
            values: []
        };
        
        // --- 按天聚合图表数据 ---
        if (data.electricity.length > 1) { // 至少需要两个读数才能计算用量
            const dailyTotals = {}; // 使用对象来按天聚合用量

            // 假设 data.electricity 已经按时间戳排序
            for (let i = 1; i < data.electricity.length; i++) {
                const currentRecord = data.electricity[i];
                const previousRecord = data.electricity[i-1];
                
                const usage = currentRecord.reading - previousRecord.reading;
                
                if (usage >= 0) {
                    const date = new Date(currentRecord.timestamp).toISOString().split('T')[0];
                    if (!dailyTotals[date]) {
                        dailyTotals[date] = 0;
                    }
                    dailyTotals[date] += usage;
                }
            }

            const sortedDates = Object.keys(dailyTotals).sort();

            sortedDates.forEach(date => {
                const label = new Date(date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
                chartData.labels.push(label);
                chartData.values.push(dailyTotals[date].toFixed(2));
            });
        }

        res.render('index', {
            title: '水电用量-主页',
            latestElectricity,
            latestColdWater,
            latestHotWater,
            totalCost: totalCost.toFixed(2), // 传递总费用
            chartData: JSON.stringify(chartData) // 将图表数据转换为 JSON 字符串传递给前端
        });
    } catch (error) {
        res.status(500).send("无法加载数据");
    }
});

// 显示录入新数据的页面
app.get('/new', isAuthenticated, (req, res) => {
    res.render('new-reading');
});

// 处理新数据的提交
app.post('/new', isAuthenticated, async (req, res) => {
    try {
        const { type, reading, timestamp } = req.body;

        if (!type || !reading || !timestamp) {
            return res.status(400).send("缺少必要的数据");
        }

        const data = await dataService.getData();

        const newEntry = {
            timestamp: timestamp,
            reading: parseFloat(reading)
        };

        if (data[type]) {
            data[type].push(newEntry);
            // 可选：按时间戳排序以保持数据整洁
            data[type].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } else {
            return res.status(400).send("无效的读数类型");
        }

        await dataService.saveData(data);
        res.redirect('/');

    } catch (error) {
        console.error("保存新数据时出错:", error);
        res.status(500).send("保存数据失败");
    }
});

// 显示设置页面
app.get('/settings', isAuthenticated, async (req, res) => {
    try {
        const data = await dataService.getData();
        res.render('settings', {
            prices: data.prices,
            settlement_day: data.settlement_day || 1,
            message: null
        });
    } catch (error) {
        res.status(500).send("无法加载设置");
    }
});

// 处理设置更新
app.post('/settings', isAuthenticated, async (req, res) => {
    try {
        const { electricity_per_unit, cold_water_per_unit, hot_water_per_unit, settlement_day } = req.body;
        const data = await dataService.getData();

        data.prices = {
            electricity_per_unit: parseFloat(electricity_per_unit),
            cold_water_per_unit: parseFloat(cold_water_per_unit),
            hot_water_per_unit: parseFloat(hot_water_per_unit)
        };
        data.settlement_day = parseInt(settlement_day, 10);

        await dataService.saveData(data);

        // 重新渲染页面并显示成功消息
        res.render('settings', {
            prices: data.prices,
            settlement_day: data.settlement_day,
            message: '设置已成功更新！'
        });

    } catch (error) {
        console.error("更新价格时出错:", error);
        res.status(500).send("更新设置失败");
    }
});


// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器已启动，正在监听 http://localhost:${PORT}`);
});