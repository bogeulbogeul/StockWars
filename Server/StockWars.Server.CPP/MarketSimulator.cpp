#define _CRT_SECURE_NO_WARNINGS

#include "MarketSimulator.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <cmath>
#include <algorithm>

namespace StockWarsServer
{
    MarketSimulator::MarketSimulator()
    {
        auto seed = static_cast<unsigned int>(std::chrono::system_clock::now().time_since_epoch().count());
        m_rng.seed(seed);

        InitializeDefaultStocks();
    }

    void MarketSimulator::InitializeDefaultStocks()
    {
        std::lock_guard<std::mutex> lock(m_mutex);

        m_stocks.push_back({ "IT_01", "사이퍼 테크", 50000.0, 50000.0, 0.0, 0.03 });
        m_stocks.push_back({ "IT_02", "네오 네트웍스", 32000.0, 32000.0, 0.0, 0.025 });
        m_stocks.push_back({ "ENT_01", "미드나잇 엔터", 18000.0, 18000.0, 0.0, 0.04 });
        m_stocks.push_back({ "ENT_02", "비트 메이커스", 24000.0, 24000.0, 0.0, 0.035 });
        m_stocks.push_back({ "BIO_01", "바이오 파마", 85000.0, 85000.0, 0.0, 0.05 });
        m_stocks.push_back({ "FIN_01", "노드 파이낸스", 42000.0, 42000.0, 0.0, 0.02 });
        m_stocks.push_back({ "LOG_01", "비트 물류", 15000.0, 15000.0, 0.0, 0.02 });
    }

    void MarketSimulator::UpdateStockPrices()
    {
        std::lock_guard<std::mutex> lock(m_mutex);

        std::uniform_real_distribution<double> dist(-1.0, 1.0);

        for (auto& stock : m_stocks)
        {
            double deltaFactor = dist(m_rng) * stock.volatility;
            double oldPrice = stock.currentPrice;

            double newPrice = oldPrice * (1.0 + deltaFactor);
            newPrice = (std::max)(100.0, std::round(newPrice / 10.0) * 10.0);

            stock.currentPrice = newPrice;
            stock.changeRate = std::round(((newPrice - stock.basePrice) / stock.basePrice) * 10000.0) / 100.0;
        }
    }

    std::string MarketSimulator::GenerateMarketTickJson()
    {
        std::lock_guard<std::mutex> lock(m_mutex);

        std::ostringstream oss;
        oss << std::fixed << std::setprecision(2);

        oss << "{\"Type\":\"MarketTick\",\"Timestamp\":"
            << std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch()).count()
            << ",\"Stocks\":[";

        for (size_t i = 0; i < m_stocks.size(); ++i)
        {
            const auto& s = m_stocks[i];
            oss << "{\"Code\":\"" << s.code
                << "\",\"Name\":\"" << s.name
                << "\",\"BasePrice\":" << s.basePrice
                << ",\"CurrentPrice\":" << s.currentPrice
                << ",\"ChangeRate\":" << s.changeRate << "}";

            if (i + 1 < m_stocks.size())
            {
                oss << ",";
            }
        }

        oss << "]}";
        return oss.str();
    }
}
