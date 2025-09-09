const fs = require('fs').promises;
const path = require('path');

const dataFilePath = path.join(__dirname, 'data', 'data.json');

/**
 * 异步读取并解析 data.json 文件
 * @returns {Promise<Object>} 返回解析后的数据对象
 */
async function getData() {
    try {
        const rawData = await fs.readFile(dataFilePath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error("读取或解析 data.json 文件时出错:", error);
        // 如果文件不存在或为空，可以返回一个默认的空结构
        return {
            prices: { electricity_per_unit: 0, cold_water_per_unit: 0, hot_water_per_unit: 0 },
            cold_water: [],
            hot_water: [],
            electricity: []
        };
    }
}

/**
 * 异步将数据对象写入 data.json 文件
 * @param {Object} data - 需要保存的 JavaScript 对象
 * @returns {Promise<void>}
 */
async function saveData(data) {
    try {
        const jsonString = JSON.stringify(data, null, 2); // 使用 2 个空格进行格式化，方便阅读
        await fs.writeFile(dataFilePath, jsonString, 'utf8');
    } catch (error) {
        console.error("写入 data.json 文件时出错:", error);
    }
}

module.exports = {
    getData,
    saveData
};