/**
 * 根据结算日计算总费用
 * @param {object} data - 包含所有读数和设置的数据对象
 * @returns {number} - 计算出的总费用
 */
function calculateTotalCost(data) {
    const { prices, settlement_day, electricity, cold_water, hot_water } = data;
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 确定上一个结算日的具体日期
    let lastSettlementDate;
    if (currentDay >= settlement_day) {
        // 上个结算日在本月
        lastSettlementDate = new Date(currentYear, currentMonth, settlement_day);
    } else {
        // 上个结算日在上个月
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
        lastSettlementDate = new Date(yearOfLastMonth, lastMonth, settlement_day);
    }

    let totalCost = 0;

    // 针对每种资源计算费用
    const resourceTypes = [
        { name: 'electricity', data: electricity, price: prices.electricity_per_unit },
        { name: 'cold_water', data: cold_water, price: prices.cold_water_per_unit },
        { name: 'hot_water', data: hot_water, price: prices.hot_water_per_unit }
    ];

    resourceTypes.forEach(type => {
        if (type.data.length < 1) return;

        // 筛选出结算周期内的数据
        const recordsInCycle = type.data.filter(record => new Date(record.timestamp) >= lastSettlementDate);

        if (recordsInCycle.length > 0) {
            // 找到周期内的起始读数
            const startReadingRecord = recordsInCycle[0];
            // 找到周期内的结束读数 (即最新读数)
            const endReadingRecord = recordsInCycle[recordsInCycle.length - 1];

            const usage = endReadingRecord.reading - startReadingRecord.reading;
            if (usage > 0) {
                totalCost += usage * type.price;
            }
        }
    });

    return totalCost;
}

module.exports = {
    calculateTotalCost
};